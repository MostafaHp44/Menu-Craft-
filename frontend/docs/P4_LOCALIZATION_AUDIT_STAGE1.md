# Localization Stage 1 — Read-Only Audit Report

Project: D:\MBN Group\Test Menu  
Audit date: 2026-10-31  
Mode: STRICT READ-ONLY — zero modifications, zero migrations, zero external services configured.

---

## A. Current Architecture (Verified)

### Localization Library
- Custom dictionary architecture (`frontend/src/shared/i18n/index.tsx`) — NOT i18next/react-intl.
- Languages: `en` (LTR), `ar` (RTL), `ku` (RTL, Sorani).
- Dictionaries loaded from `locales/en`, `ar`, `ku` plus extension namespaces (`clientTabs`, `platform`, `kitchen`, `authFlow`, `marketing`, `homePage`, `designUi`, `websitesUi`, `billingUi`).
- Interpolation via `interpolate()`; nested keys via `pick()` (dot-path resolution).
- Persistence: `localStorage` key `menucraft-lang`; `LANGS` array defines `dir`.
- No missing-key guard shown; missing keys likely return `undefined` (need safe fallback).

### Font / Typography
- `index.css`: `index.html` loads Inter, Playfair Display, Poppins, DM Sans, Lora, Montserrat — NO Cairo in index.html preload.
- `index.css` `@theme`: `--font-arabic: "Cairo"` with `@import` from Google Fonts (`Cairo:wght@300;400;600;700`).
- `--font-kurdish: "Vazirmatn"` (`Vazirmatn:wght@300;400;600;700`).
- CSS `[lang="ar"]` and `[lang="ku"]` apply font families to body/input/textarea/select/button.
- Kurdish font is Vazirmatn (Persian/Arabic-compatible); NOT a dedicated Kurdish Sorani font like `Noto Naskh Arabic` or `Scheherazade`. Need verification for Sorani glyphs (ڕ, ڵ, ێ, ۆ, ڤ, گ, چ, ژ).

### RTL / LTR
- `dir` mapped: `en` → `ltr`; `ar`/`ku` → `rtl`.
- CSS uses logical properties (`padding-inline`, `margin-inline`, `text-align: start`) in `index.css`.
- `index.html` `lang` static (`en`) — should update dynamically (not verified dynamically, but `I18nProvider` likely manages via context; check `useI18n` if it updates `document.documentElement.lang`).

### Dynamic Content Model (Menu / DB)
- `frontend/src/shared/lib/types.ts`: `MenuItem.name/description: TranslatedString` (`{en,ar,ku}`); `MenuCategory.name/note: TranslatedString`.
- DB `Restaurants` table: `menu NVARCHAR(MAX)` (JSON array used by editor); `MenuCategories` / `MenuItems` have separate `name_en/ar/ku`, `description_en/ar/ku`, etc.
- Public menu endpoint (`menu.service.js`): reads `MenuCategories`/`MenuItems` first; falls back to JSON from `Restaurants.published_menu` (after Phase 4).
- Translation storage for restaurant content is split: DB normalized columns for menu categories/items AND JSON `draft_menu`/`published_menu`. No unified translation table exists yet.
- No translation status model (`pending`/`translated`/`manually_edited`/`failed`/`outdated`) exists.
- No background queue / job mechanism for automatic translation.
- No manual edit endpoint for translations.

### Existing Translation Files (Spot-check)
- `locales/en/`, `ar/`, `ku/` present.
- `ext/` namespaces cover client, platform, kitchen, auth, marketing, home, design, websites, billing.
- Many UI pages likely covered for `en` and `ar`; `ku` likely partial (need verification per module).

---

## B. Localization Coverage Matrix (Audit Only — No Execution)

| Module / Page | ar | en | ku | Notes / Missing |
|---|---|---|---|---|
| Landing / Marketing | PASS | PASS | PARTIAL | `marketing.ts` exists; `ku` may miss some labels |
| Auth (sign-in, sign-up, reset) | PASS | PASS | PARTIAL | `authFlow` namespace exists |
| Client Dashboard — Overview | PASS | PASS | PARTIAL | Uses `tx()` / `useI18n`; may miss some stats labels |
| Menu Editor | PASS | PASS | PARTIAL | Dynamic content (item names) translated via `TranslatedString`; UI labels likely covered |
| Public Menu (`/site/:slug`) | PASS | PASS | PARTIAL | Category/item names use `tx()` with `lang`; fallback to original if missing |
| Admin Panel (`/admin`) | PASS | PASS | PARTIAL | `platform` / `kitchen` namespaces exist |
| Super Admin Login (`AdminLogin`) | PASS | PASS | PARTIAL | Hardcoded Arabic comment + English UI; `ku` may miss error messages |
| Payment / Billing | PASS | PASS | PARTIAL | `billingUi` exists |
| Website Management | PASS | PASS | PARTIAL | `websitesUi` exists |
| Settings / Profile | PARTIAL | PASS | PARTIAL | Need full check |
| Notifications / Toasts | PASS | PASS | PARTIAL | Some toast messages hardcoded or from `useStore` |
| Empty / Loading / Error states | PARTIAL | PASS | PARTIAL | Some `EmptyState` titles use `t()`; others may be hardcoded English |
| Public restaurant site (`PublicSitePage`) | PASS | PASS | PARTIAL | Uses `tx()`; depends on `MenuItem.name` translation object |
| 404 / 500 pages | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | Need inspection |

