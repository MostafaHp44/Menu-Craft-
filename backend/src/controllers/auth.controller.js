const { signup, signin, refresh, getMe } = require('../services/auth.service');
const cookie = require('cookie');
const rateLimiter = require('../middleware/rateLimiter');
const { verifyAccessToken, verifyRefreshToken, ACCESS_EXPIRES_SECONDS, REFRESH_EXPIRES_SECONDS } = require('../utils/token');
const { ttlFromExp } = rateLimiter;

function setAuthCookies(reply, accessToken, refreshToken) {
  const isProduction = process.env.NODE_ENV === 'production';
  const secure = isProduction; // secure only in production (HTTPS)
  
  reply.header('Set-Cookie', cookie.serialize('access_token', accessToken || '', {
    httpOnly: true,
    secure: secure,
    sameSite: 'lax',
    path: '/',
    maxAge: ACCESS_EXPIRES_SECONDS,
  }));
  reply.header('Set-Cookie', cookie.serialize('refresh_token', refreshToken || '', {
    httpOnly: true,
    secure: secure,
    sameSite: 'lax',
    path: '/',
    maxAge: REFRESH_EXPIRES_SECONDS,
  }));
}

function getCookieValue(request, name) {
  const header = request.headers.cookie || '';
  const parsed = cookie.parse(header);
  return parsed[name] || null;
}

function getAccessTokenValue(request) {
  const parsed = cookie.parse(request.headers.cookie || '');
  if (parsed['access_token']) return parsed['access_token'];
  const [type, token] = String(request.headers.authorization || '').split(' ');
  return type === 'Bearer' && token ? token : null;
}

/**
 * الحقول الظاهرة للمستخدم لازم تكون مفهومة — نخفي رسائل MySQL الخام
 * (ER_DUP_ENTRY, ER_…) خلف رسالة عربية واضحة، ونسيب أخطاء المنطق
 * (validation / بيانات دخول) برسالتها الأصلية.
 */
function sendAuthError(reply, err, fallback) {
  const code = err.code || '';
  const status = err.status || 500;
  if (code === 'ER_DUP_ENTRY') {
    return reply.status(409).send({ ok: false, error: 'البريد الإلكتروني مستخدم مسبقًا' });
  }
  if (status < 500) {
    return reply.status(status).send({ ok: false, error: err.message });
  }
  console.error(`${fallback}:`, code || err.name || '', err.message);
  return reply.status(500).send({ ok: false, error: fallback });
}

async function signupHandler(request, reply) {
  try {
    const result = await signup(request.body);
    setAuthCookies(reply, result.accessToken, result.refreshToken);
    return reply.send({ ok: true, user: result.user });
  } catch (err) {
    return sendAuthError(reply, err, 'تعذّر إنشاء الحساب، حاول مرة أخرى');
  }
}

async function signinHandler(request, reply) {
  try {
    const result = await signin(request.body);
    setAuthCookies(reply, result.accessToken, result.refreshToken);
    return reply.send({ ok: true, user: result.user });
  } catch (err) {
    return sendAuthError(reply, err, 'تعذّر تسجيل الدخول، حاول مرة أخرى');
  }
}

async function refreshHandler(request, reply) {
  try {
    const refreshToken = getCookieValue(request, 'refresh_token') || (request.body || {}).refreshToken;
    const result = await refresh(refreshToken);
    setAuthCookies(reply, result.accessToken, result.refreshToken);
    return reply.send({ ok: true, ...result });
  } catch (err) {
    return reply.status(err.status || 500).send({ ok: false, error: err.message });
  }
}

/** الجلسة الحالية: الحساب + مواقعه + اشتراكه */
async function meHandler(request, reply) {
  try {
    const data = await getMe(request.user.userId);
    return reply.send({ ok: true, data });
  } catch (err) {
    return reply.status(err.status || 500).send({ ok: false, error: err.message });
  }
}

async function logoutHandler(request, reply) {
  try {
    const refreshToken = getCookieValue(request, 'refresh_token');
    const accessToken = getAccessTokenValue(request);

    const isProduction = process.env.NODE_ENV === 'production';
    const secure = isProduction; // secure only in production (HTTPS)
    const clearCookies = () => {
      // نُرسل كلتا الكوكيز بقيمة منتهية — بدونه تظل access_token حيّة
      // حتى 15 دقيقة فيعود المستخدم ("خرج لكن رجع") كلما أُمُر بالـ refresh
      reply.header('Set-Cookie', cookie.serialize('access_token', '', {
        httpOnly: true,
        secure,
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      }));
      reply.header('Set-Cookie', cookie.serialize('refresh_token', '', {
        httpOnly: true,
        secure,
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      }));
    };

    // Revoke the access token itself (not just the cookies). Otherwise a stolen
    // or already-issued access token stays valid for its remaining 15 minutes.
    if (accessToken) {
      try {
        const decoded = verifyAccessToken(accessToken);
        await rateLimiter.revokeAccessToken(
          accessToken,
          ttlFromExp(decoded.exp, ACCESS_EXPIRES_SECONDS)
        );
      } catch (_) {
        // Already expired/invalid — its cookie is cleared below anyway.
      }
    }

    if (refreshToken) {
      let refreshTtl = REFRESH_EXPIRES_SECONDS;
      try {
        const decoded = verifyRefreshToken(refreshToken);
        refreshTtl = ttlFromExp(decoded.exp, REFRESH_EXPIRES_SECONDS);
      } catch (_) {
        // Invalid/expired token: keep the default bound for the denylist entry.
      }
      await rateLimiter.revokeRefreshToken(refreshToken, refreshTtl);
    }

    // Clear access and refresh cookies by setting them with maxAge=0
    clearCookies();

    return reply.send({ ok: true, message: 'تم تسجيل الخروج بنجاح' });
  } catch (err) {
    console.error('Logout error:', err.message);
    return reply.status(err.status || 500).send({ ok: false, error: err.message });
  }
}

module.exports = { signupHandler, signinHandler, refreshHandler, meHandler, logoutHandler };
