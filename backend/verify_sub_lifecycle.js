const sql = require('mssql');
const crypto = require('crypto');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });

  // 1) Test valid restaurant + plan trial (insert a new sub with trial)
  const rid = 'rest-1793398912519-wd0jb'; // TecnoWorld - real restaurant
  const newSubId = crypto.randomUUID();
  await p.request().input('id', sql.NVarChar, newSubId).input('rid', sql.NVarChar, rid).input('plan_id', sql.NVarChar, '0').input('plan_name', sql.NVarChar, 'Trial').input('plan', sql.NVarChar, 'trial').input('price', sql.Decimal(12,2), 0).input('status', sql.NVarChar, 'trialing').input('started_at', sql.DateTime, new Date()).input('renews_at', sql.DateTime, new Date()).input('auto_renew', sql.Bit, 0).query(`INSERT INTO Subscriptions (id, user_id, restaurant_id, plan_id, plan_name, [plan], price, status, started_at, renews_at, auto_renew, created_at, updated_at) VALUES (@id,@rid,@plan_id,@plan_name,@plan,@price,@status,@started_at,@renews_at,@auto_renew,GETDATE(),GETDATE())`);
  console.log('Created trial sub:', newSubId);

  // 2) Read back
  const read = await p.request().input('id', sql.NVarChar, newSubId).query(`SELECT id, restaurant_id, plan_name, status, started_at, renews_at FROM Subscriptions WHERE id=@id`);
  console.log('Read sub:', read.recordset[0]);

  // 3) Renew: extend renews_at
  await p.request().input('id', sql.NVarChar, newSubId).input('renewsAt', sql.DateTime, new Date(Date.now() + 1000*60*60*24*30)).query(`UPDATE Subscriptions SET renews_at = @renewsAt, updated_at=GETDATE() WHERE id=@id`);
  const renewed = await p.request().input('id', sql.NVarChar, newSubId).input('renewsAt', sql.DateTime, new Date(Date.now() + 1000*60*60*24*30)).query(`SELECT renews_at FROM Subscriptions WHERE id=@id`);
  console.log('Renewed renews_at:', renewed.recordset[0]?.renews_at);

  // 4) FK test: try to insert sub referencing nonexistent restaurant 'rest-0000-0000'
  try {
    await p.request().input('id', sql.NVarChar, crypto.randomUUID()).input('rid', sql.NVarChar, 'nonexistent-rest-fk-test').input('plan_id', sql.NVarChar, '0').query(`INSERT INTO Subscriptions (id, user_id, restaurant_id, plan_id, plan_name, [plan], price, status, started_at, renews_at, auto_renew) VALUES (@id,@rid,@plan_id,'0','Trial','trial',0,'active',GETDATE(),GETDATE(),0)`);
    console.log('FK test: INSERT SUCCEEDED (FK violated? unexpected)');
  } catch (e) {
    console.log('FK test: blocked as expected —', e.message.substring(0,80));
  }

  // 5) Check existing inactive subs with bad restaurant (restore status of our own from step 3)
  await p.request().input('id', sql.NVarChar, newSubId).input('status', sql.NVarChar, 'active').query(`UPDATE Subscriptions SET status='active', updated_at=GETDATE() WHERE id=@id`);
  console.log('Set to active');

  // 6) List all active subscriptions
  const list = await p.request().query(`SELECT restaurant_id, plan_name, status FROM Subscriptions WHERE status IN ('active','trialing')`);
  console.log('Active subs count:', list.recordset.length);

  // Cleanup: delete only our test sub
  await p.request().input('id', sql.NVarChar, newSubId).query(`DELETE FROM Subscriptions WHERE id=@id`);
  console.log('Cleaned up test sub:', newSubId);
  await p.close();
})();
