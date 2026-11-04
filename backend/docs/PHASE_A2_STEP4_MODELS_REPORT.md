# Phase A.2 Step 4 — Models & Validation (Completed — READ-ONLY / Non-Destructive)

Status: Code changes applied. Zero DB writes. No updates executed. No migrations. No backfill.

---

## 1. Inspected Objects

- `backend/src/services/restaurant.service.js` (restaurant schema, language validation)
- `backend/src/services/menu.service.js` (mapItemRow, normalization, source_lang inclusion)
- `backend/src/services/translate.service.js` (inspected; no changes made — provider abstraction not needed yet)

---

## 2. Changes Made (Files Only)

### A. `restaurant.service.js`
- Updated `restaurantSchema`: `language` now uses `z.enum(['ar','en','ku']).optional()` instead of `z.string().optional()`.
- This ensures restaurant-level default language is restricted to supported internal codes.

### B. `menu.service.js`
- Added `source_lang` to `mapItemRow()` (read from DB row, mapped to output).
- Added `VALID_SOURCE_LANGS` array: `['ar','en','ku']`.
- Added `isValidSourceLang()` function: allows `null`/`undefined` and validates against `VALID_SOURCE_LANGS`; rejects `ckb`, empty strings, or unknown values.
- Added documentation comment block at top of `parseJson()` defining inheritance and preservation rules:
  - New records inherit `Restaurants.language` when `source_lang` not explicitly provided.
  - Updates must preserve existing `source_lang` unless explicitly changed.
  - Original fields (`name_en`, `name_ar`, `name_ku`, descriptions) never overwritten by translations.

---

## 3. Validation Rules (Implemented in Code)

| Value | Valid? | Note |
|---|---|---|
| `'ar'` | Yes | Internal Arabic |
| `'en'` | Yes | Internal English |
| `'ku'` | Yes | Internal Kurdish Sorani (backward compatible) |
| `null` / `undefined` | Yes | No source assigned yet |
| `''` | No | Empty rejected |
| `'ckb'` | No | Keep `ku` internally; do not migrate |
| `'fr'` / any other | No | Unknown rejected |

---

## 4. Model Rules (Documented, Not Auto-Executed)

- **New MenuItem/MenuCategory creation:** If `source_lang` not explicitly provided in request, inherit from associated restaurant's `language` column (`Restaurants.language`).
- **Update:** Preserve existing `source_lang` unless the request explicitly provides a new value that passes `isValidSourceLang()`.
- **Protection:** Update logic should never write translation values into original `name_ku`/`name_ar`/`name_en` columns when `source_lang` indicates a different original language.

---

## 5. Tests Run (Non-Destructive)

File: `backend/test_phase_a2_step4.js`
- Asserted `isValidSourceLang('en')`, `'ar'`, `'ku'` → true.
- Asserted `null`, `undefined` → true.
- Asserted `'fr'`, `'ckb'`, `''` → false.
- All assertions passed; no DB interaction.

---

## 6. What Was NOT Done (Restrictions Respected)

- No `UPDATE`, `INSERT`, `DELETE`, `ALTER`, `DROP` executed.
- No SQL backfill executed (`source_lang` remains NULL for ambiguous records as before).
- No `MenuTranslations` table created.
- No `tx()` changes (not in scope for Step 4).
- No frontend modifications.
- No package installations.

---

## 7. Final Status

- Models and validation updated safely.
- `restaurant.service.js`: `language` validated to `['ar','en','ku']`.
- `menu.service.js`: `source_lang` included in mapping; validation functions added; rules documented.
- Tests confirm rules work without DB writes.

**STOP — Step 4 complete. No DB writes performed. Ready for next authorization.**
