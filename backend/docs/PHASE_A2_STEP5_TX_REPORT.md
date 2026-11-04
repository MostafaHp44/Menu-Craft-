# Phase A.2 Step 5 — Translation Engine (tx) Report

Status: Implemented. No DB writes. No schema changes. No draft/published modifications.

---

## Changed Files

- `backend/src/services/translate.service.js` — centralized `tx()` + `VALID_LANGS` + `isValidSourceLang`
- `backend/test_phase_a2_step5.js` — 9 assertion cases (passed)

---

## Resolution Priority (Implemented)

1. `requested_lang` (visitor choice)
2. `source_lang` (original content) — only if explicitly provided and different from requested
3. `'en'` (global fallback)
4. Any remaining non-empty (`ar`, `ku`)
5. Empty string only if nothing exists

Never uses `Restaurants.language` automatically when `source_lang` is NULL.

---

## Validation

- `VALID_LANGS = ['ar','en','ku']`
- `isValidSourceLang()` allows `null`/`undefined`; rejects `ckb`, `'fr'`, `''`
- `tx()` throws on unsupported `lang`

---

## Test Evidence

```
=== Phase A.2 Step 5 — tx() Tests ===
All tx() tests passed (non-destructive).
```

Coverage: exact match, source fallback, en fallback, null source, missing translation, empty strings, Kurdish `ku`, invalid codes (`fr`), independence from restaurant default.

---

## Backward Compatibility

- Existing frontend `tx()` in `frontend/src/shared/lib/utils.ts` unchanged (separate layer)
- Backend `tx()` does not break existing API responses (included in `mapItemRow` mapping only for new usages)

---

## STOP

Step 5 complete. No DB modifications. No updates to `draft_menu`/`published_menu`. Ready for approval if needed.
