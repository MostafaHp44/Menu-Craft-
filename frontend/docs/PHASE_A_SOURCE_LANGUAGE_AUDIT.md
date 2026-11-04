# Phase A — Source Language & Safe Fallback (READ-ONLY AUDIT)

Project: D:\MBN Group\Test Menu  
Status: READ-ONLY — zero modifications. Report only. No DB changes. No backend changes. No frontend edits.

---

## 1. Inspected Objects (Read-Only)

### Database Schema (`backend/database/init.sql` + `migrate_phase4_draft_published.sql`)
- `Restaurants`: `menu NVARCHAR(MAX)`, `language NVARCHAR(10) DEFAULT 'en'`, `draft_menu`, `published_menu` (Phase 4 columns present).
- `MenuCategories`: `name_en`, `name_ar`, `name_ku`; `note_en`, `note_ar`, `note_ku`; `restaurant_id` FK.
- `MenuItems`: `name_en`, `name_ar`, `name_ku`; `description_en`, `description_ar`, `description_ku`; `category_id` FK.
- `Restaurants`: `name_en/ar/ku`, `tagline_en/ar/ku`, `description_en/ar/ku`, `logoText_en/ar/ku`.

### Frontend Type (`frontend/src/shared/lib/types.ts`)
- `TranslatedString = { en?: string; ar?: string; ku?: string }`
- `MenuItem.name`, `.description`; `MenuCategory.name`, `.note`.

### Frontend API / Service
- `menuAPI.getPublicMenu(slug)` — returns `PublicMenuResponse` with embedded translated names (from DB columns / JSON).
- `tx(value, lang)` — safe fallback (`value[lang] || value.en || ''`).
- `I18nProvider` — manages `lang` (`en`/`ar`/`ku`), `dir`, `t()`, stores in `localStorage`.

---

## 2. Current Architecture & Data Flow

### Storage
- Normalized tables (`MenuCategories`/`MenuItems`) store translations in separate language columns (`*_en`, `*_ar`, `*_ku`).
- `Restaurants.menu` (JSON array) also embeds translated names/descriptions (used by editor and public site fallback).
- Phase 4 added `draft_menu` / `published_menu` (separate JSON columns) — no translation metadata table exists.

### Display Flow
- Editor: saves to `draft_menu`; publishes to `published_menu` + updates `MenuCategories`/`MenuItems`.
- Public site (`PublicSitePage`): reads `PublicMenuResponse`; uses `tx()` on `name` objects.
- `tx()` does NOT know "original language" — it just picks requested `lang` then `en`.

---

## 3. Limitations Discovered (Read-Only)

1. **No source-language record:** `Restaurants.language` exists (`DEFAULT 'en'`) but is per-restaurant, not per-field/entity. A restaurant could have a category written in Kurdish (`ckb`) but `language='en'` if owner didn't set it correctly.
2. **No per-field source tracking:** `MenuItems.name_ku` might be original Sorani or a translation; system cannot distinguish.
3. **No translation status model:** No `pending`/`translated`/`manually_edited`/`failed`/`outdated`.
4. **No separate translation storage:** Translations live in same table columns (`name_en`, etc.). Changing original requires updating all languages or losing translations.
5. **No automatic translation pipeline:** No `TranslationProvider` abstraction; no background job.
6. **Fallback relies solely on `tx()`:** If `name.ku` missing, falls back to `en`. It never tries to use the original content if `en` is missing but `ku` exists. Original content preservation is implicit, not explicit.
7. **`ku` vs `ckb`:** Existing system uses `lang='ku'`. Kurdish Sorani (`ckb`) is intended but internal code uses `ku`. Migration to `ckb` risks breaking saved preferences (`localStorage` key `menucraft-lang`) and DB columns (`name_ku`).

---

## 4. Architecture Questions — Answers

