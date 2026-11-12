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

/**
 * التقارير المالية للسوبر أدمن.
 *
 * قبل هذا التعديل كانت الدالة تجمع جدول Payments فقط — وهو فارغ في الواقع
 * (الدفع عبر Stripe غير مفعّل) فكانت كل التقارير تعرض $0، إضافة لخلط
 * مدفوعات الاشتراكات بطلبات المطعمين.
 *
 * المصادر الآن مفصولة بوضوح:
 *   • اشتراكات (الفلوس اللي بتيجي لك) ← paid_subscription_requests (المعتمدة)
 *     + أي Payments مسجّلة على subscription_id
 *   • طلبات المطعمين ← Payments على order_id + قيمة الطلبات المكتملة (Orders)
 *   • معلّق / فاشل / مرتجع ← Payments بكل حالاتها
 */
async function getAdminFinancial(period = 'month') {
  const pool = await getMySQLPool(); const c = await pool.getConnection();
  try {
    const days = period === 'week' ? 7 : period === 'year' ? 365 : 30;
    const periodExpr = `DATE_FORMAT(x.created_at, '%Y-%m')`;

    /* ---------- 1) اشتراكات: المعتمدة من الطلبات + أي دفع Stripe عليها ---------- */
    const [subPaid] = await c.execute(`
      SELECT ${periodExpr} AS period,
             COUNT(*) AS cnt,
             COALESCE(SUM(x.price), 0) AS amount
      FROM (
        SELECT price, created_at FROM paid_subscription_requests
          WHERE status = 'approved' AND created_at >= DATE_SUB(NOW(), INTERVAL ${days} DAY)
        UNION ALL
        SELECT amount AS price, created_at FROM Payments
          WHERE subscription_id IS NOT NULL AND status = 'paid'
            AND created_at >= DATE_SUB(NOW(), INTERVAL ${days} DAY)
      ) x
      GROUP BY period ORDER BY period DESC
    `);

    /* ---------- 2) طلبات المطعمين: دفعات فعلياً على الطلبات ---------- */
    const [orderPaid] = await c.execute(`
      SELECT ${periodExpr} AS period, COUNT(*) AS cnt, COALESCE(SUM(x.amount), 0) AS amount
      FROM Payments x
      WHERE x.order_id IS NOT NULL AND x.status = 'paid'
        AND x.created_at >= DATE_SUB(NOW(), INTERVAL ${days} DAY)
      GROUP BY period ORDER BY period DESC
    `);

    /* ---------- 3) كل حالات الدفع (معلّق/فاشل/مرتجع) ---------- */
    const [payStatus] = await c.execute(`
      SELECT ${periodExpr} AS period, x.status,
             COUNT(*) AS cnt, COALESCE(SUM(x.amount), 0) AS amount
      FROM Payments x
      WHERE x.created_at >= DATE_SUB(NOW(), INTERVAL ${days} DAY)
      GROUP BY period, x.status ORDER BY period DESC
    `);

    /* ---------- 4) قيمة طلبات المطعمين المكتملة (حجم مبيعات المطاعم) ---------- */
    const [orderVolume] = await c.execute(`
      SELECT DATE_FORMAT(created_at, '%Y-%m') AS period, COUNT(*) AS cnt,
             COALESCE(SUM(total), 0) AS amount
      FROM Orders
      WHERE status = 'completed' AND created_at >= DATE_SUB(NOW(), INTERVAL ${days} DAY)
      GROUP BY period ORDER BY period DESC
    `);

    /* ---------- 5) الناس بيدفعوا كام لاشتراك أي باقة ---------- */
    const [byPlan] = await c.execute(`
      SELECT plan_name, COUNT(*) AS cnt, COALESCE(SUM(price), 0) AS amount
      FROM paid_subscription_requests
      WHERE status = 'approved' AND created_at >= DATE_SUB(NOW(), INTERVAL ${days} DAY)
      GROUP BY plan_name ORDER BY amount DESC
    `);

    /* ---------- دمج كل الفترات في صفوف واحدة ---------- */
    const map = new Map();
    const row = (p) => {
      if (!map.has(p)) map.set(p, { period: p, subscription: 0, subscriptionCount: 0, orders: 0, orderCount: 0, ordersVolume: 0, pending: 0, failed: 0, refunded: 0, paid: 0 });
      return map.get(p);
    };
    for (const r of subPaid) { const m = row(r.period); m.subscription += Number(r.amount); m.subscriptionCount += Number(r.cnt); }
    for (const r of orderPaid) { const m = row(r.period); m.orders += Number(r.amount); m.orderCount += Number(r.cnt); }
    for (const r of orderVolume) { const m = row(r.period); m.ordersVolume += Number(r.amount); }
    for (const r of payStatus) {
      const m = row(r.period);
      if (r.status === 'pending') m.pending += Number(r.amount);
      else if (r.status === 'failed') m.failed += Number(r.amount);
      else if (r.status === 'refunded') m.refunded += Number(r.amount);
      else if (r.status === 'paid') m.paid += Number(r.amount);
    }
    const monthly = [...map.values()].sort((a, b) => String(b.period).localeCompare(String(a.period)));

    const summary = monthly.reduce(
      (acc, m) => ({
        subscription: acc.subscription + m.subscription,
        subscriptionCount: acc.subscriptionCount + m.subscriptionCount,
        orders: acc.orders + m.orders,
        orderCount: acc.orderCount + m.orderCount,
        ordersVolume: acc.ordersVolume + m.ordersVolume,
        pending: acc.pending + m.pending,
        failed: acc.failed + m.failed,
        refunded: acc.refunded + m.refunded,
      }),
      { subscription: 0, subscriptionCount: 0, orders: 0, orderCount: 0, ordersVolume: 0, pending: 0, failed: 0, refunded: 0 }
    );

    return { summary, monthly, byPlan: byPlan.map((p) => ({ plan_name: p.plan_name || '—', count: Number(p.cnt), amount: Number(p.amount) })) };
  } finally { c.release(); }
}

module.exports = { getAdminRevenue, getAdminSales, getAdminFinancial };
