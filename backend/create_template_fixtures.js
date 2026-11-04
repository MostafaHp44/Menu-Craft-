const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  const fixtures = [
    { id: 'rest-template-royal', slug: 'royal', templateId: 'the-royal', name: 'The Royal', status: 'published', ordering: '{"enabled":true,"fulfillment":{"pickup":true},"currency":"USD"}', published_menu: '[]' },
    { id: 'rest-template-sweet', slug: 'atelier', templateId: 'sweet-atelier', name: 'Sweet Atelier', status: 'published', ordering: '{"enabled":true,"fulfillment":{"pickup":true},"currency":"USD"}', published_menu: '[]' },
    { id: 'rest-template-burger', slug: 'district', templateId: 'burger-district', name: 'Burger District', status: 'published', ordering: '{"enabled":true,"fulfillment":{"pickup":true},"currency":"USD"}', published_menu: '[]' },
    { id: 'rest-template-bean', slug: 'beanbrew', templateId: 'bean-brew', name: 'Bean & Brew', status: 'published', ordering: '{"enabled":true,"fulfillment":{"pickup":true},"currency":"USD"}', published_menu: '[]' },
    { id: 'rest-template-green', slug: 'greentable', templateId: 'green-table', name: 'Green Table', status: 'published', ordering: '{"enabled":true,"fulfillment":{"pickup":true},"currency":"USD"}', published_menu: '[]' },
    { id: 'rest-template-maison', slug: 'maison', templateId: 'maison-patisserie', name: 'Maison Patisserie', status: 'published', ordering: '{"enabled":true,"fulfillment":{"pickup":true},"currency":"USD"}', published_menu: '[]' },
  ];
  for (const f of fixtures) {
    const pool = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
    try {
      await pool.request().input('id', sql.NVarChar, f.id).query(`SELECT 1 FROM Restaurants WHERE id = @id`);
      // Insert only if not exists
      await pool.request().input('id', sql.NVarChar, f.id).input('slug', sql.NVarChar, f.slug).input('name', sql.NVarChar, f.name).input('tid', sql.NVarChar, f.templateId).input('stat', sql.NVarChar, f.status).input('ord', sql.NVarChar, f.ordering).input('pub', sql.NVarChar, f.published_menu).query('INSERT INTO Restaurants (id, slug, name_en, templateId, status, ordering, published_menu, design, language, created_at) VALUES (@id,@slug,@name,@tid,@stat,@ord,@pub,"{}","en",GETDATE())');
      console.log('Fixture:', f.id, '|', f.name);
    } catch (e) { console.error('Fixture error', f.id, e.message); }
    await pool.close();
  }
  await p.close();
})();
