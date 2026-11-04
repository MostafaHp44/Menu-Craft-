# Demo Data Dependency Audit — Real Project (`D:\MBN Group\Test Menu`)

## 1. All remaining imports (after demo removal)

File (`path relative to frontend/src`): export used.

- `features/admin/parts.tsx`: `SUBSCRIPTIONS` (line 11) → `Badge` tone lookup.
- `features/admin/tabs/SalesTab.tsx`: `createSalesSeries` (line 8) → chart data.
- `features/client/billing/PricingBubble.tsx`: `PLANS` (line 6) → pricing cards.
- `features/client/billing/SubscribeModal.tsx`: `PLANS` (line 5) → plan selection.
- `features/marketing/Home.tsx`: `PLANS` (line 10) → landing pricing.
- `shared/lib/hooks.ts`: `createSalesSeries` (line 4) → hook used elsewhere.
- `shared/store/usePlatform.ts`: `PLANS`, `PLATFORM_PROVIDERS`, `createSeedPayments`, `createSeedSubscriptions` (line 15) → platform state initial.
- `shared/store/useStore.ts`: `createRestaurantFromTemplate`, `ACTIVE_RESTAURANT_ID` (line 5) → restaurant creation/template selection (real helper, not restaurant seed).

**Previously removed (verified missing / no errors):**
- `Overview.tsx`: `RECENT_ACTIVITY` import removed (line 4 deleted); empty state added.
- `Websites.tsx`: no `demoData` import; uses real `sitesAPI`.
- `useAuth.ts`: `createSeedAccounts` import deleted; `accounts: []`.
- `demoData.ts`: `createSeedRestaurants`, `createSeedOrders`, `createSeedAccounts`, `createSeedSubscriptions`, `createSeedPayments`, `MONTHLY_SIGNUPS`, `PLATFORM_KPIS`, `PLAN_SPLIT`, `ADMIN_ROWS`, `PLATFORM_ACTIVITY`, `RECENT_ACTIVITY` deleted. Only stubs kept: `PLANS`, `SUBSCRIPTIONS`, `PLATFORM_PROVIDERS`, `createSeedPayments`, `createSeedSubscriptions`, `createSalesSeries`, `createRestaurantFromTemplate`, `ACTIVE_RESTAURANT_ID`, `REMOVE_DEMO`.

## 2. Classification per export

| Export | Type | Real API endpoint? | Safe to keep stub? | Fix applied |
|---|---|---|---|---|
| `PLANS` | Product/pricing config | `planAPI.getAll()` (`/api/platform/plans`) | Yes — stub array keeps billing pages alive without restaurant demo data | Stub preserved |
| `SUBSCRIPTIONS` | Product config | `platformAPI.getSubscriptions()` / backend | Yes — stub record keeps badge logic alive | Stub preserved |
| `PLATFORM_PROVIDERS` | Product config | `platformAPI` / backend | Yes — stub provider list | Stub preserved |
| `createSalesSeries` | Analytics helper (demo numbers) | No direct endpoint; real stats come from restaurant `stats` or orders | Not safe to delete fully because `SalesTab` uses it; kept as empty-return stub | Stub preserved |
| `createSeedPayments` / `createSeedSubscriptions` | Platform seed helpers | Platform backend APIs exist (`platform.routes.js`) | Kept as empty stubs (`return {}` / `[]`) — does not inject fake data into UI directly; `usePlatform` uses them as fallbacks only when API fails | Stubs preserved |
| `createRestaurantFromTemplate` | Template builder (real feature) | None needed — uses `getTemplate()` (real template data) | Required — kept with minimal implementation | Restored |
| `ACTIVE_RESTAURANT_ID` | Constant (`''`) | Not data | Safe — kept as empty string | Restored |

## 3. Real backend endpoints (verified)

- Auth: `/api/auth/login`, `/api/auth/me`, `/api/auth/refresh`, `/api/auth/logout`
- Sites (owner): `/api/sites`, `/api/sites/summary`, `/api/sites/can-create`
- Restaurants: `/api/restaurants`
- Menu (public): `/api/public/menu/:slug`
- Platform: `/api/platform/plans`, `/api/platform/subscriptions`, etc. (`planAPI`, `platformAPI` in `api.service.ts`)
- Public restaurant: `/sites/public/:slug` (new endpoint added to `sites.routes.js`)

No endpoint serves `RECENT_ACTIVITY` or `createSalesSeries` directly — these are UI-level helpers.

## 4. Pages inspected in browser / console verification

- `/dashboard/websites` (English): renders with real site list (0 restaurant because demo seed removed — shows empty state / "Create your first website"). No crash. No 401.
- `/dashboard/websites` (Arabic / Kurdish): language switch works; no mojibake; no missing-export errors.
- `/site/bella`: public endpoint responds (`404` for unpublished or missing slug; endpoint exists).
- `/dashboard/` (Overview): no `SyntaxError` after import removal; shows "No recent activity yet." instead of fake feed.

## 5. Changes made (only safe fixes, no demo restoration)

- `frontend/src/features/client/Overview.tsx`: removed `RECENT_ACTIVITY` import; replaced fake feed with empty-state card (`No recent activity yet.`).
- `frontend/src/shared/lib/demoData.ts`: restored only production-config stubs (`PLANS`, `SUBSCRIPTIONS`, `PLATFORM_PROVIDERS`, `createSalesSeries`, `createSeedPayments`, `createSeedSubscriptions`, `createRestaurantFromTemplate`, `ACTIVE_RESTAURANT_ID`). No restaurant/account/order seeds restored.
- `backend/src/routes/sites.routes.js`: added `GET /sites/public/:slug` (public read endpoint, no auth, filters `status = 'published'`).
- `docs/DEMO_DATA_DEPENDENCY_AUDIT.md`: created (this file).

## 6. Build / test / verification results

- `npm test`: 14 passed / 0 failed (regression suite — includes mutation test for `{en,ar,ku}` crash).
- `npx vite build`: passes (3.01s).
- `npx tsc -b`: 77 errors (down from 102 baseline; 0 new errors in modified files; `Websites.tsx` errors = 0).
- Browser console (`/dashboard/websites`): 0 errors, 0 `SyntaxError`, 0 401.
- Browser (`/site/bella` with public endpoint): responds correctly (404 for unpublished, endpoint present).
- No missing `demoData` exports remain (`Overview.tsx`, `useStore.ts`, `useAuth.ts`, `usePlatform.ts`, `PricingBubble.tsx`, `SubscribeModal.tsx`, `Home.tsx`, `SalesTab.tsx`, `parts.tsx`, `hooks.ts` all verified).

## 7. Limitations (not blocked — noted for Phase 5+)

- `Overview.tsx` shows "No recent activity yet." — needs real activity endpoint (not implemented; no backend endpoint exists).
- `SalesTab.tsx` (`createSalesSeries`) shows empty chart data — needs real analytics endpoint.
- `PricingBubble.tsx` / `SubscribeModal.tsx` / `Home.tsx` use stub `PLANS` — needs real `/api/platform/plans` data rendered properly (stub array prevents crash but shows minimal info).
- Editor/menu persistence fully wired to APIs is out of Phase 4 scope (documented in `docs/PHASE_4_FINAL_REPORT.md`).

---
*STOP after this audit. No new phase started. All fixes are minimal and safe — no demo data restored, no unrelated refactoring.*
