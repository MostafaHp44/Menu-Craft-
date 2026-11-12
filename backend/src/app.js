const fastify = require('fastify')({ logger: require('pino')() });

// ** Environment Validation **
// تحميل .env ثم رفض الإقلاع بأي JWT secret افتراضي/ضعيف/محرّر (dev و prod معًا)
// — لا توجد قيم fallback في الكود إطلاقًا (إصلاح P0 C-1).
require('dotenv').config();
const { assertJwtSecrets } = require('./config/secrets');
assertJwtSecrets();

const corsPlugin = require('./middleware/cors');
const authMiddleware = require('./middleware/auth.middleware');

// In production, missing required environment variables must stop startup.
// In development, preserve the current local workflow.
const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];

let missingEnv = false;
for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    fastify.log.error('Missing required environment variable: ' + varName);
    missingEnv = true;
  }
}
if (missingEnv) {
  console.error('FATAL: missing required database environment variables - refusing to start');
  process.exit(1);
}
const translateRoutes = require('./routes/translate.routes');
const orderRoutes = require('./routes/order.routes');
const restaurantRoutes = require('./routes/restaurant.routes');
const siteRoutes = require('./routes/sites.routes');
const menuRoutes = require('./routes/menu.routes');
const platformRoutes = require('./routes/platform.routes');
const homeContentRoutes = require('./routes/home-content.routes');
const planRoutes = require('./routes/plan.routes');
const paymentRoutes = require('./routes/payment.routes');
const freePlanRequestRoutes = require('./routes/freePlanRequest.routes');
const paidSubscriptionRequestRoutes = require('./routes/paidSubscriptionRequest.routes');
const templateRoutes = require('./routes/template.routes');
const branchRoutes = require('./routes/branch.routes');
const employeeRoutes = require('./routes/employee.routes');
const templateDraftRoutes = require('./routes/templateDraft.routes');
const errorHandler = require('./middleware/errorHandler');
const registerRoutes = require('./routes');

fastify.setErrorHandler(errorHandler);

/**
 * شبكة أمان أخيرة (P1): أي استجابة 5xx لا تُظهر للعميل رسالة داخلية.
 * بعض المتحكّمات تبني `{ error: e.message }` يدويًا وتتجاوز معالج الأخطاء،
 * فنستبدل النص هنا برسالة عامة — والتفاصيل الكاملة تبقى في سجل الخادم فقط.
 */
fastify.addHook('onSend', async (_request, reply, payload) => {
  if (reply.statusCode < 500) return payload;
  if (typeof payload !== 'string' || payload.length === 0) return payload;
  let body;
  try {
    body = JSON.parse(payload);
  } catch (_) {
    return payload; // ليست استجابة JSON (مثل صفحة خطأ HTML) — لا نلمسها
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return payload;

  let changed = false;
  for (const key of ['error', 'message', 'details', 'stack', 'trace']) {
    if (key in body && body[key] !== 'Internal Server Error') {
      body[key] = 'Internal Server Error';
      changed = true;
    }
  }
  if ('code' in body) {
    delete body.code;
    changed = true;
  }
  return changed ? JSON.stringify(body) : payload;
});

// السماح بجسم JSON فارغ (يعاد ككائن فارغ بدل خطأ 400)
// + الاحتفاظ بالنص الخام في request.rawBody للتحقق من توقيع Stripe Webhook
fastify.removeContentTypeParser('application/json');
fastify.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
  const raw = typeof body === 'string' ? body.trim() : '';
  req.rawBody = raw; // نص خام مطلوب لـ stripe.webhooks.constructEvent
  if (!raw) return done(null, {});
  try {
    done(null, JSON.parse(raw));
  } catch (err) {
    err.statusCode = 400;
    done(err);
  }
});

// جعل الـ auth middleware متاح ك preHandler للمسارات المحمية
fastify.decorate('authMiddleware', authMiddleware);

const path = require('path');
const fs = require('fs');
const uploadsRoot = path.join(__dirname, '../public/uploads');
fs.mkdirSync(uploadsRoot, { recursive: true });
fs.mkdirSync(path.join(uploadsRoot, 'templates'), { recursive: true });

fastify.register(corsPlugin);

fastify.register(require('@fastify/multipart'), {
  limits: { fileSize: 40 * 1024 * 1024 },
});
fastify.register(require('@fastify/static'), {
  root: uploadsRoot,
  prefix: '/uploads/',
  decorateReply: false,
  fallthrough: false,
});

// ===== كوليكشن مسارات المنصة (API) — كل الرواتس في مكان واحد =====
fastify.register(registerRoutes, { prefix: '/api' });
// health check
fastify.get('/health', async () => ({ status: 'ok', service: 'menucraft-backend' }));

// ===== STARTUP (moved to server.js) =====
// app module exports fastify instance for server.js to listen
module.exports = fastify;
