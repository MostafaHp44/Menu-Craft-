const { getPublicMenuBySlug } = require('../services/menu.service');

/**
 * المنيو العام — بيانات جاهزة لصفحة الطلب:
 * الأصناف + التصنيفات + إعدادات التوصيل/الاستلام + وسائل الدفع الجاهزة فقط.
 *
 * + سيرة الفروع العامة: GET /api/public/menu/:slug/branches
 *   (قراءة عامة آمنة للأطراف المقبولة — approved Phase 1 Task 01)
 */
const { getPool, sql } = require('../config/db');

/** أعمدة الفروع المقروءة للعامة فقط — أي عمود آخر لا يُكشف أبدًا */
const SAFE_BRANCH_COLUMNS = [
  'id', 'restaurant_id', 'name_en', 'name_ar', 'name_ku', 'name',
  'address', 'phone', 'accepting_orders', 'accepts_orders', 'is_accepting_orders'
];



async function listPublicBranches(request, reply) {
  try {
    const pool = await getPool();
    const slug = request.params.slug;

    // المطعم يجب أن يكون منشورًا — نفس قاعدة المنيو العام
    const rest = await pool.request()
      .input('slug', sql.NVarChar, slug)
      .query(`SELECT id FROM Restaurants WHERE slug = @slug AND LOWER(status) = 'published'`);
    if (rest.recordset.length === 0) {
      return reply.status(404).send({ ok: false, error: 'المطعم غير موجود', code: 'RESTAURANT_NOT_FOUND' });
    }
    const restaurantId = rest.recordset[0].id;

    // جدول الفروع اختياري — قد لا يكون مهيأ في كل قاعدة بيانات
    const exists = await pool.request()
      .query(`SELECT COUNT(*) AS n FROM sys.tables WHERE name = 'Branches'`);
    if (!exists.recordset[0].n) {
      return reply.send({ ok: true, data: [] });
    }

    // الأعمدة بأسماء غير متوقعة في قواعد قديمة — نقرأ ما يوجد فقط
    const cols = await pool.request()
      .input('table', sql.NVarChar, 'Branches')
      .query(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = @table`);
    const columnSet = new Set(cols.recordset.map((c) => c.COLUMN_NAME));
    const safe = SAFE_BRANCH_COLUMNS.filter((c) => columnSet.has(c));
    if (!safe.includes('id')) {
      // لا يمكن إرجاع فروع بلا سطر معرف — كأن الجدول غير موجود
      return reply.send({ ok: true, data: [] });
    }

    // Use only columns that actually exist in this DB
    const queryColumns = safe.join(', ');
    const rows = await pool.request()
      .input('restaurantId', sql.NVarChar, restaurantId)
      .query(`SELECT ${queryColumns} FROM Branches WHERE restaurant_id = @restaurantId`);

    const branches = rows.recordset.map((b) => ({
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
