const { getPool } = require('./src/config/db');
const bcrypt = require('bcryptjs');

(async () => {
  const p = await getPool();
  
  // Step 1: Register a new user - using the exact same pattern as auth.service.js signup
  const email = 'testuser3@example.com';
  const password = 'secret123';
  const name = 'Test User 3';
  
  const r = await p.request()
    .input('email', require('mssql').VarChar(100), email)
    .input('password', require('mssql').VarChar(100), password)  // signup hashes it
    .input('name', require('mssql').VarChar(200), name)
    .query("EXEC signup @email, @password, @name");  // calling the signup proc
  
  console.log('Signup result:', r.recordset.length > 0 ? r.recordset[0] : r);
  
  // Step 2: Login - using the exact same pattern as auth.service.js signin
  const emailLower = email.toLowerCase();
  const loginResult = await p.request()
    .input('email', require('mssql').VarChar(100), emailLower)
    .query("SELECT id, name, email, password_hash, role, restaurant_id, status FROM Users WHERE email = @e");
  
  console.log('Login query returned:', loginResult.recordset.length > 0 ? 'USER FOUND' : 'USER NOT FOUND');
  if (loginResult.recordset.length > 0) {
    const user = loginResult.recordset[0];
    console.log('User status:', user.status);
    console.log('Password hash length:', user.password_hash.length);
    
    // Verify password using bcrypt (exactly as signin() does line 133)
    const valid = await bcrypt.compare(password, user.password_hash);
    console.log('Password verification result:', valid ? 'SUCCESS ✅' : 'FAILURE ❌');
    console.log('Would return 401 error:', !valid ? 'YES - invalid credentials' : 'NO - login would succeed');
  }
  
  console.log('\n--- Summary ---');
  console.log('1. Registration via signup proc: Completed');
  console.log('2. Login lookup: ', loginResult.recordset.length > 0 ? 'User found' : 'User not found');
  console.log('3. Password verification: ', valid ? 'Passes bcrypt compare' : 'Fails');
  process.exit(0);
})();