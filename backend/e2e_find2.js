const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  const r = await p.request().query("SELECT TOP 5 id FROM Restaurants");
  for (const rest of r.recordset) {
    const b = await p.request().input('rid', sql.NVarChar, rest.id).query("SELECT COUNT(*) AS c FROM Branches WHERE restaurant_id=@rid");
    console.log(rest.id, 'branches=', b.recordset[0].c);
  }
  await p.close();
})();
