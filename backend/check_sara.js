const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  const d = await p.request().query("SELECT id, email, restaurant_id FROM Users WHERE LOWER(email) = LOWER('sarac@yahoo.com')");
  console.log('user', d.recordset);
  const e = await p.request().query("SELECT e.id, e.name, e.role FROM Employees e JOIN RestaurantEmployees re ON re.user_id = (SELECT id FROM Users WHERE LOWER(email) = LOWER('sarac@yahoo.com')) WHERE e.restaurant_id = re.restaurant_id");
  console.log('employee', e.recordset);
  await p.close();
})();
