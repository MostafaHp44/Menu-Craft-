const { getPool, sql } = require('../config/db');
const { z } = require('zod');

const restaurantSchema = z.object({
  name: z.string().min(1).optional(),
  name_ar: z.string().optional(),
  name_ku: z.string().optional(),
  slug: z.string().min(1).optional(),
  status: z.enum(['draft', 'published']).optional(),
  plan: z.enum(['trial', 'starter', 'professional', 'business']).optional(),
  tagline_en: z.string().optional(),
  tagline_ar: z.string().optional(),
  tagline_ku: z.string().optional(),
  description_en: z.string().optional(),
  description_ar: z.string().optional(),
  description_ku: z.string().optional(),
  logoText_en: z.string().optional(),
  logoText_ar: z.string().optional(),
  logoText_ku: z.string().optional(),
  logoStyle: z.string().optional(),
  heroImage: z.string().optional(),
  heroVideo: z.string().nullable().optional(),
  gallery: z.any().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  hours: z.any().optional(),
  socials: z.any().optional(),
  templateId: z.string().optional(),
  design: z.any().optional(),
  menu: z.any().optional(),
  language: z.enum(['ar', 'en', 'ku']).optional(),
  ordering: z.any().optional(),
  stats: z.any().optional(),
  draft_menu: z.any().optional(),
  published_menu: z.any().optional()
});

/** خريطة الحقول: اسم الحقل في الطلب ← عمود الجدول + نوعه */
const FIELD_MAP = {
  name: { column: 'name_en', type: () => sql.NVarChar },
  name_ar: { column: 'name_ar', type: () => sql.NVarChar },
  name_ku: { column: 'name_ku', type: () => sql.NVarChar },
  slug: { column: 'slug', type: () => sql.NVarChar },
  status: { column: 'status', type: () => sql.NVarChar },
  plan: { column: '[plan]', type: () => sql.NVarChar },
  tagline_en: { column: 'tagline_en', type: () => sql.NVarChar },
  tagline_ar: { column: 'tagline_ar', type: () => sql.NVarChar },
  tagline_ku: { column: 'tagline_ku', type: () => sql.NVarChar },
  description_en: { column: 'description_en', type: () => sql.NVarChar },
  description_ar: { column: 'description_ar', type: () => sql.NVarChar },
  description_ku: { column: 'description_ku', type: () => sql.NVarChar },
  logoText_en: { column: 'logoText_en', type: () => sql.NVarChar },
  logoText_ar: { column: 'logoText_ar', type: () => sql.NVarChar },
  logoText_ku: { column: 'logoText_ku', type: () => sql.NVarChar },
  logoStyle: { column: 'logoStyle', type: () => sql.NVarChar },
  heroImage: { column: 'heroImage', type: () => sql.NVarChar },
  heroVideo: { column: 'heroVideo', type: () => sql.NVarChar },
  gallery: { column: 'gallery', type: () => sql.NVarChar, json: true },
  phone: { column: 'phone', type: () => sql.NVarChar },
  email: { column: 'email', type: () => sql.NVarChar },
  address: { column: 'address', type: () => sql.NVarChar },
  hours: { column: 'hours', type: () => sql.NVarChar, json: true },
  socials: { column: 'socials', type: () => sql.NVarChar, json: true },
  templateId: { column: 'templateId', type: () => sql.NVarChar },
  design: { column: 'design', type: () => sql.NVarChar, json: true },
  menu: { column: 'menu', type: () => sql.NVarChar, json: true },
  language: { column: 'language', type: () => sql.NVarChar },
  ordering: { column: 'ordering', type: () => sql.NVarChar, json: true },
  stats: { column: 'stats', type: () => sql.NVarChar, json: true },
  draft_menu: { column: 'draft_menu', type: () => sql.NVarChar, json: true },
  published_menu: { column: 'published_menu', type: () => sql.NVarChar, json: true }
};

/** قيم JSON تُخزَّن كنص داخل NVARCHAR(MAX) */
function toDbValue(key, value) {
  const def = FIELD_MAP[key];
  if (def && def.json && value !== null && typeof value === 'object') {
    return JSON.stringify(value);
  }
  return value;
}

