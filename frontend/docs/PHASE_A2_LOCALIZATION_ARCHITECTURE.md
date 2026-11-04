# Phase A.2 — Localized Architecture Revision (READ-ONLY DESIGN)

Status: READ-ONLY — design proposal only. Zero code/DB changes. Awaiting approval before any Phase A-2 execution.

---

## 1. Approved Requirements (From User)

- Restaurant signup picks default language (`ar`, `en`, `ku`).
- Default = source language for new menu content.
- Individual fields can override source language (e.g., dish name in Sorani, description in Arabic).
- Visitor display language independent of restaurant default.
- Original content preserved; translations never overwrite original.
- `ku` backward compatibility preserved.
- Per-field source tracking required.

---

## 2. Architecture Options Compared

| Approach | How it works | Pros | Cons | Verdict |
|---|---|---|---|---|
| **A. Extend columns** (`source_lang` added to `MenuItems`/`MenuCategories`) | Keep `name_en/ar/ku`; add `source_lang NVARCHAR(10)`; treat column matching `source_lang` as original | Low risk; existing queries work; easy fallback | Per-field override requires adding `source_lang` to each row; doesn't fully separate translations; hard to add future languages | Good for quick rollout |
| **B. Normalized `MenuTranslations`** | Separate table (`entity_type`, `entity_id`, `field`, `lang`, `value`, `status`, `source_hash`) | Clean separation; supports future languages easily; manual edit protection simple (`status`); original preserved explicitly | Migration heavy (move all `name_en/ar/ku` into table); all queries must join; editor/APIs need redesign | Best long-term |
| **C. Hybrid (RECOMMENDED)** | Keep existing `name_en/ar/ku` for compatibility; add `source_lang` per entity; add JSON `translations` column or new table for future/manual translations; `tx()` uses `source_lang` for fallback order | Balances compatibility and flexibility; existing menus work unchanged; new manual/edit flows use new storage | Slightly more complex; requires both column update and optional table | **Selected** |

---

## 3. Recommended Architecture: Hybrid (Option C)

### 3.1 Default Source Language (Restaurant Level)
- `Restaurants.language` already exists (`NVARCHAR(10) DEFAULT 'en'`). Use it as default.
- During signup, owner selects `ar`/`en`/`ku`; saved to `Restaurants.language`.
- All new `MenuItems`/`MenuCategories` created under that restaurant inherit `source_lang = Restaurants.language` unless overridden.

### 3.2 Per-Field Source Override
- `MenuItems` and `MenuCategories` get `source_lang NVARCHAR(10)`.
- Also add per-row `original_name` / `original_description` JSON or rely on `source_lang` + column logic.
- Example: `MenuItem` with `source_lang='ku'`; `name_ku` = original Sorani; `name_en` = translation; `name_ar` = translation or NULL.
- Per-field override: if owner edits description in Arabic but keeps name in Kurdish, they're separate rows? No — same row can have `name_ku` (original) and `description_ar` (original) if we allow per-field `source_lang`. To fully support per-field source, either:
  - Add `source_lang_name`, `source_lang_description` (too many columns); or
  - Use JSON `field_sources` in the entity or translation table.
- **Simplest practical approach:** Keep `source_lang` at row level for now; if per-field is needed later, upgrade to normalized table (Option B) for that entity.

### 3.3 Translation Storage (Hybrid)
- Existing `name_en/ar/ku` remain as primary store.
- Add `MenuTranslations` table ONLY for future manual/automatic translations and for fields that need independent source tracking beyond the 3-column model.
- For Phase A.2: extend `MenuItems`/`MenuCategories` with `source_lang`; do NOT move existing data yet.

---

## 4. Example Records (Mixed-Language Restaurant)

Restaurant: `id='r1'`, `language='ku'` (default Sorani), `name_ku='ڕێستۆران'`

MenuCategory (category of desserts):
- `id='c1'`, `restaurant_id='r1'`
- `source_lang='ar'` (category name written in Arabic by owner)
- `name_ar='الحلويات'` (original)
- `name_ku='ئەمەش'` (translated)
- `name_en='Desserts'` (translated)
- `note_en='Traditional sweets'`

MenuItem (dish inside category):
- `id='d1'`, `category_id='c1'`
- `source_lang='ku'` (dish name in Sorani)
- `name_ku='کەبابی سورانی'` (original)
- `name_en='Sorani Kebab'` (translated)
- `name_ar='كباب سوراني'` (translated)
- `description_ku='لە گۆشتای گۆڕەس... ڕ'` (original description)
- `description_ar='وصف بالعربية'` (translated)
- `description_en='Made with fresh lamb'` (translated)

Visitor selects `ar` → sees category in Arabic (`name_ar`), dish name in Arabic (`name_ar`), description in Arabic (`description_ar`). If `description_ar` missing → falls back to `description_ku` (original source) not `description_en`.

---

## 5. Translation Lookup & Fallback Algorithm (Revised)

