const { listEmployees, createEmployee, updateEmployee, deactivateEmployee } = require('../services/employee.service');

function restaurantId(req, reply) {
  const own = req.user?.restaurant_id || req.user?.restaurantId;
  if (!own) { reply.code(403).send({ ok: false, error: 'restaurant context required' }); return null; }
  const requested = req.body?.restaurantId || req.query?.restaurantId;
  if (requested && String(requested) !== String(own)) { reply.code(403).send({ ok: false, error: 'cross-tenant denied' }); return null; }
  return own;
}

function employeeRoutes(fastify, opts, done) {
  const guarded = { preHandler: fastify.authMiddleware };
  fastify.get('/employees', guarded, async (q, r) => {
    try { const rid = restaurantId(q, r); if (!rid) return; const data = await listEmployees(rid); return r.send({ ok: true, data }); }
    catch (e) { return r.code(e.status || 500).send({ ok: false, error: e.message }); }
  });
  fastify.post('/employees', guarded, async (q, r) => {
    try {
      const rid = restaurantId(q, r); if (!rid) return;
      const data = await createEmployee(rid, q.body, q.user?.userId);
      return r.code(201).send({ ok: true, data });
    } catch (e) { return r.code(e.status || 500).send({ ok: false, error: e.message }); }
  });
  fastify.put('/employees/:id', guarded, async (q, r) => {
    try {
      const rid = restaurantId(q, r); if (!rid) return;
      const data = await updateEmployee(rid, q.params.id, q.body, q.user?.userId);
      return r.send({ ok: true, data });
    } catch (e) { return r.code(e.status || 500).send({ ok: false, error: e.message }); }
  });
  fastify.delete('/employees/:id', guarded, async (q, r) => {
    try {
      const rid = restaurantId(q, r); if (!rid) return;
      await deactivateEmployee(rid, q.params.id);
      return r.send({ ok: true });
    } catch (e) { return r.code(e.status || 500).send({ ok: false, error: e.message }); }
  });
  done();
}

module.exports = employeeRoutes;
