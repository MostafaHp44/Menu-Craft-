const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  const dup = await p.request().query(`SELECT restaurant_id, idempotency_key, COUNT(*) AS cnt FROM Orders WHERE idempotency_key IS NOT NULL GROUP BY restaurant_id, idempotency_key HAVING COUNT(*) > 1`);
  console.log('Duplicates:', dup.recordset.length > 0 ? dup.recordset : 'NONE');
  const keys = await p.request().query("SELECT DISTINCT idempotency_key FROM Orders WHERE idempotency_key IS NOT NULL");
  console.log('Keys with orders:', keys.recordset.length);
  keys.recordset.forEach(k => console.log('  -', k.idempotency_key));
  const idx = await p.request().query("SELECT name FROM sys.indexes WHERE object_id = OBJECT_ID('Orders') AND name = 'UX_Orders_Idempotency'");
  console.log('Index exists:', idx.recordset.length > 0 ? 'YES' : 'NO');
  await p.close();
})();
