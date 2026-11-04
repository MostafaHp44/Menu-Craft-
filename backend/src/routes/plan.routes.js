const { listHandler, getByIdHandler, createHandler, updateHandler, deleteHandler } = require('../controllers/plan.controller');
const { requireSuperAdmin } = require('../middleware/roles');

function planRoutes(fastify, opts, done) {
  // Reads are public (landing page prices + previews); mutations are super-admin only.
  fastify.get('/platform/plans', listHandler);
  fastify.get('/platform/plans/:id', { preHandler: fastify.authMiddleware }, getByIdHandler);
  fastify.post('/platform/plans', { preHandler: [fastify.authMiddleware, requireSuperAdmin()] }, createHandler);
  fastify.put('/platform/plans/:id', { preHandler: [fastify.authMiddleware, requireSuperAdmin()] }, updateHandler);
  fastify.delete('/platform/plans/:id', { preHandler: [fastify.authMiddleware, requireSuperAdmin()] }, deleteHandler);

  done();
}

module.exports = planRoutes;
