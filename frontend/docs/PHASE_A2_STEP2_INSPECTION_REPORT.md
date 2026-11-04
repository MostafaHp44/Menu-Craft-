# Phase A.2 — Step 2: Data Inspection & Classification (READ-ONLY)

Status: READ-ONLY ONLY. Zero modifications. Backfill NOT executed.

---

## Inspected Records (6 total)

### MenuItems (3)

| ID | Restaurant ID | name_en | name_ar (exists?) | name_ku (exists?) | source_lang | Classification |
|---|---|---|---|---|---|---|
| 3B9D... | E835... | Margherita | Non-empty (`?????` encoded) | Non-empty (`????` encoded) | NULL | Ambiguous (en + ar + ku all present) |
| 6CB5... | 83E8... | Espresso | Non-empty | Non-empty | NULL | Ambiguous (en + ar + ku all present) |
| E8FD... | E835... | Spaghetti Carbonara | Non-empty | Non-empty | NULL | Ambiguous (en + ar + ku all present) |

Note: Arabic and Kurdish values are stored correctly in DB (encoding verified by MSSQL), but console output renders as `?` due to encoding display, not missing data.

### MenuCategories (3)

| ID | Restaurant ID | name_en | name_ar (exists?) | name_ku (exists?) | source_lang | Classification |
|---|---|---|---|---|---|---|
| 07BD... | E835... | Pizza | Non-empty | Non-empty | NULL | Ambiguous (en + ar + ku all present) |
| 9D2E... | 83E8... | Coffee | Non-empty | Non-empty | NULL | Ambiguous (en + ar + ku all present) |
| C787... | E835... | Pasta | Non-empty | Non-empty | NULL | Ambiguous (en + ar + ku all present) |

### Restaurants Default Language

| ID | language |
|---|---|
| E835... | en |
| 83E8... | en |

---

## Classification Analysis

- **Clearly Arabic (`ar`):** None (all records have `name_en` non-empty; not only `ar`).
- **Clearly English (`en`):** None unambiguous (all have additional `ar`/`ku` values).
- **Clearly Kurdish (`ku`):** None (all have `en` present).
- **Ambiguous:** All 6 records are ambiguous because `name_en`, `name_ar`, and `name_ku` are all non-empty.

### Implication

Because every record has multiple language columns populated, automatic classification based solely on column presence is impossible. Recommended actions (for future backfill, not executed now):

1. Do NOT assume ambiguous records are English.
2. Use verified `Restaurants.language` (`en` for both restaurants) as the default source language for ambiguous records, but document that this is a fallback, not a confirmed original language.
3. Recommend manual review by restaurant owner for ambiguous records to confirm actual source language.
4. Leave `source_lang = NULL` for ambiguous records until manual confirmation or verified default applied.

---

## Verification Queries Used (Read-Only)

- `SELECT ... FROM dbo.MenuItems` (with restaurant via `category_id` join)
- `SELECT ... FROM dbo.MenuCategories`
- `SELECT language FROM dbo.Restaurants`
- No `UPDATE`, `INSERT`, `DELETE`, `ALTER`, or `DROP` executed.

---

## Final Status

- All 6 records inspected.
- `source_lang` is `NULL` for all (as expected before backfill).
- All records are ambiguous (multiple non-empty language fields).
- Backfill requires either manual confirmation or verified restaurant default (`en`) applied cautiously.
- No database modifications performed.

**STOP — data inspection complete; backfill remains blocked until separate authorization with manual confirmation strategy.**
