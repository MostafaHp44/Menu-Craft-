/**
 * MenuCraft — خدمة المواقع (Restaurants = موقع مطعم واحد)
 * ------------------------------------------------------------
 * الموقع في النظام = صف في جدول Restaurants (اسم + slug + قالب + منيو).
 * ملكية الموقع مخزّنة في جدول UserRestaurants (مستخدم ↔ مواقعه، متعدد).
 * حدود الباقات تُحسب على مستوى الحساب وتُفرض هنا قبل أي إنشاء.
 */
const { getPool, sql } = require('../config/db');
const { planLimitsFromRow, evaluateSiteLimit } = require('../config/plans');

/** خطأ API مخصص برمز حالة */
function httpError(status, message, code) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
}

/** مطابقة الـ role إلى صلاحية رؤية كل المواقع */
function isPrivileged(role) {
  return role === 'super_admin' || role === 'admin';
}

/**
 * جلب كل المواقع التي يملكها مستخدم.
 * يشمل العلاقات القديمة (Users.restaurant_id) حتى لا يُفقد موقع قديم.
 */
async function listSitesForUser(userId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('userId', sql.NVarChar, userId)
    .query(`
      SELECT r.*,
             ur.is_owner AS isOwner,
             s.status AS subscriptionStatus, s.plan_name AS subscriptionPlan, s.renews_at AS subscriptionRenewsAt
      FROM Restaurants r
      JOIN UserRestaurants ur ON ur.restaurant_id = r.id AND ur.user_id = @userId
      LEFT JOIN (
        SELECT s1.restaurant_id, s1.status, s1.plan_name, s1.renews_at,
               ROW_NUMBER() OVER (PARTITION BY s1.restaurant_id ORDER BY s1.started_at DESC) AS rn
        FROM Subscriptions s1
      ) s ON s.restaurant_id = r.id AND s.rn = 1
      ORDER BY r.created_at ASC
    `);
  return result.recordset;
}

/** هل يملك مستخدم موقعًا معيّنًا؟ (تُستخدم في حماية الطلبات والإعدادات) */
async function userOwnsSite(userId, restaurantId, role) {
  if (!userId || !restaurantId) return false;
  if (isPrivileged(role)) return true;
  const pool = await getPool();
  //(UserRestaurants) هو المرجع المو authoritative للمembership — ليس column في جدول المستخدمين
  const result = await pool.request()
    .input('userId', sql.NVarChar, userId)
    .input('restaurantId', sql.NVarChar, restaurantId)
    .query(`
      SELECT TOP 1 id FROM UserRestaurants WHERE user_id = @userId AND restaurant_id = @restaurantId
    `);
  if (result.recordset.length > 0) return true;
  // علاقة قديمة: Users.restaurant_id محتفظ بها للرجوع إليها وبيانات التراجع،
  // ولكن لا تُمنح صلاحية الوصول استقلالاً — UserRestaurants هو المصدر الوحيد المخوَّل.
  return false;
}

/** ربط مستخدم بموقع (idempotent — لا يتكرر) */
async function linkUserToSite(userId, restaurantId, isOwner = true) {
  const pool = await getPool();
  await pool.request()
    .input('userId', sql.NVarChar, userId)
    .input('restaurantId', sql.NVarChar, restaurantId)
    .input('isOwner', sql.Bit, isOwner ? 1 : 0)
    .query(`
      IF NOT EXISTS (SELECT 1 FROM UserRestaurants WHERE user_id = @userId AND restaurant_id = @restaurantId)
        INSERT INTO UserRestaurants (user_id, restaurant_id, is_owner) VALUES (@userId, @restaurantId, @isOwner)
    `);
}

/**
 * اشتراك الحساب (على مستوى المستخدم) — فعّال = active/trialing ولم ينتهِ renews_at.
 * يعيد الكيان الموحّد: { status, plan, limits: {...}, renewsAt, daysLeft, isExpiredByDate }
 */
