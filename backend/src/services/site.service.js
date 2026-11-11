/**
 * MenuCraft — Site Service (MariaDB / mysql2 version)
 */
const { getMySQLPool } = require('../config/mysql');
const { planLimitsFromRow, evaluateSiteLimit } = require('../config/plans');

function httpError(status, message, code) {
  const err = new Error(message); err.status = status; err.code = code; return err;
}
function isPrivileged(role) { return role === 'super_admin' || role === 'admin'; }

/**
 * عدّ التصنيفات والأصناف من قائمة الموقع الفعلية:
 * النسخة المنشورة (published_menu) أولاً وإن لم توجد النسخة المسودة (draft_menu).
 * القائمة محفوظة JSON داخل عمود longtext — الجداول MenuCategories/MenuItems
 * لا تمثل القائمة الحية في هذه المعمارية.
 */
function menuCounts(row) {
  const raw = row.published_menu || row.draft_menu;
  if (!raw) return { categoryCount: 0, itemCount: 0 };
  let arr;
  try {
    arr = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return { categoryCount: 0, itemCount: 0 };
  }
  if (!Array.isArray(arr)) return { categoryCount: 0, itemCount: 0 };
  let categoryCount = 0, itemCount = 0;
  for (const c of arr) {
    if (!c || typeof c !== 'object') continue;
    categoryCount++;
    if (Array.isArray(c.items)) itemCount += c.items.length;
  }
  return { categoryCount, itemCount };
}

async function listSitesForUser(userId) {
  const pool = await getMySQLPool();
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(`
      SELECT r.*, ur.is_owner AS isOwner,
        (SELECT s1.status FROM Subscriptions s1 WHERE s1.restaurant_id = r.id ORDER BY s1.started_at DESC LIMIT 1) AS subscriptionStatus,
        (SELECT s1.plan_name FROM Subscriptions s1 WHERE s1.restaurant_id = r.id ORDER BY s1.started_at DESC LIMIT 1) AS subscriptionPlan,
        (SELECT s1.renews_at FROM Subscriptions s1 WHERE s1.restaurant_id = r.id ORDER BY s1.started_at DESC LIMIT 1) AS subscriptionRenewsAt
      FROM UserRestaurants ur
      JOIN Restaurants r ON r.id = ur.restaurant_id
      WHERE ur.user_id = ?
      ORDER BY r.created_at ASC`, [userId]);
    for (const row of rows) {
      Object.assign(row, menuCounts(row));
    }
    return rows;
  } finally { connection.release(); }
}

async function userOwnsSite(userId, restaurantId, role) {
  if (!userId || !restaurantId) return false;
  if (isPrivileged(role)) return true;
  const pool = await getMySQLPool();
  const connection = await pool.getConnection();
  try {
    // Check UserRestaurants table first (for multi-restaurant users)
    const [rows] = await connection.execute('SELECT id FROM UserRestaurants WHERE user_id = ? AND restaurant_id = ?', [userId, restaurantId]);
    if (rows.length > 0) return true;
    // Fallback: check Users.restaurant_id (for single-restaurant users / legacy)
    const [userRows] = await connection.execute('SELECT restaurant_id FROM Users WHERE id = ?', [userId]);
    return userRows.length > 0 && userRows[0].restaurant_id === restaurantId;
  } finally { connection.release(); }
}

