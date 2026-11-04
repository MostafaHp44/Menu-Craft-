# PROJECT BASELINE REPORT — Phase 0 (Read-Only)

Date: 2026-11-03
Scope: `D:\MBN Group\Test Menu` — inspection only. No files were modified (except this report), no dependencies installed, no DB connections, no migrations. `.env` files were never opened; only their file names and key *names* (previously documented) are referenced.

Method: directory listings, `package.json` files, source configs, HTTP probes (`GET /health` only), and `git status` (read-only). No feature is marked "complete" merely because a file exists — every claim below has file/endpoint evidence or an executed command as evidence.

---

## 1. Verified Project Architecture

Monorepo with **one working frontend** and **one working backend**, plus an **archived legacy tree**:

| Element | Path | Status | Evidence |
| --- | --- | --- | --- |
| Frontend | `frontend/` | Active, tracked (modified) + untracked new files | `frontend/package.json`; git status |
| Backend (JS, **live**) | `backend/` | Active — **not tracked in git** (untracked dir) | git status untracked; `GET /health` → `{"status":"ok","service":"menucraft-backend"}` |
| Legacy TS backend + phase reports | `NEON_PIXEL_REPORTS/` | **Archived — not running, no `node_modules`, never in scope for this project** (only `menucraft_tests_docker_2b1` may be touched if ever needed; target DB `menucraft_docker` is off-limits) | `NEON_PIXEL_REPORTS\backend\package.json` (no `node_modules`); `INTEGRATION_NEON_PIXEL_TO_MAIN_REPORT.md` |
| Root docs/tests | `README.md`, `INTEGRATION_NEON_PIXEL_TO_MAIN_REPORT.md`, `test_signup.js`, `test-signup.bat` | Present | root listing |

**No `client/` or `server/` directories exist.** This was verified — do not assume those names.

---

## 2. Frontend (Actual Facts)

Path: `frontend/`

**Stack (from `frontend/package.json` lines 1–29):**
- React **19.1**, TypeScript **5.8.3**, Vite **6.3.5**, Tailwind CSS **4.1.8** (via `@tailwindcss/vite`), react-router-dom **7.6**, zustand **5.0.5**, framer-motion **14.7**, qrcode.react **4.2**. `"type": "module"`.

**Scripts:** `dev` (vite), `build` (`tsc -b && vite build`), `preview`, `test` (`node tests/run.mjs`). ✅ `frontend/node_modules` exists — all scripts runnable.

**Source layout:** `frontend/src/{features,shared,templates}` + `App.tsx`, `main.tsx`, `index.css`. Evidence: directory listing of `frontend/src` (features, shared, templates, App.tsx, index.css, main.tsx, vite-env.d.ts, `_i18n_probe.tsx`).

**Entry point:** `main.tsx` → `App.tsx` (all routes declared there, lines 1–184). Vite dev server: `vite.config.ts` port 5173 (5173 was in use earlier this session; dev fell back to **5174**).

**🚨 Config mismatch (verified):** `vite.config.ts` proxies `/api` → `http://localhost:4000`, but **nothing listens on 4000** (probe: `NOT RUNNING`). The real API runs on **3000** (`frontend/.env` key `VITE_API_URL=http://localhost:3000`; backend listens on `process.env.PORT || 3000` per `backend/src/server.js:5`). Any code path using *relative* `/api/...` URLs through the dev proxy is currently **dead on arrival**.

**Backend (Actual Facts)**

Path: `backend/`

**Stack (from `backend/package.json` lines 1–25):** Node/CommonJS, **Fastify ^4.28.1**, **`mssql` ^11.0.1 driver with hand-written parameterized SQL — NO ORM**, zod validation, jsonwebtoken + bcryptjs (HttpOnly cookie auth), Stripe SDK, ioredis (optional cache/rate-limit), pino logging.

**Entry point & start commands:** `backend/src/server.js` (loading via dotenv) → `backend/src/app.js` (Fastify factory + route registration, lines ~110–132 register all route modules; `GET /health` at app.js:134). Scripts: `dev`/`start` (both `node src/server.js`), `migrate` (`node database/migrate.js`). ✅ `backend/node_modules` exists. **Currently running** on port 3000 (health probe returned 200, 2026-11-03).

