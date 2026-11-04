const http = require('http');
const req = http.request({ hostname: '127.0.0.1', port: 3000, path: '/api/orders', method: 'GET', headers: { 'Content-Type': 'application/json' } }, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => console.log('GET /api/orders', res.statusCode, d.slice(0, 100)));
});
req.end();
