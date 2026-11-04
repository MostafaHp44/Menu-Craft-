const http = require('http');
function post(payload) {
  return new Promise((resolve, reject) => {
    const d = JSON.stringify(payload);
    const req = http.request({ hostname: '127.0.0.1', port: 3000, path: '/api/orders', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(d) } }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({ status: res.statusCode, body: body.slice(0, 300) }));
    });
    req.on('error', reject);
    req.write(d); req.end();
  });
}
(async () => {
  const r1 = await post({ restaurantId: 'rest-1793437631499-27bf0', channel: 'online', customer: { name: 'Seq1', phone: '123456' }, fulfillment: 'pickup', address: '', tableNo: null, note: '', paymentMethod: 'cash', idempotencyKey: 'idemp-verify-01', lines: [{ itemId: 'item-mvwapxew-2', qty: 1, options: [] }] });
  console.log('SEQ FIRST:', r1.status, r1.body);
  const r2 = await post({ restaurantId: 'rest-1793437631499-27bf0', channel: 'online', customer: { name: 'Seq1', phone: '123456' }, fulfillment: 'pickup', address: '', tableNo: null, note: '', paymentMethod: 'cash', idempotencyKey: 'idemp-verify-01', lines: [{ itemId: 'item-mvwapxew-2', qty: 1, options: [] }] });
  console.log('SEQ REPLAY:', r2.status, r2.body);
  const r3 = await post({ restaurantId: 'rest-1793437631499-27bf0', channel: 'online', customer: { name: 'Seq1', phone: '123456' }, fulfillment: 'pickup', address: '', tableNo: null, note: '', paymentMethod: 'cash', idempotencyKey: 'idemp-verify-01', lines: [{ itemId: 'item-mvwapxew-2', qty: 2, options: [] }] });
  console.log('SEQ CONFLICT:', r3.status, r3.body);
  const r4 = await post({ restaurantId: 'rest-1793437631499-27bf0', channel: 'online', customer: { name: 'Cross', phone: '1' }, fulfillment: 'pickup', address: '', tableNo: null, note: '', paymentMethod: 'cash', idempotencyKey: 'idemp-verify-01', lines: [{ itemId: '3B9D6216-5FBF-4BE0-8CEA-9AA2E8152097', qty: 1, options: [] }] });
  console.log('SEQ CROSS-ITEM:', r4.status, r4.body);
})();
