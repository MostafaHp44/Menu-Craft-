const { getPool, sql } = require('../config/db');
const { z } = require('zod');

const planSchema = z.object({
  name: z.string().min(2, 'اسم الباقة مطلوب'),
  price: z.number().nonnegative('السعر يجب أن يكون صفر أو أكثر'),
  currency: z.string().default('USD'),
  interval_type: z.enum(['month', 'year', 'forever', 'trial']).default('month'),
  max_restaurants: z.number().int().default(1).refine((v) => v === -1 || v > 0, 'عدد المواقع: رقم موجب أو -1 للبلا حد'),
  max_menu_items: z.number().int().default(15),
  // المميزات تصل كنص JSON أو كمصفوفة/كائن — نوحّدها إلى نص قبل التخزين
  features: z.union([z.string(), z.array(z.any()), z.record(z.any())]).optional(),
  is_active: z.boolean().default(true)
});

/** تحويل قيمة features إلى نص JSON صالح للتخزين في NVARCHAR(MAX) */
function featuresToDb(value) {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

/** قراءة features من قاعدة البيانات إلى كائن/مصفوفة */
function featuresFromDb(value) {
  if (!value) return {};
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

async function getAllPlans() {
  const pool = await getPool();
  const result = await pool.request().query('SELECT * FROM Plans ORDER BY price ASC');
  return result.recordset.map(p => ({ ...p, features: featuresFromDb(p.features) }));
}

async function getPlanById(id) {
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.VarChar, id)
    .query('SELECT * FROM Plans WHERE id = @id');

  if (result.recordset.length === 0) {
    const err = new Error('الباقة غير موجودة');
    err.status = 404;
    throw err;
  }
  const p = result.recordset[0];
  return { ...p, features: featuresFromDb(p.features) };
}

async function createPlan(input) {
  const parsed = planSchema.parse(input);
  const pool = await getPool();
  const now = new Date().toISOString();

  const result = await pool.request()
    .input('name', sql.NVarChar, parsed.name)
    .input('price', sql.Decimal(10, 2), parsed.price)
    .input('currency', sql.NVarChar, parsed.currency)
    .input('interval_type', sql.NVarChar, parsed.interval_type)
    .input('max_restaurants', sql.Int, parsed.max_restaurants)
    .input('max_menu_items', sql.Int, parsed.max_menu_items)
    .input('features', sql.NVarChar, featuresToDb(parsed.features))
    .input('is_active', sql.Bit, parsed.is_active ? 1 : 0)
    .input('created_at', sql.DateTime, now)
    .query(`
      INSERT INTO Plans (name, price, currency, interval_type, max_restaurants, max_menu_items, features, is_active, created_at, updated_at)
      OUTPUT INSERTED.id, INSERTED.name, INSERTED.price, INSERTED.currency, INSERTED.interval_type, INSERTED.max_restaurants, INSERTED.max_menu_items, INSERTED.features, INSERTED.is_active, INSERTED.created_at, INSERTED.updated_at
      VALUES (@name, @price, @currency, @interval_type, @max_restaurants, @max_menu_items, @features, @is_active, @created_at, @created_at)
    `);

  const p = result.recordset[0];
  return { ...p, features: featuresFromDb(p.features) };
}

async function updatePlan(id, input) {
  const parsed = planSchema.partial().parse(input);
  const pool = await getPool();

  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (parsed.name !== undefined) { fields.push(`name = @p${paramIndex}`); values.push({ name: `p${paramIndex++}`, type: sql.NVarChar, value: parsed.name }); }
  if (parsed.price !== undefined) { fields.push(`price = @p${paramIndex}`); values.push({ name: `p${paramIndex++}`, type: sql.Decimal(10, 2), value: parsed.price }); }
  if (parsed.currency !== undefined) { fields.push(`currency = @p${paramIndex}`); values.push({ name: `p${paramIndex++}`, type: sql.NVarChar, value: parsed.currency }); }
  if (parsed.interval_type !== undefined) { fields.push(`interval_type = @p${paramIndex}`); values.push({ name: `p${paramIndex++}`, type: sql.NVarChar, value: parsed.interval_type }); }
  if (parsed.max_restaurants !== undefined) { fields.push(`max_restaurants = @p${paramIndex}`); values.push({ name: `p${paramIndex++}`, type: sql.Int, value: parsed.max_restaurants }); }
  if (parsed.max_menu_items !== undefined) { fields.push(`max_menu_items = @p${paramIndex}`); values.push({ name: `p${paramIndex++}`, type: sql.Int, value: parsed.max_menu_items }); }
  if (parsed.features !== undefined) { fields.push(`features = @p${paramIndex}`); values.push({ name: `p${paramIndex++}`, type: sql.NVarChar, value: featuresToDb(parsed.features) }); }
  if (parsed.is_active !== undefined) { fields.push(`is_active = @p${paramIndex}`); values.push({ name: `p${paramIndex++}`, type: sql.Bit, value: parsed.is_active ? 1 : 0 }); }

  fields.push('updated_at = GETDATE()');

  if (fields.length === 0) {
    const err = new Error('لا توجد بيانات للتعديل');
    err.status = 400;
    throw err;
  }

  const request = pool.request();
  request.input('id', sql.VarChar, id);
  values.forEach(v => request.input(v.name, v.type, v.value));

  const result = await request.query(`
    UPDATE Plans
    SET ${fields.join(', ')}
    OUTPUT INSERTED.id, INSERTED.name, INSERTED.price, INSERTED.currency, INSERTED.interval_type, INSERTED.max_restaurants, INSERTED.max_menu_items, INSERTED.features, INSERTED.is_active, INSERTED.updated_at
    WHERE id = @id
  `);

  if (result.recordset.length === 0) {
    const err = new Error('الباقة غير موجودة');
    err.status = 404;
    throw err;
  }

  const p = result.recordset[0];
  return { ...p, features: featuresFromDb(p.features) };
}

async function deletePlan(id) {
  const pool = await getPool();

  // لو فيه اشتراكات مرتبطة بالباقة، نُعطلها بدل حذفها (حماية الـ FK)
  const used = await pool.request()
    .input('id', sql.VarChar, id)
    .query('SELECT COUNT(*) AS cnt FROM Subscriptions WHERE plan_id = @id');

  if (used.recordset[0].cnt > 0) {
    await pool.request()
      .input('id', sql.VarChar, id)
      .query('UPDATE Plans SET is_active = 0, updated_at = GETDATE() WHERE id = @id');
    return { deleted: true, id, deactivated: true };
  }

  const result = await pool.request()
    .input('id', sql.VarChar, id)
    .query('DELETE FROM Plans OUTPUT DELETED.id WHERE id = @id');

  if (result.recordset.length === 0) {
    const err = new Error('الباقة غير موجودة');
    err.status = 404;
    throw err;
  }
  return { deleted: true, id };
}

module.exports = {
  getAllPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan
};
