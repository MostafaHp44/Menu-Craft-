const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  const u = await p.request().query("SELECT id, email, role, status FROM Users WHERE LOWER(email) = LOWER('omnia@yahoo.com')");
  console.log('user:', u.recordset);
  const e = await p.request().query("SELECT e.id, e.name, e.role FROM Employees e JOIN Users u ON e.user_id = u.id WHERE LOWER(u.email) = LOWER('omnia@yahoo.com')");
  console.log('employee:', e.recordset);
  const re = await p.request().query("SELECT user_id, restaurant_id FROM RestaurantEmployees WHERE user_id IN (SELECT id FROM Users WHERE LOWER(email)=LOWER('omnia@yahoo.com'))");
  console.log('rest-emp:', re.recordset);
  await p.close();
})();
