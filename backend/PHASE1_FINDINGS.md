# PHASE 1 — READ-ONLY FINDINGS (No DB / code changes made)

## Tables inspected (SQL SELECT only — no UPDATE/INSERT/ALTER/DELETE)
- `Restaurants` (id, slug, name_en, templateId, design, menu, draft_menu, published_menu, status, ordering)
- `MenuItems` (id, name_en, price, category_id — NO restaurant_id column)
- `MenuCategories` (id, name_en, restaurant_id, sort_order)
- `Orders` / `OrderLines` (verified by previous inspection files)

## Relationship model (verified, not assumed)
- `MenuItems.category_id` → `MenuCategories.id`
- `MenuCategories.restaurant_id` → `Restaurants.id`
- There is NO `MenuItems.restaurant_id`; ownership is category-mediated.
- `Restaurants.published_menu` = JSON string (public menu snapshot saved at publish time)
- `Restaurants.menu` = JSON string (draft / saved menu data)

## Public menu loading (`menu.service.js` `getPublicMenuBySlug`)
- Queries `Restaurants` by `slug` + `status='published'`
- Loads categories: `SELECT * FROM MenuCategories WHERE restaurant_id = @restaurantId`
- Loads items per category: `SELECT * FROM MenuItems WHERE category_id = @categoryId`
- Fallback: parses `r.published_menu || r.menu` if no DB categories/items found.

## Order validation (`order.service.js` line 244-251; `menu.service.js` `resolveItemsForOrder` 68-109)
- `resolveItemsForOrder(restaurant, itemIds)`
- DB path (line 78-84): `SELECT mi.* FROM MenuItems mi JOIN MenuCategories mc ON mc.id = mi.category_id WHERE mi.id IN (...) AND mc.restaurant_id = @restaurantId`
- JSON fallback (line 91-108): parses `restaurant.menu` (NOT `published_menu`) for missing IDs.

## Root cause confirmed
`POST /api/orders` with `api-test-rest` + `Margherita` (`3B9D6216...`) returns `400 ITEM_NOT_FOUND` because:
1. `Margherita` category = `07BD71C5...` (`Pizza`), which has `restaurant_id` = bella (`E835A82D...`), NOT `api-test-rest`.
2. DB query `mc.restaurant_id = @restaurantId` excludes it.
3. JSON fallback checks `restaurant.menu`; `api-test-rest`'s `published_menu` has JSON items (`New dish`) but `restaurant.menu` = `{}` (empty).
4. Therefore item found nowhere for `api-test-rest`.

## DB record for api-test-rest (verified read-only)
- id = `rest-1793437631499-27bf0`
- slug = `api-test-rest`
- `published_menu` contains JSON categories/items (`New category` / `New dish` / `New dish (copy)` with IDs like `item-mvwapxew-2`)
- `menu` = `{}` (empty)
- No `MenuCategories` rows linked to `rest-1793437631499-27bf0` with real product items.

## Approval requested for Phase 2 approach
No destructive DB operations needed.
Proposed smallest code fix: update `resolveItemsForOrder` JSON fallback (line 93) to check `restaurant.published_menu || restaurant.menu` instead of only `restaurant.menu`. This allows orders against `published_menu` items (the published public menu) while keeping DB validation (category/restaurant link) as primary source. No DB INSERT/UPDATE/ALTER required.
