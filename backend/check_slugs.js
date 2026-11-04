const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  const r = await p.request().query("SELECT id, slug, name_en, templateId, design FROM Restaurants WHERE slug = 'tecnoworld' OR slug = 'bella' OR slug = 'api-test-rest'");
  console.log('Restaurants found:', r.recordset);
  await p.close();
})();
