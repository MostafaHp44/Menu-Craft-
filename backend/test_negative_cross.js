const http = require('http');
const payload = JSON.stringify({
  restaurantId: 'rest-1793437631499-27bf0',
  channel: 'online',
  customer: { name: 'Cross-restaurant test', phone: '0123456789' },
  fulfillment: 'pickup',
  address: '',
  tableNo: null,
  paymentMethod: 'cash',
  lines: [{ itemId: '3B9D6216-5FBF-4BE0-8CEA-9AA2E8152097', qty: 1, options: [] }]
});
const req = http.request({ hostname: '127.0.0.1', port: 3000, path: '/api/orders', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } }, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => console.log('CROSS-RESTAURANT TEST:', res.statusCode, d.slice(0, 300)));
});
req.write(payload); req.end();
