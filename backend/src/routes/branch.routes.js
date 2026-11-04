const { listBranches, getBranch, createBranch, updateBranch } = require('../services/branch.service');

function isPlatformAdmin(user) {
  return user?.role === 'super_admin' || user?.role === 'admin';
}

/**
 * Resolve the restaurant for this request and make sure the caller owns it.
 * Platform admins may operate on any restaurant; everyone else is locked to
 * their own `restaurant_id` (tenant isolation). Fails closed.
 */
function resolveRestaurant(req, reply) {
  const requested = req.query?.restaurantId || req.body?.restaurantId;
  const own = req.user?.restaurant_id || req.user?.restaurantId;
  const rid = requested || own;

  if (!rid) {
    reply.status(400).send({ ok: false, error: 'restaurantId required' });
    return null;
  }

  if (!isPlatformAdmin(req.user) && String(rid) !== String(own)) {
    reply.status(403).send({ ok: false, error: 'ليست لديك صلاحية على هذا الموقع', code: 'NOT_SITE_OWNER' });
    return null;
  }

  return rid;
}

function branchRoutes(fastify, opts, done) {
  // List branches for restaurant (owner)
  fastify.get('/branches', { preHandler: fastify.authMiddleware }, async (req, reply) => {
    try {
      const rid = resolveRestaurant(req, reply);
      if (!rid) return;
      const data = await listBranches(rid);
      return reply.send({ ok: true, data });
    } catch (e) {
      req.log.error(e);
      reply.code(500).send({ ok: false, error: 'Internal error' });
    }
  });

  fastify.post('/branches', { preHandler: fastify.authMiddleware }, async (req, reply) => {
    try {
      const rid = resolveRestaurant(req, reply);
      if (!rid) return;
      await createBranch(rid, req.body);
      return reply.send({ ok: true, message: 'Branch created' });
    } catch (e) {
      req.log.error(e);
      reply.code(500).send({ ok: false, error: 'Internal error' });
    }
  });

  fastify.put('/branches/:id', { preHandler: fastify.authMiddleware }, async (req, reply) => {
    try {
      const rid = resolveRestaurant(req, reply);
      if (!rid) return;
      await updateBranch(rid, req.params.id, req.body);
      return reply.send({ ok: true, message: 'Branch updated' });
    } catch (e) {
      req.log.error(e);
      reply.code(500).send({ ok: false, error: 'Internal error' });
    }
  });

  done();
}

module.exports = branchRoutes;
