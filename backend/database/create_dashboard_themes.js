/**
 * Idempotent creation of DashboardThemes — dashboard-only visual identity,
 * stored independently from restaurant templates.
 */
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
  const pool = await sql.connect(cfg);
  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'DashboardThemes')
    BEGIN
      CREATE TABLE DashboardThemes (
        restaurant_id NVARCHAR(100) NOT NULL PRIMARY KEY,
        theme_json NVARCHAR(MAX) NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
      )
    END
  `);
  const r = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'DashboardThemes' ORDER BY ORDINAL_POSITION");
  console.log('DashboardThemes columns:', r.recordset.map((x) => x.COLUMN_NAME).join(', '));
  await sql.close();
})().catch((e) => {
  console.log('ERR', e.message);
  process.exit(1);
});
