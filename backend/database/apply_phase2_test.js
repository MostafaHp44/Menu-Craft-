/**
 * Apply Phase 2 migration to approved test DB only.
 * Split on GO and execute each statement separately via query requests.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const sql = require('mssql');
const fs = require('fs');

const config = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'YourStrong@Passw0rd',
  server: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  database: 'menucraft_tests_docker_2b1', // APPROVED TEST DB ONLY
  options: { encrypt: false, trustServerCertificate: true }
};

async function apply() {
  try {
    await sql.connect(config);
    const script = fs.readFileSync(require('path').join(__dirname, 'migrate_phase2_branches.sql'), 'utf8');
    // Split on GO lines (sql server batch terminators)
    const statements = script.split(/^\s*GO/im).map(s => s.trim()).filter(Boolean);
    for (const stmt of statements) {
      await sql.connect(config).then(() => sql.close()).then(() => sql.connect(config).then((pool) => pool.request().query(stmt)));
    }
    console.log('Phase 2 migration applied successfully to menucraft_tests_docker_2b1');
  } catch (err) {
    console.error('Migration result:', err.message || 'DB not reachable');
  } finally {
    await sql.close();
  }
}

apply();
