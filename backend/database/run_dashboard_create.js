const sql = require('mssql');
require('dotenv').config({path:'../.env'});
const cfg = {user:process.env.DB_USER||'sa',password:process.env.DB_PASSWORD||'YourStrong@Passw0rd',database:process.env.DB_NAME||'menucraft_docker',server:process.env.DB_HOST||'localhost',port:parseInt(process.env.DB_PORT,10)||1433,options:{encrypt:false,trustServerCertificate:true}};
const fs = require('fs');
(async()=>{
  await sql.connect(cfg);
  const pool = await sql.connect(cfg);
  const stmt = fs.readFileSync(__dirname + '/create_dashboard_themes.sql', 'utf8');
  try { await pool.request().query(stmt); console.log('DashboardThemes OK'); } catch(e) { console.log('DashboardThemes error:', e.message); }
  await sql.close();
})();
