const {
  listClientsHandler,
  listSubscriptionsHandler,
  getSubscriptionByRestaurantHandler,
  createSubscriptionHandler,
  updateSubscriptionHandler,
  statsHandler
} = require('../controllers/platform.controller');
const { requireSuperAdmin } = require('../middleware/roles');

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

  done();
}

module.exports = platformRoutes;