async function linkUserToSite(userId, restaurantId, isOwner = true) {
  const pool = await getMySQLPool();
  const connection = await pool.getConnection();
  try {
    const [existing] = await connection.execute('SELECT 1 FROM UserRestaurants WHERE user_id = ? AND restaurant_id = ?', [userId, restaurantId]);
    if (existing.length === 0) {
      // id is a varchar PRIMARY KEY without a default — it must be supplied or
      // MySQL inserts '' and every later insert fails with ER_DUP_ENTRY.
      const linkId = `ur-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      await connection.execute('INSERT INTO UserRestaurants (id, user_id, restaurant_id, is_owner) VALUES (?, ?, ?, ?)', [linkId, userId, restaurantId, isOwner ? 1 : 0]);
    }
  } finally { connection.release(); }
}

async function getSubscriptionForUser(userId) {
  const pool = await getMySQLPool();
  const connection = await pool.getConnection();
  try {
    // الاشتراك يتبع المطعم لا المستخدم: حتى يرى الموظفون (users بلا صف في
    // Subscriptions) نفس حالة المطعم المعتمد. نرجع للمستخدم فقط إن لم يكن
    // مرتبطاً بمطعم.
    const [userRows] = await connection.execute('SELECT restaurant_id FROM Users WHERE id = ?', [userId]);
    const ownedRestaurantId = userRows[0]?.restaurant_id || null;
    const subQuery = `SELECT s.*, p.id AS p_id, p.name AS p_name, p.price AS p_price, p.interval_type, p.max_restaurants, p.max_menu_items, p.features FROM Subscriptions s LEFT JOIN Plans p ON p.id = s.plan_id WHERE `;
    const [subRows] = ownedRestaurantId
      ? await connection.execute(subQuery + 's.restaurant_id = ? ORDER BY s.started_at DESC LIMIT 1', [ownedRestaurantId])
      : await connection.execute(subQuery + 's.user_id = ? ORDER BY s.started_at DESC LIMIT 1', [userId]);
    if (subRows.length === 0) return null;
    const row = subRows[0];
    const limits = planLimitsFromRow({
      plan_id: row.plan_id || row.p_id,
      plan_name: row.plan_name,
      price: row.price ?? row.p_price,
      interval_type: row.interval_type,
      max_restaurants: row.max_restaurants,
      max_menu_items: row.max_menu_items,
      features: row.features
    });
    const renewsAt = row.renews_at ? new Date(row.renews_at) : null;
    const now = new Date();
    const isExpiredByDate = Boolean(renewsAt && renewsAt.getTime() < now.getTime());
    const daysLeft = renewsAt ? Math.max(0, Math.ceil((renewsAt.getTime() - now.getTime()) / (24 * 3600 * 1000))) : null;
    let effectiveStatus = row.status;
    if (isExpiredByDate && (row.status === 'active' || row.status === 'trialing')) effectiveStatus = 'expired';
    return {
      id: row.id, userId: row.user_id, restaurantId: row.restaurant_id,
      status: effectiveStatus, rawStatus: row.status,
      price: Number(row.price ?? 0),
      startedAt: row.started_at, renewsAt: row.renews_at,
      autoRenew: Boolean(row.auto_renew), daysLeft, isExpiredByDate,
      limits,
      isActive: effectiveStatus === 'active' || effectiveStatus === 'trialing'
    };
  } finally { connection.release(); }
}

async function ensureTrialSubscription(txOrArgs, maybeUserId, maybeRestaurantId) {
  // Supports both (connection, userId, restaurantId) and ({ transaction, userId, restaurantId })
  let conn = txOrArgs;
  let userId = maybeUserId;
  let restaurantId = maybeRestaurantId;
  if (txOrArgs && typeof txOrArgs === 'object' && !txOrArgs.execute) {
    conn = txOrArgs.transaction || txOrArgs.connection;
    userId = txOrArgs.userId;
    restaurantId = txOrArgs.restaurantId;
  }
  if (!conn || typeof conn.execute !== 'function') {
    conn = await (await getMySQLPool()).getConnection();
  }
  const [existing] = await conn.execute('SELECT 1 FROM Subscriptions WHERE user_id = ? LIMIT 1', [userId]);
  if (existing.length > 0) return existing[0] ? existing[0] : null;
  const id = `sub-trial-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  await conn.execute(
    'INSERT INTO Subscriptions (id, user_id, restaurant_id, plan_id, plan_name, plan, price, status, started_at, renews_at, auto_renew) VALUES (?, ?, ?, NULL, ?, ?, ?, ?, NOW(), ?, 0)',
    [id, userId, restaurantId, 'Free Trial', 'trial', 0, 'trialing', new Date(Date.now() + 3 * 24 * 3600 * 1000)]
  );
  return id;
}

async function assertCanCreateSite(userId) {
  const sub = await getSubscriptionForUser(userId);
  if (!sub) throw httpError(403, 'لا يوجد اشتراك نشط. اختر باقة أولًا لإنشاء مواقع جديدة', 'SUBSCRIPTION_REQUIRED');
  if (sub.status === 'expired') throw httpError(403, 'انتهت صلاحية الاشتراك. جدّد باقتك لإنشاء مواقع جديدة', 'SUBSCRIPTION_EXPIRED');
  if (sub.status === 'past_due') throw httpError(403, 'الاشتراك بحالة تأخر سداد. عالج حالة الدفع لإنشاء مواقع جديدة', 'SUBSCRIPTION_PAST_DUE');
  const pool = await getMySQLPool();
  const connection = await pool.getConnection();
  let used = 0;
  try {
    const [countResult] = await connection.execute('SELECT COUNT(*) AS cnt FROM UserRestaurants WHERE user_id = ?', [userId]);
    used = countResult[0].cnt || 0;
  } finally { connection.release(); }
  const limit = evaluateSiteLimit(sub.limits.maxSites, used);
  if (!limit.canCreate) {
    const planName = sub.limits.planName || 'باقتك';
    throw httpError(403, `وصلت إلى الحد الأقصى لمواقع باقة ${planName} (${used}/${sub.limits.maxSites}). قم بترقية الباقة لإنشاء مواقع إضافية`, 'PLAN_LIMIT_REACHED');
  }
  return { sub, used, limit };
}

async function getSiteSummary(userId) {
  const [sites, sub] = await Promise.all([listSitesForUser(userId), getSubscriptionForUser(userId)]);
  const used = sites.length;
  const limits = sub?.limits ?? planLimitsFromRow(null);
  const limit = evaluateSiteLimit(limits.maxSites, used);
  return {
    sites, used, maxSites: limits.maxSites,
    unlimited: limits.maxSites === -1,
    remaining: limit.remaining, overLimit: limit.overLimit,
    canCreate: limit.canCreate && Boolean(sub && (sub.status === 'active' || sub.status === 'trialing')),
    plan: { id: limits.planId, name: limits.planName, price: limits.price, features: limits.features },
    subscription: sub ? { status: sub.status, renewsAt: sub.renewsAt, daysLeft: sub.daysLeft, isTrial: limits.planId === 'trial' } : null
  };
}

module.exports = {
  httpError, isPrivileged, listSitesForUser, userOwnsSite, linkUserToSite,
  getSubscriptionForUser, ensureTrialSubscription, assertCanCreateSite, getSiteSummary
};
