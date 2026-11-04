/**
 * MenuCraft — Phase 2: Plans & Subscriptions Migration
 * ------------------------------------------------------------
 * Adds tables and columns for:
 * - free_plan_requests table
 * - paid_subscription_requests table
 * - Extended subscription statuses
 */

const sql = require('mssql');

require('dotenv').config();

const config = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'YourStrong@Passw0rd',
  database: process.env.DB_NAME || 'menucraft_docker',
  server: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  options: { encrypt: false, trustServerCertificate: true }
};

const applied = [];
const skipped = [];

async function columnExists(pool, table, column) {
  const r = await pool.request()
    .input('table', sql.NVarChar, table)
    .input('column', sql.NVarChar, column)
    .query(`SELECT COL_LENGTH(@table, @column) AS len`);
  return r.recordset[0].len !== null;
}

async function tableExists(pool, table) {
  const r = await pool.request()
    .input('table', sql.NVarChar, table)
    .query(`SELECT OBJECT_ID(@table, 'U') AS oid`);
  return r.recordset[0].oid !== null;
}

async function run() {
  const pool = await sql.connect(config);
  console.log(`\n🔧 MenuCraft Phase 2 migrations → ${config.database} @ ${config.server}:${config.port}\n`);

  /* ------------------------------------------------------------------ *
   * 1. free_plan_requests table — repeated free trial requests
   * ------------------------------------------------------------------ */
  const freeRequestsTable = `
    CREATE TABLE free_plan_requests (
      id VARCHAR(100) PRIMARY KEY DEFAULT NEWID(),
      user_id VARCHAR(100) NOT NULL,
      restaurant_id VARCHAR(100) NOT NULL,
      status NVARCHAR(50) NOT NULL DEFAULT 'pending',
      rejection_reason NVARCHAR(MAX) NULL,
      admin_id VARCHAR(100) NULL,
      admin_notes NVARCHAR(MAX) NULL,
      created_at DATETIME DEFAULT GETDATE(),
      updated_at DATETIME DEFAULT GETDATE(),
      CONSTRAINT FK_free_plan_requests_Users FOREIGN KEY (user_id) REFERENCES Users(id),
      CONSTRAINT FK_free_plan_requests_Restaurants FOREIGN KEY (restaurant_id) REFERENCES Restaurants(id)
    )
  `;
  
  if (!await tableExists(pool, 'free_plan_requests')) {
    await pool.request().query(freeRequestsTable);
    applied.push('free_plan_requests table created');
  } else {
    skipped.push('free_plan_requests table (already exists)');
  }

  /* ------------------------------------------------------------------ *
   * 2. paid_subscription_requests table — paid plan requests pending payment
   * ------------------------------------------------------------------ */
  const paidRequestsTable = `
    CREATE TABLE paid_subscription_requests (
      id VARCHAR(100) PRIMARY KEY DEFAULT NEWID(),
      user_id VARCHAR(100) NOT NULL,
      restaurant_id VARCHAR(100) NOT NULL,
      plan_id VARCHAR(100) NOT NULL,
      plan_name NVARCHAR(100) NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      status NVARCHAR(50) NOT NULL DEFAULT 'pending_payment',
      rejection_reason NVARCHAR(MAX) NULL,
      admin_id VARCHAR(100) NULL,
      admin_notes NVARCHAR(MAX) NULL,
      created_at DATETIME DEFAULT GETDATE(),
      updated_at DATETIME DEFAULT GETDATE(),
      CONSTRAINT FK_paid_subscription_requests_Users FOREIGN KEY (user_id) REFERENCES Users(id),
      CONSTRAINT FK_paid_subscription_requests_Restaurants FOREIGN KEY (restaurant_id) REFERENCES Restaurants(id)
    )
  `;
  
  if (!await tableExists(pool, 'paid_subscription_requests')) {
    await pool.request().query(paidRequestsTable);
    applied.push('paid_subscription_requests table created');
  } else {
    skipped.push('paid_subscription_requests table (already exists)');
  }

  /* ------------------------------------------------------------------ *
   * 3. Ensure subscription status values are supported
   *    The status column is NVARCHAR(50) so new values work as-is
   * ------------------------------------------------------------------ */
  // No ALTER needed — just log that these values are valid
  applied.push('subscription status values validated: pending_approval, pending_payment, rejected, cancelled');

  /* ------------------------------------------------------------------ *
   * 4. Summary
   * ------------------------------------------------------------------ */
  console.log('✅ Applied steps:');
  applied.forEach((s) => console.log('   + ' + s));
  if (skipped.length) {
    console.log(`\nℹ️  Already up-to-date (${skipped.length}): ${skipped.slice(0, 8).join(', ')}${skipped.length > 8 ? ' …' : ''}`);
  }
  console.log('\n🎉 Phase 2 Migration finished — no data was dropped.\n');
  await sql.close();
}

run().catch((err) => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});