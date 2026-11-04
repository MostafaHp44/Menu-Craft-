const http = require('http');
function post(payload) {
  return new Promise((resolve, reject) => {
    const d = JSON.stringify(payload);
    const req = http.request({ hostname: '127.0.0.1', port: 3000, path: '/api/orders', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(d) } }, res => {
      let body = ''; res.on('data', c => body += c); res.on('end', () => resolve({ status: res.statusCode, body: body.slice(0, 300) }));
    });
    req.on('error', reject); req.write(d); req.end();
  });
}
(async () => {
  // Rest 'bella' id
  const r = await post({ restaurantId: 'E835A82D-7442-4775-A486-F47104A17BE1', channel: 'online', customer: { name: 'CrossRest', phone: '123456' }, fulfillment: 'pickup', address: '', tableNo: null, note: '', paymentMethod: 'cash', idempotencyKey: 'idemp-cross-001', lines: [{ itemId: '3B9D6216-5FBF-4BE0-8CEA-9AA2E8152097', qty: 1, options: [] }] });
  console.log('CROSS RESTAURANT:', r.status, r.body);
})();
