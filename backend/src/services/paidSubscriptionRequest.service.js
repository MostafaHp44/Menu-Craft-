/**
 * PaidSubscriptionRequest — MariaDB / mysql2
 *
 * When a client requests a paid plan:
 *   1) a `paid_subscription_requests` row is created with status 'pending_payment'
 *   2) if the restaurant was `published`, its status is set to `pending` so the
 *      public site/menu stops immediately (getPublicMenuBySlug requires published).
 *
 * The request is NOT executed until the super admin approves it:
 *   3) approve → subscription upserted (active, +1 month), site status back to published
 *   4) reject  → request marked rejected, site stays `pending`
 */
const { getMySQLPool } = require('../config/mysql');

async function stopRestaurantSite(connection, restaurantId) {
  await connection.execute("UPDATE Restaurants SET status = 'pending' WHERE id = ? AND LOWER(status) = 'published'", [restaurantId]);
}

async function restoreRestaurantSite(connection, restaurantId) {
  await connection.execute("UPDATE Restaurants SET status = 'published' WHERE id = ? AND LOWER(status) = 'pending'", [restaurantId]);
}

/** Upsert the restaurant's current subscription to an active plan (approval step). */
async function activateSubscription(connection, { restaurantId, userId, planId, planName, price, intervalDays, planKey }) {
  const id = `sub-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const renews = new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000);
  await connection.execute(
    `INSERT INTO Subscriptions (id, user_id, restaurant_id, plan_id, plan_name, plan, price, status, started_at, renews_at, auto_renew, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'active', NOW(), ?, 1, NOW(), NOW())`,
    [id, userId || null, restaurantId, planId, planName, planKey, Number(price) || 0, renews]
  );
  return id;
}

async function createPaidSubscriptionRequest({ userId, restaurantId, planId, planName, price }) {
  if (!userId || !restaurantId || !planId) {
    const err = new Error('restaurantId and planId are required');
    err.status = 400;
    throw err;
  }
  const pool = await getMySQLPool();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [existing] = await connection.execute(
      "SELECT id FROM paid_subscription_requests WHERE user_id = ? AND plan_id = ? AND status = 'pending_payment'",
      [userId, planId]
    );
    if (existing.length > 0) {
      await connection.rollback();
      const err = new Error('لديك طلب اشتراك مدفوع pending بالفعل لهذه الباقة');
      err.status = 400;
      throw err;
    }
    const [planCheck] = await connection.execute('SELECT id, name, price, interval_type FROM plans WHERE id = ?', [planId]);
    if (!planCheck.length) {
      await connection.rollback();
      const err = new Error('الباقة غير موجودة');
      err.status = 404;
      throw err;
    }
    const dbPlan = planCheck[0];
    const requestId = `psr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    await connection.execute(
      'INSERT INTO paid_subscription_requests (id, user_id, restaurant_id, plan_id, plan_name, price, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [requestId, userId, restaurantId, planId, planName || dbPlan.name, Number(price ?? dbPlan.price ?? 0), 'pending_payment']
    );
    await stopRestaurantSite(connection, restaurantId);
    await connection.commit();
    return { requestId, status: 'pending_payment', planName: planName || dbPlan.name, price: Number(price ?? dbPlan.price ?? 0) };
  } catch (e) {
    try { await connection.rollback(); } catch (_) {}
    throw e;
  } finally {
    connection.release();
  }
}

/** Subscription requests of the current user (most recent first). Optional restaurantId filter. */
async function listUserPaidSubscriptionRequests(userId, { restaurantId } = {}) {
  const pool = await getMySQLPool();
  const c = await pool.getConnection();
  try {
    const clauses = ['user_id = ?'];
    const params = [userId];
    if (restaurantId) { clauses.push('restaurant_id = ?'); params.push(restaurantId); }
    const [rows] = await c.execute(
      `SELECT * FROM paid_subscription_requests WHERE ${clauses.join(' AND ')} ORDER BY created_at DESC LIMIT 50`,
      params
    );
    return rows;
  } finally { c.release(); }
}

