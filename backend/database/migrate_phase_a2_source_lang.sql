-- Phase A.2 — Source Language Migration (Hybrid C) — HARDENED
-- Target: MSSQL (dbo schema). Idempotent. Non-destructive.
-- READ-ONLY PREPARATION — do NOT execute until explicitly authorized.

SET NOCOUNT ON;

-- =====================================================================
-- Check table presence in dbo schema before altering
-- =====================================================================
IF OBJECT_ID('dbo.MenuItems', 'U') IS NULL
BEGIN
    RAISERROR ('Table dbo.MenuItems not found. Aborting.', 16, 1);
    RETURN;
END

IF OBJECT_ID('dbo.MenuCategories', 'U') IS NULL
BEGIN
    RAISERROR ('Table dbo.MenuCategories not found. Aborting.', 16, 1);
    RETURN;
END

-- =====================================================================
-- 1. MenuItems — add source_lang (NVARCHAR(10) NULL) if not present
-- =====================================================================
IF COL_LENGTH('dbo.MenuItems', 'source_lang') IS NULL
BEGIN
    ALTER TABLE [dbo].[MenuItems] ADD [source_lang] NVARCHAR(10) NULL;
    PRINT 'ADDED: dbo.MenuItems.source_lang (NVARCHAR(10) NULL)';
END
ELSE
BEGIN
    PRINT 'SKIPPED: dbo.MenuItems.source_lang already exists';
END

-- =====================================================================
-- 2. MenuCategories — add source_lang if not present
-- =====================================================================
IF COL_LENGTH('dbo.MenuCategories', 'source_lang') IS NULL
BEGIN
    ALTER TABLE [dbo].[MenuCategories] ADD [source_lang] NVARCHAR(10) NULL;
    PRINT 'ADDED: dbo.MenuCategories.source_lang (NVARCHAR(10) NULL)';
END
ELSE
BEGIN
    PRINT 'SKIPPED: dbo.MenuCategories.source_lang already exists';
END

-- =====================================================================
-- 3. Backfill Strategy (READ-ONLY DOCUMENTATION; NOT EXECUTED HERE)
--
-- Rules for safe classification from verified existing data:
--   IF only name_ku exists (name_en IS NULL AND name_ar IS NULL) → source_lang = 'ku'
--   IF only name_ar exists (name_en IS NULL AND name_ku IS NULL) → source_lang = 'ar'
--   IF ambiguous (multiple non-empty) → use Restaurants.language (verified) for that restaurant; do NOT guess 'en'
--   IF source_lang already NON-NULL → do NOT overwrite.
--
-- Recommended separate UPDATE (requires authorization, not part of this file):
--
--     UPDATE m SET m.source_lang =
--         CASE
--             WHEN m.name_ku IS NOT NULL AND m.name_ku <> N'' 
--                  AND (m.name_en IS NULL OR m.name_en = N'')
--                  AND (m.name_ar IS NULL OR m.name_ar = N'') 
--                  THEN 'ku'
--             WHEN m.name_ar IS NOT NULL AND m.name_ar <> N'' 
--                  AND (m.name_en IS NULL OR m.name_en = N'')
--                  AND (m.name_ku IS NULL OR m.name_ku = N'') 
--                  THEN 'ar'
--             ELSE ISNULL(r.language, 'en') -- use verified restaurant default; NEVER assume 'en'
--         END
--     FROM MenuItems m
--     INNER JOIN Restaurants r ON m.restaurant_id = r.id
--     WHERE m.source_lang IS NULL; -- protect existing values
--
-- Similar for MenuCategories (join Restaurants).
-- =====================================================================
