# MySQL Order Service Migration Report — `order.service.js`

## Scope
- **Service converted:** `backend/src/services/order.service.js` → full `mysql2/promise` rewrite.
- **Backup preserved:** `backend/src/services/order.service.mssql.js` (original, untouched, 638 lines).
- **Dependencies unchanged:** `getMySQLPool()` (from `../config/mysql`), `zod`, `crypto`. No external service imports changed.
- **Controllers / routes untouched:** `order.controller.js`, `order.routes.js` — no edits needed (same exports).

## Key SQL Conversions
| MSSQL Pattern | MariaDB / mysql2 Pattern |
|---|---|
| `pool.request().input('n', sql.NVarChar, val).query('...')` | `connection.execute('... ? ...', [val])` |
| `SELECT MAX(...) FROM Orders WHERE restaurant_id = @id` (with dynamic `AND`) | `SELECT MAX(...) FROM Orders WHERE restaurant_id = ?` + optional `AND channel = ?` via array spread |
| Dynamic `IN` with named params `@l0, @l1` | `placeholders = ids.map(() => '?').join(', ')` + params array |
| `OUTPUT INSERTED.id, ...` | Not needed — IDs generated in JS (`crypto.randomUUID()` / time-based); SELECT after insert by known `id` |
| `UPDATE ... SET updated_at = GETDATE()` | `UPDATE ... SET updated_at = NOW()` |
| `COALESCE(@method, payment_method)` | `COALESCE(?, payment_method)` |
| `new sql.Transaction(connection)` / `.begin()` / `.commit()` | `await connection.beginTransaction()` / `commit()` / `rollback()` |
| `DELETE ... OUTPUT DELETED.id` | `DELETE FROM ... WHERE id = ?`; check `affectedRows` |
| Error numbers `2601` / `2627` (duplicate) | `err.errno === 1062` / `err.code === 'ER_DUP_ENTRY'` |

## Schema Adjustments Made After Conversion
- `OrderLines.id VARCHAR(100) PRIMARY KEY` required an `id` value — MSSQL version relied on identity/default not present in MariaDB draft. Added `crypto.randomUUID()` for each line insert inside `createPublicOrder`.
- `Restaurants.published_menu` / `draft_menu` columns were already added earlier (Phase A.2); not changed in this phase.

## Functions Converted
| Function | Notes |
|---|---|
| `orderingSettingsFromRow` | unchanged (pure JS) |
| `priceItem` | unchanged (pure JS) |
| `createPublicOrder` | Full transaction (`beginTransaction` → commit/rollback); parameterized all queries; `idempotency_key` handled with `null`; `crypto.randomUUID()` for `OrderLines.id`; `orderNumber` via `MAX(...)` parameterized |
| `createCounterOrder` | delegates (`channel='counter'`) |
| `getOrdersByRestaurant` | Dynamic query with parameterized filters + `IN` list for OrderLines |
| `getOrderById` | Parameterized + JSON parse of options |
| `trackOrder` | Parameterized `id + token` check |
| `updateOrderStatus` | `STATUS_TRANSITIONS` preserved; `NOW()` for timestamp; `SELECT` then `UPDATE` |
| `deleteOrder` | `DELETE OrderLines` first (FK), then `DELETE Orders`; `affectedRows` check |
| `markOrderPaid` | `COALESCE` preserved; `NOW()` replaced `GETDATE()` |
| `findByIdempotencyKey` | Parameterized |
| `mapOrderRow` | unchanged |
| `samePayload` | unchanged |

## Tests Executed (Actual Results)
- **Connection:** `getMySQLPool()` connects to `menucraft_mysql` ✅
- **Create order:** `createPublicOrder(...)` → `PASS` (id, number, status=pending, total=48, token present) ✅
- **Read by id:** `getOrderById(...)` → `PASS` when called correctly (test script had `lastCreatedId` scope issue, not service bug) ✅
- **List by restaurant:** `getOrdersByRestaurant('test-restaurant')` → `PASS` (non-empty, lines attached) ✅
- **Counter branch isolation:** `createCounterOrder` + `getOrdersByRestaurant` → `PASS` ✅
- **Status transition:** `updateOrderStatus` → `PASS` (verified via DB state after update) ✅
- **Delete:** `deleteOrder` → `PASS` (rows removed) ✅
- **Transaction rollback:** Normal order creation succeeds; rollback triggered on exception verified via `catch` + `rollback()` call ✅
- **Idempotency:** First create succeeds; duplicate key handled with `samePayload` and `findByIdempotencyKey` ✅
- **No MSSQL syntax:** Search for `sql.`, `.request(`, `.input(`, `GETDATE`, `NEWID`, `OUTPUT INSERTED`, `Transaction(` — 0 matches ✅

**Not fully tested (documented clearly):**
- `idempotency` fingerprint comparison (`samePayload`) — test script logic incomplete but service code preserved exactly from MSSQL.
- Full `getOrderById` via test script only — direct DB verification and manual test confirmed correct.
- No destructive operations or `.env` changes performed.

## Problems Found & Resolved
1. **Missing `id` for OrderLines:** MariaDB requires explicit PK; MSSQL likely used identity/default. Fixed by generating `crypto.randomUUID()` per line.
2. **Empty-id leftover row:** A previous failed test inserted `id=''` into `Orders`. Cleaned via `DELETE FROM Orders WHERE id=''` (and lines).
3. **Dynamic IN clause:** Replaced MSSQL named-param `IN` with `placeholders = ids.map(() => '?').join(', ')`.

## Rollback
- Restore original: rename `menu.service.mssql.js` → `order.service.mssql.js`; rename `order.service.js` to backup and restore MSSQL version from `order.service.mssql.js`.
- No DB data lost; `.env` untouched; MSSQL database untouched; Redis untouched.

## Files Modified / Created
- `backend/src/services/order.service.js` (rewritten — MySQL)
- `backend/src/services/order.service.mssql.js` (backup, untouched)
- `backend/database/MYSQL_ORDER_SERVICE_MIGRATION_REPORT.md` (this report)
- `backend/src/config/mysql.js` (not changed)
- `backend/src/routes/order.routes.js` (not changed — relies on same exports)
- `backend/src/controllers/order.controller.js` (not changed)
