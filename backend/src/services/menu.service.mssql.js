/**
 * MenuCraft — خدمة المنيو العام
 * ------------------------------------------------------------
 * تجهّز بيانات المنيو العامة (صفحة /site/:slug) مباشرة من جداول القاعدة:
 * التصنيفات، الأصناف (مع الاختيارات/الإضافات)، إعدادات الطلب،
 * ووسائل الدفع التي تكون المطعم قد فعّلها فعليًا فقط.
 */
const { getPool, sql } = require('../config/db');
const { orderingSettingsFromRow } = require('./order.service');
const { tx, isValidSourceLang, VALID_LANGS } = require('./translate.service');

/**
 * Source Language (source_lang) Rules — Phase A.2 Step 4
 * - New records inherit Restaurants.language if source_lang not explicitly provided.
 * - Updates must preserve existing source_lang unless explicitly changed.
 * - Only ['ar','en','ku'] are valid; NULL allowed.
 * - Original name/description fields (name_en, name_ar, name_ku, etc.) must never be overwritten by translations.
 */
/** Resolve translated display for a name/description using the centralized tx engine. */
function resolveTranslated(nameObj, lang, sourceLang) {
  // If already an object with en/ar/ku keys, use tx with sourceLang
  if (nameObj && typeof nameObj === 'object' && (nameObj.en !== undefined || nameObj.ar !== undefined || nameObj.ku !== undefined)) {
    return tx(nameObj, lang, sourceLang || null);
  }
  // Legacy string or plain value — preserve backward compatibility
  return typeof nameObj === 'string' ? nameObj : (nameObj?.en || nameObj?.ar || nameObj?.ku || '');
}

