const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({host:'localhost',port:3306,user:'root',password:'',database:'menucraft_mysql'});
  try {
    const bellaId = 'rest-bella-mw1xq4wc-8pa9o';

    // Read categories and items
    const [cats] = await c.query(
      "SELECT id, name_en FROM menucategories WHERE restaurant_id = ? ORDER BY sort_order, created_at",
      [bellaId]
    );
    const [items] = await c.query(
      "SELECT id, category_id, name_en, description_en, price, image, available, featured, sort_order FROM menuitems WHERE restaurant_id = ? ORDER BY sort_order, created_at",
      [bellaId]
    );

    // Build menu payload matching published_menu format
    const menu = cats.map((cat) => ({
      id: cat.id,
      name: cat.name_en,
      note: '',
      items: items
        .filter((item) => item.category_id === cat.id)
        .map((item) => ({
          id: item.id,
          name: item.name_en,
          description: item.description_en || '',
          price: Number(item.price || 0),
          compareAt: null,
          image: item.image || '',
          featured: Boolean(item.featured),
          popular: false,
          available: Boolean(item.available),
        })),
    }));

    const menuJson = JSON.stringify(menu);

    // Update published_menu and draft_menu
    await c.execute(
      "UPDATE restaurants SET published_menu = ?, draft_menu = ?, updated_at = NOW() WHERE id = ?",
      [menuJson, menuJson, bellaId]
    );

    console.log('OK: published_menu and draft_menu updated for Bella');

    // Verify
    const [verify] = await c.query("SELECT published_menu, draft_menu FROM restaurants WHERE id = ?", [bellaId]);
    console.log('PUBLISHED_MENU (updated):', verify[0]?.published_menu?.slice(0, 300) || 'EMPTY');

    c.end();
  } catch(e) { console.log('ERR:', e.message); }
})();
