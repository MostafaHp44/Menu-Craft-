const { getPool, sql } = require('../config/db');
const { hashPassword, comparePassword } = require('../utils/hash');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/token');
const { linkUserToSite, getSubscriptionForUser, ensureTrialSubscription } = require('./site.service');
const { z } = require('zod');

/* ----------------------------- validation ----------------------------- */

const signupSchema = z.object({
  name: z.string().min(2, 'الاسم مطلوب ومكون من حرفين على الأقل'),
  email: z.string().email('بريد إلكتروني غير صحيح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  restaurantName: z.string().min(2, 'اسم المطعم مطلوب'),
  siteLang: z.string().optional()
});

const signinSchema = z.object({
  email: z.string().email('بريد إلكتروني غير صحيح'),
  password: z.string().min(1, 'كلمة المرور مطلوبة')
});

/* ----------------------------- services ----------------------------- */

async function signup(input) {
  const parsed = signupSchema.parse(input);
  const pool = await getPool();

  const emailLower = parsed.email.toLowerCase();

  // التحقق من وجود البريد مسبقًا
  const existing = await pool.request()
    .input('email', sql.NVarChar, emailLower)
    .query('SELECT id FROM Users WHERE email = @email');

  if (existing.recordset.length > 0) {
    const err = new Error('البريد الإلكتروني مستخدم مسبقًا');
    err.status = 400;
    throw err;
  }

  const passwordHash = await hashPassword(parsed.password);
  const baseSlug = parsed.restaurantName.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  let slug = baseSlug || 'restaurant';

  // تأكد من تفرّد الرابط المختصر (قد يتكرر اسم المطعم)
  const slugTaken = await pool.request()
    .input('slug', sql.NVarChar, slug)
    .query('SELECT id FROM Restaurants WHERE slug = @slug');
  if (slugTaken.recordset.length > 0) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  /* التسجيل بالكامل داخل معاملة واحدة:
     المستخدم + موقعه الأول + علاقة الملكية + اشتراك التجربة 3 أيام */
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    const restaurantId = `rest-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    await new sql.Request(transaction)
      .input('id', sql.NVarChar, restaurantId)
      .input('name', sql.NVarChar, parsed.restaurantName.trim())
      .input('slug', sql.NVarChar, slug)
      .input('status', sql.NVarChar, 'draft')
      .input('plan', sql.NVarChar, 'trial')
      .input('language', sql.NVarChar, parsed.siteLang || 'ar')
      .query(`
        INSERT INTO Restaurants (id, name_en, slug, status, [plan], language, created_at, updated_at)
        VALUES (@id, @name, @slug, @status, @plan, @language, GETDATE(), GETDATE())
      `);

    const userId = `usr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const userResult = await new sql.Request(transaction)
      .input('id', sql.NVarChar, userId)
      .input('name', sql.NVarChar, parsed.name.trim())
      .input('email', sql.NVarChar, emailLower)
      .input('passwordHash', sql.NVarChar, passwordHash)
      .input('role', sql.NVarChar, 'client')
      .input('restaurantId', sql.NVarChar(100), restaurantId)
      .input('status', sql.NVarChar, 'active')
      .query(`
        INSERT INTO Users (id, name, email, password_hash, role, restaurant_id, status, created_at)
        OUTPUT INSERTED.id, INSERTED.name, INSERTED.email, INSERTED.role, INSERTED.restaurant_id
        VALUES (@id, @name, @email, @passwordHash, @role, @restaurantId, @status, GETDATE())
      `);

    // علاقة الملكية (متعدد المواقع) + اشتراك التجربة المجانية 3 أيام
    await new sql.Request(transaction)
      .input('userId', sql.NVarChar, userId)
      .input('restaurantId', sql.NVarChar, restaurantId)
      .query(`
        INSERT INTO UserRestaurants (user_id, restaurant_id, is_owner)
        VALUES (@userId, @restaurantId, 1)
      `);
    await ensureTrialSubscription(transaction, userId, restaurantId);

    await transaction.commit();

    const user = userResult.recordset[0];
    const accessToken = signAccessToken({ userId: user.id, email: user.email, role: user.role, restaurantId });
    const refreshToken = signRefreshToken({ userId: user.id });

    return { user, accessToken, refreshToken };
  } catch (err) {
    await transaction.rollback().catch(() => {});
    throw err;
  }
}

