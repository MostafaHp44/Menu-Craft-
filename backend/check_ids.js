const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  const r = await p.request().query("SELECT TOP 5 id, name FROM Restaurants WHERE id LIKE 'rst-%' OR slug = 'bella'");
  console.log(r.recordset);
  await p.close();
})();
