const { verifyAccessToken } = require('../utils/token');
const cookie = require('cookie');

/**
 * مصادقة اختيارية للمسارات العامة التي يخدم أيضًا موظفو المطعم (P0 C-4):
 *  - يوجد توكن صالح؟ → يُرفَق `request.user` فيعمل طلب الكونتر (POS)
 *    للكاشير المُسجّل بـ 201 بدل 401.
 *  - لا يوجد توكن/توكن غير صالح؟ → يبقى الطلب كما هو (ضيف) حتى لا يتعطّل
 *    الشراء كضيف من المنيو العام.
 * هذه الدالة لا ترفض أي طلب أبدًا — الرفض يتم داخل المتحكّم عند الحاجة
 * (مثال: channel=counter بدون توكن صالح → 401).
 */
async function optionalAuth(request, reply) {
  if (request.user) return;

  const authHeader = request.headers.authorization || '';
  const [type, bearerToken] = authHeader.split(' ');
  let token = type === 'Bearer' && bearerToken ? bearerToken : null;

  if (!token) {
    const parsed = cookie.parse(request.headers.cookie || '');
    token = parsed['access_token'] || null;
  }
  if (!token) return;

  try {
    request.user = verifyAccessToken(token);
  } catch (_) {
    // توكن منتهٍ/خاطئ — نتعامل مع الطلب كضيف ولا نوقفه هنا.
  }
}

module.exports = optionalAuth;
