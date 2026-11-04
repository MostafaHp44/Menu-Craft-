const {
  createHandler,
  listHandler,
  getByIdHandler,
  trackHandler,
  statusHandler,
  removeHandler
} = require('../controllers/order.controller');

function orderRoutes(fastify, opts, done) {
  /* --- المسارات العامة (منيو الضيف) — auth ليست مطلوبة --- */
  // إنشاء طلب: ضيف من المنيو العام، أو موظف المطعم (channel=counter يتطلب ملكية)
  fastify.post('/orders', createHandler);
  // متابعة الطلب كضيف برمز آمن
  fastify.get('/public/orders/:id/track', trackHandler);

  /* --- مسارات لوحة تحكم المطعم (ملكية تُفحص في المتحكّم) --- */
  fastify.get('/orders', { preHandler: fastify.authMiddleware }, listHandler);
  fastify.get('/orders/:id', { preHandler: fastify.authMiddleware }, getByIdHandler);
  fastify.patch('/orders/:id/status', { preHandler: fastify.authMiddleware }, statusHandler);
  fastify.delete('/orders/:id', { preHandler: fastify.authMiddleware }, removeHandler);

  done();
}

module.exports = orderRoutes;
