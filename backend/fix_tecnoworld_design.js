const sql = require('mssql');
const tpl = {
  colors: { primary: '#17150F', secondary: '#6B665C', accent: '#E8571F', background: '#F7F5F2', text: '#17150F', card: '#FFFFFF', button: '#E8571F' },
  typography: { heading: 'montserrat', body: 'inter', menu: 'inter', headingScale: 1.04, bodyScale: 1.02, headingWeight: 700, lineHeight: 1.55 },
  layout: { header: 'split', hero: 'split', menuLayout: 'grid', card: 'bordered', radius: 8, spacing: 1, aspect: 'square', theme: 'light' },
  sections: [{id:'featured',enabled:true},{id:'menu',enabled:true},{id:'about',enabled:true},{id:'gallery',enabled:true},{id:'hours',enabled:true},{id:'contact',enabled:true}],
};
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  await p.request().input('id', sql.NVarChar, 'rest-1793398912519-wd0jb').input('d', sql.NVarChar, JSON.stringify(tpl)).query('UPDATE Restaurants SET design = @d WHERE id = @id');
  console.log('TecnoWorld design fixed');
  const r = await p.request().input('id', sql.NVarChar, 'rest-1793398912519-wd0jb').query('SELECT id, name_en, templateId, design FROM Restaurants WHERE id=@id');
  console.log('After:', r.recordset[0]);
  await p.close();
})();
