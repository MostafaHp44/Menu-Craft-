const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  const users = await p.request().input('e', sql.NVarChar, 'super@menucraft.demo').query("SELECT id, name, email, restaurant_id, role, status FROM Users WHERE LOWER(email)=LOWER(@e)");
  console.log('Users:', users.recordset);
  const emps = await p.request().input('e', sql.NVarChar, 'super@menucraft.demo').query("SELECT id, restaurant_id, name, email, role FROM Employees WHERE LOWER(email)=LOWER(@e)");
  console.log('Employees:', emps.recordset);
  await p.close();
})();
