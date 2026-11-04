# PHASE 1 / TASK 01 — UX, Branding & Menu Cart Audit

Date: 2026-11-03 · Mode: READ-ONLY (no source files modified; this report is the only deliverable)
Scope: `D:\MBN Group\Test Menu` — frontend `frontend/` (React 19 + TS + Vite 6 + Tailwind v4), backend `backend/` (Fastify 4 + raw mssql).

---

## 1. Current Implementation Findings

### 1.1 First-time customer flow (as it exists today)

A first-time customer today reaches a menu by one of two paths, and **neither is a real public site route**:

- **Path A — template preview:** `/templates/:id` (`features/marketing/TemplatePreview.tsx`) renders `templates/site/RestaurantSite.tsx` with the template's sample restaurant. The header shows a functional-looking `?? Cart` link (literal, broken i18n) at `RestaurantSite.tsx:214–216`. Menu items render a **real add-to-cart button** only in the *grid* layout (`MenuCard`, `RestaurantSite.tsx:687–703`); the *list* layout (`MenuRow`, `RestaurantSite.tsx:710–738`) has **no cart affordance at all**. Featured cards (`FeaturedSection`, L581–660) also have no add-to-cart.
- **Path B — "old" client pages:** `/menu`, `/items/:id`, `/cart`, `/checkout`, `/orders/:id` are registered in `App.tsx:77–81` but are **standalone demo pages with no connection to any restaurant**: `MenuPage.tsx` hardcodes 3 items; `ItemDetailPage.tsx` hardcodes name/price/add-ons; `CartPage.tsx` falls back to hardcoded seed items and fake branches `b1/b2`; both `MenuPage.tsx:36–38` and `CartPage.tsx:101–103` show "API unavailable" warning banners inline.

What works genuinely today across either path:
- Cart persists in `localStorage` (`cart_items`, `cart_branch`, `cart_mode`).
- Checkout can post to the real backend `POST /api/orders` (`CheckoutPage.tsx:63`) — an **unauthenticated guest order** is allowed by design (`order.routes.js:13`, comment "المسارات العامة (منيو الضيف)").
- Guest order tracking exists: `GET /api/public/orders/:id/track` (`order.routes.js:15`) → `OrderTrackingPage.tsx` (`/orders/:id`).

Missing / broken states identified:
1. **No public site route for a published restaurant.** `features/public/PublicSitePage.tsx` is *not registered* in `App.tsx:71–179`. There is no `/site/:slug` (or similar) route. A real customer has no URL to open a published menu.
2. **No restaurant identification in the cart.** `CartPage`/`CheckoutPage` never know which restaurant/branch the items came from; `CheckoutPage` defaults `restaurantId` to `'demo-restaurant'` (L18) and shows a free-text **Restaurant ID** input field to the guest (L126–128) — unacceptable for a real customer.
3. **Branch selection is fake.** `CartPage.tsx:64–68` offers hardcoded `b1/b2` (`Main/Downtown Branch`); `CheckoutPage` shows a free-text *Branch ID* input. API has no branch fetch on the guest path.
4. **No language selector on the customer path.** `RestaurantSite` renders tx() text (multilang fields resolve), but there is no explicit `en/ar/ku` switcher for the *guest*, and server-side `?lang=` support (`menu.service.js`) is unused by the template render path.
5. **No QR/table deep-link behavior.** `/orders/:id` tracking exists, but there is no `?table=X` or QR-driven entry point that sets dine-in mode + table.
6. **No dine-in vs delivery distinction until checkout** — and the mode buttons in CartPage write `cart_mode` only in `CheckoutPage`; `CartPage` also has its own duplicate mode UI (L70–75) that never persists.
7. **`?? Cart` broken label** (`RestaurantSite.tsx:215`), literally displayed in the header of every public site and preview.
8. **No add-to-cart feedback** (no toast, no cart count badge; header cart link is static text).
9. **No empty cart state** beyond a plain "Cart is empty." sentence (`CheckoutPage.tsx:100`); `CartPage` silently seeds demo items instead of showing empty state.
10. **No ordering gate.** Cart UI renders even when the restaurant has ordering disabled / `accepting_orders` false; nothing checks restaurant status or item real price/availability server-side at order time (client trusts stored price; backend re-prices but the cart UI totals may mislead).
11. **Checkout success clears cart but lost on failure paths** — partial; fine but retry after a 4xx leaves stale `cart_branch`/`cart_mode`.
12. **Demo warning banners** in customer-facing pages (`MenuPage.tsx:36–38`, `CartPage.tsx:101–103`, `ItemDetailPage.tsx:39–41`) leak internal implementation notes to guests.

