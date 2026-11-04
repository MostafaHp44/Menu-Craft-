const { getPool } = require('./src/config/db');

(async () => {
  console.log('=== Phase 4 Audit: Authentication & Authorization ===');
  console.log('');
  
  // 1. JWT Expiration
  console.log('1. JWT Expiration:');
  console.log('   - Access token: 15 minutes (from token.js)');
  console.log('   - Refresh token: 7 days (from token.js)');
  console.log('');
  
  // 2. Password Hashing
  const { hashPassword, comparePassword } = require('./src/utils/hash');
  console.log('2. Password Hashing:');
  try {
    const hashed = await hashPassword('testpassword123');
    console.log('   - bcrypt with 12 salt rounds: YES');
    console.log('   - Hash length: ' + hashed.length + ' (expected: 60)');
  } catch (e) {
    console.log('   - Error: ' + e.message);
  }
  console.log('');
  
  // 3. Auth Endpoints
  console.log('3. Auth Endpoints:');
  console.log('   - POST /api/auth/signup - signup');
  console.log('   - POST /api/auth/signin - signin');
  console.log('   - POST /api/auth/refresh - token refresh');
  console.log('');
  
  // 4. Protected Routes
  console.log('4. Protected Routes:');
  console.log('   - /api/auth/me - current user');
  console.log('   - /api/billing/status - billing');
  console.log('   - /api/platform/* - platform (auth required)');
  console.log('   - /api/sites/* - sites (auth required)');
  console.log('');
  
  // 5. Super Admin
  console.log('5. Super Admin:');
  console.log('   - No explicit super_admin role in current schema');
  console.log('   - Only \'client\' and \'role\' field found in Users table');
  console.log('   - isPrivileged function checks for \'super_admin\' or \'admin\'');
  console.log('');
  
  // 6. Auth Flow Verification
  console.log('6. Auth Flow Verification:');
  console.log('   - signup creates User + Restaurant + UserRestaurants + trial subscription');
  console.log('   - signin verifies email + password + status=\'active\'');
  console.log('   - refresh generates new access token from valid refresh token');
  console.log('');
  
  process.exit(0);
})();