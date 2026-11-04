/**
 * MenuCraft — خدمة الدفع
 * ------------------------------------------------------------
 * قسمان منفصلان تمامًا:
 *
 * 1) دفع اشتراك صاحب المطعم إلى MenuCraft (الباقات).
 *    - يُنشئ جلسة دفع حقيقية عبر Stripe (Checkout Session).
 *    - الاشتراك لا يُفعَّل إلا بتأكيد موثوق من Stripe (Webhook موقّع).
 *    - اختيار الباقة أو إرسال "status=active" من المتصفح لا يفعّل شيئًا.
 *
 * 2) دفع عميل المطعم مقابل الطعام.
 *    - PaymentIntent بمبلغ محسوب في الخادم من المنيو.
 *    - الطلب يصبح Paid فقط بـ Webhook موقّق من Stripe.
 *    - لا تُخزَّن بيانات بطاقات في MenuCraft إطلاقًا.
 *
 * فصل وضع الاختبار عن الإنتاج: نمط Stripe يُشتق من بادئة المفتاح
 * (sk_test_… = test, sk_live_… = live) ويُعرض في /api/billing/status.
 */
const crypto = require('crypto');
const { getPool, sql } = require('../config/db');
const { normalizePlanKey, PLAN_SPECS, planLimitsFromRow } = require('../config/plans');

let stripeClient = null;
let stripeInitFailed = false;

function getStripe() {
  if (stripeClient) return stripeClient;
  if (stripeInitFailed) return null;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  try {
    const Stripe = require('stripe');
    stripeClient = new Stripe(key);
    return stripeClient;
  } catch {
    stripeInitFailed = true;
    return null;
  }
}

/** 'test' | 'live' | 'unconfigured' */
function stripeMode() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return 'unconfigured';
  if (key.startsWith('sk_test')) return 'test';
  if (key.startsWith('sk_live')) return 'live';
  return 'unknown';
}

function notConfiguredError() {
  const err = new Error('بوابة الدفع غير مهيأة على الخادم حاليًا (لا توجد مفاتيح Stripe). لن يتم تحصيل أي أموال');
  err.status = 503;
  err.code = 'PAYMENT_PROVIDER_NOT_CONFIGURED';
  return err;
}

/* ------------------------- تسجيل عمليات الدفع ------------------------- */

