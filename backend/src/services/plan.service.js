/** MenuCraft — Plan Service (MariaDB / mysql2) */
const { getMySQLPool } = require('../config/mysql');
const { z } = require('zod');

const planSchema = z.object({
  name: z.string().min(2, 'اسم الباقة مطلوب'),
  price: z.number().nonnegative('السعر يجب أن يكون صفر أو أكثر'),
  currency: z.string().default('USD'),
  interval_type: z.enum(['month', 'year', 'forever', 'trial']).default('month'),
  max_restaurants: z.number().int().default(1).refine((v) => v === -1 || v > 0, 'عدد المواقع: رقم موجب أو -1 للبلا حد'),
  max_menu_items: z.number().int().default(15),
  features: z.union([z.string(), z.array(z.any()), z.record(z.any())]).optional(),
  is_active: z.boolean().default(true)
});
const updateSchema = planSchema.partial();

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
    features: featuresFromDb(row.features),
  };
}

function genId() {
  return `plan-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

async function getAllPlans() {
  const pool = await getMySQLPool();
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute('SELECT * FROM Plans ORDER BY price ASC');
    return rows.map(mapRow);
  } finally { connection.release(); }
}

async function getPlanById(id) {
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
  const pool = await getMySQLPool();
  const connection = await pool.getConnection();
  try {
    const id = genId();
    await connection.execute(
      'INSERT INTO Plans (id, name, price, currency, interval_type, max_restaurants, max_menu_items, features, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [id, parsed.name, parsed.price, parsed.currency, parsed.interval_type, parsed.max_restaurants, parsed.max_menu_items, featuresToDb(parsed.features), parsed.is_active ? 1 : 0]
    );
    const [rows] = await connection.execute('SELECT * FROM Plans WHERE id = ?', [id]);
    return mapRow(rows[0]);
  } finally { connection.release(); }
}

async function updatePlan(id, input) {
  const parsed = updateSchema.parse(input);
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

module.exports = { getAllPlans, getPlanById, createPlan, updatePlan, deletePlan };
