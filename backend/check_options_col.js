const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  const info = await p.request().query("SELECT TOP 1 * FROM Orders");
  console.log('columns:', Object.keys(info.recordset[0] || {}).filter(c => c.toLowerCase().includes('option')));
  await p.close();
})();
