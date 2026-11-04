const { getPool } = require('./src/config/db');
const { planLimitsFromRow, evaluateSiteLimit } = require('./src/config/plans');

(async () => {
  console.log('=== Phase 4 Audit: Subscription Security ===');
  console.log('');
  
  const pool = await getPool();
  
  // 1. Check current subscriptions
  console.log('1. Current Subscriptions:');
  const subs = await pool.request().query('SELECT s.*, p.max_restaurants, p.interval_type, p.name AS plan_name FROM Subscriptions s JOIN Plans p ON p.id = s.plan_id');
  console.log('   - ' + subs.recordset.length + ' total subscriptions');
  subs.recordset.forEach(sub => {
    console.log('   - Restaurant ' + sub.restaurant_id + ': ' + sub.plan_name + ' (' + sub.status + '), plan_restaurants=' + sub.max_restaurants);
  });
  console.log('');
  
  // 2. Check plan limits from Plans table
  console.log('2. Plan Limits:');
  const plans = await pool.request().query('SELECT * FROM Plans');
  plans.recordset.forEach(plan => {
    console.log('   - ' + plan.name + ': max_restaurants=' + plan.max_restaurants + ', interval=' + plan.interval_type);
  });
  console.log('');
  
  // 3. Check site counts per user
  console.log('3. Site Counts per User:');
  const users = await pool.request().query('SELECT id, name, email, restaurant_id FROM Users');
  const allUsers = users.recordset;
  for (const u of allUsers) {
    if (u.restaurant_id) {
      const siteCount = await pool.request()
        .input('userId', require('mssql').VarChar(100), u.id)
        .query('SELECT COUNT(*) AS cnt FROM UserRestaurants WHERE user_id = @userId');
      console.log('   - User ' + u.name + ' (' + u.id + '): ' + siteCount.recordset[0].cnt + ' websites');
    }
  }
  console.log('');
  
  // 4. Test assertCanCreateSite logic
  console.log('4. Site Creation Limit Check:');
  // Get subscription for Mostafa amine
  const subResult = await pool.request()
    .input('userId', require('mssql').VarChar(100), 'usr-1793353663215-gstnz')
    .query('SELECT s.*, p.max_restaurants, p.interval_type, p.name AS plan_name FROM Subscriptions s JOIN Plans p ON p.id = s.plan_id WHERE s.user_id = @userId');
  
  if (subResult.recordset.length > 0) {
    const sub = subResult.recordset[0];
    const limits = planLimitsFromRow({
      plan_id: sub.plan_id,
      plan_name: sub.plan_name,
      price: sub.price,
      interval_type: sub.interval_type,
      max_restaurants: sub.max_restaurants,
      max_menu_items: sub.max_menu_items,
      features: sub.features
    });
    console.log('   - User plan: ' + sub.plan_name);
    console.log('   - maxSites: ' + limits.maxSites + ' (' + (limits.maxSites === -1 ? 'Unlimited' : '') + ')');
    console.log('   - Current sites used: ' + (sub.max_restaurants || 0));
    
    // Test evaluateSiteLimit
    const used = 1; // assume 1 site
    const limitResult = evaluateSiteLimit(limits.maxSites, used);
    console.log('   - Can create site: ' + limitResult.canCreate);
    console.log('   - Over limit: ' + limitResult.overLimit);
    console.log('   - Remaining: ' + limitResult.remaining);
  }
  console.log('');
  
  // 5. Test trial eligibility
  console.log('5. Trial Eligibility:');
  const trialUsers = allUsers.filter(u => u.restaurant_id && u.role === 'client');
  console.log('   - Users with restaurant and client role: ' + trialUsers.length);
  for (const u of trialUsers) {
    const hasSub = await pool.request()
      .input('userId', require('mssql').VarChar(100), u.id)
      .query('SELECT TOP 1 id FROM Subscriptions WHERE user_id = @userId');
    console.log('   - User ' + u.name + ': has subscription=' + (hasSub.recordset.length > 0));
  }
  console.log('');
  
  // 6. Check expired/rejected/cancelled subscriptions
  console.log('6. Subscription Statuses:');
  const statuses = await pool.request().query('SELECT status, COUNT(*) AS cnt FROM Subscriptions GROUP BY status');
  statuses.recordset.forEach(s => {
    console.log('   - ' + s.status + ': ' + s.cnt + ' subscriptions');
  });
  console.log('');
  
  process.exit(0);
})();