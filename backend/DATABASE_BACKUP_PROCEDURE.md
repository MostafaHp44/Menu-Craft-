================================================================================
                     MENUCRAFT — DATABASE BACKUP PROCEDURE
================================================================================

Last Updated: October 30, 2026
Database: menucraft_docker (MSSQL on localhost:1433)
Server: sa/YourStrong@Passw0rd

================================================================================
                         1. BACKUP COMMANDS
================================================================================

=== Full Database Backup ===
sqlcmd -C -S localhost -U sa -P 'YourStrong@Passw0rd' -d menucraft_docker
   -Q "BACKUP DATABASE [menucraft_docker] 
        TO DISK = N'C:\Backup\menucraft_full_$(GETDATE).bak' 
        WITH INIT, 
        NAME = N'menucraft_full_backup', 
        NOSKIP, 
        NOREWIND, 
        STATS = 10, 
        CHECKSUM"

=== Transaction Log Backup (Point-in-time recovery) ===
sqlcmd -C -S localhost -U sa -P 'YourStrong@Passw0rd' -d menucraft_docker
   -Q "BACKUP LOG [menucraft_docker] 
        TO DISK = N'C:\Backup\menucraft_log_$(GETDATE).trn' 
        WITH INIT, 
        NAME = N'menucraft_log_backup', 
        NOREWIND, 
        STATS = 10, 
        CHECKSUM"

=== Backup Specific Tables (Selective) ===
sqlcmd -C -S localhost -U sa -P 'YourStrong@Passw0rd' -d menucraft_docker
   -Q "BACKUP DATABASE [menucraft_docker] 
        TO DISK = N'C:\Backup\menucraft_selective.bak' 
        WITH INIT, 
        NAME = N'menucraft_selective', 
        STATS = 5
   FOR LOG"

================================================================================
                         2. RESTORE PROCEDURE
================================================================================

=== Full Database Restore (WARNING: Overwrites existing data) ===
sqlcmd -C -S localhost -U sa -P 'YourStrong@Passw0rd' -d master
   -Q "RESTORE DATABASE [menucraft_docker] 
        FROM DISK = N'C:\Backup\menucraft_full.bak' 
        WITH REPLACE, 
        REPLACE, 
        STATS = 5"

=== Restore to Different Database Name (Safe for testing) ===
sqlcmd -C -S localhost -U sa -P 'YourStrong@Passw0rd' -d master
   -Q "RESTORE DATABASE [menucraft_docker_test] 
        FROM DISK = N'C:\Backup\menucraft_full.bak' 
        WITH REPLACE, 
        MOVE N'menucraft_docker' TO N'C:\Data\menucraft_docker_test.mdf', 
        MOVE N'menucraft_docker_log' TO N'C:\Data\menucraft_docker_test.ldf', 
        STATS = 5"

=== Verify Backup Integrity ===
sqlcmd -C -S localhost -U sa -P 'YourStrong@Passw0rd' -d menucraft_docker
   -Q "RESTORE VERIFYONLY FROM DISK = N'C:\Backup\menucraft_full.bak' WITH CHECKSUM"

================================================================================
                         3. BACKUP RETENTION RECOMMENDATIONS
================================================================================

Daily Full Backups:
- Keep last 7 days of full backups
- Rotate weekly full backups (keep 4 weeks monthly)
- Automated via SQL Server Agent or scheduled task

Transaction Log Backups:
- Every 2-4 hours during business days
- Before any major schema changes
- Before production deployments

Minimum Retention:
- 7 days of daily full backups
- 2 weeks of transaction log backups
- 3 months of weekly full backups

Storage Requirements:
- Current database size: ~500MB (estimated based on row counts)
- Include 20% overhead for log growth
- Store backups on separate storage from production database

================================================================================
                         4. TESTED RESTORATION
================================================================================

Test Restoration Steps (DO NOT restore over production database):

=== Step 1: Create Test Database ===
sqlcmd -C -S localhost -U sa -P 'YourStrong@Passw0rd' -d master
   -Q "CREATE DATABASE menucraft_docker_test"

=== Step 2: Restort Backup ===
sqlcmd -C -S localhost -U sa -P 'YourStrong@Passw0rd' -d master
   -Q "RESTORE DATABASE [menucraft_docker_test] 
        FROM DISK = N'C:\Backup\menucraft_full.bak' 
        WITH REPLACE, 
        MOVE N'menucraft_docker' TO N'C:\Data\menucraft_docker_test.mdf', 
        MOVE N'menucraft_docker_log' TO N'C:\Data\menucraft_docker_test.ldf'"

=== Step 3: Verify Data Integrity ===
sqlcmd -C -S localhost -U sa -P 'YourStrong@Passw0rd' -d menucraft_docker_test
   -Q "SELECT COUNT(*) AS user_count FROM Users"
   -Q "SELECT COUNT(*) AS restaurant_count FROM Restaurants"
   -Q "SELECT COUNT(*) AS subscription_count FROM Subscriptions"
   -Q "SELECT COUNT(*) AS site_count FROM UserRestaurants"

=== Step 4: Test Application Connection ===
- Start the MenuCraft backend with test database connection string
- Verify all endpoints function correctly
- Confirm no data corruption or missing relationships

=== Step 5: Document Restoration Evidence ===
- Record backup file sizes and locations
- Record restoration timestamps
- Verify row counts match expected values
- Test critical workflows (login, website creation, publishing)

================================================================================
                         5. AUTOMATION RECOMMENDATIONS
================================================================================

SQL Server Agent Job (Full Backup Daily at 2AM):
```sql
DECLARE @backupPath NVARCHAR(500) = N'C:\Backup\menucraft_' + 
   REPLACE(CONVERT(NVARCHAR(10), GETDATE(), 120), N'-', N'') + N'.bak';

BACKUP DATABASE [menucraft_docker] 
TO DISK = @backupPath 
WITH INIT, 
NAME = N'menucraft_daily_backup', 
NORECOVERY, 
STATS = 10, 
 CHECKSUM;
```

SQL Server Agent Job (Log Backup Every 4 Hours):
```sql
DECLARE @logPath NVARCHAR(500) = N'C:\Backup\menucraft_log_' + 
   REPLACE(CONVERT(NVARCHAR(10), GETDATE(), 120), N'-', N'') + N'.trn';

BACKUP LOG [menucraft_docker] 
TO DISK = @logPath 
WITH INIT, 
NAME = N'menucraft_log_backup', 
STATS = 10, 
 CHECKSUM;
```

Windows Task Scheduler:
- Run sqlcmd commands as described above
- Email notifications on failure
- Retain backups on separate drive/NAS

================================================================================
                         6. VERIFICATION CHECKLIST
================================================================================

□ Backup command syntax verified
□ Restore procedure documented and tested on test database
□ Backup integrity CHECKSUM validated
□ Row counts confirmed after restoration
□ Critical workflows tested post-restoration
□ Backup storage location confirmed separate from production
□ Retention policy documented and actionable
□ Emergency restore time objective (RTO) defined
□ Data loss objective (RPO) defined (e.g., last 4 hours of logs)
□ Backup media (disk/tape) tested for readability
□ Documentation signed off by team lead