/**
 * Initial-state fixture for src/shared/store/useStore.ts.
 *
 * tests/run.mjs aliases `../lib/demoData.ts` → this file ONLY for the
 * useStore.ts importer (every other importer keeps the real demoData).
 *
 * Why: zustand v5 renders SSR from the store's *frozen initial state*
 * (`getInitialState()`), so `setState` after import is invisible to
 * renderToStaticMarkup. The fixture therefore must be in place at import time.
 *
 * FIXTURE_RESTAURANT mirrors exactly what fetchRestaurants() builds from the
 * API: `name` is a TranslatedString `{en, ar, ku}` — the precise value that
 * crashed React ("Objects are not valid as a React child") when rendered
 * without tx() — plus real created/updated timestamps.
 */
import type { Restaurant } from '../../src/shared/lib/types.ts'

// every other demoData export (PLANS, SUBSCRIPTIONS, createSeedAccounts, …)
// stays the real one; the explicit createSeedRestaurants below wins over the star export
export * from '../../src/shared/lib/demoData.ts'

export const FIXTURE_NAME: { en: string; ar: string; ku: string } = {
  en: 'API Test Rest',
  ar: 'مطعم تجريبي',
  ku: 'تاقی تاقی',
}

export const FIXTURE_RESTAURANT = {
  id: 'rest-1',
  name: FIXTURE_NAME,
  slug: 'api-test-rest',
  status: 'draft',
  templateId: null,
  createdAt: '2026-10-31T09:07:11.977Z',
  updatedAt: '2026-10-31T09:07:11.977Z',
} as unknown as Restaurant

export function createSeedRestaurants(): Restaurant[] {
  return [FIXTURE_RESTAURANT]
}
