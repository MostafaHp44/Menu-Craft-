const sql = require('mssql');
const config = { user: 'sa', password: 'YourStrong@Passw0rd', database: 'menucraft_docker', server: 'localhost', port: 1433, options: { encrypt: false, trustServerCertificate: true } };

(async () => {
  let p;
  try {
    p = await sql.connect(config);
    console.log('=== PHASE A.2 STEP 2 — READ-ONLY INSPECTION ===');

    const items = await p.query(`SELECT mi.id, mi.name_en, mi.name_ar, mi.name_ku, mi.source_lang, mc.restaurant_id FROM dbo.MenuItems mi LEFT JOIN dbo.MenuCategories mc ON mi.category_id = mc.id`);
    console.log('MenuItems rows (with restaurant via category):', JSON.stringify(items.recordset, null, 2));

    const cats = await p.query(`SELECT id, restaurant_id, name_en, name_ar, name_ku, source_lang FROM dbo.MenuCategories`);
    console.log('MenuCategories rows:', JSON.stringify(cats.recordset, null, 2));

    // Get restaurant languages for all involved restaurants
    const restIds = new Set();
    for (const r of items.recordset) restIds.add(r.restaurant_id);
    for (const r of cats.recordset) restIds.add(r.restaurant_id);
    if (restIds.size > 0) {
      const rest = await p.query(`SELECT id, language FROM dbo.Restaurants WHERE id IN (${Array.from(restIds).map(x=>"'"+x+"'").join(',')})`);
      console.log('Restaurants info:', JSON.stringify(rest.recordset, null, 2));
    }

    await p.close();
  } catch (e) {
    console.error('Error:', e.message || e);
    if (p) await p.close();
  }
})();
