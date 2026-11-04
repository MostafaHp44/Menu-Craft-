const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  await p.request().query("UPDATE Users SET role = 'cashier' WHERE email = 'omnia@yahoo.com'");
  const r = await p.request().query("SELECT email, role FROM Users WHERE email = 'omnia@yahoo.com'");
  console.log('Updated:', r.recordset);
  await p.close();
})();
