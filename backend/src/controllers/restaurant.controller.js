const {
  getAllRestaurants,
  getRestaurantById,
  getRestaurantBySlug,
  createRestaurant,
  updateRestaurant,
  publishRestaurant,
  unpublishRestaurant,
  deleteRestaurant,
  importTemplateSampleMenu
} = require('../services/restaurant.service');
const {
  listSitesForUser,
  userOwnsSite,
  assertCanCreateSite,
  isPrivileged
} = require('../services/site.service');
const {
  listSelectedTemplates,
  selectTemplate,
  unselectTemplate
} = require('../services/restaurantTemplate.service');

/** إرسال خطأ موحّد */
function sendError(reply, err) {
  const status = err.status || 500;
  // رسالة داخلية (5xx) لا تُعرض للعميل — النص الكامل يبقى في السجل فقط
  const message = status >= 500 ? 'Internal Server Error' : err.message;
  const payload = { ok: false, error: message };
  if (status < 500 && err.code) payload.code = err.code;
  return reply.status(status).send(payload);
}

/**
 * أعمدة لا تُعرض لغير المصرح له (P1 — Data/API Security):
 * المسودات والمنشورات الكاملة، بيانات التواصل، الباقة، والإحصاءات.
 */
const PRIVATE_RESTAURANT_FIELDS = [
  'draft_menu',
  'published_menu',
  'design',
  'menu',
  'copy',
  'inline',
  'ordering',
  'phone',
  'email',
  'address',
  'hours',
  'socials',
  'plan',
  'stats'
];

/** نسخة عامة من السجل: تُحذف منها كل حقول الخصوصية أعلاه */
function publicView(row) {
  if (!row || typeof row !== 'object') return row;
  const out = { ...row };
  for (const field of PRIVATE_RESTAURANT_FIELDS) delete out[field];
  return out;
}

/**
 * هل يحق لهذا الطلب رؤية السجل كاملًا؟
 * المالك (UserRestaurants) أو إدارة المنصة فقط — والزائر يحصل على النسخة العامة.
 */
async function canSeePrivateFields(request, restaurantId) {
  if (!request.user) return false;
  const role = request.user.role;
  if (isPrivileged(role)) return true;
  return userOwnsSite(request.user.userId, restaurantId, role);
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
    // الزائر/غير المالك يحصل على النسخة العامة فقط (بلا مسودات/تواصل/باقة/إحصاءات)
    const full = await canSeePrivateFields(request, restaurant.id);
    return reply.send({ ok: true, data: full ? restaurant : publicView(restaurant) });
  } catch (err) {
    return sendError(reply, err);
  }
}

async function getBySlugHandler(request, reply) {
  try {
    const restaurant = await getRestaurantBySlug(request.params.slug);
    const full = await canSeePrivateFields(request, restaurant.id);
    return reply.send({ ok: true, data: full ? restaurant : publicView(restaurant) });
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

async function importTemplateHandler(request, reply) {
  try {
    if (!(await assertOwnership(request, reply, request.params.id))) return;
    const { templateId, force } = request.body || {};
    if (!templateId) {
      return reply.status(400).send({ ok: false, error: 'templateId required', code: 'MISSING_TEMPLATE_ID' });
    }
    const restaurant = await importTemplateSampleMenu(request.params.id, templateId, Boolean(force), request.body?.design || null);
    return reply.send({ ok: true, data: restaurant, message: 'Template sample menu imported to draft' });
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

/* --------------------- التمبليتات المختارة ("قوالبي") --------------------- */

async function listTemplatesHandler(request, reply) {
  try {
    if (!(await assertOwnership(request, reply, request.params.id))) return;
    const data = await listSelectedTemplates(request.params.id);
    return reply.send({ ok: true, data });
  } catch (err) {
    return sendError(reply, err);
  }
}

async function selectTemplateHandler(request, reply) {
  try {
    if (!(await assertOwnership(request, reply, request.params.id))) return;
    const { templateId } = request.body || {};
    if (!templateId) {
      return reply.status(400).send({ ok: false, error: 'templateId required', code: 'MISSING_TEMPLATE_ID' });
    }
    await selectTemplate(request.params.id, String(templateId));
    return reply.send({ ok: true });
  } catch (err) {
    return sendError(reply, err);
  }
}

async function unselectTemplateHandler(request, reply) {
  try {
    if (!(await assertOwnership(request, reply, request.params.id))) return;
    await unselectTemplate(request.params.id, request.params.templateId);
    return reply.send({ ok: true });
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
  deleteHandler,
  importTemplateHandler,
  listTemplatesHandler,
  selectTemplateHandler,
  unselectTemplateHandler
};
