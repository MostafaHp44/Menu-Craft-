const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({host:'localhost',port:3306,user:'root',password:'',database:'menucraft_mysql'});
  try {
    // Step 1: Count all restaurants and current menu lengths
    const [counts] = await c.query("SELECT id, slug, name_en, JSON_LENGTH(published_menu) as published_len, JSON_LENGTH(draft_menu) as draft_len FROM restaurants");
    console.log('BEFORE:', JSON.stringify(counts, null, 2));

    // Step 2: Clear published_menu and draft_menu for ALL restaurants
    await c.execute("UPDATE restaurants SET published_menu = '[]', draft_menu = '[]', updated_at = NOW()");

    // Step 3: Verify
    const [after] = await c.query("SELECT id, slug, name_en, published_menu, draft_menu FROM restaurants");
    console.log('AFTER:', JSON.stringify(after, null, 2));

    c.end();
  } catch(e) { console.log('ERR:', e.message); }
})();
