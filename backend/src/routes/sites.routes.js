const { summaryHandler, listMineHandler, canCreateHandler } = require('../controllers/sites.controller');

/**
 * مسارات المواقع (حساب المستخدم الحالي).
 * كلها محمية بالتوكن — كل مستخدم يرى ويدير مواقعه فقط.
 */
function siteRoutes(fastify, opts, done) {
  fastify.get('/sites/summary', { preHandler: fastify.authMiddleware }, summaryHandler);
  fastify.get('/sites', { preHandler: fastify.authMiddleware }, listMineHandler);
  fastify.get('/sites/can-create', { preHandler: fastify.authMiddleware }, canCreateHandler);

  // Public restaurant site read endpoint (no auth required)
  fastify.get('/sites/public/:slug', async (req, reply) => {
    try {
      const slug = req.params.slug;
      const poolMod = require('../config/db');
      const pool = poolMod.getPool ? await poolMod.getPool() : null;
      if (!pool) return reply.status(500).send({ ok: false, error: 'DB unavailable' });
      const mssql = require('mssql');
      const result = await pool.request()
        .input('slug', mssql.NVarChar, slug)
        .query(`SELECT id, name_en, name_ar, name_ku, slug, status, templateId, created_at, updated_at FROM Restaurants WHERE slug = @slug AND LOWER(status) = 'published'`);
      if (result.recordset.length === 0) return reply.status(404).send({ ok: false, error: 'Not found' });
      const r = result.recordset[0];
      return reply.send({ ok: true, data: {
        id: r.id,
        name: { en: r.name_en || '', ar: r.name_ar || '', ku: r.name_ku || '' },
        slug: r.slug,
        status: r.status,
        templateId: r.templateId,
        createdAt: r.created_at ? new Date(r.created_at).toISOString() : null,
        updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : null,
      }});
    } catch (e) {
      return reply.status(500).send({ ok: false, error: String(e.message || e) });
    }
  });

  done();
}

module.exports = siteRoutes;
