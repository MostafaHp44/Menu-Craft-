# Known Issues & Follow-ups — Digital Menu

This document records the remaining issues that were **not** resolved in the
latest Websites / Payments / QR / Demo-removal pass. They are tracked here so
they can be addressed in a later pass without being rediscovered.

## 1. Websites — create flow UX

- **`window.prompt`-based creation** (`WebsitesPage.handleCreate`) uses two
  native prompts (name, slug). It works in a real browser but is poor UX and
  is awkward to drive in automated tests.
- **Suggested fix**: replace with a small modal (name + slug + template picker)
  that runs the same `sitesAPI.create` → `setActive` → `loadDraftFromBackend`
  → `/dashboard/templates` sequence.
- **Status**: functional, not polished.

## 2. FullscreenEditorModal — styling

- The `Modal` component does not accept a `className` prop, so two
  `className="..."` props were removed. The fullscreen editor overlay lost
  some custom positioning/sizing.
- **Suggested fix**: extend `Modal` to accept an optional `className` (merged
  onto the dialog container) and re-add the removed classes.

## 3. Payment ordering — null defaults

- Most demo restaurants have `ordering = NULL` in the database. The public
  checkout falls back to `orderingSettingsFromRow` defaults, but an owner who
  has never opened the Payments tab will see whatever the defaults are.
- **Suggested fix**: backfill `ordering` for all existing restaurants with a
  sensible default (cash enabled) — or lazy-create on first read in
  `orderingSettingsFromRow`.

## 4. Payment method labels — localization

- `availablePaymentMethods` in `menu.service.js` returns hardcoded English
  labels ("Cash on Delivery", "Credit / Debit Card", …). The frontend
  Checkout renders these directly.
- **Suggested fix**: return a `code` only and let the frontend resolve the
  label via i18n keys (`payments.cashOnDelivery`, …).

## 5. Backend `templateId` validation (defensive)

- `restaurantSchema.templateId` was `z.string().optional()`; passing `null`
  failed validation. Fixed to `z.string().nullish().optional()`, but any
  other caller passing `null` for other optional string fields may hit the
  same issue. Audit remaining optional string fields.

## 6. QR — scan tracking

- No scan tracking exists; the QR page explicitly states "Scans are not
  tracked". If analytics are wanted later, a `/api/public/qr-scan` endpoint
  + a `qr_scans` table + a real counter on the dashboard would be required.
  Do **not** invent numbers in the meantime.

## 7. Multi-site — local store hydration

- `useStore` (zustand) is in-memory for the session; a full page reload
  resets `activeId` to the seed restaurant. `loadDraftFromBackend` recovers
  the backend snapshot, but only if `activeId` is set before the editor
  mounts. The SPA navigation path works; hard reloads of `/dashboard/editor`
  for a brand-new site may land on the seed restaurant until the user clicks
  "Manage" again.
- **Suggested fix**: persist `activeId` to `localStorage` and hydrate on
  store init (already partially done via `menucraft-demo-v1` persist, but
  the persisted `restaurants` array is often empty on first load).

## 8. Misc. i18n gaps

- Some newly added strings (e.g. `payments.liveNote`) were added to en/ar/ku
  but other locales / marketing strings may still contain "demo" wording in
  non-user-facing identifiers (route names, internal variable names) — those
  are intentionally kept and must not be renamed without a migration.

---
_Last updated: 2026-11-05_
