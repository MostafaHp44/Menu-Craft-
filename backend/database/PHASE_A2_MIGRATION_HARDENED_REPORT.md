# Phase A.2 — Migration Review & Hardening Summary (READ-ONLY)

Status: FILES UPDATED. ZERO DATABASE MODIFICATIONS EXECUTED.

---

## Updated / Hardended Files

| File | Changes |
|---|---|
| `migrate_phase_a2_source_lang.sql` | Added `dbo.` schema checks (`OBJECT_ID`), `COL_LENGTH` idempotency, backfill rules documented (not executed) |
| `migrate_phase_a2_source_lang.js` | Added `tableExists` check, `columnExists` validation, safe `try/finally` with `pool.close()`, `EXECUTE_PHASE_A2` guard preserved, reporting per column |
| `rollback_phase_a2_source_lang.sql` | Added `OBJECT_ID` table checks; only drops if `COL_LENGTH` confirms column exists; does NOT drop pre-existing columns |
| `verify_phase_a2_source_lang.sql` | Added ambiguous-record identification queries; column presence check; restaurant default lookup |

---

## Ambiguous Existing Records Strategy

Based on verified schema (`name_ku`, `name_ar`, `name_en` in `MenuItems`/`MenuCategories`; `Restaurants.language`):

- **Only `name_ku` non-empty** → `source_lang = 'ku'`
- **Only `name_ar` non-empty** → `source_lang = 'ar'`
- **Multiple non-empty** (e.g., `name_ku` + `name_ar`) → ambiguous; must use verified `Restaurants.language` for that restaurant instead of assuming `en`.
- **All empty** → ambiguous; set `NULL` or use restaurant default.
- **Existing `source_lang` non-NULL** → never overwrite.

No automatic backfill executed; these rules are documented in SQL comments and verification queries.

---

## Migration Safety

- **Target engine:** MSSQL (`COL_LENGTH`, `OBJECT_ID`, `dbo` schema confirmed).
- **Idempotent:** Both `ALTER` statements guarded by `COL_LENGTH` checks.
- **Table protection:** `OBJECT_ID` checks abort if `MenuItems`/`MenuCategories` missing.
- **No destructive actions:** Only `ADD` columns; no `UPDATE`/`DELETE` in migration.
- **Connection safety:** JS closes pool in `finally` block.
- **Execution guard:** `EXECUTE_PHASE_A2=true` required; default is blocked.

---

## Rollback Safety

- Only drops `source_lang` if `COL_LENGTH` confirms it exists.
- Does not drop any pre-existing column (`name_en`, `name_ar`, `name_ku`, etc.).
- Partial state safe: if migration partially completed (e.g., `MenuItems` only), rollback drops existing columns individually without affecting others.
- Original menu content fully preserved.

---

## Backfill (Not Executed)

Backfill query documented in `.sql` and `.js` (not executed):
- Uses `WHERE source_lang IS NULL` to protect existing values.
- Derives from verified column data (`name_ku`, `name_ar`, `name_en`) and `Restaurants.language`.
- Never assumes ambiguous records are English (`'en'`).

---

## Final Status

- Migration files complete and hardened.
- No `ALTER`, `UPDATE`, `DROP`, or DB connection write executed.
- Ambiguous record identification available via verification queries (non-modifying).
- Awaiting explicit authorization to execute Phase A.2 Step 1.

**STOP — no database modifications performed. Ready for authorization.**
