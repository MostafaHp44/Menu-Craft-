const cors = require('@fastify/cors');
const fp = require('fastify-plugin');

// Helper: strict origin validation for production
function isValidCorsOrigin(origin) {
  // Must be a non-empty string
  if (typeof origin !== 'string' || origin.length === 0) return false;

  // Must not be wildcard '*'
  if (origin === '*') return false;

  // Must use HTTP or HTTPS
  const httpsRe = /^https:/i;
  const httpRe = /^http:/i;
  if (!httpsRe.test(origin) && !httpRe.test(origin)) return false;

  try {
    const parsed = new URL(origin);
    // Must have a valid hostname
    if (!parsed.hostname) return false;
    // Must have no username or password
    if (parsed.username || parsed.password) return false;
    // Must have no non-root pathname (pathname must be '/' or empty)
    if (parsed.pathname !== '/' && parsed.pathname !== '') return false;
    // Must have no query string
    if (parsed.search !== null && parsed.search !== '') return false;
    // Must have no fragment
    if (parsed.hash) return false;
  } catch {
    return false;
  }

  return true;
}

async function corsPlugin(fastify, opts) {
  const corsOrigin = process.env.CORS_ORIGIN || '';

  // Production: CORS_ORIGIN must be explicitly configured
  // Development: preserve current local workflow
  let allowedOrigin;

  if (process.env.NODE_ENV === 'production') {
    // Reject empty or missing value
    if (!corsOrigin) {
      fastify.log.fatal('CORS_ORIGIN must be explicitly configured in production - cannot start');
      process.exit(1);
    }
    // Reject wildcard '*'
    if (corsOrigin === '*') {
      fastify.log.fatal('CORS_ORIGIN must not be wildcard "*" in production - cannot start');
      process.exit(1);
    }
    // Strict origin validation: HTTP/HTTPS, valid hostname, no credentials, no path/query/fragment
    if (!isValidCorsOrigin(corsOrigin)) {
      fastify.log.fatal('CORS_ORIGIN must be a valid HTTP/HTTPS origin without credentials, path, query string, or fragment');
      process.exit(1);
    }
    allowedOrigin = corsOrigin;
  } else {
    // Development: use configured origin or default to localhost
    allowedOrigin = corsOrigin || 'http://localhost:5173';
  }

  await fastify.register(cors, {
    origin: allowedOrigin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  });
}

// fastify-plugin يمنع الـ encapsulation — بدونه الهيدرز تُضاف للـ preflight فقط
// وتغيب من طلبات GET/POST الفعلية (ويفشل الاتصال من الفرونت بخطأ CORS)
module.exports = fp(corsPlugin, { name: 'cors-plugin' });