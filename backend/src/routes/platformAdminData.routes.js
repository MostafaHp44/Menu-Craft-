const { getPool, sql } = require('../config/db');
const { requireSuperAdmin } = require('../middleware/roles');

function route(handler) { return { preHandler: [requireSuperAdmin()], handler }; }
function dataRoutes(fastify, opts, done) {
  // auth is deliberately separate in the array so every platform data route
  // is auditable as super-admin-only at registration time.
  const protectedRoute = (handler) => ({ preHandler: [fastify.authMiddleware, requireSuperAdmin()], handler });
  fastify.get('/platform/admin/clients', protectedRoute(async (_q, reply) => {
    const p=await getPool(); const r=await p.request().query(`SELECT r.id,r.name_en AS name,r.slug,r.created_at,u.id user_id,u.name owner_name,u.email owner_email,u.status,
      s.plan_id,s.status subscription_status,s.price FROM Restaurants r LEFT JOIN Users u ON u.restaurant_id=r.id AND u.role='client' LEFT JOIN Subscriptions s ON s.restaurant_id=r.id`);
    return reply.send({ok:true,data:r.recordset});
  }));
  fastify.get('/platform/admin/users', protectedRoute(async (_q, reply) => {
    const p=await getPool(); const r=await p.request().query('SELECT id,name,email,role,restaurant_id,status,created_at FROM Users ORDER BY created_at DESC'); return reply.send({ok:true,data:r.recordset});
  }));
  fastify.get('/platform/admin/sales', protectedRoute(async (request, reply) => {
    const p = await getPool();
    const restaurantId = request.query.restaurantId || null;
    const from = request.query.from || null;
    const to = request.query.to || null;
    const status = request.query.status || null;
    let sqlStr = `SELECT restaurant_id, CONVERT(date,created_at) AS date, COUNT(*) AS orders, COALESCE(SUM(total),0) AS revenue FROM Orders WHERE 1=1`;
    const params = [];
    if (restaurantId) { sqlStr += ` AND restaurant_id = @restaurantId`; params.push({ name: 'restaurantId', type: sql.VarChar, value: restaurantId }); }
    if (from) { sqlStr += ` AND created_at >= @from`; params.push({ name: 'from', type: sql.DateTime, value: from }); }
    if (to) { sqlStr += ` AND created_at < DATEADD(day, 1, @to)`; params.push({ name: 'to', type: sql.DateTime, value: to }); }
    if (status) { sqlStr += ` AND status = @status`; params.push({ name: 'status', type: sql.VarChar, value: status }); }
    sqlStr += ` GROUP BY restaurant_id, CONVERT(date,created_at) ORDER BY date DESC`;
    const req = p.request();
    params.forEach(p => req.input(p.name, p.type, p.value));
    const r = await req.query(sqlStr);
    return reply.send({ ok: true, data: r.recordset });
  }));
  fastify.get('/platform/admin/payments', protectedRoute(async (_q, reply) => {
    const p=await getPool(); const r=await p.request().query('SELECT TOP 200 * FROM Payments ORDER BY created_at DESC'); return reply.send({ok:true,data:r.recordset});
  }));
  fastify.get('/platform/admin/templates', protectedRoute(async (_q, reply) => {
    const p=await getPool(); const r=await p.request().query('SELECT * FROM Templates ORDER BY created_at DESC'); return reply.send({ok:true,data:r.recordset});
  }));
  fastify.get('/platform/admin/financial', protectedRoute(async (request, reply) => {
    const p = await getPool();
    const period = request.query.period || 'month'; // 'day' or 'month'
    const from = request.query.from || null;
    const to = request.query.to || null;
    const groupCol = period === 'day' ? 'CONVERT(date,created_at)' : 'FORMAT(created_at, \'yyyy-MM\')';
    let sqlStr = `SELECT ${groupCol} AS period, SUM(CASE WHEN status='successful' THEN amount ELSE 0 END) AS revenue, SUM(CASE WHEN status='pending' THEN amount ELSE 0 END) AS pending, SUM(CASE WHEN status='failed' THEN amount ELSE 0 END) AS failed, SUM(CASE WHEN status='refunded' THEN amount ELSE 0 END) AS refunded, SUM(amount) AS total FROM Payments WHERE 1=1`;
    const params = [];
    if (from) { sqlStr += ` AND created_at >= @from`; params.push({ name: 'from', type: sql.DateTime, value: from }); }
    if (to) { sqlStr += ` AND created_at < DATEADD(day, 1, @to)`; params.push({ name: 'to', type: sql.DateTime, value: to }); }
    sqlStr += ` GROUP BY ${groupCol} ORDER BY period DESC`;
    const req = p.request();
    params.forEach(pa => req.input(pa.name, pa.type, pa.value));
    const r = await req.query(sqlStr);
    return reply.send({ ok: true, data: r.recordset });
  }));

  fastify.get('/platform/admin/payments-summary', protectedRoute(async (_q, reply) => {
    const p = await getPool();
    const r = await p.request().query(`SELECT status, COUNT(*) AS count, COALESCE(SUM(amount),0) AS amount FROM Payments GROUP BY status`);
    return reply.send({ ok: true, data: r.recordset });
  }));

  fastify.get('/platform/admin/stats', protectedRoute(async (_q, reply) => {
    const p=await getPool(); const r=await p.request().query(`SELECT (SELECT COUNT(*) FROM Restaurants) restaurants,(SELECT COUNT(*) FROM Users) users,(SELECT COUNT(*) FROM Subscriptions WHERE status IN ('active','trialing')) activeSubscriptions,(SELECT COALESCE(SUM(total),0) FROM Orders) orderRevenue`); return reply.send({ok:true,data:r.recordset[0]});
  }));
  done();
}
module.exports=dataRoutes;
