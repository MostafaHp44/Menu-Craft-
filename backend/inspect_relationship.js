const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });

  console.log('=== RESTAURANTS ===');
  const rest = await p.request().query("SELECT id, slug, name_en, templateId, design FROM Restaurants WHERE slug = 'api-test-rest' OR slug = 'bella' OR slug = 'tecnoworld'");
  rest.recordset.forEach(r => console.log('  ', r.slug, '| id=', r.id, '| name=', r.name_en, '| template=', r.templateId, '| design=', r.design ? r.design.substring(0, 60) + '...' : null));

  console.log('=== MENUITEMS COLUMNS ===');
  const cols = await p.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'MenuItems'");
  console.log('  ', cols.recordset.map(c => c.COLUMN_NAME).join(', '));

  console.log('=== MENUITEMS CONTENT (first 10) ===');
  const items = await p.request().query("SELECT TOP 10 id, name_en, price, category_id FROM MenuItems");
  items.recordset.forEach(i => console.log('  ', i.id, '| name=', i.name_en, '| price=', i.price, '| category=', i.category_id));

  console.log('=== MENUCATEGORIES ===');
  const cats = await p.request().query("SELECT id, name_en, restaurant_id FROM MenuCategories");
  cats.recordset.forEach(c => console.log('  ', c.id, '| name=', c.name_en, '| restaurant_id=', c.restaurant_id));

  console.log('=== PUBLISHED_MENU STRUCTURE (api-test-rest) ===');
  const pub = await p.request().query("SELECT slug, published_menu FROM Restaurants WHERE slug = 'api-test-rest'");
  if (pub.recordset[0] && pub.recordset[0].published_menu) {
    console.log('  type:', typeof pub.recordset[0].published_menu);
    console.log('  value:', JSON.stringify(pub.recordset[0].published_menu).substring(0, 500));
  } else {
    console.log('  published_menu =', pub.recordset[0]?.published_menu);
  }

  console.log('=== INFORMATION_SCHEMA TABLES WITH menu/item/restaurant in name ===');
  const tables = await p.request().query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'");
  console.log('  ', tables.recordset.map(t => t.TABLE_NAME).filter(n => /menu|item|restaurant|category/i.test(n)).join(', '));

  await p.close();
})();