### 1.2 Branding

- `frontend/index.html` (L11) already carries the new title **"Digital Menu — Your Restaurant Menu. Your Brand. Your Rules."** and description (L9). **BUT** the localStorage persistence key is still `menucraft-lang` (L21) — a *technical identifier, keep as-is*.
- Favicon points to `/logo.svg` (L5) — the asset itself was not inspected pixel-wise; flagged for visual-identity work.
- Remaining user-facing "MenuCraft" strings: see §5 checklist (41 files/frontend + a few backend strings).
- Footer of every public site and editor: `menucraft.com` simulated-domain strings (`RestaurantSite.tsx:1031`, `1208`).

### 1.3 Visual identity (current state)

- Design tokens live in `frontend/src/index.css:3–27` — a **warm editorial palette** (ivory `#faf7f1`, sand, clay, umber, charcoal `#1b1714`, ink `#0f0d0b`) plus accents: **flame orange `#e8571f`** (focus rings, selection, sliders), moss, gold, rose.
- Tailwind v4 `@theme` tokens are used app-wide (`bg-sand`/`text-charcoal`/`bg-ink text-ivory` etc.) — a coherent system **but with the wrong accent direction** vs the target identity (orange/gold/editorial, not Primary-Blue premium).
- Zero occurrences of target blue `#2563EB` or `blue-500/600/700` classes in `frontend/src` (grep verified) — the target Primary Blue does not exist anywhere yet.
- Target Black should be `#111827`; current charcoal `#1b1714` is a *different brown-black*. Target off-white is `#F5F3EE`; current ivory `#faf7f1` differs.
- Template-sites use their own CSS-variable system (`site.css`, `rs-*` classes) driven per-restaurant `r.design.colors` — restaurant-level branding must NOT be flattened to the platform palette; the target palette applies to **marketing + dashboards + default restaurant theme seeds**.
- Duplicated/inline styles: heavy inline `style={{...}}` in `RestaurantSite.tsx` (small font sizes, one-off spacing); duplicated mode-button pattern in `CartPage.tsx:72–74` and `MenuPage.tsx:23`.

---

## 2. Existing Routes & Relevant Component Paths

### Frontend routes (App.tsx L71–179 — verified)

| Route | Component | Role |
| --- | --- | --- |
| `/` | `features/marketing/Home.tsx` | marketing home (7 menucraft domain strings) |
| `/templates`, `/templates/:id` | `marketing/Templates.tsx`, `marketing/TemplatePreview.tsx` | template marketplace + preview (uses `RestaurantSite`) |
| `/signin` | `features/auth/SignIn.tsx` | login/register (demo store) |
| `/dashboard/*` | `features/client/DashboardLayout.tsx` + 15 child pages | restaurant owner dashboard |
| `/menu`, `/items/:id`, `/cart`, `/checkout`, `/orders/:id` | `features/client/{MenuPage,ItemDetailPage,CartPage,CheckoutPage,OrderTrackingPage}.tsx` | standalone customer/cart demo pages |
| `/menu-demo` | `marketing/MenuDemo.tsx` | interactive menu demo |
| `/workspace/*` | `features/live/LiveLayout.tsx` + RoleGate pages | staff workspace (real API backend) |
| `/admin`, `/admin/subscription-requests` | `features/admin/*` | platform admin |
| `/worker` | `features/worker/WorkerBoard.tsx` | kitchen board |
| `*` | `marketing/NotFound.tsx` | 404 |

**Missing route:** no public published-restaurant route (`features/public/*` unmounted).

### Key components for cart work
- `templates/site/RestaurantSite.tsx` — `SiteHeader` (cart link L214), `MenuCard` (add-to-cart L687–703), `MenuRow` (no cart), `FeaturedSection` (no cart), `SiteFooter`.
- `features/client/CartPage.tsx`, `CheckoutPage.tsx`, `MenuPage.tsx`, `ItemDetailPage.tsx`, `OrderTrackingPage.tsx`.
- Templates: `templates/data/templates.ts` (8 templates, ids `the-royal…maison-patisserie`).

