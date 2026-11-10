const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({host:'localhost',port:3306,user:'root',password:'',database:'menucraft_mysql'});
  try {
    const [pub] = await c.query("SELECT published_menu FROM restaurants WHERE slug = ?", ['bella']);
    console.log('PUBLISHED_MENU:', pub[0]?.published_menu);
    c.end();
  } catch(e) { console.log('ERR:', e.message); }
})();
