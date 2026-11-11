/**
 * Restaurant service — MariaDB / mysql2 version.
 * Restaurant service (MariaDB / mysql2).
 *
 * Notes:
 *  - MariaDB `Restaurants` has no reserved-word columns, so no [brackets].
 *  - JSON-ish columns (gallery, hours, socials, design, menu, ordering, stats,
 *    draft_menu, published_menu) are LONGTEXT → values are stringified on write.
 *  - Foreign keys point at Restaurants from 11 tables, so DELETE surfaces a
 *    409 instead of a raw driver error when the restaurant is still referenced.
 */
const { getMySQLPool } = require('../config/mysql');
const { z } = require('zod');
const { ensureRestaurantFitColumns, ensureRestaurantModeColumn } = require('./imageFit.service');
const { getTemplateSampleMenu } = require('../data/templateSamples');
const { syncMenuItemsFromJson } = require('./menuSync.service');

const restaurantSchema = z.object({
  name: z.string().min(1).optional(),
  name_ar: z.string().optional(),
  name_ku: z.string().optional(),
  slug: z.string().min(1).optional(),
  status: z.enum(['draft', 'published']).optional(),
  plan: z.enum(['trial', 'starter', 'professional', 'business']).optional(),
  /** Two product modes (UPGRADE_FLOW_SPEC §1): live = ordering-enabled, static = design-only */
  mode: z.enum(['static', 'live']).optional(),
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
  heroImageFit: z.any().optional(),
  galleryFits: z.any().optional(),
  heroVideo: z.string().nullable().optional(),
  gallery: z.any().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  hours: z.any().optional(),
  socials: z.any().optional(),
  templateId: z.string().nullish().optional(),
  design: z.any().optional(),
  menu: z.any().optional(),
  language: z.enum(['ar', 'en', 'ku']).optional(),
  ordering: z.any().optional(),
  stats: z.any().optional(),
  draft_menu: z.any().optional(),
  published_menu: z.any().optional(),
  copy: z.any().optional(),
  inline: z.any().optional()
});

/** request field → table column (and whether the value is JSON text) */
const FIELD_MAP = {
  name: { column: 'name_en' },
  name_ar: { column: 'name_ar' },
  name_ku: { column: 'name_ku' },
  slug: { column: 'slug' },
  status: { column: 'status' },
  plan: { column: 'plan' },
  mode: { column: 'mode' },
  tagline_en: { column: 'tagline_en' },
  tagline_ar: { column: 'tagline_ar' },
  tagline_ku: { column: 'tagline_ku' },
  description_en: { column: 'description_en' },
  description_ar: { column: 'description_ar' },
  description_ku: { column: 'description_ku' },
  logoText_en: { column: 'logoText_en' },
  logoText_ar: { column: 'logoText_ar' },
  logoText_ku: { column: 'logoText_ku' },
  logoStyle: { column: 'logoStyle' },
  heroImage: { column: 'heroImage' },
  heroImageFit: { column: 'hero_image_fit', json: true },
  galleryFits: { column: 'gallery_fits', json: true },
  heroVideo: { column: 'heroVideo' },
  gallery: { column: 'gallery', json: true },
  phone: { column: 'phone' },
  email: { column: 'email' },
  address: { column: 'address' },
  hours: { column: 'hours', json: true },
  socials: { column: 'socials', json: true },
  templateId: { column: 'templateId' },
  design: { column: 'design', json: true },
  menu: { column: 'menu', json: true },
  language: { column: 'language' },
  ordering: { column: 'ordering', json: true },
  stats: { column: 'stats', json: true },
  draft_menu: { column: 'draft_menu', json: true },
  published_menu: { column: 'published_menu', json: true },
  copy: { column: 'copy', json: true },
  inline: { column: 'inline', json: true }
};

/** LONGTEXT columns store JSON as text */
function toDbValue(key, value) {
  const def = FIELD_MAP[key];
  if (def && def.json && value !== null && typeof value === 'object') {
    return JSON.stringify(value);
  }
  return value;
}

function notFound() {
  const err = new Error('المطعم غير موجود');
  err.status = 404;
  err.code = 'RESTAURANT_NOT_FOUND';
  return err;
}

async function withConnection(fn) {
  await ensureRestaurantFitColumns();
  await ensureRestaurantModeColumn();
  const pool = await getMySQLPool();
  const connection = await pool.getConnection();
  try {
    return await fn(connection);
  } finally {
    connection.release();
  }
}

