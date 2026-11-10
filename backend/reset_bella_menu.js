const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({host:'localhost',port:3306,user:'root',password:'',database:'menucraft_mysql'});
  try {
    // فقط منيو البذور القديمة — نمسحها لتكون فارغة تماماً
    await c.execute("UPDATE restaurants SET published_menu = '[]', draft_menu = '[]' WHERE slug = ?", ['bella']);
    const [r] = await c.query("SELECT published_menu, draft_menu FROM restaurants WHERE slug = 'bella'");
    console.log('OK: bella published_menu and draft_menu cleared:', r[0]?.published_menu, '/', r[0]?.draft_menu);

    // أيضاً تحقق من بقية المطاعم
    await c.execute("UPDATE restaurants SET published_menu = '[]', draft_menu = '[]'");
    const [all] = await c.query("SELECT slug, published_menu, draft_menu FROM restaurants");
    console.log('ALL CLEAR:', JSON.stringify(all, null, 2));
    c.end();
  } catch(e) { console.log('ERR:', e.message); }
})();
