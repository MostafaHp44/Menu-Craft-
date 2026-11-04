const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  const tx = new sql.Transaction(p);
  await tx.begin();
  try {
    // Fixture fix for api-test-rest only
    await new sql.Request(tx).input('id', sql.NVarChar, 'rest-1793437631499-27bf0').query(`UPDATE Restaurants SET templateId = 'urban-cafe', design = '{"colors":{"primary":"#E8571F","secondary":"#F5A623","accent":"#2A2A2A"}}', heroImage = '/images/hero/default-restaurant.jpg', gallery = '["/images/gallery/1.jpg"]', hours = '[{"day":"Mon","open":"10:00","close":"22:00"}]', language = 'en' WHERE id = @id`);
    // Ensure published_menu is non-empty and linked items exist via JSON (already present)
    console.log('Fixture updated');
    await tx.commit();
  } catch (e) {
    await tx.rollback();
    console.error(e.message);
  }
  await p.close();
})();
