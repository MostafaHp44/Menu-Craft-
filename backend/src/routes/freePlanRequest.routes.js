const {
  createHandler,
  listHandler,
  approveHandler,
  rejectHandler
} = require('../controllers/freePlanRequest.controller');

function freePlanRequestRoutes(fastify, opts, done) {
  // إنشاء طلب باقة مجانية (أي مستخدم مُسجل الدخول)
  fastify.post('/free-plan-requests', { preHandler: fastify.authMiddleware }, createHandler);

  // جلب جميع طلبات الباقات المجانية (للادارة فقط — supervisor/super_admin)
  fastify.get('/admin/free-plan-requests', { preHandler: fastify.authMiddleware }, listHandler);

  // الموافقة على طلب باقة مجانية (Super Admin فقط)
  fastify.patch('/admin/free-plan-requests/:requestId/approve', { preHandler: fastify.authMiddleware }, approveHandler);

  // rejection لطلب باقة مجانية (Super Admin فقط)
  fastify.patch('/admin/free-plan-requests/:requestId/reject', { preHandler: fastify.authMiddleware }, rejectHandler);

  done();
}

module.exports = freePlanRequestRoutes;