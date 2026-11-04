require('dotenv').config();
const sql = require('mssql');
const cfg = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'YourStrong@Passw0rd',
  server: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  database: process.env.DB_NAME || 'menucraft_docker',
  options: { encrypt: false, trustServerCertificate: true },
};
(async () => {
  const p = await sql.connect(cfg);
  const r = await p.request().query('SELECT id, name_en, slug FROM Restaurants ORDER BY created_at DESC');
  console.log('RESTAURANTS', r.recordset.length);
  console.log(JSON.stringify(r.recordset.slice(0, 10), null, 1));
  const u = await p.request().query('SELECT TOP 10 id, email, role, restaurant_id FROM Users ORDER BY created_at DESC');
  console.log('USERS', JSON.stringify(u.recordset, null, 1));
  await sql.close();
})().catch((e) => {
  console.log('ERR', e.message);
  process.exit(1);
});
