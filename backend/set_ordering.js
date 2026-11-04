const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  const ordering = JSON.stringify({
    enabled: true,
    fulfillment: { delivery: true, pickup: true },
    deliveryFee: 0,
    minOrder: 0,
    currency: 'USD',
    promo: null,
    paymentMethods: {
      cash: { enabled: true },
      cash_at_pickup: { enabled: true },
      card: { enabled: true },
      wallet: { enabled: true },
      bank_transfer: { enabled: false, instructions: '' }
    }
  });
  await p.request()
    .input('id', sql.NVarChar, 'rest-1793437631499-27bf0')
    .input('ordering', sql.NVarChar, ordering)
    .query("UPDATE Restaurants SET ordering = @ordering WHERE id = @id");
  const r = await p.request().query("SELECT slug,ordering FROM Restaurants WHERE id='rest-1793437631499-27bf0'");
  console.log('updated', r.recordset[0]);
  await p.close();
})();
