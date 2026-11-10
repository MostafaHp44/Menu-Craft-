const { getPublicMenuBySlug } = require('../services/menu.service');
const { getMySQLPool } = require('../config/mysql');

const SAFE_BRANCH_COLUMNS = [
  'id', 'restaurant_id', 'name_en', 'name_ar', 'name_ku', 'name',
  'address', 'phone', 'accepting_orders', 'accepts_orders', 'is_accepting_orders'
];



async function listPublicBranches(request, reply) {
  try {
    const pool = await getMySQLPool();
    const slug = request.params.slug;

    const restConn = await pool.getConnection();
    let rest;
    try {
      [rest] = await restConn.execute('SELECT id FROM Restaurants WHERE slug = ? AND LOWER(status) = ?', [slug, 'published']);
    } finally { restConn.release(); }
    if (!rest || !rest.length) {
      return reply.status(404).send({ ok: false, error: 'المطعم غير موجود', code: 'RESTAURANT_NOT_FOUND' });
    }
    const restaurantId = rest[0].id;

    const exConn = await pool.getConnection();
    let exists;
    try {
      [exists] = await exConn.execute("SELECT COUNT(*) AS n FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?", ['Branches']);
    } finally { exConn.release(); }
    if (!exists[0].n) {
      return reply.send({ ok: true, data: [] });
    }

    const colsConn = await pool.getConnection();
    let cols;
    try {
      [cols] = await colsConn.execute("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?", ['Branches']);
    } finally { colsConn.release(); }
    const columnSet = new Set(cols.map((c) => c.COLUMN_NAME));
    const safe = SAFE_BRANCH_COLUMNS.filter((c) => columnSet.has(c));
    if (!safe.includes('id')) {
      return reply.send({ ok: true, data: [] });
    }

    const queryColumns = safe.join(', ');
    const rowsConn = await pool.getConnection();
    let rows;
    try {
      [rows] = await rowsConn.execute('SELECT '+queryColumns+' FROM Branches WHERE restaurant_id = ?', [restaurantId]);
    } finally { rowsConn.release(); }

    const branches = rows.map((b) => ({
      id: String(b.id),
      name: {
        en: b.name_en !== undefined && b.name_en !== null ? b.name_en : (typeof b.name === 'string' ? b.name : ''),
        ar: b.name_ar !== undefined && b.name_ar !== null ? b.name_ar : (typeof b.name === 'string' ? b.name : ''),
        ku: b.name_ku !== undefined && b.name_ku !== null ? b.name_ku : (typeof b.name === 'string' ? b.name : '')
      },
      address: b.address || '',
      /**
       * علم قبول الطلبات. الافتراضي true لو العمود غير موجود في كل صفوف
       * النظام (بعض المواقع البسيطة بلا فرع فتح/إغلاق) — المطعم نفسه يظل
       * المتحكم الحقيقي عبر إعدادات الطلب.
       */
      acceptingOrders: b.accepting_orders !== undefined ? Boolean(b.accepting_orders)
        : b.accepts_orders !== undefined ? Boolean(b.accepts_orders)
        : b.is_accepting_orders !== undefined ? Boolean(b.is_accepting_orders)
        : true
    }));

    return reply.send({ ok: true, data: branches });
  } catch (err) {
    return reply.status(err.status || 500).send({ ok: false, error: err.message, code: err.code });
  }
}

function menuRoutes(fastify, opts, done) {
  fastify.get('/public/menu/:slug', async (request, reply) => {
    try {
      let lang = 'en';
      const raw = request.query?.lang || request.headers?.['x-lang'];
      if (raw && ['ar','en','ku'].includes(raw)) lang = raw;
      const data = await getPublicMenuBySlug(request.params.slug, lang);
      return reply.send({ ok: true, data });
    } catch (err) {
      return reply.status(err.status || 500).send({ ok: false, error: err.message, code: err.code });
    }
  });

  // القراءة العامة لفروع المطعم المنشور (id/اسم/عنوان/قبول الطلبات فقط)
  fastify.get('/public/menu/:slug/branches', listPublicBranches);

  done();
}

module.exports = menuRoutes;
