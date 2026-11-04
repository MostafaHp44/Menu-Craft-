const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  const b = await p.request().query("SELECT id, name_en, accepting_orders FROM Branches WHERE restaurant_id='rest-1793437631499-27bf0'");
  console.log(b.recordset);
  await p.close();
})();
