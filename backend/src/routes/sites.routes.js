const { summaryHandler, listMineHandler, canCreateHandler } = require('../controllers/sites.controller');
const { updateRestaurant, getRestaurantBySlug } = require('../services/restaurant.service');
const { userOwnsSite } = require('../services/site.service');
const { getPublicMenuBySlug } = require('../services/menu.service');
const { getMySQLPool } = require('../config/mysql');

/** نص غير فارغ فقط — القيم الفارغة لا تُكتب حتى لا تمسح الأعمدة */
function str(value) {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

/** يوزّع القيمة ({en,ar,ku} أو نص) على أعمدة المطعم متعددة اللغات */
function putLang(input, key, value) {
  // `name` هو المفتاح الوحيد الذي يقابل العمود name_en مباشرة،
  // البقية تحتاج اللاحقة _en (وإلا حذفها zod كمفتاح غير معروف)
  const enKey = key === 'name' ? 'name' : `${key}_en`;
  if (typeof value === 'string') {
    const v = str(value);
    if (v !== undefined) input[enKey] = v;
    return;
  }
  if (!value || typeof value !== 'object') return;
  const en = str(value.en);
  const ar = str(value.ar);
  const ku = str(value.ku);
  if (en !== undefined) input[enKey] = en;
  if (ar !== undefined) input[`${key}_ar`] = ar; // name_ar / tagline_ar …
  if (ku !== undefined) input[`${key}_ku`] = ku;
}

/**
 * يحوّل جسم طلب الحفظ/النشر إلى حقول restaurantSchema.
 * المنيو يُكتب في الحالتين (draft_menu + published_menu) حتى يعرض
 * /site/:slug آخر تعديل فورًا، و status = published عند النشر فقط.
 */
function buildSiteInput(body) {
  const cfg = body && body.config && typeof body.config === 'object' ? body.config : {};
  const input = {};

  putLang(input, 'name', cfg.name);
  putLang(input, 'tagline', cfg.tagline);
  putLang(input, 'description', cfg.description);
  putLang(input, 'logoText', cfg.logoText);

  ['logoStyle', 'heroImage', 'phone', 'email', 'address', 'templateId'].forEach((key) => {
    const v = str(cfg[key]);
    if (v !== undefined) input[key] = v;
  });

  // تغيير الرابط العام: يُرسل slug جديد — التفرد والصيغة يتحقق منهما في
  // restaurant.service (تجاهل القيمة الفارغة حتى لا يمسح الرابط الحالي)
  const slug = str(cfg.slug);
  if (slug !== undefined) input.slug = slug;

  if (cfg.heroVideo === null || typeof cfg.heroVideo === 'string') input.heroVideo = cfg.heroVideo;
  if (cfg.heroImageFit === null || (cfg.heroImageFit && typeof cfg.heroImageFit === 'object')) input.heroImageFit = cfg.heroImageFit;
  if (cfg.galleryFits === null || Array.isArray(cfg.galleryFits)) input.galleryFits = cfg.galleryFits;
  if (Array.isArray(cfg.gallery)) input.gallery = cfg.gallery;
  if (Array.isArray(cfg.hours)) input.hours = cfg.hours;
  if (cfg.socials && typeof cfg.socials === 'object') input.socials = cfg.socials;
  if (cfg.design !== undefined && (cfg.design === null || typeof cfg.design === 'object')) input.design = cfg.design;
  // تعديلات المحرر البصري (نصوص/أنماط العناصر) — نفس أعمدة القراءة في getPublicMenuBySlug
  if (cfg.copy && typeof cfg.copy === 'object') input.copy = cfg.copy;
  if (cfg.inline && typeof cfg.inline === 'object') input.inline = cfg.inline;

  if (body && Array.isArray(body.menu)) {
    input.draft_menu = body.menu;
    input.published_menu = body.menu;
  }
  if (body && body.publish === true) input.status = 'published';

  return input;
}

function sendError(reply, err) {
  if (err && err.name === 'ZodError') {
    return reply.status(400).send({ ok: false, error: 'بيانات غير صالحة' });
  }
  const payload = { ok: false, error: (err && err.message) || 'خطأ' };
  if (err && err.code) payload.code = err.code;
  return reply.status((err && err.status) || 500).send(payload);
}

/** يبحث عن الموقع بالـ slug ويتحقق من الملكية (الأدمن يمر دائمًا) */
async function assertSiteOwner(request, slug) {
  const row = await getRestaurantBySlug(slug); // يرمي 404 لو الـ slug غير موجود
  const userId = request.user && request.user.userId;
  const role = request.user && request.user.role;
  if (await userOwnsSite(userId, row.id, role)) return row;

  // موقع بلا مالك مسجّل (بيانات تجريبية مثل bella) — يُسمح بالكتابة لأي مستخدم
  // موثّق حتى لا يفشل النشر بـ403 على موقع لم يُربط بأحد. المواقع الحقيقية تُربط
  // بمالكها عند الإنشاء فتبقى محمية بالتحقق أعلاه.
  const pool = await getMySQLPool();
  const [owners] = await pool.execute('SELECT user_id FROM UserRestaurants WHERE restaurant_id = ?', [row.id]);
  if (owners.length > 0) {
    const err = new Error('ليست لديك صلاحية على هذا الموقع');
    err.status = 403;
    err.code = 'NOT_SITE_OWNER';
    throw err;
  }
  return row;
}

/**
 * مسارات المواقع (حساب المستخدم الحالي).
 * كلها محمية بالتوكن — كل مستخدم يرى ويدير مواقعه فقط.
 */
function siteRoutes(fastify, opts, done) {
  fastify.get('/sites/summary', { preHandler: fastify.authMiddleware }, summaryHandler);
  fastify.get('/sites', { preHandler: fastify.authMiddleware }, listMineHandler);
  fastify.get('/sites/can-create', { preHandler: fastify.authMiddleware }, canCreateHandler);

  // قراءة عامة للإعداد المنشور تحت الـ slug (نفس مصدر /site/:slug) — بلا توكن
  fastify.get('/sites/:slug', async (req, reply) => {
    try {
      const data = await getPublicMenuBySlug(req.params.slug);
      return reply.send({ ok: true, data });
    } catch (err) {
      return sendError(reply, err);
    }
  });

  // حفظ/نشر الإعداد الكامل (config + منيو) تحت الـ slug — محمي بالتوكن + الملكية
  fastify.put('/sites/:slug', { preHandler: fastify.authMiddleware }, async (req, reply) => {
    try {
      const row = await assertSiteOwner(req, req.params.slug);
      const input = buildSiteInput(req.body || {});
      if (Object.keys(input).length === 0) {
        return reply.status(400).send({ ok: false, error: 'لا توجد بيانات للتعديل' });
      }
      const updated = await updateRestaurant(row.id, input);
      return reply.send({
        ok: true,
        data: {
          id: updated.id,
          slug: updated.slug,
          status: updated.status,
          updatedAt: updated.updated_at ? new Date(updated.updated_at).toISOString() : null,
        },
      });
    } catch (err) {
      return sendError(reply, err);
    }
  });

  // Public restaurant site read endpoint (no auth required)
  fastify.get('/sites/public/:slug', async (req, reply) => {
    try {
      const slug = req.params.slug;
      const { getMySQLPool } = require('../config/mysql');
      const pool = await getMySQLPool();
      const c = await pool.getConnection();
      try {
        const [rows] = await c.execute('SELECT id, name_en, name_ar, name_ku, slug, status, templateId, created_at, updated_at FROM Restaurants WHERE slug = ? AND LOWER(status) = ?', [slug, 'published']);
        if (!rows.length) return reply.status(404).send({ ok: false, error: 'Not found' });
        const r = rows[0];
        return reply.send({ ok: true, data: {
          id: r.id,
          name: { en: r.name_en || '', ar: r.name_ar || '', ku: r.name_ku || '' },
          slug: r.slug,
          status: r.status,
          templateId: r.templateId,
          createdAt: r.created_at ? new Date(r.created_at).toISOString() : null,
          updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : null,
        }});
      } finally { c.release(); }
    } catch (e) {
      return reply.status(500).send({ ok: false, error: String(e.message || e) });
    }
  });

  done();
}

module.exports = siteRoutes;
