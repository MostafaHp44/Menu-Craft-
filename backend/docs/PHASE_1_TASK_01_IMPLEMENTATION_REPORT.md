# PHASE 1 / TASK 01 — Implementation Report
## Customer Flow, Cart, Branding & Visual Identity

Date: 2026-11-03 · Companion audit: `backend/docs/PHASE_1_TASK_01_UX_BRANDING_CART_AUDIT.md`
Project: `D:\MBN Group\Test Menu`

---

## 1. Implemented Features

### STEP 1 — Public Restaurant Route
- **`/site/:slug` route mounted** in `frontend/src/App.tsx` → `features/public/PublicSitePage.tsx` (complete rewrite of the stub).
- Restaurant resolved automatically from the slug via existing public endpoint `GET /api/public/menu/:slug` (published-only check exists server-side: `LOWER(status) = 'published'`). **No draft exposure** — the endpoint is the published-menu surface, not `GET /api/restaurants/:id`.
- Full state handling: loading spinner, 404 not-found screen (with retry), API-failure error state, empty-menu state ("updating" panel).
- No dashboard functionality reachable from the public route; template preview is no longer the customer entry.

### STEP 2 — Customer Flow
- Guest never types a Restaurant/Branche ID — both derive from the slug/cart context.
- **Real branches** from the new public read-only endpoint (below); branch chips with live `accepting orders` state; closed branches are selectable-but-blocking (ordering disabled, browsing stays open); selection persisted in the legacy `cart_branch` key.
- **QR/table deep link:** `/site/:slug?table=12&mode=dinein&lang=ar` pre-fills fulfillment = dine-in, table number, and UI language.
- Guest language switcher in the header (EN / ع / کu) using the existing `I18nProvider` (`menucraft-lang` storage key untouched); RTL honored everywhere on the page.
- Ordering gate: restaurant-level `ordering.enabled` (backend-verified at order time) + branch-level `acceptingOrders` (frontend + data exposure) → add buttons disabled, banner shown when closed.

### STEP 3 — Cart Architecture (`features/public/publicCart.ts`, new)
- zustand store, strictly bound to a restaurant (`restaurantId` + `slug` + name persisted as `cartMeta` inside the legacy `cart_items` key). Different restaurant ⇒ cart replaced, never mixed.
- Line identity = `itemId + options signature`: identical combo increments qty in place (cap 50/line = backend max), different combos are separate lines.
- Legacy key continuity: `cart_items` (now `{cartMeta, lines[]}`, with backward-compatible read of the old plain-array format) and `cart_branch` preserved. `cart_mode` untouched (mode now managed in checkout).
- Immediate count/subtotal recompute on every add/update/remove.

### STEP 4 — Add to Cart on Every Layout
- Grid cards, featured cards, and every menu-row render a visible add button adjacent to the item (`PublicSitePage` `MenuCard`).
- Adding never navigates away; button shows `+ Add` → in-cart count → `✓ Added` feedback (1.4 s), with a focus ring when the item is in the cart.
- Items with option groups open the customization modal first — required groups are enforced before add (`REQUIRED_OPTION_GROUP` errors mirrored client-side). Options are **selection + text only** (approved: no price modification); a per-line note field exists.
- Unavailable items show a sold-out badge and disabled button (no add).
- Comfortable touch targets (≥ ~30 px), additive ring feedback for mobile.

