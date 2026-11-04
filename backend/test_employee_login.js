const http = require('http');
const postData = JSON.stringify({ email: 'sarac@yahoo.com', password: 'sara1234' });
const req = http.request({
  hostname: 'localhost', port: 3000, path: '/api/auth/employee-login', method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': postData.length }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('status', res.statusCode, 'body', data.slice(0, 500)));
});
req.write(postData);
req.end();
