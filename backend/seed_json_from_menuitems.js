/**
 * مزامنة أولية: يبني draft_menu / published_menu من جدولي MenuCategories + MenuItems
 * حتى يبدأ المحرر بنفس المنيو المعروضة على الموقع (بدون فقدان أي صنف).
 *
 * الاستخدام:  node seed_json_from_menuitems.js
 * يأخذ نسخة احتياطية من الأعمدة القديمة في menu_backup_<timestamp>.json قبل الكتابة.
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const str = (v) => (v === null || v === undefined ? '' : String(v));
const num = (v) => (v === null || v === undefined || v === '' ? null : Number(v));

(async () => {
  const c = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'menucraft_mysql',
  });

  try {
    // 1) نسخة احتياطية من كل الأعمدة قبل أي كتابة
    const [all] = await c.query('SELECT id, slug, draft_menu, published_menu FROM restaurants');
    const backup = {
      takenAt: new Date().toISOString(),
      note: 'نسخة احتياطية قبل seed_json_from_menuitems.js',
      restaurants: all,
    };
    const backupFile = path.join(__dirname, `menu_backup_${Date.now()}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2), 'utf8');
    console.log('BACKUP:', backupFile);

    // 2) لكل مطعم لديه أصناف في الجدولين — نبني المنيو منهما
    const [withItems] = await c.query(`
      SELECT DISTINCT r.id, r.slug
        FROM restaurants r
        JOIN menucategories mc ON mc.restaurant_id = r.id
        JOIN menuitems mi ON mi.category_id = mc.id
    `);

    for (const r of withItems) {
      const [cats] = await c.query(
        'SELECT * FROM menucategories WHERE restaurant_id = ? ORDER BY sort_order ASC',
        [r.id]
      );

      const menu = [];
      for (const cat of cats) {
        const [items] = await c.query(
          'SELECT * FROM menuitems WHERE category_id = ? ORDER BY sort_order ASC',
          [cat.id]
        );
        menu.push({
          id: cat.id,
          name: str(cat.name_en),
          note: str(cat.note_en),
          items: items.map((i) => {
            let options = null;
            if (i.options) {
              try {
                options = typeof i.options === 'string' ? JSON.parse(i.options) : i.options;
              } catch {
                options = null;
              }
            }
            return {
              id: i.id,
              name: str(i.name_en),
              description: str(i.description_en),
              price: Number(i.price || 0),
              compareAt: num(i.compare_at),
              image: str(i.image),
              featured: Boolean(i.featured),
              popular: Boolean(i.popular),
              available: i.available === null || i.available === undefined ? true : Boolean(i.available),
              ...(options ? { options } : {}),
            };
          }),
        });
      }

      const json = JSON.stringify(menu);
      await c.execute('UPDATE restaurants SET draft_menu = ?, published_menu = ?, updated_at = NOW() WHERE id = ?', [
        json,
        json,
        r.id,
      ]);

      const dishCount = menu.reduce((s, cat) => s + cat.items.length, 0);
      console.log(`SEEDED ${r.slug}: ${menu.length} categories, ${dishCount} items`);
    }

    if (withItems.length === 0) console.log('لا توجد مطاعم بها أصناف في الجدولين.');
  } catch (e) {
    console.log('ERR:', e.message);
  } finally {
    c.end();
  }
})();