async function getSubscriptionForUser(userId) {
  const pool = await getPool();
  // 1) اشتراك مرتبط بالحساب مباشرة (النظام الجديد)
  let result = await pool.request()
    .input('userId', sql.NVarChar, userId)
    .query(`
      SELECT TOP 1 s.id, s.user_id, s.restaurant_id, s.plan_id, s.plan_name, s.[plan] AS legacy_plan,
             s.price, s.status, s.started_at, s.renews_at, s.auto_renew,
             p.id AS p_id, p.name AS p_name, p.price AS p_price, p.interval_type, p.max_restaurants, p.max_menu_items, p.features
      FROM Subscriptions s
      LEFT JOIN Plans p ON p.id = s.plan_id
      WHERE s.user_id = @userId
      ORDER BY s.started_at DESC
    `);

  // 2) ترحيل: اشتراك قديم مربوط بأي موقع يملكه المستخدم
  if (result.recordset.length === 0) {
    result = await pool.request()
      .input('userId', sql.NVarChar, userId)
      .query(`
        SELECT TOP 1 s.id, s.user_id, s.restaurant_id, s.plan_id, s.plan_name, s.[plan] AS legacy_plan,
               s.price, s.status, s.started_at, s.renews_at, s.auto_renew,
               p.id AS p_id, p.name AS p_name, p.price AS p_price, p.interval_type, p.max_restaurants, p.max_menu_items, p.features
        FROM Subscriptions s
        JOIN UserRestaurants ur ON ur.restaurant_id = s.restaurant_id AND ur.user_id = @userId
        LEFT JOIN Plans p ON p.id = s.plan_id
        ORDER BY s.started_at DESC
      `).catch(async () => {
        // احتياطي لو عمود max_menu_items غير موجود في Plans
        return pool.request()
          .input('userId', sql.NVarChar, userId)
          .query(`
            SELECT TOP 1 s.id, s.user_id, s.restaurant_id, s.plan_id, s.plan_name, s.[plan] AS legacy_plan,
                   s.price, s.status, s.started_at, s.renews_at, s.auto_renew,
                   p.id AS p_id, p.name AS p_name, p.price AS p_price, p.interval_type, p.max_restaurants, p.max_menu_items, p.features
            FROM Subscriptions s
            JOIN UserRestaurants ur ON ur.restaurant_id = s.restaurant_id AND ur.user_id = @userId
            LEFT JOIN Plans p ON p.id = s.plan_id
            ORDER BY s.started_at DESC
          `);
      });
  }

  if (result.recordset.length === 0) return null;

  const row = result.recordset[0];
  const limits = planLimitsFromRow({
    plan_id: row.plan_id || row.p_id,
    plan_name: row.plan_name || row.legacy_plan || row.p_name,
    price: row.price ?? row.p_price,
    interval_type: row.interval_type,
    max_restaurants: row.max_restaurants,
    max_menu_items: row.max_menu_items,
    features: row.features
  });

  // انتهاء الصلاحية الزمني: trial انتهى أو اشتراك مدفوع تجاوز تاريخ التجديد
  const renewsAt = row.renews_at ? new Date(row.renews_at) : null;
  const now = new Date();
  const isExpiredByDate = Boolean(renewsAt && renewsAt.getTime() < now.getTime());
  const daysLeft = renewsAt
    ? Math.max(0, Math.ceil((renewsAt.getTime() - now.getTime()) / (24 * 3600 * 1000)))
    : null;

  let effectiveStatus = row.status;
  if (isExpiredByDate && (row.status === 'active' || row.status === 'trialing')) {
    effectiveStatus = 'expired';
  }

  return {
    id: row.id,
    userId: row.user_id,
    restaurantId: row.restaurant_id,
    status: effectiveStatus,
    rawStatus: row.status,
    price: Number(row.price ?? 0),
    startedAt: row.started_at,
    renewsAt: row.renews_at,
    autoRenew: Boolean(row.auto_renew),
    daysLeft,
    isExpiredByDate,
    limits,
    // الاشتراك الفعلي يُفعّل بتأكيد دفع موثوق فقط (Webhook موثّق) — لا يكفي اختيار الخطة
    isActive: effectiveStatus === 'active' || effectiveStatus === 'trialing'
  };
}

/**
 * إنشاء اشتراك فترة التجربة (3 أيام) — يُستدعى داخل معاملة التسجيل.
 * لا يُنشئ اشتراكًا مزدوجًا لو وُجد اشتراك سابق للمستخدم.
 */
