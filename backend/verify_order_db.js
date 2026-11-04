const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  const order = await p.request().query("SELECT * FROM Orders WHERE id = 'ord-mw11waxb-0dfc6701'");
  console.log('ORDER FOUND:', order.recordset.length > 0 ? 'YES' : 'NO');
  if (order.recordset[0]) {
    const o = order.recordset[0];
    console.log('  number:', o.number, '| restaurantId:', o.restaurant_id || o.restaurantId, '| status:', o.status, '| paymentMethod:', o.payment_method, '| paymentStatus:', o.payment_status, '| fulfillment:', o.fulfillment, '| subtotal:', o.subtotal, '| total:', o.total, '| idempotency_key:', o.idempotency_key, '| order_token:', o.order_token);
  }
  const lines = await p.request().query("SELECT * FROM OrderLines WHERE order_id = 'ord-mw11waxb-0dfc6701'");
  console.log('LINE COUNT:', lines.recordset.length);
  lines.recordset.forEach(l => console.log('  item:', l.item_id, '| qty:', l.qty, '| price:', l.price));
  await p.close();
})();
