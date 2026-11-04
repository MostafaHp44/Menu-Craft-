const http = require('http');
const payload = JSON.stringify({
  restaurantId: 'rest-1793437631499-27bf0',
  channel: 'online',
  customer: { name: 'Test', phone: '1234' },
  fulfillment: 'pickup',
  lines: [{ itemId: 'fake-item', qty: 1 }],
  paymentMethod: 'cash'
});
const req = http.request({ hostname: '127.0.0.1', port: 3000, path: '/api/orders', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } }, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => console.log('STATUS', res.statusCode, 'BODY', d.slice(0, 300)));
});
req.write(payload);
req.end();
