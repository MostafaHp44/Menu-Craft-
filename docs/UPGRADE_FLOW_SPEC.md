# Upgrade Flow Spec — Static Menu → Live Digital Menu

Status: **agreed with product owner (2026-11-10), not yet implemented.**

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
