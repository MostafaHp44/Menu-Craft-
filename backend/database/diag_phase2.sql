-- Diagnostic: find what conflicts
SELECT t.name AS table_name, i.name AS index_name
FROM sys.indexes i JOIN sys.tables t ON i.object_id = t.object_id
WHERE t.name IN ('Branches', 'Employees', 'EmployeeBranchAccess')
UNION ALL
SELECT c.name AS column_name, t.name AS table_name FROM sys.columns c JOIN sys.tables t ON c.object_id = t.object_id WHERE t.name = 'Branches'
UNION ALL
SELECT t.name AS table_name,
  SUM(CASE WHEN i.name LIKE '%ix%' THEN 1 ELSE 0 END) AS ix_count
FROM sys.tables t LEFT OUTER JOIN sys.indexes i ON i.object_id = t.object_id WHERE t.name IN ('Branches','Employees','EmployeeBranchAccess') GROUP BY t.name;
