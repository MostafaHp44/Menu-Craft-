/**
 * Regression suite for the /dashboard/websites crash + zombie-session 401s.
 *
 * Guards:
 *  1. The React crash "Objects are not valid as a React child (found: object
 *     with keys {en, ar, ku})" — a canary proves this harness detects it, then
 *     <Websites/> must render cleanly in en/ar/ku against a multilingual
 *     store restaurant (the exact shape fetchRestaurants() produces).
 *  2. Raw i18n keys, "[object Object]", "Invalid Date" and "null remaining"
 *     must never appear in the rendered page.
 *  3. Expired-session handling: a 401 must refresh, must clear the session only
 *     when the backend really rejects it, and must survive transient failures.
 *
 * Runs headless via react-dom/server (the exact code path where the crash
 * happened). Browser globals are stubbed before app modules are imported.
 *
 * NOTE on zustand v5: SSR renders each store's FROZEN initial state
 * (getInitialState), so state visible to renderToStaticMarkup must be seeded
 * at import time — the session via localStorage, the restaurant via the
 * demoData alias in tests/run.mjs (tests/fixtures/useStoreSeed.ts).
 */
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'

/* ----------------------------- tiny harness ------------------------------ */
const tests: Array<[string, () => void | Promise<void>]> = []
function test(name: string, fn: () => void | Promise<void>) {
  tests.push([name, fn])
}
function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg)
}

/* --------------------- stub browser globals (pre-import) ----------------- */
const storage = new Map<string, string>()
;(globalThis as any).localStorage = {
  getItem: (k: string) => (storage.has(k) ? storage.get(k)! : null),
  setItem: (k: string, v: string) => void storage.set(k, String(v)),
  removeItem: (k: string) => void storage.delete(k),
  clear: () => storage.clear(),
}
// session must exist in the auth store's INITIAL state (SSR ignores setState)
const SEED_SESSION = {
  id: 'u-1',
  name: 'Test User',
  email: 'test@test.local',
  role: 'client',
  restaurantId: 'rest-1',
  status: 'active',
}
storage.set('menucraft_auth', JSON.stringify({ session: SEED_SESSION }))

// Render tests never fetch (effects do not run during renderToStaticMarkup);
// auth scenarios install their own handler via mockFetch().
;(globalThis as any).fetch = async () => {
  throw new Error('unexpected fetch call in this test')
}

/* ------------------------- import app modules ---------------------------- */
const { I18nProvider } = await import('../src/shared/i18n/index.tsx')
const { useAuthStore } = await import('../src/shared/store/useAuth.ts')
const { useStore } = await import('../src/shared/store/useStore.ts')
const websitesMod = await import('../src/features/client/Websites.tsx')
const Websites = websitesMod.default
const planUiFromSummary = websitesMod.planUiFromSummary
const api = await import('../src/shared/lib/api.service.ts')
const { FIXTURE_NAME, FIXTURE_RESTAURANT } = await import('./fixtures/useStoreSeed.ts')

/* ------------------------------- fixtures -------------------------------- */
function renderWebsites(lang: 'en' | 'ar' | 'ku'): string {
  storage.set('menucraft-lang', lang)
  return renderToStaticMarkup(
    <MemoryRouter>
      <I18nProvider>
        <Websites />
      </I18nProvider>
    </MemoryRouter>
  )
}

/* ============================= 1. canary ================================= */
test('canary: a raw {en,ar,ku} object as a React child DOES throw (harness validity)', () => {
  let msg = ''
  try {
    renderToStaticMarkup(<div>{FIXTURE_NAME as any}</div>)
  } catch (e) {
    msg = String((e as Error).message)
  }
  assert(
    /Objects are not valid as a React child/.test(msg),
    `expected the exact React crash, got: ${msg || '(no throw — harness cannot detect the bug)'}`
  )
})

/* ================ 2. Websites page renders in en / ar / ku ================ */
const LANG_CASES = [
  { lang: 'en' as const, name: FIXTURE_NAME.en, mustHave: ['Template', 'Draft', 'Manage', 'Preview', 'Edit Menu', 'Created ', 'Updated '] },
  { lang: 'ar' as const, name: FIXTURE_NAME.ar, mustHave: ['القالب', 'مسودة', 'تم الإنشاء'] },
  { lang: 'ku' as const, name: FIXTURE_NAME.ku, mustHave: ['قاڵب', 'ڕەشنووس', 'دروستکرا'] },
]
const BAD_FRAGMENTS = [
  'websitesUi.',
  'common.created',
  'billing.statusDraft',
  'design.template',
  'dashboardNav.',
  '>manage<',
  '>preview<',
  '>editMenu<',
  '[object Object]',
  'Invalid Date',
  'null remaining',
]

