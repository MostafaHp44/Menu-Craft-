const http = require('http');
function post(path, body) {
  const data = JSON.stringify(body);
  return new Promise((res, rej) => {
    const req = http.request({ hostname: '127.0.0.1', port: 3000, path, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } }, (r) => { let b=''; r.on('data',c=>b+=c); r.on('end',()=>res({status:r.statusCode, body:b})); });
    req.on('error', rej); req.write(data); req.end();
  });
}
(async () => {
  const key = 'idemp-reverify-001';
  const rid = 'rest-1793437631499-27bf0';
  const itemId = 'item-mvwapxew-2';
  // First
  const first = await post('/api/orders', { restaurantId: rid, idempotencyKey: key, lines: [{ itemId, qty: 1 }], fulfillment: 'pickup', paymentMethod: 'cash', customerName: 'E2E', customerPhone: '000', note: '' });
  console.log('FIRST:', first.status, JSON.parse(first.body).id || JSON.parse(first.body).message || first.body.substring(0,200));
  // Replay same
  const replay = await post('/api/orders', { restaurantId: rid, idempotencyKey: key, lines: [{ itemId, qty: 1 }], fulfillment: 'pickup', paymentMethod: 'cash', customerName: 'E2E', customerPhone: '000', note: '' });
  console.log('REPLAY:', replay.status, JSON.parse(replay.body).id || JSON.parse(replay.body).message || replay.body.substring(0,200));
  // Conflict qty 3
  const conflict = await post('/api/orders', { restaurantId: rid, idempotencyKey: key, lines: [{ itemId, qty: 3 }], fulfillment: 'pickup', paymentMethod: 'cash', customerName: 'E2E', customerPhone: '000', note: '' });
  console.log('CONFLICT:', conflict.status, JSON.parse(conflict.body).errorCode || JSON.parse(conflict.body).message || conflict.body.substring(0,200));
})();
