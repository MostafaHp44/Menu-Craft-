const { getMySQLPool } = require('../config/mysql');
const { z } = require('zod');

/**
 * القوالب المخصصة (MySQL / menucraft_mysql) — السوبر أدمن ينسخ قالباً أساسياً
 * باسم/تصنيف جديدين فيظهر القوالب للزوّار في معرض القوالب.
 *
 * Template service (MariaDB / mysql2) — يحافظ على الدوال القديمة بنفس السلوك.
 * (getTemplateById / listTemplates) التي يستخدمها استيراد المنيو.
 */

const templateSchema = z.object({
  name: z.string().min(2, 'اسم القالب مطلوب').max(150, 'اسم القالب طويل جداً'),
  base_template_id: z.string().min(1, 'القالب الأساسي مطلوب'),
  category: z.string().max(100).optional().nullable(),
  is_active: z.boolean().optional()
});

/** تحويل صف القالب إلى الشكل الذي تتوقعه الواجهة */
function toApi(row) {
  return {
    id: row.id,
    name: row.name,
    baseTemplateId: row.base_template_id,
    category: row.category,
    isActive: Boolean(row.is_active),
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function getTemplateById(id) {
  const pool = await getMySQLPool(); const c = await pool.getConnection();
  try { const [r] = await c.execute('SELECT * FROM Templates WHERE id = ?', [id]); return r[0] || null; } finally { c.release(); }
}

async function listTemplates() {
  const pool = await getMySQLPool(); const c = await pool.getConnection();
  try { const [r] = await c.execute('SELECT * FROM Templates ORDER BY created_at DESC'); return r || []; } finally { c.release(); }
}

/** القوالب الفعّالة فقط — هذه ما يراه الزائر في المعرض */
async function getActiveTemplates() {
  const pool = await getMySQLPool();
  const c = await pool.getConnection();
  try {
    const [rows] = await c.execute('SELECT * FROM Templates WHERE is_active = 1 ORDER BY created_at DESC');
    return rows.map(toApi);
  } finally {
    c.release();
  }
}

/** كل القوالب (بما فيها المعطّلة) — لوحة الإدارة */
async function getAllTemplates() {
  const pool = await getMySQLPool();
  const c = await pool.getConnection();
  try {
    const [rows] = await c.execute('SELECT * FROM Templates ORDER BY created_at DESC');
    return rows.map(toApi);
  } finally {
    c.release();
  }
}

async function createTemplate(input) {
  const parsed = templateSchema.parse(input);
  const pool = await getMySQLPool();
  const c = await pool.getConnection();
  try {
    // اسم فريد حتى لا يتشابه معرّفات القوالب في الواجهة
    const [dupe] = await c.execute('SELECT id FROM Templates WHERE name = ?', [parsed.name.trim()]);
    if (dupe.length > 0) {
      const err = new Error('يوجد قالب بهذا الاسم مسبقاً');
      err.status = 409;
      throw err;
    }

    const id = `tpl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    await c.execute(
      `INSERT INTO Templates (id, name, base_template_id, category, is_active, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        id,
        parsed.name.trim(),
        parsed.base_template_id,
        parsed.category ?? null,
        parsed.is_active === false ? 0 : 1,
        input.created_by ?? null
      ]
    );
    const [rows] = await c.execute('SELECT * FROM Templates WHERE id = ?', [id]);
    return toApi(rows[0]);
  } finally {
    c.release();
  }
}

async function updateTemplate(id, input) {
  const schema = z.object({
    name: z.string().min(2).max(150).optional(),
    category: z.string().max(100).optional().nullable(),
    base_template_id: z.string().min(1).optional(),
    is_active: z.boolean().optional(),
  });
  const parsed = schema.parse(input || {});
  const pool = await getMySQLPool();
  const c = await pool.getConnection();
  try {
    const [existing] = await c.execute('SELECT * FROM Templates WHERE id = ?', [id]);
    if (!existing.length) {
      const err = new Error('القالب غير موجود');
      err.status = 404;
      throw err;
    }
    const cur = existing[0];
    const next = {
      name: parsed.name !== undefined ? parsed.name.trim() : cur.name,
      category: parsed.category !== undefined ? parsed.category : cur.category,
      base_template_id: parsed.base_template_id !== undefined ? parsed.base_template_id : cur.base_template_id,
      is_active: parsed.is_active !== undefined ? (parsed.is_active ? 1 : 0) : cur.is_active,
    };
    if (next.name !== cur.name) {
      const [dupe] = await c.execute('SELECT id FROM Templates WHERE name = ? AND id != ?', [next.name, id]);
      if (dupe.length > 0) {
        const err = new Error('يوجد قالب بهذا الاسم مسبقاً');
        err.status = 409;
        throw err;
      }
    }
    await c.execute(
      'UPDATE Templates SET name = ?, category = ?, base_template_id = ?, is_active = ?, updated_at = NOW() WHERE id = ?',
      [next.name, next.category, next.base_template_id, next.is_active, id]
    );
    const [rows] = await c.execute('SELECT * FROM Templates WHERE id = ?', [id]);
    return toApi(rows[0]);
  } finally {
    c.release();
  }
}

async function deleteTemplate(id) {
  const pool = await getMySQLPool();
  const c = await pool.getConnection();
  try {
    const [existing] = await c.execute('SELECT id FROM Templates WHERE id = ?', [id]);
    if (existing.length === 0) {
      const err = new Error('القالب غير موجود');
      err.status = 404;
      throw err;
    }

    // تعطيل بدل الحذف إن كان هناك مطاعم تستخدمه (حماية منطقية للعلاقات)
    const [used] = await c.execute('SELECT id FROM Restaurants WHERE templateId = ? LIMIT 1', [id]);
    if (used.length > 0) {
      await c.execute('UPDATE Templates SET is_active = 0, updated_at = NOW() WHERE id = ?', [id]);
      return { deactivated: true };
    }

    await c.execute('DELETE FROM Templates WHERE id = ?', [id]);
    return { deactivated: false };
  } finally {
    c.release();
  }
}

module.exports = {
  getTemplateById,
  listTemplates,
  getActiveTemplates,
  getAllTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
};
