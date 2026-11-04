const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  const r = await p.request().input('id', sql.NVarChar, 'rest-1793437631499-27bf0').query("SELECT COUNT(*) AS c FROM MenuItems mi JOIN MenuCategories mc ON mc.id=mi.category_id WHERE mc.restaurant_id=@id");
  console.log('db items', r.recordset[0]);
  await p.close();
})();
