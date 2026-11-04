// JWT Validation Tests
import { spawn } from 'child_process';

function testProductionStartup(env) {
  return new Promise((resolve) => {
    const child = spawn('node', ['src/server.js'], { env });
    let stderr = '';
    child.stderr.on('data', (data) => { stderr += data; });
    child.on('close', (code) => {
      resolve({ exitCode: code, stderr, passed: code === 1 && stderr.includes('JWT') });
    });
  });
}

async function runTests() {
  // Test 1: Missing JWT_ACCESS_SECRET in production
  const test1 = await testProductionStartup({
    ...process.env,
    NODE_ENV: 'production',
    REDIS_HOST: '127.0.0.1',
    REDIS_PORT: '6379',
    REDIS_PASSWORD: '',
    REDIS_DB: '0',
    CORS_ORIGIN: 'http://localhost:5173',
    // JWT_SECRET omitted
  });
  console.log('Test 1 - Missing JWT_ACCESS_SECRET: ' + (test1.passed ? 'PASS' : 'FAIL'));

  // Test 2: Missing JWT_REFRESH_SECRET in production
  const test2 = await testProductionStartup({
    ...process.env,
    NODE_ENV: 'production',
    REDIS_HOST: '127.0.0.1',
    REDIS_PORT: '6379',
    REDIS_PASSWORD: '',
    REDIS_DB: '0',
    CORS_ORIGIN: 'http://localhost:5173',
    JWT_ACCESS_SECRET: 'a_very_long_jwt_access_secret_string_over_32_chars_minimum',
    // JWT_REFRESH_SECRET omitted
  });
  console.log('Test 2 - Missing JWT_REFRESH_SECRET: ' + (test2.passed ? 'PASS' : 'FAIL'));

  // Test 3: Access secret shorter than 32 characters
  const test3 = await testProductionStartup({
    ...process.env,
    NODE_ENV: 'production',
    REDIS_HOST: '127.0.0.1',
    REDIS_PORT: '6379',
    REDIS_PASSWORD: '',
    REDIS_DB: '0',
    CORS_ORIGIN: 'http://localhost:5173',
    JWT_ACCESS_SECRET: 'short', // Only 5 chars
    JWT_REFRESH_SECRET: 'a_very_long_jwt_refresh_secret_string_over_32_chars_minimum',
  });
  console.log('Test 3 - Access secret < 32 chars: ' + (test3.passed ? 'PASS' : 'FAIL'));

  // Test 4: Refresh secret shorter than 32 characters
  const test4 = await testProductionStartup({
    ...process.env,
    NODE_ENV: 'production',
    REDIS_HOST: '127.0.0.1',
    REDIS_PORT: '6379',
    REDIS_PASSWORD: '',
    REDIS_DB: '0',
    CORS_ORIGIN: 'http://localhost:5173',
    JWT_ACCESS_SECRET: 'a_very_long_jwt_access_secret_string_over_32_chars_minimum',
    JWT_REFRESH_SECRET: 'short', // Only 5 chars
  });
  console.log('Test 4 - Refresh secret < 32 chars: ' + (test4.passed ? 'PASS' : 'FAIL'));

  // Test 5: Placeholder secret
  const test5 = await testProductionStartup({
    ...process.env,
    NODE_ENV: 'production',
    REDIS_HOST: '127.0.0.1',
    REDIS_PORT: '6379',
    REDIS_PASSWORD: '',
    REDIS_DB: '0',
    CORS_ORIGIN: 'http://localhost:5173',
    JWT_ACCESS_SECRET: 'change_this_access_secret_to_something_long_and_random',
    JWT_REFRESH_SECRET: 'a_very_long_jwt_refresh_secret_string_over_32_chars_minimum',
  });
  console.log('Test 5 - Placeholder secret: ' + (test5.passed ? 'PASS' : 'FAIL'));

  // Test 5b: Placeholder refresh secret
  const test5b = await testProductionStartup({
    ...process.env,
    NODE_ENV: 'production',
    REDIS_HOST: '127.0.0.1',
    REDIS_PORT: '6379',
    REDIS_PASSWORD: '',
    REDIS_DB: '0',
    CORS_ORIGIN: 'http://localhost:5173',
    JWT_ACCESS_SECRET: 'a_very_long_jwt_access_secret_string_over_32_chars_minimum',
    JWT_REFRESH_SECRET: 'change_this_refresh_secret',
  });
  console.log('Test 5b - Placeholder refresh secret: ' + (test5b.passed ? 'PASS' : 'FAIL'));

  // Test 6: Identical access and refresh secrets
  const test6 = await testProductionStartup({
    ...process.env,
    NODE_ENV: 'production',
    REDIS_HOST: '127.0.0.1',
    REDIS_PORT: '6379',
    REDIS_PASSWORD: '',
    REDIS_DB: '0',
    CORS_ORIGIN: 'http://localhost:5173',
    JWT_ACCESS_SECRET: 'a_very_long_jwt_access_secret_string_over_32_chars_minimum',
    JWT_REFRESH_SECRET: 'a_very_long_jwt_access_secret_string_over_32_chars_minimum', // Identical!
  });
  console.log('Test 6 - Identical secrets: ' + (test6.passed ? 'PASS' : 'FAIL'));

  // Test 7: Valid separate secrets of at least 32 characters
  const test7 = await testProductionStartup({
    ...process.env,
    NODE_ENV: 'production',
    REDIS_HOST: '127.0.0.1',
    REDIS_PORT: '6379',
    REDIS_PASSWORD: '',
    REDIS_DB: '0',
    CORS_ORIGIN: 'http://localhost:5173',
    JWT_ACCESS_SECRET: 'a_very_long_jwt_access_secret_string_over_32_chars_minimum',
    JWT_REFRESH_SECRET: 'a_very_long_jwt_refresh_secret_string_over_32_chars_minimum',
  });
  console.log('Test 7 - Valid separate secrets: ' + (test7.passed ? 'PASS' : 'FAIL'));

  console.log('\nAll JWT tests complete');
  process.exit(0);
}

runTests().catch(console.error);
"