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
  const tables = await p.request().query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME IN ('DashboardThemes','Branches')");
  console.log('TABLES', tables.recordset);
  const cols = await p.request().query("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'DashboardThemes' ORDER BY ORDINAL_POSITION");
  console.log('DashboardThemes COLUMNS', cols.recordset);
  await sql.close();
})().catch((e) => {
  console.log('ERR', e.message);
  process.exit(1);
});
