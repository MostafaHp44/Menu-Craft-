const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  try {
    await p.request().query("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'options') ALTER TABLE Orders ADD options NVARCHAR(MAX) NULL;");
    console.log('Added options');
  } catch (e) { console.log('options error:', e.message); }
  await p.close();
})();
