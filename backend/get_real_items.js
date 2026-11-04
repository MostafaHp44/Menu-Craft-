const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  const rid = (await p.request().query("SELECT id FROM Restaurants WHERE slug = 'api-test-rest'")).recordset[0]?.id;
  const items = await p.request().query("SELECT TOP 5 id, name_en, price FROM MenuItems ORDER BY id");
  console.log('Real items for api-test-rest:', items.recordset);
  console.log('Real items for api-test-rest:', items.recordset);
  await p.close();
})();
