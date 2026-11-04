/* Rollback Phase 2 — only drops new tables if they exist (non-destructive to Restaurants/Users/etc.) */
IF OBJECT_ID('EmployeeBranchAccess', 'U') IS NOT NULL DROP TABLE EmployeeBranchAccess;
IF OBJECT_ID('Employees', 'U') IS NOT NULL DROP TABLE Employees;
IF OBJECT_ID('Branches', 'U') IS NOT NULL DROP TABLE Branches;
