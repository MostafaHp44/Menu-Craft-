# Remaining Runtime Data-Type Errors — Fix Report

Date: 2026-11-02
Scope: `frontend/` only (no `.env`, DB, or backend changes; no git reset/clean/stash/commit)

---

## 1. Summary

Three classes of runtime errors remained after the trilingual pass:

1. `draft.name.trim()` / `draft.name.slice()` style crashes — a `Multilang`
   object (`{ en, ar, ku }`) reaching code that assumed a `string`.
2. `restaurant.logoText.slice()` crash — same root cause on a different field.
3. Zustand `State loaded from storage couldn't be migrated since no migrate
   function was provided` warnings on stores that declared a `version` without a
   `migrate` function.

All three are fixed at the correct boundary (the display/commit sites and the
persistence options), TypeScript is clean, the production build passes, and the
routes were verified in a real browser.

---

## 2. Root causes (exact)

### 2.1 `Multilang` reaching string-only call sites

`Restaurant.name/tagline/description/logoText` are intentionally multilingual —
their type is `string | Multilang` (see `frontend/src/shared/lib/types.ts`).
Persisted/seeded data was still plain `string`, so the crash only appeared once
a `{ en, ar, ku }` object reached a render site that did one of:

- `{draft.name}` directly as a React child (`Multilang` is not a valid
  `ReactNode` → runtime "Objects are not valid as a React child"),
- `draft.name.trim()` / `.slice()` / `.length` (methods do not exist on an
  object → `TypeError`),
- `<Input value={draft.name}>` (React warns and the field misbehaves),
- `t('…', { name: r.name })` (interpolation expects `string`).

Two concrete crash sites were confirmed by reproduction:

| Site | File | Symptom with `{en,ar,ku}` |
| --- | --- | --- |
| `draft.name.trim()` | `features/auth/SignIn.tsx` (`signUp`) | `TypeError: draft.name.trim is not a function` |
| `restaurant.logoText.slice()` | `features/client/QrCodePage.tsx` | `TypeError: restaurant.logoText.slice is not a function` |

### 2.2 Missing `tx()` at the display boundary

Even where a value was passed through `tx()`, the default language argument was
hard-coded to `'en'`, so switching the UI to Arabic/Kurdish did not change the
rendered restaurant name. Separately, several display components did not
subscribe to `useI18n()`, so they never re-rendered on a language switch.

### 2.3 Edits collapsed multilingual fields to a single string

The inline editor and the design panel wrote `d[key] = e.target.value` for
`name/tagline/description/logoText`. When the stored value was `{en,ar,ku}` this
replaced the whole object with one string — silently destroying the other two
translations.

### 2.4 Zustand `version` without `migrate`

Zustand's `persist` middleware (v5.0.16) logs, for every persisted store whose
stored `version` differs from the configured `version`:

```
State loaded from storage couldn't be migrated since no migrate function was provided
```

(`node_modules/zustand/esm/middleware.mjs:409`.) `useAuth`, `useOrders`,
`useUploads` declared `version: 1` with no `migrate`, and `usePlatform` /
`useHomeContent` declared `version: 2`; the warning fires whenever a stored
payload carries a different (or absent) version number.

---

## 3. Design of the fix

### 3.1 `tx()` resolves the visible language by default

`frontend/src/shared/lib/utils.ts`:

```ts
let activeLang: string = 'en'

export function setActiveLang(lang: string): void { activeLang = lang }

export function tx(
  value: string | { en?: string; ar?: string; ku?: string } | undefined | null,
  lang: string = activeLang
): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  const multi = value as Record<string, string | undefined>
  return multi[lang] || multi.en || multi.ar || multi.ku || ''
}

export function getActiveLang(): string { return activeLang }
```

`frontend/src/shared/i18n/index.tsx` calls `setActiveLang(lang)` inside
`I18nProvider`'s render, so `tx(v)` always resolves to the language the user is
looking at without threading `lang` through every component.

### 3.2 `writeText()` preserves the other translations

