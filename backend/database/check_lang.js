const sql = require('mssql');
require('dotenv').config();
(async () => {
  const p = await sql.connect({user:process.env.DB_USER||'sa',password:process.env.DB_PASSWORD||'YourStrong@Passw0rd',server:process.env.DB_HOST||'localhost',port:parseInt(process.env.DB_PORT,10)||1433,database:process.env.DB_NAME||'menucraft_docker',options:{encrypt:false,trustServerCertificate:true}});
  try {
    const r = await p.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Restaurants' AND COLUMN_NAME='language'");
    console.log('language column exists:', r.recordset.length > 0 ? 'YES' : 'NO');
    if (r.recordset.length === 0) {
      await p.request().query("ALTER TABLE Restaurants ADD language NVARCHAR(10) NULL DEFAULT 'ar'");
      console.log('ADDED language column');
    }
  } catch(e) { console.log('ERR:', e.message); }
  await sql.close();
})();
