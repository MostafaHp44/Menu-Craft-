const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({host:'localhost',port:3306,user:'root',password:'',database:'menucraft_mysql'});
  try {
    const [rows] = await c.query("SELECT id, slug, name_en, published_menu, draft_menu FROM restaurants WHERE slug = 'bella'");
    console.log('CURRENT:', JSON.stringify(rows, null, 2));

    const [items] = await c.query("SELECT id, name_en, restaurant_id FROM menuitems WHERE restaurant_id = ?", ['rest-bella-mw1xq4wc-8pa9o']);
    console.log('MENUITEMS:', JSON.stringify(items, null, 2));

    c.end();
  } catch(e) { console.log('ERR:', e.message); }
})();
