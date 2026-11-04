const http = require('http');
function post(payload) {
  return new Promise((resolve) => {
    const d = JSON.stringify(payload);
    const req = http.request({ hostname: '127.0.0.1', port: 3000, path: '/api/orders', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(d) } }, res => {
      let b=''; res.on('data', c => b += c); res.on('end', () => resolve({ status: res.statusCode, id: (JSON.parse(b)?.data?.id || null), body: b.slice(0, 300) }));
    });
    req.on('error', () => resolve({ status: 0, id: null, body: '' }));
    req.write(d); req.end();
  });
}
(async () => {
  // First: qty 1
  const a = await post({ restaurantId: 'rest-1793437631499-27bf0', channel: 'online', customer: { name: 'Conflict', phone: '123456' }, fulfillment: 'pickup', address: '', tableNo: null, note: '', paymentMethod: 'cash', idempotencyKey: 'idemp-conflict-01', lines: [{ itemId: 'item-mvwapxew-2', qty: 1, options: [] }] });
  console.log('FIRST:', a.status, 'id=', a.id);
  // Replay same
  const b = await post({ restaurantId: 'rest-1793437631499-27bf0', channel: 'online', customer: { name: 'Conflict', phone: '123456' }, fulfillment: 'pickup', address: '', tableNo: null, note: '', paymentMethod: 'cash', idempotencyKey: 'idemp-conflict-01', lines: [{ itemId: 'item-mvwapxew-2', qty: 1, options: [] }] });
  console.log('REPLAY SAME:', b.status, 'id=', b.id);
  // Conflict: same key, different qty
  const c = await post({ restaurantId: 'rest-1793437631499-27bf0', channel: 'online', customer: { name: 'Conflict', phone: '123456' }, fulfillment: 'pickup', address: '', tableNo: null, note: '', paymentMethod: 'cash', idempotencyKey: 'idemp-conflict-01', lines: [{ itemId: 'item-mvwapxew-2', qty: 5, options: [] }] });
  console.log('CONFLICT (qty 5):', c.status, 'id=', c.id);
})();
