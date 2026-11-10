const m = require('./src/config/mysql');
const { getTemplateSampleMenu } = require('./src/data/templateSamples');
(async () => {
  const c = await m.getMySQLPool().getConnection();
  const sample = getTemplateSampleMenu('bella-italia');
  await c.execute('UPDATE Restaurants SET draft_menu = ?, templateId = ? WHERE id = ?', [JSON.stringify(sample), 'bella-italia', 'rest-bella-mw1xq4wc-8pa9o']);
  const [d] = await c.execute('SELECT draft_menu FROM Restaurants WHERE id = ?', ['rest-bella-mw1xq4wc-8pa9o']);
  const menu = JSON.parse(d[0].draft_menu || '[]');
  const cats = menu.length;
  const items = menu.reduce((s,c)=>s+(c.items||[]).length,0);
  console.log('bella-italia imported -> Categories:', cats, 'Items:', items);
  console.log('Names:', menu.map(c=>c.name).join(', '));
  c.release();
  process.exit(0);
})();
