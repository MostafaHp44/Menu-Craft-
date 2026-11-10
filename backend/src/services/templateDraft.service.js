const { getMySQLPool } = require('../config/mysql');

function httpError(status, message, code) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
}

/**
 * حفظ مسودة قالب — مقيّد بالحساب صاحب المسودة (P1).
 * التوكن يبقى مفتاح المسودة، لكن السجل يُربط بـ `user_id` لأول مرة يحفظه
 * مالكه؛ ومحاولة حساب آخر إعادة كتابة مسودة ليست له تُرفض 403.
 */
async function saveDraft(draftToken, data, userId) {
  const pool = await getMySQLPool();
  const c = await pool.getConnection();
  try {
    const [existing] = await c.execute(
      'SELECT user_id FROM TemplateDrafts WHERE draft_token = ?',
      [draftToken]
    );
    if (existing.length > 0) {
      const ownerId = existing[0].user_id;
      if (ownerId && userId && ownerId !== userId) {
        throw httpError(403, 'ليست لديك صلاحية على هذه المسودة', 'FORBIDDEN');
      }
      await c.execute(
        'UPDATE TemplateDrafts SET design_json = ?, restaurant_name = ?, user_id = COALESCE(user_id, ?), updated_at = NOW() WHERE draft_token = ?',
        [JSON.stringify(data), data.restaurantName || null, userId || null, draftToken]
      );
      return;
    }
    const draftId = `td-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    await c.execute(
      'INSERT INTO TemplateDrafts (id, draft_token, design_json, restaurant_name, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
      [draftId, draftToken, JSON.stringify(data), data.restaurantName || null, userId || null]
    );
  } finally {
    c.release();
  }
}

/** قراءة مسودة بالتوكن — التحقق من الملكية مسؤولية المسار (route). */
async function getDraft(draftToken) {
  const pool = await getMySQLPool();
  const c = await pool.getConnection();
  try {
    const [rows] = await c.execute('SELECT * FROM TemplateDrafts WHERE draft_token = ?', [draftToken]);
    return rows[0] || null;
  } finally {
    c.release();
  }
}

module.exports = { saveDraft, getDraft };
