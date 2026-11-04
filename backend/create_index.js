const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  const res = await p.request().query('CREATE UNIQUE INDEX UX_Orders_Idempotency ON Orders (restaurant_id, idempotency_key) WHERE idempotency_key IS NOT NULL');
  console.log('Index created, rows affected:', res.rowsAffected ? res.rowsAffected[0] : 'N/A');
  const check = await p.request().query("SELECT name FROM sys.indexes WHERE object_id = OBJECT_ID('Orders') AND name = 'UX_Orders_Idempotency'");
  console.log('Index exists:', check.recordset.length > 0 ? 'YES' : 'NO');
  await p.close();
})();
