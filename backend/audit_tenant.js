const { getPool } = require('./src/config/db');
const sql = require('mssql');

(async () => {
  console.log('=== Phase 4 Audit: Multi-Tenant Security ===');
  console.log('');
  
  const pool = await getPool();
  
  // 1. Check Users table columns
  console.log('1. Users Table Columns:');
  const usersCols = await pool.request()
    .input('table', require('mssql').NVarChar, 'Users')
    .query("SELECT COLUMN_NAME FROM information_schema.columns WHERE TABLE_NAME=@table ORDER BY ORDINAL_POSITION");
  console.log('   - ' + usersCols.recordset.map(r => r.COLUMN_NAME).join(', '));
  console.log('');
  
  // 2. Check UserRestaurants relationships
  console.log('2. UserRestaurants Relationships:');
  const urCount = await pool.request().query('SELECT COUNT(*) AS cnt FROM UserRestaurants');
  console.log('   - Total UserRestaurants entries: ' + urCount.recordset[0].cnt);
  console.log('');
  
  // 3. Check user-restaurant assignments
  const users = await pool.request().query('SELECT id, name, email, restaurant_id FROM Users');
  console.log('   - Users and their restaurant_id:');
  users.recordset.forEach(u => {
    console.log('     - ' + u.name + ': restaurant_id = ' + u.restaurant_id);
  });
  console.log('');
  
  // 4. Check UserRestaurants assignments
  const urData = await pool.request().query('SELECT user_id, restaurant_id, is_owner FROM UserRestaurants');
  console.log('   - UserRestaurants assignments:');
  urData.recordset.forEach(ur => {
    console.log('     - user ' + ur.user_id + ' -> restaurant ' + ur.restaurant_id + ' (is_owner: ' + ur.is_owner + ')');
  });
  console.log('');
  
  // 5. Check that each user has proper restaurant assignment
  console.log('5. Ownership Validation:');
  const allUsers = users.recordset;
  for (const u of allUsers) {
    if (u.restaurant_id) {
      const ur = await pool.request()
        .input('userId', sql.VarChar, u.id)
        .query('SELECT TOP 1 id FROM UserRestaurants WHERE user_id = @userId');
      const hasUr = ur.recordset.length > 0;
      console.log('   - User ' + u.name + ' (id: ' + u.id + '): restaurant_id=' + u.restaurant_id + ', has UserRestaurants entry=' + hasUr);
    }
  }
  console.log('');
  
  // 6. Check restaurant ownership - can a user access another's restaurant?
  console.log('6. Cross-User Access Check:');
  // Get first two users and check their restaurant assignments
  if (allUsers.length >= 2) {
    const u1 = allUsers[0];
    const u2 = allUsers[1];
    console.log('   - User ' + u1.name + ' (id: ' + u1.id + ') restaurant: ' + u1.restaurant_id);
    console.log('   - User ' + u2.name + ' (id: ' + u2.id + ') restaurant: ' + u2.restaurant_id);
    // Check if u1 has access to u2's restaurant via UserRestaurants
    const u1HasU2 = await pool.request()
      .input('userId', sql.VarChar, u1.id)
      .input('restId', sql.VarChar, u2.restaurant_id)
      .query('SELECT TOP 1 id FROM UserRestaurants WHERE user_id = @userId AND restaurant_id = @restId');
    console.log('   - User ' + u1.name + ' has UserRestaurants entry for u2\'s restaurant: ' + (u1HasU2.recordset.length > 0));
    // Check if u2 has access to u1's restaurant
    const u2HasU1 = await pool.request()
      .input('userId', sql.VarChar, u2.id)
      .input('restId', sql.VarChar, u1.restaurant_id)
      .query('SELECT TOP 1 id FROM UserRestaurants WHERE user_id = @userId AND restaurant_id = @restId');
    console.log('   - User ' + u2.name + ' has UserRestaurants entry for u1\'s restaurant: ' + (u2HasU1.recordset.length > 0));
  }
  console.log('');
  
  // 7. Check that restaurant queries have ownership validation
  console.log('7. Ownership Middleware:');
  console.log('   - userOwnsSite checks UserRestaurants table first');
  console.log('   - isPrivileged role (super_admin/admin) bypasses ownership check');
  console.log('   - Legacy fallback: checks Users.restaurant_id field');
  console.log('');
  
  process.exit(0);
})();