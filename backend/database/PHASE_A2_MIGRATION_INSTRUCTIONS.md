# Phase A.2 — Step 1 Migration Preparation (NOT EXECUTED)

Status: PREPARED ONLY. Zero SQL executed against live DB. Zero data changed.

## Created Files

| File | Purpose |
|---|---|
| `backend/database/migrate_phase_a2_source_lang.sql` | Idempotent SQL (`COL_LENGTH` checks, `ALTER`) |
| `backend/database/migrate_phase_a2_source_lang.js` | JS runner (blocked by `EXECUTE_PHASE_A2` flag) |
| `backend/database/rollback_phase_a2_source_lang.sql` | Reversible rollback (`DROP COLUMN`) |
| `backend/database/verify_phase_a2_source_lang.sql` | Read-only verification queries |

## Safe Default Strategy (Not Executed)

Based on verified schema (`init.sql`):
- Existing `MenuItems` and `MenuCategories` have `name_en`, `name_ar`, `name_ku`.
- `Restaurants.language` exists (`DEFAULT 'en'`).
- Backfill logic (documented in `.sql`):
  - If `name_ku` non-empty and others empty → `source_lang='ku'`.
  - If `name_ar` non-empty and others empty → `source_lang='ar'`.
  - Otherwise default to `Restaurants.language` (or `'en'` if ambiguous).
- This avoids guessing; it derives from verified existing column population.

## Migration Compatibility

- Engine: MSSQL (matches `mssql` driver and `COL_LENGTH` / `OBJECT_ID` conventions).
- Idempotent: `IF COL_LENGTH(...) IS NULL` prevents double execution.
- Non-destructive: only `ADD` columns; no `DROP`/`UPDATE`/`DELETE` of content.
- Reversible: rollback `.sql` removes added columns only (original data untouched).

## Execution Instructions (Requires Authorization)

1. Confirm authorization from user.
2. Set environment if using JS runner: `EXECUTE_PHASE_A2=true`.
3. Execute SQL directly or via `node backend/database/migrate_phase_a2_source_lang.js`.
4. After execution, run verification queries (`verify_phase_a2_source_lang.sql`).
5. Backfill with verified data strategy (separate step, requires authorization).

## What Was NOT Done (Per Restrictions)

- No `ALTER TABLE` executed.
- No `UPDATE` executed.
- No `MenuTranslations` table created (approved for future phase, not this step).
- No API/model/frontend changes.
- No package installations.
- No destructive SQL.

## Stop Condition

Migration files are complete and verified. **STOP — do NOT execute SQL or JS until user explicitly authorizes Phase A.2 execution.**
