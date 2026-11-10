const { getMySQLPool } = require('../config/mysql');
async function getAdminRevenue(restaurantId) {
  const pool = await getMySQLPool(); const c = await pool.getConnection();
  try { const [r] = await c.execute('SELECT SUM(amount) AS total FROM Payments WHERE restaurant_id = ? AND status = ?', [restaurantId, 'paid']); return r[0] || { total: 0 }; } finally { c.release(); }
}

async function getAdminSales(period = 'month', restaurantId = null) {
  const pool = await getMySQLPool(); const c = await pool.getConnection();
  try {
    const dateFilter = period === 'week' ? 'AND o.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)'
      : period === 'year' ? 'AND o.created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)'
      : 'AND o.created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)';
    const restaurantFilter = restaurantId ? 'AND o.restaurant_id = ?' : '';
    const params = restaurantId ? [restaurantId] : [];
    const [rows] = await c.execute(`
      SELECT 
        DATE(o.created_at) AS date,
        r.id AS restaurant_id,
        r.name_en AS restaurant_name,
        COUNT(o.id) AS orders,
        COALESCE(SUM(p.amount), 0) AS revenue
      FROM Orders o
      JOIN Restaurants r ON r.id = o.restaurant_id
      LEFT JOIN Payments p ON p.order_id = o.id AND p.status = 'paid'
      WHERE 1=1 ${dateFilter} ${restaurantFilter}
      GROUP BY DATE(o.created_at), r.id, r.name_en
      ORDER BY date DESC
    `, params);
    return rows;
  } finally { c.release(); }
}

async function getAdminFinancial(period = 'month') {
  const pool = await getMySQLPool(); const c = await pool.getConnection();
  try {
    const days = period === 'week' ? 7 : period === 'year' ? 365 : 30;
    const [rows] = await c.execute(`
      SELECT 
        DATE_FORMAT(p.created_at, '%Y-%m') AS period,
        COALESCE(SUM(CASE WHEN p.status = 'paid' THEN p.amount ELSE 0 END), 0) AS revenue,
        COALESCE(SUM(CASE WHEN p.status = 'pending' THEN p.amount ELSE 0 END), 0) AS pending,
        COALESCE(SUM(CASE WHEN p.status = 'failed' THEN p.amount ELSE 0 END), 0) AS failed,
        COALESCE(SUM(CASE WHEN p.status = 'refunded' THEN p.amount ELSE 0 END), 0) AS refunded
      FROM Payments p
      WHERE p.created_at >= DATE_SUB(NOW(), INTERVAL ${days} DAY)
      GROUP BY period
      ORDER BY period DESC
    `);
    return rows;
  } finally { c.release(); }
}

module.exports = { getAdminRevenue, getAdminSales, getAdminFinancial };