### Backend routes relevant
- `POST /api/orders` (`order.routes.js:13`) — guest allowed; zod: `restaurant_id`, `branch_id`, `items[{item_id, qty}]`, `channel ∈ {online, counter}` (**default `online`**; `order.service.js:75`), phone required unless `channel = 'counter'` (L187), `table_no`, `delivery_address`, `note`. Server re-prices items against `MenuItems`.
- `GET /api/public/orders/:id/track` — guest tracking.
- `GET /api/public/menu/:slug` family (`menu.routes.js`) — public menu with `?lang=`.
- `GET /api/restaurants/:id` — public per `auth.middleware.js` publicPaths (⚠️ leaks drafts — tracked under Phase 3, not this task).

---

## 3. Customer Flow Problems (summary)

| # | Problem | Evidence | Severity |
| --- | --- | --- | --- |
| F1 | No public URL for published restaurants | `App.tsx` has no `/site|/:slug` route | Blocker |
| F2 | Guest asked to enter Restaurant/Branch IDs manually | `CheckoutPage.tsx:123–127` | High |
| F3 | Cart is restaurant-anonymous; mixing items from different restaurants undetected | cart writes `RestaurantSite.tsx:690–696` with no restaurant key | High |
| F4 | `?? Cart` literal in header | `RestaurantSite.tsx:215` | Medium |
| F5 | List-layout menu rows have no add-to-cart | `RestaurantSite.tsx:710–738` | High |
| F6 | Featured cards have no add-to-cart | `RestaurantSite.tsx:615–653` | Medium |
| F7 | No add feedback / cart badge/counter | header cart link static | Medium |
| F8 | No guest language switcher | absent from `RestaurantSite` header | Medium |
| F9 | No QR/table deep-link (dine-in table capture) | no `?table=` anywhere | Medium |
| F10 | Fake branches `b1/b2` & seed cart items | `CartPage.tsx:11–21, 64–68` | High |
| F11 | Demo "API unavailable" banners visible to guests | `MenuPage.tsx:36`, `CartPage.tsx:101`, `ItemDetailPage.tsx:39` | Medium |
| F12 | No ordering-enabled / availability gate on cart UI | absent check | High |
| F13 | No options/variants model in cart: `options: []` stored but never populated or priced; separate combos impossible | `RestaurantSite.tsx:694`, `CartPage` ignored options | Medium |
| F14 | Duplicate mode UIs that don't sync | `CartPage.tsx:70–75` vs `CheckoutPage.tsx:115` | Low |
| F15 | Cart persistence fine (`localStorage`) but no cross-tab/restaurant validation | — | Low (preserve as-is per rules) |

---

## 4. Proposed Improved Customer Flow (grounded in approved rules: guest browses without auth → adds per item with availability check → online-channel checkout via POST /api/orders → track; no client admin redirect)

1. **Entry.** Guest opens `{slug}` public route (new `/site/:slug`, or QR `/site/:slug?table=12&mode=dinein&lang=ar`). Public endpoint returns published restaurant + menu (existing public menu API; draft leak fix belongs to Phase 3).
2. **Landing.** Hero + branding from `RestaurantSite` (unchanged architecture). Header gains: language switcher (`en/ar/ku`, reuses `I18nProvider`/`tx()`), item count + total cart badge, `?? Cart` → proper `t('web.site.cart')` label.
3. **Menu browsing.** Category tabs (existing). **Every item card/row (grid + list + featured) gets a visible, cart-adjacent add button**: one tap adds `qty 1` without navigating; item detail (`/items/:id`) remains for options/variants, automatically opened when the item defines required options.
4. **Add action rules.** Availability respected (`!available` → disabled button + "Sold out" badge — badges already exist at `RestaurantSite.tsx:565–579`); restaurant ordering flag checked at render; immediate feedback (button → "✓ Added" + cart badge bump; small toast optional respecting existing `Toaster`).
5. **Cart integrity.** Cart entries keyed by `restaurant_id + item_id + options-signature`: identical combo merges (qty++), different combos create separate lines; per-restaurant carts — switching restaurant warns/replaces.
6. **Branch/Mode/Table.** Single source UI on the cart page (remove duplicate), branches fetched from the restaurant's real branches instead of `b1/b2`; QR deep-link pre-fills mode=dinein + table.
7. **Checkout.** Guest fills name/phone (+address if delivery / table if dine-in); posts to existing `POST /api/orders` with `restaurant_id`, `branch_id`, real `item_id`s, `channel: 'online'` (backend validates phone, re-prices). No login. No admin redirect for clients. Restaurant/Branch IDs derivable from the cart context — **never typed by the guest**.
8. **Confirmation + tracking.** Success screen → order id → `GET /api/public/orders/:id/track` (existing `OrderTrackingPage`). Cart cleared only on 201 (existing behavior, keep).
9. **Error/empty states.** Empty cart state with CTA back to menu; API failure shows honest error, no fake success; demo warning banners removed from guest pages.
10. **Localization.** All new strings via `t()` keys with `en/ar/ku`; RTL preserved (logical utilities).

