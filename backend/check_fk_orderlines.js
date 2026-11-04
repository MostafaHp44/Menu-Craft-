const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  const fk = await p.request().query("SELECT fk.name FROM sys.foreign_keys fk JOIN sys.objects o ON fk.parent_object_id = o.object_id WHERE o.name = 'OrderLines'");
  console.log('FK names:', fk.recordset.map(r => r.name));
  await p.close();
})();
