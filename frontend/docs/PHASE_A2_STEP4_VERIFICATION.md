# Phase A.2 Step 4 — Implementation Verification

Status: Verified read-only. No DB writes. No code modifications performed during review.

---

## 1. Does creating a MenuItem without source_lang inherit Restaurants.language?

Evidence: `backend/src/services/menu.service.js` lines 12-14 document inheritance rule.
No explicit MenuItem creation endpoint exists in inspected routes (`menu.routes.js` only has public GET). However, rule is documented and `mapItemRow` maps `source_lang`. Implementation requires editor/controller to pass `Restaurants.language` when creating if omitted.

## 2. Does creating MenuCategory without source_lang inherit Restaurants.language?

Same as above: documented in `menu.service.js` rules; `mapItemRow` includes `source_lang` for categories via DB read.

## 3. Does explicitly supplied source_lang override restaurant default?

Yes — validation `isValidSourceLang()` allows any of `['ar','en','ku']`. If requested, it passes validation and can be written to DB. No hard override logic prevents explicit values.

## 4. Does updating preserve existing source_lang when omitted?

Evidence: `restaurant.service.js` `updateRestaurant()` uses `restaurantSchema.partial()` — only updates fields present in `parsed`. `source_lang` not in restaurant schema, but for menu entities: if update query excludes `source_lang` from SET clause, existing value preserved. Documented in rules.

## 5. Does NULL remain valid for existing ambiguous records?

Yes — `isValidSourceLang()` returns `true` for `null` and `undefined`. Existing DB `source_lang = NULL` for ambiguous records remains valid.

## 6. Are invalid language codes rejected?

Evidence: `test_phase_a2_step4.js` asserts `isValidSourceLang('fr') === false`, `'ckb' === false`, `'' === false`. `VALID_SOURCE_LANGS = ['ar','en','ku']`.

## 7. Are all create/update API paths using these rules consistently?

- `restaurant.service.js`: `createRestaurant` validates `language` via `z.enum(['ar','en','ku'])`; `updateRestaurant` partial preserves existing.
- `menu.service.js`: `mapItemRow` includes `source_lang`; rules documented for inheritance/preservation.
- No direct MenuItem/Mencategory creation endpoint inspected in `menu.routes.js`; editor/controller layer must apply rules when writing.

---

## Changed Files (Step 4)

- `backend/src/services/restaurant.service.js` (language enum validation)
- `backend/src/services/menu.service.js` (mapping + validation + rules comment)
- `backend/test_phase_a2_step4.js` (tests)
- `backend/docs/PHASE_A2_STEP4_MODELS_REPORT.md` (report)

---

## Test Results

`node test_phase_a2_step4.js`: All assertions passed. Non-destructive.

---

## Data Integrity Check

- DB `menucraft_docker`: `MenuItems.source_lang` and `MenuCategories.source_lang` remain `NULL` for 3 items + 3 categories (unchanged by Step 4).
- No `UPDATE`, `ALTER`, or `DROP` executed during verification.

---

## STOP

Verification complete. No further code or DB changes performed.
