const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  const r = await p.request().query("SELECT id, restaurant_id, subtotal, total, idempotency_key, fulfillment, payment_method FROM Orders WHERE id = 'ord-mw12zanq-807c27e3'");
  console.log('DB:', r.recordset[0]);
  await p.close();
})();
