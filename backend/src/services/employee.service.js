/**
 * MenuCraft — Employee Service (MariaDB / mysql2 version)
 *
 * The real schema has NO `Employees` table — an employee is a `Users` row with a
 * `RestaurantEmployees` link row (role_id → `roles`, branch_access_type) and
 * optional `EmployeeBranchAccess` rows (restaurant_employee_id → RestaurantEmployees.id).
 */
const { getMySQLPool } = require('../config/mysql');
const { hashPassword } = require('../utils/hash');

/**
 * أدوار الموظفين داخل المطعم فقط. لا يجوز ترقية أي حساب إلى super_admin/admin
 * من هنا — إدارة المنصة لها مسارات خاصة محمية بـ requireSuperAdmin
 * (`POST /api/platform/admins`). (إصلاح P0 C-2)
 */
const ROLES = new Set(['waiter', 'kitchen', 'cashier']);
const ACCESS = new Set(['all', 'assigned', 'none']);
const ALLOWED_ROLES_DB = {
  waiter: '489BBCFF-AC73-4163-85EB-57D7108C3F5F',
  kitchen: '12BC9C57-A6E5-4424-9A99-6A46A6DB291F',
  cashier: '04F15493-332D-4BF0-9E3D-2B3CE757E7E3',
};

function deriveUsername(email) { return (email || '').split('@')[0].replace(/[^a-z0-9]/gi, '').slice(0, 30); }

function validate(data, { requirePassword = true } = {}) {
  if (!data?.name?.trim()) throw Object.assign(new Error('name required'), { status: 400 });
  if (!data?.email?.trim()) throw Object.assign(new Error('email required'), { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) throw Object.assign(new Error('invalid email'), { status: 400 });
  if (requirePassword && (!data?.password || data.password.length < 6)) throw Object.assign(new Error('password must be 6+ chars'), { status: 400 });
  if (!ROLES.has(data.role)) throw Object.assign(new Error('invalid role'), { status: 400 });
  if (!ACCESS.has(data.branchAccessType)) throw Object.assign(new Error('invalid branch access'), { status: 400 });
  const ids = [...new Set((data.branchIds || []).map(String).filter(Boolean))];
  if (data.branchAccessType === 'assigned' && !ids.length) throw Object.assign(new Error('assigned requires branches'), { status: 400 });
  return ids;
}

function resolveRoleId(roleName) { return ALLOWED_ROLES_DB[roleName] || null; }

async function assertBranches(connection, rid, ids) {
  for (const id of ids) {
    const [r] = await connection.execute('SELECT 1 FROM Branches WHERE id = ? AND restaurant_id = ? AND is_active = 1', [id, rid]);
    if (!r.length) throw Object.assign(new Error('branch not active/owned'), { status: 403 });
  }
}

async function listEmployees(rid) {
  const pool = await getMySQLPool();
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      `SELECT re.id AS re_id, u.id AS user_id, u.name, u.email, u.role, u.status AS user_status,
              re.branch_access_type, re.status, re.created_at,
              COALESCE((SELECT GROUP_CONCAT(a.branch_id SEPARATOR '|') FROM EmployeeBranchAccess a WHERE a.restaurant_employee_id = re.id AND a.allowed = 1), '') AS branch_ids_raw,
              COALESCE((SELECT GROUP_CONCAT(b.name SEPARATOR '|') FROM EmployeeBranchAccess a JOIN Branches b ON b.id = a.branch_id WHERE a.restaurant_employee_id = re.id AND a.allowed = 1), '') AS branch_names_raw
       FROM RestaurantEmployees re
       JOIN Users u ON u.id = re.user_id
       WHERE re.restaurant_id = ? AND re.status <> 'removed'
       ORDER BY re.created_at DESC`,
      [rid]
    );
    return (rows || []).map((x) => ({
      id: x.re_id,
      user_id: x.user_id,
      name: x.name,
      email: x.email,
      role: x.role,
      is_active: x.status === 'active' ? 1 : 0,
      status: x.status,
      branch_access_type: x.branch_access_type || 'all',
      created_at: x.created_at,
      branchIds: x.branch_ids_raw ? x.branch_ids_raw.split('|').filter(Boolean) : [],
      branchNames: x.branch_names_raw ? x.branch_names_raw.split('|').filter(Boolean) : [],
    }));
  } finally { connection.release(); }
}

