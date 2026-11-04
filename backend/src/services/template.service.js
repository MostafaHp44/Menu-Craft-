const { getPool, sql } = require('../config/db');
const { z } = require('zod');

/**
 * القوالب المخصصة: السوبر أدمن ينسخ قالباً أساسياً قائماً باسم/تصنيف
 * جديدين، ويظهر القالب للزوّار في معرض القوالب.
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

/** القوالب الفعّالة فقط — هذه ما يراه الزائر في المعرض */
async function getActiveTemplates() {
  const pool = await getPool();
  const result = await pool.request().query(
    'SELECT * FROM Templates WHERE is_active = 1 ORDER BY created_at DESC'
  );
  return result.recordset.map(toApi);
}

/** كل القوالب (بما فيها المعطّلة) — لوحة الإدارة */
async function getAllTemplates() {
  const pool = await getPool();
  const result = await pool.request().query('SELECT * FROM Templates ORDER BY created_at DESC');
  return result.recordset.map(toApi);
}

async function createTemplate(input) {
  const parsed = templateSchema.parse(input);
  const pool = await getPool();
  const now = new Date();

  // اسم فريد حتى لا يتشابه معرّفات القوالب في الواجهة
  const dupe = await pool.request()
    .input('name', sql.NVarChar, parsed.name.trim())
    .query('SELECT id FROM Templates WHERE name = @name');

  if (dupe.recordset.length > 0) {
    const err = new Error('يوجد قالب بهذا الاسم مسبقاً');
    err.status = 409;
    throw err;
  }

  const id = `tpl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  const result = await pool.request()
    .input('id', sql.VarChar, id)
    .input('name', sql.NVarChar, parsed.name.trim())
    .input('baseTemplateId', sql.NVarChar, parsed.base_template_id)
    .input('category', sql.NVarChar, parsed.category ?? null)
    .input('isActive', sql.Bit, parsed.is_active === false ? 0 : 1)
    .input('createdBy', sql.VarChar, input.created_by ?? null)
    .input('now', sql.DateTime, now)
    .query(`
      INSERT INTO Templates (id, name, base_template_id, category, is_active, created_by, created_at, updated_at)
      OUTPUT INSERTED.id, INSERTED.name, INSERTED.base_template_id, INSERTED.category,
             INSERTED.is_active, INSERTED.created_by, INSERTED.created_at, INSERTED.updated_at
      VALUES (@id, @name, @baseTemplateId, @category, @isActive, @createdBy, @now, @now)
    `);

  return toApi(result.recordset[0]);
}

async function deleteTemplate(id) {
  const pool = await getPool();

  const existing = await pool.request()
    .input('id', sql.VarChar, id)
    .query('SELECT id FROM Templates WHERE id = @id');

  if (existing.recordset.length === 0) {
    const err = new Error('القالب غير موجود');
    err.status = 404;
    throw err;
  }

  // تعطيل بدل الحذف إن كان هناك مطاعم تستخدمه (حماية FK منطقية)
  const used = await pool.request()
    .input('templateId', sql.NVarChar, id)
    .query('SELECT TOP 1 id FROM Restaurants WHERE templateId = @templateId');

  const now = new Date();
  if (used.recordset.length > 0) {
    await pool.request()
      .input('id', sql.VarChar, id)
      .input('now', sql.DateTime, now)
      .query('UPDATE Templates SET is_active = 0, updated_at = @now WHERE id = @id');
    return { deactivated: true };
  }

  await pool.request()
    .input('id', sql.VarChar, id)
    .query('DELETE FROM Templates WHERE id = @id');

  return { deactivated: false };
}

module.exports = {
  getActiveTemplates,
  getAllTemplates,
  createTemplate,
  deleteTemplate
};
