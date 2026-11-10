const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({host:'localhost',port:3306,user:'root',password:'',database:'menucraft_mysql'});
  try {
    const [users] = await c.query("SELECT id, name, email, role, status FROM users WHERE email = 'sarac@yahoo.com'");
    console.log('SARAC:', JSON.stringify(users, null, 2));
    
    const [all] = await c.query("SELECT id, name, email, role, status FROM users ORDER BY role, email");
    console.log('ALL USERS:', JSON.stringify(all, null, 2));
  } catch(e) { console.log('ERR:', e.message); }
  c.end();
})();
