const { listBranches, getBranch, createBranch, updateBranch } = require('../services/branch.service');
const { normalizeRole, PLATFORM_ROLES } = require('../middleware/roles');
const { userOwnsSite } = require('../services/site.service');

/**
 * P2: branch mutations are owner/platform-admin actions. Employee roles
 * (cashier/kitchen/waiter) can READ branches of their own restaurant but
 * must not create or edit site structure. Mirrors requireEmployeeManager.
 */
async function requireBranchManager(request, reply) {
  const role = normalizeRole(request.user?.role);
  if (role === PLATFORM_ROLES.SUPER_ADMIN || role === PLATFORM_ROLES.ADMIN) return;
  if (role === PLATFORM_ROLES.CLIENT) {
    const rid = request.user?.restaurantId || request.user?.restaurant_id;
    if (rid && (await userOwnsSite(request.user?.userId, rid, role))) return;
  }
  return reply.code(403).send({ ok: false, error: 'هذه العملية غير مسموحة لحسابك', code: 'FORBIDDEN' });
}

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
    reply.status(400).send({ ok: false, error: 'restaurantId required', code: 'RESTAURANT_REQUIRED' });
    return null;
  }

  if (!isPlatformAdmin(req.user) && String(rid) !== String(own)) {
    reply.status(403).send({ ok: false, error: 'ليست لديك صلاحية على هذا الموقع', code: 'NOT_SITE_OWNER' });
    return null;
  }

  return rid;
}

function internalError(req, reply, e) {
  req.log.error(e);
  reply.code(500).send({ ok: false, error: 'Internal Server Error' });
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
      return internalError(req, reply, e);
    }
  });

  // Single branch — scoped to the caller's restaurant (لا يُقرأ فرع لمطعم آخر)
  fastify.get('/branches/:id', { preHandler: fastify.authMiddleware }, async (req, reply) => {
    try {
      const rid = resolveRestaurant(req, reply);
      if (!rid) return;
      const branch = await getBranch(rid, req.params.id);
      if (!branch) {
        return reply.status(404).send({ ok: false, error: 'الفرع غير موجود', code: 'NOT_FOUND' });
      }
      return reply.send({ ok: true, data: branch });
    } catch (e) {
      return internalError(req, reply, e);
    }
  });

  fastify.post('/branches', { preHandler: [fastify.authMiddleware, requireBranchManager] }, async (req, reply) => {
    try {
      const rid = resolveRestaurant(req, reply);
      if (!rid) return;
      const result = await createBranch(rid, req.body || {});
      return reply.send({ ok: true, data: result });
    } catch (e) {
      return internalError(req, reply, e);
    }
  });

  /**
   * تحديث فرع — PUT و PATCH معًا (الواجهة ترسل PATCH).
   *
   * P1: لا يُعاد نجاح كاذب. إذا لم تُحدَّث أي صفّة في القاعدة (فرع غير موجود،
   * أو تابع لمطعم آخر، أو جسم بلا حقول صالحة) يُعاد 404 بدل 200.
   */
  const updateHandler = async (req, reply) => {
    try {
      const rid = resolveRestaurant(req, reply);
      if (!rid) return;
      const result = await updateBranch(rid, req.params.id, req.body || {});
      if (!result.updated) {
        return reply.status(404).send({
          ok: false,
          error: result.reason === 'EMPTY_UPDATE' ? 'لا توجد حقول للتحديث' : 'الفرع غير موجود',
          code: result.reason === 'EMPTY_UPDATE' ? 'EMPTY_UPDATE' : 'NOT_FOUND',
        });
      }
      return reply.send({ ok: true, message: 'Branch updated' });
    } catch (e) {
      return internalError(req, reply, e);
    }
  };

  fastify.put('/branches/:id', { preHandler: [fastify.authMiddleware, requireBranchManager] }, updateHandler);
  fastify.patch('/branches/:id', { preHandler: [fastify.authMiddleware, requireBranchManager] }, updateHandler);

  done();
}

module.exports = branchRoutes;