async function recordPayment({ restaurantId, subscriptionId, orderId, userId, amount, currency, status, method, stripePaymentId }) {
  const pool = await getPool();
  const id = `pay-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;
  await pool.request()
    .input('id', sql.NVarChar, id)
    .input('restaurantId', sql.NVarChar, restaurantId || null)
    .input('subscriptionId', sql.NVarChar, subscriptionId || null)
    .input('orderId', sql.NVarChar, orderId || null)
    .input('userId', sql.NVarChar, userId || null)
    .input('amount', sql.Decimal(10, 2), amount)
    .input('currency', sql.NVarChar, currency || 'USD')
    .input('status', sql.NVarChar, status)
    .input('method', sql.NVarChar, method)
    .input('stripePaymentId', sql.NVarChar, stripePaymentId || null)
    .query(`
      INSERT INTO Payments (id, restaurant_id, subscription_id, order_id, user_id, amount, currency, status, payment_method, stripe_payment_id)
      VALUES (@id, @restaurantId, @subscriptionId, @orderId, @userId, @amount, @currency, @status, @method, @stripePaymentId)
    `);
  return id;
}

async function setPaymentStatus(stripePaymentId, status) {
  const pool = await getPool();
  const result = await pool.request()
    .input('stripePaymentId', sql.NVarChar, stripePaymentId)
    .input('status', sql.NVarChar, status)
    .query('UPDATE Payments SET status = @status, updated_at = GETDATE() WHERE stripe_payment_id = @stripePaymentId');
  return result.rowsAffected[0] > 0;
}

/* --------------------- 1) اشتراك صاحب المطعم --------------------- */

/**
 * إنشاء جلسة دفع Stripe لباقة.
 * يعيد { url } لتوجيه المتصفح إلى صفحة Stripe الآمنة.
 * لا يفعّل الاشتراك — التفعيل من Webhook فقط.
 */
async function createSubscriptionCheckout(userId, planIdRaw) {
  const stripe = getStripe();
  if (!stripe) throw notConfiguredError();

  const planKey = normalizePlanKey(planIdRaw);
  const spec = PLAN_SPECS[planKey];
  if (!spec || spec.price <= 0) {
    const err = new Error('باقة غير صالحة أو لا تحتاج دفعًا (التجربة مجانية)');
    err.status = 400;
    err.code = 'INVALID_PLAN';
    throw err;
  }

  const pool = await getPool();
  // سعر الباقة يُقرأ من القاعدة (قدعدّله الأدمن) — لا يُؤخذ من المتصفح
  const planResult = await pool.request()
    .input('id', sql.NVarChar, spec.id)
    .query('SELECT id, name, price, currency, interval_type, features FROM Plans WHERE id = @id AND is_active = 1');
  if (planResult.recordset.length === 0) {
    const err = new Error('الباقة غير موجودة أو غير فعّالة');
    err.status = 404;
    err.code = 'PLAN_NOT_FOUND';
    throw err;
  }
  const planRow = planResult.recordset[0];
  const limits = planLimitsFromRow(planRow);
  const amount = limits.price;
  const currency = (planRow.currency || 'USD').toLowerCase();

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      price_data: {
        currency,
        product_data: { name: `Digital Menu ${limits.planName} - monthly` },
        unit_amount: Math.round(amount * 100)
      },
      quantity: 1
    }],
    metadata: {
      type: 'subscription',
      userId,
      planId: spec.id
    },
    // لا نعتمد على redirect من المتصفح للتفعيل — Webhook هو المصدر الموثوق
    success_url: `${process.env.APP_URL || 'http://localhost:5017'}/dashboard/subscription?billing=success`,
    cancel_url: `${process.env.APP_URL || 'http://localhost:5017'}/dashboard/subscription?billing=cancelled`
  });

  await recordPayment({
    userId,
    amount,
    currency: currency.toUpperCase(),
    status: 'pending',
    method: 'stripe_checkout',
    stripePaymentId: session.id
  });

  return { url: session.url, sessionId: session.id, amount, currency: currency.toUpperCase(), mode: stripeMode() };
}

/**
 * تفعيل اشتراك بعد تأكيد دفع موثوق (يُستدعى من Webhook الموقّع فقط).
 */
async function activateSubscriptionForUser(userId, planId, stripePaymentId, amount) {
  const pool = await getPool();
  const planKey = normalizePlanKey(planId);
  const spec = PLAN_SPECS[planKey];
  if (!spec) {
    const err = new Error('باقة غير معروفة');
    err.status = 400;
    throw err;
  }

  // مطعم المستخدم الأول (الأساسي) للربط العلائقي القديم
  const restResult = await pool.request()
    .input('userId', sql.NVarChar, userId)
    .query('SELECT TOP 1 restaurant_id FROM UserRestaurants WHERE user_id = @userId ORDER BY created_at ASC');
  const primaryRestaurantId = restResult.recordset[0]?.restaurant_id || null;

  const now = new Date();
  const renewsAt = new Date(now.getTime() + 30 * 24 * 3600 * 1000);

  const existing = await pool.request()
    .input('userId', sql.NVarChar, userId)
    .query('SELECT TOP 1 id FROM Subscriptions WHERE user_id = @userId ORDER BY started_at DESC');

  let subscriptionId;
  if (existing.recordset.length > 0) {
    subscriptionId = existing.recordset[0].id;
    await pool.request()
      .input('id', sql.NVarChar, subscriptionId)
      .input('planId', sql.NVarChar, spec.id)
      .input('planName', sql.NVarChar, spec.name)
      .input('price', sql.Decimal(10, 2), spec.price)
      .input('renewsAt', sql.DateTime, renewsAt)
      .query(`
        UPDATE Subscriptions
        SET plan_id = @planId, plan_name = @planName, [plan] = @planId, price = @price,
            status = 'active', renews_at = @renewsAt, updated_at = GETDATE()
        WHERE id = @id
      `);
  } else {
    subscriptionId = `sub-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;
    await pool.request()
      .input('id', sql.NVarChar, subscriptionId)
      .input('userId', sql.NVarChar, userId)
      .input('restaurantId', sql.NVarChar, primaryRestaurantId)
      .input('planId', sql.NVarChar, spec.id)
      .input('planName', sql.NVarChar, spec.name)
      .input('price', sql.Decimal(10, 2), spec.price)
      .input('renewsAt', sql.DateTime, renewsAt)
      .query(`
        INSERT INTO Subscriptions (id, user_id, restaurant_id, plan_id, plan_name, [plan], price, status, started_at, renews_at, auto_renew)
        VALUES (@id, @userId, @restaurantId, @planId, @planName, @planId, @price, 'active', GETDATE(), @renewsAt, 1)
      `);
  }

  // مزامنة تسمية الخطة في مواقع المستخدم (للعرض القديم) — لا يحذف ولا يتجاوز أي حد هنا
  await pool.request()
    .input('userId', sql.NVarChar, userId)
    .input('plan', sql.NVarChar, planKey)
    .query(`
      UPDATE r SET r.[plan] = @plan, r.updated_at = GETDATE()
      FROM Restaurants r
      JOIN UserRestaurants ur ON ur.restaurant_id = r.id AND ur.user_id = @userId
    `);

  if (stripePaymentId) {
    await setPaymentStatus(stripePaymentId, 'succeeded');
  }
  return { subscriptionId, plan: spec.name };
}

/* --------------------- 2) دفع عميل المطعم للطعام --------------------- */

/**
 * إنشاء PaymentIntent لطلب مطعم بمبلغ محسوب في الخادم (total من Orders).
 */
