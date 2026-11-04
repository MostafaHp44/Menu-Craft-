# Phase A.2 Step 6 — Final Integration Audit (READ-ONLY)

Status: READ-ONLY ONLY. Zero file modifications during audit. Zero DB writes.

---

## 1. Request Flow Trace

`menu.routes.js` (`line 8-14`):
- Reads `request.query?.lang` → `request.headers?.['x-lang']` → default `en`.
- Passes `lang` to `getPublicMenuBySlug()`.

`menu.service.js` (`line 128-223`):
- `getPublicMenuBySlug(slug, lang)` accepts `lang`.
- DB categories mapped via `normalizeTranslated` (ignores `lang`).
- DB items mapped via `mapItemRow(i, lang)` — but `normalizeTranslated` ignores `lang`.
- JSON `draft_menu`/`published_menu` categories/items also mapped via `normalizeTranslated` (not `resolveTranslated`).
- `resolveTranslated` defined (`line 20`) but has ZERO call sites in this file.

## 2. Does visitor lang change returned content?

NO. `normalizeTranslated` always produces `{ en: ..., ar: ..., ku: ... }`, regardless of `lang`. Therefore `lang=ar`, `en`, `ku` return identical multilingual objects for `name` and `description`. Localization is NOT applied to the public API response.

FAIL for Step 6 functional objective (localization applied), PASS for backward compatibility.

---

## 3. `tx()` / `resolveTranslated()` Usage Audit

File `translate.service.js` (`line 9-41`): `tx()` defined correctly with approved priority (`requested > source > en`), no extra fallback (`loop` removed in correction).

Call sites of `tx()` / `resolveTranslated()`:
- `menu.service.js`: `resolveTranslated` ONLY defined, NEVER called (`grep`: 1 match at definition line 20).
- `mapItemRow` (`line 45`): does NOT call `tx()` or `resolveTranslated`.
- Category mapping (`lines 172-176`): uses `normalizeTranslated`, not `tx()`.
- JSON fallback (`lines 182-193`): uses `normalizeTranslated`, not `tx()`.
- No other backend file uses `tx()` in response construction.

---

## 4. Source_lang Integration

- `mapItemRow` includes `source_lang: i.source_lang || null` (line 56), preserving DB value.
- `resolveTranslated` receives `sourceLang` correctly (`line 20`), but never invoked.
- `Restaurants.language` is NOT read by `tx()` or `normalizeTranslated`.
- NULL `source_lang` handled safely (skipped by `tx()` logic; preserved by mapping).

PASS for data integrity; FAIL for functional application.

---

## 5. Field Independence (Name vs Description)

`mapItemRow` treats `name` and `description` independently (separate `normalizeTranslated` calls). If restored to `tx()` usage, they would resolve independently with same `source_lang`. Currently both return the same multilingual object, not localized strings.

---

## 6. Response Compatibility

PASS for backward compatibility:
- Response structure unchanged (`name: {en,ar,ku}`, `description: {en,ar,ku}`).
- No new fields added to response.
- Original DB content preserved (no writes).
- Existing frontend `PublicSitePage` (`tx()` usage) unaffected because backend response still provides multilingual objects.

FAIL for Step 6 objective: localization not integrated into actual response.

---

## 7. Tests (`test_phase_a2_step6.js`)

Assertions executed (passed):
1. DB item `ar` with `ku` source (via `tx()` directly, not through service response path)
2. DB item `en` with `ku` source
3. DB item `ku` with `ku` source
4. NULL source skips source, uses `en`/`ar`
5. JSON item `ar` with `en` source
6. Independent description field (`tx()`)
7. Unsupported language rejected
8. Original fields unchanged (console statement)

Gap: tests verify `tx()` directly but do NOT verify the actual public menu response for different `lang` values produces different display content (because it doesn't; response unchanged).

PASS for core rules; FAIL for integration verification of actual response variation.

---

## 8. Architecture Deviation (Confirmed)

- Approved architecture: `requested > source > en`.
- `tx()` matches exactly (extra loop removed in Step 5 correction).
- Integration failure is NOT a deviation in `tx()` logic; it is a missing application point in `menu.service.js`: `tx()` not called for response construction.

---

## 9. Recommended Minimal Fix (Not Implemented — Read-Only Proposal Only)

Without changing response contract (multilingual object preserved):
- Option A: Keep `normalizeTranslated` for `name`/`description` response fields; add separate localized string fields (e.g., `displayName`) using `resolveTranslated`. Requires new response fields (approval needed).
- Option B: Use `tx()` in response but wrap result back into `{ en: ..., ar: ..., ku: ... }` by resolving requested language and mapping back — complex, may lose information.
- Option C (recommended): Apply `tx()` only when a consumer explicitly requests display language; preserve multilingual objects by default. Document that Step 6 integration is complete for rules/validation but requires a separate display-layer step to expose localized content without removing multilingual objects.

---

## Final Assessment

PASS for:
- `tx()` logic aligns with approved architecture.
- `mapItemRow` and `resolveTranslated` exist correctly.
- `source_lang` preserved; `Restaurants.language` not used implicitly.
- Validation (`ar`/`en`/`ku`) enforced.
- Zero DB writes / zero file changes during audit.

FAIL for Step 6 functional objective:
- Visitor language (`lang` parameter) does NOT change the returned `name` or `description` content. The response remains the same multilingual object regardless of `lang`.

---

## STOP

No file modifications made. No DB operations performed. Audit complete. Approval needed to either:
1. Accept that Step 6 rules/validation/integration are complete but response shape remains unchanged; OR
2. Authorize a display-layer change (Option A or B above) without removing existing multilingual fields.
