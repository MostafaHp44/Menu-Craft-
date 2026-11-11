# Upgrade Flow Spec — Static Menu → Live Digital Menu

Status: **agreed with product owner (2026-11-10), implemented (2026-11-11).**

Implementation summary (2026-11-11):
- `Restaurants.mode` (`static` | `live`, default `live`) + lazy migration `ensureRestaurantModeColumn()` (imageFit.service pattern).
- Onboarding wizard in `SignIn.tsx`: account → mode (Live/Static) → plan (each mode has its own plan list) → finalize.
- Static signup → immediate **active Starter** subscription (no approval), dashboard hides Orders/Branches/Team (nav filter + direct-URL redirect in `DashboardLayout`).
- Live signup → no subscription at signup; paid request (`paid_subscription_requests`, `pending_payment`) → Super Admin approve (`PATCH /api/admin/paid-subscription-requests/:id/approve`) → subscription **active** + `mode='live'`.
- Public menu (`GET /api/public/menu/:slug`) exposes `mode`; static forces `ordering.enabled=false` and disables cash payment methods (read-only site).
- `mode` is exposed on `/api/auth/signup|signin|me` so the dashboard knows the current mode and re-checks it on every subscription refresh (flips live right after approval).
- Verified live: `onboarding_test.js` 22/22, full regression battery green (t1_auth 74, t2 32, t3 35, t4_endpoints 81, t4b 67, t5 15, t6 11, t7 12, t1b 6, p1_probe 73, p2_limits 24, p2_logout 15 = 567 total).

### 2026-11-11 — Six plans (3 Live + 3 Static) + dedicated change-plan tab

- `Plans.mode` column (`live` | `static`, default `live`) added via lazy migration `ensurePlansReady()` in `plan.service.js` (auto-adds column, backfills modes, `INSERT IGNORE` seeds all 6 plans: `plan-starter`/`plan-static-plus`/`plan-static-studio` static + `plan-live-basic`/`plan-professional`/`plan-business` live). Prices of the 3 new plans are placeholders pending product-owner review.
- `backend/src/config/plans.js` holds the 6 `PLAN_SPECS` + `normalizePlanKey` (strips `plan-` prefix).
- Signup resolves the chosen plan by id + mode (fallback to the mode's default) and activates a subscription immediately **only when the plan price is 0** (free Starter); paid plans go through the paid request flow.
- Approval of a paid request sets `Restaurants.mode` from the **plan's mode** (not hardcoded `live`); free-plan approval sets mode from the `plan-starter` row.
- Site stop/restore now skipped when the restaurant already has an active subscription (nothing changes before approval).
- Admin `paid_subscription_requests` list now returns `plan_mode`.
- Frontend: new shared `PlanRequestModal.tsx` (3-step confirm → details → final) used by the Subscription tab; new dashboard tab `/dashboard/change-plan` (same-mode section + other-mode section, pending banner, shared modal); Subscription tab shows only plans of the current mode.
- Marketing: new `/plans` page listing all 6 plans grouped by mode; Home pricing section now has a "See all 6 plans" button → `/plans`; plan CTAs deep-link to `/signin?mode=signup&plan=<id>`.
- Verified live: `plans_mode_test.js` 34/34 (six plans, mode-change request → nothing changes → approve → mode flips, signup free vs paid).

## 1. Two product modes (per restaurant)

| Mode | Dashboard | Public site |
|---|---|---|
| **Digital Menu** (static) | Design / template editing only. **No** Branches, Team/Employees, Orders tabs. | Read-only menu. No cart, no checkout, no buy/order buttons. |
| **Live Digital Menu** | Everything as today: Orders, Branches, Team, QR, payments… | Full interactive ordering (current behavior). |

## 2. First-time onboarding

1. User signs up (or logs in for the very first time).
2. **Pick mode** → `Digital Menu` or `Live Digital Menu`.
3. **Pick a plan** — each mode has its own plan list and its own prices.
4. Land in the dashboard matching the chosen mode.

## 3. Upgrade request (static → live) — needs Super Admin approval

1. User opens the upgrade tab in the dashboard.
2. Chooses **Live Digital Menu** + **the exact plan** they want to end up on.
3. A request is sent to the Super Admin **including the chosen plan details**.
4. Nothing changes yet: dashboard stays static, payment not charged yet.
5. Super Admin approves from the admin console.
6. On approval the user's dashboard flips to the live dashboard (Orders / Branches / Team enabled) and the user can work with it.

## Implementation notes (when executing)

- `Restaurants.mode` (or equivalent) drives tab visibility + public-site interactivity.
- Onboarding wizard gated on "first login" flag.
- `PlanRequests` table (or reuse existing request flow) must store the **requested plan id**.
- Approval side lives in the super-admin console; approval → enable live mode.
- Static mode must hide order/buy actions in `RestaurantSite` renderer.
- Tests: run `p2_limits.js`, `p2_logout.js`, `t1_auth.js` + browser role pass after the change.
