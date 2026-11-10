const { translateText } = require('../services/translate.service');

function translateRoutes(fastify, opts, done) {
  /**
   * P2: هذا المسار مُستدعى من داخل الخادم فقط (menu.service) ولا يستخدمه
   * أي ملف في الواجهة. بدون مصادقة كان بابًا مفتوحًا لاستنزاف حصة خدمة
   * الترجمة الخارجية — الآن للمستخدمين المسجّلين فقط، وبلا تسريب تفاصيل
   * داخلية في رسالة الخطأ.
   */
  fastify.post('/translate', { preHandler: fastify.authMiddleware }, async (req, reply) => {
    try {
      const { text, target } = req.body || {};
      if (!text || !target) return reply.status(400).send({ ok: false, error: 'text and target required' });
      const result = await translateText(text, target);
      reply.send({ ok: true, translated: result });
    } catch (e) {
      req.log.error(e);
      reply.status(502).send({ ok: false, error: 'translation service unavailable', code: 'TRANSLATE_FAILED' });
    }
  });
  done();
}

module.exports = translateRoutes;
