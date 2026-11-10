const {
  listHandler,
  getByIdHandler,
  getBySlugHandler,
  createHandler,
  updateHandler,
  publishHandler,
  unpublishHandler,
  deleteHandler,
  importTemplateHandler,
  listTemplatesHandler,
  selectTemplateHandler,
  unselectTemplateHandler
} = require('../controllers/restaurant.controller');
const { subscriptionMiddleware } = require('../middleware/subscription.middleware');

function restaurantRoutes(fastify, opts, done) {
  // عامة للقراءة (صفحات عامة) — لكن المتحكّم يرفق هوية المستخدم عند توكن صالح
  // ليعرض السجل كاملًا للمالك/الإدارة ونسخة عامة للزائر (P1)
  fastify.get('/restaurants/slug/:slug', { preHandler: fastify.authMiddleware }, getBySlugHandler);
  fastify.get('/restaurants/:id', { preHandler: fastify.authMiddleware }, getByIdHandler);

  // محمية بالتسجيل (للعملاء والأدمن)
  fastify.get('/restaurants', { preHandler: fastify.authMiddleware }, listHandler);
  fastify.post('/restaurants', { preHandler: fastify.authMiddleware }, createHandler);
  fastify.put('/restaurants/:id', { preHandler: fastify.authMiddleware }, updateHandler);
  // استيراد template sample menu into draft_menu (tenant-scoped)
  fastify.post('/restaurants/:id/import-template', { preHandler: fastify.authMiddleware }, importTemplateHandler);

  // التمبليتات المختارة من صاحب المطعم (تبويب "قوالبي") — مخزّنة في قاعدة البيانات
  fastify.get('/restaurants/:id/templates', { preHandler: fastify.authMiddleware }, listTemplatesHandler);
  fastify.post('/restaurants/:id/templates', { preHandler: fastify.authMiddleware }, selectTemplateHandler);
  fastify.delete('/restaurants/:id/templates/:templateId', { preHandler: fastify.authMiddleware }, unselectTemplateHandler);

  // النشر يحتاج اشتراك فعال (active/trialing) thêm من تسجيل الدخول
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
