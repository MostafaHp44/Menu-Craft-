const mysql = require('mysql2/promise');
(async () => {
  const pool = await require('./src/config/mysql').getMySQLPool();
  const conn = await pool.getConnection();
  try {
    const [rests] = await conn.query("SELECT id, slug FROM restaurants LIMIT 10");
    console.log('RESTAURANTS:', JSON.stringify(rests, null, 2));
    
    const [emps] = await conn.query("SELECT id, email, role, restaurant_id FROM users WHERE role IN ('cashier','kitchen','waiter') ORDER BY role");
    console.log('EMPLOYEES:', JSON.stringify(emps, null, 2));
  } catch(e) { console.log('ERR:', e.message); }
  conn.release();
  pool.end();
  process.exit(0);
})();
