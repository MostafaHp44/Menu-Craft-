const {
  createPublicOrder,
  createCounterOrder,
  getOrdersByRestaurant,
  getOrderById,
  trackOrder,
  updateOrderStatus,
  deleteOrder
} = require('../services/order.service');
const { userOwnsSite, isPrivileged } = require('../services/site.service');

function sendError(reply, err) {
  const payload = { ok: false, error: err.message };
  if (err.code) payload.code = err.code;
  return reply.status(err.status || 500).send(payload);
}

/** تحقق: هل يملك المستخدم الحالي المطعم المذكور في query/body؟ */
async function ownsRestaurant(request, restaurantId) {
  return userOwnsSite(request.user?.userId, restaurantId, request.user?.role);
}

/**
 * إنشاء طلب (عام — من المنيو الضيف) أو طلب كونتر (موظف).
 * الأسعار تُعاد حسابها في الخادم دائمًا.
 */
async function createHandler(request, reply) {
  try {
    const body = request.body || {};
    // طلب كونتر (قناة counter) يتطلب تسجيل دخول + ملكية الموقع
    if (body.channel === 'counter') {
      if (!request.user) {
        return reply.status(401).send({ ok: false, error: 'تسجيل الدخول مطلوب لطلبات الكونتر', code: 'UNAUTHORIZED' });
      }
      const restaurantId = body.restaurantId;
      if (!restaurantId || !(await ownsRestaurant(request, restaurantId))) {
        return reply.status(403).send({ ok: false, error: 'ليست لديك صلاحية على هذا الموقع', code: 'NOT_SITE_OWNER' });
      }
      const order = await createCounterOrder(body);
      return reply.status(201).send({ ok: true, data: order });
    }
    // طلب عام من المنيو (ضيف) — لا حساب مطلوب
    const order = await createPublicOrder(body);
    return reply.status(201).send({ ok: true, data: order });
  } catch (err) {
    if (err.name === 'ZodError') {
      return reply.status(400).send({ ok: false, error: err.errors?.[0]?.message || 'بيانات غير صالحة', code: 'VALIDATION' });
    }
    return sendError(reply, err);
  }
}

/**
 * قائمة طلبات مطعم — يتحقق من الملكية في الخادم
 * (لا يستطيع مطعم رؤية طلبات مطعم آخر مهما أرسل في الاستعلام).
 */
async function listHandler(request, reply) {
  try {
    const { status, paymentMethod, paymentStatus, from, to } = request.query;
    // The dashboard client lists its own restaurant's orders and never sends
    // restaurantId — default to the caller's restaurant. Isolation is still
    // enforced by ownsRestaurant() below (fails closed for other tenants).
    const restaurantId = request.query.restaurantId || request.user?.restaurant_id || request.user?.restaurantId;
    if (!restaurantId) {
      return reply.status(400).send({ ok: false, error: 'معرف المطعم مطلوب', code: 'RESTAURANT_REQUIRED' });
    }
    if (!(await ownsRestaurant(request, restaurantId))) {
      return reply.status(403).send({ ok: false, error: 'ليست لديك صلاحية على هذا الموقع', code: 'NOT_SITE_OWNER' });
    }
    const orders = await getOrdersByRestaurant(restaurantId, { status, paymentMethod, paymentStatus, from, to });
    return reply.send({ ok: true, data: orders });
  } catch (err) {
    return sendError(reply, err);
  }
}

/** تفاصيل طلب — بملكية الموقع أو برمز التتبع الآمن (للضيف) */
async function getByIdHandler(request, reply) {
  try {
    const { token } = request.query;
    const order = await getOrderById(request.params.id);

    // مسار الضيف: رمز تتبع صحيح
    if (token) {
      const safe = await trackOrder(request.params.id, token);
      return reply.send({ ok: true, data: safe, guest: true });
    }
    // مسار الموظف: ملكية الموقع
    if (!request.user || !(await ownsRestaurant(request, order.restaurantId))) {
      return reply.status(403).send({ ok: false, error: 'ليست لديك صلاحية على هذا الطلب', code: 'NOT_SITE_OWNER' });
    }
    return reply.send({ ok: true, data: order });
  } catch (err) {
    return sendError(reply, err);
  }
}

/** متابعة الطلب للعميل الضيف: /api/public/orders/:id/track?token=… */
async function trackHandler(request, reply) {
  try {
    const order = await trackOrder(request.params.id, request.query.token);
    return reply.send({ ok: true, data: order });
  } catch (err) {
    return sendError(reply, err);
  }
}

/** تحديث الحالة (قبول/رفض/تقدّم) — بملكية الموقع */
async function statusHandler(request, reply) {
  try {
    const { id } = request.params;
    const { status } = request.body || {};
    if (!status) {
      return reply.status(400).send({ ok: false, error: 'الحالة مطلوبة', code: 'STATUS_REQUIRED' });
    }
    const order = await getOrderById(id);
    if (!(await ownsRestaurant(request, order.restaurantId))) {
      return reply.status(403).send({ ok: false, error: 'ليست لديك صلاحية على هذا الطلب', code: 'NOT_SITE_OWNER' });
    }
    // الفاعل = محتوى التوكن المُتحقَّق منه — الخدمة تفحص الملكية + الدور داخليًا
    const updated = await updateOrderStatus(id, status, {
      userId: request.user?.userId,
      role: request.user?.role
    });
    return reply.send({ ok: true, data: updated });
  } catch (err) {
    return sendError(reply, err);
  }
}

async function removeHandler(request, reply) {
  try {
    const order = await getOrderById(request.params.id);
    if (!isPrivileged(request.user?.role) && !(await ownsRestaurant(request, order.restaurantId))) {
      return reply.status(403).send({ ok: false, error: 'ليست لديك صلاحية على هذا الطلب', code: 'NOT_SITE_OWNER' });
    }
    await deleteOrder(request.params.id);
    return reply.send({ ok: true, message: 'تم حذف الطلب' });
  } catch (err) {
    return sendError(reply, err);
  }
}

module.exports = {
  createHandler,
  listHandler,
  getByIdHandler,
  trackHandler,
  statusHandler,
  removeHandler
};
