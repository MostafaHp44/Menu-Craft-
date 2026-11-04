const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  const ordering = JSON.stringify({ enabled: true, fulfillment: { delivery: true, pickup: true }, deliveryFee: 0, minOrder: 0, currency: 'USD', promo: null, paymentMethods: { cash: { enabled: true }, cash_at_pickup: { enabled: true }, card: { enabled: true }, wallet: { enabled: true }, bank_transfer: { enabled: false, instructions: '' } } });
  // Config for bella and copperkettle
  for (const slug of ['bella', 'copperkettle']) {
    const r = await p.request().input('slug', sql.NVarChar, slug).query("SELECT id FROM Restaurants WHERE slug=@slug");
    if (r.recordset[0]) {
      await p.request().input('id', sql.NVarChar, r.recordset[0].id).input('ordering', sql.NVarChar, ordering).query("UPDATE Restaurants SET ordering = @ordering WHERE id = @id");
      console.log('configured', slug, r.recordset[0].id);
    }
  }
  await p.close();
})();
