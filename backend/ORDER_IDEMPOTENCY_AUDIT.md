# ORDER IDEMPOTENCY AUDIT — Phase 1 (READ ONLY)

## Inspected files
- backend/src/routes/order.routes.js
- backend/src/controllers/order.controller.js
- backend/src/services/order.service.js (createOrderSchema, createPublicOrder, findByIdempotencyKey)
- backend/src/services/menu.service.js
- backend/src/config/db.js (pool/transaction)

## Confirmed issue
- `POST /api/orders` with `idempotencyKey='test-idempotency-001'` produced 3 separate Orders (`ord-mw11wx...`, `ord-mw11x479...`, `ord-mw11xanx...`) — confirmed by previous `test_idempotency.js` runs.
- `findByIdempotencyKey` (line 388) does SELECT but NO unique DB constraint prevents insert.
- `createPublicOrder` (line ~78-400) calls `pool.request()` for insert; no `BEGIN TRAN` / `COMMIT` wrapper visible around lookup+insert.

## Flow trace
1. Controller validates schema (`createOrderSchema`).
2. `createPublicOrder` resolves items (`resolveItemsForOrder`), validates payment/fulfillment rules.
3. At line 380: if `parsed.idempotencyKey`, `findByIdempotencyKey` runs (SELECT only, outside transaction).
4. At line 391-337: INSERT into `Orders` with `@idempotencyKey`.
5. If INSERT fails with SQL Server unique-violation codes `2601`/`2627`, it tries lookup again (line 380 again) — but only after error; first concurrent request succeeds before second reaches insert.

## Schema / Index inspection needed
- `Orders` table: does `idempotency_key` have UNIQUE index or constraint?
- `Orders` table: does `id` (PK) have index? (yes, primary)
- Need to check `sys.indexes` / `INFORMATION_SCHEMA` for `Orders.idempotency_key`.

## Key scope question
- `findByIdempotencyKey(key)` queries `SELECT * FROM Orders WHERE idempotency_key = @key` — NO restaurant filter. This could expose another restaurant's order if same key reused globally.
- Must scope by `restaurant_id` (or `restaurantId` column) per requirements.

## Concurrent risk
- Two concurrent requests can both pass SELECT (no existing key) and both INSERT — duplicate orders — because SELECT is outside any transaction that locks the row, and there is no unique DB constraint to make second INSERT fail atomically.
- Real concurrency safety requires either:
  A. UNIQUE DB index/constraint on `(restaurant_id, idempotency_key)` + atomic INSERT (with transaction or using constraint error handling correctly), OR
  B. Application-level distributed lock (overkill for this scope).
- Requirements explicitly say: "If a unique database constraint/index, migration, or schema modification is required, STOP and request explicit approval."

## Conclusion (Phase 1)
- Root cause: missing DB unique guarantee + lookup/insert not wrapped in a transaction with proper concurrency guard.
- Smallest reliable fix requires DB index/constraint (explicit approval required).
- Current `findByIdempotencyKey` must also scope by restaurant (security fix).

No DB modifications made. No orders deleted/modified.
