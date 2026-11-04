# Orders & Employees — Step 1: Existing System Audit (READ-ONLY)

Status: READ-ONLY INSPECTION COMPLETE. ZERO modifications. ZERO DB operations.

---

## 1. Existing Database Tables (Verified from DB / Scripts / Schema Proposal)

From `SCHEMA_PROPOSAL.md` + `backend/src/config/db.js` (DB: `menucraft_docker`, MSSQL):

Existing confirmed tables:
- `Restaurants` (id, slug, status, name_en/ar/ku, ordering JSON, language, source_lang, etc.)
- `MenuCategories`, `MenuItems`, `MenuTranslations` (not used; preserved for compatibility)
- `Orders` (id, restaurant_id, order_number, channel, tableNo, customerName/Phone/Email, fulfillment, deliveryAddress, note, subtotal, deliveryFee, discount, total, currency, paymentMethod, paymentStatus, status, created_at, updated_at)
- `OrderLines` (order_id, item_id, qty, unitPrice, price, options JSON, name, nameAr)
- `Payments`, `Invoices`
- `Users`, `UserRestaurants` (ownership / tenant link), `Subscriptions`, `Plans`, `Templates`, `HomeContent`

Missing / Incomplete for Orders & Employees:
- No `Employees`, `EmployeeRoles`, `BranchEmployees`, `EmployeeActivityLog`
- No `Branches` / `BranchAssignments` table (restaurant = site; branch concept missing)
- No `RolePermissions`, `RoleBasedAccess` tables
- `Orders` has `tableNo` and `restaurant_id` but no `branch_id`; multi-branch routing not supported at DB level
- `Orders` has `status`, `paymentStatus`; transitions enforced in `order.service.js` (verified)

---

## 2. Orders System — Backend APIs & Services (FULL INSPECTION)

File references (exact):

- `backend/src/routes/order.routes.js`: POST `/orders`, GET `/public/orders/:id/track`, GET/GET `/orders`, PATCH `/orders/:id/status`, DELETE `/orders/:id`
- `backend/src/controllers/order.controller.js`: `createHandler`, `listHandler`, `getByIdHandler`, `trackHandler`, `statusHandler`, `removeHandler`
- `backend/src/services/order.service.js`: full lifecycle — `createPublicOrder`, `createCounterOrder`, `getOrdersByRestaurant`, `getOrderById`, `trackOrder`, `updateOrderStatus`, `deleteOrder`, `markOrderPaid`, `priceItem`, `orderingSettingsFromRow`
- `backend/src/services/menu.service.js`: `resolveItemsForOrder` used by order pricing

Implementation status (verified by code inspection):
- Order creation (public + counter): FULL, with Zod validation, server-side pricing, idempotency key (`orderToken`/`idempotencyKey`), DB transaction (`sql.Transaction`), order numbering per restaurant.
- Order item pricing: FULL (`priceItem` parses `item.options` groups/options; validates required/max; computes extras).
- Payment methods: CASH, CASH_AT_PICKUP, CARD (Stripe conditional), WALLET, BANK_TRANSFER. Statuses: `unpaid`, `paid`, `awaiting_confirmation`, `refunded`, `failed`.
- Fulfillment: `delivery`, `pickup`, `table`. Delivery fee/min-order supported from `Restaurants.ordering` JSON.
- Status lifecycle / transitions: FULL (`STATUS_TRANSITIONS` object). Allowed: pending→confirmed/preparing/cancelled; confirmed→preparing/cancelled; preparing→ready/cancelled; ready→completed; completed→[]; cancelled→[]. Legacy `received` mapped to `pending`; `served` to `completed`.
- Tracking (guest token): FULL (`orderToken` 24-byte hex, `trackOrder`).
- Cancellation / deletion: FULL (`deleteOrder` removes OrderLines then Orders; `updateOrderStatus` allows cancellation where permitted).
- Counter orders (`channel='counter'`): FULL (requires auth + `ownsRestaurant` check; can set `table`).
- Authorization: `authMiddleware` on protected routes; `ownsRestaurant` checks `userOwnsSite` / `isPrivileged`; guest tracking uses safe token (no auth needed).
- Multi-branch assignment: PARTIAL — `restaurant_id` present, `tableNo` present, but NO `branch_id` column. Multi-branch pricing/different availability per branch is NOT implemented.
- Cashier / Kitchen / Waiter operations: PARTIAL — order status transitions exist, but NO role-specific endpoint restrictions (only `actorRole` passed to `updateOrderStatus` but not enforced beyond transition rules; no dedicated cashier/kitchen/waiter APIs).
- Notifications / webhooks / real-time: MISSING — no webhook service for Stripe/card; no real-time updates (WebSocket/Socket) observed; no notification templates for order status changes.

