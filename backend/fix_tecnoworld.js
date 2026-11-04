const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  const tx = new sql.Transaction(p);
  await tx.begin();
  try {
    // Fix tecnoworld (rest-1793398912519-wd0jb) to be TecnoWorld, not Bella
    await new sql.Request(tx).input('id', sql.NVarChar, 'rest-1793398912519-wd0jb').query(`UPDATE Restaurants SET name_en = 'TecnoWorld', slug = 'tecnoworld', tagline_en = 'Tech-driven dining experience', description_en = 'Modern restaurant with technology-focused service, digital menus, and innovative dishes.', templateId = 'urban-cafe', design = '{"colors":{"primary":"#2A7AEF","secondary":"#E8F0FE","accent":"#FF6B00"}}', heroImage = '/images/hero/tecno.jpg', gallery = '["/images/gallery/tecno1.jpg","/images/gallery/tecno2.jpg"]', hours = '[{"day":"Mon - Fri","open":"11:00","close":"23:00"},{"day":"Sat - Sun","open":"12:00","close":"00:00"}]', language = 'en', published_menu = '[{"id":"cat-tec-1","name":"Tech Plates","note":"","items":[{"id":"item-tec-1","name":"Digital Burger","description":"Interactive burger with tech toppings","price":15,"image":"/images/food/burger.jpg","featured":true,"available":true}]}]', menu = '[{"id":"cat-tec-1","name":"Tech Plates","note":"","items":[{"id":"item-tec-1","name":"Digital Burger","description":"Interactive burger with tech toppings","price":15,"image":"/images/food/burger.jpg","featured":true,"available":true}]}]', status = 'published', ordering = '{"enabled":true,"fulfillment":{"delivery":true,"pickup":true},"deliveryFee":0,"minOrder":0,"currency":"USD","promo":null,"paymentMethods":{"cash":{"enabled":true},"card":{"enabled":true}}}' WHERE id = @id`);
    console.log('TecnoWorld fixture updated');
    await tx.commit();
  } catch (e) { await tx.rollback(); console.error('FAIL', e.message); }
  await p.close();
})();
