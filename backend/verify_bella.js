const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({host:'localhost',port:3306,user:'root',password:'',database:'menucraft_mysql'});
  try {
    const bellaId = 'rest-bella-mw1xq4wc-8pa9o';

    const [cats] = await c.query("SELECT id, name_en FROM menucategories WHERE restaurant_id = ? ORDER BY sort_order", [bellaId]);
    console.log('CATEGORIES in DB (bella):', JSON.stringify(cats, null, 2));

    const [items] = await c.query("SELECT id, name_en, price FROM menuitems WHERE restaurant_id = ? ORDER BY sort_order", [bellaId]);
    console.log('ITEMS in DB (bella):', JSON.stringify(items, null, 2));

    const [pub] = await c.query("SELECT published_menu FROM restaurants WHERE id = ? AND slug = 'bella'", [bellaId]);
    console.log('PUBLISHED_MENU first 200:', pub[0]?.published_menu?.slice(0, 200) || 'EMPTY');

    c.end();
  } catch(e) { console.log('ERR:', e.message); }
})();
