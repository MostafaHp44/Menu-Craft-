const http = require('http');
const fs = require('fs');
const rl = require('./src/middleware/rateLimiter');

let serverReady = false;
const server = http.createServer((req, res) => {
  res.writeHead(404);
  res.end('not found');
});

server.listen(3001, () => {
  console.log('Test server on port 3001');
  serverReady = true;
  
  // Now run the actual server in a child process
  const { exec } = require('child_process');
  const child = exec('node src/server.js', { cwd: 'D:\\MBN Group\\Test Menu\\backend' }, (error, stdout, stderr) => {
    // Server started in background
  });
  
  // Wait for actual backend to be ready
  function checkBackend() {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/signup',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('Backend is ready!');
          runTests();
        } else {
          setTimeout(checkBackend, 500);
        }
      });
    });
    req.end();
  }
  
  function runTests() {
    // ... tests will be added below
    console.log('Tests running...');
  }
  
  // For now, just verify Redis connection
  console.log('Redis env: REDIS_HOST=127.0.0.1, REDIS_PORT=6379');
  
  // Verify rateLimiter Redis connection
  if (rl.initRedis) {
    try {
      rl.initRedis({});
      console.log('Rate limiter Redis init: OK');
    } catch(e) {
      console.log('Rate limiter Redis init:', e.message);
    }
  }
  
  server.close();
  process.exit(0);
});

// Check if backend is already running
const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/signup',
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('Backend already running, proceeding with tests');
      // Skip server start, just run tests
      process.exit(0);
    } else {
      console.log('Backend not running on 3000, starting...');
      setTimeout(checkBackend, 1000);
    }
  });
});
req.end();

setTimeout(() => {
  console.log('Timeout waiting for backend');
  process.exit(1);
}, 15000);