/* ==================================================================== *
 * Phase 2 Migration — Branches / Employees / EmployeeBranchAccess
 * Approved test DB only: menucraft_tests_docker_2b1
 * Compatible with existing SQL Server architecture (init.sql convention)
 * Non-destructive: checks existence first, uses defaults, preserves data
 * ==================================================================== */

/* ---------- 1. Branches ---------- */
IF OBJECT_ID('Branches', 'U') IS NULL
BEGIN
  CREATE TABLE Branches (
    id VARCHAR(100) PRIMARY KEY DEFAULT NEWID(),
    restaurant_id VARCHAR(100) NOT NULL,
    name_en NVARCHAR(200) NULL,
    name_ar NVARCHAR(200) NULL,
    name_ku NVARCHAR(200) NULL,
    address NVARCHAR(500) NULL,
    phone NVARCHAR(50) NULL,
    accepting_orders BIT DEFAULT 1,
    is_active BIT DEFAULT 1,
    opening_hours NVARCHAR(MAX) NULL,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Branches_Restaurants FOREIGN KEY (restaurant_id) REFERENCES Restaurants(id)
  );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Branches_Restaurant' AND object_id = OBJECT_ID('Branches'))
CREATE NONCLUSTERED INDEX IX_Branches_Restaurant ON Branches(restaurant_id);
GO

/* ---------- 2. Employees ---------- */
IF OBJECT_ID('Employees', 'U') IS NULL
BEGIN
  CREATE TABLE Employees (
    id VARCHAR(100) PRIMARY KEY DEFAULT NEWID(),
    restaurant_id VARCHAR(100) NOT NULL,
    name NVARCHAR(200) NOT NULL,
    email NVARCHAR(255) NULL,
    username NVARCHAR(200) NULL,
    password_hash NVARCHAR(500) NULL,
    role NVARCHAR(50) NOT NULL DEFAULT 'waiter',
    is_active BIT DEFAULT 1,
    branch_access_type NVARCHAR(20) NOT NULL DEFAULT 'none',
    last_activity DATETIME NULL,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Employees_Restaurants FOREIGN KEY (restaurant_id) REFERENCES Restaurants(id)
  );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Employees_Restaurant' AND object_id = OBJECT_ID('Employees'))
CREATE NONCLUSTERED INDEX IX_Employees_Restaurant ON Employees(restaurant_id);
GO

/* ---------- 3. EmployeeBranchAccess ---------- */
IF OBJECT_ID('EmployeeBranchAccess', 'U') IS NULL
BEGIN
  CREATE TABLE EmployeeBranchAccess (
    id VARCHAR(100) PRIMARY KEY DEFAULT NEWID(),
    employee_id VARCHAR(100) NOT NULL,
    branch_id VARCHAR(100) NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_EBA_Employees FOREIGN KEY (employee_id) REFERENCES Employees(id) ON DELETE CASCADE,
    CONSTRAINT FK_EBA_Branches FOREIGN KEY (branch_id) REFERENCES Branches(id) ON DELETE CASCADE,
    CONSTRAINT UQ_EBA_Employee_Branch UNIQUE (employee_id, branch_id)
  );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_EBA_Employee' AND object_id = OBJECT_ID('EmployeeBranchAccess'))
CREATE NONCLUSTERED INDEX IX_EBA_Employee ON EmployeeBranchAccess(employee_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_EBA_Branch' AND object_id = OBJECT_ID('EmployeeBranchAccess'))
CREATE NONCLUSTERED INDEX IX_EBA_Branch ON EmployeeBranchAccess(branch_id);
GO