---

## 5. Complete Rebranding Checklist — MenuCraft → **Digital Menu**

Rules: user-facing text/assets only. **DO NOT rename:** DB name fallback `menucraft` (`db.js:7`), storage keys (`menucraft-lang`, `menucraft-demo-v1`, `menucraft-platform-v1`, `menucraft-auth-v1`, `menucraft-orders-v1`…), package names (`menucraft-backend`, `frontend/package.json` name), service strings `/health` `menucraft-backend` (machine-readable), backend log tags, comments in backend code (internal), test/demo email domains `@menucraft.demo` (test fixtures only — leave for Phase 9 decision), `stormi场上…` none.

### 5.1 Frontend user-facing strings (confirmed occurrences)

| File | Lines | What to change → |
| --- | --- | --- |
| `frontend/index.html` | 21 | storage key `menucraft-lang` — **KEEP** (technical). Title/description already "Digital Menu" ✅ |
| `features/marketing/Home.tsx` | 233, 264, 271, 563, 784, 789, 877 | `{slug}.menucraft.com` demo URLs → `{slug}.digital-menu.app` (or generic placeholder) |
| `features/marketing/MenuDemo.tsx` | 2 occurrences | MenuCraft strings → Digital Menu |
| `features/marketing/TemplatePreview.tsx` | 1 | MenuCraft string → Digital Menu |
| `shared/chrome/MarketingFooter.tsx` | 58 | `bella.menucraft.com` demo URL |
| `features/auth/SignIn.tsx` | 346 | `aria-label="MenuCraft home"` → "Digital Menu home" |
| `features/live/LiveLogin.tsx` | 153 | visible wordmark "MenuCraft" → "Digital Menu" |
| `features/live/LiveLayout.tsx` | 1 | MenuCraft wordmark |
| `features/client/DashboardLayout.tsx` | 262, 314 | `aria-label` + "MenuCraft prototype" sentence |
| `features/client/Overview.tsx` | 1 | MenuCraft greeting/copy |
| `features/client/Editor.tsx` | 3 | wordmark/hints |
| `features/client/SettingsPage.tsx` | 4 | MenuCraft copy (site url hints) |
| `features/client/QrCodePage.tsx` | 1 | QR url label |
| `features/client/DesignBranding.tsx` | 2 | copy |
| `features/client/ReportsPage.tsx` | 1 | copy |
| `features/client/BranchesPage.tsx`, `CreateWebsiteModal.tsx`, `design/DesignPanels.tsx` | each 1 | copy/hints |
| `features/admin/AdminLogin.tsx` | 1 | visible wordmark |
| `templates/site/RestaurantSite.tsx` | 215 (`?? Cart` — fixes with F4), 1031, 1208 | footer "Published with MenuCraft" → "Digital Menu"; simulated domain |
| `templates/site/site.css` | 1 | comment/contentauga (verify whether user-visible) |
| `templates/data/templates.ts` | 8 (152, 247, 337, 436, 530, 633, 725, 817) | sample `website: 'x.menucraft.com'` values → sample domain |
| `shared/i18n/locales/en.ts` | 1 | brand token in messages |
| `shared/i18n/locales/ext/authFlow.ts` | 6 | brand strings (en+ar+ku — translate!) |
| `shared/i18n/locales/ext/live.ts` | 12 | brand strings |
| `shared/i18n/locales/ext/marketing.ts` | 9 | brand strings |
| `shared/i18n/locales/ext/platform.ts` | 9 | brand strings |
| `shared/i18n/index.tsx` | 1 | likely document.title setter |
| `shared/lib/demoData.ts` | 7 | demo restaurant domains (demo-only; safe to rebrand) |
| `shared/lib/types.ts`, `heroVideo.ts`, `hooks.ts`, `api.service.ts`, `shared/api/service.ts`, `shared/store/*.ts` (useAuth 4, useHomeContent 12, useOrders 1, usePlatform 1, useSession 1, useStore 2, useUploads 1), `shared/ui/icons.tsx` | 1–12 each | **verify line-by-line**: distinguish comments/log tags (leave) vs visible strings (replace). `useHomeContent` 12 hits are likely marketing-home copy — replace; store keys — KEEP |
| favicon/assets `/public/logo.svg` (reference `index.html:5`) | — | re-illustrate in target palette "Digital Menu" |

