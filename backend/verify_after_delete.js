const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  console.log('Orders remaining:', (await p.request().query("SELECT COUNT(*) AS cnt FROM Orders")).recordset[0].cnt);
  const dup = await p.request().query(`SELECT restaurant_id, idempotency_key, COUNT(*) AS cnt FROM Orders WHERE idempotency_key IS NOT NULL GROUP BY restaurant_id, idempotency_key HAVING COUNT(*) > 1`);
  console.log('Duplicate non-null keys scoped by restaurant:', dup.recordset.length > 0 ? dup.recordset : 'NONE');
  await p.close();
})();
