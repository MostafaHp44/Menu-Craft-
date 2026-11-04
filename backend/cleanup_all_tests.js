const mysql = require('mysql2/promise');
async function t() {
  const c = await mysql.createConnection({ host: '127.0.0.1', port: 3306, user: 'root', password: '', database: 'menucraft_mysql' });
  await c.execute("DELETE FROM OrderLines WHERE order_id IN (?, ?)", ['dbg-id-1', 'ord-mw1e2dq7-aba61568']);
  await c.execute("DELETE FROM Orders WHERE id IN (?, ?)", ['dbg-id-1', 'ord-mw1e2dq7-aba61568']);
  const [r] = await c.execute('SELECT COUNT(*) AS c FROM Orders');
  console.log('Remaining Orders after cleanup:', r[0].c);
  await c.end();
}
t();
