const http = require('http');
const payload = JSON.stringify({
  restaurantId: 'rest-1793437631499-27bf0',
  channel: 'online',
  customer: { name: 'E2E Tester', phone: '0123456789' },
  fulfillment: 'pickup',
  address: '',
  tableNo: null,
  note: 'E2E verification',
  paymentMethod: 'cash',
  lines: [{ itemId: 'menu-001', qty: 2, options: [] }]
});
const req = http.request({ hostname: '127.0.0.1', port: 3000, path: '/api/orders', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } }, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => console.log('E2E Submit:', res.statusCode, d.slice(0, 300)));
});
req.write(payload); req.end();
