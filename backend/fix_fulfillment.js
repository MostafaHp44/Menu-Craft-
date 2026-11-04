const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  try {
    await p.request().query("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'fulfillment') ALTER TABLE Orders ADD fulfillment NVARCHAR(20) DEFAULT 'pickup';");
    console.log('Added fulfillment');
  } catch (e) { console.log('fulfillment error:', e.message); }
  await p.close();
})();
