const {
  listEmployees,
  createEmployee,
  updateEmployee,
  deactivateEmployee,
  updateEmployeeProfile,
  setEmployeeRole,
  setEmployeeBranches,
  setEmployeeLifecycle,
  changeUserPassword,
} = require('../services/employee.service');
const { normalizeRole, PLATFORM_ROLES } = require('../middleware/roles');
const { userOwnsSite } = require('../services/site.service');
const { logActivity } = require('../services/audit.service');

/**
 * صلاحية إدارة الموظفين (P0 C-2): مالك المطعم أو إدارة المنصة فقط.
 * موظفو المطعم (waiter/kitchen/cashier) وغير الموثّقين يُرفضون — لا تعتمد
 * على الـ role القادم من التوكن بدون فحص ملكية فعلي.
 */
async function requireEmployeeManager(request, reply) {
  const role = normalizeRole(request.user?.role);
  if (role === PLATFORM_ROLES.SUPER_ADMIN || role === PLATFORM_ROLES.ADMIN) return;
  if (role === PLATFORM_ROLES.CLIENT) {
    const rid = request.user?.restaurantId || request.user?.restaurant_id;
    if (rid && (await userOwnsSite(request.user?.userId, rid, role))) return;
  }
  return reply.code(403).send({ ok: false, error: 'هذه العملية غير مسموحة لحسابك', code: 'FORBIDDEN' });
}

/**
 * The caller's restaurant context. Cross-tenant access is denied.
 * Returns the restaurantId or sends 403 and replies null.
 */
function restaurantId(req, reply) {
  const own = req.user?.restaurant_id || req.user?.restaurantId;
  if (!own) { reply.code(403).send({ ok: false, error: 'restaurant context required', code: 'RESTAURANT_REQUIRED' }); return null; }
  const requested = req.body?.restaurantId || req.query?.restaurantId;
  if (requested && String(requested) !== String(own)) { reply.code(403).send({ ok: false, error: 'cross-tenant denied', code: 'CROSS_TENANT' }); return null; }
  return own;
}

/** خطأ 4xx برسالته — و5xx برسالة عامة فقط (لا تفاصيل داخلية للعميل) */
function fail(reply, e) {
  // بريد مكرّر (Users.email UNIQUE) = خطأ إدخال، لا خطأ خادم: 409 بدل 500.
  if (e && e.code === 'ER_DUP_ENTRY') {
    return reply.code(409).send({ ok: false, error: 'هذا البريد الإلكتروني مستخدم بالفعل', code: 'EMAIL_TAKEN' });
  }
  const status = e.status || 500;
  if (status >= 500) return reply.code(500).send({ ok: false, error: 'Internal Server Error' });
  return reply.code(status).send({ ok: false, error: e.message, code: e.code });
}

/** تأكيد أن الرابط تابع للمطعم المطلوب قبل أي تعديل */
async function assertEmployeeBelongsTo(req, reply, empId, rid) {
  const { getMySQLPool } = require('../config/mysql');
  const pool = await getMySQLPool();
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.execute('SELECT 1 FROM RestaurantEmployees WHERE id = ? AND restaurant_id = ?', [empId, rid]);
    if (!rows.length) {
      reply.code(404).send({ ok: false, error: 'الموظف غير موجود', code: 'NOT_FOUND' });
      return false;
    }
    return true;
  } finally {
    conn.release();
  }
}

/** مطعم الموظف المستهدف (لفحص الملكية عند إعادة التعيين من مالك آخر) */
async function targetUserRestaurant(userId) {
  const { getMySQLPool } = require('../config/mysql');
  const pool = await getMySQLPool();
  const conn = await pool.getConnection();
  try {
    const [links] = await conn.execute(
      "SELECT restaurant_id FROM RestaurantEmployees WHERE user_id = ? AND status <> 'removed' ORDER BY created_at DESC LIMIT 1",
      [userId]
    );
    if (links.length) return links[0].restaurant_id;
    const [users] = await conn.execute('SELECT restaurant_id FROM Users WHERE id = ?', [userId]);
    return users[0]?.restaurant_id || null;
  } finally {
    conn.release();
  }
}

/** هل يحق لـ `req` إدارة هذا المستخدم؟ (ذاته، مالك مطعمه، أو إدارة المنصة) */
async function canManageUser(req, targetUserId) {
  if (String(targetUserId) === String(req.user?.userId)) return true;
  const role = normalizeRole(req.user?.role);
  if (role === PLATFORM_ROLES.SUPER_ADMIN || role === PLATFORM_ROLES.ADMIN) return true;
  if (role !== PLATFORM_ROLES.CLIENT) return false;
  const rid = await targetUserRestaurant(targetUserId);
  return Boolean(rid && (await userOwnsSite(req.user?.userId, rid, role)));
}

