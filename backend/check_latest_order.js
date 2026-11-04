const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  const r = await p.request().query("SELECT TOP 1 id FROM Orders WHERE restaurant_id = 'rest-1793437631499-27bf0' ORDER BY created_at DESC");
  console.log('Latest order id:', r.recordset[0]?.id);
  const lines = await p.request().input('oid', sql.NVarChar, r.recordset[0]?.id || '').query("SELECT * FROM OrderLines WHERE order_id = @oid");
  console.log('OrderLines count:', lines.recordset.length);
  await p.close();
})();