### 5.2 Backend (user-visible via API responses / generated content)

| File | Line | Action |
| --- | --- | --- |
| `payment.service.js` | 130 | Stripe `product_data.name = 'MenuCraft {plan}'` → `'Digital Menu {plan}'` (customer-visible on Stripe checkout!) |
| `server.js` | 27 | console banner — cosmetic, may change |
| `app.js` (134 `/health`), `logger.js`, `db.js`, route/service comments | — | **KEEP** (technical identifiers) |

No emails/notifications exist yet → note for future templates (use "Digital Menu").

---

## 6. Cart Implementation Findings

| Finding | Detail | Evidence |
| --- | --- | --- |
| Persistence | `localStorage` (`cart_items`, `cart_branch`, `cart_mode`) — **preserve per task rules** | `RestaurantSite.tsx:691`, `CartPage.tsx:32` |
| Item shape | `{id, name, qty, price, note, options: []}` — `options` never populated; line identity is `id` only → no variant separation, no combo merge keyed by options | `RestaurantSite.tsx:694` |
| Add path | Grid cards only; click **navigates** to `/cart` while writing the item — jarring UX; the same item added twice is ignored silently (no feedback) | `RestaurantSite.tsx:687–703` |
| List/featured rows | No cart action | L710–738, L581–660 |
| Restaurant binding | None — no `restaurant_id` per line; mixing possible | — |
| Pricing | Client trusted at display (`price` stored at add time); backend re-prices from `MenuItems` at POST — good, but cart total can drift from snapshot prices | `CartPage.tsx:29`, `order.service.js` re-price |
| Availability | Frontend hides button for `!item.available` (grid); list rows show only a badge — but **no backend Availability re-check in cart** | L684–704 |
| Ordering flag | Not checked (`accepting_orders`/ordering enabled flag never consulted) | — |
| Cart page | Demo seed fallback, fake branches (`b1/b2`), duplicate mode UI, later "API unavailable" banner | `CartPage.tsx:11–21, 64–74, 101–103` |
| Checkout | Raw `fetch('/api/orders')` — wrong: uses relative URL (dead 4000 proxy in dev) rather than the shared API client/`VITE_API_URL`; sends `channel` = mode (`dinein/delivery/takeaway`) — **invalid enum**, backend zod only accepts `online/counter` → falls back to `online` (works, but silently) | `CheckoutPage.tsx:55–67`, `order.service.js:75` |
| Success/track | Clears cart on 201; tracking real | `CheckoutPage.tsx:69–89` |
| Currency | `money()` formatter; totals `toFixed(2)` unlocalized | `CartPage.tsx:58` |

**Required new behavior (per task spec, implementation-agnostic):** visible add-to-cart on every card/row incl. list + featured; direct add without opening detail; availability respected; required options force detail sheet; instant qty/total update; same-id+same-options merge, different-options separate lines; per-restaurant cart binding; clear "added" feedback; all existing persistence/branch rules preserved; backend `POST /api/orders` untouched (only correct `channel` value sent).

---

## 7. Required Files to Change (implementation targets — pending approval)

