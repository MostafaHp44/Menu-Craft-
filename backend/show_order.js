const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  const rid = 'rest-1793437631499-27bf0';
  const o = await p.request().query(`SELECT TOP 1 id, status, channel, paymentMethod, total, customer FROM Orders WHERE restaurant_id = '${rid}' ORDER BY created_at DESC`);
  console.log('REAL ORDER:', o.recordset[0] ? JSON.stringify(o.recordset[0]) : 'none');
  await p.close();
})();
