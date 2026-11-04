const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  const r = await p.request().input('rid', sql.NVarChar, 'rest-1793437631499-27bf0').input('key', sql.NVarChar, 'idemp-reverify-001').query("SELECT COUNT(*) AS cnt FROM Orders WHERE restaurant_id = @rid AND idempotency_key = @key");
  console.log('DB count for restaurant + key:', r.recordset[0].cnt);
  await p.close();
})();
