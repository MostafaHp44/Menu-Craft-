const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({host:'localhost',port:3306,user:'root',password:'',database:'menucraft_mysql'});
  try {
    const bellaId = 'rest-bella-mw1xq4wc-8pa9o';

    const [cats] = await c.query("SELECT id, name_en FROM menucategories WHERE restaurant_id = ?", [bellaId]);
    console.log('CATEGORIES:', JSON.stringify(cats, null, 2));

    const [items] = await c.query("SELECT id, name_en, price FROM menuitems WHERE restaurant_id = ?", [bellaId]);
    console.log('MENUITEMS:', JSON.stringify(items, null, 2));

    const [pub] = await c.query("SELECT published_menu, draft_menu FROM restaurants WHERE id = ?", [bellaId]);
    console.log('BELLA MENU STATE:', JSON.stringify(pub, null, 2));

    c.end();
  } catch(e) { console.log('ERR:', e.message); }
})();
