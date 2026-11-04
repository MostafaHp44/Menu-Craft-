const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  const total = await p.request().query('SELECT COUNT(*) AS cnt FROM Orders');
  console.log('Total Orders after delete:', total.recordset[0].cnt);
  const testIds = await p.request().query("SELECT id FROM Orders WHERE id IN ('ord-mw11waxb-0dfc6701','ord-mw11x479-1793e608','ord-mw11xanx-76e9548f')");
  console.log('Remaining test orders:', testIds.recordset.length);
  await p.close();
})();