async function signin(input) {
  const parsed = signinSchema.parse(input);
  const pool = await getPool();

  const emailLower = parsed.email.toLowerCase();

  const result = await pool.request()
    .input('email', sql.NVarChar, emailLower)
    .query(`
      SELECT u.id, u.name, u.email, u.password_hash, u.role, u.restaurant_id, u.status,
             r.name_en AS restaurant_name
      FROM Users u
      LEFT JOIN Restaurants r ON u.restaurant_id = r.id
      WHERE u.email = @email
    `);

  if (result.recordset.length === 0) {
    const err = new Error('بيانات دخول غير صحيحة');
    err.status = 401;
    throw err;
  }

  const user = result.recordset[0];

  const valid = await comparePassword(parsed.password, user.password_hash);
  if (!valid) {
    const err = new Error('بيانات دخول غير صحيحة');
    err.status = 401;
    throw err;
  }

  if (user.status !== 'active') {
    const err = new Error('الحساب معطل، راسل الدعم الفني');
    err.status = 403;
    throw err;
  }

  const accessToken = signAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    restaurantId: user.restaurant_id
  });
  const refreshToken = signRefreshToken({ userId: user.id });

  return { user, accessToken, refreshToken };
}

/* ------------------------- token refresh ------------------------------ */

/**
 * يصدّر توكن وصول جديد من توكن تحديث صالح (بدون كلمة مرور).
 * توكن الوصول ينتهي بعد 15 دقيقة — بدون هذا المسار يُطرد المستخدم من التطبيق.
 */
async function refresh(refreshToken) {
  if (!refreshToken || typeof refreshToken !== 'string') {
    const err = new Error('توكن تحديث مطلوب');
    err.status = 400;
    throw err;
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    const err = new Error('توكن تحديث غير صالح أو منتهي الصلاحية');
    err.status = 401;
    throw err;
  }

  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.VarChar, decoded.userId)
    .query(`
      SELECT id, name, email, role, restaurant_id, status
      FROM Users WHERE id = @id
    `);

  const user = result.recordset[0];
  if (!user) {
    const err = new Error('المستخدم غير موجود');
    err.status = 401;
    throw err;
  }
  if (user.status !== 'active') {
    const err = new Error('الحساب غير نشط');
    err.status = 403;
    throw err;
  }

  const accessToken = signAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    restaurantId: user.restaurant_id
  });
  const newRefreshToken = signRefreshToken({ userId: user.id });

  const { revokeRefreshToken } = require('../middleware/rateLimiter');

// Consume old refresh token atomically using SET NX EX.
// Only one concurrent request can succeed; others get false (token already consumed).
const tokenConsumed = await revokeRefreshToken(refreshToken);

if (!tokenConsumed) {
  const err = new Error('هذا التوكن منتهي الصلاحية أو قد تم استخدامه بالفعل');
  err.status = 401;
  throw err;
}

// Issue new tokens after old token was successfully consumed
return { user, accessToken, refreshToken: newRefreshToken };
}

/**
 * جلسة المستخدم الكاملة: الحساب + مواقعه + اشتراكه.
 * تُستخدم في GET /api/auth/me لتحميل الحالة عند بدء التطبيق.
 */
async function getMe(userId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.NVarChar, userId)
    .query('SELECT id, name, email, role, restaurant_id, status, created_at FROM Users WHERE id = @id');
  if (result.recordset.length === 0) {
    const err = new Error('المستخدم غير موجود');
    err.status = 401;
    throw err;
  }
  const user = result.recordset[0];
  const sites = await linkSafeSites(userId);
  const subscription = await getSubscriptionForUser(userId);
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      restaurant_id: user.restaurant_id,
      status: user.status,
      createdAt: user.created_at
    },
    sites,
    subscription
  };
}

/** مواقع المستخدم عبر الجدول الجديد مع الترحيل */
async function linkSafeSites(userId) {
  const { listSitesForUser } = require('./site.service');
  const sites = await listSitesForUser(userId);
  if (sites.length > 0) return sites;
  // علاقة قديمة فقط (لم تُرحَّل بعد) — نربطها الآن
  const pool = await getPool();
  const legacy = await pool.request()
    .input('userId', sql.NVarChar, userId)
    .query('SELECT restaurant_id FROM Users WHERE id = @userId AND restaurant_id IS NOT NULL');
  for (const row of legacy.recordset) {
    await linkUserToSite(userId, row.restaurant_id, true);
  }
  return listSitesForUser(userId);
}

module.exports = { signup, signin, refresh, getMe };
