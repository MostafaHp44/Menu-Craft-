BLOCKER — Index creation blocked by duplicate non-null keys.

Pre-check SQL result:
- restaurant_id = 'rest-1793437631499-27bf0'
- idempotency_key = 'test-idempotency-001'
- COUNT = 2 (duplicate from previous test orders)
- Index UX_Orders_Idempotency = NOT EXISTS
- Column idempotency_key = EXISTS

Duplicate orders (do NOT delete customer orders; these are only our test orders from previous session):
- ord-mw11waxb-0dfc6701 (first positive, idempotency_key=null initially)
- ord-mw11x479-1793e608 (idempotency test 1)
- ord-mw11xanx-76e9548f (idempotency duplicate)

To create the unique index safely, either:
A) Delete only the 3 test orders above (not real customer orders), OR
B) Leave duplicates and accept that index creation fails (cannot proceed with guarantee).

No DB changes executed. Awaiting approval before proceeding.
