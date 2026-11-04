# FINAL FIX REPORT — 4 ISSUES (2026-11-03)

WORK: D:\MBN Group\Test Menu
DB: menucraft_docker (localhost:1433, sa, unchanged .env)

---

## FIX 1 — Dashboard Visual Identity (Theme) — COMPLETE
Root cause: No button, no DB table, no persistence, no scope isolation.
Files modified:
- frontend/src/features/client/SettingsPage.tsx (+ DashboardIdentityPanel import + render)
- frontend/src/features/client/DashboardIdentityPanel.tsx (new — color picker UI + live preview)
- frontend/src/shared/lib/dashboardTheme.ts (rewritten — useBackendAuth + load/save + apply CSS vars)
- frontend/src/index.css (+ --dash-* variables + .dash-theme overrides, unlayered)
- backend/src/routes/dashboardTheme.routes.js (rewritten — auth + tenant isolation + defensive 400/403/500)
- backend/src/services/dashboardTheme.service.js (existing — MERGE to DashboardThemes)
- backend/database/create_dashboard_themes.js (new idempotent table creation)
DB change: DashboardThemes created (restaurant_id PK, theme_json, created/updated_at). Additive, reversible (drop table). Tested.
Tests actual:
- Theme GET (empty) 200, POST 200, GET-after-save persisted text/background/border.
- Cross-tenant 403, no-token 401.
- Browser /dashboard/settings shows panel with live preview; no console errors.
- Refresh persistence verified via DB (not mock).
- Restaurant templates untouched (variables scoped under .dash-theme only).

---

## FIX 2 — Super Admin Login + Guard — COMPLETE
Root cause: AdminLogin used prototype-only auth; no backend role gate; /admin unprotected.
Files modified:
- frontend/src/features/admin/AdminLogin.tsx (rewritten — email/password + show-password + loading + error + backend signin first + isPlatformAdmin guard + navigate /admin)
- frontend/src/shared/components/RequireAuth.tsx (rewritten — uses useBackendAuth instead of prototype session only; adminOnly gate preserved)
- frontend/src/App.tsx (BackendSessionBootstrap added — refresh cookies on load)
DB: Uses existing Users (role admin), Restaurants, UserRestaurants. No new super_admin seed — demo `admin@menucraft.demo` exists with role admin; real backend login validates via JWT.
Tests actual:
- Backend signin with admin demo account returns 200 + role admin.
- isPlatformAdmin blocks non-admin prototype accounts.
- /admin accessible after login; /dashboard/branches protected by backend token.

---

## FIX 3 — Client Auth / Session Fix — COMPLETE
Root cause: access_token 15m only, no refresh on /auth/me failure; MarketingHeader only checked prototype session; BranchesPage called /api/branches with prototype restaurantId; Signup didn't use backend.
Files modified:
- frontend/src/shared/store/useBackendAuth.ts (new — signUp/signin/refresh/logout + refresh-token renewal + auth-hint to avoid guest 401 noise)
- frontend/src/features/auth/SignIn.tsx (submitSignUp / submitSignIn now try backend first, fall back to prototype; password + confirm fields present; restaurantName preserved; language state added)
- frontend/src/features/client/MarketingHeader.tsx (+ session = useAuthStore; Dashboard vs Sign In conditional)
- frontend/src/features/client/DashboardLayout.tsx (+ useDashboardTheme(); signOut clears backend session too)
- frontend/src/features/client/BranchesPage.tsx (rewritten — uses backend restaurant_id; no prototype fallback; no-token state shows sign-in prompt; modal add/edit; table with real data; 401/200 only)
- frontend/src/shared/components/RequireAuth.tsx (unified — useBackendAuth session + adminOnly)
Tests actual:
- E2E signup → token → ME 200 OK.
- /api/branches (valid token + real restaurantId) 200 with data array.
- POST branch 200, PUT 200, DB persisted (name_en, address, opening_hours verified).
- /api/sites 200, /api/sites/summary 200, /api/platform/subscriptions/<own> 200.
- Cross-tenant 403, unauthenticated 401.
- After 15m token expiry: refresh tries /auth/refresh automatically (backend cookie); session preserved.
- Refresh page: backend auth refresh runs, session stays, /dashboard/branches loads real data (not redirected to signin).
- Signup creates DB user + restaurant + language column; prototype workspace sync preserves draft.

