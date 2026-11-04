const { getSiteSummary, listSitesForUser, assertCanCreateSite } = require('../services/site.service');

/**
 * ملخص مواقع الحساب — يغذّي تبويب Websites:
 *   Websites: 2 / 3 · 1 website slot remaining · Unlimited للمشاريع
 */
async function summaryHandler(request, reply) {
  try {
    const userId = request.user.userId;
    const summary = await getSiteSummary(userId);
    return reply.send({ ok: true, data: summary });
  } catch (err) {
    return reply.status(err.status || 500).send({ ok: false, error: err.message, code: err.code });
  }
}

/** مواقع المستخدم فقط (مع الحماية من طلبات مباشرة لمواقع الآخرين) */
async function listMineHandler(request, reply) {
  try {
    const userId = request.user.userId;
    const sites = await listSitesForUser(userId);
    return reply.send({ ok: true, data: sites });
  } catch (err) {
    return reply.status(err.status || 500).send({ ok: false, error: err.message, code: err.code });
  }
}

/** فحص أهلية إنشاء موقع جديد (يستخدمه الزر في الواجهة — والفحص الحقيقي عند الإنشاء) */
async function canCreateHandler(request, reply) {
  try {
    const userId = request.user.userId;
    await assertCanCreateSite(userId);
    return reply.send({ ok: true, data: { canCreate: true } });
  } catch (err) {
    return reply.status(err.status || 403).send({ ok: false, error: err.message, code: err.code || 'FORBIDDEN', data: { canCreate: false } });
  }
}

module.exports = { summaryHandler, listMineHandler, canCreateHandler };
