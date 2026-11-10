const jwt = require('jsonwebtoken');
const crypto = require('crypto');
// لا توجد قيم افتراضية: أي secret ضعيف/مفقود يوقف التحميل بدل توقيع توكنات قابلة للتزوير.
const { getJwtSecrets } = require('../config/secrets');

const { ACCESS_SECRET, REFRESH_SECRET } = getJwtSecrets();
const ACCESS_EXPIRES_SECONDS = 15 * 60;
const REFRESH_EXPIRES_SECONDS = 7 * 24 * 60 * 60;
const ACCESS_EXPIRES = `${ACCESS_EXPIRES_SECONDS}s`;
const REFRESH_EXPIRES = `${REFRESH_EXPIRES_SECONDS}s`;

/**
 * كل توكن يحمل `jti` عشوائيًا. بدونه، تسجيل الخروج ثم الدخول في نفس الثانية
 * ينتج نفس سلسلة JWT بالضبط، فيصادف التوكن الجديد موجودًا في قائمة الإلغاء
 * (denylist) ويُرفض فورًا.
 */
function uniqueId() {
  return crypto.randomUUID();
}

function signAccessToken(payload) {
  return jwt.sign({ ...payload, jti: uniqueId() }, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });
}

function signRefreshToken(payload) {
  return jwt.sign({ ...payload, jti: uniqueId() }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES });
}

function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET);
}

module.exports = {
  ACCESS_EXPIRES_SECONDS,
  REFRESH_EXPIRES_SECONDS,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};
