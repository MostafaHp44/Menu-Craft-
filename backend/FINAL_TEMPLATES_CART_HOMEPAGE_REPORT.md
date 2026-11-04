# FINAL TEMPLATES CART HOMEPAGE REPORT — CART E2E UPDATE

## Browser E2E Evidence (verified in browser on http://localhost:5173/menu-demo)

### PASS
- i18n fix: `menu.add` / `web.site.cart` keys added to en/ar/ku; buttons render ("Add to cart", "السلة").
- Add to Cart from menu card/row works: clicked "Add to cart" → `localStorage.cart_items` contains `seed-item-48 (Bruschetta al Pomodoro, qty 1)`.
- Cart badge updates immediately: shows 1 after add; shows 2 after quantity increase.
- Cart overlay opens on header button click (previously navigated to 404).
- Overlay lists cart items with name, price, qty, line total.
- Quantity change works: 1 → 2 → total recalculates to 18.00.
- Remove works: item removed; overlay shows "Your cart is empty."; badge returns to 0.
- Persistence across refresh: after reload, `cart_items` still contains the item; badge shows 1.
- Build passes (`3.44s`, no TS errors).

### BLOCKED / NOT VERIFABLE IN THIS ENV
- Checkout / order creation: `/site/bella` returns "Site not found — This restaurant menu is not published." The preview restaurant (`rst-bella`) is a demo entry not linked to a published restaurant site, and I will not publish a restaurant site without explicit approval. Backend `POST /api/orders` is implemented and recalculates prices server-side, but a real browser order cannot be submitted from the preview because there is no reachable published ordering page for this demo.
- Quantity/removal/order-success flow inside the published public site was not re-tested because the published page is not reachable (404).

### Fix applied to prevent the reported 404
- Cart header button in `RestaurantSite.tsx` changed from navigation link to overlay trigger.
- `SiteCartOverlay` added: items qty +/-, remove, subtotal, empty-cart state; checkout explains it requires the published ordering page.

## Exact files changed in this round
- `frontend/src/templates/site/RestaurantSite.tsx` — cart overlay, header button fix, add-to-cart from MenuRow + MenuCard via `useCartStore`, removed legacy localStorage writes.
- `frontend/src/shared/i18n/locales/ext/marketing.ts` — added `web.site.cart`, `web.site.menu.add` to en/ar/ku.
- `frontend/src/features/client/Editor.tsx`, `DashboardLayout.tsx`, `icons.tsx` — unused-import TS errors fixed (build pass).
- `publicCart.ts` unchanged (shared architecture preserved).

## What remains (blocker, not hidden)
- Full published-site checkout E2E requires a published restaurant site reachable at `/site/<slug>` with a real restaurant linked to the backend. Until then, checkout is documented as unavailable and clearly disables itself; no fake success is shown.
