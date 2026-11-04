const http = require('http');
function post(payload) {
  return new Promise((resolve) => {
    const d = JSON.stringify(payload);
    const req = http.request({ hostname: '127.0.0.1', port: 3000, path: '/api/orders', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(d) } }, res => {
      let b=''; res.on('data', c => b += c); res.on('end', () => resolve({ status: res.statusCode, id: (JSON.parse(b)?.data?.id || null), body: b.slice(0, 200) }));
    });
    req.on('error', () => resolve({ status: 0, id: null }));
    req.write(d); req.end();
  });
}
(async () => {
  const p = { restaurantId: 'rest-1793437631499-27bf0', channel: 'online', customer: { name: 'Concurrent', phone: '123456' }, fulfillment: 'pickup', address: '', tableNo: null, note: '', paymentMethod: 'cash', idempotencyKey: 'idemp-concur-002', lines: [{ itemId: 'item-mvwapxew-2', qty: 1, options: [] }] };
  const [a, b] = await Promise.all([post(p), post(p)]);
  console.log('Concurrent A:', a.status, 'id=', a.id);
  console.log('Concurrent B:', b.status, 'id=', b.id);
})();
