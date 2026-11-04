# PUBLIC SITE DATA SOURCE AUDIT — 2026-11-03 (READ ONLY)

## Method
- Read `RestaurantSite.tsx`, `templates.ts`, `getTemplate()`, `MenuDemo.tsx`, `App.tsx`, DB via SQL SELECT.
- No DB modifications; no code edits during audit.

## Source mapping (for visible fields on `/site/tecnoworld`)

| Visible field | Actual source | Evidence |
|---|---|---|
| Template/Design | `getTemplate('urban-cafe')` from DB `templateId` | DB: `templateId='urban-cafe'`; code `getTemplate()` at lines 235/384/451/525/1144/1163 |
| Colors (`#E8571F` etc.) | `r.design` JSON (DB `design` column) | DB `design` JSON parsed by `designVars()`; browser shows accent applied |
| Sections enabled (featured/menu/about/gallery/hours/contact) | `r.design.sections` DB JSON | DB `design` has all `enabled: true` |
| Restaurant name (`Bella Italian Kitchen`) | DB `name_en` (WRONG for tecnoworld) | SQL: `slug='tecnoworld'` → `name_en='Bella Italian Kitchen'`; `RestaurantSite` `path="name"` uses `r.name` |
| Template label (`Bella Italia`) | TemplateDefinition `name` (only used as chip fallback) | `templates.ts` line 501: `name: 'Bella Italia'`; `SiteHero` chip fallback = `getTemplate(r.templateId).category` |
| Hero title / tagline | DB `name` / `tagline` (missing/empty for tecnoworld; falls back to template?) | `SiteHero` uses `r.name` / `tagline` directly; if DB empty, `Ed` shows nothing — NO template override for hero title |
| Hero image | DB `heroImage` (likely null/empty) | `SiteHero` `src={r.heroImage}`; if empty, no image shown |
| Featured products | DB `r.menu` (from `published_menu`) — shows Bella items | `FeaturedSection` uses `r.menu.flatMap`; DB `published_menu` = Bella JSON (`Antipasti`, `Bruschetta`, etc.) |
| Menu categories / items | DB `published_menu` (Bella JSON) — NOT `MenuItems` table for tecnoworld | `MenuSection` uses `r.menu`; DB `published_menu` contains `cat-mvwapvrl-1` (New category) with copies; but earlier browser snapshot showed `Antipasti`, `Pasta`, `Pizza` etc. — those come from `published_menu` stored as Bella data |
| About/Story (`description`) | DB `r.description` | `AboutSection` `path="description"`; DB `description_*` likely empty for tecnoworld |
| Gallery | DB `r.gallery` (likely empty/null) | `GallerySection` only if `r.gallery.length > 0`; empty = hidden |
| Opening hours | DB `r.hours` | `HoursSection` uses `r.hours`; if empty, shows `copy.hours` fallback only |
| Phone / Email / Address | DB `r.phone`, `r.email`, `r.address` | `ContactSection` uses `r.phone`, `r.email`, `r.address`; `SiteFooter` uses `r.phone` / `r.email` |
| Navigation links | `nav` derived from `enabled` sections + `anchor(id)` using `prefix`; links point to `#rs-menu` etc. — NOT `/menu-demo#...` unless `prefix='demo-'` from `MenuDemo` | `PublicSitePage` uses `idPrefix=''`; links stay on-page |
| `simulated` badge | Hardcoded UI label (`t('web.site.contact.simulated')`) in `ContactSection` line 1116; always shown with `.example.com` label | Not restaurant-specific; present on ANY site |
| Cart content | `publicCart.ts` — independent of restaurant data source; uses `cart.add({restaurantId, slug, restaurantName, item})`; restaurant ownership validated by `itemId` link via `MenuCategories` |
| `BKWahmyRestaurant` / `Wahmy` identity | Not from DB; likely from `templateId='bella-italia'` + previous session confusion / cached page; `templates.ts` defines `Bella Italia` template with `name: 'Bella Italia'` at line 501 | Template definition only; does NOT flow into `r.name` unless DB missing |

## Root cause of wrong content on `/site/tecnoworld`
- DB `Restaurants.slug='tecnoworld'` (`rest-1793398912519-wd0jb`) stores `published_menu` = Bella menu JSON and `name_en='Bella Italian Kitchen'`.
- `PublicSitePage` reads from backend `/api/public/menu/tecnoworld`; backend `getPublicMenuBySlug` reads DB `published_menu` / `menu` for categories/items and `name_en` for identity.
- No code fallback to demo data is responsible; the DB record itself contains incorrect restaurant identity and menu.
- Template (`urban-cafe`) renders correctly with correct colors; only restaurant identity/content is wrong.

## Phase 2 — Implementation needed
Requires DB update of `Restaurants` row (`rest-1793398912519-wd0jb`) to correct `name_en` / `published_menu` / `menu` / `design` / `heroImage` / `gallery` / etc. for TecnoWorld. Per instructions, STOP before DB changes; request approval.
