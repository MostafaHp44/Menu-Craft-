const {
  createHandler,
  listHandler,
  approveHandler,
  rejectHandler
} = require('../controllers/freePlanRequest.controller');
const { requireSuperAdmin } = require('../middleware/roles');

function freePlanRequestRoutes(fastify, opts, done) {
  // إنشاء طلب باقة مجانية (أي مستخدم مُسجل الدخول)
  fastify.post('/free-plan-requests', { preHandler: fastify.authMiddleware }, createHandler);

  // جلب جميع طلبات الباقات المجانية (Super Admin فقط)
  fastify.get('/admin/free-plan-requests', { preHandler: [fastify.authMiddleware, requireSuperAdmin()] }, listHandler);

  // الموافقة على طلب باقة مجانية (Super Admin فقط)
  fastify.patch('/admin/free-plan-requests/:requestId/approve', { preHandler: [fastify.authMiddleware, requireSuperAdmin()] }, approveHandler);

  // رفض طلب باقة مجانية (Super Admin فقط)
  fastify.patch('/admin/free-plan-requests/:requestId/reject', { preHandler: [fastify.authMiddleware, requireSuperAdmin()] }, rejectHandler);

  done();
}

module.exports = freePlanRequestRoutes;
