const { signupHandler, signinHandler, refreshHandler, meHandler, logoutHandler } = require('../controllers/auth.controller');
const rateLimit = require('../middleware/rateLimiter');

async function authRoutes(fastify) {
  fastify.post('/auth/signup',
    { preHandler: [rateLimit.middleware({ max: 5, duration: '1h', identifier: 'combined' })] },
    signupHandler);
  fastify.post('/auth/employee-login',
    { preHandler: [rateLimit.middleware({ max: 10, duration: '15m', identifier: 'employee' })] },
    signinHandler);
  fastify.post('/auth/signin',
    { preHandler: [rateLimit.middleware({ max: 5, duration: '15m', identifier: 'combined' })] },
    signinHandler);
  fastify.post('/auth/refresh',
    { preHandler: [rateLimit.middleware({ max: 10, duration: '15m', identifier: 'user' })] },
    refreshHandler);
  fastify.post('/auth/logout', { preHandler: [rateLimit.middleware({ max: 3, duration: '15m', identifier: 'ip' })] }, logoutHandler);
  fastify.get('/auth/me', { preHandler: fastify.authMiddleware }, meHandler);
}

module.exports = authRoutes;
