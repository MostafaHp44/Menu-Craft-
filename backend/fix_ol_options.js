const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  try {
    await p.request().query("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('OrderLines') AND name = 'options') ALTER TABLE OrderLines ADD options NVARCHAR(MAX) NULL;");
    console.log('Added OrderLines.options');
  } catch (e) { console.log('OrderLines.options error:', e.message); }
  await p.close();
})();
