/**
 * Admin Revenue — calculates monthly collected revenue from subscriptions/orders (non-destructive)
 */
const { getPool, sql } = require('../config/db');

async function getRevenueSummary(restaurantId) {
  const pool = await getPool();
  // Aggregate from orders or subscription payments based on restaurant isolation
  const rows = await pool.request()
    .input('rid', sql.NVarChar, restaurantId)
    .query(`SELECT ISNULL(SUM(CAST(price AS DECIMAL(18,2))), 0) AS total FROM Orders WHERE restaurant_id = @rid AND status = 'completed'`);
  return { total: rows.recordset[0]?.total || 0, currency: 'USD' };
}

module.exports = { getRevenueSummary };