function parseJson(value, fallback) {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

/** توحيد القيم النصية/متعددة اللغات إلى { en, ar, ku } */
function normalizeTranslated(en, ar, ku) {
  return { en: en || '', ar: ar || '', ku: ku || '' };
}

/** تحويل صف MenuItems إلى شكل الواجهة */
function mapItemRow(i, lang = 'en') {
  return {
    id: i.id,
    name: normalizeTranslated(i.name_en, i.name_ar, i.name_ku),
    display_name: resolveTranslated({ en: i.name_en, ar: i.name_ar, ku: i.name_ku }, lang, i.source_lang || null),
    description: normalizeTranslated(i.description_en, i.description_ar, i.description_ku),
    display_description: resolveTranslated({ en: i.description_en, ar: i.description_ar, ku: i.description_ku }, lang, i.source_lang || null),
    price: Number(i.price || 0),
    compareAt: i.compare_at !== null && i.compare_at !== undefined ? Number(i.compare_at) : null,
    image: i.image || '',
    featured: Boolean(i.featured),
    popular: Boolean(i.popular),
    available: i.available === null || i.available === undefined ? true : Boolean(i.available),
    source_lang: i.source_lang || null,
    options: parseJson(i.options, null)
  };
}

/**
 * جلب أصناف محددة لتسعير الطلب — من الجداول أولاً،
 * ثم من المنيو JSON المحفوظ في Restaurants.menu (احتياطي).
 * يعيد Map<id, item> بأسماء موحّدة وسعر وتوفر وخيارات.
 */
async function resolveItemsForOrder(restaurant, itemIds) {
  const pool = await getPool();
  const map = new Map();
  if (itemIds.length === 0) return map;

  const request = pool.request();
  const inList = itemIds.map((id, i) => {
    request.input(`i${i}`, sql.NVarChar, id);
    return `@i${i}`;
  }).join(', ');
  const rows = await request
    .input('restaurantId', sql.NVarChar, restaurant.id)
    .query(`
      SELECT mi.* FROM MenuItems mi
      JOIN MenuCategories mc ON mc.id = mi.category_id
      WHERE mi.id IN (${inList}) AND mc.restaurant_id = @restaurantId
    `);
  for (const row of rows.recordset) {
    const item = mapItemRow(row);
    map.set(item.id, { ...item, displayName: item.name.en || item.name.ar });
  }

  // احتياطي: أصناف JSON لو غير موجودة في الجداول
  const missing = itemIds.filter((id) => !map.has(id));
  if (missing.length > 0) {
    const jsonMenu = parseJson(restaurant.published_menu || restaurant.menu || null, []);
    for (const cat of jsonMenu) {
      for (const [ii, item] of (Array.isArray(cat.items) ? cat.items : []).entries()) {
        const id = item.id || `json-item-${cat.id || 0}-${ii}`;
        if (!missing.includes(id)) continue;
        map.set(id, {
          id,
          name: typeof item.name === 'object' && item.name !== null ? item.name : { en: item.name || '', ar: item.name_ar || '', ku: item.name_ku || '' },
          price: Number(item.price || 0),
          available: item.available === undefined ? true : Boolean(item.available),
          options: Array.isArray(item.options) && item.options.length ? { groups: item.options } : (parseJson(item.options, null) || null),
          displayName: (typeof item.name === 'object' ? (item.name.en || item.name.ar) : item.name) || ''
        });
      }
    }
  }
  return map;
}

/**
 * هل وسيلة الدفع "مهيأة فعلًا"؟ (لا نعرض وسيلة غير جاهزة كمتاحة)
 * البطقة/المحفظة تحتاج مفتاح Stripe فعليًا.
 */
function methodConfigured(key, settings) {
  const m = settings.paymentMethods[key];
  if (!m || !m.enabled) return false;
  if (key === 'card' || key === 'wallet') {
    return Boolean(process.env.STRIPE_SECRET_KEY);
  }
  if (key === 'bank_transfer') {
    return Boolean(m.instructions && String(m.instructions).trim());
  }
  return true;
}

/** وسائل الدفع الجاهزة للعرض في صفحة الطلب */
function availablePaymentMethods(settings) {
  return Object.keys(settings.paymentMethods)
    .filter((key) => methodConfigured(key, settings))
    .map((key) => ({
      code: key,
      label: ({
        cash: 'Cash on Delivery',
        cash_at_pickup: 'Cash at Pickup',
        card: 'Credit / Debit Card',
        wallet: 'Digital Wallet',
        bank_transfer: 'Bank Transfer',
      })[key],
      kind: key === 'cash' || key === 'cash_at_pickup' ? 'offline' : 'online',
      requiresConfirmation: key === 'bank_transfer',
      instructions: key === 'bank_transfer' ? (settings.paymentMethods.bank_transfer.instructions || '') : undefined,
    }));
}

/**
 * المنيو العام لمطعم بنشرته (slug) — بيانات جاهزة للواجهة.
 */
async function getPublicMenuBySlug(slug, lang = 'en') {
  const pool = await getPool();
  const result = await pool.request()
    .input('slug', sql.NVarChar, slug)
    .query(`SELECT id, name_en, name_ar, name_ku, slug, status, templateId, design, menu, draft_menu, published_menu, language, ordering, updated_at, created_at,
      tagline_en, tagline_ar, tagline_ku, description_en, description_ar, description_ku,
      logoText_en, logoText_ar, logoText_ku, logoStyle, heroImage, heroVideo, gallery,
      phone, email, address, hours, socials
      FROM Restaurants WHERE slug = @slug AND LOWER(status) = 'published'`);
  if (result.recordset.length === 0) {
    const err = new Error('المطعم غير موجود');
    err.status = 404;
    err.code = 'RESTAURANT_NOT_FOUND';
    throw err;
  }
  const r = result.recordset[0];
  const settings = orderingSettingsFromRow(r);

  const categoriesResult = await pool.request()
    .input('restaurantId', sql.NVarChar, r.id)
    .query(`
      SELECT * FROM MenuCategories WHERE restaurant_id = @restaurantId ORDER BY sort_order ASC
    `);

  let categories = [];
  for (const cat of categoriesResult.recordset) {
    const itemsResult = await pool.request()
      .input('categoryId', sql.NVarChar, cat.id)
      .query('SELECT * FROM MenuItems WHERE category_id = @categoryId ORDER BY sort_order ASC');
    categories.push({
      id: cat.id,
      name: normalizeTranslated(cat.name_en, cat.name_ar, cat.name_ku),
      display_name: resolveTranslated({ en: cat.name_en, ar: cat.name_ar, ku: cat.name_ku }, lang, cat.source_lang || null),
      note: normalizeTranslated(cat.note_en, cat.note_ar, cat.note_ku),
      display_note: resolveTranslated({ en: cat.note_en, ar: cat.note_ar, ku: cat.note_ku }, lang, cat.source_lang || null),
      items: itemsResult.recordset.map(mapItemRow)
    });
  }

  /* احتياطي: المنيو المنشور المحفوظ كـ JSON في Restaurants.published_menu */
  if (categories.length === 0) {
    const jsonMenu = parseJson(r.published_menu || r.menu, []);
    categories = jsonMenu.map((cat, ci) => ({
      id: cat.id || `json-cat-${ci}`,
      name: typeof cat.name === 'object' && cat.name !== null ? cat.name : { en: cat.name || '', ar: cat.name_ar || '', ku: cat.name_ku || '' },
      display_name: resolveTranslated(typeof cat.name === 'object' && cat.name !== null ? cat.name : { en: cat.name || '', ar: cat.name_ar || '', ku: cat.name_ku || '' }, lang, cat.sourceLang || null),
      note: typeof cat.note === 'object' && cat.note !== null ? cat.note : { en: cat.note || '', ar: cat.note_ar || '', ku: cat.note_ku || '' },
      items: (Array.isArray(cat.items) ? cat.items : []).map((i, ii) => ({
        id: i.id || `json-item-${ci}-${ii}`,
        name: typeof i.name === 'object' && i.name !== null ? i.name : { en: i.name || '', ar: i.name_ar || '', ku: i.name_ku || '' },
        display_name: resolveTranslated(typeof i.name === 'object' && i.name !== null ? i.name : { en: i.name || '', ar: i.name_ar || '', ku: i.name_ku || '' }, lang, i.sourceLang || cat.sourceLang || null),
        description: typeof i.description === 'object' && i.description !== null ? i.description : { en: i.description || '', ar: i.description_ar || '', ku: i.description_ku || '' },
        display_description: resolveTranslated(typeof i.description === 'object' && i.description !== null ? i.description : { en: i.description || '', ar: i.description_ar || '', ku: i.description_ku || '' }, lang, i.sourceLang || cat.sourceLang || null),
        price: Number(i.price || 0),
        compareAt: i.compareAt ?? (i.compare_at !== undefined ? Number(i.compare_at) : null),
        image: i.image || '',
        featured: Boolean(i.featured),
        popular: Boolean(i.popular),
        available: i.available === undefined ? true : Boolean(i.available),
        options: Array.isArray(i.options) && i.options.length ? { groups: i.options } : (parseJson(i.options, null) || null)
      }))
    }));
  }

  return {
    restaurant: {
      id: r.id,
      name: { en: r.name_en, ar: r.name_ar, ku: r.name_ku },
      slug: r.slug,
      tagline: { en: r.tagline_en, ar: r.tagline_ar, ku: r.tagline_ku },
      description: { en: r.description_en, ar: r.description_ar, ku: r.description_ku },
      logoText: { en: r.logoText_en, ar: r.logoText_ar, ku: r.logoText_ku },
      logoStyle: r.logoStyle || 'monogram',
      heroImage: r.heroImage || '',
      heroVideo: r.heroVideo || '',
      gallery: parseJson(r.gallery, []),
      phone: r.phone || '',
      email: r.email || '',
      address: r.address || '',
      hours: parseJson(r.hours, []),
      socials: parseJson(r.socials, {}),
      templateId: r.templateId || r.template_id || 'bella-italia',
      design: parseJson(r.design, null),
      language: r.language || 'en',
      status: r.status,
      updatedAt: r.updated_at,
      copy: parseJson(r.copy, null),
      inline: parseJson(r.inline, null)
    },
    menu: categories,
    ordering: {
      enabled: settings.enabled,
      currency: settings.currency || 'USD',
      fulfillment: settings.fulfillment,
      deliveryFee: Number(settings.deliveryFee || 0),
      minOrder: Number(settings.minOrder || 0),
      promo: settings.promo && settings.promo.code ? {
        code: settings.promo.code,
        // لا نكشف نوع/قيمة الخصم للعميل — الخصم يُعاد حسابه في الخادم
        announce: true
      } : null,
      paymentMethods: availablePaymentMethods(settings)
    }
  };
}

module.exports = { getPublicMenuBySlug, availablePaymentMethods, methodConfigured, resolveItemsForOrder, parseJson };