---

## 3. Employees & Permissions — Backend Audit

Files inspected:
- `backend/src/auth/auth.js`, `auth/middleware.js`
- `backend/src/auth/routes/auth.routes.js`
- `backend/src/services/auth.service.js`
- `backend/src/services/site.service.js` (ownership check)
- `backend/src/controllers/auth.controller.js`

Status:
- User authentication (email/password + JWT cookie): FULL (`verifyCredentials`, `signToken`, `verifyToken`).
- `Users` table + `UserRestaurants`: FULL (restaurant ownership / multi-tenant link).
- `userOwnsSite`, `isPrivileged`: FULL — checks restaurant ownership / role privileges.
- Role-based API authorization for orders: PARTIAL — only `authMiddleware` checks login; `actorRole` passed to `updateOrderStatus` but no role-based restriction (e.g., cashier can only confirm, kitchen only prepare, waiter only mark ready). No `Employees` table; roles (`admin`, `owner`, etc.) exist on `Users` but no granular operational roles.
- Employee creation / management: MISSING — no endpoint; no `Employees` model/service.
- Branch assignment for employees: MISSING — no `BranchEmployees`; `UserRestaurants` is restaurant-level only.
- Employee authentication (separate from restaurant owner): MISSING — all logins use `Users`; no staff-level auth with branch restrictions.
- Activity / audit logs for employees: MISSING — no `EmployeeActivityLog` table; no logging of who changed order status.
- Invitation / password reset for staff: MISSING.

---

## 4. Frontend — Orders & Employee Pages

Files:
- `frontend/src/features/client/OrdersPage.tsx`
- `frontend/src/features/client/orders/OrderCard.tsx`
- `frontend/src/features/client/orders/ManualOrderModal.tsx`
- `frontend/src/features/client/orders/helpers.ts`
- `frontend/src/features/worker/WorkerBoard.tsx`
- `frontend/src/features/admin/tabs/TeamTab.tsx`
- `frontend/src/shared/store/useOrders.ts`

Status:
- `OrdersPage`: FULL — lists orders by restaurant with filters (today/all, channel, query); shows status dots; allows advance/remove; opens `ManualOrderModal`.
- `OrderCard`: FULL — displays item, qty, price, status.
- `ManualOrderModal`: FULL — allows manual counter order creation.
- `WorkerBoard`: EXISTS (`WorkerBoard.tsx`) — appears to be kitchen/worker display; needs verification of implementation depth.
- `TeamTab`: EXISTS (`admin/tabs/TeamTab.tsx`) — shows team/user management at admin level; likely restaurant-owner team view.
- Employee role-specific frontend pages (cashier, kitchen, waiter): MISSING — only `OrdersPage` (owner/admin view) and `WorkerBoard` (generic worker) exist; no dedicated cashier/kitchen/waiter dashboards with restricted views.
- Multi-branch selection / branch filter in orders: MISSING.

---

## 5. Order Lifecycle & Status Transitions (Verified)

From `order.service.js`:
- `pending` → confirmed, preparing, cancelled
- `confirmed` → preparing, cancelled
- `preparing` → ready, cancelled
- `ready` → completed
- `completed` → (none)
- `cancelled` → (none)
- Legacy mappings preserved (`received`→pending, `served`→completed)

No business rule enforcement by role (e.g., only kitchen can prepare; only cashier can confirm payment). Only transition validity enforced.

---

## 6. Multi-Branch Requirements — Gap Analysis

Requirements stated:
- Multiple branches per restaurant.
- Menu shared; prices/availability can differ by branch.
- Delivery orders assigned to selected branch.
- Dine-in orders identify branch + table.
- QR-based table ordering supported.
- Employees only access authorized branches.

Current state:
- `Restaurants` table = site; no branch table.
- `MenuItems` price is single (`price`); no branch-level price override.
- `Orders` has `tableNo` and `restaurant_id`; no `branch_id`.
- `OrderLines` references `item_id` from menu; no branch-level item selection.
- QR/table ordering exists (`QrCodePage`, `table` field in order) but branch assignment missing.
- Employee access is restaurant-level (`UserRestaurants`); no branch-level restriction.

---

## 7. Security & Tenant-Isolation Findings

