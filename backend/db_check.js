const sql = require('mssql');
const cfg = { user: 'sa', password: 'YourStrong@Passw0rd', database: 'menucraft_docker', server: 'localhost', port: 1433, options: { encrypt: false, trustServerCertificate: true } };
(async () => {
  try {
    await sql.connect(cfg);
    const p = await sql.connect(cfg);
    const r = await p.request().query("SELECT OBJECT_ID('Branches','U') AS tbl_exists");
    console.log('Branches table exists?', r.recordset[0].exists || 'NULL (not created)');
  } catch (e) { console.log('DB ERROR:', e.message); }
})();
