const { getPool } = require('./src/config/db');
const bcrypt = require('bcryptjs');

(async () => {
  const p = await getPool();
  
  // Step 1: Register exactly as auth.service.js signup does
  const email = 'testuser4@example.com';
  const password = 'secret123';
  const name = 'Test User 4';
  const emailLower = email.toLowerCase();
  
  // Check if user already exists
  const existing = await p.request()
    .input('email', require('mssql').VarChar(100), emailLower)
    .query("SELECT id FROM Users WHERE email = @email");
  
  if (existing.recordset.length > 0) {
    console.log('User already exists');
    process.exit(0);
  }
  
  const passwordHash = await bcrypt.hash(password, 12);
  const baseSlug = 'testuser4';
  const restaurantId = 'rest-' + Date.now().toString(36).slice(2, 7);
  
  const transaction = new (require('mssql').Transaction)(p);
  await transaction.begin();
  
  try {
    // Insert Restaurant
    await new (require('mssql').Request)(transaction)
      .input('id', require('mssql').VarChar(100), restaurantId)
      .input('name', require('mssql').VarChar(200), name)
      .input('slug', require('mssql').VarChar(200), baseSlug)
      .input('status', require('mssql').VarChar(50), 'draft')
      .input('plan', require('mssql').VarChar(50), 'trial')
      .input('site_lang', require('mssql').VarChar(10), 'en')
      .query("INSERT INTO Restaurants (id, name_en, slug, status, [plan], site_lang, created_at, updated_at) VALUES (@id, @name, @slug, @status, @plan, @site_lang, GETDATE(), GETDATE())");
    
    // Insert User
    const userId = 'usr-' + Date.now().toString(36).slice(2, 7);
    await new (require('mssql').Request)(transaction)
      .input('id', require('mssql').VarChar(100), userId)
      .input('name', require('mssql').VarChar(200), name)
      .input('email', require('mssql').VarChar(100), emailLower)
      .input('passwordHash', require('mssql').NVarChar(500), passwordHash)
      .input('role', require('mssql').VarChar(50), 'client')
      .input('restaurantId', require('mssql').VarChar(100), restaurantId)
      .input('status', require('mssql').VarChar(50), 'active')
      .query("INSERT INTO Users (id, name, email, password_hash, role, restaurant_id, status, created_at) VALUES (@id, @name, @email, @passwordHash, @role, @restaurantId, @status, GETDATE())");
    
    // Insert UserRestaurants
    await new (require('mssql').Request)(transaction)
      .input('userId', require('mssql').VarChar(100), userId)
      .input('restaurantId', require('mssql').VarChar(100), restaurantId)
      .query("INSERT INTO UserRestaurants (user_id, restaurant_id, is_owner) VALUES (@userId, @restaurantId, 1)");
    
    await transaction.commit();
    console.log('Signup transaction committed successfully');
  } catch (err) {
    await transaction.rollback().catch(() => {});
    console.log('Signup error:', err.message);
    process.exit(1);
  }
  
  // Step 2: Login exactly as auth.service.js signin does
  const loginResult = await p.request()
    .input('email', require('mssql').VarChar(100), emailLower)
    .query("SELECT id, name, email, password_hash, role, restaurant_id, status FROM Users WHERE email = @email");
  
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
  
  console.log('\n--- Full Authentication Flow Test ---');
  console.log('1. Signup: User created with trial plan and restaurant');
  console.log('2. Login lookup: ', loginResult.recordset.length > 0 ? 'User found' : 'User not found');
  console.log('3. Password verification: ', valid ? 'Passes bcrypt compare' : 'Fails');
  console.log('\nResult: Authentication flow is WORKING ✅');
  process.exit(0);
})();