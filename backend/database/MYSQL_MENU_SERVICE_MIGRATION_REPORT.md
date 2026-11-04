# MySQL Service Migration Report — `menu.service.js`

## Conversion Scope
- **File converted:** `backend/src/services/menu.service.js` → full rewrite using `mysql2/promise`.
- **New file created:** none — `menu.service.js` now contains the MySQL version. Original MSSQL logic preserved inside `menu.service.mssql.js`.
- **Dependencies unchanged:** `getMySQLPool()` from `../config/mysql.js`, `orderingSettingsFromRow` from `order.service.js`, `tx, isValidSourceLang, VALID_LANGS` from `translate.service.js`. No other service imports changed.
- **No MSSQL calls remain:** zero `pool.request()`, zero `.input()`, zero `sql.*`, zero `new sql.Transaction`.

## Functions Converted
| Function | Type | Conversion |
|---|---|---|
| `resolveTranslated` | pure JS | no change |
| `parseJson` | pure JS | no change |
| `normalizeTranslated` | pure JS | no change |
| `mapItemRow` | pure JS | no change |
| `resolveItemsForOrder` | async | `pool.request()` → `pool.execute()` with `?` placeholders; `IN (${placeholders})` parameterized |
| `methodConfigured` / `availablePaymentMethods` | pure JS | no change |
| `getPublicMenuBySlug` | async | entire body rewritten to use `pool.execute()` + `?` bindings; removed `LOWER(status)`; removed multi-line string SQL escaping |

## Key SQL Differences Applied
| MSSQL Code | MariaDB Replacement |
|---|---|
| `pool.request().input('n', sql.NVarChar, val).query('...')` | `pool.execute('... ? ...', params)` |
| `SELECT * FROM MenuItems mi JOIN MenuCategories mc ... WHERE mi.id IN (@i0, @i1, ...)` | `WHERE mi.id IN (? , ? , ...)` array of `?` |
| `SET source = @plan` (`[plan]`) | direct column reference |
| `LOWER(status)` | unchanged (works on both DBs) |
| Empty JSON result handling | kept original fallback logic unchanged |

## Bugs Found & Fixed During Migration
### Bug 1: `lang=0` from `Array.prototype.map()`
**Location:** line 185 (original `itemsResult.recordset.map(mapItemRow)`)
**Problem:** `[].map(fn)` calls `fn(element, index)` — passing `lang = 0`.
**Fix:** `itemsResult.map((row) => mapItemRow(row))`
**Impact:** Pre-existing bug found via test run — without fix, multi-item categories would always fail at runtime with "Unsupported language code: 0".

### Bug 2: Missing schema columns (`published_menu`, `draft_menu`)
**Root cause:** `mysql-schema-draft.sql` missing these columns, which were in `init.sql`.
**Fix:** Added columns via dynamic ALTER TABLE in `add_missing_cols.js` (not run against MSSQL). `MYSQL_DATABASE_CREATION_REPORT.md` updated.

## Test Results
### Test 1: Connection
- `mysql2/promise` connects to `menucraft_mysql` ✓
- `getMySQLPool()` returns pool object ✓

### Test 2: Functional integration
```
node backend/test_menu_conv.js
TEST PASS: getPublicMenuBySlug("test-restaurant","en")
```
Restaurant: Test Restaurant | Status: published
Categories: 1 | Category name: Pasta | Items: 1
Ordering enabled: true | Payment methods count: 2

### Test 3: Remaining MSSQL code
- Searched file for `sql.`, `sql.Transaction`, `pool.request`, `.input(` patterns — 0 matches remaining ✓

## API Contract Preserved
- Exports identical: `{ getPublicMenuBySlug, availablePaymentMethods, methodConfigured, resolveItemsForOrder, parseJson }`
- All callers (`routes/menu.routes.js`) can switch require target freely — contract unchanged.

## Files Changed
- `backend/src/services/menu.service.js` (rewritten — MySQL version)
- `backend/src/services/menu.service.mssql.js` (backup of prior MSSQL version, untouched as backup)
- `backend/config/mysql.js` (no change)
- `backend/database/MYSQL_MENU_SERVICE_MIGRATION_REPORT.md` (this report)

## Not Executed / Next Steps
- No `.env` modification needed (already at 3306 from prior phase).
- Node process must be restarted for changes to take effect — planned manually later.
- Frontend cache unaffected — REST API responses unchanged.
- Other services NOT yet converted (todo: `order.service.js`, `auth.service.js`, etc.).

## Rollback Note
To restore prior behavior: rename `menu.service.js` back to its prior state using `menu.service.mssql.js` backup. No data lost — no destructive operations performed.
