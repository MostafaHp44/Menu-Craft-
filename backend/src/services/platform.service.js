const { getPool, sql } = require('../config/db');
const { z } = require('zod');

const subscriptionSchema = z.object({
  restaurantId: z.string().min(1),
  plan: z.enum(['trial', 'starter', 'professional', 'business']),
  price: z.number().nonnegative(),
  status: z.enum(['active', 'trialing', 'past_due', 'expired']),
  renewsAt: z.string().datetime()
});

async function getAllRestaurantsForAdmin() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT r.id, r.name_en AS name, r.slug, r.status, r.[plan], r.created_at, r.updated_at,
           u.name AS owner_name, u.email AS owner_email
    FROM Restaurants r
    LEFT JOIN Users u ON u.restaurant_id = r.id AND u.role = 'client'
    ORDER BY r.created_at DESC
  `);
  return result.recordset;
}

async function getSubscriptions() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT s.id, s.restaurant_id AS restaurantId, s.plan_name AS [plan], s.price, s.status,
           s.started_at AS startedAt, s.renews_at AS renewsAt, s.auto_renew AS autoRenew,
           r.name_en AS restaurantName
    FROM Subscriptions s
    LEFT JOIN Restaurants r ON r.id = s.restaurant_id
    ORDER BY s.started_at DESC
  `);
  return result.recordset;
}

const createSubscriptionSchema = z.object({
  restaurantId: z.string().min(1),
  planId: z.string().min(1),
  price: z.number().nonnegative(),
  status: z.enum(['active', 'trialing', 'past_due', 'expired']),
  renewsAt: z.string().datetime(),
  paymentIntentId: z.string().optional(),
  autoRenew: z.boolean().optional()
});

async function getSubscriptionByRestaurant(restaurantId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('restaurantId', sql.VarChar, restaurantId)
    .query(`
      SELECT s.id, s.restaurant_id AS restaurantId, s.plan_id AS planId, s.plan_name AS [plan],
             s.price, s.status, s.started_at AS startedAt, s.renews_at AS renewsAt,
             s.auto_renew AS autoRenew, s.created_at AS createdAt,
             p.name AS planDisplayName, p.interval_type AS intervalType, p.max_menu_items AS maxMenuItems,
             p.max_restaurants AS maxRestaurants, p.features AS planFeatures
      FROM Subscriptions s
      LEFT JOIN Plans p ON p.id = s.plan_id
      WHERE s.restaurant_id = @restaurantId
      ORDER BY s.started_at DESC
    `);

  if (result.recordset.length === 0) {
    return null;
  }

  const sub = result.recordset[0];
  return {
    ...sub,
    planFeatures: sub.planFeatures ? JSON.parse(sub.planFeatures) : {}
  };
}