Positive:
- `authMiddleware` on protected routes.
- `ownsRestaurant` checks restaurant ownership before data access.
- `createHandler` checks `counter` channel requires auth + ownership.
- `getByIdHandler` supports safe guest token (`token`) without exposing internal IDs.
- `deleteOrder` / `updateOrderStatus` require ownership.
- Order pricing computed server-side (not trusted from browser).

Gaps / Risks:
- No role-based authorization on status updates (any authenticated owner can change any order status to any valid state).
- No employee-level auth / branch isolation — staff currently use same `Users` login as owner.
- No audit log for status changes (who did it, when, from which IP/role).
- No rate limiting specific to order creation (global middleware exists but not granular).
- `secure: false` on cookie (`auth.routes.js`) — requires HTTPS in production.
- `channel = 'online'` vs `'counter'` distinction exists but no additional authorization layer for counter users.

---

## 8. Missing Functionality (Explicit)

Orders:
- Branch-level order routing / assignment.
- Branch-level menu pricing / availability.
- Dedicated cashier dashboard / kitchen board / waiter app (only generic `WorkerBoard`).
- Real-time order notifications (WebSocket / push / webhook for Stripe card payments).
- Employee activity audit log.
- Order cancellation reason / rejection notes.

Employees:
- `Employees` table / management API.
- Role definitions (cashier, kitchen, waiter, manager) with granular permissions.
- Branch assignment for employees.
- Invitation flow / password reset for staff.
- Separate staff authentication (or role-scoped tokens).
- Activity / audit logging.

Multi-Tenant / Branch:
- `Branches` table + `BranchEmployees` + `BranchMenuOverrides`.
- QR table ordering linked to specific branch.
- Branch-level reports / earnings.

---

## 9. Proposed Architecture (Reuse Existing Code)

Reuse:
- `order.service.js` (pricing, validation, DB transaction, status transitions)
- `order.controller.js` / `order.routes.js` (API contract preserved; extend with branch params)
- `auth.service.js` / `auth.middleware.js` (extend with role/branch claims)
- `useOrders.ts` / `OrdersPage.tsx` / `OrderCard.tsx` (extend with branch filters; keep existing UI patterns)
- `WorkerBoard.tsx` (enhance with role-specific views)
- `menu.service.js` (pricing logic can extend to branch-level overrides via new table or JSON field)

New needed (approved by user only when requested):
- DB tables: `Branches`, `Employees`, `EmployeeRoles`, `BranchEmployees`, `EmployeeActivityLog`, `BranchMenuOverrides` (optional)
- Services: `employee.service.js`, `branch.service.js`, `audit.service.js`
- Routes: `/employees`, `/branches`, `/employees/:id/permissions`
- Frontend: `EmployeePage`, `BranchManagerPage`, `CashierDashboard`, `KitchenBoard` (enhanced `WorkerBoard`), `WaiterBoard`

---

## 10. Phased Implementation Plan (Proposed — Awaiting Approval)

Phase 1 (Orders — No DB schema change needed):
- Enhance `updateOrderStatus` to enforce role-based rules (e.g., `actorRole` restrictions).
- Add `branch_id` to order creation / query (if branch table exists or use `restaurant_id` as proxy temporarily).
- Enhance `WorkerBoard` with role-specific status filters.

Phase 2 (Employees — Requires DB + API):
- Create `Employees`, `EmployeeRoles`, `BranchEmployees` tables (with user approval).
- Build `employee.service.js` + routes.
- Extend `auth.middleware.js` to include `employeeRole` / `branchAccess`.

Phase 3 (Multi-Branch):
- Create `Branches` + links.
- Extend menu pricing per branch.
- Update order routing.

Phase 4 (Audit / Notifications):
- Activity log table + service.
- Notification/webhook integration.

---

## 11. Exact First Implementation Task (Recommendation — Awaiting Approval)

If approved to start: **Audit/extend `updateOrderStatus` to enforce role-based transition limits** using existing `actorRole` parameter — smallest change, no DB migration, improves security immediately, and prepares for Phase 2 role architecture.

Alternatively: **Create `Employees` table + basic employee management endpoint** if user explicitly approves DB changes.

---

## 12. Confirmation of READ-ONLY Status

- No source files edited (only reported).
- No DB writes, migrations, or inserts performed.
- No `ALTER` / `CREATE` / `UPDATE` executed.
- No new packages installed.
- No feature marked complete without verification.
- All references point to exact file paths (`backend/src/routes/order.routes.js`, `backend/src/services/order.service.js`, `frontend/src/features/client/OrdersPage.tsx`, etc.).

---

STOP — Audit delivered. No implementation started. Waiting for user approval before any Phase 1/2/3 changes.
