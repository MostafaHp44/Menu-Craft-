/**
 * سجل النشاط (Audit log) — جدول `employeeactivitylog`.
 *
 * يقرأه مسار `/api/owner/audit` ويكتبه خطافات الكتابة الحقيقية في الخادم
 * (تغيير حالة الطلب، تعديلات الموظفين). لا بيانات مزروعة — كل سطر نشاط
 * حدث فعلًا في قاعدة البيانات.
 */
const { getMySQLPool } = require('../config/mysql');

const CATEGORIES = {
  orders: 'order.',
  employees: 'employee.',
};

/** اسم فعلي من جدول Users — يُستدعى مرة واحدة لكل نشاط فقط */
async function resolveActorName(connection, userId) {
  if (!userId) return null;
  try {
    const [rows] = await connection.execute('SELECT name FROM Users WHERE id = ?', [userId]);
    return rows[0]?.name || null;
  } catch (_) {
    return null;
  }
}

/**
 * يسجّل نشاطًا واحدًا. أي فشل هنا لا يُفشل العملية الأصلية أبدًا —
 * السجل ميزة مساندة وليس شرطًا لنجاح الكتابة.
 *
 * @param {object} entry
 * @param {string} entry.restaurantId مطلوب (عمود NOT NULL)
 * @param {string} [entry.userId] الفاعل من التوكن
 * @param {string} [entry.actorName] يُستكمل من Users عند غيابه
 * @param {string} [entry.actorRole]
 * @param {string} entry.action مثال: `order.status_changed`
 * @param {unknown} [entry.details] يُخزَّن JSON
 * @param {string} [entry.branchId]
 * @param {string} [entry.ip]
 * @param {string} [entry.userAgent]
 */
async function logActivity(entry) {
  if (!entry || !entry.restaurantId || !entry.action) return;
  let connection;
  try {
    const pool = await getMySQLPool();
    connection = await pool.getConnection();
    const actorName = entry.actorName || (await resolveActorName(connection, entry.userId));
    await connection.execute(
      `INSERT INTO employeeactivitylog
         (user_id, restaurant_id, branch_id, actor_name, actor_role, actor_snapshot_at, action, details, ip_address, user_agent, created_at)
       VALUES (?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, NOW())`,
      [
        entry.userId || null,
        entry.restaurantId,
        entry.branchId || null,
        actorName,
        entry.actorRole || null,
        entry.action,
        entry.details === undefined || entry.details === null ? null : JSON.stringify(entry.details),
        entry.ip || null,
        entry.userAgent ? String(entry.userAgent).slice(0, 500) : null,
      ]
    );
  } catch (err) {
    // السجل مساند — نكتبه في سجل الخادم فقط ولا نُفشل العملية
    if (connection) {
      try { connection.release(); } catch (_) { /* ignore */ }
    }
    return;
  }
  try { connection.release(); } catch (_) { /* ignore */ }
}

/**
 * استعلام `/api/owner/audit` — مقيّد بموقع الفاعل (عزل المستأجرين).
 * @param {string} restaurantId
 * @param {{from?: string, to?: string, category?: string, action?: string, limit?: number, offset?: number}} filters
 */
async function listActivity(restaurantId, filters = {}) {
  const pool = await getMySQLPool();
  const connection = await pool.getConnection();
  try {
    const where = ['restaurant_id = ?'];
    const params = [restaurantId];

    if (filters.from) { where.push('DATE(created_at) >= ?'); params.push(filters.from); }
    if (filters.to) { where.push('DATE(created_at) <= ?'); params.push(filters.to); }
    if (filters.action) { where.push('action = ?'); params.push(filters.action); }
    // `category` يطابق بادئة الفعل: orders → `order.*` ، employees → `employee.*`
    if (filters.category && CATEGORIES[filters.category]) {
      where.push('action LIKE ?');
      params.push(`${CATEGORIES[filters.category]}%`);
    }

    const whereSql = where.join(' AND ');
    const limit = Math.min(Math.max(Number(filters.limit) || 25, 1), 100);
    const offset = Math.max(Number(filters.offset) || 0, 0);

    const [[countRow]] = await connection.execute(
      `SELECT COUNT(*) AS total FROM employeeactivitylog WHERE ${whereSql}`,
      params
    );
    const [rows] = await connection.execute(
      `SELECT id, action, actor_name, actor_role, actor_snapshot_at, user_id, branch_id, details, created_at
       FROM employeeactivitylog
       WHERE ${whereSql}
       ORDER BY created_at DESC, id DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    const items = (rows || []).map((row) => {
      let details = row.details;
      if (typeof details === 'string' && details) {
        try { details = JSON.parse(details); } catch (_) { /* نص حر — يُعرض كما هو */ }
      }
      return { ...row, details: details ?? null };
    });

    return { total: countRow?.total || 0, limit, offset, items };
  } finally {
    connection.release();
  }
}

module.exports = { logActivity, listActivity };
