/**
 * خطأ مركزي موحّد.
 *
 * قاعدة الأمان (P1): أي خطأ داخلي (5xx) يعود للعميل بنص عام فقط — لا رسائل
 * قاعدة بيانات، ولا أسماء ملفات/دوال، ولا تفاصيل استثناء داخلية. التفاصيل
 * كاملة تُسجَّل في السجل (`request.log.error`) وتبقى للخادم وحده.
 *
 * رسائل 4xx التشغيلية (التحقق، الصلاحيات، الملكية) تبقى كما هي لأنها
 * موجّهة للمستخدم وليست كشفًا داخليًا.
 */
const GENERIC_SERVER_ERROR = 'Internal Server Error';

function errorHandler(err, request, reply) {
  request.log.error(err);

  // أخطاء التحقق من المدخلات (Zod) نعيدها 400 برسالة مقروءة
  if (err.name === 'ZodError') {
    const issues = Array.isArray(err.issues)
      ? err.issues.map((i) => `${i.path.join('.') || 'value'}: ${i.message}`).join(' | ')
      : 'بيانات غير صالحة';
    return reply.status(400).send({ ok: false, error: issues });
  }

  const status = err.statusCode || err.status || 500;
  const safe = status >= 500 ? GENERIC_SERVER_ERROR : (err.message || 'Bad Request');

  const payload = { ok: false, error: safe };
  // `code` يُعرض فقط للأخطاء المقصودة (4xx) — لا نمرّر أكواد أخطاء داخلية
  if (status < 500 && err.code && typeof err.code === 'string') payload.code = err.code;

  return reply.status(status).send(payload);
}

module.exports = errorHandler;
module.exports.GENERIC_SERVER_ERROR = GENERIC_SERVER_ERROR;
