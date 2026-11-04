const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  const r = await p.request().query("SELECT slug,status,ordering FROM Restaurants WHERE slug='api-test-rest'");
  const b = await p.request().query("SELECT id,name_en,accepting_orders FROM Branches WHERE restaurant_id='rest-1793437631499-27bf0'");
  console.log('rest', r.recordset[0]);
  console.log('branches', b.recordset);
  await p.close();
})();
