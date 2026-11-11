/** MenuCraft — Plan Service (MariaDB / mysql2) */
const { getMySQLPool } = require('../config/mysql');
const { z } = require('zod');

/** وضع الباقة: live (طلبات/مدفوعات) أو static (تصميم فقط) — كل وضع له باقاته */
const planSchema = z.object({
  name: z.string().min(2, 'اسم الباقة مطلوب'),
  price: z.number().nonnegative('السعر يجب أن يكون صفر أو أكثر'),
  currency: z.string().default('USD'),
  interval_type: z.enum(['month', 'year', 'forever', 'trial']).default('month'),
  mode: z.enum(['live', 'static']).default('live'),
  max_restaurants: z.number().int().default(1).refine((v) => v === -1 || v > 0, 'عدد المواقع: رقم موجب أو -1 للبلا حد'),
  max_menu_items: z.number().int().default(15),
  features: z.union([z.string(), z.array(z.any()), z.record(z.any())]).optional(),
  is_active: z.boolean().default(true)
});
const updateSchema = planSchema.partial();

/**
 * الباقة الافتراضية لكل وضع عند غياب البيانات (signup بدون planId).
 * كل وضع له باقاته الخاصة: static يبدأ بـ Starter، live يبدأ بـ Professional.
 */
const MODE_DEFAULT_PLAN = { static: 'plan-starter', live: 'plan-professional' };

/**
 * الباقات الثلاث الجديدة (وضع static ×2 + وضع live ×1) — الأسعار مؤقتة
 * حتى يراجعها صاحب المنتج. تُزرع تلقائياً إذا لم تكن موجودة.
 */
const SEED_EXTRA_PLANS = [
  {
    id: 'plan-static-plus',
    name: 'Static Plus',
    price: 12,
    currency: 'USD',
    interval_type: 'month',
    mode: 'static',
    max_restaurants: 10,
    max_menu_items: -1,
    features: [
      'Up to 10 restaurant websites',
      'Unlimited menu items',
      'All 8 templates included',
      'Remove Digital Menu badge',
      'Photo gallery & featured dishes',
      'QR code generator',
    ],
    is_active: 1,
  },
  {
    id: 'plan-static-studio',
    name: 'Static Studio',
    price: 24,
    currency: 'USD',
    interval_type: 'month',
    mode: 'static',
    max_restaurants: -1,
    max_menu_items: -1,
    features: [
      'Everything in Static Plus',
      'Unlimited restaurant websites',
      'Shared brand kit across locations',
      'Priority template releases',
      'Priority support',
    ],
    is_active: 1,
  },
  {
    id: 'plan-live-basic',
    name: 'Live Basic',
    price: 19,
    currency: 'USD',
    interval_type: 'month',
    mode: 'live',
    max_restaurants: 1,
    max_menu_items: -1,
    features: [
      '1 restaurant website with live ordering',
      'Unlimited menu items',
      'QR ordering at the table',
      'Cash & card payment methods',
      'Order tracking page',
      'Email support',
    ],
    is_active: 1,
  },
];

/** الباقات الأساسية الثلاث تُزرع أيضاً (id ثابت) لو كان الجدول فارغاً */
const SEED_BASE_PLANS = [
  {
    id: 'plan-starter',
    name: 'Starter',
    price: 0,
    currency: 'USD',
    interval_type: 'forever',
    mode: 'static',
    max_restaurants: 5,
    max_menu_items: 15,
    features: ['Up to 5 restaurant websites', 'Up to 15 menu items', 'All 8 templates included', 'QR code generator'],
    is_active: 1,
  },
  {
    id: 'plan-professional',
    name: 'Professional',
    price: 29,
    currency: 'USD',
    interval_type: 'month',
    mode: 'live',
    max_restaurants: 3,
    max_menu_items: -1,
    features: [
      'Up to 3 restaurant websites',
      'Unlimited menu items',
      'Full design studio: fonts, colors, layout',
      'Remove Digital Menu badge',
      'Photo gallery & featured dishes',
      'Priority template releases',
    ],
    is_active: 1,
  },
  {
    id: 'plan-business',
    name: 'Business',
    price: 79,
    currency: 'USD',
    interval_type: 'month',
    mode: 'live',
    max_restaurants: -1,
    max_menu_items: -1,
    features: [
      'Everything in Professional',
      'Unlimited restaurant sites',
      'Custom subdomain (simulated)',
      'Shared brand kit across locations',
      'Team seats (demo)',
      'Priority support',
    ],
    is_active: 1,
  },
];

