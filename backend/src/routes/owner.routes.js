/**
 * مسارات المالك: لوحة النشاط، سجل التدقيق، وإلغاء الطلب.
 *
 * كانت هذه المسارات تُستدعى من الواجهة دون وجود أي مسار مكافئ في الخادم
 * (404 دائمًا). هنا تُبنى على قاعدة البيانات الحقيقية، وكلها محمية
 * بـ auth + عزل المستأجرين (ملكية الموقع تُفحص في الخادم دائمًا).
 */
const { getMySQLPool } = require('../config/mysql');
const { normalizeRole, PLATFORM_ROLES } = require('../middleware/roles');
const { userOwnsSite, isPrivileged } = require('../services/site.service');
const { listActivity } = require('../services/audit.service');
const { updateOrderStatus, getOrderById } = require('../services/order.service');

const ORDER_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];

function httpError(status, message, code) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
}

/** من يملك مسارات المالك: صاحب المطعم أو إدارة المنصة فقط */
function requireOwnerOrPlatform(request, reply) {
  const role = normalizeRole(request.user?.role);
  if (role === PLATFORM_ROLES.CLIENT || role === PLATFORM_ROLES.SUPER_ADMIN || role === PLATFORM_ROLES.ADMIN) return true;
  reply.code(403).send({ ok: false, error: 'هذه العملية غير مسموحة لحسابك', code: 'FORBIDDEN' });
  return false;
}

