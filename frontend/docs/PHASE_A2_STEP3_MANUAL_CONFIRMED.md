# Phase A.2 — Step 3: Manual Source Language Confirmation (READ-ONLY)

Status: READ-ONLY DESIGN ONLY. No database writes executed. All records marked PENDING MANUAL CONFIRMATION.

---

## 1. Detailed Review Table (All 6 Records — PENDING)

| # | Table | Record ID | Restaurant ID | Restaurant lang | name_en | name_ar (exists?) | name_ku (exists?) | source_lang | Description fields (if available) | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | MenuItems | 3B9D6216-5FBF-4BE0-8CEA-9AA2E8152097 | E835A82D-7442-4775-A486-F47104A17BE1 | en | Margherita | Yes (encoded) | Yes (encoded) | NULL | Not shown in inspection (describe not queried) | **PENDING MANUAL CONFIRMATION** |
| 2 | MenuItems | 6CB50869-87B9-4741-8488-C81C01AEDD5D | 83E8FE86-C2B7-4545-A333-B2238C2CC6FD | en | Espresso | Yes (encoded) | Yes (encoded) | NULL | Not shown | **PENDING MANUAL CONFIRMATION** |
| 3 | MenuItems | E8FDAF91-498C-4131-8C64-16B6249847A8 | E835A82D-7442-4775-A486-F47104A17BE1 | en | Spaghetti Carbonara | Yes (encoded) | Yes (encoded) | NULL | Not shown | **PENDING MANUAL CONFIRMATION** |
| 4 | MenuCategories | 07BD71C5-22AF-48FF-9584-5FAFC6DA0533 | E835A82D-7442-4775-A486-F47104A17BE1 | en | Pizza | Yes (encoded) | Yes (encoded) | NULL | note fields not shown | **PENDING MANUAL CONFIRMATION** |
| 5 | MenuCategories | 9D2E10FD-4745-47C0-B3C3-3CADE1A69E20 | 83E8FE86-C2B7-4545-A333-B2238C2CC6FD | en | Coffee | Yes (encoded) | Yes (encoded) | NULL | note fields not shown | **PENDING MANUAL CONFIRMATION** |
| 6 | MenuCategories | C787F6B5-D884-4F47-AA87-0F28E508A30F | E835A82D-7442-4775-A486-F47104A17BE1 | en | Pasta | Yes (encoded) | Yes (encoded) | NULL | note fields not shown | **PENDING MANUAL CONFIRMATION** |

---

## 2. Note on Original Source Language

- All 6 records are **ambiguous** (`name_en`, `name_ar`, `name_ku` all non-empty).
- `Restaurants.language = en` for both restaurants, but this is a **restaurant default**, not a confirmed per-record original language.
- No inference is made in this step.
- Each record must receive explicit manual confirmation before any `UPDATE`.

---

## 3. Proposed SQL Update Script (NOT EXECUTED — Requires Per-Record Approval)

This script updates **only** the explicitly approved record IDs, only `source_lang`, and only where `source_lang IS NULL`. It uses a transaction with verification.

```sql
BEGIN TRANSACTION;
BEGIN TRY
    -- Confirm source_lang is NULL before updating (protect existing)
    IF EXISTS (SELECT 1 FROM dbo.MenuItems WHERE id = '3B9D6216-5FBF-4BE0-8CEA-9AA2E8152097' AND source_lang IS NULL)
        UPDATE dbo.MenuItems SET source_lang = 'en' WHERE id = '3B9D6216-5FBF-4BE0-8CEA-9AA2E8152097';

    IF EXISTS (SELECT 1 FROM dbo.MenuItems WHERE id = '6CB50869-87B9-4741-8488-C81C01AEDD5D' AND source_lang IS NULL)
        UPDATE dbo.MenuItems SET source_lang = 'en' WHERE id = '6CB50869-87B9-4741-8488-C81C01AEDD5D';

    IF EXISTS (SELECT 1 FROM dbo.MenuItems WHERE id = 'E8FDAF91-498C-4131-8C64-16B6249847A8' AND source_lang IS NULL)
        UPDATE dbo.MenuItems SET source_lang = 'en' WHERE id = 'E8FDAF91-498C-4131-8C64-16B6249847A8';

    IF EXISTS (SELECT 1 FROM dbo.MenuCategories WHERE id = '07BD71C5-22AF-48FF-9584-5FAFC6DA0533' AND source_lang IS NULL)
        UPDATE dbo.MenuCategories SET source_lang = 'en' WHERE id = '07BD71C5-22AF-48FF-9584-5FAFC6DA0533';

    IF EXISTS (SELECT 1 FROM dbo.MenuCategories WHERE id = '9D2E10FD-4745-47C0-B3C3-3CADE1A69E20' AND source_lang IS NULL)
        UPDATE dbo.MenuCategories SET source_lang = 'en' WHERE id = '9D2E10FD-4745-47C0-B3C3-3CADE1A69E20';

    IF EXISTS (SELECT 1 FROM dbo.MenuCategories WHERE id = 'C787F6B5-D884-4F47-AA87-0F28E508A30F' AND source_lang IS NULL)
        UPDATE dbo.MenuCategories SET source_lang = 'en' WHERE id = 'C787F6B5-D884-4F47-AA87-0F28E508A30F';

    COMMIT;
END TRY
BEGIN CATCH
    ROLLBACK;
    THROW;
END CATCH;
```

**Safety rules embedded:**
- Each `UPDATE` guarded by `IF EXISTS ... AND source_lang IS NULL` (never overwrites non-NULL).
- Only `source_lang` column updated.
- Only 6 explicit IDs.
- Transaction rollback on error.

---

## 4. Verification Queries (Post-Update — Only After Approval & Execution)

```sql
-- Confirm updated values
SELECT id, source_lang FROM dbo.MenuItems WHERE id IN ('3B9D...','6CB5...','E8FD...');
SELECT id, source_lang FROM dbo.MenuCategories WHERE id IN ('07BD...','9D2E...','C787...');

-- Confirm no unexpected changes (original columns preserved)
SELECT id, name_en, name_ar, name_ku, source_lang FROM dbo.MenuItems WHERE id IN (...);
```

---

## 5. Approval Required Per Record

Before any execution, the owner/user must confirm for each ID:

- [ ] 3B9D... — `en`
- [ ] 6CB5... — `en`
- [ ] E8FD... — `en`
- [ ] 07BD... — `en`
- [ ] 9D2E... — `en`
- [ ] C787... — `en`

If any should be `ar` or `ku` instead, replace value before execution.

---

## 6. STOP Condition

No `UPDATE` executed. All 6 records remain `PENDING MANUAL CONFIRMATION`. Script prepared only.

**STOP — wait for per-record approval before any execution.**
