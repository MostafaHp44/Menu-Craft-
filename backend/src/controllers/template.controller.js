const {
  getActiveTemplates,
  getAllTemplates,
  createTemplate,
  deleteTemplate
} = require('../services/template.service');

/** أخطاء التحقق (zod) تُعرض كطلب خاطئ 400 بدل 500 */
function httpStatus(err) {
  return err?.name === 'ZodError' ? 400 : err?.status || 500;
}

function httpMessage(err) {
  if (err?.name === 'ZodError') {
    return err.errors?.[0]?.message || 'بيانات غير صالحة';
  }
  return err.message;
}

/** الزائر: القوالب الفعّالة فقط */
async function listPublicHandler(request, reply) {
  try {
    const templates = await getActiveTemplates();
    return reply.send({ ok: true, data: templates });
  } catch (err) {
    return reply.status(httpStatus(err)).send({ ok: false, error: httpMessage(err) });
  }
}

/** الإدارة: كل القوالب */
async function listAllHandler(request, reply) {
  try {
    const templates = await getAllTemplates();
    return reply.send({ ok: true, data: templates });
  } catch (err) {
    return reply.status(httpStatus(err)).send({ ok: false, error: httpMessage(err) });
  }
}

async function createHandler(request, reply) {
  try {
    const template = await createTemplate({
      ...(request.body || {}),
      created_by: request.user?.userId ?? null
    });
    return reply.status(201).send({ ok: true, data: template });
  } catch (err) {
    return reply.status(httpStatus(err)).send({ ok: false, error: httpMessage(err) });
  }
}

async function deleteHandler(request, reply) {
  try {
    const result = await deleteTemplate(request.params.id);
    return reply.send({
      ok: true,
      deactivated: result.deactivated,
      message: result.deactivated
        ? 'تم تعطيل القالب لاستخدامه من مطاعم قائمة'
        : 'تم حذف القالب'
    });
  } catch (err) {
    return reply.status(httpStatus(err)).send({ ok: false, error: httpMessage(err) });
  }
}

module.exports = {
  listPublicHandler,
  listAllHandler,
  createHandler,
  deleteHandler
};
