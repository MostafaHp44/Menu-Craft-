const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({host:'localhost',port:3306,user:'root',password:'',database:'menucraft_mysql'});
  try {
    const [r] = await c.execute(`
      UPDATE menuitems mi
        JOIN menucategories mc ON mc.id = mi.category_id
      SET mi.restaurant_id = mc.restaurant_id
      WHERE mi.restaurant_id IS NULL AND mc.restaurant_id IS NOT NULL
    `);
    console.log('FIXED restaurant_id rows:', r.affectedRows);
    const [left] = await c.query('SELECT id, name_en, restaurant_id FROM menuitems WHERE restaurant_id IS NULL');
    console.log('STILL NULL:', JSON.stringify(left));
  } catch (e) { console.log('ERR:', e.message); }
  c.end();
})();
