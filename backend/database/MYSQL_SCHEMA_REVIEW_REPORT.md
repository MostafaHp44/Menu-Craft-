# Schema Draft Review Report — MariaDB 10.4

## Changes Applied to `mysql-schema-draft.sql`

1. **UUID PK defaults removed** (22 replacements) — `crypto.randomUUID()` generates IDs in Node.js.
2. **`source_lang VARCHAR(10)` added** to `MenuCategories` (line ~118) and `MenuItems` (line ~140) for `ar/en/ku` support.
3. **Table order fixed** — `Branches` moved before `Orders` (FK `branch_id` references `Branches`).
4. **Duplicate index removed** — `IX_TemplateDrafts_DraftToken` removed (duplicate of inline `idx_template_drafts_token`). Additional unverified indexes removed.
5. **`free_plan_requests` expanded** — `admin_id`, `approved_at`, `rejection_reason` added per `freePlanRequest.service.js`.
6. **`paid_subscription_requests` expanded** — `admin_id`, `activated_at`, `rejection_reason`, `status` index added per `paidSubscriptionRequest.service.js`.
7. **No seed data / no fake passwords** preserved.

## Decisions / Unconfirmed Points (Not Invented)

| # | Issue | Source / Verdict |
|---|---|---|
| 1 | `BranchMenuItems` needed? | **No.** Zero references in code (`grep` empty). Menu is restaurant-level (`restaurant_id` on MenuCategories/Items). Price/availability differences by branch are handled at application layer or not implemented. |
| 2 | `Orders.order_number` uniqueness | **Not enforced in DB.** `migrate.js` defines `INT NULL`; code uses `SELECT MAX(order_number)` per restaurant, not unique constraint. No change made. |
| 3 | `Employees` vs `Users` identity chain | Confirmed by `employee.service.js`: `Users` (auth) → `RestaurantEmployees` (authorization) → `Employees` (profile) → `EmployeeBranchAccess` (branch). FKs preserved. |
| 4 | `EmployeeBranchAccess.allowed` default | `1` (confirmed by `001_phase_a1_foundation.sql`). |
| 5 | `EmployeeActivityLog.id` AUTO_INCREMENT | Only table with auto-increment (BIGINT UNSIGNED) — historical identity preserved per design. |
| 6 | `Subscriptions.plan` legacy column | Confirmed by `migrate.js` (backfill `plan_name = [plan]`). Kept nullable for compatibility. |
| 7 | `MenuItems.options` JSON | Confirmed by `migrate.js` (add `options NVARCHAR(MAX)`). |
| 8 | `TemplateDrafts` existence | Confirmed by `templateDraft.service.js`; not in `init.sql`. Included with `draft_token` unique. |
| 9 | `DashboardThemes` presence | Confirmed by `dashboardTheme.service.js` + `migrate.js`; included. |
| 10 | Branch design — shared menu, per-branch price/availability | **Not implemented in DB schema.** If needed later, create `BranchMenuItems` with `branch_id`, `item_id`, `price`, `available`. Do NOT invent now — no code references. |

## FK / CASCADE Policies Verified

- `Orders.branch_id` → `Branches(id)`: `ON DELETE SET NULL` (preserves orders if branch deleted).
- `MenuCategories` → `Restaurants(id)`: `ON DELETE CASCADE` (categories removed with restaurant).
- `MenuItems` → `MenuCategories(id)`: `ON DELETE CASCADE`.
- `OrderLines` → `Orders(id)`: `ON DELETE CASCADE`.
- `EmployeeBranchAccess` → `RestaurantEmployees(id)`: `ON DELETE CASCADE`; → `Branches(id)`: `ON DELETE CASCADE`.
- `Payments` → `Subscriptions(id)`: **no CASCADE** (preserve payment records if subscription removed).
- `Invoices` → `Subscriptions(id)`: **no CASCADE** (safe billing record retention).
- `Subscriptions` → `Restaurants(id)`: **RESTRICT** (prevent restaurant deletion with active subscriptions).

## MariaDB 10.4.32 Compatibility Notes

- `JSON` type supported since 10.2; `utf8mb4` charset standard.
- `UUID()` function supported; not used as default (app generates via Node `crypto`).
- `CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` valid.
- `TINYINT(1)` valid for boolean.
- `CREATE INDEX IF NOT EXISTS` valid in 10.4.
- `ENGINE=InnoDB` required for FK support.
- `BIGINT UNSIGNED AUTO_INCREMENT` valid for `EmployeeActivityLog`.

## Files Changed

- `backend/database/mysql-schema-draft.sql` (updated — only new file modified)
- `backend/database/MYSQL_SCHEMA_REVIEW_REPORT.md` (new)

## Not Executed / Not Modified

- No SQL executed against any database.
- `backend/src/config/db.js`, `.env`, `Redis`, Docker volumes untouched.
- No `mssql` driver removed; rollback possible.

## Approval Requested

Schema draft review complete. **No execution performed.** Waiting for your approval to proceed (or adjust) before any Phase 0 / database action.
