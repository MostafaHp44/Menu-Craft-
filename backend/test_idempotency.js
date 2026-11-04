const http = require('http');
const payload = JSON.stringify({
  restaurantId: 'rest-1793437631499-27bf0',
  channel: 'online',
  customer: { name: 'E2E Test Positive', phone: '0123456789' },
  fulfillment: 'pickup',
  address: '',
  tableNo: null,
  note: 'Positive checkout test using published_menu item item-mvwapxew-2',
  paymentMethod: 'cash',
  idempotencyKey: 'test-idempotency-001',
  lines: [{ itemId: 'item-mvwapxew-2', qty: 2, options: [] }]
});
const req = http.request({ hostname: '127.0.0.1', port: 3000, path: '/api/orders', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } }, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => console.log('IDEMPOTENCY FIRST:', res.statusCode, d.slice(0, 300)));
});
req.write(payload); req.end();
