const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  const r = await p.request().query("SELECT slug,status,ordering,templateId FROM Restaurants WHERE status='published'");
  console.log('published:');
  for (const x of r.recordset) console.log(`  ${x.slug}: ordering=${!!x.ordering} template=${x.templateId}`);
  console.log('--- branches ---');
  const b = await p.request().query("SELECT restaurant_id, name_en, accepting_orders FROM Branches");
  console.log(b.recordset.map(x => `  ${x.restaurant_id.slice(-4)} @ ${x.name_en} accepting=${x.accepting_orders}`).join('\n'));
  await p.close();
})();
