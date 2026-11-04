// Phase 6 Task 3.2 — Security Configuration Validation Tests
// Run with: node test_validation.js

const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

let backendProc = null;

// Start the backend server
function startBackend(envOpts = {}) {
  return new Promise((resolve, reject) => {
    const env = {
      ...process.env,
      REDIS_HOST: '127.0.0.1',
      REDIS_PORT: '6379',
      REDIS_PASSWORD: '',
      REDIS_DB: '0',
      NODE_ENV: 'development',
      CORS_ORIGIN: 'http://localhost:5173',
      JWT_ACCESS_SECRET: 'a_very_long_jwt_access_secret_string_over_32_chars_minimum',
      JWT_REFRESH_SECRET: 'a_very_long_jwt_refresh_secret_string_over_32_chars_minimum',
      ...envOpts
    };

    backendProc = spawn('node', ['src/server.js'], {
      cwd: 'D:\\MBN Group\\Test Menu\\backend',
      env: env,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    backendProc.stdout.on('data', (data) => {
      const line = data.toString().trim();
      if (line.includes('MenuCraft Backend running')) {
        resolve();
      }
    });
    backendProc.stderr.on('data', (data) => {
      const line = data.toString().trim();
      if (line.includes('fatal')) {
        // Log and continue - might be expected in test scenarios
        console.log('FATAL:', line);
      }
    });
  });
}

// Wait for backend to be ready
function waitForBackend(timeout = 15000) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const check = () => {
      attempts++;
      const req = http.request({
        hostname: 'localhost',
        port: 3000,
        path: '/api/auth/signup',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve();
        } else if (attempts < 30) {
          setTimeout(check, 1000);
        } else {
          reject(new Error('Backend not ready after ' + attempts + ' seconds'));
        }
      });
      req.on('error', () => {
        if (attempts < 30) {
          setTimeout(check, 1000);
        } else {
          reject(new Error('Backend connection refused after ' + attempts + ' seconds'));
        }
      });
      req.end();
    };
    check();
  });
}

