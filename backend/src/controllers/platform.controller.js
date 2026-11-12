const {
  getAllRestaurantsForAdmin,
  getSubscriptions,
  getSubscriptionByRestaurant,
  createSubscription,
  updateSubscription,
  getPlatformStats
} = require('../services/platform.service');

/**
 * حراسة الأدوار: تعديل اشتراكات/خطط المنصة مسؤولية السوبر أدمن فقط.
 * العميل لا يفعّل اشتراكًا مدفوعًا بنفسه — طريقته الوحيدة: /api/billing/checkout
 * ثم تأكيد Stripe الموثوق (Webhook).
 */
function requireSuperAdmin(request, reply) {
  if (request.user?.role !== 'super_admin') {
    reply.status(403).send({
      ok: false,
      error: 'هذه العملية مخصصة لإدارة المنصة فقط',
      code: 'ADMIN_ONLY'
    });
    return false;
  }
  return true;
}

/** أخطاء التحقق (zod) تُعرض كطلب خاطئ 400 بدل 500 */
function httpStatus(err) {
  return err?.name === 'ZodError' ? 400 : err?.status || 500;
}

function httpMessage(err) {
  if (err?.name === 'ZodError') {
    return err.errors?.[0]?.message || 'بيانات غير صالحة';
  }
  const status = err?.status || err?.statusCode || 500;
  // خطأ داخلي (5xx) — لا تُعرض رسالته للعميل (P1)، التفاصيل في السجل فقط
  if (status >= 500) return 'Internal Server Error';
  return err.message || 'Bad Request';
}

async function listClientsHandler(request, reply) {
  try {
    if (!requireSuperAdmin(request, reply)) return;
    const clients = await getAllRestaurantsForAdmin();
    return reply.send({ ok: true, data: clients });
  } catch (err) {
    return reply.status(httpStatus(err)).send({ ok: false, error: httpMessage(err) });
  }
}

async function listSubscriptionsHandler(request, reply) {
  try {
    if (!requireSuperAdmin(request, reply)) return;
    const subs = await getSubscriptions();
    return reply.send({ ok: true, data: subs });
  } catch (err) {
    return reply.status(httpStatus(err)).send({ ok: false, error: httpMessage(err) });
  }
}

async function getSubscriptionByRestaurantHandler(request, reply) {
  try {
    const { restaurantId } = request.params;
    // غير الأدمن: يُقرأ اشتراك موقعه فقط (يُمنع تجاوز الحساب)
    if (request.user?.role !== 'super_admin' && request.user?.role !== 'admin') {
      const { userOwnsSite } = require('../services/site.service');
      const owns = await userOwnsSite(request.user?.userId, restaurantId, request.user?.role);
      if (!owns) {
        return reply.status(403).send({ ok: false, error: 'ليست لديك صلاحية على هذا الموقع', code: 'NOT_SITE_OWNER' });
      }
    }
    const sub = await getSubscriptionByRestaurant(restaurantId);
    // لا اشتراك = حالة طبيعية (مطعم جديد) وليست خطأً — 200 مع data: null
    // حتى لا تُسجَّل أخطاء شبكة في المتصفح عند فحص حالة الاشتراك
    return reply.send({ ok: true, data: sub ?? null });
  } catch (err) {
    return reply.status(httpStatus(err)).send({ ok: false, error: httpMessage(err) });
  }
}

async function createSubscriptionHandler(request, reply) {
  try {
    // إنشاء اشتراك يدويًا = إجراء إدارة (comp/manual) — لا يُفعّل اشتراكًا مدفوعًا دون Stripe
    if (!requireSuperAdmin(request, reply)) return;
    const { restaurantId, planId, price, status, renewsAt, paymentIntentId, autoRenew } = request.body;
    const result = await createSubscription({
      restaurantId,
      planId,
      price,
      status,
      renewsAt,
      paymentIntentId,
      autoRenew
    });
    return reply.status(201).send({ ok: true, ...result, message: 'تم إنشاء الاشتراك بنجاح' });
  } catch (err) {
    return reply.status(httpStatus(err)).send({ ok: false, error: httpMessage(err) });
  }
}

async function updateSubscriptionHandler(request, reply) {
  try {
    // التحديث اليدوي (انتهاء/إلغاء/تجديد) مسؤولية الإدارة أيضًا
    if (!requireSuperAdmin(request, reply)) return;
    // restaurantId يأتي من المسار: PATCH /platform/subscriptions/:restaurantId
    const restaurantId = request.params.restaurantId || request.body?.restaurantId;
    if (!restaurantId) {
      return reply.status(400).send({ ok: false, error: 'معرف المطعم مطلوب' });
    }
    // تحديث جزئي: الحقول غير المُرسلة تبقى كما هي
    const { restaurantId: _ignored, ...raw } = request.body || {};
    // قبول camelCase من الفرونت (renewsAt/autoRenew/…) — قاعدة البيانات تقرأ
    // snake_case فقط، وكان أي مفتاح آخر يُتجاهل بصمت بدون خطأ
    const ALIASES = { renewsAt: 'renews_at', autoRenew: 'auto_renew', planId: 'plan_id', paymentIntentId: 'payment_intent_id' };
    const patch = { ...raw };
    for (const [from, to] of Object.entries(ALIASES)) {
      if (patch[from] !== undefined && patch[to] === undefined) {
        patch[to] = patch[from];
        delete patch[from];
      }
    }
    await updateSubscription(restaurantId, patch);
    return reply.send({ ok: true, message: 'تم تحديث الاشتراك' });
  } catch (err) {
    return reply.status(httpStatus(err)).send({ ok: false, error: httpMessage(err) });
  }
}

async function statsHandler(request, reply) {
  try {
    const stats = await getPlatformStats();
    return reply.send({ ok: true, data: stats });
  } catch (err) {
    return reply.status(httpStatus(err)).send({ ok: false, error: httpMessage(err) });
  }
}

module.exports = {
  listClientsHandler,
  listSubscriptionsHandler,
  getSubscriptionByRestaurantHandler,
  createSubscriptionHandler,
  updateSubscriptionHandler,
  statsHandler
};
