const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  const r = await p.request().query("SELECT TOP 1 id FROM Restaurants WHERE slug='bella' OR id='rst-bella'");
  console.log('bella exists?', r.recordset.length, r.recordset[0]?.id ?? '');
  await p.close();
})();
