const sql = require('mssql');
(async () => {
  const p = { user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } };
  await sql.connect(p);
  const r = await sql.query("SELECT id, email, role FROM Users ORDER BY id");
  console.log('USERS:');
  r.recordset.forEach(x => console.log(x.id + ':' + x.email + ' role=' + x.role));
  const r2 = await sql.query("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Users'");
  console.log('USERS columns:', r2.recordset.map(c => c.COLUMN_NAME).join(', '));
  await sql.close();
})();
