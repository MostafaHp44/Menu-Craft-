const { verifyAccessToken } = require('../utils/token');
const { isAccessTokenRevoked } = require('./rateLimiter');
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
    // قراءة الإعداد المنشور لموقع عام (الكتابة PUT محمية بالملكية داخل المتحكّم)
    { method: 'GET', path: '/api/sites/:slug' },
    // المنيو العام ورحلة الطلب كضيف (التحقق من الملكية/الحد داخل المتحكّمات)
    { method: 'GET', path: '/api/public/menu/:slug' },
    { method: 'POST', path: '/api/orders' },
    { method: 'GET', path: '/api/public/orders/:id/track' },
    { method: 'POST', path: '/api/public/orders/:id/pay' }
  ];

  // هذه المسارات محمية بالتوكن دائمًا — لا يجوز معاملتها كمسارات عامة
  const HARD_AUTH = new Set(['/api/sites/summary', '/api/sites/can-create']);

  const isPublic = !HARD_AUTH.has(request.routerPath) && publicPaths.some(({ method, path }) => {
    if (method !== request.method) return false;
    // دعم المسارات التي تحتوي على المعرفات الديناميكية
    const pattern = new RegExp('^' + path.replace(/:[^/]+/g, '[^/]+') + '$');
    return pattern.test(request.routerPath);
  });

  // المسارات العامة لا تُرفض بدون توكن، لكن ما زال مطلوبًا معرفة "من" يطلبها
  // حتى يقرر المتحكّم كم من بيانات السجل تُعرض (مثل GET /api/restaurants/:id).
  // الهوية هنا اختيارية: توكن غائب/منتهي = زائر، ولا يُرفض الطلب.
  if (isPublic) {
    await attachOptionalUser(request);
    return;
  }

  // 1. Read Authorization header (legacy Bearer support)
  const authHeader = request.headers.authorization || '';
  const [type, token] = authHeader.split(' ');
  if (type === 'Bearer' && token) {
    try {
      const decoded = verifyAccessToken(token);
      if (await isAccessTokenRevoked(token)) {
        return reply.status(401).send({ ok: false, error: 'توكن غير صالح' });
      }
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
    const decoded = verifyAccessToken(accessCookie);
    if (await isAccessTokenRevoked(accessCookie)) {
      return reply.status(401).send({ ok: false, error: 'توكن غير صالح' });
    }
    request.user = decoded;
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return reply.status(401).send({ ok: false, error: 'انتهت صلاحية التوكن' });
    }
    return reply.status(401).send({ ok: false, error: 'توكن غير صالح' });
  }
}

/**
 * يرفق `request.user` عند وجود توكن صالح على مسار عام — بلا أي رفض.
 * أي خطأ (غائب/منتهي/تالف/ملغى) يُبتلع بصمت فيبقى الطلب عامًا والمستخدم زائرًا.
 */
async function attachOptionalUser(request) {
  try {
    const authHeader = request.headers.authorization || '';
    const [type, headerToken] = authHeader.split(' ');
    let token = null;
    if (type === 'Bearer' && headerToken) {
      token = headerToken;
    } else {
      const parsed = cookie.parse(request.headers.cookie || '');
      token = parsed['access_token'] || null;
    }
    if (!token) return;
    const decoded = verifyAccessToken(token);
    if (await isAccessTokenRevoked(token)) return;
    request.user = decoded;
  } catch (_) {
    /* زائر — لا يُرفق مستخدم */
  }
}

module.exports = authMiddleware;
