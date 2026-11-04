const sql = require('mssql');
const fs = require('fs');
require('dotenv').config({ path: '../.env' });
const cfg = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'YourStrong@Passw0rd',
  server: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  database: process.env.DB_NAME || 'menucraft_docker',
  options: { encrypt: false, trustServerCertificate: true }
};

async function run() {
  try {
    const pool = await sql.connect(cfg);
    const script = fs.readFileSync(__dirname + '/migrate_phase2_branches.sql', 'utf8');
    // Execute statements individually (skip GO lines)
    const stmts = script.split(/^\s*GO\s*$/im).map(s => s.trim()).filter(s => s.length > 0 && !s.startsWith('--'));
    for (const stmt of stmts) {
      try {
        await pool.request().query(stmt);
      } catch (e) {
        if (e.message && e.message.includes('already exists')) {
          console.log('SKIPPED (exists): ' + stmt.substring(0, 60));
        } else {
          console.log('ERROR in statement:', e.message, '| snippet:', stmt.substring(0, 100));
        }
      }
    }
    console.log('Migration applied to:', cfg.database);
    await sql.close();
  } catch (e) {
    console.error('Migration blocked:', e.message);
  }
}
run();