function employeeRoutes(fastify, opts, done) {
  const guarded = { preHandler: [fastify.authMiddleware, requireEmployeeManager] };
  const auditBase = (req, action, details) => ({
    restaurantId: req.user?.restaurant_id || req.user?.restaurantId,
    userId: req.user?.userId,
    actorRole: req.user?.role,
    action,
    details,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });

  fastify.get('/employees', guarded, async (q, r) => {
    try { const rid = restaurantId(q, r); if (!rid) return; return r.send({ ok: true, data: await listEmployees(rid) }); }
    catch (e) { return fail(r, e); }
  });

  fastify.post('/employees', guarded, async (q, r) => {
    try {
      const rid = restaurantId(q, r); if (!rid) return;
      const data = await createEmployee(q.body, rid);
      await logActivity({ ...auditBase(q, 'employee.created', { user_id: data.userId, email: data.email, role: data.role }) });
      return r.code(201).send({ ok: true, data });
    } catch (e) { return fail(r, e); }
  });

  /** تحديث كامل (PUT) أو جزئي (PATCH: name/email فقط) */
  const updateHandler = async (q, r) => {
    try {
      const rid = restaurantId(q, r); if (!rid) return;
      if (!(await assertEmployeeBelongsTo(q, r, q.params.id, rid))) return;
      const body = q.body || {};
      const data = q.method === 'PATCH'
        ? await updateEmployeeProfile(q.params.id, rid, body)
        : await updateEmployee(q.params.id, body);
      await logActivity({ ...auditBase(q, 'employee.updated', { employee_id: q.params.id, fields: Object.keys(body) }) });
      return r.send({ ok: true, data });
    } catch (e) { return fail(r, e); }
  };
  fastify.put('/employees/:id', guarded, updateHandler);
  fastify.patch('/employees/:id', guarded, updateHandler);

  fastify.patch('/employees/:id/role', guarded, async (q, r) => {
    try {
      const rid = restaurantId(q, r); if (!rid) return;
      if (!(await assertEmployeeBelongsTo(q, r, q.params.id, rid))) return;
      const role = q.body?.role;
      const result = await setEmployeeRole(q.params.id, rid, role);
      await logActivity({ ...auditBase(q, 'employee.role_changed', { employee_id: q.params.id, role }) });
      return r.send({ ok: true, ...result });
    } catch (e) { return fail(r, e); }
  });

  fastify.patch('/employees/:id/branches', guarded, async (q, r) => {
    try {
      const rid = restaurantId(q, r); if (!rid) return;
      if (!(await assertEmployeeBelongsTo(q, r, q.params.id, rid))) return;
      const { branchAccessType, branchIds } = q.body || {};
      const result = await setEmployeeBranches(q.params.id, rid, branchAccessType, branchIds);
      await logActivity({ ...auditBase(q, 'employee.branches_changed', { employee_id: q.params.id, branch_access_type: branchAccessType, branch_ids: branchIds || [] }) });
      return r.send({ ok: true, ...result });
    } catch (e) { return fail(r, e); }
  });

  /**
   * تغيير كلمة المرور — مساران بحسب الفاعل:
   *   - الذاتي (`:id` = المستخدم الحالي): تُتحقق كلمة المرور الحالية إجباريًا.
   *   - إعادة تعيين من المالك/إدارة المنصة: بلا كلمة حالية.
   * لا يستخدم `requireEmployeeManager` لأن الموظف نفسه يغيّر كلمته.
   */
  fastify.patch('/employees/:id/password', { preHandler: fastify.authMiddleware }, async (q, r) => {
    try {
      const targetId = q.params.id;
      const self = String(targetId) === String(q.user?.userId);
      if (!self && !(await canManageUser(q, targetId))) {
        return r.code(403).send({ ok: false, error: 'هذه العملية غير مسموحة لحسابك', code: 'FORBIDDEN' });
      }
      const { newPassword, currentPassword } = q.body || {};
      const result = await changeUserPassword(targetId, {
        newPassword,
        currentPassword,
        requireCurrent: self,
      });
      if (self) {
        await logActivity({ ...auditBase(q, 'employee.password_changed', { self: true }) });
      } else {
        const rid = await targetUserRestaurant(targetId);
        await logActivity({
          restaurantId: rid || q.user?.restaurant_id || q.user?.restaurantId,
          userId: q.user?.userId,
          actorRole: q.user?.role,
          action: 'employee.password_changed',
          details: { employee_id: targetId, reset_by_owner: true },
          ip: q.ip,
          userAgent: q.headers['user-agent'],
        });
      }
      return r.send({ ok: true, ...result });
    } catch (e) { return fail(r, e); }
  });

  fastify.post('/employees/:id/suspend', guarded, async (q, r) => {
    try {
      const rid = restaurantId(q, r); if (!rid) return;
      if (!(await assertEmployeeBelongsTo(q, r, q.params.id, rid))) return;
      const result = await setEmployeeLifecycle(q.params.id, rid, 'suspended');
      await logActivity({ ...auditBase(q, 'employee.suspended', { employee_id: q.params.id }) });
      return r.send({ ok: true, ...result });
    } catch (e) { return fail(r, e); }
  });

  fastify.post('/employees/:id/reactivate', guarded, async (q, r) => {
    try {
      const rid = restaurantId(q, r); if (!rid) return;
      if (!(await assertEmployeeBelongsTo(q, r, q.params.id, rid))) return;
      const result = await setEmployeeLifecycle(q.params.id, rid, 'active');
      await logActivity({ ...auditBase(q, 'employee.reactivated', { employee_id: q.params.id }) });
      return r.send({ ok: true, ...result });
    } catch (e) { return fail(r, e); }
  });

  fastify.delete('/employees/:id', guarded, async (q, r) => {
    try {
      const rid = restaurantId(q, r); if (!rid) return;
      if (!(await assertEmployeeBelongsTo(q, r, q.params.id, rid))) return;
      await deactivateEmployee(q.params.id);
      await logActivity({ ...auditBase(q, 'employee.removed', { employee_id: q.params.id }) });
      return r.send({ ok: true });
    } catch (e) { return fail(r, e); }
  });

  done();
}

module.exports = employeeRoutes;