1. **Source language storage:** Per-entity (`MenuItem`/`MenuCategory`) + per-field (`name`, `description`) is best. Add `source_lang` to `MenuItems`/`MenuCategories` (or JSON `sourceLang`) and per `Restaurants.menu` entry.
2. **Preserve original permanently:** Original is the first value saved; never overwrite it. Store originals in a dedicated `original_` column or JSON key, or treat the first non-empty `name_*` as original if `source_lang` is set.
3. **Store translations separately:** Recommended: normalized `Translations` table (`entity_type`, `entity_id`, `field`, `lang`, `value`, `status`, `source_hash`, `updated_at`). Alternatively, extend existing `*_en/ar/ku` with `source_lang` metadata.
4. **Missing translation fallback:** Order: (a) requested lang if available; (b) source lang (original); (c) `en` as global fallback; (d) never empty. Documented.
5. **Manual edit protection:** Translation status `manually_edited` prevents automatic overwrite. Requires `TranslationProvider` workflow + status field.
6. **Provider abstraction:** Design `TranslationProvider` interface (`translate(text, from, to)`); implement later with provider (Google/DeepL/Azure). No coupling to one provider.
7. **`ku` compatibility / Sorani:** Maintain `ku` internally with mapping `ku → ckb` (display/code). Risk of migration: breaks `localStorage`, DB column names, existing menus. Recommendation: keep `ku` as internal identifier; map to `ckb` at display/API level if needed later. Do NOT rename DB columns in this stage.
8. **Migration `ku` → `ckb`:** Not needed for Phase A. Risks: all saved preferences (`menucraft-lang='ku'`) become invalid; DB queries using `name_ku` break; `tx()` key `ku` breaks. Recommendation: keep `ku`; add `ckb` as alias in `detectLang()` and `LANGS` if future expansion required, without renaming existing columns.

---

## 5. Recommended Data Model (Example — Not Executed)

### Option 1 — Extend Existing Tables (Low Risk, Keeps Compatibility)
```sql
ALTER TABLE MenuItems ADD source_lang NVARCHAR(10) DEFAULT 'en';
ALTER TABLE MenuCategories ADD source_lang NVARCHAR(10) DEFAULT 'en';
ALTER TABLE Restaurants ADD source_lang NVARCHAR(10) DEFAULT 'en';
```
Keep `name_en/ar/ku` as-is; use `source_lang` to identify which column holds original content.

### Option 2 — Normalized Translation Table (Higher Flexibility, More Migration)
```sql
CREATE TABLE MenuTranslations (
  id VARCHAR(100) PRIMARY KEY DEFAULT NEWID(),
  entity_type NVARCHAR(20) NOT NULL, -- 'MenuItem', 'MenuCategory', 'Restaurant'
  entity_id VARCHAR(100) NOT NULL,
  field NVARCHAR(50) NOT NULL, -- 'name', 'description', 'note'
  lang NVARCHAR(10) NOT NULL, -- 'en','ar','ku'
  value NVARCHAR(MAX),
  status NVARCHAR(20) DEFAULT 'translated', -- translated / manually_edited / pending / failed / outdated
  source_hash NVARCHAR(100),
  created_at DATETIME DEFAULT GETDATE(),
  updated_at DATETIME DEFAULT GETDATE()
);
```
Pros: separates original from translations; supports future languages easily. Cons: requires migration of all existing `name_en/ar/ku` into this table; API must join.

---

## 6. Recommended Fallback Algorithm (Proposed)

```
function getTranslation(entity, field, requestedLang): string {
  const sourceLang = entity.source_lang || 'en';
  // 1. Requested translation
  if (entity[field + '_' + requestedLang]) return it;
  // 2. Source / original content (preserve original)
  if (entity[field + '_' + sourceLang]) return it;
  // 3. English global fallback
  if (entity[field + '_en']) return it;
  // 4. Any existing non-empty
  for (lang in ['ar','ku','en']) if (entity[field+'_'+lang]) return it;
  return ''; // never show empty if source exists; if everything missing, return ''
}
```
Key rule: **Never overwrite the source-language field with a translation.**

