const { saveDraft, getDraft } = require('../services/templateDraft.service');
function draftRoutes(fastify, opts, done) {
  fastify.post('/draft', async (req, reply) => {
    const { token, data } = req.body || {};
    if (!token) return reply.status(400).send({ ok: false, error: 'token required' });
    await saveDraft(token, data);
    return reply.send({ ok: true });
  });
  fastify.get('/draft/:token', async (req, reply) => {
    const d = await getDraft(req.params.token);
    return reply.send({ ok: true, data: d || null });
  });
  done();
}
module.exports = draftRoutes;
