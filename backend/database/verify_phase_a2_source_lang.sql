-- Phase A.2 — Verification Queries (READ-ONLY / POST-MIGRATION)
-- Run only after migration execution is explicitly authorized.

-- =====================================================================
-- 1. Confirm new columns presence (dbo)
-- =====================================================================
SELECT [t].[name] AS table_name,
       [c].[name] AS column_name,
       [ty].[name] AS data_type
FROM sys.columns [c]
JOIN sys.tables [t] ON [c].[object_id] = [t].[object_id]
JOIN sys.types [ty] ON [c].[user_type_id] = [ty].[user_type_id]
WHERE [t].[name] IN ('MenuItems', 'MenuCategories')
  AND [c].[name] = 'source_lang';

-- =====================================================================
-- 2. Count rows missing source_lang (pre-backfill reference; non-modifying)
-- =====================================================================
SELECT 'MenuItems' AS table_name, COUNT(*) AS missing_source_lang FROM [dbo].[MenuItems] WHERE [source_lang] IS NULL
UNION ALL
SELECT 'MenuCategories', COUNT(*) FROM [dbo].[MenuCategories] WHERE [source_lang] IS NULL;

-- =====================================================================
-- 3. Identify ambiguous records for manual review (do NOT auto-update)
--    Ambiguous = more than one language column populated.
-- =====================================================================
SELECT 'MenuItems' AS table_name, [id], [restaurant_id],
       CASE WHEN [name_ku] IS NOT NULL AND [name_ku] <> N'' THEN 1 ELSE 0 END AS has_ku,
       CASE WHEN [name_ar] IS NOT NULL AND [name_ar] <> N'' THEN 1 ELSE 0 END AS has_ar,
       CASE WHEN [name_en] IS NOT NULL AND [name_en] <> N'' THEN 1 ELSE 0 END AS has_en
FROM [dbo].[MenuItems]
WHERE ([name_ku] IS NOT NULL AND [name_ku] <> N'')
   OR ([name_ar] IS NOT NULL AND [name_ar] <> N'')
   OR ([name_en] IS NOT NULL AND [name_en] <> N'')
ORDER BY has_ku + has_ar + has_en DESC;

SELECT 'MenuCategories' AS table_name, [id], [restaurant_id],
       CASE WHEN [name_ku] IS NOT NULL AND [name_ku] <> N'' THEN 1 ELSE 0 END AS has_ku,
       CASE WHEN [name_ar] IS NOT NULL AND [name_ar] <> N'' THEN 1 ELSE 0 END AS has_ar,
       CASE WHEN [name_en] IS NOT NULL AND [name_en] <> N'' THEN 1 ELSE 0 END AS has_en
FROM [dbo].[MenuCategories]
ORDER BY has_ku + has_ar + has_en DESC;

-- =====================================================================
-- 4. Check restaurant defaults for backfill reference
-- =====================================================================
SELECT [id], [name_en], [language] AS restaurant_default_lang FROM [dbo].[Restaurants];
