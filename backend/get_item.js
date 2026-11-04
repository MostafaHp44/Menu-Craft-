const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  const item = await p.request().query("SELECT TOP 1 id, name FROM MenuItems WHERE restaurant_id IN (SELECT id FROM Restaurants WHERE slug='api-test-rest')");
  console.log('menu item:', item.recordset[0]);
  await p.close();
})();
