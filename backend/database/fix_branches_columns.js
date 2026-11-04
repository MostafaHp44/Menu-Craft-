const sql = require('mssql');
require('dotenv').config();
const cfg = {user:process.env.DB_USER||'sa',password:process.env.DB_PASSWORD||'YourStrong@Passw0rd',server:process.env.DB_HOST||'localhost',port:parseInt(process.env.DB_PORT,10)||1433,database:process.env.DB_NAME||'menucraft_docker',options:{encrypt:false,trustServerCertificate:true}};
(async()=>{
  await sql.connect(cfg); const p = await sql.connect(cfg);
  const cols = [
    ['name_en','NVARCHAR(200) NULL'],
    ['name_ar','NVARCHAR(200) NULL'],
    ['name_ku','NVARCHAR(200) NULL'],
    ['opening_hours','NVARCHAR(MAX) NULL']
  ];
  for (const [col, def] of cols) {
    try {
      await p.request().query(`IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Branches' AND COLUMN_NAME='${col}') ALTER TABLE Branches ADD ${col} ${def}`);
      console.log(`OK: ${col}`);
    } catch(e) { console.log(`ERR ${col}: ${e.message}`); }
  }
  // backfill name_en from name if empty
  try { await p.request().query("UPDATE Branches SET name_en = name WHERE name_en IS NULL"); console.log('backfilled name_en'); } catch(e){ console.log('backfill err', e.message); }
  const r = await p.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Branches' ORDER BY ORDINAL_POSITION");
  console.log('FINAL columns:', r.recordset.map(x=>x.COLUMN_NAME).join(', '));
  await sql.close();
})();
