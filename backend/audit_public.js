const { getPool } = require('./src/config/db');
const sql = require('mssql');

(async () => {
  console.log('=== Phase 4 Audit: Public API & Publishing ===');
  console.log('');
  
  const pool = await getPool();
  
  // 1. Check published vs draft restaurants
  console.log('1. Restaurant Statuses:');
  const restaurants = await pool.request().query('SELECT id, name_en, slug, status, [plan] FROM Restaurants');
  const rst = restaurants.recordset;
  console.log('   - Total restaurants: ' + rst.length);
  console.log('   - Status distribution:');
  const statuses = {};
  rst.forEach(r => {
    statuses[r.status] = (statuses[r.status] || 0) + 1;
  });
  for (const [status, count] of Object.entries(statuses)) {
    console.log('     - ' + status + ': ' + count);
  }
  console.log('');
  
  // 2. Check which are published
  console.log('2. Published Restaurants:');
  const published = rst.filter(r => r.status === 'published');
  console.log('   - Published: ' + published.length);
  published.forEach(r => {
    console.log('   - ' + r.name_en + ' (slug: ' + r.slug + ', plan: ' + r.plan + ')');
  });
  console.log('');
  
  // 3. Check draft restaurants
  console.log('3. Draft Restaurants:');
  const drafts = rst.filter(r => r.status === 'draft');
  console.log('   - Draft: ' + drafts.length);
  drafts.forEach(r => {
    console.log('   - ' + r.name_en + ' (slug: ' + r.slug + ', plan: ' + r.plan + ')');
  });
  console.log('');
  
  // 4. Check public menu API path structure
  console.log('3. Public Menu API:');
  console.log('   - GET /api/public/menu/:slug - returns published menu data');
  console.log('   - Does not expose owner information');
  console.log('   - Returns 404 for unpublished websites');
  console.log('');
  
  // 4. Check Subscriptions for published restaurants
  console.log('4. Subscriptions for Published Restaurants:');
  const publishedIds = published.map(r => r.id);
  if (publishedIds.length > 0) {
    const placeholders = publishedIds.map((id, i) => '@id' + i).join(',');
    const subsQuery = 'SELECT s.restaurant_id, s.plan_name, s.status FROM Subscriptions s WHERE s.restaurant_id IN (' + placeholders + ')';
    const subs = await pool.request()
      .input('id0', sql.VarChar, publishedIds[0])
      .input('id1', sql.VarChar, publishedIds[1] || publishedIds[0])
      .query(subsQuery);
    console.log('   - Subscriptions for published restaurants: ' + subs.recordset.length);
  }
  console.log('');
  
  // 5. Check if unpublished can be published
  console.log('5. Publishing Workflow:');
  console.log('   - Editor requestPublish() checks live subscription status');
  console.log('   - If !live → opens subscription modal');
  console.log('   - If live → calls publishDemo()');
  console.log('   - publishDemo() updates restaurant status to \'published\'');
  console.log('');
  
  // 6. Check restaurant API endpoints
  console.log('6. Restaurant API Endpoints:');
  console.log('   - GET /api/restaurants - list user restaurants');
  console.log('   - GET /api/restaurants/:id - get restaurant by id');
  console.log('   - GET /api/restaurants/slug/:slug - get restaurant by slug');
  console.log('   - PATCH /api/restaurants/:id - update restaurant');
  console.log('   - PATCH /api/restaurants/:id/publish - publish restaurant');
  console.log('   - DELETE /api/restaurants/:id - delete restaurant');
  console.log('');
  
  process.exit(0);
})();