const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  const r = await p.request().query("SELECT id, slug, name_en, status, templateId, heroImage, gallery, LEN(design) AS dlen FROM Restaurants WHERE slug = 'tecnoworld'");
  console.log('Rows with slug tecnoworld:', r.recordset.length);
  r.recordset.forEach(x => console.log(JSON.stringify(x)));
  await p.close();
})();