```
function resolve(fieldObj, fieldName, requestedLang, entitySourceLang) {
  // 1. Requested language translation if present
  const key = fieldName + '_' + requestedLang;
  if (fieldObj[key] != null && fieldObj[key] !== '') return fieldObj[key];

  // 2. Original source content (preserved; never overwritten)
  const sourceKey = fieldName + '_' + (entitySourceLang || 'en');
  if (fieldObj[sourceKey] != null && fieldObj[sourceKey] !== '') return fieldObj[sourceKey];

  // 3. English global fallback (for compatibility with existing data)
  const enKey = fieldName + '_en';
  if (fieldObj[enKey] != null && fieldObj[enKey] !== '') return fieldObj[enKey];

  // 4. Any non-empty available translation
  for (const l of ['ar','ku','en']) {
    const k = fieldName + '_' + l;
    if (fieldObj[k] != null && fieldObj[k] !== '') return fieldObj[k];
  }

  return '';
}
```
Rules:
- Never return empty if original exists.
- `entitySourceLang` comes from `MenuItem.source_lang` (or `Restaurants.language` if null).
- If `requestedLang === entitySourceLang`, step 1 = step 2 (same content).

---

## 6. Data Migration Strategy (For Existing Records — Not Executed)

1. **Add `source_lang` columns** (`ALTER TABLE MenuItems ADD source_lang NVARCHAR(10) DEFAULT 'en'`; same for `MenuCategories`; update `Restaurants.language` if missing).
2. **Backfill `source_lang`:**
   - If `name_ku` non-empty and `name_en`/`name_ar` empty → `source_lang='ku'`.
   - If `name_en` non-empty and others empty → `source_lang='en'`.
   - If mixed (all three present) → default to `Restaurants.language`; flag for manual review.
3. **No data movement:** Existing `name_en/ar/ku` kept exactly.
4. **JSON menus:** Update `draft_menu` / `published_menu` to include `sourceLang` at item/category level only when edited; existing JSON untouched.
5. **No batch translation:** Existing data preserved; translations added only when owner/editor creates them.

---

## 7. Impact Analysis

| Area | Impact |
|---|---|
| `MenuItems`/`MenuCategories` | `ALTER` to add `source_lang`; queries must include it for fallback accuracy |
| `Restaurants.language` | Already exists; ensure used at signup; no rename needed |
| `draft_menu`/`published_menu` | Optionally add `sourceLang` in JSON; backward-compatible (old JSON has no key, defaults to `Restaurants.language`) |
| Signup / settings | Owner selects default language; saved to `Restaurants.language`; new items inherit it |
| Editor save/update | Must preserve `source_lang`; must not allow translation to overwrite original column |
| Public API (`getPublicMenu`) | Must include `source_lang` in response; frontend `tx()` updated to use it |
| Frontend `tx()` | Update to accept optional `sourceLang`; fallback to source instead of always `en` |
| Manual translation UI | Needs `MenuTranslations` table or JSON field for edited translations; protected by `status` |
| `ku` compatibility | `ku` stays as internal code; `source_lang='ku'` works; `tx()` `lang='ku'` continues |

---

## 8. Manual Translation Editing & Protection

- Add `status` field to any new translation storage (`translated`, `manually_edited`, `pending`, `failed`, `outdated`).
- When manual edit saved, set `status='manually_edited'` and `updated_at`.
- Automatic translation (future Phase 4) checks `status`: skips `manually_edited`; updates `outdated` when `source_hash` changes.
- Original column (`name_ku` if source=ku) never touched by automatic process.

---

## 9. Provider Abstraction (Future — Not Implemented)

- Interface: `TranslationProvider.translate(text, fromLang, toLang)`.
- Implementations: Google Translate, DeepL, Azure Translator, local model.
- Selection made at server level; API key stored server-side (never frontend).
- `ku` → `ckb` mapping handled in provider wrapper, not in DB.

---

## 10. Risks & Edge Cases

- Mixed source in same restaurant: solved by per-row `source_lang`; category can be `ar`, item `ku`.
- Original overwritten: prevent by server validation (reject if update writes to `name_[source_lang]` without explicit original preservation).
- Visitor language = source language: returns original; no translation needed.
- Empty translation for requested lang: falls back to source, never blank.
- Existing `draft_menu` JSON missing `sourceLang`: default to `Restaurants.language`; safe.
- `cu`/`ckb` confusion: keep `ku`; only external display can map to `ckb` later.

---

## 11. Implementation Phases (With Approval Gates)

| Phase | Action | DB Impact | Approval Needed |
|---|---|---|---|
| A.2 (design) | This report | None | Already approved |
| A.2-1 | `ALTER` `source_lang` to `MenuItems`/`MenuCategories`; backfill | Migration + data update | **Yes — DB** |
| A.2-2 | Update `tx()` + `PublicSitePage` to use `source_lang` fallback | None | No |
| A.2-3 | Update editor save to preserve `source_lang`; add validation | API change only | No |
| B | Add `MenuTranslations` table (optional) + manual edit UI | Migration + new table | **Yes — DB + UI design** |
| C | Provider abstraction + automatic endpoint | None (if backend only) | **Yes — provider + key** |

---

## 12. Final Recommendation

- Use **Hybrid (C)**: extend tables with `source_lang` now; introduce `MenuTranslations` only when manual editing / provider integration needed.
- Keep `Restaurants.language` for default; allow per-row override.
- Preserve `ku`; do not rename DB columns.
- Update `tx()` fallback order: requested → source → `en`.
- All existing menus stay intact; no batch translation required.

---

## 13. Deliverable Confirmation

- Report created: `frontend/docs/PHASE_A2_LOCALIZATION_ARCHITECTURE.md`
- Zero files modified outside this document.
- Zero DB changes executed.
- Zero backend/API changes.
- Waiting for approval on Phase A.2-1 (`ALTER` + backfill) before any implementation.

**STOP — design complete; no implementation performed.**
