/**
 * BranchAccessResolver — MariaDB / mysql2 version
 */
const { getMySQLPool } = require('../config/mysql');

async function resolveAccess(employeeId, restaurantId, branchId) {
  const pool = await getMySQLPool();
  const connection = await pool.getConnection();
  try {
    const [empRows] = await connection.execute(
      `SELECT re.restaurant_id, re.branch_access_type, r.name AS restaurant_name, u.role
       FROM RestaurantEmployees re JOIN Users u ON u.id = re.user_id
       WHERE re.id = ? AND re.status = 'active'`,
      [employeeId]
    );
    if (!empRows || empRows.length === 0) return { allowed: false, reason: 'employee_not_found_or_inactive', type: null };
    const emp = empRows[0];
    if (emp.restaurant_id !== restaurantId) return { allowed: false, reason: 'cross_restaurant_access_denied', type: null };
    const accessType = (emp.branch_access_type || '').toLowerCase();
    if (accessType === 'all') return { allowed: true, reason: null, type: 'all', employee: emp };
    if (accessType === 'none') return { allowed: false, reason: 'access_none', type: 'none', employee: emp };
    if (branchId) {
      const [linkRows] = await connection.execute('SELECT 1 FROM EmployeeBranchAccess WHERE restaurant_employee_id = ? AND branch_id = ? AND allowed = 1', [employeeId, branchId]);
      if (linkRows && linkRows.length > 0) return { allowed: true, reason: null, type: 'assigned', employee: emp };
    }
    return { allowed: false, reason: 'branch_not_assigned', type: accessType || 'assigned', employee: emp };
  } finally { connection.release(); }
}

async function enforceBranchAccess(req, reply, { branchId }) {
  const user = req.user || null;
  if (!user || !user.employeeId) return reply.status(403).send({ ok: false, error: 'auth_required_for_branch_access' });
  const restaurantId = req.params.restaurantId || req.body?.restaurantId;
  const access = await resolveAccess(user.employeeId, restaurantId, branchId);
  if (!access.allowed) return reply.status(403).send({ ok: false, error: access.reason, code: 'BRANCH_ACCESS_DENIED' });
  req.branchAccess = access;
}

module.exports = { resolveAccess, enforceBranchAccess };
