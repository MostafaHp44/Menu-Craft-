const { getPool, sql } = require('./src/config/db');

(async () => {
  try {
    const pool = await getPool();
    await pool.request().query(`ALTER TABLE Restaurants ADD site_lang NVARCHAR(10) DEFAULT 'ar'`);
    console.log('ALTER OK: site_lang added');
  } catch (e) {
    console.log('ALTER result:', e.message);
  }
  process.exit(0);
})();
