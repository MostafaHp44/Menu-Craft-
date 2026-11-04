const sql = require('mssql');
const config = { user: 'sa', password: 'YourStrong@Passw0rd', database: 'menucraft_docker', server: 'localhost', port: 1433, options: { encrypt: false, trustServerCertificate: true } };

(async () => {
  let p;
  try {
    p = await sql.connect(config);
    console.log('=== PHASE A.2 STEP 1B — READ-ONLY VERIFICATION ===');
    console.log('DB:', config.database);

    // 1. Columns + type + length (20 bytes = 10 chars NVARCHAR)
    const cols = await p.query(`SELECT t.name AS table_name, c.name AS column_name, ty.name AS data_type, c.max_length FROM sys.columns c JOIN sys.tables t ON c.object_id = t.object_id JOIN sys.types ty ON c.user_type_id = ty.user_type_id WHERE t.name IN ('MenuItems','MenuCategories') AND c.name = 'source_lang'`);
    console.log('1) Columns present:');
    for (const r of cols.recordset) console.log('   ', r.table_name, '.', r.column_name, '|', r.data_type, '| max_length=', r.max_length, '(20 bytes => NVARCHAR(10))');

    // 3. Total counts
    const tot = await p.query(`SELECT (SELECT COUNT(*) FROM dbo.MenuItems) AS items_total, (SELECT COUNT(*) FROM dbo.MenuCategories) AS categories_total`);
    console.log('3) Total records:', tot.recordset[0]);

    // 4. NULL counts
    const nul = await p.query(`SELECT (SELECT COUNT(*) FROM dbo.MenuItems WHERE source_lang IS NULL) AS items_null, (SELECT COUNT(*) FROM dbo.MenuCategories WHERE source_lang IS NULL) AS categories_null`);
    console.log('5) source_lang IS NULL counts:', nul.recordset[0]);

    // 6. Restaurants.language distribution
    const dist = await p.query(`SELECT language, COUNT(*) AS cnt FROM dbo.Restaurants GROUP BY language`);
    console.log('6) Restaurants.language distribution:', dist.recordset);

    // Confirm nullability via INFORMATION_SCHEMA
    const nullChk = await p.query(`SELECT TABLE_NAME, COLUMN_NAME, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME IN ('MenuItems','MenuCategories') AND COLUMN_NAME = 'source_lang'`);
    console.log('2/4) Nullability:', nullChk.recordset);

    await p.close();
    console.log('Verification complete. READ-ONLY. No updates executed.');
  } catch (e) {
    console.error('Error:', e.message || e);
    if (p) await p.close();
  }
})();