/** المطعم المستهدف — من التوكن، أو `?restaurantId=` لإدارة المنصة فقط */
async function resolveRestaurant(request, reply) {
  const own = request.user?.restaurant_id || request.user?.restaurantId;
  const requested = request.query?.restaurantId;
  if (requested) {
    if (!isPrivileged(normalizeRole(request.user?.role)) && String(requested) !== String(own)) {
      reply.code(403).send({ ok: false, error: 'ليست لديك صلاحية على هذا الموقع', code: 'NOT_SITE_OWNER' });
      return null;
    }
    return String(requested);
  }
  if (!own) {
    reply.code(400).send({ ok: false, error: 'restaurantId required', code: 'RESTAURANT_REQUIRED' });
    return null;
  }
  return String(own);
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 3600 * 1000;

function defaultPeriod() {
  const to = new Date();
  const from = new Date(to.getTime() - 6 * DAY_MS);
  const iso = (d) => d.toISOString().slice(0, 10);
  return { from: iso(from), to: iso(to) };
}

function badDate(reply, value) {
  reply.code(400).send({ ok: false, error: `قيمة تاريخ غير صالحة: ${value}`, code: 'VALIDATION' });
  return null;
}

/* ------------------------------- Dashboard ------------------------------- */

async function dashboardHandler(request, reply) {
  if (!requireOwnerOrPlatform(request, reply)) return;
  try {
    const rid = await resolveRestaurant(request, reply);
    if (!rid) return;

    const fallback = defaultPeriod();
    const from = request.query.from || fallback.from;
    const to = request.query.to || fallback.to;
    if (!DATE_RE.test(from)) return badDate(reply, from);
    if (!DATE_RE.test(to)) return badDate(reply, to);
    const branchId = request.query.branch_id || null;

    const pool = await getMySQLPool();
    const c = await pool.getConnection();
    try {
      const rangeParams = [rid, from, to];
      let rangeSql = 'restaurant_id = ? AND DATE(created_at) BETWEEN ? AND ?';
      if (branchId) { rangeSql += ' AND branch_id = ?'; rangeParams.push(branchId); }

      const [statusRows] = await c.execute(
        `SELECT status, COUNT(*) AS cnt, COALESCE(SUM(total), 0) AS amount
         FROM Orders WHERE ${rangeSql} GROUP BY status`,
        rangeParams
      );
      const orders_by_status = {};
      for (const s of ORDER_STATUSES) orders_by_status[s] = 0;
      let total_orders = 0;
      let non_cancelled_sum = 0;
      let non_cancelled_count = 0;
      let completed_sum = 0;
      let cancelled_sum = 0;
      for (const row of statusRows) {
        const key = ORDER_STATUSES.includes(row.status) ? row.status : 'pending';
        const amount = Number(row.amount || 0);
        orders_by_status[key] = Number(row.cnt || 0);
        total_orders += Number(row.cnt || 0);
        if (row.status === 'cancelled') cancelled_sum += amount;
        else { non_cancelled_sum += amount; non_cancelled_count += Number(row.cnt || 0); }
        if (row.status === 'completed') completed_sum += amount;
      }

      const [empRows] = await c.execute(
        'SELECT status, COUNT(*) AS cnt FROM RestaurantEmployees WHERE restaurant_id = ? GROUP BY status',
        [rid]
      );
      const employees = { active: 0, suspended: 0, pending: 0, removed: 0, total: 0 };
      for (const row of empRows) {
        const key = ['active', 'suspended', 'pending', 'removed'].includes(row.status) ? row.status : 'active';
        const cnt = Number(row.cnt || 0);
        employees[key] = cnt;
        if (key !== 'removed') employees.total += cnt;
      }

      const [recent] = await c.execute(
        `SELECT id, branch_id, status, total, created_at, channel, table_no
         FROM Orders WHERE ${rangeSql} ORDER BY created_at DESC, id DESC LIMIT 6`,
        rangeParams
      );

      // كل فرع + صف منفصل للطلبات بلا فرع (NULL) إن وُجدت
      const [branchRows] = await c.execute(
        `SELECT b.id AS branch_id, b.name AS branch_name, b.is_active, b.accepting_orders,
                COUNT(o.id) AS total_orders,
                COALESCE(SUM(CASE WHEN o.status = 'pending'    THEN 1 ELSE 0 END), 0) AS s_pending,
                COALESCE(SUM(CASE WHEN o.status = 'confirmed'  THEN 1 ELSE 0 END), 0) AS s_confirmed,
                COALESCE(SUM(CASE WHEN o.status = 'preparing'  THEN 1 ELSE 0 END), 0) AS s_preparing,
                COALESCE(SUM(CASE WHEN o.status = 'ready'      THEN 1 ELSE 0 END), 0) AS s_ready,
                COALESCE(SUM(CASE WHEN o.status = 'completed'  THEN 1 ELSE 0 END), 0) AS s_completed,
                COALESCE(SUM(CASE WHEN o.status = 'cancelled'  THEN 1 ELSE 0 END), 0) AS s_cancelled,
                COALESCE(SUM(CASE WHEN o.status <> 'cancelled' THEN o.total ELSE 0 END), 0) AS v_non_cancelled,
                COALESCE(SUM(CASE WHEN o.status = 'completed'  THEN o.total ELSE 0 END), 0) AS v_completed,
                COALESCE(SUM(CASE WHEN o.status = 'cancelled'  THEN o.total ELSE 0 END), 0) AS v_cancelled
         FROM Branches b
         LEFT JOIN Orders o ON o.restaurant_id = b.restaurant_id AND o.branch_id = b.id
           AND DATE(o.created_at) BETWEEN ? AND ?
         WHERE b.restaurant_id = ?
         GROUP BY b.id, b.name, b.is_active, b.accepting_orders, b.created_at
         ORDER BY b.created_at`,
        [from, to, rid]
      );

      const branches = branchRows.map((b) => ({
        branch_id: b.branch_id,
        branch_name: b.branch_name,
        is_active: b.is_active,
        accepting_orders: b.accepting_orders,
        total_orders: Number(b.total_orders || 0),
        by_status: {
          pending: Number(b.s_pending || 0),
          confirmed: Number(b.s_confirmed || 0),
          preparing: Number(b.s_preparing || 0),
          ready: Number(b.s_ready || 0),
          completed: Number(b.s_completed || 0),
          cancelled: Number(b.s_cancelled || 0),
        },
        order_value: {
          non_cancelled: Number(b.v_non_cancelled || 0),
          completed: Number(b.v_completed || 0),
          cancelled: Number(b.v_cancelled || 0),
        },
      }));

      const nullBranchSql = branchId
        ? null
        : `SELECT COUNT(*) AS cnt FROM Orders WHERE ${rangeSql} AND branch_id IS NULL`;
      if (nullBranchSql) {
        const [[nullRow]] = await c.execute(nullBranchSql, rangeParams);
        if (Number(nullRow?.cnt || 0) > 0) {
          const [agg] = await c.execute(
            `SELECT status, COUNT(*) AS cnt, COALESCE(SUM(total), 0) AS amount
             FROM Orders WHERE ${rangeSql} AND branch_id IS NULL GROUP BY status`,
            rangeParams
          );
          const by_status = {};
          for (const s of ORDER_STATUSES) by_status[s] = 0;
          let total = 0; let nc = 0; let comp = 0; let canc = 0;
          for (const row of agg) {
            const key = ORDER_STATUSES.includes(row.status) ? row.status : 'pending';
            const amount = Number(row.amount || 0);
            by_status[key] = Number(row.cnt || 0);
            total += Number(row.cnt || 0);
            if (row.status === 'cancelled') canc += amount;
            else nc += amount;
            if (row.status === 'completed') comp += amount;
          }
          branches.push({
            branch_id: null,
            branch_name: null,
            is_active: null,
            accepting_orders: null,
            total_orders: total,
            by_status,
            order_value: { non_cancelled: nc, completed: comp, cancelled: canc },
          });
        }
      }

      return reply.send({
        restaurant_id: rid,
        period: { from, to },
        filters: { branch_id: branchId },
        metrics: {
          total_orders,
          orders_by_status,
          order_value: {
            note: 'cancelled orders excluded from non_cancelled',
            non_cancelled: Number(non_cancelled_sum.toFixed(2)),
            completed: Number(completed_sum.toFixed(2)),
            cancelled: Number(cancelled_sum.toFixed(2)),
            all_including_cancelled: Number((non_cancelled_sum + cancelled_sum).toFixed(2)),
            average_non_cancelled: non_cancelled_count
              ? Number((non_cancelled_sum / non_cancelled_count).toFixed(2))
              : 0,
          },
          employees,
        },
        recent_orders: recent.map((o) => ({
          id: o.id,
          branch_id: o.branch_id,
          status: o.status,
          total: Number(o.total || 0),
          created_at: o.created_at,
          channel: o.channel,
          table_no: o.table_no,
        })),
        branches,
        definitions: {},
      });
    } finally {
      c.release();
    }
  } catch (err) {
    request.log.error(err);
    return reply.status(500).send({ ok: false, error: 'Internal Server Error' });
  }
}

/* -------------------------------- Audit --------------------------------- */

async function auditHandler(request, reply) {
  if (!requireOwnerOrPlatform(request, reply)) return;
  try {
    const rid = await resolveRestaurant(request, reply);
    if (!rid) return;
    const data = await listActivity(rid, {
      from: request.query.from,
      to: request.query.to,
      category: request.query.category,
      action: request.query.action,
      limit: request.query.limit,
      offset: request.query.offset,
    });
    return reply.send(data);
  } catch (err) {
    request.log.error(err);
    return reply.status(500).send({ ok: false, error: 'Internal Server Error' });
  }
}

/* ---------------------------- Cancel an order ---------------------------- */

async function cancelOrderHandler(request, reply) {
  if (!requireOwnerOrPlatform(request, reply)) return;
  try {
    const rid = await resolveRestaurant(request, reply);
    if (!rid) return;

    const order = await getOrderById(request.params.id);
    if (!order) throw httpError(404, 'الطلب غير موجود', 'ORDER_NOT_FOUND');
    if (String(order.restaurantId) !== rid) {
      throw httpError(403, 'الطلب لا يعود إلى مطعمك', 'NOT_SITE_OWNER');
    }
    if (order.status === 'cancelled') {
      throw httpError(409, 'الطلب ملغى بالفعل', 'ALREADY_CANCELLED');
    }

    const reason = String(request.body?.reason || '').trim().slice(0, 300);
    const previous_status = order.status;

    // الخدمة نفسها تفحص الملكية + الدور + آلة الحالة (P0 C-3) — لا تُتجاوز هنا
    const updated = await updateOrderStatus(order.id, 'cancelled', {
      userId: request.user?.userId,
      role: request.user?.role,
    });

    const { logActivity } = require('../services/audit.service');
    await logActivity({
      restaurantId: rid,
      userId: request.user?.userId,
      actorRole: request.user?.role,
      action: 'order.cancelled',
      details: { order_id: order.id, from: previous_status, reason: reason || null },
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return reply.send({
      ok: true,
      order: { id: updated.id, status: updated.status, previous_status, reason: reason || null },
    });
  } catch (err) {
    const status = err.status || 500;
    if (status >= 500) {
      request.log.error(err);
      return reply.status(500).send({ ok: false, error: 'Internal Server Error' });
    }
    return reply.status(status).send({ ok: false, error: err.message, code: err.code });
  }
}

function ownerRoutes(fastify, opts, done) {
  fastify.get('/owner/dashboard', { preHandler: fastify.authMiddleware }, dashboardHandler);
  fastify.get('/owner/audit', { preHandler: fastify.authMiddleware }, auditHandler);
  fastify.patch('/owner/orders/:id/cancel', { preHandler: fastify.authMiddleware }, cancelOrderHandler);
  done();
}

module.exports = ownerRoutes;
