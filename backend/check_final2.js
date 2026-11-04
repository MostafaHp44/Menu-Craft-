const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  console.log('--- Employees (3) ---');
  const e = await p.request().query("SELECT * FROM Employees");
  e.recordset.forEach(r => console.log(JSON.stringify({ id: r.id, name: r.name, role: r.role, email: r.email, restaurant: r.restaurant_id })));
  console.log('\n--- RestaurantEmployees (3) ---');
  const re = await p.request().query("SELECT * FROM RestaurantEmployees");
  re.recordset.forEach(r => console.log(JSON.stringify({ id: r.id, user_id: r.user_id, user_email: r.user_id ? 'exists' : 'MISSING', restaurant: r.restaurant_id })));
  await p.close();
})();
