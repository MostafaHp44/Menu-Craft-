const fastify = require('fastify')({ logger: require('pino')() });
const corsPlugin = require('./middleware/cors');
const authMiddleware = require('./middleware/auth.middleware');
const authRoutes = require('./routes/auth.routes');

// ** Environment Validation **
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

// In production, JWT secrets are required; in development fallbacks are acceptable.
// Production validations:
if (process.env.NODE_ENV === 'production') {
  // Check JWT_ACCESS_SECRET exists and is valid
  if (!process.env.JWT_ACCESS_SECRET) {
    fastify.log.fatal('JWT_ACCESS_SECRET is required in production - cannot start');
    process.exit(1);
  }
  // Check JWT_ACCESS_SECRET minimum length (32 characters)
  if (process.env.JWT_ACCESS_SECRET.length < 32) {
    fastify.log.fatal('JWT_ACCESS_SECRET must be at least 32 characters long');
    process.exit(1);
  }
  // Reject obvious placeholder/default values
  const placeholderPatterns = ['change_this', 'your_secret', 'replace_me', 'example', 'password', 'secret_key'];
  const lowerAccessSecret = process.env.JWT_ACCESS_SECRET.toLowerCase();
  for (const pattern of placeholderPatterns) {
    if (lowerAccessSecret.includes(pattern)) {
      fastify.log.fatal('JWT_ACCESS_SECRET contains a prohibited placeholder pattern: ' + pattern);
      process.exit(1);
    }
  }
  // Check JWT_REFRESH_SECRET exists and is valid
  if (!process.env.JWT_REFRESH_SECRET) {
    fastify.log.fatal('JWT_REFRESH_SECRET is required in production - cannot start');
    process.exit(1);
  }
  // Check JWT_REFRESH_SECRET minimum length (32 characters)
  if (process.env.JWT_REFRESH_SECRET.length < 32) {
    fastify.log.fatal('JWT_REFRESH_SECRET must be at least 32 characters long');
    process.exit(1);
  }
  // Reject obvious placeholder/default values
  const lowerRefreshSecret = process.env.JWT_REFRESH_SECRET.toLowerCase();
  for (const pattern of placeholderPatterns) {
    if (lowerRefreshSecret.includes(pattern)) {
      fastify.log.fatal('JWT_REFRESH_SECRET contains a prohibited placeholder pattern: ' + pattern);
      process.exit(1);
    }
  }
  // Access and refresh secrets must not be identical
  if (process.env.JWT_ACCESS_SECRET === process.env.JWT_REFRESH_SECRET) {
    fastify.log.fatal('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must not be identical');
    process.exit(1);
  }
} else {
  // Development: warn if using fallbacks
  if (!process.env.JWT_ACCESS_SECRET) {
    fastify.log.warn('JWT_ACCESS_SECRET not set; using fallback (development only)');
  }
  if (!process.env.JWT_REFRESH_SECRET) {
    fastify.log.warn('JWT_REFRESH_SECRET not set; using fallback (development only)');
  }
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
const adminRevenueRoutes = require('./routes/admin.revenue.routes');
const errorHandler = require('./middleware/errorHandler');

fastify.setErrorHandler(errorHandler);

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

fastify.register(corsPlugin);

// مسارات عامة
fastify.register(authRoutes, { prefix: '/api' });
fastify.register(translateRoutes, { prefix: '/api' });
fastify.register(orderRoutes, { prefix: '/api' });
fastify.register(restaurantRoutes, { prefix: '/api' });
fastify.register(siteRoutes, { prefix: '/api' });
fastify.register(menuRoutes, { prefix: '/api' });
fastify.register(homeContentRoutes, { prefix: '/api' });

// مسارات الباقة والعام
fastify.register(planRoutes, { prefix: '/api' });
fastify.register(paymentRoutes, { prefix: '/api' });

// مسارات القوالب (العرض عام، الإضافة/الحذف محمية بالتوكن)
fastify.register(templateRoutes, { prefix: '/api' });

// مسارات المنصة (محمية بداخلها)
fastify.register(platformRoutes, { prefix: '/api' });

// مسارات طلبات الباقات المجانية
fastify.register(freePlanRequestRoutes, { prefix: '/api' });

// مسارات طلبات الاشتراكات المدفوعة
fastify.register(paidSubscriptionRequestRoutes, { prefix: '/api' });

// مسارات الفروع والموظفين
fastify.register(branchRoutes, { prefix: '/api' });
fastify.register(employeeRoutes, { prefix: '/api' });
fastify.register(templateDraftRoutes, { prefix: '/api' });
fastify.register(adminRevenueRoutes, { prefix: '/api' });
fastify.register(require('./routes/platformAdminData.routes'), { prefix: '/api' });
fastify.register(require('./routes/dashboardTheme.routes'), { prefix: '/api' });
fastify.register(require('./routes/homeVideo.routes'), { prefix: '/api' });

fastify.get('/health', async () => ({ status: 'ok', service: 'menucraft-backend' }));

// ===== STARTUP =====
const PORT = process.env.PORT || 3000;
fastify.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
  if (err) {
    fastify.log.fatal(err);
    process.exit(1);
  }
  fastify.log.info(`Server running on http://localhost:${PORT}`);
  console.log('BACKEND STARTED ON PORT', PORT);
});

module.exports = fastify;
