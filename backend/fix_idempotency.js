const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  try {
    await p.request().query("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'idempotency_key') ALTER TABLE Orders ADD idempotency_key NVARCHAR(100) NULL;");
    console.log('Added idempotency_key');
  } catch (e) { console.log('idempotency_key error:', e.message); }
  await p.close();
})();
