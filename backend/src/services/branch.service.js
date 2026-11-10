/**
 * Branch service — MariaDB / mysql2 version.
 * Every operation validates restaurant ownership via restaurant_id filter.
 * Schema note: MariaDB `Branches` uses a single `name` column (not name_en/ar/ku).
 */
const { getMySQLPool } = require('../config/mysql');

async function listBranches(restaurantId) {
  const pool = await getMySQLPool();
  const c = await pool.getConnection();
  try {
    const [rows] = await c.execute(
      'SELECT id, restaurant_id, name, address, phone, accepting_orders, is_active, opening_hours, created_at, updated_at FROM Branches WHERE restaurant_id = ? ORDER BY created_at',
      [restaurantId]
    );
    return rows;
  } finally { c.release(); }
}

async function getBranch(restaurantId, branchId) {
  const pool = await getMySQLPool();
  const c = await pool.getConnection();
  try {
    const [rows] = await c.execute('SELECT * FROM Branches WHERE id = ? AND restaurant_id = ?', [branchId, restaurantId]);
    return rows[0] || null;
  } finally { c.release(); }
}

/** Back-compat helper used elsewhere */
async function getBranchById(id) {
  const pool = await getMySQLPool();
  const c = await pool.getConnection();
  try {
    const [rows] = await c.execute('SELECT * FROM Branches WHERE id = ?', [id]);
    return rows[0] || null;
  } finally { c.release(); }
}

async function createBranch(rid, data) {
  const pool = await getMySQLPool();
  const c = await pool.getConnection();
  try {
    const id = `br-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    // `opening_hours` is longtext with CHECK (json_valid(opening_hours)) — store a JSON string (or NULL)
    const openingHours = data.openingHours ? JSON.stringify(String(data.openingHours)) : null;
    await c.execute(
      'INSERT INTO Branches (id, restaurant_id, name, address, phone, accepting_orders, is_active, opening_hours, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, NOW(), NOW())',
      [
        id,
        rid,
        String(data.name || '').slice(0, 200),
        String(data.address || '').slice(0, 500),
        data.phone || null,
        data.acceptingOrders === false ? 0 : 1,
        openingHours,
      ]
    );
    return { created: true, id };
  } finally { c.release(); }
}

async function updateBranch(rid, bid, data) {
  const pool = await getMySQLPool();
  const c = await pool.getConnection();
  try {
    const fields = [];
    const params = [];
    // يُقبل الاسم الـ snake_case القادم من الواجهة والـ camelCase معًا —
    // وإلا يتجاهَل الحقل ويُعاد `{ updated: false }` دون أي كتابة في القاعدة.
    const accepting = data.acceptingOrders !== undefined ? data.acceptingOrders : data.accepting_orders;
    const active = data.isActive !== undefined ? data.isActive : data.is_active;
    if (data.name !== undefined) { fields.push('name = ?'); params.push(data.name); }
    if (data.address !== undefined) { fields.push('address = ?'); params.push(data.address); }
    if (data.phone !== undefined) { fields.push('phone = ?'); params.push(data.phone); }
    if (accepting !== undefined) { fields.push('accepting_orders = ?'); params.push(accepting === false || accepting === 0 ? 0 : 1); }
    if (active !== undefined) { fields.push('is_active = ?'); params.push(active === false || active === 0 ? 0 : 1); }
    if (data.openingHours !== undefined) { fields.push('opening_hours = ?'); params.push(data.openingHours ? JSON.stringify(String(data.openingHours)) : null); }
    if (!fields.length) return { updated: false, reason: 'EMPTY_UPDATE' };
    fields.push('updated_at = NOW()');
    params.push(bid, rid);
    const [r] = await c.execute(`UPDATE Branches SET ${fields.join(', ')} WHERE id = ? AND restaurant_id = ?`, params);
    // affectedRows = 0 يعني إما أن الفرع غير موجود أو أنه تابع لمطعم آخر (عزل المستأجرين)
    return { updated: r.affectedRows > 0, affectedRows: r.affectedRows };
  } finally { c.release(); }
}

module.exports = { listBranches, getBranch, getBranchById, createBranch, updateBranch };
