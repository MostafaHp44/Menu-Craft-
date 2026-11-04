const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  const r = await p.request().input('slug', sql.NVarChar, 'tecnoworld').query("SELECT id, name_en, slug, templateId, status, design FROM Restaurants WHERE slug = @slug");
  const d = JSON.parse(r.recordset[0].design || '{}');
  console.log('DB design parsed keys:', Object.keys(d));
  console.log('layout:', d.layout);
  console.log('sections count:', d.sections ? d.sections.length : 'NONE');
  console.log('templateId:', r.recordset[0].templateId);
  await p.close();
})();
