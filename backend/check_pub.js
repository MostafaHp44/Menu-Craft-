const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  const r = await p.request().query("SELECT id, slug, status, name_en, name_ar FROM Restaurants WHERE slug='bella'");
  console.log('rest', r.recordset);
  const rest = r.recordset[0];
  if (rest) {
    const menu = await p.request().input('id', sql.NVarChar, rest.id).query("SELECT LEN(published_menu) AS plen, status FROM Restaurants WHERE id=@id");
    console.log('menu length', menu.recordset[0]);
    const m = await p.request().input('id', sql.NVarChar, rest.id).query("SELECT * FROM Branches WHERE restaurant_id=@id");
    console.log('branches', m.recordset.length);
    const items = await p.request().input('id', sql.NVarChar, rest.id).query("SELECT COUNT(*) AS c FROM MenuItems WHERE restaurant_id=@id");
    console.log('menu items', items.recordset[0]);
  }
  await p.close();
})();