---

## FIX 4 — Publish / Guest Registration Flow — COMPLETE
Root cause: signup form missing password/confirm, no language selection, no restaurant name validation, backend signup didn't accept language.
Files modified:
- frontend/src/features/auth/SignIn.tsx (language state + pass to backend signup; confirm password check; restaurantName kept; backend-first + prototype-sync)
- backend/src/services/auth.service.js (signup already uses parsed.siteLang || 'ar'; column language exists in Restaurants table — verified)
- backend/src/routes/auth.routes.js (existing — no change needed; handles POST /auth/signup)
DB: Restaurants.language column exists (verified via INFORMATION_SCHEMA). Additive; no migration needed.
Tests actual:
- Signup with language 'ar' succeeds; restaurant created with language = 'ar'.
- Draft/template customization preserved after signup (prototype store sync + backend restaurant_id linked).
- No duplicate restaurant when draft exists (same restaurant_id used in both stores after backend creation).
- No mock credentials; no .env change.

---

## VERIFICATION LOG — 2026-11-03 (post-review)

Point 1 — Theme Customizer: Dashboard theme only (`DashboardIdentityPanel` at `/dashboard/settings`), `DashboardThemes` DB (restaurant_id PK), `.dash-theme` CSS scope. Marketing Navbar (`MarketingHeader`) has NO theme button; restaurant templates (`Templates.tsx`) untouched; admin panel independent. Confirmed.
Point 2 — Refresh Token: `token.js`: `REFRESH_EXPIRES = '7d'`, `ACCESS_EXPIRES = '15m'`. Cookie HttpOnly (`auth.controller.js`). Logout revokes hash + clears cookie. Browser restart: cookie persists, `/auth/me` restores session; `/dashboard/branches` loads `Cairo` without re-login.
Point 3 — Super Admin RBAC: Backend role from DB. `AdminLogin` uses real `useBackendAuth.signin()` + cookie. `isPlatformAdmin()` gates `/admin`. Non-admin (`client`) redirected to `/dashboard`; admin APIs return 403. Real `POST /signin` + `GET /me` verified.
Point 4 — Publish/Language: `language` (`ar/en/ku`) in `SignIn` + `signup()`; DB `Restaurants.language` = YES; `password` + `confirm` present; no duplicate restaurant.

---

## BRANCH UX REQUEST (Arabic user) — Minimal restaurant picker added to BranchesPage
User: after selecting role, wants to pick restaurant/branch; currently only role selectable (`BranchesPage` only shows one restaurant from session).
Fix: Added dropdown at top of `BranchesPage` using `/api/sites` endpoint; selects restaurant; branches reload for selected context; keeps existing `restaurantId` default. No endpoint deleted; no data changed.

## REMAINING BLOCKERS / NOTES
- Grammarly extension error (`Grammarly.js`) unrelated — browser-level, not app.
- `npm run build` succeeds (tsc clean); `npm run dev` runs via user terminal (assistant could not spawn `npm` via Start-Process — documented; user runs manually).
- All 4 fix scenarios verified with real responses (200/401/403) + DB persistence + browser render.
- Report file: backend/docs/FINAL_FIX_REPORT.md updated.
- No data deleted; no tables reset; no mock users added.

---

## REMAINING WORK COMPLETION — 2026-11-03

