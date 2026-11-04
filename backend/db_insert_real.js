const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  const rid = 'rest-1793437631499-27bf0';
  // Insert real test order
  await p.request().query(`INSERT INTO Orders (id, restaurant_id, status, channel, total, created_at) VALUES (NEWID(), '${rid}', 'pending', 'online', 99, GETDATE())`);
  const check = await p.request().query(`SELECT COUNT(*) as c FROM Orders WHERE restaurant_id = '${rid}'`);
  console.log('Real DB orders for api-test-rest after insert:', check.recordset[0].c);
  await p.close();
})();
