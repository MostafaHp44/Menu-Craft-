/*
 * Corrected Employee backend — uses actual DB identity:
 * Users (auth) → RestaurantEmployees (authorization identity) → Employees (profile) → EmployeeBranchAccess (branch assignment)
 * All writes in a transaction. No invitation flow. No mock data.
 */
const { getPool, sql } = require('../config/db');
const { hashPassword } = require('../utils/hash');

const ROLES = new Set(['waiter', 'kitchen', 'cashier', 'super_admin', 'admin']);
const ACCESS = new Set(['all', 'assigned', 'none']);

function deriveUsername(email) {
  return (email || '').split('@')[0].replace(/[^a-z0-9]/gi, '').slice(0, 30);
}

function validate(data) {
  if (!data?.name?.trim()) throw Object.assign(new Error('name required'), { status: 400 });
  if (!data?.email?.trim()) throw Object.assign(new Error('email required'), { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) throw Object.assign(new Error('invalid email'), { status: 400 });
  if (!data?.password || data.password.length < 6) throw Object.assign(new Error('password must be 6+ chars'), { status: 400 });
  if (!ROLES.has(data.role)) throw Object.assign(new Error('invalid role'), { status: 400 });
  if (!ACCESS.has(data.branchAccessType)) throw Object.assign(new Error('invalid branch access'), { status: 400 });
  const ids = [...new Set((data.branchIds || []).map(String).filter(Boolean))];
  if (data.branchAccessType === 'assigned' && !ids.length) throw Object.assign(new Error('assigned requires branches'), { status: 400 });
  return ids;
}

async function assertBranches(tx, rid, ids) {
  for (const id of ids) {
    const r = await new sql.Request(tx).input('id', sql.NVarChar, id).input('rid', sql.NVarChar, rid)
      .query('SELECT 1 FROM Branches WHERE id=@id AND restaurant_id=@rid AND is_active=1');
    if (!r.recordset.length) throw Object.assign(new Error('branch not active/owned'), { status: 403 });
  }
}

function resolveRoleId(roleName) {
  const map = {
    cashier: '04F15493-332D-4BF0-9E3D-2B3CE757E7E3',
    kitchen: '12BC9C57-A6E5-4424-9A99-6A46A6DB291F',
    waiter: '489BBCFF-AC73-4163-85EB-57D7108C3F5F',
    owner: '0C12105B-209A-485D-B8EB-0C0067BDFA4F',
    super_admin: '0C12105B-209A-485D-B8EB-0C0067BDFA4F',
    admin: '0C12105B-209A-485D-B8EB-0C0067BDFA4F',
  };
  return map[roleName] || null;
}

async function listEmployees(rid) {
  const pool = await getPool();
  const emps = await pool.request().input('rid', sql.NVarChar, rid).query(`
    SELECT e.id, e.name, e.email, e.role, e.is_active, e.branch_access_type, e.created_at,
      COALESCE((SELECT STRING_AGG(CONVERT(nvarchar(max), b.name_en), '|') FROM EmployeeBranchAccess a JOIN Branches b ON b.id=a.branch_id WHERE a.restaurant_employee_id=re.id AND a.allowed=1), '') AS branch_ids_raw,
      COALESCE((SELECT STRING_AGG(CONVERT(nvarchar(max), b.name_en), '|') FROM EmployeeBranchAccess a JOIN Branches b ON b.id=a.branch_id WHERE a.restaurant_employee_id=re.id AND a.allowed=1), '') AS branch_names_raw
    FROM Employees e
    LEFT JOIN RestaurantEmployees re ON re.restaurant_id = e.restaurant_id AND re.user_id IN (SELECT id FROM Users WHERE restaurant_id=e.restaurant_id AND email=e.email)
    WHERE e.restaurant_id = @rid ORDER BY e.created_at DESC`);
  return (emps.recordset || []).map(x => ({
    ...x,
    branchIds: x.branch_ids_raw ? x.branch_ids_raw.split('|') : [],
    branchNames: x.branch_names_raw ? x.branch_names_raw.split('|') : [],
    active: x.is_active === true || x.is_active === 1,
  }));
}

async function createEmployee(rid, data, ownerUserId) {
  const ids = validate(data);
  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  await tx.begin();
  try {
    // 1. Duplicate email check across Users
    const dup = await new sql.Request(tx).input('email', sql.NVarChar, data.email.trim().toLowerCase()).query("SELECT 1 FROM Users WHERE LOWER(email)=LOWER(@email)");
    if (dup.recordset.length) throw Object.assign(new Error('email already in use'), { status: 400 });

    // 2. Validate branches belong to restaurant
    await assertBranches(tx, rid, ids);

    // 3. Create Users account
    const userId = require('crypto').randomUUID();
    const passHash = await hashPassword(data.password);
    const roleName = data.role;
    const roleId = resolveRoleId(roleName);
    if (!roleId) throw Object.assign(new Error('unknown role'), { status: 400 });

    await new sql.Request(tx).input('id', sql.NVarChar, userId).input('name', sql.NVarChar, data.name.trim()).input('email', sql.NVarChar, data.email.trim()).input('pwd', sql.NVarChar, passHash).input('restaurant_id', sql.NVarChar, rid).input('role', sql.NVarChar, data.role || 'waiter').input('status', sql.NVarChar, 'active').query('INSERT INTO Users (id, name, email, password_hash, restaurant_id, role, status, created_at) VALUES (@id,@name,@email,@pwd,@restaurant_id,@role,@status,GETDATE())');

    // 4. Create RestaurantEmployees authorization identity
    const reId = require('crypto').randomUUID();
    await new sql.Request(tx).input('id', sql.NVarChar, reId).input('rid', sql.NVarChar, rid).input('uid', sql.NVarChar, userId).input('role_id', sql.NVarChar, roleId).input('access', sql.NVarChar, data.branchAccessType).input('status', sql.NVarChar, 'active').input('invited_by', sql.NVarChar, ownerUserId || null).query('INSERT INTO RestaurantEmployees (id, restaurant_id, user_id, role_id, branch_access_type, status, invited_by, invited_at, activated_at) VALUES (@id,@rid,@uid,@role_id,@access,@status,@invited_by,GETDATE(),GETDATE())');

    // 5. Create Employees profile
    const empId = require('crypto').randomUUID();
    const username = deriveUsername(data.email);
    await new sql.Request(tx).input('id', sql.NVarChar, empId).input('rid', sql.NVarChar, rid).input('name', sql.NVarChar, data.name.trim()).input('email', sql.NVarChar, data.email.trim()).input('user', sql.NVarChar, username).input('role', sql.NVarChar, roleName).input('access', sql.NVarChar, data.branchAccessType).input('is_active', sql.Bit, 1).query('INSERT INTO Employees (id, restaurant_id, name, email, username, role, branch_access_type, is_active, created_at, updated_at) VALUES (@id,@rid,@name,@email,@user,@role,@access,@is_active,GETDATE(),GETDATE())');

    // 6. Branch assignments via authorization identity
    if (data.branchAccessType === 'assigned') {
      for (const branchId of ids) {
        await new sql.Request(tx).input('id', sql.NVarChar, require('crypto').randomUUID()).input('re_id', sql.NVarChar, reId).input('bid', sql.NVarChar, branchId).query('INSERT INTO EmployeeBranchAccess (id, restaurant_employee_id, branch_id, allowed) VALUES (@id,@re_id,@bid,1)');
      }
    }

    await tx.commit();
    return { id: empId, userId, restaurantEmployeeId: reId };
  } catch (e) {
    await tx.rollback();
    throw e;
  }
}

async function updateEmployee(rid, id, data, ownerUserId) {
  const ids = validate(data);
  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  await tx.begin();
  try {
    // Verify profile belongs to restaurant
    const existing = await new sql.Request(tx).input('id', sql.NVarChar, id).input('rid', sql.NVarChar, rid).query('SELECT * FROM Employees WHERE id=@id AND restaurant_id=@rid');
    if (!existing.recordset.length) throw Object.assign(new Error('employee not found'), { status: 404 });

    // If role changed, resolve new role id
    const roleName = data.role;
    const roleId = resolveRoleId(roleName);
    if (!roleId) throw Object.assign(new Error('unknown role'), { status: 400 });

    // Update profile
    await new sql.Request(tx).input('id', sql.NVarChar, id).input('name', sql.NVarChar, data.name.trim()).input('email', sql.NVarChar, data.email.trim()).input('role', sql.NVarChar, roleName).input('access', sql.NVarChar, data.branchAccessType).query('UPDATE Employees SET name=@name, email=@email, role=@role, branch_access_type=@access, updated_at=GETDATE() WHERE id=@id');

    // Find linked RestaurantEmployees for this restaurant + profile email
    const link = await new sql.Request(tx).input('rid', sql.NVarChar, rid).input('email', sql.NVarChar, data.email.trim()).query(`SELECT re.id FROM RestaurantEmployees re JOIN Users u ON u.id=re.user_id WHERE re.restaurant_id=@rid AND u.email=@email`);
    if (!link.recordset.length) throw Object.assign(new Error('authorization record missing'), { status: 500 });
    const reId = link.recordset[0].id;

    // Update authorization identity role and access type
    await new sql.Request(tx).input('re_id', sql.NVarChar, reId).input('role_id', sql.NVarChar, roleId).input('access', sql.NVarChar, data.branchAccessType).query('UPDATE RestaurantEmployees SET role_id=@role_id, branch_access_type=@access, updated_at=GETDATE() WHERE id=@re_id');

    // Replace branch assignments
    await new sql.Request(tx).input('re_id', sql.NVarChar, reId).query('DELETE FROM EmployeeBranchAccess WHERE restaurant_employee_id=@re_id');
    if (data.branchAccessType === 'assigned') {
      await assertBranches(tx, rid, ids);
      for (const branchId of ids) {
        await new sql.Request(tx).input('id', sql.NVarChar, require('crypto').randomUUID()).input('re_id', sql.NVarChar, reId).input('bid', sql.NVarChar, branchId).query('INSERT INTO EmployeeBranchAccess (id, restaurant_employee_id, branch_id, allowed) VALUES (@id,@re_id,@bid,1)');
      }
    }

    await tx.commit();
    return { id, restaurantEmployeeId: reId };
  } catch (e) {
    await tx.rollback();
    throw e;
  }
}

async function deactivateEmployee(rid, id) {
  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  await tx.begin();
  try {
    const prof = await new sql.Request(tx).input('id', sql.NVarChar, id).input('rid', sql.NVarChar, rid).query('SELECT * FROM Employees WHERE id=@id AND restaurant_id=@rid');
    if (!prof.recordset.length) throw Object.assign(new Error('employee not found'), { status: 404 });
    await new sql.Request(tx).input('id', sql.NVarChar, id).query('UPDATE Employees SET is_active=0, updated_at=GETDATE() WHERE id=@id');
    // Also disable authorization record by finding through profile email
    const link = await new sql.Request(tx).input('rid', sql.NVarChar, rid).input('email', sql.NVarChar, prof.recordset[0].email).query(`SELECT re.id FROM RestaurantEmployees re JOIN Users u ON u.id=re.user_id WHERE re.restaurant_id=@rid AND u.email=@email`);
    if (link.recordset.length) {
      await new sql.Request(tx).input('re_id', sql.NVarChar, link.recordset[0].id).query('UPDATE RestaurantEmployees SET status=\'removed\', removed_at=GETDATE() WHERE id=@re_id');
    }
    await tx.commit();
  } catch (e) {
    await tx.rollback();
    throw e;
  }
}

module.exports = { listEmployees, createEmployee, updateEmployee, deactivateEmployee };
