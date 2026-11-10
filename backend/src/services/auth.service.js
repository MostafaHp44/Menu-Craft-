/**
 * MenuCraft — Auth Service (MariaDB / mysql2 version)
 */
const { getMySQLPool } = require('../config/mysql');
const { hashPassword, comparePassword } = require('../utils/hash');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/token');
const { linkUserToSite, getSubscriptionForUser, ensureTrialSubscription } = require('./site.service');
const { z } = require('zod');

const signupSchema = z.object({
  name: z.string().min(2, 'الاسم مطلوب ومكون من حرفين على الأقل'),
  email: z.string().email('بريد إلكتروني غير صحيح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  restaurantName: z.string().min(2, 'اسم المطعم مطلوب'),
  siteLang: z.string().optional(),
  // the sign-up form sends `language`; accept it as an alias of siteLang
  language: z.string().optional()
});

const signinSchema = z.object({
  email: z.string().email('بريد إلكتروني غير صحيح'),
  password: z.string().min(1, 'كلمة المرور مطلوبة')
});

/**
 * zod throws ZodError without an HTTP status, so validation failures used to
 * surface as 500. Map them to 400 while keeping zod's message intact.
 * ZodError#message is a JSON blob — turn it into one readable line instead.
 */
function parseInput(schema, input) {
  try {
    return schema.parse(input);
  } catch (err) {
    if (err instanceof z.ZodError) {
      // ZodError#message is a getter that re-serialises the issues as JSON —
      // assigning to it is silently ignored, so throw a readable error instead.
      // `name` stays 'ZodError' because the controllers branch on it.
      const messages = [...new Set((err.issues || []).map((i) => i.message).filter(Boolean))];
      const readable = new Error(messages.length ? messages.join(' · ') : 'بيانات غير صالحة');
      readable.name = 'ZodError';
      readable.status = 400;
      readable.issues = err.issues;
      throw readable;
    }
    throw err;
  }
}

async function signup(input) {
  const parsed = parseInput(signupSchema, input);
  const pool = await getMySQLPool();
  const connection = await pool.getConnection();
  const emailLower = parsed.email.toLowerCase();

  try {
    const [existing] = await connection.execute('SELECT id FROM Users WHERE email = ?', [emailLower]);
    if (existing.length > 0) {
      const err = new Error('البريد الإلكتروني مستخدم مسبقًا');
      err.status = 400; throw err;
    }

    const passwordHash = await hashPassword(parsed.password);
    const baseSlug = parsed.restaurantName.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    let slug = baseSlug || 'restaurant';

    const [slugTaken] = await connection.execute('SELECT id FROM Restaurants WHERE slug = ?', [slug]);
    if (slugTaken.length > 0) slug = `${slug}-${Date.now().toString(36)}`;

    await connection.beginTransaction();
    try {
      const restaurantId = `rest-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      await connection.execute(
        'INSERT INTO Restaurants (id, name_en, slug, status, plan, language, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
        [restaurantId, parsed.restaurantName.trim(), slug, 'draft', 'trial', parsed.siteLang || parsed.language || 'ar']
      );

      const userId = `usr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      await connection.execute(
        'INSERT INTO Users (id, name, email, password_hash, role, restaurant_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
        [userId, parsed.name.trim(), emailLower, passwordHash, 'client', restaurantId, 'active']
      );

      // UserRestaurants.id is a varchar PRIMARY KEY with no default, so it MUST
      // be provided — omitting it inserts '' and the next signup dies on
      // ER_DUP_ENTRY (duplicate primary key).
      const linkId = `ur-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      await connection.execute(
        'INSERT INTO UserRestaurants (id, user_id, restaurant_id, is_owner) VALUES (?, ?, ?, 1)',
        [linkId, userId, restaurantId]
      );

      await ensureTrialSubscription({ transaction: connection, userId, restaurantId });
      await connection.commit();

      // Fetch user back
      const [userRows] = await connection.execute('SELECT id, name, email, role, restaurant_id FROM Users WHERE id = ?', [userId]);
      const user = userRows[0];
      const accessToken = signAccessToken({ userId: user.id, email: user.email, role: user.role, restaurantId });
      const refreshToken = signRefreshToken({ userId: user.id });
      return { user, accessToken, refreshToken };
    } catch (err) {
      try { await connection.rollback(); } catch (e) {}
      throw err;
    }
  } finally {
    connection.release();
  }
}

async function signin(input) {
  const parsed = parseInput(signinSchema, input);
  const connection = await (await getMySQLPool()).getConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT u.id, u.name, u.email, u.password_hash, u.role, u.restaurant_id, u.status, r.name_en AS restaurant_name FROM Users u LEFT JOIN Restaurants r ON u.restaurant_id = r.id WHERE u.email = ?',
      [parsed.email.toLowerCase()]
    );
    if (rows.length === 0) {
      const err = new Error('بيانات دخول غير صحيحة'); err.status = 401; throw err;
    }
    const user = rows[0];
    const valid = await comparePassword(parsed.password, user.password_hash);
    if (!valid) { const err = new Error('بيانات دخول غير صحيحة'); err.status = 401; throw err; }
    if (user.status !== 'active') { const err = new Error('الحساب معطل، راسل الدعم الفني'); err.status = 403; throw err; }
    // never expose the credential hash to the client
    const { password_hash: _ignoredHash, ...safeUser } = user;
    const accessToken = signAccessToken({ userId: user.id, email: user.email, role: user.role, restaurantId: user.restaurant_id });
    const refreshToken = signRefreshToken({ userId: user.id });
    return { user: safeUser, accessToken, refreshToken };
  } finally {
    connection.release();
  }
}

async function refresh(refreshToken) {
  if (!refreshToken || typeof refreshToken !== 'string') { const err = new Error('توكن تحديث مطلوب'); err.status = 400; throw err; }
  let decoded;
  try { decoded = verifyRefreshToken(refreshToken); } catch {
    const err = new Error('توكن تحديث غير صالح أو منتهي الصلاحية'); err.status = 401; throw err;
  }
  const pool = await getMySQLPool();
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute('SELECT id, name, email, role, restaurant_id, status FROM Users WHERE id = ?', [decoded.userId]);
    const user = rows[0];
    if (!user) { const err = new Error('المستخدم غير موجود'); err.status = 401; throw err; }
    if (user.status !== 'active') { const err = new Error('الحساب غير نشط'); err.status = 403; throw err; }
    const { revokeRefreshToken, ttlFromExp } = require('../middleware/rateLimiter');
    const tokenConsumed = await revokeRefreshToken(
      refreshToken,
      ttlFromExp(decoded.exp, 7 * 24 * 60 * 60)
    );
    if (!tokenConsumed) { const err = new Error('هذا التوكن منتهي الصلاحية أو قد تم استخدامه بالفعل'); err.status = 401; throw err; }
    const accessToken = signAccessToken({ userId: user.id, email: user.email, role: user.role, restaurantId: user.restaurant_id });
    const newRefreshToken = signRefreshToken({ userId: user.id });
    return { user, accessToken, refreshToken: newRefreshToken };
  } finally {
    connection.release();
  }
}

/**
 * إنشاء حساب إداري/سوبر أدمن للمنصة من لوحة السوبر أدمن (يدوي — بدون Stripe).
 * الدور المسموح: super_admin | admin. الربط بمطعم (restaurant_id) يُترك null
 * لأن الإدارة تتعامل على مستوى المنصة.
 */
async function createPlatformAdmin(input) {
  const parsed = parseInput(
    z.object({
      name: z.string().min(2, 'الاسم مطلوب ومكون من حرفين على الأقل'),
      email: z.string().email('بريد إلكتروني غير صحيح'),
      password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
      role: z.enum(['super_admin', 'admin'], { errorMap: () => ({ message: 'الدور غير صالح' }) })
    }),
    input
  );
  const pool = await getMySQLPool();
  const connection = await pool.getConnection();
  try {
    const [existing] = await connection.execute('SELECT id FROM Users WHERE email = ?', [parsed.email.toLowerCase()]);
    if (existing.length > 0) { const err = new Error('البريد الإلكتروني مستخدم مسبقًا'); err.status = 409; throw err; }
    const passwordHash = await hashPassword(parsed.password);
    const userId = `usr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    await connection.execute(
      'INSERT INTO Users (id, name, email, password_hash, role, restaurant_id, status, created_at) VALUES (?, ?, ?, ?, ?, NULL, ?, NOW())',
      [userId, parsed.name.trim(), parsed.email.toLowerCase(), passwordHash, parsed.role, 'active']
    );
    const [userRows] = await connection.execute('SELECT id, name, email, role, restaurant_id, status FROM Users WHERE id = ?', [userId]);
    const user = userRows[0];
    const accessToken = signAccessToken({ userId: user.id, email: user.email, role: user.role, restaurantId: user.restaurant_id });
    const refreshToken = signRefreshToken({ userId: user.id });
    return { user, accessToken, refreshToken };
  } finally { connection.release(); }
}

/**
 * حذف الحساب كاملاً (مستخدم المنصة أو صاحب المطعم):
 *   • إن وُجد مطعم مرتبط → حذف الاشتراك + قوالب المطعم + ربط المستخدم + المطعم نفسه
 *   • إن لم يُوجد مطعم → حذف المستخدم مباشرة
 */
async function deleteUserAccount(userId) {
  const pool = await getMySQLPool();
  const connection = await pool.getConnection();
  try {
    const [users] = await connection.execute('SELECT id, restaurant_id FROM Users WHERE id = ?', [userId]);
    if (!users.length) { const err = new Error('المستخدم غير موجود'); err.status = 404; throw err; }
    const user = users[0];
    if (user.restaurant_id) {
      // best-effort cleanup of restaurant-scoped rows before deleting the restaurant
      try { await connection.execute('DELETE FROM RestaurantTemplates WHERE restaurant_id = ?', [user.restaurant_id]); } catch (e) { /* noop */ }
      try { await connection.execute('DELETE FROM Subscriptions WHERE restaurant_id = ?', [user.restaurant_id]); } catch (e) { /* noop */ }
      try { await connection.execute('DELETE FROM UserRestaurants WHERE restaurant_id = ?', [user.restaurant_id]); } catch (e) { /* noop */ }
      try { await connection.execute('DELETE FROM Restaurants WHERE id = ?', [user.restaurant_id]); } catch (e) { /* noop: قد تبقى سجلات الطلبات FK مرتبطة */ }
    }
    const [del] = await connection.execute('DELETE FROM Users WHERE id = ?', [userId]);
    return { ok: true, deleted: Boolean(del.affectedRows) };
  } finally { connection.release(); }
}

async function getMe(userId) {
  const connection = await (await getMySQLPool()).getConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT u.id, u.name, u.email, u.role, u.restaurant_id, u.status, u.created_at, r.name_en AS restaurant_name FROM Users u LEFT JOIN Restaurants r ON u.restaurant_id = r.id WHERE u.id = ?',
      [userId]
    );
    if (rows.length === 0) { const err = new Error('المستخدم غير موجود'); err.status = 401; throw err; }
    const user = rows[0];
    const sites = await linkSafeSites(userId);
    const subscription = await getSubscriptionForUser(userId);
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        restaurant_id: user.restaurant_id,
        restaurant_name: user.restaurant_name ?? null,
        status: user.status,
        createdAt: user.created_at,
      },
      sites,
      subscription
    };
  } finally {
    connection.release();
  }
}

async function linkSafeSites(userId) {
  // Delegates to site.service (assumes site.service also converted or uses mysql)
  const { listSitesForUser } = require('./site.service');
  const sites = await listSitesForUser(userId);
  if (sites.length > 0) return sites;
  const connection = await (await getMySQLPool()).getConnection();
  try {
    const [legacy] = await connection.execute('SELECT restaurant_id FROM Users WHERE id = ? AND restaurant_id IS NOT NULL', [userId]);
    for (const row of legacy) {
      await linkUserToSite(userId, row.restaurant_id, true);
    }
    return await listSitesForUser(userId);
  } finally { connection.release(); }
}

module.exports = { signup, signin, refresh, getMe, createPlatformAdmin, deleteUserAccount };
