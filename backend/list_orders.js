const mysql = require('mysql2/promise');
async function t() {
  const c = await mysql.createConnection({ host: '127.0.0.1', port: 3306, user: 'root', password: '', database: 'menucraft_mysql' });
  const [rows] = await c.execute("SELECT id, restaurant_id FROM Orders WHERE id = ''");
  console.log('Empty-id rows:', rows.length);
  const [all] = await c.execute('SELECT id FROM Orders');
  console.log('All IDs:', all.map(r => r.id || '(null)').join(', '));
  await c.end();
}
t().catch(e => console.log('ERR', e.message));
