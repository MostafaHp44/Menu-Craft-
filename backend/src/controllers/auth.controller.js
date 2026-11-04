const { signup, signin, refresh, getMe } = require('../services/auth.service');
const cookie = require('cookie');
const rateLimiter = require('../middleware/rateLimiter');

function setAuthCookies(reply, accessToken, refreshToken) {
  const isProduction = process.env.NODE_ENV === 'production';
  const secure = isProduction; // secure only in production (HTTPS)
  
  reply.header('Set-Cookie', cookie.serialize('access_token', accessToken || '', {
    httpOnly: true,
    secure: secure,
    sameSite: 'lax',
    path: '/',
    maxAge: 900, // 15 minutes
  }));
  reply.header('Set-Cookie', cookie.serialize('refresh_token', refreshToken || '', {
    httpOnly: true,
    secure: secure,
    sameSite: 'lax',
    path: '/',
    maxAge: 604800, // 7 days
  }));
}

function getCookieValue(request, name) {
  const header = request.headers.cookie || '';
  const parsed = cookie.parse(header);
  return parsed[name] || null;
}

async function signupHandler(request, reply) {
  try {
    const result = await signup(request.body);
    setAuthCookies(reply, result.accessToken, result.refreshToken);
    return reply.send({ ok: true, user: result.user });
  } catch (err) {
    return reply.status(err.status || 500).send({ ok: false, error: err.message });
  }
}

async function signinHandler(request, reply) {
  try {
    const result = await signin(request.body);
    setAuthCookies(reply, result.accessToken, result.refreshToken);
    return reply.send({ ok: true, user: result.user });
  } catch (err) {
    return reply.status(err.status || 500).send({ ok: false, error: err.message });
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
    // Read the refresh token from the HttpOnly cookie
    const refreshToken = getCookieValue(request, 'refresh_token');

    if (!refreshToken) {
      // No refresh token present - clear cookies anyway and succeed
      return reply.send({ ok: true, message: 'لا يوجد توكن للLogout' });
    }

    // Revoke/consume the refresh token using atomic SET NX EX
    // This ensures the old token can no longer be used
    await rateLimiter.revokeRefreshToken(refreshToken);

    // Clear access and refresh cookies by setting them with maxAge=0
    const isProduction = process.env.NODE_ENV === 'production';
    const secure = isProduction; // secure only in production (HTTPS)

    reply.header('Set-Cookie', cookie.serialize('access_token', '', {
      httpOnly: true,
      secure: secure,
      sameSite: 'lax',
      path: '/',
      maxAge: 0, // Immediately expire
    }));

    reply.header('Set-Cookie', cookie.serialize('refresh_token', '', {
      httpOnly: true,
      secure: secure,
      sameSite: 'lax',
      path: '/',
      maxAge: 0, // Immediately expire
    }));

    return reply.send({ ok: true, message: 'تم تسجيل الخروج بنجاح' });
  } catch (err) {
    console.error('Logout error:', err.message);
    return reply.status(err.status || 500).send({ ok: false, error: err.message });
  }
}

module.exports = { signupHandler, signinHandler, refreshHandler, meHandler, logoutHandler };