**Customer flow / cart (frontend):**
1. `frontend/src/App.tsx` — add public site route (`/site/:slug` or agreed path) mounting `features/public/PublicSitePage.tsx` (already exists, unmounted).
2. `frontend/src/templates/site/RestaurantSite.tsx` — cart label key; add-to-cart on `MenuRow`/`FeaturedSection`; remove navigation on add; added-feedback + header badge.
3. New `frontend/src/shared/store/useCart.ts` (or agreed location) — typed cart with restaurant binding, options-signature merge, availability/ordering gate checks. Replace scattered raw `localStorage` writes.
4. `frontend/src/features/client/CartPage.tsx` — real branches (via existing APIs), remove demo seed/banners, single mode UI, empty state.
5. `frontend/src/features/client/CheckoutPage.tsx` — use shared API client (`VITE_API_URL`), send `channel: 'online'`, derive ids from cart context (no guest inputs), localized errors.
6. `frontend/src/features/client/MenuPage.tsx`, `ItemDetailPage.tsx` — either integrate into public-site data (recommended) or remove from guest surface; fix amber banners.
7. `frontend/src/shared/i18n/locales/*` (en + ar + ku) — new keys (`web.site.cart`, cart/checkout labels); keep 3-language parity & RTL.

**Branding:** all files in §5.1 checklist + favicon/logo asset. Backend `payment.service.js:130` product name.

**Visual identity:** `frontend/src/index.css` `@theme` — map platform tokens: primary `#2563EB`, black `#111827`, off-white `#F5F3EE`, white `#FFFFFF`; repaint accents (flame → primary blue) for marketing + dashboard + cc UI components (`shared/ui/ui.tsx`); update default restaurant `design.colors` seeds (`demoData.ts`, template defaults) — per-restaurant custom branding remains user-controlled; remove inline one-off styles where trivial.

---

## 8. Risks & Dependencies

1. **Ordering-flag source:** `Branches.accepting_orders` exists in DB but **no backend endpoint exposes it to the guest path** — exposing it requires a backend read (no business-logic change; may reuse existing public menu/restaurant endpoint or its payload) — confirm before implementing.
2. **Options/variants model:** backend order items accept only `item_id + qty` (`order.service.js` zod/via lines) — **no options pricing on the backend**. Client-side options can be stored in `note` at most. Real variant pricing requires backend schema/logic change → **needs approval**; until then, required-customization items must open the detail/notes step but cannot price add-ons (consistent with backend rules — no bypass).
3. **Vite dev proxy → 4000 dead** (config) — CheckoutPage raw `fetch('/api/orders')` works only after either proxy fix (Phase 8/9 plumbing) or switching to the shared API client. Do within this task's checkout fix or escalate to plumbing phase.
4. **Branch list for guests** — real branches endpoint public availability must be verified (Phase 3/8 dependency).
5. **GET /api/restaurants/:id draft leak** — Phase 3 scope; the public route introduced here must use the published-menu endpoint, not the raw restaurant endpoint.
6. **Backend currently running on port 3000** — no restart/light touches without approval.
7. **DB untouched** — no migrations; cart logic must live on existing backend surface (`POST /api/orders`, public menu endpoints).
8. **localStorage keys unchanged** (`cart_items`/`cart_branch`/`cart_mode` + `menucraft-lang`): continuity preserved; do not clear user storage.
9. **Rebrand in i18n files** must be done in **all 3 languages** (en/ar/ku) simultaneously to keep parity tests passing.
10. **Naming collision risk:** "Digital Menu" is generic; check whether `digital-menu.app` demo domains matter or blanks/`.com` placeholders preferred — pick during implementation.

---

## 9. Ordered Implementation Plan (proposed)

