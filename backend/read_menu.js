const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  const r = await p.request().input('id', sql.NVarChar, 'rest-1793437631499-27bf0').query('SELECT published_menu FROM Restaurants WHERE id=@id');
  console.log(r.recordset[0].published_menu);
  await p.close();
})();
