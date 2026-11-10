const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({host:'localhost',port:3306,user:'root',password:'',database:'menucraft_mysql'});
  try {
    const [[i]] = await c.query("SELECT id, name_en, restaurant_id, price FROM menuitems WHERE name_en = ?", ['Tagliatelle ai Funghi']);
    console.log('MENUITEMS_BUT_EMPTY_ARRAY?:', JSON.stringify(i, null, 2));

    const [pub] = await c.query("SELECT published_menu FROM restaurants WHERE slug = ?", ['bella']);
    const has = pub[0]?.published_menu?.includes('Tagliatelle');
    console.log('PUBLISHED_MENU_CONTAINS_Tagliatelle:', has);

    c.end();
  } catch(e) { console.log('ERR:', e.message); }
})();