const ALL_SEED_PLANS = [...SEED_BASE_PLANS, ...SEED_EXTRA_PLANS];

/**
 * تهيئة جدول Plans مرة واحدة لكل عملية تشغيل:
 *  1) عمود `mode` (live/static) لو غير موجود.
 *  2) ربط الباقات الحالية بوضعها الصحيح.
 *  3) زرع أي باقة ناقصة (6 باقات: 3 live + 3 static) — INSERT IGNORE حتى لا
 *     نمسّ أي سعر عدّله صاحب المنصة.
 * كل الخطوات محمية بـ try/catch: فشل التهيئة لا يمنع قراءة الباقات.
 */
let ensurePlansPromise = null;
function ensurePlansReady() {
  if (ensurePlansPromise) return ensurePlansPromise;
  ensurePlansPromise = (async () => {
    try {
      const pool = await getMySQLPool();
      const connection = await pool.getConnection();
      try {
        let hasMode = false;
        const [cols] = await connection.execute("SHOW COLUMNS FROM Plans LIKE 'mode'");
        hasMode = cols.length > 0;
        if (!hasMode) {
          try {
            await connection.execute("ALTER TABLE Plans ADD COLUMN mode VARCHAR(10) NOT NULL DEFAULT 'live' AFTER id");
            hasMode = true;
          } catch (e) {
            console.warn('[plans] cannot add mode column:', e.message);
          }
        }
        if (hasMode) {
          await connection.execute(
            "UPDATE Plans SET mode = 'static' WHERE (id = 'plan-starter' OR id LIKE 'plan-static-%') AND mode <> 'static'"
          );
          await connection.execute(
            "UPDATE Plans SET mode = 'live' WHERE (id IN ('plan-professional','plan-business') OR id LIKE 'plan-live-%') AND mode <> 'live'"
          );
        }
        for (const p of ALL_SEED_PLANS) {
          if (hasMode) {
            await connection.execute(
              `INSERT IGNORE INTO Plans (id, name, price, currency, interval_type, mode, max_restaurants, max_menu_items, features, is_active, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
              [p.id, p.name, p.price, p.currency, p.interval_type, p.mode, p.max_restaurants, p.max_menu_items, JSON.stringify(p.features), p.is_active]
            );
          } else {
            await connection.execute(
              `INSERT IGNORE INTO Plans (id, name, price, currency, interval_type, max_restaurants, max_menu_items, features, is_active, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
              [p.id, p.name, p.price, p.currency, p.interval_type, p.max_restaurants, p.max_menu_items, JSON.stringify(p.features), p.is_active]
            );
          }
        }
      } finally {
        connection.release();
      }
    } catch (e) {
      console.warn('[plans] ensure failed:', e.message);
    }
  })();
  return ensurePlansPromise;
}

function featuresToDb(value) {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

function featuresFromDb(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [String(parsed)];
  } catch {
    return value.split('\n').map((s) => s.trim()).filter(Boolean);
  }
}

function mapRow(row) {
  return {
    ...row,
    price: Number(row.price),
    is_active: Boolean(row.is_active),
    mode: String(row.mode || 'live').toLowerCase() === 'static' ? 'static' : 'live',
    features: featuresFromDb(row.features),
  };
}

function genId() {
  return `plan-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

async function getAllPlans() {
  await ensurePlansReady();
  const pool = await getMySQLPool();
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute('SELECT * FROM Plans ORDER BY price ASC');
    return rows.map(mapRow);
  } finally { connection.release(); }
}

async function getPlanById(id) {
  await ensurePlansReady();
  const pool = await getMySQLPool();
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute('SELECT * FROM Plans WHERE id = ?', [id]);
    if (!rows.length) {
      const e = new Error('الباقة غير موجودة');
      e.status = 404;
      throw e;
    }
    return mapRow(rows[0]);
  } finally { connection.release(); }
}

async function createPlan(input) {
  const parsed = planSchema.parse(input);
  await ensurePlansReady();
  const pool = await getMySQLPool();
  const connection = await pool.getConnection();
  try {
    const id = genId();
    await connection.execute(
      'INSERT INTO Plans (id, name, price, currency, interval_type, mode, max_restaurants, max_menu_items, features, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [id, parsed.name, parsed.price, parsed.currency, parsed.interval_type, parsed.mode, parsed.max_restaurants, parsed.max_menu_items, featuresToDb(parsed.features), parsed.is_active ? 1 : 0]
    );
    const [rows] = await connection.execute('SELECT * FROM Plans WHERE id = ?', [id]);
    return mapRow(rows[0]);
  } finally { connection.release(); }
}

async function updatePlan(id, input) {
  const parsed = updateSchema.parse(input);
  await ensurePlansReady();
  const pool = await getMySQLPool();
  const connection = await pool.getConnection();
  try {
    const [existing] = await connection.execute('SELECT id FROM Plans WHERE id = ?', [id]);
    if (!existing.length) {
      const e = new Error('الباقة غير موجودة');
      e.status = 404;
      throw e;
    }
    const fields = [];
    const values = [];
    if (parsed.name !== undefined) { fields.push('name = ?'); values.push(parsed.name); }
    if (parsed.price !== undefined) { fields.push('price = ?'); values.push(parsed.price); }
    if (parsed.currency !== undefined) { fields.push('currency = ?'); values.push(parsed.currency); }
    if (parsed.interval_type !== undefined) { fields.push('interval_type = ?'); values.push(parsed.interval_type); }
    if (parsed.mode !== undefined) { fields.push('mode = ?'); values.push(parsed.mode); }
    if (parsed.max_restaurants !== undefined) { fields.push('max_restaurants = ?'); values.push(parsed.max_restaurants); }
    if (parsed.max_menu_items !== undefined) { fields.push('max_menu_items = ?'); values.push(parsed.max_menu_items); }
    if (parsed.features !== undefined) { fields.push('features = ?'); values.push(featuresToDb(parsed.features)); }
    if (parsed.is_active !== undefined) { fields.push('is_active = ?'); values.push(parsed.is_active ? 1 : 0); }
    if (fields.length === 0) return getPlanById(id);
    values.push(id);
    await connection.execute(`UPDATE Plans SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`, values);
    const [rows] = await connection.execute('SELECT * FROM Plans WHERE id = ?', [id]);
    return mapRow(rows[0]);
  } finally { connection.release(); }
}

async function deletePlan(id) {
  const pool = await getMySQLPool();
  const connection = await pool.getConnection();
  try {
    const [existing] = await connection.execute('SELECT id FROM Plans WHERE id = ?', [id]);
    if (!existing.length) {
      const e = new Error('الباقة غير موجودة');
      e.status = 404;
      throw e;
    }
    // Soft delete: مراجع من Subscriptions.plan_id — نودع is_active = 0
    await connection.execute('UPDATE Plans SET is_active = 0, updated_at = NOW() WHERE id = ?', [id]);
    return { deleted: true };
  } finally { connection.release(); }
}

module.exports = { getAllPlans, getPlanById, createPlan, updatePlan, deletePlan, ensurePlansReady, MODE_DEFAULT_PLAN, ALL_SEED_PLANS };