async function getAllRestaurants() {
  return withConnection(async (c) => {
    const [rows] = await c.execute('SELECT * FROM Restaurants ORDER BY created_at DESC');
    return rows;
  });
}

async function getRestaurantById(id) {
  return withConnection(async (c) => {
    const [rows] = await c.execute('SELECT * FROM Restaurants WHERE id = ?', [id]);
    if (rows.length === 0) throw notFound();
    return rows[0];
  });
}

async function getRestaurantBySlug(slug) {
  return withConnection(async (c) => {
    const [rows] = await c.execute('SELECT * FROM Restaurants WHERE slug = ?', [slug]);
    if (rows.length === 0) throw notFound();
    return rows[0];
  });
}

async function createRestaurant(input, userId) {
  const parsed = restaurantSchema.parse(input ?? {});

  if (!parsed.name || !parsed.slug) {
    const err = new Error('اسم المطعم والرابط المختصر مطلوبان');
    err.status = 400;
    throw err;
  }

  return withConnection(async (c) => {
    const [existing] = await c.execute('SELECT id FROM Restaurants WHERE slug = ?', [parsed.slug]);
    if (existing.length > 0) {
      const err = new Error('هذا الرابط المختصر مستخدم مسبقاً');
      err.status = 400;
      err.code = 'SLUG_TAKEN';
      throw err;
    }

    const keys = Object.keys(FIELD_MAP).filter((k) => parsed[k] !== undefined);
    const columns = ['id', ...keys.map((k) => FIELD_MAP[k].column)];
    const placeholders = ['?', ...keys.map(() => '?')];
    const newId = `rst-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    const values = [newId, ...keys.map((k) => toDbValue(k, parsed[k]))];

    await c.execute(
      `INSERT INTO Restaurants (${columns.join(', ')}, created_at, updated_at)
       VALUES (${placeholders.join(', ')}, NOW(), NOW())`,
      values
    );

    if (userId) {
      // link ownership (multi-site) + legacy default link only when the user has no site yet
      const { linkUserToSite } = require('./site.service');
      await linkUserToSite(userId, newId, true);
      await c.execute(
        'UPDATE Users SET restaurant_id = COALESCE(restaurant_id, ?) WHERE id = ?',
        [newId, userId]
      );
    }

    const [rows] = await c.execute('SELECT * FROM Restaurants WHERE id = ?', [newId]);
    return rows[0];
  });
}

async function updateRestaurant(id, input) {
  const parsed = restaurantSchema.partial().parse(input ?? {});

  return withConnection(async (c) => {
    // تغيير الـ slug: تحقق من الصيغة والتفرد قبل أي كتابة —
    // بدون هذا، نسخ رابط مطعم آخر يرجع ER_DUP_ENTRY (500) عند المس
    if (parsed.slug !== undefined && parsed.slug !== null) {
      if (!/^[a-z0-9-]{3,32}$/.test(parsed.slug)) {
        const err = new Error('الرابط المختصر يجب أن يكون 3–32 حرفاً من أحرف صغيرة وأرقام وشرطات');
        err.status = 400;
        err.code = 'INVALID_SLUG';
        throw err;
      }
      const [taken] = await c.execute('SELECT id FROM Restaurants WHERE slug = ? AND id <> ?', [parsed.slug, id]);
      if (taken.length > 0) {
        const err = new Error('هذا الرابط المختصر مستخدم مسبقاً');
        err.status = 400;
        err.code = 'SLUG_TAKEN';
        throw err;
      }
    }

    const fields = [];
    const values = [];

    Object.keys(FIELD_MAP).forEach((key) => {
      if (parsed[key] === undefined) return;
      fields.push(`${FIELD_MAP[key].column} = ?`);
      values.push(toDbValue(key, parsed[key]));
    });

    if (fields.length === 0) {
      const err = new Error('لا توجد بيانات للتعديل');
      err.status = 400;
      throw err;
    }

    fields.push('updated_at = NOW()');
    values.push(id);

    const [result] = await c.execute(
      `UPDATE Restaurants SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    if (result.affectedRows === 0) throw notFound();

    // المزامنة مع جدولي العرض (MenuCategories/MenuItems) — الموقع العام يقرأ
    // منهما أولاً، فلا بد أن يظهر ما يراه المالك في المحرر على الموقع مباشرة.
    if (parsed.draft_menu !== undefined) {
      await syncMenuItemsFromJson(id, parsed.draft_menu);
    } else if (parsed.published_menu !== undefined) {
      await syncMenuItemsFromJson(id, parsed.published_menu);
    }

    const [rows] = await c.execute('SELECT * FROM Restaurants WHERE id = ?', [id]);
    return rows[0];
  });
}

