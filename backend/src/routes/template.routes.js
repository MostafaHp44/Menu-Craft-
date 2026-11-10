const {
  listPublicHandler,
  listAllHandler,
  createHandler,
  updateCustomHandler,
  deleteHandler,
} = require('../controllers/template.controller');
const {
  listOverridesHandler,
  getOverrideHandler,
  upsertOverrideHandler,
  deleteOverrideHandler,
  uploadHandler,
  listMediaHandler,
} = require('../controllers/templateMedia.controller');
const { requireSuperAdmin } = require('../middleware/roles');

function templateRoutes(fastify, opts, done) {
  // الزائر لا يحتاج توكن — هذا ما يملأ معرض القوالب + التعديلات الفعّالة على الصور/الهيرو
  fastify.get('/platform/templates', listPublicHandler);
  fastify.get('/platform/templates/overrides', listPublicHandler);
  // الإدارة: كل القوالب (بما فيها المعطّلة) + الإضافة والحذف محمية بالتوكن
  const superAdminOnly = [fastify.authMiddleware, requireSuperAdmin()];
  fastify.get('/platform/templates/all', { preHandler: superAdminOnly }, listAllHandler);
  fastify.post('/platform/templates', { preHandler: superAdminOnly }, createHandler);
  fastify.patch('/platform/templates/:id', { preHandler: superAdminOnly }, updateCustomHandler);
  fastify.delete('/platform/templates/:id', { preHandler: superAdminOnly }, deleteHandler);

  // ---- صور وفيديوهات التمبلت (رفع + تعديل هيرو وصور) ----
  fastify.post('/platform/templates/upload', { preHandler: superAdminOnly }, uploadHandler);
  fastify.get('/platform/templates/media', { preHandler: superAdminOnly }, listMediaHandler);
  fastify.get('/platform/templates/overrides-admin', { preHandler: superAdminOnly }, listOverridesHandler);
  fastify.get('/platform/templates/overrides/:baseId', { preHandler: superAdminOnly }, getOverrideHandler);
  fastify.put('/platform/templates/overrides/:baseId', { preHandler: superAdminOnly }, upsertOverrideHandler);
  fastify.delete('/platform/templates/overrides/:baseId', { preHandler: superAdminOnly }, deleteOverrideHandler);

  done();
}

module.exports = templateRoutes;
