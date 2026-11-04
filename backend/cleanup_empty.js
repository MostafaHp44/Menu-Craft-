const mysql = require('mysql2/promise');
async function t() {
  const c = await mysql.createConnection({ host: '127.0.0.1', port: 3306, user: 'root', password: '', database: 'menucraft_mysql' });
  await c.execute("DELETE FROM Orders WHERE id = ''");
  await c.execute("DELETE FROM OrderLines WHERE order_id = ''");
  const [r] = await c.execute('SELECT COUNT(*) AS c FROM Orders');
  console.log('Remaining Orders:', r[0].c);
  await c.end();
}
t().catch(e => { console.log('ERR', e.message); process.exit(1); });