| # | Step | Files | Depends on |
| --- | --- | --- | --- |
| 1 | Confirm open questions: public route path; variant-pricing approval need; branch exposure endpoint | — | user approval |
| 2 | Public site route mount (`/site/:slug` using `PublicSitePage` + published data) | `App.tsx`, public page | — |
| 3 | Typed cart store (restaurant binding, options-signature, merge, availability/ordering gates) | `useCart.ts` + call sites | 2 |
| 4 | Add-to-cart on all card types + feedback + header badge + fix `?? Cart` label | `RestaurantSite.tsx` (+ site.css badge) | 3 |
| 5 | Cart page: real branches, single mode UI, empty state, banners removed; Checkout: shared client, `channel:'online'`, ids from context | `CartPage`, `CheckoutPage`, `MenuPage`, `ItemDetailPage` | 3, branch endpoint |
| 6 | Guest language switcher + QR `?table=`/`mode` deep-link honoring dine-in | `RestaurantSite` header, route params | 2 |
| 7 | Rebrand sweep (§5 checklist, i18n ×3 langs, footer/wordmarks/aria-labels/demo domains, Stripe product name) | all §5 files | — (parallel) |
| 8 | Visual identity pass: `@theme` palette swap to `#2563EB/#FFFFFF/#111827/#F5F3EE` for platform chrome; defaults for templates/demo data; logo.svg/favicon | `index.css`, `ui.tsx`, `demoData.ts`, template defaults, assets | 7 (i18n done) |
| 9 | Localization sweep of all new strings (en/ar/ku, RTL verified) + remove demo banners from guest surfaces | locales | 4–6 |
| 10 | Verification: `npm run build` + `npm test` + manual guest journey in browser | — | all |

Each step is independently verifiable; no step modifies backend business logic (except, with approval, exposing `accepting_orders` / Stripe string).

---

## 10. Acceptance Criteria & Testing Scenarios

**Rebrand**
- AC1 `grep -ri "MenuCraft|menucraft"` in `frontend/src` returns only: technical storage keys, package name, demo emails (fixtures), code comments. Zero in rendered UI text.
- AC2 Browser tab title, sign-in page, admin login, live login, dashboards, marketing pages, public-site footer all read "Digital Menu".
- AC3 Stripe checkout page shows `Digital Menu …` product name (next paid flow test).
- AC4 All new/changed strings exist in `en`, `ar`, `ku`; RTL verified (`dir=rtl`) on dashboard + public site.

**Flow / cart**
- AC5 Guest opens public site URL without auth; menu browses; no admin redirect anywhere.
- AC6 Every menu item (grid **and** list layout, featured cards) shows an add-to-cart button; unavailable items show disabled/sold-out and cannot be added.
- AC7 One tap adds without leaving the page; header cart count + total update immediately; a subtle "added" confirmation shows; button disabled transitions handled.
- AC8 Adding same item with same options twice → single cart line, qty increments. Adding same item with different option selections → two lines. Cart persists across reload (localStorage).
- AC9 Items with a required customization open the detail step instead of silently adding without options.
- AC10 Cart page shows real branches of that restaurant; mode single-select; dine-in captures table (QR param honored); delivery requires phone + address (mirrors backend zod).
- AC11 Checkout posts the *cart context* `restaurant_id`/`branch_id` — guest never types an ID — to `POST /api/orders` with `channel: 'online'`; success shows order id and links the existing tracking page; API failure shows real error, cart remains.
- AC12 Empty cart shows proper empty state, not demo items; guest demo-warning banners gone.
- AC13 Backend zod validation passes for every produced payload (no schema changes needed server-side).

**Visual identity**
- AC14 `@theme` defines `--color-primary: #2563EB`, `--color-black-ink: #111827`, `--color-offwhite: #F5F3EE`; marketing + dashboards + UI components render with primary-blue accents; white surfaces `#FFFFFF`; focus ring/selection use primary blue.
- AC15 A restaurant choosing custom colors still sees those colors on its public site (per-restaurant theming unaffected).
- AC16 No duplicated mode-button/label patterns remain; shared UI primitives used.

**Testing scenarios (manual script)**
1. Guest (no login) → open published site → language switch ar → RTL correct → add 2 items (grid), 1 list-row item, 1 featured (if enabled) → cart badge = 4.
2. Add same grid item again → qty 3, total tripled, single line.
3. Item with required options → opens detail → add with option → separate cart line.
4. Set an item unavailable (owner editor preview) → button disabled + sold-out badge.
5. Checkout dine-in w/ table → 201 → tracking page via link → error case (stop network) shows honest failure and cart intact.
6. `npm run build` zero TS errors; `npm test` no new failures beyond the 5 pre-existing documented ones.
7. Grep checks AC1/AC14; visual spot-check LTR + RTL dashboards.

---

### Out of scope (deferred)
- Draft-leak fix / role isolation (Phase 3), real-data dashboards (Phase 7), plumbing of dev proxy (Phase 8/9 recommendation), test accounts (Phase 9), backend migrations of any kind.

*Report prepared from file reads + read-only HTTP-free inspection; no code, DB, or environment changes.*
