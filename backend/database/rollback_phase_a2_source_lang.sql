-- Phase A.2 Rollback — HARDENED
-- Target: MSSQL (dbo). Reversible only for columns added by this migration.
-- Do NOT drop pre-existing columns (name_en, name_ar, name_ku, etc.).
-- Preserve all original menu content.

SET NOCOUNT ON;

IF OBJECT_ID('dbo.MenuItems', 'U') IS NULL
BEGIN
    RAISERROR ('Table dbo.MenuItems missing. Rollback aborted.', 16, 1);
    RETURN;
END

IF OBJECT_ID('dbo.MenuCategories', 'U') IS NULL
BEGIN
    RAISERROR ('Table dbo.MenuCategories missing. Rollback aborted.', 16, 1);
    RETURN;
END

-- Only drop if this migration added it (verified by COL_LENGTH)
IF COL_LENGTH('dbo.MenuItems', 'source_lang') IS NOT NULL
BEGIN
    ALTER TABLE [dbo].[MenuItems] DROP COLUMN [source_lang];
    PRINT 'DROPPED: dbo.MenuItems.source_lang';
END
ELSE
BEGIN
    PRINT 'SKIPPED: dbo.MenuItems.source_lang does not exist (not added by this migration)';
END

IF COL_LENGTH('dbo.MenuCategories', 'source_lang') IS NOT NULL
BEGIN
    ALTER TABLE [dbo].[MenuCategories] DROP COLUMN [source_lang];
    PRINT 'DROPPED: dbo.MenuCategories.source_lang';
END
ELSE
BEGIN
    PRINT 'SKIPPED: dbo.MenuCategories.source_lang does not exist (not added by this migration)';
END
