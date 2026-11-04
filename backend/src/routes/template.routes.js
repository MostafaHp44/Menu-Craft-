const {
  listPublicHandler,
  listAllHandler,
  createHandler,
  deleteHandler
} = require('../controllers/template.controller');
const { requireSuperAdmin } = require('../middleware/roles');

function templateRoutes(fastify, opts, done) {
  // الزائر لا يحتاج توكن — هذا ما يملأ معرض القوالب
  fastify.get('/platform/templates', listPublicHandler);
  // الإدارة: كل القوالب (بما فيها المعطّلة) + الإضافة والحذف محمية بالتوكن
  const superAdminOnly = [fastify.authMiddleware, requireSuperAdmin()];
  fastify.get('/platform/templates/all', { preHandler: superAdminOnly }, listAllHandler);
  fastify.post('/platform/templates', { preHandler: superAdminOnly }, createHandler);
  fastify.delete('/platform/templates/:id', { preHandler: superAdminOnly }, deleteHandler);

  done();
}

module.exports = templateRoutes;