async function getAllRestaurants() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT *
    FROM Restaurants
    ORDER BY created_at DESC
  `);
  return result.recordset;
}

async function getRestaurantById(id) {
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.VarChar, id)
    .query('SELECT * FROM Restaurants WHERE id = @id');

  if (result.recordset.length === 0) {
    const err = new Error('المطعم غير موجود');
    err.status = 404;
    throw err;
  }
  return result.recordset[0];
}

async function getRestaurantBySlug(slug) {
  const pool = await getPool();
  const result = await pool.request()
    .input('slug', sql.NVarChar, slug)
    .query('SELECT * FROM Restaurants WHERE slug = @slug');

  if (result.recordset.length === 0) {
    const err = new Error('المطعم غير موجود');
    err.status = 404;
    throw err;
  }
  return result.recordset[0];
}

async function createRestaurant(input, userId) {
  const parsed = restaurantSchema.parse(input ?? {});
  const pool = await getPool();
  const now = new Date().toISOString();

  if (!parsed.name || !parsed.slug) {
    const err = new Error('اسم المطعم والرابط المختصر مطلوبان');
    err.status = 400;
    throw err;
  }

  const existing = await pool.request()
    .input('slug', sql.NVarChar, parsed.slug)
    .query('SELECT id FROM Restaurants WHERE slug = @slug');
  if (existing.recordset.length > 0) {
    const err = new Error('هذا الرابط المختصر مستخدم مسبقاً');
    err.status = 400;
    throw err;
  }

  const keys = Object.keys(FIELD_MAP).filter((k) => parsed[k] !== undefined);
  const columns = ['id', ...keys.map((k) => FIELD_MAP[k].column)];
  const placeholders = ['@__id', ...keys.map((k) => `@${k}`)];
  const newId = `rst-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

  const request = pool.request();
  request.input('__id', sql.NVarChar, newId);
  keys.forEach((k) => request.input(k, FIELD_MAP[k].type(), toDbValue(k, parsed[k])));
  request.input('__createdAt', sql.DateTime, now);

  const result = await request.query(`
    INSERT INTO Restaurants (${columns.join(', ')}, created_at, updated_at)
    OUTPUT INSERTED.id
    VALUES (${placeholders.join(', ')}, @__createdAt, @__createdAt)
  `);
  void result; // المعرف مولّد مسبقًا (newId)

  if (userId) {
    // ربط الملكية (متعدد المواقع) — وربط افتراضي قديم فقط لو لم يكن للمستخدم موقع بعد
    const { linkUserToSite } = require('./site.service');
    await linkUserToSite(userId, newId, true);
    await pool.request()
      .input('userId', sql.NVarChar, userId)
      .input('restaurantId', sql.NVarChar, newId)
      .query('UPDATE Users SET restaurant_id = COALESCE(restaurant_id, @restaurantId) WHERE id = @userId');
  }

  return getRestaurantById(newId);
}

async function updateRestaurant(id, input) {
  const parsed = restaurantSchema.partial().parse(input ?? {});
  const pool = await getPool();

  const fields = [];
  const values = [];
  let paramIndex = 1;

  Object.keys(FIELD_MAP).forEach((key) => {
    if (parsed[key] === undefined) return;
    const def = FIELD_MAP[key];
    const paramName = `p${paramIndex++}`;
    fields.push(`${def.column} = @${paramName}`);
    values.push({ name: paramName, type: def.type(), value: toDbValue(key, parsed[key]) });
  });

  if (fields.length === 0) {
    const err = new Error('لا توجد بيانات للتعديل');
    err.status = 400;
    throw err;
  }

  fields.push('updated_at = GETDATE()');

  const request = pool.request();
  request.input('id', sql.VarChar, id);
  values.forEach(v => request.input(v.name, v.type, v.value));

  const result = await request.query(`
    UPDATE Restaurants
    SET ${fields.join(', ')}
    OUTPUT INSERTED.id
    WHERE id = @id
  `);

  if (result.recordset.length === 0) {
    const err = new Error('المطعم غير موجود');
    err.status = 404;
    throw err;
  }

  return getRestaurantById(id);
}

async function publishRestaurant(id) {
  // Atomic: copy draft_menu -> published_menu, then set status = published
  const pool = await getPool();
  // Get current draft
  const draftRes = await pool.request().input('id', sql.VarChar, id).query('SELECT draft_menu FROM Restaurants WHERE id = @id');
  const draftMenu = draftRes.recordset[0]?.draft_menu ?? null;
  const result = await pool.request()
    .input('id', sql.VarChar, id)
    .input('draft_menu', sql.NVarChar, draftMenu)
    .query(`UPDATE Restaurants SET published_menu = @draft_menu, status = 'published', updated_at = GETDATE() OUTPUT INSERTED.id WHERE id = @id`);
  if (result.recordset.length === 0) {
    const err = new Error('المطعم غير موجود');
    err.status = 404;
    throw err;
  }
  return getRestaurantById(id);
}

async function unpublishRestaurant(id) {
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.VarChar, id)
    .query(`UPDATE Restaurants SET status = 'draft', updated_at = GETDATE() OUTPUT INSERTED.id WHERE id = @id`);
  if (result.recordset.length === 0) {
    const err = new Error('المطعم غير موجود');
    err.status = 404;
    throw err;
  }
  return getRestaurantById(id);
}

async function deleteRestaurant(id) {
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.VarChar, id)
    .query('DELETE FROM Restaurants OUTPUT DELETED.id WHERE id = @id');

  if (result.recordset.length === 0) {
    const err = new Error('المطعم غير موجود');
    err.status = 404;
    throw err;
  }
  return { deleted: true, id };
}

module.exports = {
  getAllRestaurants,
  getRestaurantById,
  getRestaurantBySlug,
  createRestaurant,
  updateRestaurant,
  publishRestaurant,
  unpublishRestaurant,
  deleteRestaurant
};
