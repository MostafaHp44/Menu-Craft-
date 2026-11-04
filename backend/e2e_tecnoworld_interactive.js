const http = require('http');
const sql = require('mssql');
function post(path, body) {
  return new Promise((res, rej) => {
    const data = JSON.stringify(body);
    const req = http.request({ hostname: '127.0.0.1', port: 3000, path, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } }, (r) => { let b=''; r.on('data',c=>b+=c); r.on('end',()=>res({status:r.statusCode, body:b})); });
    req.on('error', rej); req.write(data); req.end();
  });
}
(async () => {
  const rid = 'rest-1793398912519-wd0jb';
  // Submit real order with item item-tec-1 qty 2
  const r = await post('/api/orders', { restaurantId: rid, idempotencyKey: 'tecno-e2e-001', lines: [{itemId:'item-tec-1',qty:2}], fulfillment: 'pickup', paymentMethod: 'cash', customerName: 'Tecno E2E', customerPhone: '555', note: 'Interactive checkout test' });
  console.log('ORDER SUBMIT:', r.status, r.body.substring(0, 300));
  const p = await sql.connect({ user:'sa', password:'YourStrong@Passw0rd', server:'localhost', port:1433, database:'menucraft_docker', options:{encrypt:false,trustServerCertificate:true} });
  const orders = await p.request().input('rid', sql.NVarChar, rid).query("SELECT id, restaurant_id, idempotency_key FROM Orders WHERE restaurant_id = @rid AND idempotency_key = 'tecno-e2e-001'");
  console.log('DB Orders:', orders.recordset);
  if (orders.recordset[0]) {
    const lines = await p.request().input('oid', sql.NVarChar, orders.recordset[0].id).query("SELECT * FROM OrderLines WHERE order_id = @oid");
    console.log('DB OrderLines:', lines.recordset);
  }
  await p.close();
})();