async function createEmployee(data, restaurantId) {
  const ids = validate(data);
  const pool = await getMySQLPool();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await assertBranches(connection, restaurantId, ids);

    const roleId = resolveRoleId(data.role);
    if (!roleId) throw Object.assign(new Error('invalid role'), { status: 400 });
    const employeeId = `emp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const linkId = `re-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const email = data.email.trim().toLowerCase();
    const pw = await hashPassword(data.password);

    await connection.execute(
      'INSERT INTO Users (id, name, email, password_hash, role, restaurant_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [employeeId, data.name.trim(), email, pw, data.role, restaurantId, 'active']
    );

    await connection.execute(
      "INSERT INTO RestaurantEmployees (id, restaurant_id, user_id, role_id, branch_access_type, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'active', NOW(), NOW())",
      [linkId, restaurantId, employeeId, roleId, data.branchAccessType || 'all']
    );

    for (const branchId of ids) {
      await connection.execute(
        'INSERT INTO EmployeeBranchAccess (id, restaurant_employee_id, branch_id, allowed, created_at) VALUES (?, ?, ?, 1, NOW())',
        [`eba-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, linkId, branchId]
      );
    }

    await connection.commit();
    return { id: linkId, userId: employeeId, name: data.name.trim(), email, role: data.role };
  } catch (e) {
    try { await connection.rollback(); } catch (_) {}
    throw e;
  } finally { connection.release(); }
}

async function updateEmployee(empId, data) {
  const pool = await getMySQLPool();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [emp] = await connection.execute('SELECT restaurant_id, user_id FROM RestaurantEmployees WHERE id = ?', [empId]);
    if (!emp.length) throw Object.assign(new Error('not found'), { status: 404 });
    const rid = emp[0].restaurant_id;
    const ids = validate(data, { requirePassword: false });
    await assertBranches(connection, rid, ids);

    const roleId = resolveRoleId(data.role);
    if (!roleId) throw Object.assign(new Error('invalid role'), { status: 400 });
    await connection.execute('UPDATE Users SET name = ?, email = ?, role = ? WHERE id = ?',
      [data.name.trim(), data.email.trim().toLowerCase(), data.role, emp[0].user_id]);
    await connection.execute('UPDATE RestaurantEmployees SET role_id = ?, branch_access_type = ?, updated_at = NOW() WHERE id = ?',
      [roleId, data.branchAccessType || 'all', empId]);
    await connection.execute('DELETE FROM EmployeeBranchAccess WHERE restaurant_employee_id = ?', [empId]);
    for (const branchId of ids) {
      await connection.execute(
        'INSERT INTO EmployeeBranchAccess (id, restaurant_employee_id, branch_id, allowed, created_at) VALUES (?, ?, ?, 1, NOW())',
        [`eba-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, empId, branchId]
      );
    }

    await connection.commit();
    return { updated: true };
  } catch (e) {
    try { await connection.rollback(); } catch (_) {}
    throw e;
  } finally { connection.release(); }
}

async function deactivateEmployee(empId) {
  const pool = await getMySQLPool();
  const connection = await pool.getConnection();
  try {
    const [emp] = await connection.execute('SELECT restaurant_id, user_id FROM RestaurantEmployees WHERE id = ?', [empId]);
    if (!emp.length) throw Object.assign(new Error('not found'), { status: 404 });
    await connection.execute("UPDATE RestaurantEmployees SET status = 'removed', updated_at = NOW() WHERE id = ?", [empId]);
    await connection.execute('DELETE FROM EmployeeBranchAccess WHERE restaurant_employee_id = ?', [empId]);
    return { deactivated: true };
  } finally { connection.release(); }
}

/* --------------------------------------------------------------------------
 * عمليات جزئية تُستدعى من مسارات PATCH (P1): كلها تتحقق أولًا أن الرابط
 * يعود للمطعم المطلوب — لا يُعدَّل موظف من مطعم آخر مهما كان الطلب.
 * ------------------------------------------------------------------------ */

async function loadEmployee(connection, empId, restaurantId) {
  const [rows] = await connection.execute(
    'SELECT id, restaurant_id, user_id FROM RestaurantEmployees WHERE id = ?',
    [empId]
  );
  if (!rows.length) throw Object.assign(new Error('not found'), { status: 404 });
  if (restaurantId && String(rows[0].restaurant_id) !== String(restaurantId)) {
    throw Object.assign(new Error('الموظف غير موجود في هذا الموقع'), { status: 404 });
  }
  return rows[0];
}

/** تحديث جزئي للاسم/البريد — الحقول غير المُرسلة لا تُمس */
async function updateEmployeeProfile(empId, restaurantId, data) {
  const pool = await getMySQLPool();
  const connection = await pool.getConnection();
  try {
    const emp = await loadEmployee(connection, empId, restaurantId);
    const fields = [];
    const params = [];
    if (data.name !== undefined) {
      const name = String(data.name).trim();
      if (!name) throw Object.assign(new Error('name required'), { status: 400 });
      fields.push('name = ?'); params.push(name);
    }
    if (data.email !== undefined) {
      const email = String(data.email).trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw Object.assign(new Error('invalid email'), { status: 400 });
      const [dupe] = await connection.execute('SELECT id FROM Users WHERE email = ? AND id <> ?', [email, emp.user_id]);
      if (dupe.length) throw Object.assign(new Error('البريد الإلكتروني مستخدم مسبقًا'), { status: 409 });
      fields.push('email = ?'); params.push(email);
    }
    if (!fields.length) return { updated: false };
    params.push(emp.user_id);
    await connection.execute(`UPDATE Users SET ${fields.join(', ')} WHERE id = ?`, params);
    return { updated: true };
  } finally { connection.release(); }
}

