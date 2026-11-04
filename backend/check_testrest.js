const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  const r = await p.request().input('id', sql.NVarChar, 'rest-1793437631499-27bf0').query("SELECT slug, status, name_en, ordering, design, language FROM Restaurants WHERE id=@id");
  console.log('rest', r.recordset[0]);
  const b = await p.request().input('id', sql.NVarChar, 'rest-1793437631499-27bf0').query("SELECT id, name_en, is_active FROM Branches WHERE restaurant_id=@id");
  console.log('branches', b.recordset);
  await p.close();
})();
