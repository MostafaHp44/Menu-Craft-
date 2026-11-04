const sql = require('mssql');
const http = require('http');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  const r = await p.request().query("SELECT id FROM Restaurants WHERE slug = 'api-test-rest'");
  const rid = r.recordset[0]?.id;
  console.log('restaurant id:', rid);

  // Count current orders
  const before = await p.request().query("SELECT COUNT(*) as c FROM Orders WHERE restaurant_id = '" + rid + "'");
  console.log('orders before:', before.recordset[0].c);

  const payload = JSON.stringify({
    restaurantId: rid,
    channel: 'online',
    customer: 'DB-Test-User',
    phone: '1234',
    address: 'Test Address',
    tableNo: null,
    note: 'Real DB submit test',
    lines: [{ name: 'Test Dish', price: 99, qty: 1, category: 'test' }]
  });

  const req = http.request({ hostname: '127.0.0.1', port: 3000, path: '/api/orders', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } }, (res) => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', async () => {
      console.log('POST status:', res.statusCode, 'body:', d.slice(0, 300));
      const after = await p.request().query("SELECT COUNT(*) as c FROM Orders WHERE restaurant_id = '" + rid + "'");
      console.log('orders after:', after.recordset[0].c);
      await p.close();
    });
  });
  req.write(payload);
  req.end();
})();
