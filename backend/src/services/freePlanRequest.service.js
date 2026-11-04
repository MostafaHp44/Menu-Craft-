const { getPool, sql } = require('../config/db');

/**
 * Creating a free plan request
 * - prevents creation if there's already a Pending request for the same user
 * - links user to restaurant if needed
 */
async function createFreePlanRequest(userId, restaurantId) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    // Check for existing pending request
    const existing = await pool.request()
      .input('userId', sql.NVarChar, userId)
      .input('restaurantId', sql.NVarChar, restaurantId)
      .query(`SELECT id FROM free_plan_requests WHERE user_id = @userId AND status = 'pending'`);

    if (existing.recordset.length > 0) {
      await transaction.rollback();
      const err = new Error('لديك طلب Pending Waiting للموافقة المجانية بالفعل');
      err.status = 400;
      throw err;
    }

    // Create the request
    const requestId = `fp-req-${Date.now().toString(36)}`;
    const result = await pool.request()
      .input('id', sql.NVarChar, requestId)
      .input('userId', sql.NVarChar, userId)
      .input('restaurantId', sql.NVarChar, restaurantId)
      .input('status', sql.NVarChar, 'pending')
      .query(`
        INSERT INTO free_plan_requests (id, user_id, restaurant_id, status, created_at, updated_at)
        OUTPUT inserted.id
        VALUES (@id, @userId, @restaurantId, 'pending', GETDATE(), GETDATE())
      `);

    await transaction.commit();
    return { ok: true, requestId: result.recordset[0].id };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

/**
 * List all free plan requests (admin only)
 */
async function listFreePlanRequests(filters = {}) {
  const pool = await getPool();
  let query = `
    SELECT fpr.*, u.name AS userName, u.email AS userEmail, r.name_en AS restaurantName
    FROM free_plan_requests fpr
    JOIN Users u ON u.id = fpr.user_id
    JOIN Restaurants r ON r.id = fpr.restaurant_id
    WHERE 1=1
  `;
  let params = [];

  if (filters.status) {
    query += ` AND fpr.status = @status`;
    params.push({ name: '@status', type: sql.NVarChar, value: filters.status });
  }

  if (filters.userId) {
    query += ` AND fpr.user_id = @userId`;
    params.push({ name: '@userId', type: sql.NVarChar, value: filters.userId });
  }

  query += ` ORDER BY fpr.created_at DESC`;

  const result = await pool.request().query(query);
  return result.recordset;
}

/**
 * Approve a free plan request
 * - Creates trial subscription for the user
 * - Updates request status to approved
 * - Records who approved
 */
async function approveFreePlanRequest(requestId, adminId) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    // Check request exists and is pending
    const reqCheck = await pool.request()
      .input('requestId', sql.NVarChar, requestId)
      .query(`SELECT * FROM free_plan_requests WHERE id = @requestId AND status = 'pending'`);

    if (reqCheck.recordset.length === 0) {
      await transaction.rollback();
      const err = new Error('الطلب غير موجود أو已被 processed');
      err.status = 404;
      throw err;
    }

    const request = reqCheck.recordset[0];

    // Update request status to approved
    await pool.request()
      .input('requestId', sql.NVarChar, requestId)
      .input('adminId', sql.NVarChar, adminId)
      .query(`
        UPDATE free_plan_requests 
        SET status = 'approved', admin_id = @adminId, approved_at = GETDATE(), updated_at = GETDATE()
        WHERE id = @requestId
      `);

    // Create trial subscription for the user
    const now = new Date().toISOString();
    const renewsAt = new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString();

    await pool.request()
      .input('userId', sql.NVarChar, request.user_id)
      .input('restaurantId', sql.NVarChar, request.restaurant_id)
      .input('planId', sql.NVarChar, 'trial')
      .input('planName', sql.NVarChar, 'Free Trial')
      .input('status', sql.NVarChar, 'trialing')
      .input('renewsAt', sql.DateTime, renewsAt)
      .input('autoRenew', sql.Bit, 0)
      .input('price', sql.Decimal(10, 2), 0)
      .input('startedAt', sql.DateTime, now)
      .query(`
        INSERT INTO Subscriptions (id, user_id, restaurant_id, plan_id, plan_name, [plan], price, status, started_at, renews_at, auto_renew, created_at, updated_at)
        VALUES (NEWID(), @userId, @restaurantId, @planId, @planName, 'trial', 0, 'trialing', @startedAt, @renewsAt, @autoRenew, GETDATE(), GETDATE())
      `);

    // Update restaurant plan
    await pool.request()
      .input('restaurantId', sql.NVarChar, request.restaurant_id)
      .input('plan', sql.NVarChar, 'trial')
      .query(`UPDATE Restaurants SET [plan] = 'trial', updated_at = GETDATE() WHERE id = @restaurantId`);

    await transaction.commit();
    return { ok: true, subscriptionActivated: true };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

/**
 * Reject a free plan request
 */
async function rejectFreePlanRequest(requestId, adminId, rejectionReason) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    // Check request exists and is pending
    const reqCheck = await pool.request()
      .input('requestId', sql.NVarChar, requestId)
      .query(`SELECT * FROM free_plan_requests WHERE id = @requestId AND status = 'pending'`);

    if (reqCheck.recordset.length === 0) {
      await transaction.rollback();
      const err = new Error('الطلب غير موجود أو已被 processed');
      err.status = 404;
      throw err;
    }

    // Update request status to rejected
    await pool.request()
      .input('requestId', sql.NVarChar, requestId)
      .input('adminId', sql.NVarChar, adminId)
      .input('rejectionReason', sql.NVarChar, rejectionReason)
      .query(`
        UPDATE free_plan_requests 
        SET status = 'rejected', rejection_reason = @rejectionReason, admin_id = @adminId, updated_at = GETDATE()
        WHERE id = @requestId
      `);

    await transaction.commit();
    return { ok: true };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

module.exports = {
  createFreePlanRequest,
  listFreePlanRequests,
  approveFreePlanRequest,
  rejectFreePlanRequest
};