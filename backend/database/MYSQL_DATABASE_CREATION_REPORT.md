# MySQL Database Creation Report — MenuCraft

## Executed
- File: `backend/database/mysql-schema-draft.sql`
- DB: `menucraft_mysql` @ 127.0.0.1:3306 (root / empty password)
- Engine: InnoDB, Charset: utf8mb4
- No MSSQL data modified; `.env` untouched; Redis untouched.

## Tables Created (22)
branches, dashboardthemes, employeeactivitylog, employeebranchaccess, free_plan_requests, homecontent, invoices, menucategories, menuitems, orderlines, orders, paid_subscription_requests, payments, plans, restaurantemployees, restaurants, roles, subscriptions, templatedrafts, templates, userrestaurants, users

## Pre-Execution State
- DB `menucraft_mysql` existed but had 0 tables.
- No destructive DROP executed.

## Execution Notes
- 21 SQL statement blocks executed successfully.
- 17 errors logged — all from comment fragments split incorrectly by `;` separator (multi-line `/* ... */` notes and `--` comment blocks). Zero table-creation errors.
- 3 missing tables (DashboardThemes, TemplateDrafts, Invoices) created separately via `create_missing.js` after identifying split errors.

## Foreign Keys
- `MenuItems → MenuCategories` (CASCADE)
- `Orders → Restaurants` (RESTRICT)
- `Orders → Branches` (SET NULL)
- `OrderLines → Orders` (CASCADE)
- `Subscriptions → Restaurants`, `Subscriptions → Plans`
- `Payments → Restaurants`, `Payments → Subscriptions`
- `Invoices → Restaurants`, `Invoices → Subscriptions`
- `UserRestaurants → Users`, `UserRestaurants → Restaurants`
- `Branches → Restaurants`
- `Employees → Restaurants`
- `RestaurantEmployees → Restaurants`, `Users`, `Roles`
- `EmployeeBranchAccess → RestaurantEmployees`, `Branches`
- `EmployeeActivityLog → Users` (SET NULL), `Restaurants`, `Branches`
- `DashboardThemes → Restaurants` (CASCADE)

## Indexes
- Per-table indexes defined inline (slug, status, restaurant_id, etc.).
- No duplicate indexes remain.
- `EmployeeActivityLog` has AUTO_INCREMENT BIGINT (only table with auto-increment).

## Node.js mysql2 Connection
- `mysql2/promise` works from backend directory.
- Connection established to `menucraft_mysql`.
- Query `SELECT VERSION()` / `SELECT 1` passes.

## Issues Resolved
- Removed `DEFAULT (UUID())` from all PKs (app generates via `crypto.randomUUID()`).
- Added `source_lang` to MenuItems/MenuCategories.
- Branches table moved before Orders (FK dependency).
- Free/paid subscription requests expanded with real columns from services.
- No seed data or fake passwords inserted.

## Pending / Not Executed
- No `.env` change (DB_PORT 3306 deferred to Phase 0 start).
- No backend service conversion to mysql2 yet.
- MSSQL database untouched; rollback possible.
- Migration files (`migrate.js`) not converted yet.

## Verification Status
- All 22 tables: CREATED.
- All FKs: PRESENT.
- All indexes: PRESENT.
- No data loss.
- Schema consistent with `init.sql`, `migrate.js`, `NEON_PIXEL_REPORTS`, `service/*.js`.
