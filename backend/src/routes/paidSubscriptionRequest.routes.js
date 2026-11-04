const {
  createHandler,
  listHandler,
  approveHandler,
  rejectHandler
} = require('../controllers/paidSubscriptionRequest.controller');

function paidSubscriptionRequestRoutes(fastify, opts, done) {
  // إنشاء طلب اشتراك مدفوع (أي مستخدم مُسجل الدخول)
  fastify.post('/paid-subscription-requests', { preHandler: fastify.authMiddleware }, createHandler);

  // جلب طلبات الاشتراكات المدفوعة للمستخدم (ملفهم)
  fastify.get('/paid-subscription-requests', { preHandler: fastify.authMiddleware }, listHandler);

  // الموافقة على طلب اشتراك مدفوع (Super Admin فقط)
  fastify.patch('/admin/paid-subscription-requests/:requestId/approve', { preHandler: fastify.authMiddleware }, approveHandler);

  // rejection لطلب اشتراك مدفوع (Super Admin فقط)
  fastify.patch('/admin/paid-subscription-requests/:requestId/reject', { preHandler: fastify.authMiddleware }, rejectHandler);

  done();
}

module.exports = paidSubscriptionRequestRoutes;