const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  const r = await p.request().input('id', sql.NVarChar, 'rest-1793398912519-wd0jb').query('SELECT id, name_en, slug, templateId, status, design FROM Restaurants WHERE id = @id');
  console.log('TecnoWorld DB:', r.recordset[0]);
  await p.close();
})();
