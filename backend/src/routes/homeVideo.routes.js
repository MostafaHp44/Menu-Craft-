const fs = require('fs');
const path = require('path');
function homeVideoRoutes(fastify, opts, done) {
  fastify.get('/home-video/:lang', async (req, reply) => {
    try {
      const r = await req.pool.request().input('rid', req.user?.restaurant_id || 'all').query('SELECT hero_video FROM HomeContent WHERE restaurant_id = @rid AND lang = @lang');
      return reply.send({ ok: true, data: r.recordset[0]?.hero_video || null });
    } catch (e) { return reply.status(500).send({ ok: false, error: e.message }); }
  });
  fastify.post('/home-video', async (req, reply) => {
    const { lang, url, restaurantId } = req.body || {};
    if (!url) return reply.status(400).send({ ok: false, error: 'url required' });
    try {
      await req.pool.request().input('rid', sql.NVarChar, restaurantId || 'all').input('lv', sql.NVarChar, lang || 'ar').input('u', sql.NVarChar, url).query('UPDATE HomeContent SET hero_video = @u WHERE restaurant_id = @rid AND lang = @lv');
      return reply.send({ ok: true });
    } catch (e) { return reply.status(500).send({ ok: false, error: e.message }); }
  });
  done();
}
const { sql } = require('../config/db');
module.exports = homeVideoRoutes;
