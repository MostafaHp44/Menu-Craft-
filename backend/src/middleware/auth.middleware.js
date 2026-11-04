const { verifyAccessToken } = require('../utils/token');
const cookie = require('cookie');

async function authMiddleware(request, reply) {
  // المسارات العامة التي لا تحتاج توكن — لكل مسار METHOD محدد
  // حتى لا تصبح عملية الإنشاء (POST) على نفس المسار عامة بالخطأ
  const publicPaths = [
    { method: 'POST', path: '/api/auth/signup' },
    { method: 'POST', path: '/api/auth/signin' },
    { method: 'POST', path: '/api/auth/refresh' },
    { method: 'GET', path: '/health' },
    { method: 'GET', path: '/api/restaurants/:id' },
    { method: 'GET', path: '/api/restaurants/slug/:slug' },
    { method: 'GET', path: '/api/home-content' },
    { method: 'GET', path: '/api/platform/plans' },
    { method: 'GET', path: '/api/platform/plans/:id' },
    { method: 'GET', path: '/api/platform/templates' },
    // المنيو العام ورحلة الطلب كضيف (التحقق من الملكية/الحد داخل المتحكّمات)
    { method: 'GET', path: '/api/public/menu/:slug' },
    { method: 'POST', path: '/api/orders' },
    { method: 'GET', path: '/api/public/orders/:id/track' },
    { method: 'POST', path: '/api/public/orders/:id/pay' }
  ];

  const isPublic = publicPaths.some(({ method, path }) => {
    if (method !== request.method) return false;
    // دعم المسارات التي تحتوي على المعرفات الديناميكية
    const pattern = new RegExp('^' + path.replace(/:[^/]+/g, '[^/]+') + '$');
    return pattern.test(request.routerPath);
  });

  if (isPublic) return;

  let decoded = null;

  // 1. Read Authorization header (legacy Bearer support)
  const authHeader = request.headers.authorization || '';
  const [type, token] = authHeader.split(' ');
  if (type === 'Bearer' && token) {
    try {
      decoded = verifyAccessToken(token);
      request.user = decoded;
      return;
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return reply.status(401).send({ ok: false, error: 'انتهت صلاحية التوكن' });
      }
      return reply.status(401).send({ ok: false, error: 'توكن غير صالح' });
    }
  }

  // 2. Read HttpOnly cookie (primary mechanism)
  const cookieHeader = request.headers.cookie || '';
  const parsed = cookie.parse(cookieHeader);
  const accessCookie = parsed['access_token'];
  if (!accessCookie) {
    return reply.status(401).send({ ok: false, error: 'توكن مصادقة مطلوب' });
  }

  try {
    decoded = verifyAccessToken(accessCookie);
    request.user = decoded;
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return reply.status(401).send({ ok: false, error: 'انتهت صلاحية التوكن' });
    }
    return reply.status(401).send({ ok: false, error: 'توكن غير صالح' });
  }
}

module.exports = authMiddleware;
