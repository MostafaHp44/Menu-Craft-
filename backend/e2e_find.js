const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  const r = await p.request().query("SELECT TOP 1 id AS restaurant_id FROM Restaurants");
  console.log('restaurant', r.recordset[0]);
  const u = await p.request().input('rid', sql.NVarChar, r.recordset[0].restaurant_id).query("SELECT TOP 1 id, restaurant_id, email FROM Users WHERE restaurant_id=@rid AND role='client'");
  console.log('owner', u.recordset[0]);
  const b = await p.request().input('rid', sql.NVarChar, r.recordset[0].restaurant_id).query("SELECT TOP 1 id, name_en FROM Branches WHERE restaurant_id=@rid");
  console.log('branch', b.recordset[0]);
  await p.close();
})();
