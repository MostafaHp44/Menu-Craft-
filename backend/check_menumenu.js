const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({host:'localhost',port:3306,user:'root',password:'',database:'menucraft_mysql'});
  try {
    const bellaId = 'rest-bella-mw1xq4wc-8pa9o';

    const [cats] = await c.query("SELECT id, name_en FROM menucategories WHERE restaurant_id = ? ORDER BY sort_order", [bellaId]);
    console.log('CATEGORIES:', JSON.stringify(cats, null, 2));

    const [items] = await c.query("SELECT id, category_id, name_en, description_en, price, image, available, featured, sort_order FROM menuitems WHERE restaurant_id = ? ORDER BY category_id, sort_order", [bellaId]);
    console.log('ITEMS:', JSON.stringify(items, null, 2));

    c.end();
  } catch(e) { console.log('ERR:', e.message); }
})();
