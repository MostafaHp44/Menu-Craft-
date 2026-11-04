const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  const u = await p.request().query("SELECT id, email FROM Users WHERE email LIKE '%@yahoo.com' OR email LIKE '%cashier%' OR email LIKE '%waiter%' OR email LIKE '%kitchen%'");
  console.log('Users found:', u.recordset.length, u.recordset.map(r => r.email));
  const e = await p.request().query("SELECT e.id, e.name, e.role FROM Employees e JOIN Users u ON e.user_id = u.id WHERE u.email LIKE '%@yahoo.com' OR u.email LIKE '%cashier%' OR u.email LIKE '%waiter%' OR u.email LIKE '%kitchen%'");
  console.log('Employee profile records:', e.recordset.map(r => ({ id: r.id, name: r.name, role: r.role })));
  const re = await p.request().query("SELECT user_id, restaurant_id FROM RestaurantEmployees WHERE user_id IN (SELECT id FROM Users WHERE email LIKE '%@yahoo.com' OR email LIKE '%cashier%' OR email LIKE '%waiter%' OR email LIKE '%kitchen%')");
  console.log('RestaurantEmployees links:', re.recordset.length, re.recordset);
  await p.close();
})();