for (const { lang, name, mustHave } of LANG_CASES) {
  test(`Websites renders in ${lang}: resolved name, no crash, no raw keys`, () => {
    const html = renderWebsites(lang)
    // the multilingual name resolves to the active language (tx() guard)
    assert(
      html.includes(name),
      `expected resolved site name "${name}" in ${lang} HTML; got: ${html.slice(0, 600)}`
    )
    // localized card labels are present
    for (const label of mustHave) {
      assert(html.includes(label), `expected localized label "${label}" in ${lang} HTML`)
    }
    // created/updated dates are real (no "Invalid Date")
    const expectedDate = new Date(FIXTURE_RESTAURANT.updatedAt!).toLocaleDateString()
    assert(html.includes(expectedDate), `expected formatted date ${expectedDate} in ${lang} HTML`)
    // and none of the known-bad fragments ever render
    for (const bad of BAD_FRAGMENTS) {
      assert(!html.includes(bad), `found bad fragment "${bad}" in ${lang} HTML`)
    }
  })
}

test('fmtDate: missing/corrupt dates render an em-dash, never "Invalid Date"', () => {
  const { fmtDate } = websitesMod
  assert(fmtDate(undefined) === '—', 'missing date must render the em-dash placeholder')
  assert(fmtDate('') === '—', 'empty date must render the em-dash placeholder')
  assert(fmtDate('not-a-date') === '—', 'corrupt date must render the em-dash placeholder')
  const expected = new Date(FIXTURE_RESTAURANT.updatedAt!).toLocaleDateString()
  assert(fmtDate(FIXTURE_RESTAURANT.updatedAt) === expected, 'valid dates format normally')
})

test('Websites shows the empty-state (no plan loaded yet) without crashing', () => {
  const html = renderWebsites('en')
  // maxSites is null until /api/sites/summary resolves (effects do not run in
  // SSR), so the empty state renders below the cards
  assert(html.includes('Create your first website'), 'expected the empty-state title')
  assert(!html.includes('[object Object]'), 'no crash artefacts for the empty state')
})

/* ================ 3. plan/usage state ("null remaining" bug) ============== */
test('plan UI: trial account at its 1/1 limit → overLimit, remaining null (never "null")', () => {
  const ui = planUiFromSummary({ used: 1, maxSites: 1, plan: { id: 'trial' } }, 1)
  assert(ui.overLimit === true, 'overLimit must be true at the limit')
  assert(ui.remaining === null, 'remaining must be null at the limit (rendered as noSlotsRemaining text)')
  assert(ui.maxSites === 1, 'maxSites must stay 1')
})

test('plan UI: slots below the limit stay numeric', () => {
  const ui = planUiFromSummary({ used: 1, maxSites: 3, plan: { id: 'professional' } }, 1)
  assert(ui.remaining === 2 && ui.overLimit === false, 'expected 2 remaining, not over limit')
})

test('plan UI: unlimited plans map to Infinity / "unlimited"', () => {
  const ui = planUiFromSummary({ unlimited: true, used: 5, maxSites: null }, 5)
  assert(ui.maxSites === Infinity && ui.remaining === 'unlimited' && ui.overLimit === false, 'unlimited mapping broken')
})

test('plan UI: API fallback keeps the legacy business/professional/trial logic', () => {
  assert(planUiFromSummary(null, 2, 'business').remaining === 'unlimited', 'business fallback must be unlimited')
  const pro = planUiFromSummary(null, 1, 'professional')
  assert(pro.maxSites === 3 && pro.remaining === 2, 'professional fallback must allow 3 sites')
  const free = planUiFromSummary(null, 1, undefined)
  assert(free.maxSites === 1 && free.overLimit === true && free.remaining === null, 'free fallback is 1 site')
})

