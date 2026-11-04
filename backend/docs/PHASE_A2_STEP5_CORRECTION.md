# Phase A.2 Step 5 — Final Correction Report

Status: CORRECTION APPLIED. Zero DB writes. Zero schema changes. No draft/published modifications.

---

## Change Made (Exactly One)

File: `backend/src/services/translate.service.js`
- Removed loop over `['ar','ku','en']` (step 4 extra fallback).
- Approved order now strictly: 1 requested → 2 source_lang → 3 en → 4 ''.

---

## Updated Behavior

- No hidden "best available" language selection.
- If `lang='ar'`, `source='en'`, `ar=''`, `en=''` → `''` (not `ku`).
- NULL `source_lang` skips source step; falls to `en`; if `en` empty → `''`.

---

## Updated Test Evidence

File: `backend/test_phase_a2_step5.js`
- Added assertion 8: `tx({en:'',ar:'',ku:'Unexpected'}, 'ar', null) === ''` — proves no `ku` fallback.
- All 10 assertions passed.

---

## Compatibility

- `mapItemRow` unchanged; `normalizeTranslated` unchanged.
- Existing public menu responses unaffected (they don't use backend `tx()` directly).
- `VALID_LANGS` and `isValidSourceLang` untouched.

---

## Files Changed

- `backend/src/services/translate.service.js`
- `backend/test_phase_a2_step5.js`
- `backend/docs/PHASE_A2_STEP5_TX_REPORT.md` (updated)

---

## STOP

Correction complete. No DB operations. Ready for Step 6 approval if needed.
