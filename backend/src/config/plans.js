/**
 * MenuCraft — الباقات الموثوقة (Source of Truth للحدود)
 * ------------------------------------------------------------
 * جدول Plans في القاعدة هو المرجع الأساسي (يُقرأ وقت التشغيل)، وهذا الملف
 * يحمل القيم الافتراضية الآمنة + أسماء الحدود الموحدة التي تُستخدم في كل الخدمات.
 *
 * حدود المواقع تُفرض من الـ Backend فقط (API + Database) — إخفاء الزر في
 * الواجهة ليس فرضًا للحد.
 */

/** القيمة التي تعني "بلا حد" في عمود max_restaurants */
const UNLIMITED = -1;

/** الباقة الافتراضية عند غياب أي اشتراك (حساب جديد = فترة تجربة) */
const DEFAULT_PLAN_ID = 'trial';

/**
 * المواصفات الافتراضية للباقات الثلاث.
 * تُزرع في جدول Plans عبر database/migrate.js، وتُستخدم هنا كـ fallback
 * لو لم تتوفر الباقات في القاعدة.
 */
const PLAN_SPECS = {
  trial: {
    id: 'trial',
    name: 'Free Trial',
    nameAr: 'تجربة مجانية',
    price: 0,
    interval: 'trial',
    trialDays: 3,
    maxSites: 1,
    maxMenuItems: -1,
    features: {
      trialDays: 3,
      maxSites: 1,
      unlimitedMenuItems: true,
      qrCode: true,
      removeBranding: false,
      gallery: true,
      featuredItems: true,
      templatePriority: false,
      brandKit: false,
      teamAccounts: false,
      prioritySupport: false
    }
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    nameAr: 'احترافي',
    price: 29,
    interval: 'month',
    trialDays: 0,
    maxSites: 3,
    maxMenuItems: -1,
    features: {
      maxSites: 3,
      unlimitedMenuItems: true,
      customization: true,
      qrCode: true,
      removeBranding: true,
      gallery: true,
      featuredItems: true,
      templatePriority: true,
      brandKit: false,
      teamAccounts: false,
      prioritySupport: false
    }
  },
  business: {
    id: 'business',
    name: 'Business',
    nameAr: 'أعمال',
    price: 79,
    interval: 'month',
    trialDays: 0,
    maxSites: UNLIMITED,
    maxMenuItems: -1,
    features: {
      maxSites: -1,
      unlimitedMenuItems: true,
      customization: true,
      qrCode: true,
      removeBranding: true,
      gallery: true,
      featuredItems: true,
      templatePriority: true,
      brandKit: true,
      teamAccounts: true,
      prioritySupport: true
    }
  }
};

/** مطابقة اسم/معرّف الباقة القادمة من القاعدة إلى مفتاح موحّد */
function normalizePlanKey(value) {
  if (!value) return null;
  const v = String(value).toLowerCase().trim();
  if (v === 'trial' || v === 'free trial' || v.includes('trial')) return 'trial';
  if (v === 'professional' || v.includes('pro')) return 'professional';
  if (v === 'business' || v.includes('business')) return 'business';
  if (v === 'starter') return 'starter'; // باقة قديمة غير فعّالة
  return v;
}

/** تحويل صف Plans من القاعدة إلى كائن حدود موحّد */
function planLimitsFromRow(row) {
  if (!row) {
    const spec = PLAN_SPECS[DEFAULT_PLAN_ID];
    return {
      planId: spec.id,
      planName: spec.name,
      price: spec.price,
      interval: spec.interval,
      maxSites: spec.maxSites,
      maxMenuItems: spec.maxMenuItems,
      features: { ...spec.features },
      isUnlimitedSites: false
    };
  }
  let features = {};
  try {
    features = typeof row.features === 'string' ? JSON.parse(row.features) : (row.features || {});
  } catch {
    features = {};
  }
  const key = normalizePlanKey(row.plan_id || row.plan_name || row.id || row.name);
  const spec = PLAN_SPECS[key];
  const maxSites = row.max_restaurants ?? features.maxSites ?? spec?.maxSites ?? 1;
  const rawMaxItems = row.max_menu_items ?? spec?.maxMenuItems ?? 15;
  return {
    planId: key || row.id,
    planName: row.plan_name || row.name || spec?.name || String(row.plan_id || ''),
    price: Number(row.price ?? spec?.price ?? 0),
    interval: row.interval_type || row.period || spec?.interval || 'month',
    maxSites,
    maxMenuItems: features.unlimitedMenuItems === true || rawMaxItems === -1 ? -1 : rawMaxItems,
    features: { ...(spec?.features || {}), ...features },
    isUnlimitedSites: maxSites === UNLIMITED,
    trialDays: features.trialDays ?? spec?.trialDays ?? 0
  };
}

/**
 * فحص حد عدد المواقع.
 * @param {number} maxSites  الحد الأقصى (-1 = بلا حد)
 * @param {number} used      عدد المواقع الحالية
 * @returns {{canCreate: boolean, overLimit: boolean, remaining: number|null}}
 */
function evaluateSiteLimit(maxSites, used) {
  if (maxSites === UNLIMITED) {
    return { canCreate: true, overLimit: false, remaining: null };
  }
  const remaining = Math.max(0, maxSites - used);
  return {
    canCreate: used < maxSites,
    // تجاوز الحد يحدث عند تخفيض الباقة أو انتهاء الاشتراك — لا يُحذف أي موقع
    overLimit: used > maxSites,
    remaining
  };
}

module.exports = {
  UNLIMITED,
  DEFAULT_PLAN_ID,
  PLAN_SPECS,
  normalizePlanKey,
  planLimitsFromRow,
  evaluateSiteLimit
};
