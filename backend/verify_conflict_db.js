const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  const r = await p.request().query("SELECT * FROM Orders WHERE idempotency_key = 'idemp-conflict-01'");
  console.log('Orders with key:', r.recordset.length, 'id=', r.recordset[0]?.id, '| qty stored via line:', (await p.request().query("SELECT * FROM OrderLines WHERE order_id = '" + r.recordset[0]?.id + "'")).recordset.map(x => x.qty));
  await p.close();
})();
