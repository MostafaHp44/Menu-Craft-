const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  const r = await p.request().query("SELECT count(*) as cnt FROM Orders WHERE idempotency_key IS NOT NULL AND restaurant_id = 'rest-1793437631499-27bf0'");
  console.log('api-test-rest idempotency orders:', r.recordset[0].cnt);
  const idx = await p.request().query("SELECT COUNT(*) as cnt FROM sys.indexes WHERE name = 'UX_Orders_Idempotency'");
  console.log('Index exists:', idx.recordset[0].cnt > 0);
  await p.close();
})();
