const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  const r = await p.request().query("SELECT OBJECT_NAME(parent_object_id) AS table_name, name AS fk_name FROM sys.foreign_keys WHERE name LIKE '%Subscription%'");
  console.log('FK names:', r.recordset);
  await p.close();
})();
