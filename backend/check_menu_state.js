const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({host:'localhost',port:3306,user:'root',password:'',database:'menucraft_mysql'});
  try {
    const [rows] = await c.query(`
      SELECT r.id, r.slug,
        (SELECT COUNT(*) FROM menucategories mc WHERE mc.restaurant_id = r.id) AS cats,
        (SELECT COUNT(*) FROM menuitems mi WHERE mi.restaurant_id = r.id) AS items,
        LENGTH(r.draft_menu) AS draft_len,
        LENGTH(r.published_menu) AS pub_len
      FROM restaurants r
    `);
    console.log('RESTAURANTS MENU STATE:');
    console.table(rows);

    const [fks] = await c.query(`
      SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = 'menucraft_mysql'
        AND REFERENCED_TABLE_NAME IN ('MenuItems','MenuCategories')
    `);
    console.log('FOREIGN KEYS pointing to MenuItems/MenuCategories:', JSON.stringify(fks, null, 2));

    const [tables] = await c.query(`SHOW TABLES`);
    console.log('TABLES:', tables.map(t => Object.values(t)[0]).join(', '));
  } catch(e) { console.log('ERR:', e.message); }
  c.end();
})();