async function createSubscription(input) {
  const parsed = createSubscriptionSchema.parse(input);
  const pool = await getPool();
  const now = new Date().toISOString();

  // التحقق من وجود المطعم
  const restaurantCheck = await pool.request()
    .input('restaurantId', sql.VarChar, parsed.restaurantId)
    .query('SELECT id, [plan] FROM Restaurants WHERE id = @restaurantId');

  if (restaurantCheck.recordset.length === 0) {
    const err = new Error('المطعم غير موجود');
    err.status = 404;
    throw err;
  }

  // جلب اسم الباقة من جدول Plans باستخدام planId
  const planResult = await pool.request()
    .input('planId', sql.VarChar, parsed.planId)
    .query('SELECT name, price FROM Plans WHERE id = @planId AND is_active = 1');

  if (planResult.recordset.length === 0) {
    const err = new Error('الباقة غير موجودة أو غير فعالة');
    err.status = 404;
    throw err;
  }

  const planName = planResult.recordset[0].name;
  const maxRestaurants = (planResult.recordset[0].max_restaurants ?? 1) || 1;

  const existing = await pool.request()
    .input('restaurantId', sql.VarChar, parsed.restaurantId)
    .query('SELECT id FROM Subscriptions WHERE restaurant_id = @restaurantId');

  let subscriptionId;
  if (existing.recordset.length > 0) {
    // تحديث الاشتراك الموجود
    await pool.request()
      .input('restaurantId', sql.VarChar, parsed.restaurantId)
      .input('planId', sql.VarChar, parsed.planId)
      .input('planName', sql.NVarChar, planName)
      .input('price', sql.Decimal(10, 2), parsed.price)
      .input('status', sql.NVarChar, parsed.status)
      .input('renewsAt', sql.DateTime, parsed.renewsAt)
      .input('autoRenew', sql.Bit, parsed.autoRenew ?? false)
      .input('updatedAt', sql.DateTime, now)
      .query(`
        UPDATE Subscriptions
        SET plan_id = @planId, plan_name = @planName, price = @price, status = @status,
            renews_at = @renewsAt, auto_renew = @autoRenew, updated_at = @updatedAt
        WHERE restaurant_id = @restaurantId
      `);
    subscriptionId = existing.recordset[0].id;
  } else {
    // إنشاء اشتراك جديد
    const insertResult = await pool.request()
      .input('restaurantId', sql.VarChar, parsed.restaurantId)
      .input('planId', sql.VarChar, parsed.planId)
      .input('planName', sql.NVarChar, planName)
      .input('price', sql.Decimal(10, 2), parsed.price)
      .input('status', sql.NVarChar, parsed.status)
      .input('startedAt', sql.DateTime, now)
      .input('renewsAt', sql.DateTime, parsed.renewsAt)
      .input('autoRenew', sql.Bit, parsed.autoRenew ?? false)
      .input('createdAt', sql.DateTime, now)
      .input('updatedAt', sql.DateTime, now)
      .query(`
        INSERT INTO Subscriptions (restaurant_id, plan_id, plan_name, price, status, started_at, renews_at, auto_renew, created_at, updated_at)
        OUTPUT INSERTED.id
        VALUES (@restaurantId, @planId, @planName, @price, @status, @startedAt, @renewsAt, @autoRenew, @createdAt, @updatedAt)
      `);
    subscriptionId = insertResult.recordset[0].id;
  }

  // تحديث خطة المطعم في جدول Restaurants
  await pool.request()
    .input('restaurantId', sql.VarChar, parsed.restaurantId)
    .input('plan', sql.NVarChar, String(planName).toLowerCase())
    .input('updatedAt', sql.DateTime, now)
    .query(`
      UPDATE Restaurants
      SET [plan] = @plan, updated_at = @updatedAt
      WHERE id = @restaurantId
    `);

  // تسجيل الدفع لو تم تمرير paymentIntentId
  if (parsed.paymentIntentId) {
    await pool.request()
      .input('restaurantId', sql.VarChar, parsed.restaurantId)
      .input('subscriptionId', sql.VarChar, subscriptionId)
      .input('stripePaymentId', sql.NVarChar, parsed.paymentIntentId)
      .input('amount', sql.Decimal(10, 2), parsed.price)
      .input('status', sql.NVarChar, parsed.status === 'active' ? 'succeeded' : 'pending')
      .input('paymentMethod', sql.NVarChar, 'stripe')
      .query(`
        INSERT INTO Payments (restaurant_id, subscription_id, stripe_payment_id, amount, currency, status, payment_method, created_at)
        VALUES (@restaurantId, @subscriptionId, @stripePaymentId, @amount, 'USD', @status, @paymentMethod, GETDATE())
      `);
  }

  return { ok: true, subscriptionId, plan: planName };
}

/**
 * تحديث جزئي للاشتراك — يكفي إرسال الحقول المراد تغييرها فقط.
 * (التجديد / إيقاف التجديد التلقائي / انتهاء الصلاحية / تغيير الباقة)
 */
