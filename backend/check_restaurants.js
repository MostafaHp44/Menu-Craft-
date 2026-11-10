const mysql = require('mysql2/promise');
(async () => {
  const pool = await require('./src/config/mysql').getMySQLPool();
  const conn = await pool.getConnection();
  try {
    const [rests] = await conn.query("SELECT id, slug FROM restaurants");
    console.log('RESTAURANTS:', JSON.stringify(rests, null, 2));
  } catch(e) { console.log('ERR:', e.message); }
  conn.release();
  pool.end();
  process.exit(0);
})();
