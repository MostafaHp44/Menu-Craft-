const { getPool } = require('./src/config/db');
const sql = require('mssql');

(async () => {
  console.log('=== Phase 4 Audit: Database Integrity ===');
  console.log('');
  
  const pool = await getPool();
  
  // 1. Check foreign keys using sys.foreign_keys
  console.log('1. Foreign Key Relationships:');
  const fks = await pool.request().query(`
    SELECT 
      OBJECT_NAME(f.parent_object_id) AS 'Table',
      NAME AS 'Constraint',
      COL_NAME(f.parent_object_id, c.column_id) AS 'Column',
      OBJECT_NAME(f.referenced_object_id) AS 'ReferencedTable',
      COL_NAME(f.referenced_object_id, c.referenced_column_id) AS 'ReferencedColumn'
    FROM sys.foreign_keys f
    JOIN sys.foreign_key_columns c ON f.object_id = c.constraint_object_id
    WHERE OBJECTPROPERTY(f.parent_object_id, 'IsUserTable') = 1
    ORDER BY OBJECT_NAME(f.parent_object_id), NAME
  `);
  console.log('   - ' + fks.recordset.length + ' foreign keys found:');
  const fkGroups = {};
  fks.recordset.forEach(fk => {
    const table = fk.Table;
    if (!fkGroups[table]) fkGroups[table] = [];
    fkGroups[table].push(fk);
  });
  for (const [table, fks] of Object.entries(fkGroups)) {
    console.log('     - ' + table + ': ' + fks.map(f => f.Constraint + '(' + f.Column + '->' + f.ReferencedTable + '.' + f.ReferencedColumn + ')').join(', '));
  }
  console.log('');
  
  // 2. Check UserRestaurants relationships
  console.log('2. UserRestaurants Integrity:');
  const urCheck = await pool.request().query(`
    SELECT ur.user_id, ur.restaurant_id, 
      CASE WHEN u.id IS NOT NULL THEN 'valid' ELSE 'orphaned_user' END AS user_status,
      CASE WHEN r.id IS NOT NULL THEN 'valid' ELSE 'orphaned_restaurant' END AS restaurant_status
    FROM UserRestaurants ur
    LEFT JOIN Users u ON ur.user_id = u.id
    LEFT JOIN Restaurants r ON ur.restaurant_id = r.id
  `);
  console.log('   - UserRestaurants entries with validity:');
  urCheck.recordset.forEach(row => {
    console.log('     - user ' + row.user_id + ' -> restaurant ' + row.restaurant_id + ': user=' + row.user_status + ', restaurant=' + row.restaurant_status);
  });
  console.log('');
  
  // 3. Check for orphaned records
  console.log('3. Orphaned Records:');
  // Orphaned subscriptions (subscriptions without valid restaurant)
  const orphanSubs = await pool.request().query(`
    SELECT s.id, s.restaurant_id, s.user_id
    FROM Subscriptions s
    LEFT JOIN Restaurants r ON s.restaurant_id = r.id
    WHERE r.id IS NULL
  `);
  console.log('   - Orphaned subscriptions (restaurant not found): ' + orphanSubs.recordset.length);
  
  // Orphaned payments
  const orphanPayments = await pool.request().query(`
    SELECT p.id, p.restaurant_id, p.subscription_id
    FROM Payments p
    LEFT JOIN Subscriptions s ON p.subscription_id = s.id
    WHERE s.id IS NULL
  `);
  console.log('   - Orphaned payments (subscription not found): ' + orphanPayments.recordset.length);
  console.log('');
  
  // 4. Check indexes
  console.log('4. Key Indexes:');
  const indexes = await pool.request().query(`
    SELECT 
      OBJECT_NAME(object_id) AS 'Table_Name',
      name AS 'Index_Name',
      type_desc AS 'Index_Type'
    FROM sys.indexes
    WHERE object_id IN (OBJECT_ID('Users'), OBJECT_ID('Restaurants'), OBJECT_ID('Subscriptions'), OBJECT_ID('UserRestaurants'))
    ORDER BY Table_Name
  `);
  console.log('   - ' + indexes.recordset.length + ' indexes on key tables:');
  indexes.recordset.forEach(idx => {
    console.log('     - ' + idx.Table_Name + ': ' + idx.Index_Name + ' (' + idx.Index_Type + ')');
  });
  console.log('');
  
  // 5. Check duplicate relationships
  console.log('5. Duplicate UserRestaurants Relationships:');
  const duplicates = await pool.request().query(`
    SELECT user_id, restaurant_id, COUNT(*) AS cnt
    FROM UserRestaurants
    GROUP BY user_id, restaurant_id
    HAVING COUNT(*) > 1
  `);
  console.log('   - Duplicate relationships: ' + duplicates.recordset.length);
  duplicates.recordset.forEach(d => {
    console.log('     - user ' + d.user_id + ' + restaurant ' + d.restaurant_id + ': ' + d.cnt + ' times');
  });
  console.log('');
  
  // 6. Check all table row counts
  console.log('6. Table Row Counts:');
  const tables = ['Users', 'Restaurants', 'Subscriptions', 'Plans', 'UserRestaurants', 'MenuCategories', 'MenuItems', 'OrderLines', 'Orders', 'Invoices', 'HomeContent', 'free_plan_requests', 'paid_subscription_requests'];
  for (const table of tables) {
    try {
      const count = await pool.request().query('SELECT COUNT(*) AS cnt FROM ' + table);
      console.log('   - ' + table + ': ' + count.recordset[0].cnt + ' rows');
    } catch (e) {
      console.log('   - ' + table + ': error or does not exist');
    }
  }
  console.log('');
  
  process.exit(0);
})();