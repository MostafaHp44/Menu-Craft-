const mysql = require('mysql2/promise');
const { hashPassword } = require('./src/utils/hash');
(async () => {
  const pool = await require('./src/config/mysql').getMySQLPool();
  const conn = await pool.getConnection();
  try {
    // Reset waiter passwords to known value
    const pw = await hashPassword('Waiter1234');
    await conn.execute("UPDATE users SET password_hash = ? WHERE email = 'waiter.e2e@example.com'", [pw]);
    await conn.execute("UPDATE users SET password_hash = ? WHERE email = 'sara.salem@example.com'", [pw]);
    console.log('Passwords reset for waiters to: Waiter1234');
  } catch(e) { console.log('ERR:', e.message); }
  conn.release();
  pool.end();
  process.exit(0);
})();
