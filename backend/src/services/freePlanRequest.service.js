/**
 * FreePlanRequest — MariaDB / mysql2
 *
 * Owner requests the free plan (Starter):
 *   1) a `free_plan_requests` row is created with status 'pending'
 *   2) if the restaurant was `published`, status becomes `pending` (site stops)
 *   3) super admin approves → subscription set active on Starter + site back to published
 *   4) reject → stays `pending` (nothing is executed until accepted)
 */
const { getMySQLPool } = require('../config/mysql');

async function stopRestaurantSite(connection, restaurantId) {
  await connection.execute("UPDATE Restaurants SET status = 'pending' WHERE id = ? AND LOWER(status) = 'published'", [restaurantId]);
}

async function restoreRestaurantSite(connection, restaurantId) {
  await connection.execute("UPDATE Restaurants SET status = 'published' WHERE id = ? AND LOWER(status) = 'pending'", [restaurantId]);
}

async function createFreePlanRequest(userId, restaurantId) {
  if (!userId || !restaurantId) {
    const err = new Error('restaurantId required');
    err.status = 400;
    throw err;
  }
  const pool = await getMySQLPool();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [existing] = await connection.execute(
      "SELECT id FROM free_plan_requests WHERE user_id = ? AND restaurant_id = ? AND status = 'pending'",
      [userId, restaurantId]
    );
    if (existing.length) {
      await connection.rollback();
      const err = new Error('لديك طلب باقة مجانية pending بالفعل');
      err.status = 400;
      throw err;
    }
    await connection.execute(
      'INSERT INTO free_plan_requests (id, user_id, restaurant_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
      [`fpr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`, userId, restaurantId, 'pending']
    );
    await stopRestaurantSite(connection, restaurantId);
    await connection.commit();
    return { created: true };
  } catch (e) {
    try { await connection.rollback(); } catch (_) {}
    throw e;
  } finally { connection.release(); }
}

async function listFreePlanRequests(filters = {}) {
  const pool = await getMySQLPool();
  const connection = await pool.getConnection();
  try {
    const clauses = [];
    const params = [];
    if (filters.status) { clauses.push('fpr.status = ?'); params.push(filters.status); }
    if (filters.userId) { clauses.push('fpr.user_id = ?'); params.push(filters.userId); }
    const [rows] = await connection.execute(
      `SELECT fpr.*, r.slug AS restaurant_slug, r.name_en AS restaurant_name,
              u.name AS user_name, u.email AS user_email
       FROM free_plan_requests fpr
       JOIN restaurants r ON r.id = fpr.restaurant_id
       JOIN users u ON u.id = fpr.user_id
       ${clauses.length ? 'WHERE ' + clauses.join(' AND ') : ''}
       ORDER BY fpr.created_at DESC
       LIMIT 100`,
      params
    );
    return rows;
  } finally { connection.release(); }
}

async function approveFreePlanRequest(requestId, adminId) {
  const pool = await getMySQLPool();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      "SELECT * FROM free_plan_requests WHERE id = ? AND status = 'pending' FOR UPDATE",
      [requestId]
    );
    if (!rows.length) {
      await connection.rollback();
      const err = new Error('الطلب غير موجود أو ليس في حالة الانتظار');
      err.status = 404;
      throw err;
    }
    const reqRow = rows[0];
    const subId = `sub-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    await connection.execute(
      `INSERT INTO Subscriptions (id, user_id, restaurant_id, plan_id, plan_name, plan, price, status, started_at, renews_at, auto_renew, created_at, updated_at)
       VALUES (?, ?, ?, 'plan-starter', 'Starter', 'starter', 0, 'active', NOW(), NULL, 0, NOW(), NOW())`,
      [subId, reqRow.user_id, reqRow.restaurant_id]
    );
    await connection.execute(
      "UPDATE free_plan_requests SET status = 'approved', admin_id = ?, approved_at = NOW(), updated_at = NOW() WHERE id = ?",
      [adminId || null, requestId]
    );
    await restoreRestaurantSite(connection, reqRow.restaurant_id);
    await connection.commit();
    return { approved: true, requestId, restaurantId: reqRow.restaurant_id };
  } catch (e) {
    try { await connection.rollback(); } catch (_) {}
    throw e;
  } finally { connection.release(); }
}

async function rejectFreePlanRequest(requestId, adminId, rejectionReason) {
  const pool = await getMySQLPool();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      "SELECT id, restaurant_id FROM free_plan_requests WHERE id = ? AND status = 'pending' FOR UPDATE",
      [requestId]
    );
    if (!rows.length) {
      await connection.rollback();
      const err = new Error('الطلب غير موجود أو ليس في حالة الانتظار');
      err.status = 404;
      throw err;
    }
    await connection.execute(
      "UPDATE free_plan_requests SET status = 'rejected', admin_id = ?, rejection_reason = ?, updated_at = NOW() WHERE id = ?",
      [adminId || null, rejectionReason || null, requestId]
    );
    await connection.commit();
    return { rejected: true, requestId };
  } catch (e) {
    try { await connection.rollback(); } catch (_) {}
    throw e;
  } finally { connection.release(); }
}

module.exports = { createFreePlanRequest, listFreePlanRequests, approveFreePlanRequest, rejectFreePlanRequest };
