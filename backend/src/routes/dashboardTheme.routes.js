const svc = require('../services/dashboardTheme.service');

function isPlatformAdmin(user) {
  return user?.role === 'super_admin' || user?.role === 'admin';
}

function ownRestaurant(req) {
  return req.user?.restaurant_id || req.user?.restaurantId || null;
}

function resolveRestaurant(req, reply) {
  const requested = req.query?.restaurantId || req.body?.restaurantId;
  const rid = requested || ownRestaurant(req);
  if (!rid) {
    reply.status(400).send({ ok: false, error: 'restaurantId required' });
    return null;
  }
  if (!isPlatformAdmin(req.user) && String(rid) !== String(ownRestaurant(req))) {
    reply.status(403).send({ ok: false, error: 'ليست لديك صلاحية على هذا الموقع', code: 'NOT_SITE_OWNER' });
    return null;
  }
  return rid;
}

function routes(fastify, opts, done) {
  fastify.get('/dashboard-theme', { preHandler: fastify.authMiddleware }, async (req, reply) => {
    try {
      const rid = resolveRestaurant(req, reply);
      if (!rid) return;
      const data = await svc.getTheme(rid);
      return reply.send({ ok: true, data });
    } catch (e) {
      req.log.error(e);
      return reply.status(500).send({ ok: false, error: 'Internal error' });
    }
  });

  fastify.post('/dashboard-theme', { preHandler: fastify.authMiddleware }, async (req, reply) => {
    try {
      const rid = resolveRestaurant(req, reply);
      if (!rid) return;
      await svc.saveTheme(rid, req.body?.theme);
      return reply.send({ ok: true });
    } catch (e) {
      req.log.error(e);
      return reply.status(500).send({ ok: false, error: 'Internal error' });
    }
  });

  done();
}

module.exports = routes;
