const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  const r = await p.request().input('slug', sql.NVarChar, 'tecnoworld').query("SELECT id, name_en, slug, templateId, status, design FROM Restaurants WHERE slug = @slug");
  const row = r.recordset[0];
  console.log('DB restaurant record for tecnoworld:');
  console.log({ id: row.id, name: row.name_en, slug: row.slug, templateId: row.template_id || row.templateId, status: row.status });
  console.log('design parsed:', JSON.parse(row.design || '{}'));
  await p.close();
})();
