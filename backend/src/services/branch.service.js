/**
 * Branch service — simple, working CRUD against Branches table.
 * Every operation validates restaurant ownership via restaurant_id filter.
 */
const { getPool, sql } = require('../config/db');

async function listBranches(restaurantId) {
  const pool = await getPool();
  return (await pool.request().input('rid', sql.NVarChar, restaurantId)
    .query('SELECT id, name_en, name_ar, name_ku, address, phone, accepting_orders, is_active, opening_hours FROM Branches WHERE restaurant_id = @rid ORDER BY created_at')).recordset;
}

async function getBranch(restaurantId, branchId) {
  const pool = await getPool();
  const r = await pool.request().input('rid', sql.NVarChar, restaurantId).input('bid', sql.NVarChar, branchId)
    .query('SELECT * FROM Branches WHERE id = @bid AND restaurant_id = @rid');
  return r.recordset[0] || null;
}

async function createBranch(rid, data) {
  const pool = await getPool();
  await pool.request()
    .input('rid', sql.NVarChar, rid)
    .input('n', sql.NVarChar, data.name || '')
    .input('a', sql.NVarChar, (data.address || '').substring(0, 500))
    .input('p', sql.NVarChar, data.phone || '')
    .input('acc', sql.Bit, data.acceptingOrders === false ? 0 : 1)
    .input('h', sql.NVarChar, data.openingHours || null)
    .query(`INSERT INTO Branches (restaurant_id, name_en, address, phone, accepting_orders, opening_hours) VALUES (@rid, @n, @a, @p, @acc, @h)`);
  return { created: true };
}

async function updateBranch(rid, bid, data) {
  const pool = await getPool();
  const fields = [];
  if (data.name !== undefined) { fields.push('name_en = @n'); }
  if (data.address !== undefined) { fields.push('address = @a'); }
  if (data.phone !== undefined) { fields.push('phone = @p'); }
  if (data.acceptingOrders !== undefined) { fields.push('accepting_orders = @acc'); }
  if (data.isActive !== undefined) { fields.push('is_active = @act'); }
  if (data.openingHours !== undefined) { fields.push('opening_hours = @h'); }
  if (!fields.length) return { updated: false };
  const q = `UPDATE Branches SET ${fields.join(', ')}, updated_at = GETDATE() WHERE id = @bid AND restaurant_id = @rid`;
  const req = pool.request().input('rid', sql.NVarChar, rid).input('bid', sql.NVarChar, bid);
  if (data.name !== undefined) req.input('n', sql.NVarChar, data.name);
  if (data.address !== undefined) req.input('a', sql.NVarChar, data.address);
  if (data.phone !== undefined) req.input('p', sql.NVarChar, data.phone);
  if (data.acceptingOrders !== undefined) req.input('acc', sql.Bit, data.acceptingOrders === false ? 0 : 1);
  if (data.isActive !== undefined) req.input('act', sql.Bit, data.isActive ? 1 : 0);
  if (data.openingHours !== undefined) req.input('h', sql.NVarChar, data.openingHours);
  await req.query(q);
  return { updated: true };
}

module.exports = { listBranches, getBranch, createBranch, updateBranch };
