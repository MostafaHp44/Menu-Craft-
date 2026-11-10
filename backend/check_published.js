const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({host:'localhost',port:3306,user:'root',password:'',database:'menucraft_mysql'});
  try {
    // Show restaurant slug
    const [rests] = await c.query("SELECT id, slug, status, name_en, name_ar, updated_at FROM restaurants WHERE slug = 'bella'");
    console.log('BELLA RESTAURANT:', JSON.stringify(rests, null, 2));

    const bellaId = rests[0]?.id;

    // Check category count and item count in DB
    const [counts] = await c.query("SELECT COUNT(*) as cnt FROM menuitems WHERE restaurant_id = ?", [bellaId]);

    // Check if published_menu is set (the public site reads it)
    const [pub] = await c.query("SELECT slug, status, published_menu, draft_menu, updated_at FROM restaurants WHERE id = ?", [bellaId]);
    console.log('PUBLISHED MENU (truncated):', pub[0]?.published_menu?.slice ? pub[0].published_menu.slice(0,200) : pub[0].published_menu);

    // Show item names
    const [items] = await c.query("SELECT id, name_en FROM menuitems WHERE restaurant_id = ?", [bellaId]);
    console.log('ITEMS:', JSON.stringify(items, null, 2));

    c.end();
  } catch(e) { console.log('ERR:', e.message); }
})();
