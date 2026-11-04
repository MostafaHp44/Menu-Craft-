const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  // 1) All users with role/status
  const u = await p.request().query("SELECT id, email, role, status FROM Users ORDER BY id DESC");
  console.log('ALL USERS:', u.recordset.length);
  u.recordset.forEach(r => console.log('  -', r.email, '| role:', r.role));
  // 2) Employees joined to Users
  const e = await p.request().query("SELECT e.id, e.name, e.role, u.email FROM Employees e LEFT JOIN Users u ON e.user_id = u.id");
  console.log('\nEMPLOYEES:', e.recordset.length);
  e.recordset.forEach(r => console.log('  -', r.name || '(no name)', '| role:', r.role, '| user:', r.email));
  // 3) RestaurantEmployees
  const re = await p.request().query("SELECT * FROM RestaurantEmployees");
  console.log('\nRESTAURANT EMPLOYEES:', re.recordset.length);
  re.recordset.forEach(r => console.log('  - user_id:', r.user_id, '| restaurant:', r.restaurant_id || r.restaurantId));
  await p.close();
})();
