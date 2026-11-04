const http = require('http');
const data = JSON.stringify({ email: 'super@menucraft.demo', password: 'PPv7Ms1hwcnRbUeIoZMHSw' });
const req = http.request({ hostname: '127.0.0.1', port: 3000, path: '/api/auth/signin', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } }, (res) => { let body = ''; res.on('data', c => body += c); res.on('end', () => console.log('Status:', res.statusCode, '| Body:', body.substring(0, 800))); });
req.write(data); req.end();
