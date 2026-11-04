const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  try {
    await p.request().query("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'discount') ALTER TABLE Orders ADD discount DECIMAL(10,2) DEFAULT 0;");
    console.log('Added discount');
  } catch (e) { console.log('discount error:', e.message); }
  await p.close();
})();
