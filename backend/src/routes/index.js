/**
 * كوليكشن مسارات المنصة — كل مسارات الـ API بسجّل هنا في مكان واحد.
 * الـ app يسجّلها مع prefix '/api'.
 * كل route file في /routes بيفتح plugin خاصه.
 */

function registerRoutes(fastify, opts, done) {
  // عام
  fastify.register(require('./auth.routes'));
  fastify.register(require('./translate.routes'));
  fastify.register(require('./order.routes'));
  fastify.register(require('./restaurant.routes'));
  fastify.register(require('./sites.routes'));
  fastify.register(require('./menu.routes'));

  // المنصة
  fastify.register(require('./platform.routes'));

  // المحتوى العام للصفحة الرئيسية / الباقات / المدفوع / الطلبات المجدولة
  fastify.register(require('./home-content.routes'));
  fastify.register(require('./plan.routes'));
  fastify.register(require('./payment.routes'));
  fastify.register(require('./freePlanRequest.routes'));
  fastify.register(require('./paidSubscriptionRequest.routes'));

  // القوالب
  fastify.register(require('./template.routes'));

  // الرفع (صور/فيديو)
  fastify.register(require('./uploads.routes'));

  // الفروع والموظفين والمالك
  fastify.register(require('./branch.routes'));
  fastify.register(require('./employee.routes'));
  fastify.register(require('./owner.routes'));
  fastify.register(require('./templateDraft.routes'));

  // التقارير المالية والمبيعات
  fastify.register(require('./admin.revenue.routes'));

  // الثيمات/الأدمن
  fastify.register(require('./dashboardTheme.routes'));
  fastify.register(require('./homeVideo.routes'));

  done();
}

module.exports = registerRoutes;
