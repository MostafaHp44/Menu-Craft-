const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  const r = await p.request().input('rid', sql.NVarChar, 'rest-1793437631499-27bf0').query("SELECT mc.id AS cat_id, mc.name_en AS cat_name FROM MenuCategories mc WHERE mc.restaurant_id = @rid");
  console.log('Categories:', r.recordset);
  await p.close();
})();
