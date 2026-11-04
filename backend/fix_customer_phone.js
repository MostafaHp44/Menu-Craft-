const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  try {
    await p.request().query("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'customer_phone') ALTER TABLE Orders ADD customer_phone NVARCHAR(30) NULL;");
    console.log('Added customer_phone');
  } catch (e) { console.log('customer_phone error:', e.message); }
  await p.close();
})();
