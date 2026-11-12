const { getMySQLPool } = require('../config/mysql');
const { requirePlatformStaff } = require('../middleware/roles');

/**
 * فيديو الصفحة الرئيسية — محتوى منصّة مخزّن في `HomeContent.hero` (JSON).
 *
 * P1: كلا المسارين يتطلب مصادقة، والكتابة مملوكة لإدارة المنصة فقط
 * (نفس نموذج `PATCH /home-content/:lang`). لا يكتب زائر أو مالك مطعم
 * محتوى المنصة، ولا تُنشأ صفوف وهمية بلغة غير موجودة (404).
 */
function parseHero(row) {
  if (!row || !row.hero) return {};
  const h = row.hero;
  if (typeof h === 'object' && !Buffer.isBuffer(h)) return h && typeof h === 'object' ? h : {};
  try {
    const s = Buffer.isBuffer(h) ? h.toString('utf8') : String(h);
    const parsed = JSON.parse(s);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (_) {
    return {};
  }
}

function homeVideoRoutes(fastify, opts, done) {
  fastify.get('/home-video/:lang', { preHandler: fastify.authMiddleware }, async (req, reply) => {
    try {
      const pool = await getMySQLPool();
      const c = await pool.getConnection();
      try {
        const [rows] = await c.execute('SELECT hero FROM HomeContent WHERE lang = ?', [req.params.lang || 'en']);
        if (!rows.length) return reply.send({ ok: true, data: null });
        const hero = parseHero(rows[0]);
        return reply.send({
          ok: true,
          data: hero.video || null,
          hero: {
            video: hero.video || null,
            videoDesktop: hero.videoDesktop || null,
            videoMobile: hero.videoMobile || null,
          },
        });
      } finally {
        c.release();
      }
    } catch (e) {
      req.log.error(e);
      return reply.status(500).send({ ok: false, error: 'Internal Server Error' });
    }
  });

  fastify.post(
    '/home-video',
    { preHandler: [fastify.authMiddleware, requirePlatformStaff()] },
    async (req, reply) => {
      const { lang, url, videoDesktop, videoMobile } = req.body || {};
      if (!url && !videoDesktop && !videoMobile) {
        return reply.status(400).send({ ok: false, error: 'url required', code: 'VALIDATION' });
      }
      try {
        const pool = await getMySQLPool();
        const c = await pool.getConnection();
        try {
          const key = lang || 'ar';
          const [rows] = await c.execute('SELECT id, hero FROM HomeContent WHERE lang = ?', [key]);
          if (!rows.length) {
            return reply.status(404).send({ ok: false, error: 'لا يوجد محتوى لهذه اللغة', code: 'NOT_FOUND' });
          }
          const hero = parseHero(rows[0]);
          if (url !== undefined) hero.video = url || null;
          if (videoDesktop !== undefined) hero.videoDesktop = videoDesktop || null;
          if (videoMobile !== undefined) hero.videoMobile = videoMobile || null;
          await c.execute(
            'UPDATE HomeContent SET hero = ?, updated_at = NOW() WHERE lang = ?',
            [JSON.stringify(hero), key]
          );
          return reply.send({ ok: true });
        } finally {
          c.release();
        }
      } catch (e) {
        req.log.error(e);
        return reply.status(500).send({ ok: false, error: 'Internal Server Error' });
      }
    }
  );

  done();
}

module.exports = homeVideoRoutes;
