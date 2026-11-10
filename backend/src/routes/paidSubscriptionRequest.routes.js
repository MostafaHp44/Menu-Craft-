const {
  createHandler,
  listHandler,
  listAllHandler,
  approveHandler,
  rejectHandler
} = require('../controllers/paidSubscriptionRequest.controller');
const { requireSuperAdmin } = require('../middleware/roles');

function paidSubscriptionRequestRoutes(fastify, opts, done) {
  // إنشاء طلب اشتراك مدفوع (أي مستخدم مسجل الدخول — مالك المطعم)
  fastify.post('/paid-subscription-requests', { preHandler: fastify.authMiddleware }, createHandler);

  // طلبات الاشتراكات المدفوعة الخاصة بالمستخدم الحالي
  fastify.get('/paid-subscription-requests', { preHandler: fastify.authMiddleware }, listHandler);

  // كل الطلبات (Super Admin فقط) — يغذي صفحة /admin/subscription-requests
  fastify.get('/admin/paid-subscription-requests', { preHandler: [fastify.authMiddleware, requireSuperAdmin()] }, listAllHandler);

  // الموافقة على طلب اشتراك مدفوع (Super Admin فقط)
  fastify.patch('/admin/paid-subscription-requests/:requestId/approve', { preHandler: [fastify.authMiddleware, requireSuperAdmin()] }, approveHandler);

  // الرفض (Super Admin فقط)
  fastify.patch('/admin/paid-subscription-requests/:requestId/reject', { preHandler: [fastify.authMiddleware, requireSuperAdmin()] }, rejectHandler);

  done();
}

module.exports = paidSubscriptionRequestRoutes;
