const { getMySQLPool } = require('../config/mysql');

async function getPlatformStatus() {
  const pool = await getMySQLPool(); const c = await pool.getConnection();
  try { const [r] = await c.execute('SELECT 1'); return { status: 'mysql', timestamp: new Date() }; } finally { c.release(); }
}

async function getSubscriptionByRestaurant(restaurantId) {
  const pool = await getMySQLPool(); const c = await pool.getConnection();
  try {
    const [rows] = await c.execute('SELECT * FROM Subscriptions WHERE restaurant_id = ? ORDER BY started_at DESC LIMIT 1', [restaurantId]);
    const row = rows[0] || null;
    if (!row) return null;

    /* الحالة الفعّالة بالتاريخ: لا يوجد مهمة خلفية تحوّل الصف إلى expired،
       فلو مرّ تاريخ renews_at والصف لا يزال active/trialing نُعيده expired.
       هذا يقفل داشبورد الكلاينت (fetchSubscription → RequireSubscription/DashboardLayout)
       ويوقف النشر (subscriptionMiddleware) — بدون أي كتابة في القاعدة؛
       زرار «جدّد شهر» عند السوبر أدمن يعيد active + renews_at جديد. */
    const renewsAt = row.renews_at ? new Date(row.renews_at) : null;
    const expiredByDate = Boolean(renewsAt && renewsAt.getTime() < Date.now());
    if (expiredByDate && (row.status === 'active' || row.status === 'trialing')) {
      row.status = 'expired';
      row.expiredByDate = true;
    }
    return row;
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
      WHERE LOWER(COALESCE(r.status, '')) <> 'deleted'
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
      WHERE r.id IS NULL OR LOWER(COALESCE(r.status, '')) <> 'deleted'
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
    const [[{ total_restaurants }]] = await c.execute("SELECT COUNT(*) AS total_restaurants FROM Restaurants WHERE LOWER(COALESCE(status, '')) <> 'deleted'");
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

// ---- NEW: تفاصيل كلاينت للسوبر أدمن (تاب Sales) ----
// يعيد: المطعم + المالك + آخر اشتراك + الموظفون + الفروع (بمبيعات الفترة)
const SALES_PERIOD_DAYS = { week: 7, month: 30, year: 365 };

async function getRestaurantDetailsForAdmin(restaurantId, period = 'month') {
  const pool = await getMySQLPool(); const c = await pool.getConnection();
  try {
    const days = SALES_PERIOD_DAYS[period] || 30;

    const [restRows] = await c.execute(`
      SELECT r.id, r.name_en AS name, r.slug, r.status, r.plan, r.created_at,
        (SELECT u.id    FROM UserRestaurants ur JOIN Users u ON u.id = ur.user_id
          WHERE ur.restaurant_id = r.id AND ur.is_owner = 1 ORDER BY ur.id LIMIT 1) AS owner_id,
        (SELECT u.name  FROM UserRestaurants ur JOIN Users u ON u.id = ur.user_id
          WHERE ur.restaurant_id = r.id AND ur.is_owner = 1 ORDER BY ur.id LIMIT 1) AS owner_name,
        (SELECT u.email FROM UserRestaurants ur JOIN Users u ON u.id = ur.user_id
          WHERE ur.restaurant_id = r.id AND ur.is_owner = 1 ORDER BY ur.id LIMIT 1) AS owner_email
      FROM Restaurants r WHERE r.id = ?
    `, [restaurantId]);
    if (!restRows.length) { const err = new Error('المطعم غير موجود'); err.status = 404; throw err; }
    const restaurant = restRows[0];

    // آخر اشتراك + اسم باقته
    const [subRows] = await c.execute(`
      SELECT s.id, s.status, s.price, s.started_at, s.renews_at, s.auto_renew,
             p.name AS plan_name, p.price AS plan_price, p.interval_type
      FROM Subscriptions s LEFT JOIN Plans p ON p.id = s.plan_id
      WHERE s.restaurant_id = ? ORDER BY s.started_at DESC, s.id DESC LIMIT 1
    `, [restaurantId]);

    // الموظفون (بدون مسح حالة removed — تظهر كسجل)
    const [empRows] = await c.execute(`
      SELECT re.id, u.name, u.email, u.role, re.status, re.branch_access_type, re.created_at
      FROM RestaurantEmployees re JOIN Users u ON u.id = re.user_id
      WHERE re.restaurant_id = ? ORDER BY re.created_at DESC
    `, [restaurantId]);

    // الفروع + مبيعات كل فرع في الفترة المختارة
    const [branchRows] = await c.execute(`
      SELECT b.id, b.name, b.address, b.phone, b.is_active, b.accepting_orders, b.created_at,
        COUNT(o.id) AS orders,
        COALESCE(SUM(CASE WHEN o.status <> 'cancelled' THEN o.total ELSE 0 END), 0) AS revenue,
        COALESCE(SUM(CASE WHEN o.status = 'completed' THEN 1 ELSE 0 END), 0) AS completed,
        COALESCE(SUM(CASE WHEN o.status = 'cancelled' THEN 1 ELSE 0 END), 0) AS cancelled
      FROM Branches b
      LEFT JOIN Orders o ON o.branch_id = b.id AND o.created_at >= DATE_SUB(NOW(), INTERVAL ${days} DAY)
      WHERE b.restaurant_id = ?
      GROUP BY b.id, b.name, b.address, b.phone, b.is_active, b.accepting_orders, b.created_at
      ORDER BY b.created_at
    `, [restaurantId]);

    // الطلبات بلا فرع في الفترة
    const [[noBranch]] = await c.execute(`
      SELECT COUNT(*) AS orders,
        COALESCE(SUM(CASE WHEN status <> 'cancelled' THEN total ELSE 0 END), 0) AS revenue
      FROM Orders WHERE restaurant_id = ? AND branch_id IS NULL
        AND created_at >= DATE_SUB(NOW(), INTERVAL ${days} DAY)
    `, [restaurantId]);

    const branches = branchRows.map((b) => ({
      id: b.id,
      name: b.name,
      address: b.address,
      phone: b.phone,
      is_active: Number(b.is_active || 0),
      accepting_orders: Number(b.accepting_orders || 0),
      created_at: b.created_at,
      orders: Number(b.orders || 0),
      revenue: Number(b.revenue || 0),
      completed: Number(b.completed || 0),
      cancelled: Number(b.cancelled || 0),
    }));
    if (Number(noBranch?.orders || 0) > 0) {
      branches.push({
        id: null, name: null, address: null, phone: null,
        is_active: null, accepting_orders: null, created_at: null,
        orders: Number(noBranch.orders), revenue: Number(noBranch.revenue),
        completed: 0, cancelled: 0,
      });
    }

    return {
      restaurant,
      subscription: subRows[0] || null,
      employees: empRows.map((e) => ({
        id: e.id,
        name: e.name,
        email: e.email,
        role: e.role,
        status: e.status,
        branch_access_type: e.branch_access_type,
        created_at: e.created_at,
      })),
      branches,
      period: { key: SALES_PERIOD_DAYS[period] ? period : 'month', days },
    };
  } finally { c.release(); }
}

/* =========================================================================
 * حذف حساب كلاينت بالكامل (بطلب السوبر أدمن من تاب Clients)
 *
 * القاعدة: المالك + كل مطاعمه + موظفيه يتمسحوا نهائيًا،
 *          لكن سجلات الفلوس (Orders/OrderLines/Payments/invoices +
 *          paid_subscription_requests المعتمدة) تفضل موجودة للتقارير.
 *
 * مشكلة الـ FK: مطعم فيه طلبات/دفعات/فواتير مش ممكن يتمسح صفّه
 * (RESTRICT) → نعمل له «tombstone»: status='deleted' + مسح كل المحتوى.
 * وكل مسارات الموقع العام بتطلب LOWER(status)='published'
 * (menu.routes / sites.routes / menu.service / order.service)
 * يعني الموقع بيقفل فورًا في كل مكان، والصف بيفضل سجل مالي.
 *
 * المطاعم بلا سجلات مالية → حذف نهائي (نمسح الأول RESTRICT children:
 * Subscriptions/RestaurantEmployees/employeeactivitylog ثم الصف).
 * ========================================================================= */

/** أعمدة المحتوى اللي بتمسح عند الـ tombstone — الاسم/الـ slug بيفضلوا
 *  عشان تقارير المبيعات وتقرير الإيراد يفضلوا مقروءين. */
const TOMBSTONE_CLEAR_SQL = [
  'tagline_en = NULL', 'tagline_ar = NULL', 'tagline_ku = NULL',
  'description_en = NULL', 'description_ar = NULL', 'description_ku = NULL',
  'logoText_en = NULL', 'logoText_ar = NULL', 'logoText_ku = NULL',
  'heroImage = NULL', 'heroVideo = NULL', 'gallery = NULL',
  'phone = NULL', 'email = NULL', 'address = NULL', 'hours = NULL', 'socials = NULL',
  'templateId = NULL', 'design = NULL', 'menu = NULL', 'stats = NULL',
  'published_menu = NULL', 'draft_menu = NULL', 'copy = NULL', 'inline = NULL',
  'hero_image_fit = NULL', 'gallery_fits = NULL',
  `ordering = '{"enabled":false}'`,
  `status = 'deleted'`,
  'updated_at = NOW()',
].join(', ');

async function deleteClientAccount(restaurantId) {
  const pool = await getMySQLPool();
  const c = await pool.getConnection();
  try {
    const [entry] = await c.execute('SELECT id FROM Restaurants WHERE id = ?', [restaurantId]);
    if (!entry.length) { const err = new Error('المطعم غير موجود'); err.status = 404; throw err; }

    await c.beginTransaction();
    try {
      /* 1) مالك المطعم (UserRestaurants is_owner=1) — وبديل لبيانات قديمة: users.restaurant_id */
      let [owners] = await c.execute(
        `SELECT DISTINCT u.id FROM UserRestaurants ur JOIN Users u ON u.id = ur.user_id
         WHERE ur.restaurant_id = ? AND ur.is_owner = 1`, [restaurantId]);
      if (!owners.length) {
        [owners] = await c.execute('SELECT id FROM Users WHERE restaurant_id = ?', [restaurantId]);
      }
      const ownerIds = owners.map((o) => o.id);

      /* 2) كل مطاعم المالك (حذف الحساب = حذف كل مطاعمه) + المطعم المحدد */
      const restIds = [restaurantId];
      if (ownerIds.length) {
        const ph = ownerIds.map(() => '?').join(',');
        const [linked] = await c.execute(
          `SELECT DISTINCT restaurant_id FROM UserRestaurants
           WHERE user_id IN (${ph}) AND is_owner = 1`, ownerIds);
        for (const l of linked) if (!restIds.includes(l.restaurant_id)) restIds.push(l.restaurant_id);
      }
      const phRest = restIds.map(() => '?').join(',');

      /* 3) فصل: مطعم فيه سجلات مالية (طلبات/دفعات/فواتير) → tombstone،
            وإلا → حذف نهائي */
      const hard = []; const tomb = [];
      for (const rid of restIds) {
        const [[cnt]] = await c.execute(
          `SELECT (SELECT COUNT(*) FROM Orders WHERE restaurant_id = ?) +
                  (SELECT COUNT(*) FROM Payments WHERE restaurant_id = ?) +
                  (SELECT COUNT(*) FROM invoices WHERE restaurant_id = ?) AS n`,
          [rid, rid, rid]);
        (Number(cnt.n) > 0 ? tomb : hard).push(rid);
      }

      /* 4) نجمع موظفين المطاعم قبل مسح صفوفهم (هنحتاج حساباتهم بعدين) */
      const [empRows] = await c.execute(
        `SELECT DISTINCT user_id FROM RestaurantEmployees WHERE restaurant_id IN (${phRest})`, restIds);
      const employeeIds = empRows.map((e) => e.user_id);
      const [[{ empCount }]] = await c.execute(
        `SELECT COUNT(*) AS empCount FROM RestaurantEmployees WHERE restaurant_id IN (${phRest})`, restIds);

      /* 5) مسح كل سجلات المطعم (يشتغل في الحالتين) — الأول الأبناء
            (RESTRICT) وبعدين الباقي؛ الأبناء التانيين بيتمسحوا CASCADE */
      for (const rid of restIds) {
        await c.execute('DELETE FROM RestaurantEmployees WHERE restaurant_id = ?', [rid]); // → EmployeeBranchAccess CASCADE
        await c.execute('DELETE FROM Branches WHERE restaurant_id = ?', [rid]);            // → Orders.branch_id SET NULL
        await c.execute('DELETE FROM MenuCategories WHERE restaurant_id = ?', [rid]);      // → MenuItems CASCADE
        await c.execute('DELETE FROM MenuItems WHERE restaurant_id = ?', [rid]);           // أصناف بلا تصنيف
        await c.execute('DELETE FROM DashboardThemes WHERE restaurant_id = ?', [rid]);
        await c.execute('DELETE FROM RestaurantTemplates WHERE restaurant_id = ?', [rid]);
        await c.execute('DELETE FROM UserRestaurants WHERE restaurant_id = ?', [rid]);
        await c.execute('DELETE FROM free_plan_requests WHERE restaurant_id = ?', [rid]);
        await c.execute(`DELETE FROM paid_subscription_requests WHERE restaurant_id = ? AND status <> 'approved'`, [rid]);
        await c.execute('DELETE FROM employeeactivitylog WHERE restaurant_id = ?', [rid]);
      }

      /* 6) المطاعم بلا سجلات مالية → حذف نهائي
            (Subscriptions لازم تتمسح الأول: RESTRICT من restaurants) */
      const hardDeleted = [];
      for (const rid of hard) {
        try {
          await c.execute('DELETE FROM Subscriptions WHERE restaurant_id = ?', [rid]);
          await c.execute('DELETE FROM Restaurants WHERE id = ?', [rid]);
          hardDeleted.push(rid);
        } catch (e) {
          /* FK رفض الحذف (مثلاً دفع مرتبط بالاشتراك) → tombstone بدلًا منه */
          await c.execute(`UPDATE Restaurants SET ${TOMBSTONE_CLEAR_SQL} WHERE id = ?`, [rid]);
          tomb.push(rid);
        }
      }

      /* 7) مطاعم بسجلات مالية → tombstone: الموقع بيقفل فورًا
            (كل مسار عام بيطلب status='published') والصف يفضل سجل مالي */
      for (const rid of tomb) {
        await c.execute(`UPDATE Restaurants SET ${TOMBSTONE_CLEAR_SQL} WHERE id = ?`, [rid]);
      }

      /* 8) حذف حسابات المالك + الموظفين نهائيًا
            — شروط الحماية: مش أدمن/سوبر أدمن، ومش مربوط بأي مطعم برّه القائمة */
      const candidates = [...new Set([...ownerIds, ...employeeIds])];
      let usersDeleted = 0;
      if (candidates.length) {
        const [linkedUsers] = await c.execute(
          `SELECT id FROM Users WHERE restaurant_id IN (${phRest})`, restIds);
        for (const u of linkedUsers) if (!candidates.includes(u.id)) candidates.push(u.id);

        const phUsers = candidates.map(() => '?').join(',');
        const [candRows] = await c.execute(
          `SELECT id, role FROM Users
           WHERE id IN (${phUsers}) AND COALESCE(role, '') NOT IN ('super_admin', 'admin')`,
          candidates);

        for (const u of candRows) {
          // أي صف متبقي يعني إنه شغّال/معاون في مطعم برّه القائمة → نسيبه
          const [[links]] = await c.execute(
            `SELECT (SELECT COUNT(*) FROM RestaurantEmployees WHERE user_id = ?) +
                    (SELECT COUNT(*) FROM UserRestaurants WHERE user_id = ?) AS n`,
            [u.id, u.id]);
          if (Number(links.n) > 0) continue;

          await c.execute('DELETE FROM employeeactivitylog WHERE user_id = ?', [u.id]);
          await c.execute('DELETE FROM TemplateDrafts WHERE user_id = ?', [u.id]);
          await c.execute('DELETE FROM free_plan_requests WHERE user_id = ?', [u.id]);
          await c.execute(`DELETE FROM paid_subscription_requests WHERE user_id = ? AND status <> 'approved'`, [u.id]);
          await c.execute('DELETE FROM UserRestaurants WHERE user_id = ?', [u.id]);
          await c.execute('DELETE FROM Users WHERE id = ?', [u.id]);
          usersDeleted++;
        }
      }

      await c.commit();
      return {
        owners: ownerIds.length,
        restaurants: restIds.length,
        hardDeleted: hardDeleted.length,
        tombstoned: tomb.length,
        employees: Number(empCount || 0),
        usersDeleted,
      };
    } catch (e) {
      await c.rollback();
      throw e;
    }
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
  getAdminFinancial,
  getRestaurantDetailsForAdmin,
  deleteClientAccount
};