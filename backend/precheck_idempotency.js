const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  // Pre-check: duplicates scoped by restaurant with non-null key
  const dup = await p.request().query(`
    SELECT restaurant_id, idempotency_key, COUNT(*) AS cnt
    FROM Orders WHERE idempotency_key IS NOT NULL
    GROUP BY restaurant_id, idempotency_key
    HAVING COUNT(*) > 1
  `);
  console.log('Duplicate keys per restaurant (non-null):', dup.recordset.length > 0 ? dup.recordset : 'NONE');
  // Confirm column exists
  const col = await p.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Orders' AND COLUMN_NAME='idempotency_key'");
  console.log('Column idempotency_key exists:', col.recordset.length > 0 ? 'YES' : 'NO');
  // Confirm index not exists with this name
  const idx = await p.request().query("SELECT name FROM sys.indexes WHERE object_id = OBJECT_ID('Orders') AND name = 'UX_Orders_Idempotency'");
  console.log('Index UX_Orders_Idempotency exists:', idx.recordset.length > 0 ? 'YES' : 'NO');
  await p.close();
})();
