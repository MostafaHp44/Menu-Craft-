/**
 * Phase A.2 — Source Language Migration (Hybrid C) — HARDENED
 * READ-ONLY PREPARATION; DO NOT EXECUTE without explicit authorization.
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

async function columnExists(pool, table, column) {
  const r = await pool.request()
    .input('table', sql.NVarChar, table)
    .input('column', sql.NVarChar, column)
    .query(`SELECT COL_LENGTH(@table, @column) AS len`);
  return r.recordset[0].len !== null;
}

async function tableExists(pool, schemaName, tableName) {
  const r = await pool.request()
    .input('table', sql.NVarChar, tableName)
    .query(`SELECT OBJECT_ID('${schemaName}.${tableName}', 'U') AS oid`);
  return r.recordset[0].oid !== null;
}

async function addColumn(pool, schemaName, table, column, definition, logName) {
  const full = `${schemaName}.${table}`;
  if (!(await tableExists(pool, schemaName, table))) {
    console.log(`⏭ SKIPPED: ${full}.${column} (table missing)`);
    return false;
  }
  if (await columnExists(pool, full, column)) {
    console.log(`⏭ SKIPPED: ${full}.${column} (already exists)`);
    return false;
  }
  await pool.request().query(`ALTER TABLE [${schemaName}].[${table}] ADD [${column}] ${definition}`);
  console.log(`✅ ADDED: ${full}.${column}`);
  return true;
}

async function run() {
  let pool;
  try {
    pool = await sql.connect(config);
    console.log(`\n🔧 Phase A.2 — Source Language Migration → ${config.database}@${config.server}:${config.port}`);
    console.log('⚠  READ-ONLY PREPARATION. No destructive actions.\n');

    await addColumn(pool, 'dbo', 'MenuItems', 'source_lang', 'NVARCHAR(10) NULL', 'MenuItems.source_lang');
    await addColumn(pool, 'dbo', 'MenuCategories', 'source_lang', 'NVARCHAR(10) NULL', 'MenuCategories.source_lang');

    console.log('\n📋 Backfill rules (not executed):');
    console.log('   - Only existing non-empty language columns determine source_lang.');
    console.log('   - If ambiguous (multiple non-empty): derive from Restaurants.language (verified).');
    console.log('   - If source_lang already non-NULL: do NOT overwrite.');
  } catch (err) {
    console.error('❌ Migration error:', err.message || err);
  } finally {
    if (pool && pool.connected) {
      await pool.close();
      console.log('🔌 Connection closed safely.');
    }
    console.log('✋ STOP — no ALTER executed unless EXECUTE_PHASE_A2=true set.');
  }
}

if (process.env.EXECUTE_PHASE_A2 === 'true') {
  run().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
} else {
  console.log('⏸ EXECUTION BLOCKED: set EXECUTE_PHASE_A2=true after authorization.');
  console.log('✋ Migration files hardened; do NOT execute yet.');
  process.exit(0);
}
