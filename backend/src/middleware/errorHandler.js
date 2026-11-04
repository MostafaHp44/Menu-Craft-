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
  return reply.status(status).send({
    ok: false,
    error: err.message || 'Internal Server Error'
  });
}

module.exports = errorHandler;
