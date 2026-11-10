const mysql = require('mysql2/promise');
(async () => {
  const pool = await require('./src/config/mysql').getMySQLPool();
  const conn = await pool.getConnection();
  try {
    const [tables] = await conn.query("SHOW TABLES");
    console.log('TABLES:', JSON.stringify(tables, null, 2));
  } catch(e) { console.log('ERR:', e.message); }
  conn.release();
  pool.end();
  process.exit(0);
})();
