# ORDER IDEMPOTENCY FIX — Phase 2 Design / Approval Gate

## Root Cause (from ORDER_IDEMPOTENCY_AUDIT.md)
- `Orders.idempotency_key` has NO index or unique constraint (only PK on `id`).
- `findByIdempotencyKey` does SELECT without restaurant scope.
- `createPublicOrder` does lookup + insert without transaction lock; concurrent requests pass SELECT then both INSERT.
- Previous test (`test_idempotency.js`) created 3 orders with same key `test-idempotency-001`.

## Required DB Change (explicit approval needed)
CREATE UNIQUE NONCLUSTERED INDEX / CONSTRAINT on `Orders` scoped by restaurant:
- Option A (recommended): `CREATE UNIQUE INDEX UX_Orders_Idempotency ON Orders (restaurant_id, idempotency_key)`
- Option B: `ALTER TABLE Orders ADD CONSTRAINT UQ_Orders_Idempotency UNIQUE (restaurant_id, idempotency_key)`

Why scoped by restaurant: requirements specify different restaurants must have independent key scopes; also prevents exposing another restaurant's order.

If approved:
- Update `findByIdempotencyKey` to include `restaurant_id` filter (`SELECT ... WHERE restaurant_id = @restaurantId AND idempotency_key = @key`).
- Preserve transaction/lookup logic; rely on DB unique constraint to atomically block duplicates.
- If INSERT hits unique-violation `2601`/`2627`, lookup existing order by restaurant+key and return it.
- If payload differs (different item/qty/fulfillment) but same key + restaurant, return 409 (conflict) — requires comparing payload or using a hash; smallest reliable: compare key + restaurant + critical payload fields; if different, 409.

## Blocked (no execution)
- NO `CREATE INDEX` / `ALTER TABLE` executed yet.
- NO existing orders modified/deleted.
- Waiting for explicit approval.
