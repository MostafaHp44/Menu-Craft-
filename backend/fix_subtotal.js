const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  try {
    await p.request().query("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'subtotal') ALTER TABLE Orders ADD subtotal DECIMAL(10,2) DEFAULT 0;");
    console.log('Added subtotal');
  } catch (e) { console.log('subtotal error:', e.message); }
  await p.close();
})();