### Files changed
- `frontend/src/shared/chrome/MarketingThemeCustomizer.tsx` — new, browser-durable (`localStorage`) marketing-only colour customizer with live preview and reset.
- `frontend/src/shared/chrome/MarketingHeader.tsx` — Theme button, enabled only by the marketing Home route.
- `frontend/src/features/marketing/Home.tsx` — opts into the marketing customizer.
- `frontend/src/index.css` — `marketing-theme-active` scoped variable overrides. The class is removed on unmount, so dashboard/admin/template routes do not inherit it.
- `backend/src/routes/platform.routes.js` — explicit `requireSuperAdmin()` prehandler for clients, subscription listing/create/update and platform stats.
- `backend/src/routes/template.routes.js` — explicit `requireSuperAdmin()` prehandler for non-public template administration.
- `frontend/src/features/admin/AdminLogin.tsx`, `frontend/src/features/admin/Admin.tsx`, `frontend/src/App.tsx` — Super Admin login and route now accept only backend role `super_admin`; `admin` is not a Platform Super Admin.
- `frontend/src/features/client/BranchesPage.tsx` — persists authorized restaurant and branch selections locally; restores only a restaurant returned from `/api/sites`; branch selector filters the already backend-authorized branch list.
- `frontend/src/shared/store/useBackendAuth.ts`, `frontend/src/features/auth/SignIn.tsx` — language type/UI consistency fix required by TypeScript build.

### Role and database verification
- Actual `Users` query: independent roles exist: `super_admin` (`super@menucraft.demo`), `admin` (`admin@menucraft.demo`), `client`, and `worker`. No user was created, changed or removed.
- Therefore `admin` is treated as ordinary platform staff, and only existing `super_admin` is admitted to platform-super-admin API guards.
- Database changes: **none**.

### Test results
- `node node_modules/typescript/bin/tsc -b`: passed.
- `npm run build`: passed (Vite production output generated; only existing chunk-size/circular-chunk warnings).
- Static backend verification: role middleware uses strict `super_admin`; routes now use it as Fastify prehandler.
- Attempted live API negative test against currently running `127.0.0.1:3000` using generated client/worker/admin bearer tokens returned **401 invalid token** for every role, meaning that running server instance uses a different JWT secret/process. It did not produce a valid RBAC test and is not counted as a 403 success.

### Not complete / reason
- A real 403 test for client, worker and ordinary admin must be repeated against the restarted backend process that loaded this source and its active JWT secret. No credentials or `.env` values were inspected or changed to force that test.
- The branch selector is a selection/filter context. Staff-to-branch assignment in `TeamPage` still uses the legacy prototype store; it must be migrated to existing `Employees` + `EmployeeBranchAccess` APIs before claiming persistent staff branch assignment. It was intentionally not faked or wired around `BranchAccessResolver`.

---

## FINAL CLOSURE VERIFICATION — 2026-11-03

### Implemented in this pass
- Marketing Theme is enabled in every current marketing route that mounts `MarketingHeader`: Home, Templates and Template Preview. The controller is mounted only by those routes, writes `digital-menu.marketing-theme.v1`, previews immediately, and removes its scoped CSS state when the header unmounts. Restaurant-site styles use `.rs` and are not targeted by the marketing selectors.
- Employee management is now backend-first: `TeamPage` reads `/api/employees` and authorized `/api/branches`, posts/puts/deactivates through the employee API, and no longer uses the legacy account store as its source of truth.
- `employee.service.js` validates role/access type, validates every assigned branch belongs to the current restaurant and is active, then persists Employee + EmployeeBranchAccess in one SQL transaction. A failed branch assignment rolls back employee creation/update.
- `BranchAccessResolver` was corrected to use the actual DB relation key `EmployeeBranchAccess.restaurant_employee_id` (not the nonexistent `employee_id`) and to require `allowed=1`.
- Super Admin-sensitive platform and template route groups have explicit backend `requireSuperAdmin()` prehandlers. Admin/client/worker are not accepted as super-admin roles.

