const { getSubscriptionByRestaurant } = require('../services/platform.service');

/**
 * Middleware يتحقق من وجود اشتراك فعال للمطعم قبل السماح بإجراءات
 * تحتاج اشتراك (مثل نشر المنيو أو إظهار اللينك العام للعميل).
 *
 * يرتبط restaurantId entweder من params أو من request.body.
 * لو مفيش اشتراك أو حالته expired → يرفض بـ 403.
 * لو الاشتراك active أو trialing → يمرر الطلب.
 */
async function subscriptionMiddleware(request, reply) {
  const restaurantId = request.params.restaurantId || request.params.id || request.body?.restaurantId;

  if (!restaurantId) {
    return reply.status(400).send({ ok: false, error: 'معرف المطعم مطلوب' });
  }

  try {
    const sub = await getSubscriptionByRestaurant(restaurantId);

    if (!sub) {
      return reply.status(403).send({
        ok: false,
        error: 'لا يوجد اشتراك نشط لهذا المطعم. يرجى اختيار باقة أولاً',
        code: 'NO_SUBSCRIPTION'
      });
    }

    if (sub.status === 'expired') {
      return reply.status(403).send({
        ok: false,
        error: 'انتهت صلاحية الاشتراك. يرجى التجديد',
        code: 'SUBSCRIPTION_EXPIRED'
      });
    }

    // الاشتراك فعال (active / trialing / past_due يمكن نقاشه، هنا نسمح بـ active و trialing فقط للنشر)
    if (sub.status !== 'active' && sub.status !== 'trialing') {
      return reply.status(403).send({
        ok: false,
        error: 'حالة الاشتراك غير نشطة، لا يمكن النشر',
        code: 'SUBSCRIPTION_NOT_ACTIVE'
      });
    }

    // إرفاق بيانات الاشتراك في الطلب للاستخدام لاحقًا لو لزم
    request.subscription = sub;
  } catch (err) {
    return reply.status(500).send({ ok: false, error: err.message });
  }
}

module.exports = { subscriptionMiddleware };
