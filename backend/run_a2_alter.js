const sql = require('mssql');
const config = { user: 'sa', password: 'YourStrong@Passw0rd', database: 'menucraft_docker', server: 'localhost', port: 1433, options: { encrypt: false, trustServerCertificate: true } };

(async () => {
  let p;
  try {
    p = await sql.connect(config);
    console.log('DB:', config.database);

    const r1 = await p.query("SELECT OBJECT_ID('dbo.MenuItems','U') AS oid");
    const r2 = await p.query("SELECT OBJECT_ID('dbo.MenuCategories','U') AS oid");
    console.log('MenuItems exists:', r1.recordset[0].oid ? 'YES' : 'NO');
    console.log('MenuCategories exists:', r2.recordset[0].oid ? 'YES' : 'NO');

    const c1 = await p.query("SELECT COL_LENGTH('dbo.MenuItems','source_lang') AS len");
    const c2 = await p.query("SELECT COL_LENGTH('dbo.MenuCategories','source_lang') AS len");
    console.log('Before ALTER — MenuItems.source_lang len:', c1.recordset[0].len);
    console.log('Before ALTER — MenuCategories.source_lang len:', c2.recordset[0].len);

    if (c1.recordset[0].len === null) {
      await p.query("ALTER TABLE [dbo].[MenuItems] ADD [source_lang] NVARCHAR(10) NULL");
      console.log('ALTER EXECUTED: dbo.MenuItems.source_lang (NVARCHAR(10) NULL)');
    } else {
      console.log('SKIPPED: dbo.MenuItems.source_lang already exists');
    }

    if (c2.recordset[0].len === null) {
      await p.query("ALTER TABLE [dbo].[MenuCategories] ADD [source_lang] NVARCHAR(10) NULL");
      console.log('ALTER EXECUTED: dbo.MenuCategories.source_lang (NVARCHAR(10) NULL)');
    } else {
      console.log('SKIPPED: dbo.MenuCategories.source_lang already exists');
    }

    // read-only verification
    const v1 = await p.query("SELECT COL_LENGTH('dbo.MenuItems','source_lang') AS len");
    const v2 = await p.query("SELECT COL_LENGTH('dbo.MenuCategories','source_lang') AS len");
    console.log('After ALTER — MenuItems.source_lang len:', v1.recordset[0].len);
    console.log('After ALTER — MenuCategories.source_lang len:', v2.recordset[0].len);

    await p.close();
    console.log('Connection closed safely.');
    console.log('No UPDATE/INSERT/DELETE/DROP executed.');
  } catch (e) {
    console.error('Error:', e.message || e);
    if (p) await p.close();
  }
})();
