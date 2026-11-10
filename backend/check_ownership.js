const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({host:'localhost',port:3306,user:'root',password:'',database:'menucraft_mysql'});
  try {
    const [rests] = await c.query("SELECT id, slug, status, name_en FROM restaurants WHERE slug = 'bella'");
    console.log('BELLA:', JSON.stringify(rests, null, 2));
    
    const bellaId = rests[0]?.id;
    const [owners] = await c.query("SELECT user_id, restaurant_id, is_owner FROM userrestaurants WHERE restaurant_id = ?", [bellaId]);
    console.log('OWNERS (UserRestaurants):', JSON.stringify(owners, null, 2));

    const [users] = await c.query("SELECT id, email, role, restaurant_id, status FROM users WHERE email = ?", ['owner@bella.test']);
    console.log('OWNER (Users):', JSON.stringify(users, null, 2));

    const [pub] = await c.query("SELECT JSON_LENGTH(published_menu) as pub_len, JSON_LENGTH(draft_menu) as draft_len FROM restaurants WHERE id = ?", [bellaId]);
    console.log('MENU LENGTHS:', JSON.stringify(pub, null, 2));
    c.end();
  } catch(e) { console.log('ERR:', e.message); }
})();
