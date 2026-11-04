-- Phase 4: Draft / Published Menu Separation

-- Step 1: Add draft_menu
IF COL_LENGTH('dbo.Restaurants', 'draft_menu') IS NULL
BEGIN
    ALTER TABLE dbo.Restaurants
    ADD draft_menu NVARCHAR(MAX) NULL;
END
GO

-- Step 2: Add published_menu
IF COL_LENGTH('dbo.Restaurants', 'published_menu') IS NULL
BEGIN
    ALTER TABLE dbo.Restaurants
    ADD published_menu NVARCHAR(MAX) NULL;
END
GO

-- Step 3: Copy existing menu to published_menu
UPDATE dbo.Restaurants
SET published_menu = menu
WHERE status = N'published'
  AND (published_menu IS NULL OR published_menu = N'');
GO

-- Step 4: Copy existing menu to draft_menu
UPDATE dbo.Restaurants
SET draft_menu = menu
WHERE draft_menu IS NULL OR draft_menu = N'';
GO

-- Preserve the legacy menu column.