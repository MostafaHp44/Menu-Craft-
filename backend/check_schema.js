const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  for (const t of ['Employees', 'RestaurantEmployees']) {
    const info = await p.request().query(`SELECT TOP 1 * FROM ${t}`);
    console.log(t + ':', info.recordset[0] ? Object.keys(info.recordset[0]) : 'empty');
  }
  // count
  const e = await p.request().query("SELECT COUNT(*) as c FROM Employees");
  console.log('Employees total:', e.recordset[0].c);
  const r = await p.request().query("SELECT COUNT(*) as c FROM RestaurantEmployees");
  console.log('RestaurantEmployees total:', r.recordset[0].c);
  await p.close();
})();
