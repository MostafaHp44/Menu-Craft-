const http = require('http');
const sql = require('mssql');

function post(path, body) {
  return new Promise((res, rej) => {
    const data = JSON.stringify(body);
    const req = http.request({ hostname: '127.0.0.1', port: 3000, path, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } }, (r) => { let b=''; r.on('data',c=>b+=c); r.on('end',()=>res({status:r.statusCode, body:b})); });
    req.on('error', rej); req.write(data); req.end();
  });
}
async function db(query, sqlOpts = {}) {
  const p = await sql.connect({ user:'sa', password:'YourStrong@Passw0rd', server:'localhost', port:1433, database:'menucraft_docker', options:{encrypt:false,trustServerCertificate:true} });
  const r = await p.request().query(query, sqlOpts);
  await p.close();
  return r;
}
(async () => {
  const rid = 'rest-1793437631499-27bf0';
  // 1) Add item qty 1
  const add1 = await post('/api/orders', { restaurantId: rid, idempotencyKey:'e2e-add-001', lines:[{itemId:'item-mvwapxew-2',qty:1}], fulfillment:'pickup', paymentMethod:'cash', customerName:'E2E', customerPhone:'000', note:'' });
  console.log('ADD1:', add1.status, add1.body.substring(0,120));
  // 2) Update quantity to 3 (same key, different qty -> check 409 expected; but we want a real submit)
  const add3 = await post('/api/orders', { restaurantId: rid, idempotencyKey:'e2e-add-001b', lines:[{itemId:'item-mvwapxew-2',qty:3}], fulfillment:'pickup', paymentMethod:'cash', customerName:'E2E', customerPhone:'000', note:'' });
  console.log('ADD3:', add3.status, add3.body.substring(0,200));
  // 3) Submit final order with new key
  const sub = await post('/api/orders', { restaurantId: rid, idempotencyKey:'e2e-sub-001', lines:[{itemId:'item-mvwapxew-2',qty:3}], fulfillment:'pickup', paymentMethod:'cash', customerName:'E2E', customerPhone:'000', note:'' });
  console.log('SUBMIT:', sub.status, sub.body.substring(0,250));
})();
