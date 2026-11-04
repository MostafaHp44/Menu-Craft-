const { translateText } = require('../services/translate.service');

function translateRoutes(fastify, opts, done) {
  fastify.post('/translate', async (req, reply) => {
    try {
      const { text, target } = req.body || {};
      if (!text || !target) return reply.status(400).send({ ok: false, error: 'text and target required' });
      const result = await translateText(text, target);
      reply.send({ ok: true, translated: result });
    } catch (e) {
      reply.status(500).send({ ok: false, error: e.message });
    }
  });
  done();
}

module.exports = translateRoutes;