/** تغيير الدور — للأدوار الثلاثة داخل المطعم فقط (لا ترقية إلى إدارة المنصة) */
async function setEmployeeRole(empId, restaurantId, roleName) {
  if (!ROLES.has(roleName)) throw Object.assign(new Error('invalid role'), { status: 400 });
  const roleId = resolveRoleId(roleName);
  if (!roleId) throw Object.assign(new Error('invalid role'), { status: 400 });
  const pool = await getMySQLPool();
  const connection = await pool.getConnection();
  try {
    const emp = await loadEmployee(connection, empId, restaurantId);
    await connection.execute('UPDATE Users SET role = ? WHERE id = ?', [roleName, emp.user_id]);
    await connection.execute('UPDATE RestaurantEmployees SET role_id = ?, updated_at = NOW() WHERE id = ?', [roleId, empId]);
    return { role: roleName };
  } finally { connection.release(); }
}

/** صلاحيات الفروع — تُتحقق من ملكية النشاط وفعاليته داخل نفس المطعم */
async function setEmployeeBranches(empId, restaurantId, branchAccessType, branchIds) {
  if (!ACCESS.has(branchAccessType)) throw Object.assign(new Error('invalid branch access'), { status: 400 });
  const ids = [...new Set((branchIds || []).map(String).filter(Boolean))];
  if (branchAccessType === 'assigned' && !ids.length) {
    throw Object.assign(new Error('assigned requires branches'), { status: 400 });
  }
  const pool = await getMySQLPool();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const emp = await loadEmployee(connection, empId, restaurantId);
    await assertBranches(connection, restaurantId, ids);
    await connection.execute('UPDATE RestaurantEmployees SET branch_access_type = ?, updated_at = NOW() WHERE id = ?', [branchAccessType, empId]);
    await connection.execute('DELETE FROM EmployeeBranchAccess WHERE restaurant_employee_id = ?', [empId]);
    for (const branchId of ids) {
      await connection.execute(
        'INSERT INTO EmployeeBranchAccess (id, restaurant_employee_id, branch_id, allowed, created_at) VALUES (?, ?, ?, 1, NOW())',
        [`eba-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, empId, branchId]
      );
    }
    await connection.commit();
    return { branch_access_type: branchAccessType, branchIds: ids, user_id: emp.user_id };
  } catch (e) {
    try { await connection.rollback(); } catch (_) { /* ignore */ }
    throw e;
  } finally { connection.release(); }
}

/**
 * تعليق/إعادة تفعيل موظف — يمنع الدخول فعليًا عبر `Users.status`
 * (فحص الحالة موجود في تسجيل الدخول) ويحدّث حالة الرابط لعرضها في اللوحة.
 */
async function setEmployeeLifecycle(empId, restaurantId, lifecycle) {
  const next = lifecycle === 'suspended' ? 'suspended' : 'active';
  const pool = await getMySQLPool();
  const connection = await pool.getConnection();
  try {
    const emp = await loadEmployee(connection, empId, restaurantId);
    const [current] = await connection.execute('SELECT status FROM RestaurantEmployees WHERE id = ?', [empId]);
    if (!current.length || current[0].status === 'removed') {
      throw Object.assign(new Error('not found'), { status: 404 });
    }
    await connection.execute('UPDATE RestaurantEmployees SET status = ?, updated_at = NOW() WHERE id = ?', [next, empId]);
    await connection.execute('UPDATE Users SET status = ? WHERE id = ?', [next, emp.user_id]);
    return { status: next };
  } finally { connection.release(); }
}

/**
 * تغيير كلمة مرور.
 * - التغيير الذاتي: يُطلب كلمة المرور الحالية ويُتحقق منها.
 * - إعادة تعيين من إدارة الموقع/المنصة: بلا كلمة حالية.
 */
async function changeUserPassword(userId, { currentPassword, newPassword, requireCurrent }) {
  if (!newPassword || String(newPassword).length < 6) {
    throw Object.assign(new Error('password must be 6+ chars'), { status: 400 });
  }
  const pool = await getMySQLPool();
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute('SELECT id, password_hash FROM Users WHERE id = ?', [userId]);
    if (!rows.length) throw Object.assign(new Error('المستخدم غير موجود'), { status: 404 });
    if (requireCurrent) {
      const { comparePassword } = require('../utils/hash');
      const ok = currentPassword ? await comparePassword(String(currentPassword), rows[0].password_hash) : false;
      if (!ok) throw Object.assign(new Error('كلمة المرور الحالية غير صحيحة'), { status: 403 });
    }
    const { hashPassword } = require('../utils/hash');
    const hash = await hashPassword(String(newPassword));
    await connection.execute('UPDATE Users SET password_hash = ? WHERE id = ?', [hash, userId]);
    return { needsPasswordChange: false, status: 'active' };
  } finally { connection.release(); }
}

module.exports = {
  ROLES,
  ACCESS,
  validate,
  deriveUsername,
  resolveRoleId,
  listEmployees,
  createEmployee,
  updateEmployee,
  deactivateEmployee,
  assertBranches,
  updateEmployeeProfile,
  setEmployeeRole,
  setEmployeeBranches,
  setEmployeeLifecycle,
  changeUserPassword
};
