const sql = require('mssql');
const crypto = require('crypto');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  const tx = new sql.Transaction(p); await tx.begin();
  const reId = crypto.randomUUID();
  const userId = crypto.randomUUID();
  const branchId = crypto.randomUUID();
  await p.request().input('id', sql.NVarChar, branchId).input('rid', sql.NVarChar, 'rest-1793437631499-27bf0').input('n', sql.NVarChar, 'TXB').query('INSERT INTO Branches (id, restaurant_id, name_en, is_active, created_at) VALUES (@id,@rid,@n,1,GETDATE())');
  try {
    await new sql.Request(tx).input('id', sql.NVarChar, userId).input('n', sql.NVarChar, 'TX').input('e', sql.NVarChar, 'tx@t.invalid').input('p', sql.NVarChar, 'h').input('rid', sql.NVarChar, 'rest-1793437631499-27bf0').input('r', sql.NVarChar, 'worker').input('st', sql.NVarChar, 'active').query('INSERT INTO Users (id,name,email,password_hash,restaurant_id,role,status,created_at) VALUES (@id,@n,@e,@p,@rid,@r,@st,GETDATE())');
    await new sql.Request(tx).input('id', sql.NVarChar, reId).input('rid', sql.NVarChar, 'rest-1793437631499-27bf0').input('uid', sql.NVarChar, userId).input('r', sql.NVarChar, '489BBCFF-AC73-4163-85EB-57D7108C3F5F').input('a', sql.NVarChar, 'assigned').input('st', sql.NVarChar, 'active').input('inv', sql.NVarChar, userId).query('INSERT INTO RestaurantEmployees (id,restaurant_id,user_id,role_id,branch_access_type,status,invited_by,invited_at,activated_at) VALUES (@id,@rid,@uid,@r,@a,@st,@inv,GETDATE(),GETDATE())');
    console.log('RE inserted', reId);
    await new sql.Request(tx).input('id', sql.NVarChar, crypto.randomUUID()).input('re', sql.NVarChar, reId).input('bid', sql.NVarChar, branchId).query('INSERT INTO EmployeeBranchAccess (id,restaurant_employee_id,branch_id,allowed) VALUES (@id,@re,@bid,1)');
    console.log('EBA inserted');
    await tx.commit();
    console.log('COMMIT OK');
    // cleanup
    await p.request().input('uid', sql.NVarChar, userId).query('DELETE FROM Users WHERE id=@uid');
    await p.request().input('re', sql.NVarChar, reId).query('DELETE FROM EmployeeBranchAccess WHERE restaurant_employee_id=@re');
    await p.request().input('re', sql.NVarChar, reId).query('DELETE FROM RestaurantEmployees WHERE id=@re');
  } catch (e) {
    await tx.rollback(); console.log('ROLLBACK', e.message);
  }
  await p.close();
})();
