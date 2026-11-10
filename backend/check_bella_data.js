const mysql = require('mysql2/promise');
(async () => {
  const pool = await require('./src/config/mysql').getMySQLPool();
  const conn = await pool.getConnection();
  try {
    const [rests] = await conn.query("SELECT id, slug FROM restaurants WHERE slug = 'bella'");
    console.log('BELLA RESTAURANT:', JSON.stringify(rests, null, 2));
    
    const bellaId = rests[0]?.id;
    
    const [items] = await conn.query("SELECT * FROM menuitems WHERE restaurant_id = ? LIMIT 20", [bellaId]);
    console.log('MENU ITEMS:', JSON.stringify(items, null, 2));
    
    const [branches] = await conn.query("SELECT * FROM branches WHERE restaurant_id = ?", [bellaId]);
    console.log('BRANCHES:', JSON.stringify(branches, null, 2));
    
    const [orders] = await conn.query("SELECT COUNT(*) as cnt FROM orders WHERE restaurant_id = ?", [bellaId]);
    console.log('ORDERS COUNT:', JSON.stringify(orders, null, 2));
  } catch(e) { console.log('ERR:', e.message); }
  conn.release();
  pool.end();
  process.exit(0);
})();
