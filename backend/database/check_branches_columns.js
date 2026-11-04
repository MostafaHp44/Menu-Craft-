const sql = require('mssql');
require('dotenv').config();
const cfg = {user:process.env.DB_USER||'sa',password:process.env.DB_PASSWORD||'YourStrong@Passw0rd',server:process.env.DB_HOST||'localhost',port:parseInt(process.env.DB_PORT,10)||1433,database:process.env.DB_NAME||'menucraft_docker',options:{encrypt:false,trustServerCertificate:true}};
(async()=>{
  await sql.connect(cfg); const p = await sql.connect(cfg);
  const r = await p.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Branches' ORDER BY ORDINAL_POSITION");
  console.log('Branches columns:', r.recordset.map(x=>x.COLUMN_NAME).join(', '));
  await sql.close();
})();
