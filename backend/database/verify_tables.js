const sql = require('mssql');
require('dotenv').config({path:'../.env'});
(async()=>{
  const cfg={user:process.env.DB_USER||'sa',password:process.env.DB_PASSWORD||'YourStrong@Passw0rd',server:process.env.DB_HOST||'localhost',port:parseInt(process.env.DB_PORT,10)||1433,database:process.env.DB_NAME||'menucraft_docker',options:{encrypt:false,trustServerCertificate:true}};
  try{await sql.connect(cfg); const p=await sql.connect(cfg); 
    const r=await p.request().query("SELECT OBJECT_ID('Branches','U') AS b, OBJECT_ID('Employees','U') AS e, OBJECT_ID('EmployeeBranchAccess','U') AS a, OBJECT_ID('DashboardThemes','U') AS d");
    console.log('TABLES:', r.recordset[0]);
    await sql.close();
  }catch(e){console.log('DB ERR:',e.message);}
})();
