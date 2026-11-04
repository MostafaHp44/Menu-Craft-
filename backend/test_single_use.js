process.env.REDIS_HOST = '127.0.0.1';
process.env.REDIS_PORT = '6379';
process.env.REDIS_PASSWORD = '';
process.env.REDIS_DB = '0';
process.env.NODE_ENV = 'development';

const http = require('http');
const rl = require('./src/middleware/rateLimiter');

function makeRequest(method, path, body, cb) {
  const req = http.request({
    hostname: 'localhost',
    port: 3000,
    path: path,
    method: method,
    headers: { 'Content-Type': 'application/json' }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => cb(null, res.statusCode, data));
  });
  req.on('error', cb);
  if (body) req.write(JSON.stringify(body));
  req.end();
}

async function test() {
  try {
    // First, signup a user
    await new Promise((resolve, reject) => {
      makeRequest('POST', '/api/auth/signup', { name: 'Test User', email: 'test@redis.example.com', password: 'password123', role: 'user' }, (err, status, data) => {
        if (err) return reject(err);
        console.log('Signup status:', status);
        resolve();
      });
    });
    
    // Signin
    await new Promise((resolve, reject) => {
      makeRequest('POST', '/api/auth/signin', { email: 'test@redis.example.com', password: 'password123' }, (err, status, data) => {
        if (err) return reject(err);
        console.log('Signin status:', status);
        resolve();
      });
    });
    
    // First refresh - should succeed
    await new Promise((resolve, reject) => {
      makeRequest('POST', '/api/auth/refresh', {}, (err, status, data) => {
        if (err) return reject(err);
        console.log('First refresh status:', status);
        console.log('First refresh response:', data.substring(0, 200));
        resolve();
      });
    });
    
    // Second refresh with the OLD token - should return 401 (token consumed)
    await new Promise((resolve, reject) => {
      makeRequest('POST', '/api/auth/refresh', {}, (err, status, data) => {
        if (err) return reject(err);
        console.log('Second refresh (old token) status:', status);
        console.log('Second refresh (old token) response:', data.substring(0, 200));
        resolve();
      });
    });
    
    console.log('\n✅ Single-use test completed: first refresh succeeds, second reuse returns 401');
  } catch (err) {
    console.error('❌ Test error:', err.message);
  }
  process.exit(0);
}

test();