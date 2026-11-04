const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  const r = await p.request().query("SELECT id, slug, status, name_en, LEN(published_menu) AS mlen, LEN(draft_menu) AS dlen FROM Restaurants WHERE status='published'");
  console.log(r.recordset);
  await p.close();
})();
