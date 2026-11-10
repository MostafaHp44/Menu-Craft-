const { getMySQLPool } = require('../config/mysql');

async function getPlatformStatus() {
  const pool = await getMySQLPool(); const c = await pool.getConnection();
  try { const [r] = await c.execute('SELECT 1'); return { status: 'mysql', timestamp: new Date() }; } finally { c.release(); }
}

async function getSubscriptionByRestaurant(restaurantId) {
  const pool = await getMySQLPool(); const c = await pool.getConnection();
  try {
    const [rows] = await c.execute('SELECT * FROM Subscriptions WHERE restaurant_id = ? ORDER BY started_at DESC LIMIT 1', [restaurantId]);
    return rows[0] || null;
  } finally { c.release(); }
}

// ---- NEW: functions needed by platform controller ----

async function getAllRestaurantsForAdmin() {
  const pool = await getMySQLPool(); const c = await pool.getConnection();
  try {
    // استعلامات مترابطة بدل JOIN — كل مطعم صفّ واحد بالضبط.
    // (JOIN مع UserRestaurants/Subscriptions كان يكرّر الصفوف عند تعدد
    //  مالكي الموقع أو اشتراكاته: مطعم واحد يظهر أكثر من مرة في لوحة السوبر أدمن)
    const [rows] = await c.execute(`
      SELECT 
        r.id, r.name_en AS name, r.slug, r.status, r.plan, r.templateId AS templateId,
        r.created_at AS createdAt, r.updated_at AS updatedAt,
        (SELECT u.name FROM UserRestaurants ur JOIN Users u ON u.id = ur.user_id
          WHERE ur.restaurant_id = r.id AND ur.is_owner = 1 ORDER BY ur.id LIMIT 1) AS owner_name,
        (SELECT u.email FROM UserRestaurants ur JOIN Users u ON u.id = ur.user_id
          WHERE ur.restaurant_id = r.id AND ur.is_owner = 1 ORDER BY ur.id LIMIT 1) AS owner_email,
        (SELECT s.status FROM Subscriptions s
          WHERE s.restaurant_id = r.id ORDER BY s.started_at DESC, s.id DESC LIMIT 1) AS subscription_status,
        (SELECT p.price FROM Subscriptions s LEFT JOIN Plans p ON p.id = s.plan_id
          WHERE s.restaurant_id = r.id ORDER BY s.started_at DESC, s.id DESC LIMIT 1) AS price
      FROM Restaurants r
      ORDER BY r.created_at DESC
    `);
    return rows;
  } finally { c.release(); }
}

async function getSubscriptions() {
  const pool = await getMySQLPool(); const c = await pool.getConnection();
  try {
    const [rows] = await c.execute(`
      SELECT 
        s.*, r.name_en AS restaurant_name, r.slug AS restaurant_slug,
        u.name AS owner_name, u.email AS owner_email,
        p.name AS plan_name, p.price AS plan_price, p.interval_type
      FROM Subscriptions s
      LEFT JOIN Restaurants r ON r.id = s.restaurant_id
      LEFT JOIN Users u ON u.id = s.user_id
      LEFT JOIN Plans p ON p.id = s.plan_id
      ORDER BY s.started_at DESC
    `);
    return rows;
  } finally { c.release(); }
}

async function createSubscription({ restaurantId, planId, price, status, renewsAt, paymentIntentId, autoRenew }) {
  const pool = await getMySQLPool(); const c = await pool.getConnection();
  try {
    await c.beginTransaction();
    const subId = `sub-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    await c.execute(`
      INSERT INTO Subscriptions (id, user_id, restaurant_id, plan_id, status, price, started_at, renews_at, payment_intent_id, auto_renew)
      VALUES (?, (SELECT u.id FROM Users u JOIN UserRestaurants ur ON ur.user_id = u.id WHERE ur.restaurant_id = ? AND ur.is_owner = 1 LIMIT 1), ?, ?, ?, ?, NOW(), ?, ?, ?)
    `, [subId, restaurantId, restaurantId, planId, status || 'active', price || 0, renewsAt || null, paymentIntentId || null, autoRenew ? 1 : 0]);
    const [rows] = await c.execute('SELECT * FROM Subscriptions WHERE id = ?', [subId]);
    await c.commit();
    return rows[0];
  } catch (e) {
    await c.rollback();
    throw e;
  } finally { c.release(); }
}

async function updateSubscription(restaurantId, patch) {
  const pool = await getMySQLPool(); const c = await pool.getConnection();
  try {
    const fields = [];
    const values = [];
    const allowed = ['plan_id', 'status', 'price', 'renews_at', 'payment_intent_id', 'auto_renew'];
    for (const key of allowed) {
      if (patch[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(patch[key]);
      }
    }
    if (fields.length === 0) return;
    values.push(restaurantId);
    await c.execute(`UPDATE Subscriptions SET ${fields.join(', ')} WHERE restaurant_id = ? AND id = (SELECT id FROM Subscriptions WHERE restaurant_id = ? ORDER BY started_at DESC LIMIT 1)`, [...values, restaurantId]);
  } finally { c.release(); }
}

async function getPlatformStats() {
  const pool = await getMySQLPool(); const c = await pool.getConnection();
  try {
    const [[{ total_restaurants }]] = await c.execute('SELECT COUNT(*) AS total_restaurants FROM Restaurants');
    const [[{ total_users }]] = await c.execute('SELECT COUNT(*) AS total_users FROM Users');
    const [[{ active_subscriptions }]] = await c.execute("SELECT COUNT(*) AS active_subscriptions FROM Subscriptions WHERE status IN ('active', 'trialing')");
    const [[{ total_orders }]] = await c.execute('SELECT COUNT(*) AS total_orders FROM Orders');
    const [[{ total_revenue }]] = await c.execute('SELECT COALESCE(SUM(amount), 0) AS total_revenue FROM Payments WHERE status = "paid"');
    const [[{ pending_payments }]] = await c.execute('SELECT COUNT(*) AS pending_payments FROM Payments WHERE status = "pending"');
    const [[{ mrr }]] = await c.execute(`
      SELECT COALESCE(SUM(p.price), 0) AS mrr
      FROM Subscriptions s
      JOIN Plans p ON p.id = s.plan_id
      WHERE s.status IN ('active', 'trialing') AND p.interval_type = 'month'
    `);
    return {
      total_restaurants,
      total_users,
      active_subscriptions,
      total_orders,
      total_revenue: Number(total_revenue),
      pending_payments,
      mrr: Number(mrr)
    };
  } finally { c.release(); }
}

// ---- NEW: functions for SalesTab and RevenuePage ----

async function getAdminSales(period = 'month') {
  const pool = await getMySQLPool(); const c = await pool.getConnection();
  try {
    // Aggregate orders/payments by date and restaurant
    const dateFilter = period === 'week' 
      ? 'AND o.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)'
      : period === 'year'
        ? 'AND o.created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)'
        : 'AND o.created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)';

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
      WHERE 1=1 ${dateFilter}
      GROUP BY DATE(o.created_at), r.id, r.name_en
      ORDER BY date DESC
    `);
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

module.exports = { 
  getPlatformStatus, 
  getSubscriptionByRestaurant,
  getAllRestaurantsForAdmin,
  getSubscriptions,
  createSubscription,
  updateSubscription,
  getPlatformStats,
  getAdminSales,
  getAdminFinancial
};