const {
  getAllRestaurants,
  getRestaurantById,
  getRestaurantBySlug,
  createRestaurant,
  updateRestaurant,
  publishRestaurant,
  unpublishRestaurant,
  deleteRestaurant
} = require('../services/restaurant.service');
const {
  listSitesForUser,
  userOwnsSite,
  assertCanCreateSite,
  isPrivileged
} = require('../services/site.service');

/** إرسال خطأ موحّد */
function sendError(reply, err) {
  const payload = { ok: false, error: err.message };
  if (err.code) payload.code = err.code;
  return reply.status(err.status || 500).send(payload);
}

/** تحقق ملكية الموقع للطلب الحالي (يسمح للأدمن) */
async function assertOwnership(request, reply, restaurantId) {
  const userId = request.user?.userId;
  const role = request.user?.role;
  const owns = await userOwnsSite(userId, restaurantId, role);
  if (!owns) {
    await reply.status(403).send({ ok: false, error: 'ليست لديك صلاحية على هذا الموقع', code: 'NOT_SITE_OWNER' });
    return false;
  }
  return true;
}

async function listHandler(request, reply) {
  try {
    const role = request.user?.role;
    const userId = request.user?.userId;

    // العميل يرى مواقعه فقط (حتى لو أرسل طلبًا مباشرًا) — الأدمن يرى الكل
    if (!isPrivileged(role)) {
      const sites = await listSitesForUser(userId);
      return reply.send({ ok: true, data: sites });
    }
    const restaurants = await getAllRestaurants();
    return reply.send({ ok: true, data: restaurants });
  } catch (err) {
    return sendError(reply, err);
  }
}

async function getByIdHandler(request, reply) {
  try {
    const restaurant = await getRestaurantById(request.params.id);
    return reply.send({ ok: true, data: restaurant });
  } catch (err) {
    return sendError(reply, err);
  }
}

async function getBySlugHandler(request, reply) {
  try {
    const restaurant = await getRestaurantBySlug(request.params.slug);
    return reply.send({ ok: true, data: restaurant });
  } catch (err) {
    return sendError(reply, err);
  }
}

async function createHandler(request, reply) {
  try {
    const userId = request.user?.userId;
    const role = request.user?.role;

    // فرض حد الباقة من الـ Backend قبل الإنشاء (حتى لو أُرسل الطلب مباشرة للـ API)
    if (!isPrivileged(role)) {
      await assertCanCreateSite(userId); // يرمي 403 PLAN_LIMIT_REACHED عند بلوغ الحد
    }

    const restaurant = await createRestaurant(request.body, userId);
    return reply.status(201).send({ ok: true, data: restaurant });
  } catch (err) {
    return sendError(reply, err);
  }
}

async function updateHandler(request, reply) {
  try {
    if (!(await assertOwnership(request, reply, request.params.id))) return;
    const restaurant = await updateRestaurant(request.params.id, request.body);
    return reply.send({ ok: true, data: restaurant });
  } catch (err) {
    return sendError(reply, err);
  }
}

async function publishHandler(request, reply) {
  try {
    if (!(await assertOwnership(request, reply, request.params.id))) return;
    const restaurant = await publishRestaurant(request.params.id);
    return reply.send({ ok: true, data: restaurant, message: 'تم نشر المطعم بنجاح' });
  } catch (err) {
    return sendError(reply, err);
  }
}

async function unpublishHandler(request, reply) {
  try {
    if (!(await assertOwnership(request, reply, request.params.id))) return;
    const restaurant = await unpublishRestaurant(request.params.id);
    return reply.send({ ok: true, data: restaurant, message: 'تم إلغاء نشر المطعم' });
  } catch (err) {
    return sendError(reply, err);
  }
}

async function deleteHandler(request, reply) {
  try {
    if (!(await assertOwnership(request, reply, request.params.id))) return;
    await deleteRestaurant(request.params.id);
    return reply.send({ ok: true, message: 'تم حذف المطعم' });
  } catch (err) {
    return sendError(reply, err);
  }
}

module.exports = {
  listHandler,
  getByIdHandler,
  getBySlugHandler,
  createHandler,
  updateHandler,
  publishHandler,
  unpublishHandler,
  deleteHandler
};