---

## 7. Backward-Compatibility Strategy

- Keep all `name_en`, `name_ar`, `name_ku` columns unchanged.
- Keep `tx()` behavior (`value[lang] || value.en || ''`) for frontend compatibility.
- Keep `localStorage` key `menucraft-lang`. Add `ckb` mapping in `detectLang()` only if needed, without removing `ku`.
- Keep JSON `draft_menu` / `published_menu` structures unchanged; only add `sourceLang` at top level or per item if needed.
- Existing menus (900-char JSON) remain untouched; no batch translation required for Phase A.

---

## 8. API Impact (Proposed — Not Implemented)

- `/public/menu/:slug`: currently reads DB; no change needed unless adding `source_lang` to response.
- Editor save endpoint: must preserve `source_lang`; reject updates that overwrite original with translation.
- New endpoints (future Phase 3/4): `/translations`, `/translate/trigger`; not needed for Phase A.

---

## 9. Frontend Impact (Proposed — Not Implemented)

- `tx()` should optionally accept `sourceLang`; currently it doesn't. Update `tx()` to prefer source over `en` when `en` missing.
- `PublicSitePage`: already uses `tx(data.name, lang)`; works if DB has translations. If source is Kurdish (`source_lang='ku'`) and no `ar` translation, should show Kurdish content — current `tx()` would fall back to `en`, which is wrong if original is Kurdish. Fix: update `tx()` to use `source_lang`.
- `I18nProvider`: `detectLang()` already maps `ku`/`ckb`; safe.

---

## 10. Risks & Edge Cases

- **Mixed-language restaurant:** A restaurant may have categories in Arabic (`source_lang='ar'`) and dishes in Kurdish (`source_lang='ku'`). Per-entity `source_lang` solves this; per-restaurant `language` is insufficient.
- **Original overwritten:** If editor saves a translation into `name_ku` when `source_lang='en'`, original English lost unless stored elsewhere. Recommendation: include `original` key in JSON or separate column.
- **Empty translations:** If `description_ar` is `NULL`, show original `description_ku` (if source=ku) rather than blank.
- **Migration order:** Must edit DB columns before changing `tx()` logic; otherwise frontend tries `source_lang` that doesn't exist.

---

## 11. Implementation Plan (With Approval Gates)

| Phase | Goal | DB Impact | API Impact | Approval Required |
|---|---|---|---|---|
| A (this report) | Audit + propose architecture | None | None | No — done |
| A-2 (next) | Add `source_lang` to entities | Migration (`ALTER`) | Minor (read `source_lang`) | **Yes — DB migration** |
| A-3 | Update `tx()` + `PublicSitePage` | None | None | No — frontend only |
| B | Normalized `MenuTranslations` table (optional) | Migration (new table + data move) | New endpoints | **Yes — DB + API design** |
| C | Translation provider abstraction | None | New endpoint | **Yes — provider selection + key** |
|

---

## 12. Decisions Requiring Your Approval

1. **DB approach:** Extend existing columns with `source_lang` (low risk) vs. new `MenuTranslations` table (flexible, more work).
2. **Migration execution:** Only after you confirm; this report is read-only.
3. **`ku` vs `ckb`:** Recommendation is keep `ku` internally; only add `ckb` alias if future expansion needed.
4. **Automatic translation:** Not in Phase A; requires Phase C approval (provider + key).
5. **Original preservation method:** Add `original_` JSON key or rely on `source_lang` + first non-empty column? Recommend `source_lang` for simplicity.

---

## 13. Final Status

- Report path: `frontend/docs/PHASE_A_SOURCE_LANGUAGE_AUDIT.md`
- Zero files modified.
- Zero database changes.
- Zero backend changes.
- Zero migrations executed.
- All inspected structures preserved.
- Awaiting your approval for Phase A-2 (DB `source_lang` column) or Phase B (normalized table).

**STOP — no implementation performed. Read-only audit complete.**
