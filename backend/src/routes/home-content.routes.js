const { getHandler, updateHandler } = require('../controllers/home-content.controller');
const { requirePlatformStaff } = require('../middleware/roles');

function homeContentRoutes(fastify, opts, done) {
  fastify.get('/home-content', getHandler);
  fastify.patch('/home-content/:lang', { preHandler: [fastify.authMiddleware, requirePlatformStaff()] }, updateHandler);

  done();
}

module.exports = homeContentRoutes;