/** Pending requests across the platform — visible to super admin only. */
async function listAllPaidSubscriptionRequests({ status } = {}) {
  const pool = await getMySQLPool();
  const c = await pool.getConnection();
  try {
    const clauses = [];
    const params = [];
    if (status) { clauses.push('psr.status = ?'); params.push(status); }
    const [rows] = await c.execute(
      `SELECT psr.*, r.slug AS restaurant_slug, r.name_en AS restaurant_name,
              u.name AS user_name, u.email AS user_email, p.name AS plan_display_name
       FROM paid_subscription_requests psr
       JOIN restaurants r ON r.id = psr.restaurant_id
       JOIN users u ON u.id = psr.user_id
       LEFT JOIN plans p ON p.id = psr.plan_id
       ${clauses.length ? 'WHERE ' + clauses.join(' AND ') : ''}
       ORDER BY psr.created_at DESC
       LIMIT 100`,
      params
    );
    return rows;
  } finally { c.release(); }
}

async function approvePaidSubscriptionRequest(requestId, adminId) {
  const pool = await getMySQLPool();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      "SELECT * FROM paid_subscription_requests WHERE id = ? AND status = 'pending_payment' FOR UPDATE",
      [requestId]
    );
    if (!rows.length) {
      await connection.rollback();
      const err = new Error('الطلب غير موجود أو ليس في حالة الانتظار');
      err.status = 404;
      throw err;
    }
    const reqRow = rows[0];
    const planKey = String(reqRow.plan_name || '').toLowerCase().replace(/[^a-z0-9]/g, '') || 'plan';
    const [plan] = await connection.execute('SELECT interval_type FROM plans WHERE id = ?', [reqRow.plan_id]);

    await activateSubscription(connection, {
      restaurantId: reqRow.restaurant_id,
      userId: reqRow.user_id,
      planId: reqRow.plan_id,
      planName: reqRow.plan_name,
      price: reqRow.price,
      intervalDays: plan.length && plan[0].interval_type === 'year' ? 365 : 30,
      planKey,
    });
    await connection.execute(
      "UPDATE paid_subscription_requests SET status = 'approved', admin_id = ?, activated_at = NOW(), updated_at = NOW() WHERE id = ?",
      [adminId || null, requestId]
    );
    // الموافقة على طلب ترقية/اشتراك مدفوع → يُفعَّل الطور (live) فعليًا مع تفعيل الباقة
    await connection.execute("UPDATE Restaurants SET mode = 'live' WHERE id = ?", [reqRow.restaurant_id]);
    // لا شيء آخر ينقص الموقع — status الخاص بالمستخدم: نشغل الموقع مرة أخرى
    await restoreRestaurantSite(connection, reqRow.restaurant_id);
    await connection.commit();
    return { approved: true, requestId, restaurantId: reqRow.restaurant_id };
  } catch (e) {
    try { await connection.rollback(); } catch (_) {}
    throw e;
  } finally { connection.release(); }
}

async function rejectPaidSubscriptionRequest(requestId, adminId, rejectionReason) {
  const pool = await getMySQLPool();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      "SELECT id, restaurant_id FROM paid_subscription_requests WHERE id = ? AND status = 'pending_payment' FOR UPDATE",
      [requestId]
    );
    if (!rows.length) {
      await connection.rollback();
      const err = new Error('الطلب غير موجود أو ليس في حالة الانتظار');
      err.status = 404;
      throw err;
    }
    await connection.execute(
      "UPDATE paid_subscription_requests SET status = 'rejected', admin_id = ?, rejection_reason = ?, updated_at = NOW() WHERE id = ?",
      [adminId || null, rejectionReason || null, requestId]
    );
    // الموقع يظل متوقفاً لحين طلب آخر أو موافقة أخرى
    await connection.commit();
    return { rejected: true, requestId };
  } catch (e) {
    try { await connection.rollback(); } catch (_) {}
    throw e;
  } finally { connection.release(); }
}

module.exports = { createPaidSubscriptionRequest, listUserPaidSubscriptionRequests, listAllPaidSubscriptionRequests, approvePaidSubscriptionRequest, rejectPaidSubscriptionRequest };
