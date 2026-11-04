const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  const r = await p.request().query("SELECT slug, status, ordering FROM Restaurants WHERE slug = 'api-test-rest'");
  console.log('status:', r.recordset[0]?.status, '| ordering:', r.recordset[0]?.ordering);
  await p.close();
})();
