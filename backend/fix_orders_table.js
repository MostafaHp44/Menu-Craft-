const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  try {
    await p.request().query("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'payment_method') ALTER TABLE Orders ADD payment_method NVARCHAR(50) DEFAULT 'cash';");
    console.log('Added payment_method');
  } catch (e) { console.log('payment_method:', e.message); }
  try {
    await p.request().query("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'payment_status') ALTER TABLE Orders ADD payment_status NVARCHAR(50) DEFAULT 'unpaid';");
    console.log('Added payment_status');
  } catch (e) { console.log('payment_status:', e.message); }
  try {
    await p.request().query("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'order_token') ALTER TABLE Orders ADD order_token NVARCHAR(100) NULL;");
    console.log('Added order_token');
  } catch (e) { console.log('order_token:', e.message); }
  try {
    await p.request().query("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'currency') ALTER TABLE Orders ADD currency NVARCHAR(10) DEFAULT 'USD';");
    console.log('Added currency');
  } catch (e) { console.log('currency:', e.message); }
  await p.close();
})();
