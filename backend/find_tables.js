const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  const t = await p.request().query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' AND (TABLE_NAME LIKE '%order%' OR TABLE_NAME LIKE '%line%' OR TABLE_NAME LIKE '%item%')");
  console.log('tables:', t.recordset.map(r => r.TABLE_NAME));
  await p.close();
})();
