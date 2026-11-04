/**
 * BranchAccessResolver — centralized authorization for branch-level access.
 * Reads Employee.branch_access_type + EmployeeBranchAccess.
 * Supports: all / assigned / none. Fails closed when access is unclear.
 * Validates restaurant ownership consistently.
 */
const { getPool, sql } = require('../config/db');

async function resolveAccess(employeeId, restaurantId, branchId) {
  const pool = await getPool();
  // Verify restaurant ownership via employee record (fail closed)
  const empRes = await pool.request()
    .input('empId', sql.NVarChar, employeeId)
    .query('SELECT restaurant_id, role, branch_access_type FROM Employees WHERE id = @empId AND is_active = 1');
  if (!empRes.recordset || empRes.recordset.length === 0) {
    return { allowed: false, reason: 'employee_not_found_or_inactive', type: null };
  }
  const emp = empRes.recordset[0];
  if (emp.restaurant_id !== restaurantId) {
    return { allowed: false, reason: 'cross_restaurant_access_denied', type: null };
  }
  const accessType = (emp.branch_access_type || '').toLowerCase();
  if (accessType === 'all') {
    return { allowed: true, reason: null, type: 'all', employee: emp };
  }
  if (accessType === 'none') {
    return { allowed: false, reason: 'access_none', type: 'none', employee: emp };
  }
  // assigned
  if (branchId) {
    const linkRes = await pool.request()
      .input('empId', sql.NVarChar, employeeId)
      .input('branchId', sql.NVarChar, branchId)
      .query('SELECT 1 FROM EmployeeBranchAccess WHERE restaurant_employee_id = @empId AND branch_id = @branchId AND allowed = 1');
    if (linkRes.recordset && linkRes.recordset.length > 0) {
      return { allowed: true, reason: null, type: 'assigned', employee: emp };
    }
  }
  return { allowed: false, reason: 'branch_not_assigned', type: accessType || 'assigned', employee: emp };
}

async function enforceBranchAccess(req, reply, { branchId }) {
  // Used by middleware/routes — expects req.user from auth middleware
  const user = req.user || null;
  if (!user || !user.employeeId) {
    return reply.status(403).send({ ok: false, error: 'auth_required_for_branch_access' });
  }
  const restaurantId = req.params.restaurantId || req.body?.restaurantId;
  const access = await resolveAccess(user.employeeId, restaurantId, branchId);
  if (!access.allowed) {
    return reply.status(403).send({ ok: false, error: access.reason, code: 'BRANCH_ACCESS_DENIED' });
  }
  req.branchAccess = access;
}

module.exports = { resolveAccess, enforceBranchAccess };
