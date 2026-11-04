# Phase A.2 Step 5 — Strict Verification Report (READ-ONLY)

Status: REVIEW ONLY. Zero code changes. Zero DB writes.

---

## 1. Exact Fallback Implementation (from translate.service.js lines 9-39)

Priority implemented:
1. `value[lang]` if non-empty
2. `value[sourceLang]` if `sourceLang` truthy, valid, different from `lang`
3. `value.en`
4. Loop over `['ar','ku','en']` skipping already-checked — returns any remaining non-empty
5. `''`

## DEVIATION FROM APPROVED ARCHITECTURE

Approved design: strictly 1 → 2 → 3 (requested > source > en). No "other available language" fallback.
Actual code: Step 4 (loop over remaining languages) is an extra fallback not in approved architecture.

This is a deviation — it adds a "best available" fallback beyond `en`, which can mix languages unexpectedly (e.g., requested `ar` missing, source `en`, but returns `ku`).

---

## 2. Field-Level Behavior (Verified by Design — No Modifications)

`tx()` operates on any `{en?,ar?,ku?}` object independently. For MenuItem:
- `name: tx(item.nameObj, 'ar', item.source_lang)` resolves independently.
- `description: tx(item.descObj, 'ar', item.source_lang)` resolves independently.
- If `name.ar` exists but `description.ar` missing, `description` falls back to `source_lang` then `en`. Never mixes empty fields.
- Empty strings (`''`) treated as missing (trim check). No false-empty return when fallback exists.

---

## 3. NULL source_lang (Verified)

Line 21: `if (sourceLang && ...)` — if `sourceLang` is `null`/`undefined`, condition false. Source step skipped entirely. Falls through to `en` (step 3) or step 4. Confirmed: does NOT use `Restaurants.language`.

---

## 4. All 9 Test Assertions (Listed & Explained)

| # | Assertion | Proves |
|---|---|---|
| 1 | `tx(full, 'ar', 'en') === 'معكرونة'` | Exact requested language |
| 2 | `tx(full, 'ku', 'en') === 'پاستا'` | Exact ku |
| 3 | `tx(full, 'en', 'en') === 'Pasta'` | Exact en |
| 4 | `tx(sourceAr, 'ar', 'ar') === 'معكرونة'` | Requested = source works |
| 5 | `tx(sourceAr, 'en', 'ar') === 'Pasta'` | Requested overrides source correctly |
| 6 | `tx(noSource, 'ku', null) === 'Espresso'` | NULL source falls to en |
| 7 | `tx({en,ar,ku}, 'ar', null) === 'قهوة'` | NULL source with ar present |
| 8 | `tx({en,ar:'',ku:''}, 'ar', 'en') === 'Espresso'` | Missing ar falls to en (via source=en) |
| 9 | `tx({en:'',ar:'',ku:''}, 'en', 'en') === ''` | All empty = empty |
| 10 | `isValidSourceLang('ku')` true / `'ckb'` false | Validation correct |
| 11 | `tx({en:'X'}, 'fr', 'en')` throws | Invalid code rejected |
| 12 | `tx({en:'A',ar:'B',ku:'C'}, 'ar', null) === 'B'` | Independence from restaurant |

All 12 assertions passed.

---

## 5. Missing Test Cases (Identified — Not Executed)

- Independent field resolution: `name` has `ar`, `description` missing `ar`, `source_lang='ku'` — verify `description` returns `ku` string.
- Source `ku` with requested `ar` missing: `tx({en:'X', ar:'', ku:'Y'}, 'ar', 'ku')` should return `'Y'` (currently passes via step 4, but approved design wants source then en; since ku is source, returns ku — correct).
- Test with `value` as plain string legacy shape.
- Test with `sourceLang = 'ku'` and `lang = 'ar'` where both `ar` and `en` missing — should return `ku` (correct per source step; but step 4 could return same).

---

## 6. Compatibility (Verified)

- `mapItemRow` includes `source_lang`; no breaking change to existing `name`/`description` object shape.
- Existing callers (`getPublicMenuBySlug`) not modified; they use `normalizeTranslated()` which ignores `source_lang` (backward-compatible).
- `translate.service.js` is new module; no existing imports broken.

---

## 7. Recommendation

PASS for core requirements (priority steps 1-3 work; validation works; NULL handled; independence preserved; compatibility maintained).
FAIL / WARNING for deviation: Step 4 loop adds unapproved fallback that could return an unexpected language (e.g., `ku` when `en` was intended). Recommend removing step 4 loop to align with approved architecture, or documenting it as a permitted compatibility exception.

---

## STOP

No modifications made to code or DB. Deviation identified in `translate.service.js` line 32-35. Ready for approval to fix step 4 if required.
