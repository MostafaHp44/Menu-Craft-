const http = require('http');

const data = JSON.stringify({
  name: 'Test Client',
  email: 'testclient@demo.com',
  password: 'Password123',
  restaurantName: 'Test Restaurant'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/signup',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let responseText = '';
  res.on('data', (chunk) => { responseText += chunk; });
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response:', responseText);
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.write(data);
req.end();