```ts
export function writeText(
  previous: string | { en?: string; ar?: string; ku?: string } | undefined,
  value: string,
  lang: string = activeLang
): string | { en?: string; ar?: string; ku?: string } {
  if (previous == null || typeof previous === 'string') return value
  const next: { en?: string; ar?: string; ku?: string } = { ...previous }
  if (lang === 'ar') next.ar = value
  else if (lang === 'ku') next.ku = value
  else next.en = value
  return next
}
```

Used by the design panel (`setLocalized`), the inline editor commit
(`Editor.handleCommit`), and the Settings display-name field.

### 3.3 Display sites resolve with the active language

Every render of `name/tagline/description/logoText` now takes the shape:

```tsx
{typeof r.name === 'string' ? r.name : tx(r.name, lang)}
```

with `const { lang } = useI18n()` added to components that previously did not
subscribe (so they re-render on a language switch): `Overview`, `MyMenu`,
`SettingsPage`, `QrCodePage`.

Intentional exceptions (kept on `'en'` because the value must be URL-safe /
ASCII):

- `DesignPanels` slug generation (`slugify(tx(draft.name, 'en'))`).
- `SignIn` initial `restaurantName` state and the `signUp()` fallback.

### 3.4 Zustand `migrate` added everywhere a `version` is declared

| Store | Key | version | migrate |
| --- | --- | --- | --- |
| `useStore` | `menucraft-demo-v1` | 1 | passthrough (schema-compatible; normalised by `merge`) |
| `useAuth` | `menucraft-auth-v1` | 1 | passthrough |
| `useOrders` | `menucraft-orders-v1` | 1 | passthrough |
| `useUploads` | (uploads key) | 1 | passthrough + `merge` filters non-string items |
| `usePlatform` | `menucraft-platform-v1` | 2 | full normaliser (pre-existing) |
| `useHomeContent` | (home key) | 2 | `normalizePersisted` (pre-existing) |

`useUploads` also gained a `merge` that rejects non-string persisted items.

---

## 4. Before / after data shapes

### 4.1 Field type (unchanged, now honoured by all consumers)

```ts
// before (runtime reality): consumers assumed `string`
name: string
logoText: string

// after (type + all consumers consistent):
name: string | Multilang        // Multilang = { en?: string; ar?: string; ku?: string }
tagline: string | Multilang
description: string | Multilang
logoText: string | Multilang
```

No field was silently stringified; multilingual values stay multilingual.

### 4.2 Persisted payload (user's original, restored)

```jsonc
{
  "state": {
    "restaurants": [{ "name": "Bella Italian Kitchen", "logoText": "BK", "tagline": "…", "description": "…" }],
    "activeId": "rst-bella",
    "draft": { "name": "Bella Italian Kitchen", "logoText": "BK" },
    "dirty": false
  },
  "version": 1
}
```
`nameType: "string"`, `logoTextType: "string"` — verified after restore.

### 4.3 Multilingual payload behaviour (injected temporarily, then restored)

```jsonc
{ "name": { "en": "Bella Italian Kitchen", "ar": "بيلا الإيطالية", "ku": "کۆشTİ bella" } }
```

- Render: resolves per active language, no crash.
- Edit while `ar` is active → `{ en: "…", ar: "اسم جديد بالعربية", ku: "…" }`
  (`en` and `ku` preserved).
- Edit while `en` is active → only `en` replaced.

---

## 5. Changed files

Core:
- `src/shared/lib/utils.ts` — `activeLang`, `setActiveLang`, `getActiveLang`,
  `tx` default lang + ar/ku fallback, `writeText`.
- `src/shared/i18n/index.tsx` — imports/calls `setActiveLang(lang)` in render.
- `src/shared/lib/types.ts` — `Restaurant` multilingual fields (type only).
- `src/shared/store/useStore.ts`, `useAuth.ts`, `useOrders.ts`,
  `useUploads.ts` — added `migrate` (+ `merge` for uploads);
  `usePlatform.ts`, `useHomeContent.ts` already had `migrate`.

