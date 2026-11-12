const {
  listClientsHandler,
  listSubscriptionsHandler,
  getSubscriptionByRestaurantHandler,
  createSubscriptionHandler,
  updateSubscriptionHandler,
  statsHandler
} = require('../controllers/platform.controller');
const { getAdminSales, getAdminFinancial } = require('../services/adminRevenue.service');
const { getRestaurantDetailsForAdmin, deleteClientAccount } = require('../services/platform.service');
const { requireSuperAdmin } = require('../middleware/roles');
const { getMySQLPool } = require('../config/mysql');
const { createPlatformAdmin, deleteUserAccount } = require('../services/auth.service');

function platformRoutes(fastify, opts, done) {
  // Platform management is intentionally super_admin only. The singular
  // subscription route below remains tenant-scoped for a client's own site.
  const superAdminOnly = [fastify.authMiddleware, requireSuperAdmin()];
  fastify.get('/platform/clients', { preHandler: superAdminOnly }, listClientsHandler);
  fastify.get('/platform/subscriptions', { preHandler: superAdminOnly }, listSubscriptionsHandler);
  fastify.get('/platform/subscriptions/:restaurantId', { preHandler: fastify.authMiddleware }, getSubscriptionByRestaurantHandler);
  fastify.post('/platform/subscriptions', { preHandler: superAdminOnly }, createSubscriptionHandler);
  fastify.patch('/platform/subscriptions/:restaurantId', { preHandler: superAdminOnly }, updateSubscriptionHandler);
  fastify.get('/platform/stats', { preHandler: superAdminOnly }, statsHandler);

  // ---- NEW: Sales + Financial aggregation ----
  fastify.get('/platform/admin/sales', { preHandler: superAdminOnly }, async (req, reply) => {
    try {
      const period = req.query.period || 'month';
      const restaurantId = req.query.restaurantId ? String(req.query.restaurantId) : null;
      const data = await getAdminSales(period, restaurantId);
      return reply.send({ ok: true, data });
    } catch (e) { return reply.status(500).send({ ok: false, error: e.message }); }
  });
  fastify.get('/platform/admin/financial', { preHandler: superAdminOnly }, async (req, reply) => {
    try {
      const period = req.query.period || 'month';
      const data = await getAdminFinancial(period);
      return reply.send({ ok: true, data });
    } catch (e) { return reply.status(500).send({ ok: false, error: e.message }); }
  });
  // ---- NEW: Clients list for admin dashboard ----
  fastify.get('/platform/admin/clients', { preHandler: superAdminOnly }, listClientsHandler);

  // ---- NEW: تفاصيل كلاينت واحد (Sales) — مطعم + مالك + موظفون + فروع ----
  fastify.get('/platform/admin/clients/:restaurantId/details', { preHandler: superAdminOnly }, async (req, reply) => {
    try {
      const period = req.query.period || 'month';
      const data = await getRestaurantDetailsForAdmin(String(req.params.restaurantId), period);
      return reply.send({ ok: true, data });
    } catch (e) { return reply.status(e.status || 500).send({ ok: false, error: e.message }); }
  });

  // ---- NEW: حذف حساب كلاينت بالكامل (المالك + كل مطاعمه + موظفيه) ----
  // سجلات الفلوس (Orders/Payments/invoices/اشتراكات معتمدة) تفضل موجودة؛
  // المطعم اللي فيه طلبات/دفعات بيتحول لـ status='deleted' (tombstone) فيقفل الموقع فورًا.
  fastify.delete('/platform/admin/clients/:restaurantId', { preHandler: superAdminOnly }, async (req, reply) => {
    try {
      const data = await deleteClientAccount(String(req.params.restaurantId));
      return reply.send({ ok: true, data });
    } catch (e) { return reply.status(e.status || 500).send({ ok: false, error: e.message }); }
  });

  // ---- NEW: Users list (Team & Access) ----
  fastify.get('/platform/admin/users', { preHandler: superAdminOnly }, async (req, reply) => {
    try {
      const pool = await getMySQLPool();
      const [rows] = await pool.execute('SELECT id, name, email, role, restaurant_id, status, created_at FROM Users ORDER BY created_at DESC');
      return reply.send({ ok: true, data: rows });
    } catch (e) { return reply.status(500).send({ ok: false, error: e.message }); }
  });

  // ---- NEW: Platform stats (Home dashboard) ----
  fastify.get('/platform/admin/stats', { preHandler: superAdminOnly }, async (req, reply) => {
    try {
      const pool = await getMySQLPool();
      const [[agg]] = await pool.execute(`SELECT (SELECT COUNT(*) FROM Restaurants WHERE LOWER(COALESCE(status,'')) <> 'deleted') AS restaurants, (SELECT COUNT(*) FROM Users) AS users, (SELECT COUNT(*) FROM Subscriptions WHERE status IN ('active','trialing')) AS activeSubscriptions, (SELECT COALESCE(SUM(total),0) FROM Orders) AS orderRevenue`);
      return reply.send({ ok: true, data: agg });
    } catch (e) { return reply.status(500).send({ ok: false, error: e.message }); }
  });

  // ---- NEW: Payments list + summary ----
  fastify.get('/platform/admin/payments', { preHandler: superAdminOnly }, async (req, reply) => {
    try {
      const pool = await getMySQLPool();
      const [rows] = await pool.execute('SELECT * FROM Payments ORDER BY created_at DESC LIMIT 200');
      return reply.send({ ok: true, data: rows });
    } catch (e) { return reply.status(500).send({ ok: false, error: e.message }); }
  });

  fastify.get('/platform/admin/payments-summary', { preHandler: superAdminOnly }, async (req, reply) => {
    try {
      const pool = await getMySQLPool();
      const [rows] = await pool.execute('SELECT status, COUNT(*) AS count, COALESCE(SUM(amount),0) AS amount FROM Payments GROUP BY status');
      return reply.send({ ok: true, data: rows });
    } catch (e) { return reply.status(500).send({ ok: false, error: e.message }); }
  });

  // ---- NEW: Templates list for admin ----
  fastify.get('/platform/admin/templates', { preHandler: superAdminOnly }, async (req, reply) => {
    try {
      const pool = await getMySQLPool();
      const [rows] = await pool.execute('SELECT * FROM Templates ORDER BY created_at DESC');
      return reply.send({ ok: true, data: rows });
    } catch (e) { return reply.status(500).send({ ok: false, error: e.message }); }
  });

  // ---- NEW: إنشاء إداري/سوبر أدمن جديد من لوحة المنصة ----
  fastify.post('/platform/admins', { preHandler: superAdminOnly }, async (req, reply) => {
    try {
      const created = await createPlatformAdmin(req.body || {});
      return reply.status(201).send({ ok: true, data: created.user, accessToken: created.accessToken, refreshToken: created.refreshToken, message: 'تم إنشاء الحساب الإداري بنجاح' });
    } catch (e) { return reply.status(e.status || 500).send({ ok: false, error: e.message }); }
  });

  // ---- NEW: حذف حساب (مستخدم المنصة/صاحب مطعم) نهائياً ----
  fastify.delete('/platform/admin/users/:userId', { preHandler: superAdminOnly }, async (req, reply) => {
    try {
      const result = await deleteUserAccount(String(req.params.userId));
      return reply.send({ ok: true, ...result });
    } catch (e) { return reply.status(e.status || 500).send({ ok: false, error: e.message }); }
  });

  done();
}

module.exports = platformRoutes;
