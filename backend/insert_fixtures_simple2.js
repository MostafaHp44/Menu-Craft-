const sql = require('mssql');
(async () => {
  const fixtures = [
    { id: 'rest-template-royal', slug: 'royal', name: 'The Royal', tid: 'the-royal' },
    { id: 'rest-template-sweet', slug: 'atelier', name: 'Sweet Atelier', tid: 'sweet-atelier' },
    { id: 'rest-template-burger', slug: 'district', name: 'Burger District', tid: 'burger-district' },
    { id: 'rest-template-bean', slug: 'beanbrew', name: 'Bean & Brew', tid: 'bean-brew' },
    { id: 'rest-template-green', slug: 'greentable', name: 'Green Table', tid: 'green-table' },
    { id: 'rest-template-maison', slug: 'maison', name: 'Maison Patisserie', tid: 'maison-patisserie' },
  ];
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  for (const f of fixtures) {
    try {
      await p.request()
        .input('id', sql.NVarChar, f.id)
        .input('slug', sql.NVarChar, f.slug)
        .input('name', sql.NVarChar, f.name)
        .input('tid', sql.NVarChar, f.tid)
        .input('ord', sql.NVarChar, '{}')
        .input('pub', sql.NVarChar, '[]')
        .input('design', sql.NVarChar, '{}')
        .input('lang', sql.NVarChar, 'en')
        .query("INSERT INTO Restaurants (id, slug, name_en, templateId, status, ordering, published_menu, design, language, created_at) VALUES (@id, @slug, @name, @tid, 'published', @ord, @pub, @design, @lang, GETDATE())");
      console.log('Inserted', f.id);
    } catch (e) { if (e.message && e.message.includes('Violation of PRIMARY KEY')) console.log('Exists', f.id); else console.error('Err', f.id, e.message); }
  }
  await p.close();
})();
