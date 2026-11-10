const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({host:'localhost',port:3306,user:'root',password:'',database:'menucraft_mysql'});
  const [r] = await c.query('SELECT id, slug, LENGTH(draft_menu) dl, LENGTH(published_menu) pl FROM restaurants');
  console.log('RESTAURANTS:', JSON.stringify(r, null, 2));
  const [i] = await c.query('SELECT id, name_en, restaurant_id, category_id FROM menuitems');
  console.log('ITEMS:', JSON.stringify(i, null, 2));
  c.end();
})();
