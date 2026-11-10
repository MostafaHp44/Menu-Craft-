const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({host:'localhost',port:3306,user:'root',password:'',database:'menucraft_mysql'});
  try {
    const [items] = await c.query("SELECT id, restaurant_id, name_en, price FROM menuitems WHERE name_en = ? AND restaurant_id = ?", ['Pepperoni Pizza', 'rest-bella-mw1xq4wc-8pa9o']);
    console.log('ITEMS:', JSON.stringify(items, null, 2));

    const [pub] = await c.query("SELECT published_menu FROM restaurants WHERE slug = ?", ['bella']);
    console.log('PUBLISHED_MENU length:', pub[0]?.published_menu ? pub[0].published_menu.length : 0);

    c.end();
  } catch(e) { console.log('ERR:', e.message); }
})();
