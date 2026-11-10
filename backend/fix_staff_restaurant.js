const mysql = require('mysql2/promise');
(async () => {
  const pool = await require('./src/config/mysql').getMySQLPool();
  const conn = await pool.getConnection();
  try {
    const bellaId = 'rest-bella-mw1xq4wc-8pa9o';

    // Update cashier and kitchen users to Bella's restaurant
    await conn.query("UPDATE users SET restaurant_id = ? WHERE email = 'cashier@menucraft.test'", [bellaId]);
    await conn.query("UPDATE users SET restaurant_id = ? WHERE email = 'kitchen@menucraft.test'", [bellaId]);
    await conn.query("UPDATE users SET restaurant_id = ? WHERE email = 'waiter.e2e@example.com'", [bellaId]);
    await conn.query("UPDATE users SET restaurant_id = ? WHERE email = 'sara.salem@example.com'", [bellaId]);

    // Update RestaurantEmployees too
    await conn.query("UPDATE RestaurantEmployees SET restaurant_id = ? WHERE user_id IN (SELECT id FROM users WHERE email IN ('cashier@menucraft.test','kitchen@menucraft.test','waiter.e2e@example.com','sara.salem@example.com'))", [bellaId]);

    // Verify
    const [staff] = await conn.query("SELECT id, name, email, role, restaurant_id FROM users WHERE role IN ('cashier','kitchen','waiter') ORDER BY role, email");
    console.log('UPDATED STAFF:', JSON.stringify(staff, null, 2));

    // Verify orders for Bella
    const [orders] = await conn.query("SELECT id, customer_name, status, payment_method, total, restaurant_id FROM orders WHERE restaurant_id = ? ORDER BY created_at DESC LIMIT 5", [bellaId]);
    console.log('\nBELLA ORDERS:', JSON.stringify(orders, null, 2));
  } catch(e) { console.log('ERR:', e.message); }
  conn.release();
  pool.end();
  process.exit(0);
})();
