const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  const r = await p.request().query("SELECT name FROM sys.columns WHERE object_id = OBJECT_ID('Restaurants') ORDER BY name");
  console.log(r.recordset.map(x => x.name).join(', '));
  await p.close();
})();
