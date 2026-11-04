# CART / CHECKOUT E2E — FINAL VERIFIED STATE (2026-11-03)

## Verified (direct observation + code logging)
- `/site/api-test-rest` published, menu 4 items, branch TXB accepting_orders=true.
- `Restaurants.ordering` updated to `{enabled:true, fulfillment:{delivery:true,pickup:true}, paymentMethods:{cash,cash_at_pickup,card,wallet}}`.
- Cart overlay opens; qty +/−; remove; badge; persistence across reload.
- Backend `menu.service.js`: `availablePaymentMethods` maps to `{code, label, kind, requiresConfirmation}`.
- `order.service.js` rules: delivery requires `card`/`wallet`; cash → cashier message.
- `publicCart.ts` preserved; build passes; no DB migrations; `RestaurantEmployees.user_id` NOT NULL kept.
- No invitation system; direct employee creation only.

## Not executed / not claimed PASS
- Live `POST /api/orders` submit from browser + confirmation message + cart-clear-after-success: NOT executed. Overlay and rules are verified; live submit requires user confirmation of payment/provider state (not hidden, not claimed).
- `bella` / `copperkettle`: `bella` has 0 branches / no menu; `copperkettle` has 0 menu — not usable for checkout E2E.

## Blocker resolved
- Previous blocker was `ordering = null`. Now configured. Cart/checkout is no longer a dead-end; only live order submit is documented as unverified.
