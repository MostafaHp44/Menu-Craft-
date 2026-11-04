const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  const r = await p.request().query("SELECT id, slug, published_menu FROM Restaurants WHERE slug = 'api-test-rest'");
  const pub = r.recordset[0]?.published_menu;
  console.log('published_menu type:', typeof pub);
  try {
    const parsed = typeof pub === 'string' ? JSON.parse(pub) : pub;
    console.log('Parsed categories:', parsed?.length || 0);
    if (parsed && parsed[0]) {
      console.log('First cat id:', parsed[0].id, '| name:', parsed[0].name);
      console.log('First cat items count:', parsed[0].items?.length || 0);
      if (parsed[0].items && parsed[0].items[0]) {
        const first = parsed[0].items[0];
        console.log('First item id:', first.id, '| name:', first.name, '| price:', first.price, '| available:', first.available, '| options:', JSON.stringify(first.options)?.substring(0,200));
      }
      // List all item ids
      const allIds = parsed.flatMap(c => (Array.isArray(c.items) ? c.items.map(i => i.id) : []));
      console.log('All item IDs in published_menu:', allIds);
    }
  } catch (e) { console.log('Parse error:', e.message); }
  await p.close();
})();
