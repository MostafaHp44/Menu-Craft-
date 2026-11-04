# Phase A.2 Step 6 — Compatibility Correction Report (FINAL)

Status: READ-ONLY CORRECTION ONLY. Zero DB writes.

---

## Issue Found

`mapItemRow()` was returning localized strings (`tx()` result) instead of multilingual objects (`normalizeTranslated`). Breaking change for clients expecting `{en, ar, ku}`.

---

## Fix Applied

- `mapItemRow()`: restored `normalizeTranslated` for `name`/`description`; kept `source_lang` in output.
- DB category mapping (` MenuCategories `): restored `normalizeTranslated`.
- JSON draft/published fallback (`Restaurants.published_menu` / `draft_menu`): restored original multilingual object shapes.
- `resolveTranslated` kept for future localized display usage but not used in main response paths.
- `mapItemRow` parameter `lang` kept harmless (unused, backward-compatible).

---

## Verification

- `test_phase_a2_step6.js`: all assertions passed (includes response-shape verification message).
- No DB updates; original `name_en/ar/ku`, descriptions, prices unchanged.

---

## Changed Files

- `backend/src/services/menu.service.js` (restored `normalizeTranslated`; kept `source_lang`; kept `resolveTranslated` available)
- `backend/src/routes/menu.routes.js` (passes `lang`; unchanged otherwise)
- `backend/test_phase_a2_step6.js` (updated assertions)
- `backend/docs/PHASE_A2_STEP6_INTEGRATION_REPORT.md` (existing)

---

## STOP

Compatibility restored. No Step 7 started.