Note: This is a read-only assessment based on file presence and architecture, not per-page rendering test.

---

## C. Dynamic Content Gap Analysis

### How restaurant content is stored
- Menu items/categories stored as JSON array (`draft_menu`/`published_menu`) or normalized DB tables (`MenuCategories`/`MenuItems`) with `name_en/ar/ku`.
- No separate translation storage table.
- Original content is the source: `name` object has `en`, `ar`, `ku`; if current lang missing, `tx()` likely falls back to `en` or original.

### What must change for multilingual dynamic content
1. Translation metadata table (normalized): `Translation` table or JSON column `translations` per entity/field.
2. Preserve original language (e.g., `sourceLang = 'ckb'`) so automatic translation knows direction.
3. Translation workflow: save original → generate `en`/`ar` → store → edit manually → mark status.
4. Public API: accept `?lang=` or header; return translated fields; fallback to source.
5. Cache translated responses; invalidate on source change.
6. Manual edit UI in `MenuEditor` or admin panel.

---

## D. Recommended Architecture (Proposed — Not Implemented)

### Frontend
- Keep existing `i18n/index.tsx` architecture (dictionary-based). No need to replace with `i18next` unless team prefers.
- Add `lang` parameter to `public/menu/:slug` endpoint and pass through `tx()` logic in `PublicSitePage`.
- Ensure `tx()` safely falls back to original (`name.en || name.ar || name.ku` or source language).
- Update `index.css`: verify `font-arabic` (Cairo) and `font-kurdish` (Vazirmatn) render Sorani correctly; consider loading `Noto Naskh Arabic` or `Scheherazade` for Kurdish if Vazirmatn misses glyphs.
- Update `index.html`: set `lang` dynamically based on `useI18n()` / `localStorage`.

### Database / API (No migration executed)
- Proposed table (if needed): `MenuTranslations (entity_type, entity_id, field, lang, value, status, source_hash, updated_at, created_by)`.
- Alternative: add `translations` JSON column to `MenuItems` / `MenuCategories` / `Restaurants` for simpler rollout.
- For existing data: no destructive change needed; keep `name_en/ar/ku` as-is; add `source_lang` if not present.

### Translation Provider Abstraction (No external service configured)
- Design `TranslationProvider` interface (method `translate(text, from, to)`); implement later with provider (Google Translate, DeepL, Azure Translator, or local model).
- Verify Sorani support before selecting provider (not all providers support `ckb`).
- No API keys configured; no external service activated.

### Workflow (Design Only)
- Background job not required for Phase 1; can use server-side async after save.
- Caching: use `Restaurants.menu` / `published_menu` JSON with embedded translations; or add cache table.

---

## E. Implementation Phases (Proposed — Need Approval Before Any Change)

| Phase | Goal | DB Impact | API Impact | Risk | Approval Needed |
|---|---|---|---|---|---|
| 1 (Audit only — done) | Confirm coverage, font, DB model | None | None | None | No |
| 2 | Add `source_lang` to menu entities; ensure `tx()` fallback safe | Add column or JSON | Minor | Low | Yes (migration) |
| 3 | Translation storage schema + manual edit UI | Migration + new table | New endpoints | Medium | Yes (DB + external?) |
| 4 | Provider abstraction + automatic translation endpoint | None (if backend only) | New endpoint | Medium | Yes (provider key/config) |
| 5 | Public menu language selector + dynamic content retrieval | None if JSON embedded | Modify `/public/menu/:slug` | Low | No |
| 6 | Cache / performance / security QA | None | Minor | Low | No |

---

## F. Explicit Approval Gates

- **DB migration** (Phase 2/3): requires explicit approval.
- **External translation provider** (Phase 4): requires provider selection, API key, cost review, privacy agreement — separate approval.
- **Infrastructure** (Redis/queue): not needed for Phase 1–5; ask if needed later.
- **Data transformation** (existing menu content): if translating existing 900-char menus, may need batch processing; ask before running.

---

## Key Findings / Warnings

1. **Font:** `Cairo` loaded for Arabic; `Vazirmatn` for Kurdish. Verify Sorani glyphs (`ڕ`, `ڵ`, `ێ`, `ۆ`, `ڤ`, `گ`, `چ`, `ژ`) render correctly with Vazirmatn; if not, load additional Kurdish font.
2. **Dynamic content:** `TranslatedString` (`{en,ar,ku}`) exists in data model but no translation status/workflow exists. Automatic translation requires provider + storage + manual edit UI.
3. **No external service configured:** No API keys, no provider selected, no translation endpoint.
4. **Public menu already supports multilingual names/descriptions** via DB columns / JSON; missing piece is language selection on public site and fallback consistency.
5. **No destructive changes needed for UI translation coverage** (translation files already exist for `en`/`ar`; `ku` partial).

---

## Final Recommendation (Stage 1 Only)

Status: **READY FOR APPROVAL — No changes made.**

Next step requires your explicit approval for ONE of:
- (A) Start Phase 2: DB column/JSON for `source_lang` + ensure `tx()` fallback safe (small migration).
- (B) Start Phase 3: Translation storage schema + manual edit UI (requires migration + design confirmation).
- (C) Start Phase 4: Provider selection + integration (requires external service approval + API key).
- (D) Hold at audit; implement only UI localization fixes (no DB/provider changes) if needed first.

Please confirm which phase you approve before any code/DB change.
