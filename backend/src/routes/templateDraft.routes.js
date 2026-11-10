const { saveDraft, getDraft } = require('../services/templateDraft.service');

function isPlatformStaff(user) {
  return user?.role === 'super_admin' || user?.role === 'admin';
}

/**
 * مسارات مسودات القوالب — محمية بالتسجيل + الملكية (P1).
 * لا يمكن قراءة أو إعادة كتابة مسودة تعود لحساب آخر (403)،
 * وإدارة المنصة تقرأ كل المسودات.
 */
function draftRoutes(fastify, opts, done) {
  fastify.post('/draft', { preHandler: fastify.authMiddleware }, async (req, reply) => {
    const { token, data } = req.body || {};
    if (!token) return reply.status(400).send({ ok: false, error: 'token required', code: 'VALIDATION' });
    await saveDraft(token, data || {}, req.user?.userId || null);
    return reply.send({ ok: true });
  });

  fastify.get('/draft/:token', { preHandler: fastify.authMiddleware }, async (req, reply) => {
    const draft = await getDraft(req.params.token);
    if (!draft) return reply.send({ ok: true, data: null });

    const owner = draft.user_id && draft.user_id === req.user?.userId;
    if (!owner && !isPlatformStaff(req.user)) {
      return reply.status(403).send({ ok: false, error: 'ليست لديك صلاحية على هذه المسودة', code: 'FORBIDDEN' });
    }
    return reply.send({ ok: true, data: draft });
  });

  done();
}

module.exports = draftRoutes;