async function runTests() {
  console.log('\n=== Phase 6 Task 3.2: Security Configuration Validation ===\n');

  let passed = 0;
  let failed = 0;

  try {
    // Test 1: Backend starts with valid development config
    console.log('TEST 1: Backend starts with valid development config');
    await startBackend();
    await waitForBackend();
    console.log('   ✅ Backend started successfully with development config');
    passed++;

    // Test 2: Missing JWT_ACCESS_SECRET in production
    console.log('TEST 2: Missing JWT_ACCESS_SECRET in production');
    try {
      const env = {
        ...process.env,
        NODE_ENV: 'production',
        REDIS_HOST: '127.0.0.1',
        REDIS_PORT: '6379',
        REDIS_PASSWORD: '',
        REDIS_DB: '0',
        CORS_ORIGIN: 'http://localhost:5173',
        // JWT secrets omitted
      };
      const backend2 = spawn('node', ['src/server.js'], {
        cwd: 'D:\\MBN Group\\Test Menu\\backend',
        env: env,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      // If we get here without exit, the check didn't work
      backend2.kill();
      console.log('   ❌ Production should have failed without JWT_ACCESS_SECRET');
      failed++;
    } catch (err) {
      console.log('   ✅ Production correctly failed without JWT_ACCESS_SECRET');
      passed++;
    }

    // Test 3: Missing JWT_REFRESH_SECRET in production
    console.log('TEST 3: Missing JWT_REFRESH_SECRET in production');
    try {
      const env = {
        ...process.env,
        NODE_ENV: 'production',
        REDIS_HOST: '127.0.0.1',
        REDIS_PORT: '6379',
        REDIS_PASSWORD: '',
        REDIS_DB: '0',
        CORS_ORIGIN: 'http://localhost:5173',
        JWT_ACCESS_SECRET: 'a_very_long_jwt_access_secret_string_over_32_chars_minimum',
        // JWT_REFRESH_SECRET omitted
      };
      const backend3 = spawn('node', ['src/server.js'], {
        cwd: 'D:\\MBN Group\\Test Menu\\backend',
        env: env,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      backend3.kill();
      console.log('   ❌ Production should have failed without JWT_REFRESH_SECRET');
      failed++;
    } catch (err) {
      console.log('   ✅ Production correctly failed without JWT_REFRESH_SECRET');
      passed++;
    }

    // Test 4: Placeholder JWT_SECRET rejected in production
    console.log('TEST 4: Placeholder JWT_SECRET rejected in production');
    try {
      const env = {
        ...process.env,
        NODE_ENV: 'production',
        REDIS_HOST: '127.0.0.1',
        REDIS_PORT: '6379',
        REDIS_PASSWORD: '',
        REDIS_DB: '0',
        CORS_ORIGIN: 'http://localhost:5173',
        JWT_ACCESS_SECRET: 'change_this_access_secret_to_something_long_and_random',
      };
      const backend4 = spawn('node', ['src/server.js'], {
        cwd: 'D:\\MBN Group\\Test Menu\\backend',
        env: env,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      // If backend starts, the placeholder wasn't rejected
      backend4.kill();
      console.log('   ❌ Placeholder JWT_SECRET should have been rejected');
      failed++;
    } catch (err) {
      console.log('   ✅ Placeholder JWT_SECRET correctly rejected');
      passed++;
    }

    // Test 5: Identical access and refresh secrets rejected
    console.log('TEST 5: Identical access and refresh secrets rejected in production');
    try {
      const env = {
        ...process.env,
        NODE_ENV: 'production',
        REDIS_HOST: '127.0.0.1',
        REDIS_PORT: '6379',
        REDIS_PASSWORD: '',
        REDIS_DB: '0',
        CORS_ORIGIN: 'http://localhost:5173',
        JWT_ACCESS_SECRET: 'a_very_long_jwt_access_secret_string_over_32_chars_minimum',
        JWT_REFRESH_SECRET: 'a_very_long_jwt_access_secret_string_over_32_chars_minimum', // Identical!
      };
      const backend5 = spawn('node', ['src/server.js'], {
        cwd: 'D:\\MBN Group\\Test Menu\\backend',
        env: env,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      backend5.kill();
      console.log('   ❌ Identical secrets should have been rejected');
      failed++;
    } catch (err) {
      console.log('   ✅ Identical secrets correctly rejected');
      passed++;
    }

    // Test 6: Short secret rejected in production
    console.log('TEST 6: Short JWT secret (< 32 chars) rejected in production');
    try {
      const env = {
        ...process.env,
        NODE_ENV: 'production',
        REDIS_HOST: '127.0.0.1',
        REDIS_PORT: '6379',
        REDIS_PASSWORD: '',
        REDIS_DB: '0',
        CORS_ORIGIN: 'http://localhost:5173',
        JWT_ACCESS_SECRET: 'short', // Only 5 chars
      };
      const backend6 = spawn('node', ['src/server.js'], {
        cwd: 'D:\\MBN Group\\Test Menu\\backend',
        env: env,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      backend6.kill();
      console.log('   ❌ Short secret should have been rejected');
      failed++;
    } catch (err) {
      console.log('   ✅ Short JWT secret correctly rejected');
      passed++;
    }

    // Test 7: CORS - missing CORS_ORIGIN in production
    console.log('TEST 7: Missing CORS_ORIGIN in production');
    try {
      const env = {
        ...process.env,
        NODE_ENV: 'production',
        REDIS_HOST: '127.0.0.1',
        REDIS_PORT: '6379',
        REDIS_PASSWORD: '',
        REDIS_DB: '0',
        // CORS_ORIGIN omitted
      };
      const backend7 = spawn('node', ['src/server.js'], {
        cwd: 'D:\\MBN Group\\Test Menu\\backend',
        env: env,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      backend7.kill();
      console.log('   ❌ Missing CORS_ORIGIN should have been rejected');
      failed++;
    } catch (err) {
      console.log('   ✅ Missing CORS_ORIGIN correctly rejected in production');
      passed++;
    }

    // Test 8: Development mode still works
    console.log('TEST 8: Development mode still works with existing config');
    try {
      const env = {
        ...process.env,
        NODE_ENV: 'development',
        REDIS_HOST: '127.0.0.1',
        REDIS_PORT: '6379',
        REDIS_PASSWORD: '',
        REDIS_DB: '0',
        CORS_ORIGIN: 'http://localhost:5173',
        JWT_ACCESS_SECRET: 'a_very_long_jwt_access_secret_string_over_32_chars_minimum',
        JWT_REFRESH_SECRET: 'a_very_long_jwt_refresh_secret_string_over_32_chars_minimum',
      };
      const backend8 = spawn('node', ['src/server.js'], {
        cwd: 'D:\\MBN Group\\Test Menu\\backend',
        env: env,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      await waitForBackend();
      console.log('   ✅ Development mode works with existing config');
      backend8.kill();
      passed++;
    } catch (err) {
      console.log('   ❌ Development mode should work:', err.message);
      failed++;
    }

    console.log('\n=== Results ===');
    console.log('Passed:', passed);
    console.log('Failed:', failed);
    console.log('Total:', passed + failed);
  } catch (err) {
    console.error('❌ Test error:', err.message);
  } finally {
    if (backendProc && !backendProc.killed) {
      backendProc.kill();
    }
    process.exit(0);
  }
}

runTests();