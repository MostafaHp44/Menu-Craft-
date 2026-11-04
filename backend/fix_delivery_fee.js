const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  try {
    await p.request().query("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'delivery_fee') ALTER TABLE Orders ADD delivery_fee DECIMAL(10,2) DEFAULT 0;");
    console.log('Added delivery_fee');
  } catch (e) { console.log('delivery_fee error:', e.message); }
  await p.close();
})();
