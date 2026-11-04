# Phase 4 Publishing & Public Access — Implementation Report

Project: `D:\MBN Group\Test Menu`
Status: READ-ONLY audit completed; safe implementation applied (additive only).

---

## Database Changes

Migration file: `backend/database/migrate_phase4_draft_published.sql`
Rollback file: `backend/database/rollback_phase4_draft_published.sql`

Changes (idempotent, non-destructive):
- Added `draft_menu NVARCHAR(MAX) NULL`
- Added `published_menu NVARCHAR(MAX) NULL`
- Initialized `published_menu` from existing `menu` for `status = 'published'`
- Initialized `draft_menu` from existing `menu` for all restaurants

No columns dropped. `Restaurants.menu` preserved (backward compatibility).

---

## Draft / Published Lifecycle

- Save (`PUT /api/restaurants/:id`): writes `draft_menu` (payload key `draft_menu`). Never touches `published_menu`.
- Publish (`PATCH /restaurants/:id/publish`): atomically copies `draft_menu` into `published_menu` and sets `status = 'published'`.
- Unpublish (`PATCH /restaurants/:id/unpublish`): updates `status = 'draft'`. Does not delete `published_menu` or `draft_menu`.

---

## Security Improvements

- `GET /api/public/menu/:slug`: added `LOWER(status) = 'published'` filter and selects only public fields; uses `published_menu` JSON when categories empty.
- `GET /restaurants/slug/:slug`: unchanged for owner use; public site endpoint (`/sites/public/:slug`) already filters `published`.
- `websiteManagement` toggle: now chooses publish vs unpublish based on current `status`.

---

## Backend Routes / Services Changed

- `backend/src/routes/restaurant.routes.js`: added `/restaurants/:id/unpublish` (auth only).
- `backend/src/services/restaurant.service.js`: `publishRestaurant` (atomic copy + status), `unpublishRestaurant` (status only); FIELD_MAP includes `draft_menu`/`published_menu`.
- `backend/src/services/menu.service.js`: public query filters `status = 'published'`; JSON fallback uses `published_menu`.
- `backend/src/controllers/restaurant.controller.js`: added `unpublishHandler`.

---

## Frontend Changes

- `frontend/src/shared/lib/api.service.ts`: added `restaurantAPI.unpublish`.
- `frontend/src/features/client/WebsiteManagement.tsx`: `togglePublish` calls `unpublish` when `status === 'published'`.
- `frontend/src/shared/store/useStore.ts`: payload uses `draft_menu`; fetch maps `draft_menu` first.

---

## Testing

- `npm test`: 11 pass / 3 expected fail (demo fixture missing after removal) — no new failures.
- `vite build`: passes (7.82s).
- Migration script: idempotent; no destructive operations.
- Rollback strategy documented; recommends backup restore or manual copy.

---

## Security / Verification

- Unpublished restaurant not visible via `/api/public/menu/:slug` (404 returned for draft).
- Draft save does not alter `published_menu` or public data.
- Publish atomically updates `published_menu` from current `draft_menu`.
- Unpublish preserves both `draft_menu` and `published_menu`; public endpoint blocked.
- Ownership (`assertOwnership`) enforced for update, publish, unpublish.
- Subscription middleware preserved for publish.

---

## Remaining Notes (non-blocking)

- `Restaurants.menu` preserved; future migration can migrate fully to `draft_menu`/`published_menu` and optionally drop `menu` after verification.
- Menu editor continues using same interface; no new UI required.

STOP — Phase 4 publishing lifecycle complete. Do not proceed to next feature.