async function updateSubscription(restaurantId, patch = {}) {
  const pool = await getPool();

  const existing = await pool.request()
    .input('restaurantId', sql.VarChar, restaurantId)
    .query('SELECT id, plan_name, price, status, renews_at, auto_renew FROM Subscriptions WHERE restaurant_id = @restaurantId');

  const now = new Date();
  const current = existing.recordset[0] || null;

  if (!current) {
    // لا يوجد اشتراك للتحديث — نشئ واحداً من الرقعة المُرسلة
    const plan = patch.plan || 'trial';
    const status = patch.status || 'active';
    const renewsAt = patch.renewsAt || now.toISOString();
    await pool.request()
      .input('restaurantId', sql.VarChar, restaurantId)
      .input('plan', sql.NVarChar, plan)
      .input('price', sql.Decimal(10, 2), patch.price ?? 0)
      .input('status', sql.NVarChar, status)
      .input('startedAt', sql.DateTime, now)
      .input('renewsAt', sql.DateTime, renewsAt)
      .input('autoRenew', sql.Bit, patch.autoRenew ?? (status === 'active' ? 1 : 0))
      .input('now', sql.DateTime, now)
      .query(`
        INSERT INTO Subscriptions (restaurant_id, plan_name, price, status, started_at, renews_at, auto_renew, created_at, updated_at)
        VALUES (@restaurantId, @plan, @price, @status, @startedAt, @renewsAt, @autoRenew, @now, @now)
      `);
  } else {
    // ابني قائمة التحديث ديناميكياً حتى لا نمسح حقولاً لم تُرسل
    const sets = [];
    const req = pool.request().input('restaurantId', sql.VarChar, restaurantId);
    const add = (column, type, value) => {
      sets.push(`${column} = @${column}`);
      req.input(column, type, value);
    };

    if (patch.plan !== undefined) add('plan_name', sql.NVarChar, patch.plan);
    if (patch.price !== undefined) add('price', sql.Decimal(10, 2), patch.price);
    if (patch.status !== undefined) add('status', sql.NVarChar, patch.status);
    if (patch.renewsAt !== undefined) add('renews_at', sql.DateTime, patch.renewsAt);
    if (patch.autoRenew !== undefined) add('auto_renew', sql.Bit, patch.autoRenew ? 1 : 0);

    sets.push('updated_at = @updatedAt');
    req.input('updatedAt', sql.DateTime, now);

    if (sets.length > 1) {
      await req.query(`UPDATE Subscriptions SET ${sets.join(', ')} WHERE restaurant_id = @restaurantId`);
    }
  }

  // مزامنة خطة المطعم في جدول Restaurants (فقط عند تغيّر الباقة)
  if (patch.plan !== undefined) {
    await pool.request()
      .input('restaurantId', sql.VarChar, restaurantId)
      .input('plan', sql.NVarChar, patch.plan)
      .input('updatedAt', sql.DateTime, now)
      .query(`
        UPDATE Restaurants
        SET [plan] = @plan, updated_at = @updatedAt
        WHERE id = @restaurantId
      `);
  }

  return { ok: true };
}

async function getPlatformStats() {
  const pool = await getPool();

  const restaurants = await pool.request().query('SELECT COUNT(*) AS count FROM Restaurants');
  const activeSubs = await pool.request().query("SELECT COUNT(*) AS count FROM Subscriptions WHERE status = 'active'");
  const totalRevenue = await pool.request().query("SELECT ISNULL(SUM(price), 0) AS total FROM Subscriptions");

  return {
    restaurants: restaurants.recordset[0].count,
    subscriptions: activeSubs.recordset[0].count,
    mrr: totalRevenue.recordset[0].total
  };
}

module.exports = {
  getAllRestaurantsForAdmin,
  getSubscriptions,
  getSubscriptionByRestaurant,
  createSubscription,
  updateSubscription,
  getPlatformStats
};
