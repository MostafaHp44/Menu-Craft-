const { getHomeContent, updateHomeContent } = require('../services/home-content.service');

async function getHandler(request, reply) {
  try {
    const { lang } = request.query;
    const content = await getHomeContent(lang || 'en');
    return reply.send({ ok: true, data: content });
  } catch (err) {
    return reply.status(500).send({ ok: false, error: err.message });
  }
}

async function updateHandler(request, reply) {
  try {
    const { lang } = request.params;
    const content = request.body;
    await updateHomeContent(lang, content);
    return reply.send({ ok: true, message: 'تم تحديث المحتوى' });
  } catch (err) {
    return reply.status(500).send({ ok: false, error: err.message });
  }
}

module.exports = { getHandler, updateHandler };