**Database / query tech (config only — never connected):** MS SQL Server via `mssql` driver, connection built from env keys `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (`backend/src/config/db.js`). Migrations are ad-hoc idempotent scripts: `database/init.sql` (initial 12 tables + seed), `database/migrate.js` (`npm run migrate`), `database/phase2-migrate.js` (`free_plan_requests`, `paid_subscription_requests`). ⚠️ No versioned migration runner exists. **⚠️ Database access itself is prohibited without explicit approval per task rules** (`menucraft_docker` must not be touched; the `phase2` tables were previously observed as absent from the live DB — those endpoints 500 until approved migration).

**Route inventory (`backend/src/routes/`, 15 files):** `auth`, `health`, `translate`, `order`, `restaurant`, `sites`, `menu`, `home-content`, `plan`, `payment`, `template`, `platform`, `freePlanRequest`, `paidSubscriptionRequest`. Response envelope `{ok, data|error}`. Auth = two HttpOnly JWT cookies (15-min access, 7-day single-use refresh, Redis-revoked), payload `{userId, email, role, restaurantId}` (`backend/src/utils/token.js`, `auth.middleware.js`). Roles in `Users.role` (free text): observed values `client`, `admin`, `super_admin`, `worker` (seed `init.sql` L272–351). Staff tables (`Branches`, `RestaurantEmployees`, `EmployeeBranchAccess`, `Roles`, `EmployeeActivityLog`) exist in the DB but **zero enzyme in the JS backend** — no routes or services reference them at all.

---

## 3. Existing Functionality (Verified Working)

| Feature | Evidence |
| --- | --- |
| Auth: signup/signin/refresh/logout/me, cookie JWT, single-use refresh via Redis | `backend/src/services/auth.service.js` (signup L53–96, signin L109–155), `controllers/auth.controller.js` L5–23 (cookie set), `app.js`decorate `authMiddleware` L105 |
| Restaurants CRUD + ownership + plan-limit gate | `routes/restaurant.routes.js`, `services/restaurant.service.js` zod body, `services/site.service.js` (`userOwnsSite` L49–64, `assertCanCreateSite` L201–230), `restaurant.controller.js` (`assertOwnership` L26–35) |
| Publish gating by subscription (active/trialing only) w/ draft→published copy | `restaurant.routes.js` L23–27 (+`subscription.middleware.js` L11–51); `restaurant.service.js.publish()` L216–232 copies `draft_menu`→`published_menu` |
| Public menu per slug with `?lang=ar|en|ku` / `x-lang` | `routes/menu.routes.js`, `menu.service.js` L148–248 |
| Online + counter orders (zod-validated cart lines, idempotency, ownership-filtered list, status state machine) | `routes/order.routes.js`, `order.service.js` L18–30 (states), L280–282 (cash order = `unpaid`), L524–550 (transitions), L565–580 (`markOrderPaid` — **exported but never routed**) |
| Order tracking for guests via `?token` | `order.routes.js` L15 (`GET /api/public/orders/:id/track`) |
| Sites "/" listing/summary/can-create for client | `sites.routes.js` L8–13 with `site.service.js` |
| Plans **CRUD** (list/get public; create/update/delete auth-only — **no role gate**), soft-delete when subscriptions reference the plan | `routes/plan.routes.js` L4–8, `plan.service.js` create L55, update L80, delete L126–151 (soft-delete branch deliberate) |
| Platform admin: clients list, subscriptions list/get/create/patch (super-admin gate on 4 handlers), basic land stats | `routes/platform.routes.js` + `controllers/platform.controller.js` (`requireSuperAdmin` L15–25), `platform.service.js.getPlatformStats` L248–260 (⚠️ `mrr` = SUM over ALL subscription prices regardless of status/payment) |
| Stripe checkout + webhook + per-order public payment intent; per-restaurant payment history | `payment.controller.js` L15/L27/L40/L70/L80, `payment.service.js` L160–228 (webhook-driven subscription activation), L283–331 |
| Free-plan / paid-subscription request flows (tables **missing live** — see constraints) | `routes/freePlanRequest.routes.js`, `routes/paidSubscriptionRequest.routes.js`, phase2-migrate.js L49–179 |
| Templates list public/all, create, soft-delete | `routes/template.routes.js` L10–14 |
| Health (app, live, ready) | `health.routes.js`, `app.js` L134, `server.js` L20 |

**Frontend existing functionality (usable UI, real or demo-backed):**
- 8 templates defined statically: `frontend/src/templates/data/templates.ts` L124–881 (ids `the-royal`, `urban-cafe`, `sweet-atelier`, `burger-district`, `bella-italia`, `bean-brew`, `green-table`, `maison-patisserie`) + `allTemplates`/`getTemplate` L926–952 → **verified 8 templates**.
- Elementor-style inline editor (`templates/editor/inlineEdit.tsx`), trilingual multilang fields (`shared/lib/types.ts` L112–117: `Restaurant.name/tagline/description/logoText: string | Multilang`), `tx()` + `writeText()` + module-active lang (`shared/lib/utils.ts` L5–47, `shared/i18n/index.tsx` L10–144).
- Maintain Zustand/in-memory localization for dashboard/menu/Qr/Settings/Overview/Design/Editor/DesignPanels/billing GithubLogo/Auth etc. (see prior fix report, e.g. `frontend/REMAINING_RUNTIME_DATA_ERRORS_FIX_REPORT.md`).
- Headless live/worker surfaces already route to the **JS backend** via `shared/api/client.ts` (`/api/kitchen/orders`, `/api/waiter/orders`, `/api/owner/dashboard`, `/api/auth/employee-login`, `/api/branches` …) — ⚠️ **none of those endpoints exist in `backend/`** (grep across `backend/src` returned 0 matches for `branches|employee|cashier|kitchen|waiter|cart`).
- Cart persists in localStorage (`cart_items`/`cart_branch`/`cart_mode`); `CheckoutPage.tsx:63` raw `fetch('/api/orders')` (relative → dead 4000 proxy), no auth, no base URL.

---

## 4. Missing / Partially Implemented (per the 9 expected remaining phases)

Legend: ✅ exists with real behavior · ⚠️ partially implemented · ❌ missing. Evidence only, no speculation.

| # | Phase | Status | Detail & File evidence |
| --- | --- | --- | --- |
| **1** | **Localization (ar/en/ku)** | ⚠️ | `tx()`/`resolveLang()` exist and are wired for restaurant names/fields in most render sites (see prior `REMAINING_RUNTIME_DATA_ERRORS_FIX_REPORT.md`); RTL toggling via `documentElement.dir` (`i18n/index.tsx` L104–122). **Known leaks:** `features/admin/tabs/TeamTab.tsx` → `` ` · ${restaurant.name}` `` renders a raw Multilang object; `useStore.ts:176` (in-memory-only save-toast) interpolates `${saved.name}` raw object; `RestaurantSite.tsx:214–216` renders literal `"?? Cart"` (missing i18n key). Backend responses are Arabic hard-coded strings (e.g. `restaurant.routes.js` login errors) — not localized per `Accept-Language`. |
| **2** | **Guest → Registration → Publish** | ⚠️ | Guest can pick a template and edit the draft; but **Publish is a purely local mock**: `useStore.publishDemo` (`shared/store/useStore.ts`) writes `localStorage` only; both `features/marketing/MenuDemo.tsx` (L107–124) and `RestaurantSite.tsx` bypass any gate. Registration (`useAuth.signUp`, `features/auth/SignIn.tsx`) never calls the backend (`shared/lib/api.service.ts` auth exports exist but are **dev/unwired**). After signup the draft is *duplicated* rather than *transferred*: `useAuth.signUp` copies the draft to a **new** restaurant id (name/ slug/plan) while the original stays active (duplication + ownership mismatch). Publish on backend requires subscription (`subscription.middleware.js`) and is real only through `PATCH /api/restaurants/:id/publish`. |
| **3** | **Role isolation** | ❌ backend, ⚠️ frontend | Frontend: "Admin" nav in the client dashboard is gated by `isPlatformAdmin(session)` (`DashboardLayout.tsx` L174–186 and mobile `More` sheet L444–455), where `isPlatformAdmin` only grants `super_admin`/`admin` (`shared/store/useAuth.ts` L348–359) — ordinary clients/workers do not see it. `/admin` also self-guards (`features/admin/Admin.tsx` L48). **Backend:** `app.js` has no per-route role guards. Only `requireSuperAdmin` exists, applied to just 4 handlers of `platform.routes.js` (L41/L51/L82/L102). Direct exposure today: `/api/platform/plans` {POST,PUT,DELETE}, `/api/platform/stats`, `/api/platform/templates` {POST,DEL}, `/api/home-content/:lang`, `/api/free-plan-requests*`, `/api/admin/free-plan-requests*`, `/api/admin/paid-subscription-requests*` accept **any** authenticated user; `POST /api/free-plan-requests` and `POST /api/paid-subscription-requests` take `userId` from the **body** (`paidSubscriptionRequest.service.js`), i.e. one user can file a request *as another user*. `GET /api/restaurants/:id` (public per `auth.middleware.js` L12) returns full restaurant rows incl. `draft_menu`. No `Cashier`/`Kitchen`/`Waiter` anywhere in JS backend. |
| **4** | **Cash subscriptions** | ❌ | Current revenue flow is Stripe-only (`POST /api/billing/checkout` L15 + webhook L40; activation happens via `PaymentIntentManager`/webhook `payment.service.js` L283–331). There is **no cash-classified payment method**, no pending-approval pipeline, no admin confirm/record endpoints, no "renew reminder" toggle, no terminate-with-actor/reason (audit table unused). `Orders.payment_method` accepts `cash`/`cash_at_pickup` (`order.service.js` L32) but no code ever marks them paid. |
| **5** | **Super Admin Plans** | ⚠️ | Backend CRUD is real (`plan.routes.js` + `plan.service.js`); plan-limit enforcement at `site.service.js.assertCanCreateSite`. Frontend **PlansTab** is demo-only: `features/admin/tabs/PlansTab.tsx` reads/writes the Zustand-vs-localStorage `usePlatform` store (`menucraft-platform-v1`), i.e. "localStorage as fake DB" (explicitly required to be replaced). Commercial shape must come from configuration (workspace contract: Free Trial 3 days/1 website, Professional $29/mo/3 websites, Business $79/mo/unlimited) — id-based plan keys in `backend/src/config/plans.js`; must be reconciled with hard-coded ids `trial|professional|business` seeded by `database/migrate.js` L120–441 **and** any stale rows in DB (current DB holds an inactive `Starter` row — never to be touched by an unapproved migration). |
| **6** | **Templates & ordering** | ⚠️ | 8 templates exist and render (`templates.ts` L124+, `allTemplates` L943). Menu items are rendered with an add-to-cart affordance in the template preview (`RestaurantSite.tsx:687–703`, header cart sum at L214–216); but **cart ↔ item availability/pricing has no backend verification hook**: item id is picked from the template's local `menu` JSON, availability/pricing is trusted from the store, and there is no check against `Restaurants.ordering` enable flag (the "ordering enabled?" flag in the live `Branches` table exists but is never surfaced to the template render path). Route `features/public/PublicSitePage.tsx` (public menu + ordering flow) **is not registered in `App.tsx`** (L1–184 shows no `features/public/*` import), and its only real "guest order" path (raw `fetch('/api/orders')` at `CheckoutPage.tsx:63`) bypasses the `restaurantId` ownership that `order.controller.js:L31–41` requires for `channel=counter` (accepts only `online`, but the frontend never passes a channel → default `online` — so it *appears* to work, unauthenticated, against whatever `restaurantId` the cart carries). |
| **7** | **Real data only (no mock/fake)** | ❌ | Client dashboard/admin & most platform/store dashboards are still local-state mock: `shared/store/useStore.ts` (restaurants+draft, key `menucraft-demo-v1`, seeds `createSeedRestaurants` from `shared/lib/demoData.ts` L165), `useAuth` (`menucraft-auth-v1`, seed accounts L517 incl. fake `@menucraft.demo` logins + base64 "password vault" L33), `usePlatform` (`menucraft-platform-v1`), `useOrders` (`menucraft-orders-v1`), `useHomeContent` (home-page content entirely local). Admin tabs (`ClientsTab`, `SalesTab`, `PaymentsTab`, `SubscriptionsTab`, `TeamTab`) render store rows only. Marketing home page reads homeContent from local store, not `GET /api/home-content`. Metrics shown to owners are hardcoded strings (“Good to see you, Marco”, fixed KPI doses in `Overview.tsx` L33–113). Only `features/live/*` and the worker board actually bind to the backend, and only through endpoints that **do not exist** yet (see phase 3/8). Dashboard metrics on backend: only the 3-figure `GET /api/platform/stats` snapshot (super admin, **no auth role gate**), no route exists at all for an owner-level `dashboard` report, no branch/employee metrics. Empty-state numeric zero and "API failure → error not fake success" behavior is not present anywhere yet. |
| **8** | **Full integration** | ⚠️ | Only one vertical is wired today: `features/live/*` → `shared/api/client.ts` → JS backend. Everything else is **not** wired: `SignIn.tsx`, `AuthModal.tsx`, `SubscribeModal.tsx`, `PricingBubble.tsx` never call the API (demo store only). Dead/unwired modules in `shared/lib/api.service.ts`: `platformAPI`, `templateAPI`, `homeContentAPI`, `billingAPI`, `paymentsAPI`, `planAPI`, and *both* `authAPI`s. Dead route pages exist but are unmounted or gated off: `features/public/PublicSitePage.tsx`, `OrderTrackingPage.tsx`, `Checkout.tsx`, `features/admin/AdminLogin.tsx`, `features/admin/tabs/PlansTab.tsx`, `features/employee/*`, `features/worker/*` live behind `role === 'worker'` guards only, `features/live` surfaces sit on **missing backend routes** (`/api/kitchen/orders`, `/api/waiter/orders`, `/api/branches`, `/api/employees`, `/api/owner/*`) — as soon as the frontend builds are clean, these calls 404. The dev **proxy** (Vite)`→4000` is also wrong (nothing listens there). |
| **9** | **Test accounts** | ❌ | No test accounts exist per task's constraints. Only the `init.sql` seed (5 users: `super@…`, `admin@…`, `owner@bella.demo`, `owner@copper.demo`, `worker@bella.demo`, all 12-round bcrypt). No password reset/creation flow to lay a safe test credential, and `seedtest.js` just re-writes the password of `owner@bella.demo` (bad practice). No documentation of credentials/roles/restaurants per task. |

---

## 5. Existing Tests & Available Evidence

| Test surface | Where | How it runs | What it currently proves |
| --- | --- | --- | --- |
| Frontend harness | `frontend/tests/run.mjs` + `frontend/tests/fixtures/` + `frontend/tests/regression.test.tsx` | `npm test` (package.json L10) | 14 static checks: 9 pass, 5 fail (3× Websites `resolved-name`, 1× empty-state, 1× 401 dead-session) — failures are pre-existing and unrelated to data-type crash fixes. **Executed 2026-11-02.** |
| Frontend localization probes | `frontend/src/_i18n_probe.tsx` (present, ~not mounted anywhere) + the same run.mjs i18n sanity steps | n/a | static only |
| Backend smoke / unit scripts | `backend/smoke-test.js`, `test_phase6.js`, `test_with_server.js`, `test_validation.js`, `test_jwt.mjs`, `test_signup.js`, `test_single_use.js`, `testauth2/3/4.js`, `test_phase_a2_step4..7*.js`, `verify*.js` | run manually `node <file>` (no `npm test` wiring) | covers auth cookie flow, jwt mechanics, zod errors, tenant/order flows; **all require a running server; they mutate DB** — do not run blindly against the task DB |
| Legacy TS backend tests | `NEON_PIXEL_REPORTS/backend/tests/*.test.mjs`, fixtures/harness `tests/fixtures_2b2.mjs`, `tests/harness_2b2.mjs` | manual `node tests/<file>.test.mjs` | historical coverage for kitchen/waiter/cashier/branch/subscription lifecycle; **not runnable in place** (`node_modules` missing there), and only the `menucraft_tests_docker_2b1` DB is permitted |
| Prior-session executed results (documented, not to be re-claimed blindly) | `frontend/REMAINING_RUNTIME_DATA_ERRORS_FIX_REPORT.md`, `frontend/RUNTIME_CRASH_AND_PERSISTENCE_FIX_REPORT.md`, `frontend/POST_MERGE_TYPESCRIPT_FIX_REPORT.md`, `frontend/OWNER_DASHBOARD_INTEGRATION_FINAL_REPORT.md` | reports only | date-stamped evidence of prior work, including TS/build/test outcomes |

**Available commands confirmed readable/executable** (no magic scripts): frontend `npm run dev`, `npm run build`, `npm run preview`, `npm test`; backend `npm run dev`, `npm start`, `npm run migrate` (**migrate = approval-gated** — see §7).

---

## 6. Git Status (read-only, no staging/reset/clean done)

- Branch `main`, **up to date** with `origin/main`; last commits `b6a428e FIX`, `60049b5 Hero video + image uploads everywhere`, `3cb23af Admin sales detail + editable social links`.
- **85 files modified** (tracked) + **~96 untracked paths**, including:
  - entire `backend/` tree (out of version control — **risk of losing work**, see §7),
  - `frontend/.env`, `frontend/src/features/{admin/AdminLogin.tsx, admin/PlanPopup.tsx, admin/SubscriptionRequestsPage.tsx, client/BranchesPage.tsx, client/CartPage.tsx, client/Checkout.tsx, client/CheckoutPage.tsx, client/CreateWebsiteModal.tsx, client/ItemDetailPage.tsx, client/MenuPage.tsx, client/OrderTrackingPage.tsx, client/WebsiteManagement.tsx, client/Websites.tsx, client/WebsitesPage.tsx, client/useSites.ts, employee/, live/, public/}`, `frontend/src/shared/{api/, components/, lib/api-types.ts, lib/api.service.ts, store/useSession.ts, types/}`, `frontend/src/shared/i18n/locales/ext/{billingUi.ts,live.ts,websitesUi.ts}`.
  - report files at root and in `frontend/`.

---

## 7. Risks & Blockers

1. **Database is off-limits without approval.** Any schema/table addition (e.g. deleting/creating `free_plan_requests`/`paid_subscription_requests`, plan column changes, employee tables wiring) must be reported and approved **before** execution; never touched the target DB `menucraft_docker` (only `menucraft_tests_docker_2b1` would be permissible in future work). Migrations are ad hoc — no rollback path.
2. **`backend/` is fully untracked in git.** A careless `git clean` (which is forbidden anyway) would delete the entire functional backend. Do not run `git add/commit` without permission, but be careful that nothing sets the backend to an "in-progress" state that would be lost if a future commit intentionally excludes it.
3. **Backend currently running** on port 3000 with live data. Any code change must be tested without restarting the production-like server, or must restart it deliberately later with approval.
4. **Vite proxy points at a dead port (4000)** while the real API is 3000 → any relative URL call fails; either the proxy must change (config edit) or all API calls must be absolute — coordinate with `VITE_API_URL=http://localhost:3000`.
5. **Untracked dead/broken frontend files** remain in `frontend/src/features/{client/Websites.tsx, client/WebsiteManagement.tsx, admin/tabs/PlansTab.tsx …}` and `frontend/src/_i18n_probe.tsx` — they compile *today* only because of the recent type fixes, but their demo-store reliance contradicts Phase 7.
6. **Drive-by mutability in worktree:** packages were never re-installed; only `backend/node_modules` and `frontend/node_modules` exist. Do not assume `npm ci` has been run.
7. **`INTEGRATION_NEON_PIXEL_TO_MAIN_REPORT.md` is mojibake** (verified: body shows `??????` instead of Arabic). Treat as low-signal documentation only.
8. **CORS/env coupling:** `backend/.env` sets CORS origins and DB name; **do not read or change** it without approval. Any frontend dev port other than what CORS expects will silently break requests.
9. **Previous-phase leftovers** (mirrored partially in code but never ported): `backend/database/Phase_A2_…` docs and run-books, `NEON_PIXEL_REPORTS/...PHASE_*.md`, `frontend/docs/` — useful as specification input only.

---

## 8. Recommended Execution Order (Phases 1–9)

Run in dependency order — each step has a hard guarantee on the next one:

| Order | Phase | Rationale (dependency chain) |
| --- | --- | --- |
| **0** | (this report) — Baseline & verification | Nothing can be built until real paths, framework facts, rules (git/DB/env), and dead code are confirmed — done above. |
| **8** | **Integration plumbing first** | The first hard fix: point the Vite proxy to `http://localhost:3000` (or make all calls absolute via `VITE_API_URL`), ensure `backend/src/server.js` starts cleanly, install Node deps if missing, and add the wiring for auth (`/api/auth/*`), owner/workspace surfaces and public menu. **No feature in Phases 1–7 can be verified until an authenticated HTTP surface exists.** |
| **3** | **Backend role isolation** | `requireRole`-style guards on `/api/platform/plans`, `/api/platform/stats`, `/api/platform/templates`, `/api/home-content/:lang`, `/api/free-plan-requests`, `/api/admin/*`, `/api/admin/paid-subscription-requests` + take `userId` from the token, not the body; restrict `GET /api/restaurants/:id` to `published` rows (or require ownership) so drafts no longer leak. Backend-first: same guard shape must be trivially reusable by Phases 2, 4, 5, 7. |
| **9** | **Doc/seed test accounts (safe, non-production users only)** | Without test accounts, "admin-only" guards from Phase 3 cannot be demonstrated. Deliver a *documented, non-destructive* fixture story (e.g. an idempotent seed script that creates fresh, explicitly-labeled test users and never overwrites anything; no live-DB destructive ops) plus the ownership matrix (each role → endpoints) in a doc. |
| **5** | **Plans tab (real backend CRUD, no fake DB)** | Plan CRUD already exists server-side; frontend `PlansTab.tsx` needs to switch from `usePlatform` local store to the endpoints (and reconcile canonical plan ids from `backend/src/config/plans.js` with `database/migrate.js` L120–441 seed ids). |
| **4** | **Cash subscriptions** | Depends on Plans (5) and role isolation (3). Introduce a pending→confirmed cash pipeline (client request endpoint + admin confirm/decline endpoints, plus audit log writes) — using **existing tables** only; if a column/table is required, STOP and report for approval. |
| **2** | **Guest → Registration → Publish on real backend** | Depends on auth being real (8) and on subscription/plan model (4/5). Replace local-only `publishDemo` with real draft saving to `draft_menu` + an explicit publish call requiring subscription/plan validity; add a *first-class* draft-transfer-on-signup flow into `auth.service.js` signup (or a dedicated "adopt draft" endpoint) so no duplicate restaurant is created; ensure no auto-publish. |
| **7** | **Real data metrics everywhere; no fake zeros** | Requires the earlier backend surfaces (orders/plans/subscriptions/stats) to be reachable. Replace mock dashboards + `menucraft-*-v1` store reads with real API-backed metrics (with numeric zero when data is empty and clear error state on API failure). Do **not** delete any record — prescription is read-only aggregation on the existing rows. |
| **6** | **Templates + ordering + cart wiring** | Finally wire cart/`RestaurantSite` into real item data/availability and the real `/api/orders` contract; gate the cart affordances by the restaurant's real ordering flag; also restore the unmounted `features/public` pages into `App.tsx`. |
| **1** | **Localization sweep (ar/en/ku)** | Do this near the end so it catches all the surfaces created/renamed in Phases 2–8; use existing `tx()`/`resolveLang()` and fix the known leak sites (`TeamTab.tsx`, `RestaurantSite.tsx` cart label, backend Arabic-only error strings where practical without weakening types). |

**Stop-points (must pause and request approval):** anything requiring (a) direct DB access to `menucraft_docker`, (b) a new table/column, (c) `npm run migrate`/`phase2-migrate.js`, or (d) touching `/backend/.env` / `/frontend/.env` secrets.

---

## 9. Verified Paths Recap

- Frontend: `D:\MBN Group\Test Menu\frontend` (React 19 + TypeScript 5.8 + Vite 6 + Tailwind v4, port 5173/5174-dev, build via `npm run build` = `tsc -b && vite build`).
- Backend: `D:\MBN Group\Test Menu\backend` (Fastify 4 + mssql raw SQL, entry `src/server.js`, dev port 3000, currently serving `{"status":"ok"}`).
- Legacy/archive (not in scope): `D:\MBN Group\Test Menu\NEON_PIXEL_REPORTS\backend` (Fastify 5 TS, port 4000, **not installed**).
- Test harnesses: `frontend/tests/run.mjs` (`npm test`); `backend/smoke-test.js` (+ ad hoc `test_*.js`, run manually, may mutate DB); `NEON_PIXEL_REPORTS/backend/tests/*.test.mjs` (manual, archived DB only).
