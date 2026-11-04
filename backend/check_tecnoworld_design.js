const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  const r = await p.request().query("SELECT slug, design FROM Restaurants WHERE slug = 'tecnoworld'");
  console.log('tecnoworld:', JSON.stringify(r.recordset[0]));
  await p.close();
})();
