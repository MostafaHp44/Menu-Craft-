const paymentService = require('../services/payment.service');
const { userOwnsSite } = require('../services/site.service');

function sendError(reply, err) {
  const payload = { ok: false, error: err.message };
  if (err.code) payload.code = err.code;
  return reply.status(err.status || 500).send(payload);
}

function paymentRoutes(fastify, opts) {
  /**
   * إنشاء جلسة دفع لاشتراك MenuCraft (باقات صاحب المطعم).
   * التفعيل لا يحدث هنا — فقط بـ Webhook موقّق من Stripe.
   */
  fastify.post('/billing/checkout', { preHandler: fastify.authMiddleware }, async (request, reply) => {
    try {
      const { planId } = request.body || {};
      if (!planId) return reply.status(400).send({ ok: false, error: 'معرف الباقة مطلوب', code: 'PLAN_REQUIRED' });
      const result = await paymentService.createSubscriptionCheckout(request.user.userId, planId);
      return reply.send({ ok: true, data: result });
    } catch (err) {
      return sendError(reply, err);
    }
  });

  /** حالة الفوترة: هل Stripe مهيأ؟ في أي وضع؟ + سجل المدفوعات */
  fastify.get('/billing/status', { preHandler: fastify.authMiddleware }, async (request, reply) => {
    try {
      const data = await paymentService.getBillingStatus(request.user.userId);
      return reply.send({ ok: true, data });
    } catch (err) {
      return sendError(reply, err);
    }
  });

  /**
   * Webhook Stripe — المصدر الوحيد الموثوق لتفعيل الاشتراكات وتأكيد مدفوعات الطلبات.
   * التحقق من التوقيع إلزامي؛ بدون STRIPE_WEBHOOK_SECRET يُرفض (لا دفع وهمي).
   */
  fastify.post('/payments/webhook', async (request, reply) => {
    const stripe = paymentService.getStripe();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripe || !webhookSecret) {
      return reply.status(503).send({
        ok: false,
        error: 'Webhook غير مهيأ: لا يوجد مفتاح Stripe أو سر Webhook',
        code: 'WEBHOOK_NOT_CONFIGURED'
      });
    }
    const signature = request.headers['stripe-signature'];
    let event;
    try {
      event = stripe.webhooks.constructEvent(request.rawBody || '', signature, webhookSecret);
    } catch (err) {
      // توقيع غير صالح = نرفض ولا نفعّل أي اشتراك أو دفع
      return reply.status(400).send({ ok: false, error: `Webhook Error: ${err.message}`, code: 'INVALID_SIGNATURE' });
    }
    try {
      const result = await paymentService.handleStripeEvent(event);
      return reply.send({ ok: true, received: true, ...result });
    } catch (err) {
      return sendError(reply, err);
    }
  });

  /**
   * دفع عميل مطعم للطلب (بطاقة/محفظة) — بمبلغ محسوب في الخادم.
   * يعيد clientSecret لصفحة الدفع الآمنة (Stripe Elements) — لا تُخزَّن بيانات بطاقات هنا.
   */
  fastify.post('/public/orders/:id/pay', async (request, reply) => {
    try {
      const result = await paymentService.createOrderPaymentIntent(request.params.id);
      return reply.send({ ok: true, data: result });
    } catch (err) {
      return sendError(reply, err);
    }
  });

  /** مدفوعات مطعم — بملكية الموقع */
  fastify.get('/payments/restaurant/:restaurantId', { preHandler: fastify.authMiddleware }, async (request, reply) => {
    try {
      const { restaurantId } = request.params;
      const owns = await userOwnsSite(request.user.userId, restaurantId, request.user.role);
      if (!owns) {
        return reply.status(403).send({ ok: false, error: 'ليست لديك صلاحية على هذا الموقع', code: 'NOT_SITE_OWNER' });
      }
      const payments = await paymentService.getPaymentsByRestaurant(restaurantId);
      return reply.send({ ok: true, data: payments });
    } catch (err) {
      return sendError(reply, err);
    }
  });
}

module.exports = paymentRoutes;