/** Atomic: copy draft_menu → published_menu, then set status = published */
async function publishRestaurant(id) {
  return withConnection(async (c) => {
    const [result] = await c.execute(
      `UPDATE Restaurants
         SET published_menu = draft_menu, status = 'published', updated_at = NOW()
       WHERE id = ?`,
      [id]
    );
    if (result.affectedRows === 0) throw notFound();

    const [rows] = await c.execute('SELECT * FROM Restaurants WHERE id = ?', [id]);
    // مزامنة النسخة المنشورة مع جدولي العرض حتى يقرأها الموقع العام
    await syncMenuItemsFromJson(id, rows[0].published_menu);
    return rows[0];
  });
}

async function unpublishRestaurant(id) {
  return withConnection(async (c) => {
    const [result] = await c.execute(
      `UPDATE Restaurants SET status = 'draft', updated_at = NOW() WHERE id = ?`,
      [id]
    );
    if (result.affectedRows === 0) throw notFound();

    const [rows] = await c.execute('SELECT * FROM Restaurants WHERE id = ?', [id]);
    return rows[0];
  });
}

async function deleteRestaurant(id) {
  return withConnection(async (c) => {
    try {
      const [result] = await c.execute('DELETE FROM Restaurants WHERE id = ?', [id]);
      if (result.affectedRows === 0) throw notFound();
      return { deleted: true, id };
    } catch (err) {
      // ER_ROW_IS_REFERENCED_2 (1451) — still referenced by orders/users/etc.
      if (err.errno === 1451 || err.errno === 1452) {
        const e = new Error('لا يمكن حذف المطعم لوجود بيانات مرتبطة به');
        e.status = 409;
        e.code = 'RESTAURANT_IN_USE';
        throw e;
      }
      throw err;
    }
  });
}

/**
 * استيراد منيو التمبلت إلى قاعدة البيانات.
 * القاعدة: منيو التمبلت يُستورد فقط عند "أول مرة" — أي عندما لا يملك الموقع
 * أي منيو بعد — أو عند الطلب الصريح (force). بعدها يبقى منيو المالك كما هو
 * وتُطبَّق ألوان/تصميم التمبلت فقط (وفق ما يعرضه صفحة القوالب).
 */
async function importTemplateSampleMenu(id, templateId, force = false, design = null) {
  return withConnection(async (c) => {
    const [rows] = await c.execute('SELECT id, draft_menu FROM Restaurants WHERE id = ?', [id]);
    if (rows.length === 0) throw notFound();

    let existing = null;
    try {
      existing = rows[0].draft_menu ? JSON.parse(rows[0].draft_menu) : null;
    } catch {
      existing = null;
    }
    const hasMenu = Array.isArray(existing) && existing.some((cat) => Array.isArray(cat.items) && cat.items.length > 0);

    const shouldImport = Boolean(force) || !hasMenu;
    const sampleMenu = shouldImport ? getTemplateSampleMenu(templateId) : null;
    const importMenu = shouldImport && Array.isArray(sampleMenu) && sampleMenu.length > 0;

    const fields = ['templateId = ?', 'design = ?', 'updated_at = NOW()'];
    const values = [templateId, design ? JSON.stringify(design) : null];
    if (importMenu) {
      fields.unshift('draft_menu = ?');
      values.unshift(JSON.stringify(sampleMenu));
    }
    values.push(id);

    await c.execute(`UPDATE Restaurants SET ${fields.join(', ')} WHERE id = ?`, values);

    // أول استيراد: ينزل منيو التمبلت فوراً إلى جدولي العرض فيظهر على الموقع
    if (importMenu) {
      await syncMenuItemsFromJson(id, sampleMenu);
    }

    const [updated] = await c.execute('SELECT * FROM Restaurants WHERE id = ?', [id]);
    return updated[0];
  });
}

module.exports = {
  getAllRestaurants,
  getRestaurantById,
  getRestaurantBySlug,
  createRestaurant,
  updateRestaurant,
  publishRestaurant,
  unpublishRestaurant,
  deleteRestaurant,
  importTemplateSampleMenu
};
