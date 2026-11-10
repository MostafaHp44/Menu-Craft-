const mysql = require('mysql2/promise');
const { hashPassword } = require('./src/utils/hash');
(async () => {
  const pool = await require('./src/config/mysql').getMySQLPool();
  const conn = await pool.getConnection();
  try {
    const [waiters] = await conn.query("SELECT id, email, restaurant_id FROM users WHERE role = 'waiter' LIMIT 1");
    const rid = waiters[0].restaurant_id;
    console.log('Using restaurant_id:', rid);

    const pw = await hashPassword('Emp1234');

    const roleIds = {
      cashier: '04F15493-332D-4BF0-9E3D-2B3CE757E7E3',
      kitchen: '12BC9C57-A6E5-4424-9A99-6A46A6DB291F'
    };

    for (const [role, email, name] of [
      ['cashier', 'cashier@menucraft.test', 'Test Cashier'],
      ['kitchen', 'kitchen@menucraft.test', 'Test Kitchen']
    ]) {
      const userId = 'emp-' + role + '-' + Date.now();
      const linkId = 're-' + role + '-' + Date.now();

      await conn.execute(
        'INSERT INTO Users (id, name, email, password_hash, role, restaurant_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userId, name, email, pw, role, rid, 'active']
      );

      await conn.execute(
        "INSERT INTO RestaurantEmployees (id, restaurant_id, user_id, role_id, branch_access_type, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'all', 'active', NOW(), NOW())",
        [linkId, rid, userId, roleIds[role]]
      );

      console.log(`Created ${role}: ${email} / Emp1234 (user_id: ${userId})`);
    }

    const [all] = await conn.query("SELECT id, name, email, role, status FROM users WHERE role IN ('super_admin','cashier','kitchen','waiter') ORDER BY role, email");
    console.log('\nALL STAFF:', JSON.stringify(all, null, 2));
  } catch(e) { console.log('ERR:', e.message); }
  conn.release();
  pool.end();
  process.exit(0);
})();