### Files changed
- `frontend/src/shared/chrome/MarketingThemeCustomizer.tsx`
- `frontend/src/shared/chrome/MarketingHeader.tsx`
- `frontend/src/features/marketing/Home.tsx`
- `frontend/src/features/marketing/Templates.tsx`
- `frontend/src/features/marketing/TemplatePreview.tsx`
- `frontend/src/index.css`
- `frontend/src/features/client/TeamPage.tsx`
- `frontend/src/features/client/BranchesPage.tsx`
- `frontend/src/features/admin/AdminLogin.tsx`, `frontend/src/features/admin/Admin.tsx`, `frontend/src/App.tsx`
- `frontend/src/shared/store/useBackendAuth.ts`, `frontend/src/features/auth/SignIn.tsx`
- `backend/src/services/employee.service.js`, `backend/src/routes/employee.routes.js`, `backend/src/services/branchAccess.service.js`
- `backend/src/routes/platform.routes.js`, `backend/src/routes/template.routes.js`

### Database changes
- None. Actual schema inspected: `Employees` includes `branch_access_type`; `EmployeeBranchAccess` uses `restaurant_employee_id`, `branch_id`, `allowed`. No records were inserted, changed or removed for testing.

### Actual test results
- `node -c src/services/employee.service.js`, `node -c src/routes/employee.routes.js`, and `node -c src/routes/platform.routes.js`: exit code 0.
- `npm run build`: exit code 0 (TypeScript + Vite); only pre-existing chunk/circular-chunk warnings.
- Live RBAC and write tests are **not marked passed**: the server reachable on `127.0.0.1:3000` rejected locally-generated tokens with HTTP 401, proving it is not using this process's JWT configuration. It must be restarted from this backend source with its existing environment before real super_admin/admin/client/worker 200/403/401 evidence can be recorded.

### Not complete
- Super Admin UI tabs still contain legacy demo-oriented presentation/data paths and were not fully converted to live APIs in this pass. They must be individually migrated before claiming the dashboard contains no mock data.
- Real employee create/edit/deactivate persistence and cross-restaurant tests are pending the correctly-running backend process. They were not run against DB to avoid adding test employees to user data.

---

## FINAL PRODUCTION VERIFICATION — 2026-11-03

### Correct backend process and authentication evidence
- Root cause of earlier invalid-token result: `src/app.js` starts Fastify itself, while `src/server.js` also tries to register/listen; running `server.js` starts then fails with `AVV_ERR_ROOT_PLG_BOOTED`. The correctly-running source process was started directly as `PORT=3001 node src/app.js`, without changing `.env` or JWT secrets.
- Live API requests to that process used access tokens signed by its current runtime configuration. Results:
  - `GET /api/platform/stats`, `/api/platform/clients`, `/api/platform/templates/all`: `super_admin` = **200**.
  - Same three API groups: `admin` = **403**, `client` = **403**, `worker` = **403**.
  - `GET /api/platform/stats` without credentials = **401**.
- Source protection: `requireSuperAdmin()` in `platform.routes.js` and `template.routes.js`; `AdminLogin.tsx` calls backend `/api/auth/signin`, rejects every returned role except `super_admin`, and removes its cookie session when rejected. No frontend credentials exist.

### Team & Staff API live validation
- Sources: SQL `Employees`, `EmployeeBranchAccess`, `Branches`; APIs `/api/employees` and `/api/branches`.
- Real tenant negative tests (no data written):
  - `POST /api/employees` with empty name/assigned empty branches = **400** (`name required`).
  - `POST /api/employees` with another `restaurantId` = **403** (`cross restaurant denied`).
- Persistence logic: Employee insertion/update plus every `EmployeeBranchAccess` row run in a single SQL transaction; invalid assigned branch triggers rollback. Deactivation is `UPDATE is_active=0`, never deletion.
- A positive create/edit/deactivate test was deliberately not run because the currently selected client tenant had no Branches row and the safety rules prohibit adding arbitrary test business data. No test employee was left behind.

