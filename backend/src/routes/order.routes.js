const {
  createHandler,
  listHandler,
  getByIdHandler,
  trackHandler,
  statusHandler,
  removeHandler
} = require('../controllers/order.controller');
const orderService = require('../services/order.service');

function orderRoutes(fastify, opts, done) {
  /* --- المسارات العامة (منيو الضيف) — auth ليست مطلوبة --- */
  // إنشاء طلب: ضيف من المنيو العام (بلا توكن)، أو موظف مسجّل الدخول
  // (channel=counter يتطلب ملكية) — optionalAuth يرفق request.user عند وجود
  // توكن صالح ولا يرفض طلب الضيف (P0 C-4).
  const optionalAuth = require('../middleware/optionalAuth.middleware');
  fastify.post('/orders', { preHandler: optionalAuth }, createHandler);
  // متابعة الطلب كضيف برمز آمن
  fastify.get('/public/orders/:id/track', trackHandler);

  /* --- مسارات لوحة تحكم المطعم (ملكية تُفحص في المتحكّم) --- */
  fastify.get('/orders', { preHandler: fastify.authMiddleware }, listHandler);
  fastify.get('/orders/sales-series/:restaurantId', { preHandler: fastify.authMiddleware }, async (req, reply) => {
    try {
      const restaurantId = req.params.restaurantId;
      const { userOwnsSite, isPrivileged } = require('../services/site.service');
      const owns = await userOwnsSite(req.user?.userId, restaurantId, req.user?.role);
      if (!owns && !isPrivileged(req.user?.role)) {
        return reply.status(403).send({ ok: false, error: 'لا تملك صلاحية على هذا المطعم', code: 'NOT_SITE_OWNER' });
      }
      const data = await orderService.getSalesSeries(restaurantId);
      return reply.send({ ok: true, data });
    } catch (e) {
      return reply.status(500).send({ ok: false, error: e.message });
    }
  });
  fastify.get('/orders/:id', { preHandler: fastify.authMiddleware }, getByIdHandler);
  fastify.patch('/orders/:id/status', { preHandler: fastify.authMiddleware }, statusHandler);
  fastify.delete('/orders/:id', { preHandler: fastify.authMiddleware }, removeHandler);

  /* --- منصة — عدد الطلبات المعلقة للسوبر أدمن --------------------------- */
  fastify.get('/admin/orders/pending-count', { preHandler: fastify.authMiddleware }, async (req, reply) => {
    try {
      const { isPrivileged } = require('../services/site.service');
      if (!isPrivileged(req.user?.role)) {
        return reply.status(403).send({ ok: false, error: 'Privileged access required', code: 'NOT_PRIVILEGED' });
      }
      const count = await orderService.getPendingOrdersCount();
      return reply.send({ ok: true, data: { count } });
    } catch (e) {
      return reply.status(500).send({ ok: false, error: e.message });
    }
  });

  done();
}

module.exports = orderRoutes;