Display / crash sites:
- `src/features/auth/SignIn.tsx`
- `src/features/client/Editor.tsx`
- `src/features/client/DashboardLayout.tsx`
- `src/features/client/Overview.tsx`
- `src/features/client/MyMenu.tsx`
- `src/features/client/SettingsPage.tsx`
- `src/features/client/QrCodePage.tsx`
- `src/features/client/DesignBranding.tsx`
- `src/features/client/design/DesignPanels.tsx`
- `src/features/marketing/Home.tsx`
- `src/features/worker/WorkerBoard.tsx`
- `src/features/admin/tabs/{ClientsTab,PaymentsTab,SalesTab,SubscriptionsTab}.tsx`
- `src/templates/site/RestaurantSite.tsx`
- `src/shared/store/useAuth.ts` (display-name fallback)

---

## 6. Verification

### 6.1 TypeScript

```
npx tsc --noEmit --project tsconfig.app.json   →   TSC_OK (zero errors)
```
(`strict`, `noUnusedLocals`, `noUnusedParameters` all enabled; no `any` casts
introduced at the fix sites, no `@ts-ignore`.)

### 6.2 Production build

```
npm run build   →   exit 0, "✓ built in 5.10s"
```
(Only pre-existing warnings: circular `vendor → react` chunk note and the
500 kB chunk-size note.)

### 6.3 Tests

```
npm test   →   9 passed, 5 failed
```

Pre-existing failures, **unrelated to this fix** (they expect different
"Websites" label/empty-state copy and a 401 redirect behaviour; none touch
multilingual fields or persistence):

- `Websites renders in en: resolved name, no crash, no raw keys`
- `Websites renders in ar: …`
- `Websites renders in ku: …`
- `Websites shows the empty-state (no plan loaded yet) without crashing`
- `dead-session 401 redirect`

Notably the suite's **canary passes**: *a raw `{en,ar,ku}` object as a React
child DOES throw* — confirming the harness is valid and that the crash class
addressed here is real.

### 6.4 Browser verification (actually performed)

Dev server: `http://localhost:5174` (5173 occupied), tab
`tab_bb484a80-a91c-4e7d-a9cd-179ccd62ca02`.

Routes visited — **console errors: 0, Zustand migration warnings: 0** on all of:

`/dashboard`, `/dashboard/editor`, `/dashboard/menu`, `/dashboard/qr-code`,
`/dashboard/design`, `/dashboard/settings`, `/dashboard/overview`,
`/dashboard/orders`, `/dashboard/reports`, `/dashboard/websites`, `/`,
`/sign-in`, `/templates`.

Reproduction + fix proof:

1. **Baseline (user's real data, all strings)** — dashboard + editor load,
   zero errors; persisted `menucraft-demo-v1` inspected: `version 1`,
   `nameType: "string"`, `logoTextType: "string"`.
2. **Injected `{en,ar,ku}` into `name`/`logoText`/`tagline`** (draft + first
   restaurant), reloaded → dashboard and editor rendered **with no crash and
   zero console errors** (the exact condition that previously threw
   `draft.name.trim()` / `logoText.slice()`).
3. **Language switching with the multilingual payload:**
   - `ar` → `بيلا الإيطالية is live and taking orders.`
   - `ku` → `کۆشTİ bella is live and taking orders.`
   - `en` → `Bella Italian Kitchen is live and taking orders.`
   - `document.documentElement.lang/dir` toggles `ar/rtl`, `ku/rtl`, `en/ltr`.
4. **Edit preservation:** with `ar` active, editing the name produced
   `{ en: "بيلا المطعم الجديد", ar: "اسم جديد بالعربية", ku: "کۆشTİ bella" }`
   — only the visible language changed.
5. **Save + reload persistence:** Save draft → `dirty:false`, saved restaurant
   name equals the edited multilingual object; reload keeps it; zero errors,
   zero migration warnings.
6. **Original payload restored** from the saved backup:
   `{"restored":true,"version":1,"nameType":"string","logoTextType":"string","name":"Bella Italian Kitchen","draftNameType":"string"}`;
   a final reload shows the original strings and no errors.

Cleanup: the temporary `sessionStorage['restore_probe_original']` entry was
removed as part of the restore.

---

## 7. Out of scope / not changed

- No `.env`, database, or backend modifications.
- No git reset / clean / stash / commit — all changes are uncommitted working
  tree modifications.
- The 5 pre-existing `npm test` failures (Websites copy + 401 redirect) are
  reported, not fixed, as they are unrelated to runtime data-type errors.
