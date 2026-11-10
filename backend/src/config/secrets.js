/**
 * MenuCraft — JWT secret resolution & startup validation (P0 fix C-1).
 *
 * لا توجد أي قيم افتراضية (fallback) في أي مكان:
 *  - إذا كانت الـ secrets مفقودة/ضعيفة/افتراضية/محرّرة (rotated-out) يرفض
 *    الخادم البدء (`assertJwtSecrets` → exit 1).
 *  - `getJwtSecrets()` يرمي خطأ بدل استخدام قيمة ضعيفة صامتة.
 *
 * التحقق يشمل دائمًا (development و production معًا) لأن التوكن الموقّع
 * بسرّ ضعيف قابل للتزوير بغضّ النظر عن بيئة التشغيل.
 */
require('dotenv').config();

const MIN_LENGTH = 32;

/**
 * قيم معروفة ضعيفة أو تم التعرّض لها أو تم تدويرها (rotation) — مرفوضة دائمًا.
 * قيم `mbn_menucraft_*_2026_*` هي الأسرار القديمة التي ظهرت في تقرير الفحص
 * وتم استبدالها، فلا يجوز العودة إليها.
 */
const DENYLISTED_SECRETS = new Set([
  'access_secret_change_me',
  'refresh_secret_change_me',
  'change_this_access_secret_to_something_long_and_random',
  'change_this_refresh_secret_to_something_long_and_random',
  'change_this_refresh_secret',
  'dev_fallback_access_32chars_long',
  'dev_fallback_refresh_32chars_long',
  'mbn_menucraft_access_2026_X9vK7pQ2mR8tL5wN3zA6fH1cB4dE0sY9',
  'mbn_menucraft_refresh_2026_Y8wL6qR3nS9uM4xO1yB5gI2dF7eH0tZ3',
  'secret',
  'jwt_secret',
  'access_secret',
  'refresh_secret'
]);

/** أنماط الـ placeholders التي لا يجوز أن تحتويها أي قيمة فعلية. */
const FORBIDDEN_PATTERNS = [
  'change_me',
  'change_this',
  'your_secret',
  'replace_me',
  'example',
  'password',
  'dev_fallback',
  'changeme'
];

function validateOne(name, value, errors) {
  if (!value) {
    errors.push(`JWT ${name} is missing (no fallback is allowed)`);
    return;
  }
  if (value.length < MIN_LENGTH) {
    errors.push(`JWT ${name} must be at least ${MIN_LENGTH} characters long (got ${value.length})`);
  }
  if (DENYLISTED_SECRETS.has(value)) {
    errors.push(`JWT ${name} is a known weak or rotated-out secret — generate a new random value`);
    return;
  }
  const lower = value.toLowerCase();
  const pattern = FORBIDDEN_PATTERNS.find((p) => lower.includes(p));
  if (pattern) {
    errors.push(`JWT ${name} contains a prohibited placeholder pattern: ${pattern}`);
  }
}

/** @returns {{ errors: string[], access: string, refresh: string }} */
function validateJwtSecrets(env = process.env) {
  const errors = [];
  const access = String(env.JWT_ACCESS_SECRET || '').trim();
  const refresh = String(env.JWT_REFRESH_SECRET || '').trim();
  validateOne('ACCESS_SECRET', access, errors);
  validateOne('REFRESH_SECRET', refresh, errors);
  if (access && refresh && access === refresh) {
    errors.push('JWT ACCESS_SECRET and REFRESH_SECRET must be different');
  }
  return { errors, access, refresh };
}

/**
 * فحص فاشل-مغلق يستُدعى عند بدء التشغيل: أي قيمة افتراضية/ضعيفة تمنع
 * الإقلاع. الرسائل على stderr وتحتوي كلمة JWT (متوافقة مع test_jwt.mjs).
 */
function assertJwtSecrets() {
  const { errors } = validateJwtSecrets();
  if (errors.length) {
    for (const err of errors) console.error(`FATAL: ${err}`);
    console.error(
      'FATAL: refusing to start with insecure JWT secrets. ' +
      'Set strong random values in backend/.env (JWT_ACCESS_SECRET / JWT_REFRESH_SECRET).'
    );
    process.exit(1);
  }
  return getJwtSecrets();
}

/** الأسرار المُتحقَّق منها للتوقيع/التحقق — يرمي بدل استخدام fallback. */
function getJwtSecrets() {
  const { errors, access, refresh } = validateJwtSecrets();
  if (errors.length) throw new Error(`JWT secrets invalid: ${errors.join('; ')}`);
  return { ACCESS_SECRET: access, REFRESH_SECRET: refresh };
}

module.exports = { MIN_LENGTH, validateJwtSecrets, assertJwtSecrets, getJwtSecrets };
