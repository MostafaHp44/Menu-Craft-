const sql = require('mssql');
const { hashPassword } = require('./src/utils/hash');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  const tx = new sql.Transaction(p);
  await tx.begin();
  try {
    // Existing user id for super@menucraft.demo
    const userRes = await new sql.Request(tx).input('e', sql.NVarChar, 'super@menucraft.demo').query("SELECT id FROM Users WHERE LOWEr(email)=LOWER(@e)");
    const userId = userRes.recordset[0].id;
    console.log('Existing user id:', userId);

    // Create RestaurantEmployees (authorization identity)
    const reId = require('crypto').randomUUID();
    await new sql.Request(tx).input('id', sql.NVarChar, reId).input('rid', sql.NVarChar, 'rest-1793437631499-27bf0').input('uid', sql.NVarChar, userId).input('role_id', sql.NVarChar, '0C12105B-209A-485D-B8EB-0C0067BDFA4F').input('access', sql.NVarChar, 'all').input('status', sql.NVarChar, 'active').input('invited_by', sql.NVarChar, null).query('INSERT INTO RestaurantEmployees (id, restaurant_id, user_id, role_id, branch_access_type, status, invited_by, invited_at, activated_at) VALUES (@id,@rid,@uid,@role_id,@access,@status,@invited_by,GETDATE(),GETDATE())');

    // Create Employees profile
    const empId = require('crypto').randomUUID();
    await new sql.Request(tx).input('id', sql.NVarChar, empId).input('rid', sql.NVarChar, 'rest-1793437631499-27bf0').input('name', sql.NVarChar, 'Super Admin').input('email', sql.NVarChar, 'super@menucraft.demo').input('user', sql.NVarChar, 'super').input('role', sql.NVarChar, 'super_admin').input('access', sql.NVarChar, 'all').input('is_active', sql.Bit, 1).query('INSERT INTO Employees (id, restaurant_id, name, email, username, role, branch_access_type, is_active, created_at, updated_at) VALUES (@id,@rid,@name,@email,@user,@role,@access,@is_active,GETDATE(),GETDATE())');

    await tx.commit();
    console.log('Direct created: user_id=', userId, '| restaurant_employee_id=', reId, '| employee_id=', empId);
  } catch (e) {
    await tx.rollback();
    console.error('FAILED:', e.message, '| code:', e.code);
  } finally {
    await p.close();
  }
})();