### STEP 5 — Cart & Checkout
- Fixed the frontend/backend contract mismatch: checkout posts to the **real `POST /api/orders`** endpoint via a new typed `guestOrderAPI.create` using the exact `createOrderSchema` shape (`restaurantId` + `slug`, `customer{name,phone}`, `fulfillment ∈ delivery|pickup|table`, `deliveryAddress`, `table`, `note`, `paymentMethod` (from the restaurant's actually-configured methods), `lines[{itemId, qty, options{groupId,optionId}}]`, `idempotencyKey` (crypto.randomUUID fallback)). No `channel` sent → server default `online`. Phone/address/table requirements mirror server zod/failure rules before send.
- Server re-prices everything; delivery fee/min-order limits surfaced client-side (min-order blocks submit).
- Success panel shows order number + total + live link to guest tracking `/orders/:id?token=<orderToken>`; cart cleared only after server confirm; failures show the real backend error, cart preserved.
- Old dead demo surfaces `/menu`, `/items/:id`, `/cart`, `/checkout` unmounted (files kept on disk, no longer routed). Guest tracking page `/orders/:id` now the real token-based tracker (status stepper per backend states incl. cancelled).

### STEP 6 — Rebranding (MenuCraft → **Digital Menu**)
- Domain resolution centralized in `publicUrl(slug)` / `publicSiteLink(slug)` (`shared/lib/hooks.ts`): reads `VITE_PUBLIC_SITE_DOMAIN` (no invented domain), falls back to the deployment host; all call sites updated (Home, TemplatePreview, QrCodePage, Editor, Settings, Overview, DesignBranding, DesignPanels, DashboardLayout, ClientsTab/SubscriptionsTab via `publicUrl`, CreateWebsiteModal, MyMenu, PricingBubble, MenuDemo, SubscriptionPage).
- Wordmarks/labels rebranded: MarketingFooter, LiveLogin, LiveLayout, SignIn, AdminLogin (aria), DashboardLayout (aria + footer sentence), MenuDemo, SiteFooter of `RestaurantSite` ("Published by **Digital Menu**"), `useHomeContent` marketing copy, i18n ext packs (`marketing.ts`, `live.ts`, `authFlow.ts`, `platform.ts`, base `en.ts` `brand.name`) in **all three languages** (en/ar/ku), backend `server.js` console banner.
- API-facing: Stripe `product_data.name` → `Digital Menu {Plan} - monthly` (`backend/src/services/payment.service.js:130`).
- Sample domains (template data, previews) moved to `*.example.com`; simulated-domain copy rewritten. Download filenames renamed (`digital-menu-config.json`, `digital-menu-{period}-report.csv`).
- **Preserved untouched** (technical identifiers): storage keys `menucraft-lang`, `menucraft-demo-v1`, `menucraft-auth-v1`, `menucraft-platform-v1`, `menucraft-orders-v1`, `menucraft-uploads-v1`, `menucraft-videos-v1`, `menucraft-home-v1`, `menucraft.live.profile`, `menucraft-token`; package names; `/health` `menucraft-backend`; DB fallback name `menucraft`; i18n key name `flow.backToMenuCraft` (value rebranded); demo fixture emails `*@menucraft.demo`.

### STEP 7 — Visual Identity
- `frontend/src/index.css` `@theme` now carries the approved identity: `--color-primary: #2563EB`, `--color-primary-dark: #1D4ED8`, `--color-offwhite: #F5F3EE`, black `#111827` (`--color-charcoal`/`--color-ink` updated), and semantic `--color-success: #16A34A`, `--color-rose`, `--color-amber-dark`.
- Legacy flame-orange tokens (`--color-flame*`) are **aliased to the primary-blue family** so every existing reference (focus rings, selection, sliders, brand marks) renders blue without mass-renaming; body background = off-white.
- Public site built exclusively on platform tokens (`bg-primary`, `text-ink-ink`, `bg-offwhite`…). Restaurant-specific design colors (`r.design.*` → `rs-*` CSS vars) are untouched — custom themes still win on their own sites.

---

## 2. Modified Files

**Frontend (modified)**
| File | Change |
| --- | --- |
| `src/App.tsx` | + `/site/:slug`, real `/orders/:id` tracker; removed dead `/menu`, `/items/:id`, `/cart`, `/checkout` routes & imports |
| `src/features/public/PublicSitePage.tsx` | complete guest storefront (menu, cart, checkout, success, deep-link, lang) |
| `src/features/public/OrderTrackingPage.tsx` | real token-based tracking UI |
| `src/features/public/publicCart.ts` | **new** cart store (restaurant binding, merge, persistence) |
| `src/shared/types/public.ts` | + `PublicBranch`, `GuestOrderPayload`; fixed `fulfillment` type (object) |
| `src/shared/lib/api.service.ts` | + `menuAPI.getPublicBranches`, `guestOrderAPI`; unwrap `{ok,data}`; track typing fix |
| `src/shared/lib/hooks.ts` | configured-domain `publicUrl()` + `publicSiteLink()` |
| `src/shared/i18n/index.tsx` | + `publicUi` locale namespace merge |
| `src/shared/i18n/locales/ext/publicUi.ts` | **new** (en/ar/ku, 60+ keys) |
| `src/index.css` | approved palette tokens |
| `src/features/marketing/{Home,TemplatePreview,MenuDemo}.tsx`, `src/shared/chrome/MarketingFooter.tsx` | brand/domain rebrand |
| `src/features/{auth/SignIn,live/LiveLogin,live/LiveLayout,admin/AdminLogin? — kept}.tsx` | aria/wordmark rebrand |
| `src/features/client/{DashboardLayout,Overview,QrCodePage,Editor,SettingsPage,DesignBranding,ReportsPage,CreateWebsiteModal,MenuDemo…}` + `features/client/design/DesignPanels.tsx` | domain/brand rebrand |
| `src/templates/data/templates.ts` | sample domains → `example.com` |
| `src/templates/site/RestaurantSite.tsx` | `?? Cart` → localized cart link to `/site/:slug`; add-to-cart no longer navigates; footer brand |
| `src/shared/store/{useHomeContent,useStore}.ts` | copy rebrand |
| locales ext `marketing/live/authFlow/platform` | brand strings ×3 languages |

**Backend (modified — 3 files, minimal)**
| File | Change |
| --- | --- |
| `src/routes/menu.routes.js` | **new public route** `GET /api/public/menu/:slug/branches` (read-only; published restaurants only; `OBJECT_ID('Branches')` + `INFORMATION_SCHEMA`-filtered safe columns: id/name/address/accepting_orders; table-missing ⇒ `[]`) |
| `src/services/payment.service.js` | Stripe product name → Digital Menu |
| `src/server.js` | console banner |

**Not modified (kept intact):** `order.routes.js`/`order.service.js` business logic (guest orders already fully supported), all controllers, DB layer, `frontend/.env`/`backend/.env`, all tests fixtures.

---

## 3. API Changes
1. **New (read-only):** `GET /api/public/menu/:slug/branches` → `{ok, data: PublicBranch[]}` with only public fields (`id`, `{name en/ar/ku}`, `address`, `acceptingOrders`). 404 for unpublished restaurants. Requires server restart to activate (see §7).
2. No existing endpoint changed. Guest order creation goes through the existing `POST /api/orders` (`channel=online` default) and tracking through the existing `GET /api/public/orders/:id/track`.

## 4. Database Changes
**None.** No tables/columns added or migrated. The branches endpoint reads the existing `Branches` table defensively and degrades to an empty list when it is absent.

## 5. Tests Executed
- `node --check` ✅ on all three backend files.
- **Frontend production build (`npm run build`) ✅** — `tsc -b` clean + Vite build (572 modules; pre-existing circular-chunk/size warnings only).
- **`npm test` — 9 passed / 5 failed (14)** — the failures are exactly the 5 pre-existing ones documented in the baseline (3× Websites localized-label, 1× Websites empty-state, 1× dead-session 401). **No new failures introduced.**
- Read-only HTTP probes against the running server: `GET /api/public/menu/:slug` → 404 handling verified; service health OK.
- Manual browser/curl E2E of a real published restaurant requires a published slug + the branches route active in the running server (restart blocker below); the flow was implemented directly against the documented backend contract (`createOrderSchema`, `menu.service` payload shapes).

## 6. Build Results
- `tsc -b && vite build`: **success**. Warning (pre-existing): one chunk > 500 kB and a vendor/react circular chunk note in the manual-chunk config — untouched, non-blocking.

## 7. Known Limitations
1. **Option add-on pricing intentionally not implemented** (approved decision #2): selections with `price > 0` are accepted by the backend schema but decision says text/notes only — the UI therefore treats every group as non-priced and adds a free-text note per line. Real priced add-ons need a backend pricing decision later.
2. `Branches` is not part of the order schema server-side — `acceptingOrders` is enforced in the UI (branch bar + checkout gates). Server-side branch enforcement would require order-schema change (out of scope, no business-logic changes).
3. The offline demo editor (`RestaurantSite` preview) add-to-cart still writes simple demo lines to `cart_items` without a restaurant id — the new public store treats id-missing carts as replaceable (no mixing possible); previews no longer navigate to `/cart` (they deep-link to the real site when a slug exists).
4. Dev proxy (`vite.config.ts` → :4000) remains the Phase 8 plumbing item; the new code calls the API through `VITE_API_URL` (absolute), so it works in dev as configured.

## 8. Remaining Blockers
1. **Backend restart required (explicit approval needed)** to activate `GET /api/public/menu/:slug/branches` — the server on :3000 runs the pre-change code. Until then the frontend degrades gracefully (`branches = []` → restaurant-level ordering only).
2. Live E2E checkout (guest → confirm → track) against a real published restaurant should be performed once the server restarts: `/site/{published-slug}?table=4&mode=dinein&lang=ar` → add items → checkout (`paymentMethod: cash`) → confirm order id in DB-verified flow through the existing dashboard order list.
3. Five pre-existing frontend test failures (documented) remain out of scope.

## 9. Acceptance Cross-check vs audit AC list
AC2 ✅ (titles/wordmarks/footer) · AC3 ✅ (Stripe name) · AC4 ✅ (all strings ×3 langs, RTL) · AC5/AC6/AC7 ✅ · AC8 ✅ (merge/separate/persist) · AC9 ✅ (required customization opens modal) · AC10 ✅ (real branches, single mode UI, table capture) · AC11 ✅ (no guest-typed IDs, `online` channel, real tracking link, honest errors) · AC12 ✅ (empty state, banners gone) · AC13 ✅ (payload matches `createOrderSchema` 1:1) · AC14 ✅ (palette tokens) · AC15 ✅ (restaurant themes preserved) · AC16 ✅ (shared primitives/Choice/Field components).
A p p e n d i x   l i n e   1  
 A p p e n d i x   l i n e   2  
 # #   A p p e n d i x :   E n c o d i n g   R e p a i r   N o t e   ( p o s t - S T E P   8 )  
 -   l i v e . t s   w a s   u n t r a c k e d   ( n o   b a c k u p ) :   r e c o v e r e d   v i a   c p 1 2 5 2   b y t e - d e c o d e   t o   U T F - 8   ( h a s A r a b i c = T r u e ;   M e n u C r a f t   c o u n t   0 ) .  
 -   a u t h F l o w . t s ,   m a r k e t i n g . t s ,   p l a t f o r m . t s ,   E d i t o r . t s x   r e s t o r e d   f r o m   B A C K U P _ T e s t M e n u _ 2 0 2 6 1 1 0 2 _ 1 9 1 3 2 3   a n d   r e b r a n d e d   b y t e - s a f e l y ;   A r a b i c   p r e s e r v e d   ( h a s A r a b i c = T r u e ) ;   b a c k T o M e n u C r a f t   i 1 8 n   k e y   p r e s e r v e d .  
 -   t e m p l a t e s . t s   /   d e m o D a t a . t s   a l r e a d y   A S C I I - s a f e   ( 0   M e n u C r a f t   a f t e r   s w a p ) .  
 -   B u i l d ,   t e s t s   ( 9 / 5   b a s e l i n e ) ,   b a c k e n d   s y n t a x   a l l   c o n f i r m e d   a f t e r   r e p a i r .  
 -   R e s t a r t   b l o c k e r   s t i l l   a p p l i e s :   b r a n c h e s   e n d p o i n t   4 0 4 s   f r o m   r u n n i n g   p r e - c h a n g e   s e r v e r   u n t i l   r e s t a r t .  
 