### Super Admin real-data status
- Super Admin API RBAC is live verified above; the existing API responses are sourced from SQL services/controllers.
- **Not complete:** legacy Admin presentation tabs (`ClientsTab`, `SalesTab`, `PaymentsTab`, `TeamTab`, shared `parts.tsx`) still contain demo/prototype imports or labels. They have not been represented as production-complete real-data tabs. This is explicitly not claimed complete; those tabs need a dedicated conversion to `platform`/payments/audit API contracts before removing all demo presentation.

### Build / modified files
- `npm run build`: **exit 0** (TypeScript and Vite). Warnings were only bundle-size/circular-chunk warnings.
- This pass modified backend employee atomic persistence/access resolution and platform RBAC route guards, marketing-theme components, backend-auth admin login guards, and TeamPage as listed in the preceding closure section.
- Database changes: **none**; no data/user/table was removed or recreated.

---

## FINAL TWO TASKS VERIFICATION — 2026-11-03

### Super Admin real-data implementation
- Added super-admin-only endpoints in `backend/src/routes/platformAdminData.routes.js`:
  - `GET /api/platform/admin/clients` → `Restaurants`, `Users`, `Subscriptions`.
  - `GET /api/platform/admin/users` → `Users`.
  - `GET /api/platform/admin/sales` → aggregate of actual `Orders` only.
  - `GET /api/platform/admin/payments` → actual `Payments` rows only.
  - `GET /api/platform/admin/templates` → actual `Templates` rows only.
  - `GET /api/platform/admin/stats` → SQL counts and actual `Orders.total` aggregate.
- Every endpoint has `[fastify.authMiddleware, requireSuperAdmin()]` and has no demo fallback.
- Converted `ClientsTab`, `SalesTab`, `PaymentsTab`, `TeamTab` to fetch those APIs with loading, error and zero/empty states. Removed their use of prototype stores/demo sales series. `parts.tsx` no longer imports `demoData` for plan badges.
- Live API verification against current source process: users = **200**, sales = **200** with `[]`, payments = **200** with DB records, templates = **200** with `[]`, stats = **200** with real counts. Initial clients request returned **500** because `Restaurants.name` does not exist; corrected query to `Restaurants.name_en AS name` in source. It requires source-process restart before the corrected live response can be recorded.

### Team & Staff E2E result — NOT PASSED
- Selected an actual client/restaurant/branch relationship from DB and called `POST /api/employees` using the real runtime client token.
- The attempted creation correctly rolled back with **500**, no employee remained, because the physical foreign key `EmployeeBranchAccess.restaurant_employee_id` references **`RestaurantEmployees.id`**, while the current Employee endpoint inserts into **`Employees.id`**. SQL evidence: `FK_EBA_Employee` conflict against `dbo.RestaurantEmployees`.
- This exposes a pre-existing schema-model mismatch: `Employees` stores profile fields; `RestaurantEmployees` is the authorization identity required by `EmployeeBranchAccess` and has mandatory `user_id` and `role_id`. A correct fix requires a safe employee invitation/account flow (or an explicitly approved additive mapping), not an unsafe FK bypass or fake user.
- The transaction behaved safely: the failed assignment did not leave a partial `Employees` record. No fixture, employee, branch, user, or client data was retained or deleted.
- Negative tests previously recorded remain: invalid employee payload **400**; cross-restaurant employee request **403**.

### Build
- `npm run build` after the tab conversion: **exit 0**.

### Remaining explicit work
- Resolve the `Employees` / `RestaurantEmployees` identity model with an approved real employee-account/invitation design, then rerun create/read/refresh/edit/deactivate and assignment E2E. This cannot honestly be marked complete while the FK requires an authorization identity that the current form/API does not create.
- Restart the source backend and re-run `/api/platform/admin/clients` to capture the corrected query's live HTTP 200 result.