async function ensureTrialSubscription(tx, userId, restaurantId) {
  const existing = await tx.request()
    .input('userId', sql.NVarChar, userId)
    .query('SELECT TOP 1 id FROM Subscriptions WHERE user_id = @userId');
  if (existing.recordset.length > 0) return existing.recordset[0].id;

  const id = `sub-trial-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  await tx.request()
    .input('id', sql.NVarChar, id)
    .input('userId', sql.NVarChar, userId)
    .input('restaurantId', sql.NVarChar, restaurantId)
    .input('planId', sql.NVarChar, 'trial')
    .input('planName', sql.NVarChar, 'Free Trial')
    .input('status', sql.NVarChar, 'trialing')
    .input('renewsAt', sql.DateTime, new Date(Date.now() + 3 * 24 * 3600 * 1000))
    .query(`
      INSERT INTO Subscriptions (id, user_id, restaurant_id, plan_id, plan_name, [plan], price, status, started_at, renews_at, auto_renew)
      VALUES (@id, @userId, @restaurantId, @planId, @planName, 'trial', 0, 'trialing', GETDATE(), @renewsAt, 0)
    `);
  return id;
}

/**
 * فحص حدود الباقة قبل إنشاء موقع جديد.
 * يرمي 403 PLAN_LIMIT_REACHED لو امتلأت الحصة، أو 403 SUBSCRIPTION_REQUIRED
 * لو الاشتراك منتهٍ تمامًا (الحد: الحفاظ على المواقع الحالية + منع الإنشاء).
 */
async function assertCanCreateSite(userId) {
  const sub = await getSubscriptionForUser(userId);

  if (!sub) {
    throw httpError(403, 'لا يوجد اشتراك نشط. اختر باقة أولًا لإنشاء مواقع جديدة', 'SUBSCRIPTION_REQUIRED');
  }
  if (sub.status === 'expired') {
    throw httpError(403, 'انتهت صلاحية الاشتراك. جدّد باقتك لإنشاء مواقع جديدة (مواقعك الحالية محفوظة)', 'SUBSCRIPTION_EXPIRED');
  }
  if (sub.status === 'past_due') {
    throw httpError(403, 'الاشتراك بحالة تأخر سداد. عالج حالة الدفع لإنشاء مواقع جديدة', 'SUBSCRIPTION_PAST_DUE');
  }

  const pool = await getPool();
  const countResult = await pool.request()
    .input('userId', sql.NVarChar, userId)
    .query('SELECT COUNT(*) AS cnt FROM UserRestaurants WHERE user_id = @userId');
  const used = countResult.recordset[0].cnt;

  const limit = evaluateSiteLimit(sub.limits.maxSites, used);
  if (!limit.canCreate) {
    const planName = sub.limits.planName || 'باقتك';
    throw httpError(
      403,
      `وصلت إلى الحد الأقصى لمواقع باقة ${planName} (${used}/${sub.limits.maxSites}). قم بترقية الباقة لإنشاء مواقع إضافية`,
      'PLAN_LIMIT_REACHED'
    );
  }
  return { sub, used, limit };
}

/** ملخص الحصّة يعرضه تبويب Websites (Websites: 2 / 3 · 1 website slot remaining) */
async function getSiteSummary(userId) {
  const [sites, sub] = await Promise.all([listSitesForUser(userId), getSubscriptionForUser(userId)]);
  const used = sites.length;
  const limits = sub?.limits ?? planLimitsFromRow(null);
  const limit = evaluateSiteLimit(limits.maxSites, used);
  return {
    sites,
    used,
    maxSites: limits.maxSites,
    unlimited: limits.maxSites === -1,
    remaining: limit.remaining,
    overLimit: limit.overLimit,
    canCreate: limit.canCreate && Boolean(sub && (sub.status === 'active' || sub.status === 'trialing')),
    plan: {
      id: limits.planId,
      name: limits.planName,
      price: limits.price,
      features: limits.features
    },
    subscription: sub
      ? { status: sub.status, renewsAt: sub.renewsAt, daysLeft: sub.daysLeft, isTrial: limits.planId === 'trial' }
      : null
  };
}

module.exports = {
  httpError,
  isPrivileged,
  listSitesForUser,
  userOwnsSite,
  linkUserToSite,
  getSubscriptionForUser,
  ensureTrialSubscription,
  assertCanCreateSite,
  getSiteSummary
};
