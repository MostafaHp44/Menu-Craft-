const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  const ids = [
    'ord-mw11waxb-0dfc6701',
    'ord-mw11x479-1793e608',
    'ord-mw11xanx-76e9548f'
  ];
  // Delete OrderLines for these orders first (FK FK_OrderLines_Orders)
  for (const id of ids) {
    const res = await p.request().input('id', sql.NVarChar, id).query('DELETE FROM OrderLines WHERE order_id = @id');
    console.log('Deleted OrderLines for', id, ':', res.rowsAffected[0]);
  }
  console.log('Deleted OrderLines for:', ids);
  // Delete the test orders
  for (const id of ids) {
    const res = await p.request().input('id', sql.NVarChar, id).query('DELETE FROM Orders WHERE id = @id');
    console.log('Deleted Orders for', id, ':', res.rowsAffected[0]);
  }
  console.log('Deleted Orders:', ids);
  await p.close();
})();
