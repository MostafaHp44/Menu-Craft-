const {
  listHandler,
  getByIdHandler,
  getBySlugHandler,
  createHandler,
  updateHandler,
  publishHandler,
  unpublishHandler,
  deleteHandler
} = require('../controllers/restaurant.controller');
const { subscriptionMiddleware } = require('../middleware/subscription.middleware');

function restaurantRoutes(fastify, opts, done) {
  // عام للجميع (للصفحات العامة)
  fastify.get('/restaurants/slug/:slug', getBySlugHandler);
  fastify.get('/restaurants/:id', getByIdHandler);

  // محمية بالتسجيل (للعملاء والأدمن)
  fastify.get('/restaurants', { preHandler: fastify.authMiddleware }, listHandler);
  fastify.post('/restaurants', { preHandler: fastify.authMiddleware }, createHandler);
  fastify.put('/restaurants/:id', { preHandler: fastify.authMiddleware }, updateHandler);
  // النشر يحتاج اشتراك فعال (active/trialing) además من تسجيل الدخول
  fastify.patch(
    '/restaurants/:id/publish',
    { preHandler: [fastify.authMiddleware, subscriptionMiddleware] },
    publishHandler
  );
  fastify.patch(
    '/restaurants/:id/unpublish',
    { preHandler: fastify.authMiddleware },
    unpublishHandler
  );
  fastify.delete('/restaurants/:id', { preHandler: fastify.authMiddleware }, deleteHandler);

  done();
}

module.exports = restaurantRoutes;
