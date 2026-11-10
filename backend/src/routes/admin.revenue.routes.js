const adminRevenue = require('../services/adminRevenue.service');
const { requireSuperAdmin } = require('../middleware/roles');

/**
 * إيرادات مطعم محدّد لوحة السوبر أدمن.
 *
 * P1: المسار كان بلا مصادقة ويتراجع لدالة غير موجودة (500 يكشف رسالة داخلية).
 * الآن محمي بالتوكن + السوبر أدمن فقط، ويتحقق من وجود `restaurantId` قبل
 * التنفيذ — لا رسالة خطأ داخلية تصل للعميل.
 */
function adminRoutes(fastify, opts, done) {
  fastify.get('/revenue', { preHandler: [fastify.authMiddleware, requireSuperAdmin()] }, async (req, reply) => {
    const rid = req.query.restaurantId;
    if (!rid) {
      return reply.status(400).send({ ok: false, error: 'restaurantId required', code: 'VALIDATION' });
    }
    try {
      const data = await adminRevenue.getAdminRevenue(rid);
      return reply.send({ ok: true, data });
    } catch (e) {
      req.log.error(e);
      return reply.status(500).send({ ok: false, error: 'Internal Server Error' });
    }
  });
  done();
}

module.exports = adminRoutes;