async function createOrderPaymentIntent(orderId) {
  const stripe = getStripe();
  if (!stripe) throw notConfiguredError();

  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.NVarChar, orderId)
    .query('SELECT id, restaurant_id, total, currency, payment_status FROM Orders WHERE id = @id');
  if (result.recordset.length === 0) {
    const err = new Error('الطلب غير موجود');
    err.status = 404;
    err.code = 'ORDER_NOT_FOUND';
    throw err;
  }
  const order = result.recordset[0];
  if (order.payment_status === 'paid') {
    const err = new Error('الطلب مدفوع بالفعل');
    err.status = 409;
    err.code = 'ALREADY_PAID';
    throw err;
  }

  const amount = Number(order.total || 0);
  const currency = (order.currency || 'USD').toLowerCase();
  const intent = await stripe.paymentIntents.create({
    amount: Math.max(1, Math.round(amount * 100)),
    currency,
    metadata: { type: 'order', orderId: order.id, restaurantId: order.restaurant_id },
    automatic_payment_methods: { enabled: true }
  });

  await recordPayment({
    restaurantId: order.restaurant_id,
    orderId: order.id,
    amount,
    currency: currency.toUpperCase(),
    status: 'pending',
    method: 'stripe',
    stripePaymentId: intent.id
  });

  return { clientSecret: intent.client_secret, paymentIntentId: intent.id, amount, currency: currency.toUpperCase(), mode: stripeMode() };
}

/**
 * معالجة حدث Webhook من Stripe (تُستدعى بعد التحقق من التوقيع في الراوتر).
 * هنا فقط يُعتبر الدفع "مؤكَّدًا".
 */
async function handleStripeEvent(event) {
  const type = event.type;
  const object = event.data && event.data.object;

  if (type === 'checkout.session.completed' && object) {
    const md = object.metadata || {};
    if (md.type === 'subscription' && md.userId && md.planId) {
      await setPaymentStatus(object.id, 'succeeded');
      await activateSubscriptionForUser(md.userId, md.planId, object.id, object.amount_total ? object.amount_total / 100 : null);
      return { handled: 'subscription_activated', userId: md.userId, planId: md.planId };
    }
  }

  if (type === 'payment_intent.succeeded' && object) {
    const md = object.metadata || {};
    if (md.type === 'subscription' && md.userId && md.planId) {
      await activateSubscriptionForUser(md.userId, md.planId, object.id, object.amount ? object.amount / 100 : null);
      return { handled: 'subscription_activated', userId: md.userId, planId: md.planId };
    }
    if (md.type === 'order' && md.orderId) {
      const pool = await getPool();
      await pool.request()
        .input('id', sql.NVarChar, md.orderId)
        .query(`UPDATE Orders SET payment_status = 'paid', updated_at = GETDATE() WHERE id = @id`);
      await setPaymentStatus(object.id, 'succeeded');
      return { handled: 'order_paid', orderId: md.orderId };
    }
    await setPaymentStatus(object.id, 'succeeded');
    return { handled: 'payment_recorded' };
  }

  if (type === 'payment_intent.payment_failed' && object) {
    await setPaymentStatus(object.id, 'failed');
    if (object.metadata && object.metadata.type === 'order' && object.metadata.orderId) {
      const pool = await getPool();
      await pool.request()
        .input('id', sql.NVarChar, object.metadata.orderId)
        .query(`UPDATE Orders SET payment_status = 'failed', updated_at = GETDATE() WHERE id = @id`);
    }
    return { handled: 'payment_failed' };
  }

  if (type === 'checkout.session.expired' && object) {
    await setPaymentStatus(object.id, 'expired');
    return { handled: 'session_expired' };
  }

  return { handled: 'ignored' };
}

/** حالة الفوترة الخاصة بالحساب (تعرضها واجهة الاشتراك) */
async function getBillingStatus(userId) {
  const pool = await getPool();
  const payments = await pool.request()
    .input('userId', sql.NVarChar, userId)
    .query(`
      SELECT TOP 20 p.id, p.amount, p.currency, p.status, p.payment_method, p.stripe_payment_id, p.created_at,
             p.subscription_id, p.order_id
      FROM Payments p
      WHERE p.user_id = @userId OR p.restaurant_id IN (SELECT restaurant_id FROM UserRestaurants WHERE user_id = @userId)
      ORDER BY p.created_at DESC
    `);
  return {
    provider: {
      name: 'stripe',
      configured: Boolean(process.env.STRIPE_SECRET_KEY),
      mode: stripeMode(),
      webhookConfigured: Boolean(process.env.STRIPE_WEBHOOK_SECRET)
    },
    payments: payments.recordset
  };
}

/** سجل مدفوعات مطعم (اشتراكات + طلباته) */
async function getPaymentsByRestaurant(restaurantId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('restaurantId', sql.NVarChar, restaurantId)
    .query('SELECT * FROM Payments WHERE restaurant_id = @restaurantId ORDER BY created_at DESC');
  return result.recordset;
}

module.exports = {
  getStripe,
  stripeMode,
  createSubscriptionCheckout,
  activateSubscriptionForUser,
  createOrderPaymentIntent,
  handleStripeEvent,
  getBillingStatus,
  recordPayment,
  getPaymentsByRestaurant
};
