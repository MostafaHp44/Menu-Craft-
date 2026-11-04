const { getPool } = require('./src/config/db');
const bcrypt = require('bcryptjs');

(async () => {
  const p = await getPool();
  
  // Step 1: Register a new user
  const email = 'testuser2@example.com';
  const password = 'secret123';
  const name = 'Test User 2';
  const hashed = await bcrypt.hash(password, 12);
  console.log('Generated hash length:', hashed.length);
  
  const r = await p.request()
    .input('n', require('mssql').VarChar(200), name)
    .input('e', require('mssql').VarChar(100), email)
    .input('h', require('mssql').NVarChar(500), hashed)
    .query("INSERT INTO Users (name, email, password_hash, role, status) VALUES (@n, @e, @h, 'client', 'active'); SELECT SCOPE_IDENTITY() AS id");
  const userId = r.recordset[0].id;
  console.log('Inserted user ID:', userId);
  
  // Verify user is stored
  const r2 = await p.request()
    .input('e', require('mssql').VarChar(100), email)
    .query("SELECT email, password_hash FROM Users WHERE email = @e");
  console.log('User stored in DB:', r2.recordset.length > 0 ? 'YES' : 'NO');
  console.log('Password hash stored:', r2.recordset[0].password_hash.substring(0, 20) + '...');
  console.log('Hash length:', r2.recordset[0].password_hash.length);
  
  // Step 2: Test login (simulating the signin function exactly)
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
  console.log('1. Registration: User created successfully');
  console.log('2. Login lookup: ', loginResult.recordset.length > 0 ? 'User found' : 'User not found');
  console.log('3. Password verification: ', valid ? 'Passes bcrypt compare' : 'Fails');
  process.exit(0);
})();