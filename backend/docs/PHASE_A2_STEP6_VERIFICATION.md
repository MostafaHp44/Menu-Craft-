# Phase A.2 Step 6 — Verification Report (READ-ONLY)

Status: READ-ONLY ONLY. Zero file modifications during verification. Zero DB operations.

---

## 1. Draft Menu

Evidence (`menu.service.js` lines 168-177):
- JSON `draft_menu` / `published_menu` categories resolve via `resolveTranslated(..., lang, cat.sourceLang || null)`.
- JSON items resolve via `resolveTranslated(..., lang, i.sourceLang || cat.sourceLang || null)`.
- `lang` comes from route query/header (`request.query?.lang` or `x-lang` header, default `en`).
- Original `name`/`description` objects preserved; translated display computed in memory.

PASS.

---

## 2. Published Menu (DB-backed)

Evidence (`menu.service.js` lines 172-176):
- DB categories: `resolveTranslated({en:cat.name_en,...}, lang, cat.source_lang || null)`.
- DB items: `mapItemRow(it, lang)` applies same logic with `i.source_lang || null`.

PASS.

---

## 3. Database-backed Responses (mapItemRow / resolveTranslated)

- `mapItemRow(i, lang)` at line 45 passes `i.source_lang || null` to `resolveTranslated`.
- `resolveTranslated` uses `tx()` internally with priority: requested > source (if non-null) > en.
- No database columns overwritten; `mapItemRow` returns new object.

PASS.

---

## 4. Language Selection (routes/menu.routes.js lines 8-14)

Evidence:
- `request.query?.lang` checked first.
- `request.headers?.['x-lang']` checked second.
- Default `lang = 'en'` if neither present or unsupported.
- Only `['ar','en','ku']` accepted (validation enforced by `tx()` at service layer).

No precedence issue: query takes precedence over header (line 10 checks query first). Unsupported codes fall to default `en` at route level; `tx()` throws if unsupported code reaches it.

PASS.

---

## 5. Source_lang Behavior

- `mapItemRow`: passes `i.source_lang || null`; if DB column is `NULL`, `null` passed to `tx()` (source skipped).
- JSON items: `i.sourceLang || cat.sourceLang || null`; `NULL` skips source step correctly.
- `Restaurants.language` never read in `tx()` or `resolveTranslated`; independence preserved.

PASS.

---

## 6. Response Compatibility

Evidence (`getPublicMenuBySlug` result):
- `restaurant.name`, `tagline`, `description`, `logoText` unchanged (direct DB column mapping, no `tx()`).
- `menu` categories: `name` and `note` now resolved via `resolveTranslated`; structure unchanged (`name: string`, `note: string`).
- Items: `name`, `description` are strings (not `{en,ar,ku}` objects in final response — `tx()` resolves to single string). Existing clients receiving object shapes? Wait: original `mapItemRow` returned `name: normalizeTranslated(...)` which was an object `{en,ar,ku}`. Now `resolveTranslated` returns a `string` (single display language). This is a BREAKING CHANGE if clients expect `{en,ar,ku}`.

IMPORTANT DEVIATION FOUND: `mapItemRow` originally returned `{ en: ..., ar: ..., ku: ... }` via `normalizeTranslated`. After integration, `mapItemRow` now returns a single string (display language). This breaks backward compatibility for clients expecting multilingual object.

PASS for architecture alignment, but FAIL for backward compatibility unless clients are updated. Must document.

---

## 7. Tests (test_phase_a2_step6.js)

Assertions:
1. DB item `ar` with `ku` source → `'قهوة'`
2. DB item `en` with `ku` source → `'Espresso'`
3. DB item `ku` with `ku` source → `'قاوە'`
4. NULL source + `ar` available → `'معكرونة'`
5. Published/draft JSON item `ar` with `en` source → `'بيتزا'`
6. Description independent (`ku` returns `'تازە'`)
7. Unsupported language (`de`) throws
8. Original fields unchanged (console statement)

No assertion for missing `description` with source present; no assertion for `NULL` source + missing `en`; no assertion for response shape compatibility; no assertion verifying `name` remains object if clients expect it.

PASS for core behavior; GAPS noted.

---

## 8. Architecture Deviation / Issue

BREAKING CHANGE: `mapItemRow` now returns `name` and `description` as display strings (single language), not `{en,ar,ku}` objects. Original `normalizeTranslated` produced multilingual objects. The approved architecture for Step 6 requested integration of `tx()` but did not explicitly state whether the response should remain multilingual objects or become single-language strings.

Given the current `PublicSitePage` uses `tx()` (expects string inputs), the service-level change aligns with frontend needs, but clients that rely on the object shape from `getPublicMenuBySlug` will break.

If backward compatibility requires the multilingual object response, `mapItemRow` should keep `normalizeTranslated` for response shape and add a separate `tx()` call only when needed for display. As implemented, the service now always resolves to single-language display.

---

## Final Assessment

PASS for:
- Integration points (draft, published, DB paths) verified from code.
- Priority order matches approved design (requested > source > en).
- NULL source skipped correctly.
- `Restaurants.language` never used implicitly.
- Validation (`ar`/`en`/`ku`) enforced; unsupported rejected.
- No DB writes / schema changes.

FAIL / WARNING for:
- Breaking response shape change (`name`/`description` from object to string) — must confirm client compatibility.
- Missing assertions for response-shape preservation.

---

## STOP

No code modifications performed during verification. Deviation identified (response shape). Ready for approval on whether to keep single-language response or restore object response while using `tx()` selectively.
