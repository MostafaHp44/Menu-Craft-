const { getPool, sql } = require('../config/db');

/**
 * Creating a paid subscription request
 * - User selects Professional ($29/mo) or Business ($79/mo)
 * - Creates request with status 'pending_payment'
 * - Never activates a paid subscription automatically
 */
async function createPaidSubscriptionRequest(userId, restaurantId, planId, planName, price) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    // التحقق من عدم وجود طلب Pending سابق لنفس الباقة
    const existing = await pool.request()
      .input('userId', sql.NVarChar, userId)
      .input('planId', sql.NVarChar, planId)
      .query(`SELECT id FROM paid_subscription_requests WHERE user_id = @userId AND plan_id = @planId AND status = 'pending_payment'`);

    if (existing.recordset.length > 0) {
      await transaction.rollback();
      const err = new Error('لديك طلب اشتراك مدفوع Pending بالفعل لهذه الباقة');
      err.status = 400;
      throw err;
    }

    // التأكد من أن الباقة موجودة وقديمة
    const planCheck = await pool.request()
      .input('planId', sql.NVarChar, planId)
      .query(`SELECT id, name, price, is_active FROM Plans WHERE id = @planId AND is_active = 1`);

    if (planCheck.recordset.length === 0) {
      await transaction.rollback();
      const err = new Error('الباقة غير موجودة أو غير فعالة');
      err.status = 404;
      throw err;
    }

    // إنشاء الطلب
    const requestId = `ps-req-${Date.now().toString(36)}`;
    const result = await pool.request()
      .input('id', sql.NVarChar, requestId)
      .input('userId', sql.NVarChar, userId)
      .input('restaurantId', sql.NVarChar, restaurantId)
      .input('planId', sql.NVarChar, planId)
      .input('planName', sql.NVarChar, planName)
      .input('price', sql.Decimal(10, 2), price)
      .input('status', sql.NVarChar, 'pending_payment')
      .query(`
        INSERT INTO paid_subscription_requests (id, user_id, restaurant_id, plan_id, plan_name, price, status, created_at, updated_at)
        VALUES (@id, @userId, @restaurantId, @planId, @planName, @price, 'pending_payment', GETDATE(), GETDATE())
      `);

    await transaction.commit();
    return { ok: true, requestId: result.recordset[0].id };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

/**
 * جلب طلبات الاشتراكات المدفوعة للمستخدم الحالي
 */
async function listUserPaidSubscriptionRequests(userId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('userId', sql.NVarChar, userId)
    .query(`
      SELECT psr.*, p.name AS planDisplayName, p.price AS planPrice, p.interval_type
      FROM paid_subscription_requests psr
      JOIN Plans p ON p.id = psr.plan_id
      WHERE psr.user_id = @userId
      ORDER BY psr.created_at DESC
    `);
  return result.recordset;
}

/**
 * Approve a paid subscription request
 * - Activate the paid subscription manually by Super Admin
 * - Record the admin identity
 */
async function approvePaidSubscriptionRequest(requestId, adminId) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    // التحقق من أن الطلب exists ويوجد status pending_payment
    const reqCheck = await pool.request()
      .input('requestId', sql.NVarChar, requestId)
      .query(`SELECT * FROM paid_subscription_requests WHERE id = @requestId AND status = 'pending_payment'`);

    if (reqCheck.recordset.length === 0) {
      await transaction.rollback();
      const err = new Error('الطلب غير موجود أو已被 processed');
      err.status = 404;
      throw err;
    }

    const request = reqCheck.recordset[0];

    // تحديث حالة الطلب إلى active
    await pool.request()
      .input('requestId', sql.NVarChar, requestId)
      .input('adminId', sql.NVarChar, adminId)
      .query(`
        UPDATE paid_subscription_requests 
        SET status = 'active', admin_id = @adminId, activated_at = GETDATE(), updated_at = GETDATE()
        WHERE id = @requestId
      `);

    // إنشاء اشتراك فعلي في جدول Subscriptions
    const now = new Date().toISOString();
    const renewsAt = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(); // 30 days from now for monthly

    await pool.request()
      .input('userId', sql.NVarChar, request.user_id)
      .input('restaurantId', sql.NVarChar, request.restaurant_id)
      .input('planId', sql.NVarChar, request.plan_id)
      .input('planName', sql.NVarChar, request.plan_name)
      .input('price', sql.Decimal(10, 2), request.price)
      .input('status', sql.NVarChar, 'active')
      .input('renewsAt', sql.DateTime, renewsAt)
      .input('autoRenew', sql.Bit, 1)
      .input('startedAt', sql.DateTime, now)
      .query(`
        INSERT INTO Subscriptions (id, user_id, restaurant_id, plan_id, plan_name, price, status, started_at, renews_at, auto_renew, created_at, updated_at)
        VALUES (NEWID(), @userId, @restaurantId, @planId, @planName, @price, 'active', @startedAt, @renewsAt, @autoRenew, GETDATE(), GETDATE())
      `);

    // تحديث خطة المطعم
    await pool.request()
      .input('restaurantId', sql.NVarChar, request.restaurant_id)
      .input('plan', sql.NVarChar, request.plan_name.toLowerCase())
      .query(`UPDATE Restaurants SET [plan] = @plan, updated_at = GETDATE() WHERE id = @restaurantId`);

    await transaction.commit();
    return { ok: true, subscriptionActivated: true };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

/**
 * Reject a paid subscription request
 */
async function rejectPaidSubscriptionRequest(requestId, adminId, rejectionReason) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    // التحقق من أن الطلب exists ويوجد status pending_payment
    const reqCheck = await pool.request()
      .input('requestId', sql.NVarChar, requestId)
      .query(`SELECT * FROM paid_subscription_requests WHERE id = @requestId AND status = 'pending_payment'`);

    if (reqCheck.recordset.length === 0) {
      await transaction.rollback();
      const err = new Error('الطلب غير موجود أو已被 processed');
      err.status = 404;
      throw err;
    }

    // تحديث حالة الطلب إلى rejected
    await pool.request()
      .input('requestId', sql.NVarChar, requestId)
      .input('adminId', sql.NVarChar, adminId)
      .input('rejectionReason', sql.NVarChar, rejectionReason)
      .query(`
        UPDATE paid_subscription_requests 
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
  createPaidSubscriptionRequest,
  listUserPaidSubscriptionRequests,
  approvePaidSubscriptionRequest,
  rejectPaidSubscriptionRequest
};