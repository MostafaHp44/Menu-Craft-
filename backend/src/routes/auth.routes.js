const { signupHandler, signinHandler, refreshHandler, meHandler, logoutHandler } = require('../controllers/auth.controller');
const rateLimit = require('../middleware/rateLimiter');

/**
 * كل مسارات تسجيل الدخول (signin + employee-login) تتشارك نفس الدلاء:
 *   • دلو لكل (IP + بريد) → 5 محاولات / 15 دقيقة
 *   • دلو لكل IP         → 25 محاولة / 15 دقيقة (يمنع تدوير البُرد)
 * المفتاح لا يحتوي على المسار، فلا يمكن استخدام alias لفتح ميزانية جديدة.
 */
function loginRateLimiters() {
  return [
    rateLimit.middleware({ max: 5, duration: '15m', identifier: 'login' }),
    rateLimit.middleware({ max: 25, duration: '15m', identifier: 'login-ip' }),
  ];
}

async function authRoutes(fastify) {
  fastify.post('/auth/signup',
    { preHandler: [rateLimit.middleware({ max: 5, duration: '1h', identifier: 'combined' })] },
    signupHandler);
  fastify.post('/auth/employee-login',
    { preHandler: loginRateLimiters() },
    signinHandler);
  fastify.post('/auth/signin',
    { preHandler: loginRateLimiters() },
    signinHandler);
  fastify.post('/auth/refresh',
    // 'user' = per-user when authenticated, per-IP for anonymous callers
    { preHandler: [rateLimit.middleware({ max: 10, duration: '15m', identifier: 'user' })] },
    refreshHandler);
  // Logout is per-IP but must not lock out a whole venue behind one NAT address.
  fastify.post('/auth/logout', { preHandler: [rateLimit.middleware({ max: 30, duration: '15m', identifier: 'ip' })] }, logoutHandler);
  fastify.get('/auth/me', { preHandler: fastify.authMiddleware }, meHandler);
}

module.exports = authRoutes;