/* =================== 4. zombie-session 401 handling ======================= */
type MockRoute = { status: number; body?: unknown }
function mockFetch(routes: Record<string, MockRoute | ((n: number) => MockRoute)>, calls: string[]) {
  const counters: Record<string, number> = {}
  ;(globalThis as any).fetch = async (url: string, init: any = {}) => {
    const path = String(url).replace('http://localhost:3000', '')
    calls.push(`${init.method || 'GET'} ${path}`)
    const route = routes[path]
    if (!route) throw new Error(`unmocked fetch: ${path}`)
    const hit = typeof route === 'function' ? route(counters[path] = (counters[path] ?? 0) + 1) : route
    const body = hit.body ?? {}
    const text = JSON.stringify(body)
    return {
      ok: hit.status >= 200 && hit.status < 300,
      status: hit.status,
      json: async () => body,
      text: async () => text,
    }
  }
}
/** auth scenarios work on LIVE state (getState/setState), unlike SSR hooks */
function seedLiveSession() {
  useAuthStore.setState({ session: SEED_SESSION as any })
}

test('dead session: 401 + refresh rejected + /me 401 → session cleared (redirects to signin)', async () => {
  seedLiveSession()
  const calls: string[] = []
  mockFetch({
    '/api/restaurants': { status: 401 },
    '/api/auth/refresh': { status: 401 },
    '/api/auth/me': { status: 401 },
  }, calls)

  let threw = ''
  try { await api.restaurantAPI.getAll() } catch (e) { threw = String((e as Error).message) }
  assert(threw === 'Unauthorized', 'request must reject with Unauthorized')
  assert(useAuthStore.getState().session === null, 'a truly-dead session must be cleared so RequireAuth redirects')
  assert(calls.filter((c) => c.includes('/api/auth/refresh')).length === 1, 'refresh must be attempted exactly once')
  assert(calls.includes('GET /api/auth/me'), 'death must be confirmed via /api/auth/me before clearing')
})

test('cross-tab rotation: refresh rejected but /me 200 → request retried, session kept', async () => {
  seedLiveSession()
  const calls: string[] = []
  mockFetch({
    // first call 401 (stale access token), retry after refresh-attempt succeeds
    '/api/restaurants': (n) => (n === 1 ? { status: 401 } : { status: 200, body: { ok: true, data: [] } }),
    '/api/auth/refresh': { status: 401 },
    '/api/auth/me': { status: 200, body: { ok: true, data: {} } },
  }, calls)

  const res = await api.restaurantAPI.getAll()
  assert(res.ok === true, 'the retried request must succeed')
  assert(useAuthStore.getState().session !== null, 'session must survive a cross-tab token rotation')
})

test('transient refresh failure (429): session must NOT be cleared', async () => {
  seedLiveSession()
  const calls: string[] = []
  mockFetch({
    '/api/restaurants': { status: 401 },
    '/api/auth/refresh': { status: 429 },
  }, calls)

  let threw = ''
  try { await api.restaurantAPI.getAll() } catch (e) { threw = String((e as Error).message) }
  assert(threw === 'Unauthorized', 'request still rejects while refresh is unavailable')
  assert(useAuthStore.getState().session !== null, 'rate-limiting is transient — the session must be kept')
  assert(!calls.some((c) => c.includes('/api/auth/me')), 'death probe must not run on transient failures')
})

test('signin 401 (wrong password): no refresh, no session wipe', async () => {
  seedLiveSession()
  const calls: string[] = []
  mockFetch({
    '/api/auth/signin': { status: 401, body: { ok: false, error: 'bad credentials' } },
  }, calls)

  let threw = ''
  try { await api.authAPI.signin({ email: 'a@b.c', password: 'x' }) } catch (e) { threw = String((e as Error).message) }
  assert(threw !== '', 'bad credentials must reject')
  assert(!calls.some((c) => c.includes('/api/auth/refresh')), 'auth-path 401s must never trigger refresh')
  assert(useAuthStore.getState().session !== null, 'a failed sign-in must not touch an existing session')
})

/* ------------------------------- run all --------------------------------- */
let passed = 0
let failed = 0
for (const [name, fn] of tests) {
  try {
    await fn()
    console.log(`PASS  ${name}`)
    passed++
  } catch (e) {
    console.error(`FAIL  ${name}\n      ${(e as Error).message}`)
    failed++
  }
}
console.log(`\n${passed} passed, ${failed} failed (${tests.length} total)`)
if (failed > 0) process.exit(1)
