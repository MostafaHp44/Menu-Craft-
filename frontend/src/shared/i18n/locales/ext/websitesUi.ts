/**
 * i18n extension owned by the **Websites tab** agent.
 * Merged into the main dictionaries by `src/shared/i18n/index.tsx` — do not import elsewhere.
 *
 * Rules: keep `ar` and `ku` typed as `Deep<typeof en>` so every key exists in all
 * three languages, and only add keys under your own top-level group `websites`.
 */
type Deep<T> = { [K in keyof T]: T[K] extends string ? string : Deep<T[K]> }

const en = {
  dashboardNav: {
    websites: 'Websites',
  },
  websites: {
    /* ------------------------------ usage strip ---------------------------- */
    count: 'Websites: {used} / {max}',
    countUnlimited: 'Websites: {used} / Unlimited',
    slotsRemaining: '{n} website slot remaining',
    slotsRemainingPlural: '{n} website slots remaining',
    noSlotsRemaining: 'No website slots remaining',
    unlimited: 'Unlimited',
    upgradePlan: 'Upgrade Plan',
    sitesMax: '{max} websites max',
    sitesMaxOne: '1 website max',
    unlimitedWebsites: 'Unlimited websites',
    templateCustom: 'Custom',
    templateNone: 'None',

    /* ------------------------------ site cards ----------------------------- */
    yourSites: 'Your websites',
    manage: 'Manage',
    preview: 'Preview',
    editMenu: 'Edit Menu',
    settings: 'Settings',
    openSite: 'Open live site',
    liveSite: 'Live',
    draftSite: 'Draft',
    items: '{n} items',
    ordersToday: '{n} orders today',
    updated: 'Updated {date}',
    createdOn: 'Created {date}',
    templateLabel: 'Template',
    actions: 'Actions',

    /* ------------------------------ empty state ---------------------------- */
    emptyTitle: 'Create your first website',
    emptyDesc: 'Every plan includes at least one website. Pick a template and publish in minutes.',
    createFirstSite: 'Create your first website',

    /* ------------------------------ limit reached -------------------------- */
    maxTitle: 'Website limit reached',
    maxDesc: 'Your current plan allows up to {max} websites. Upgrade to publish more.',
    maxDescUnlimited: 'Your plan allows unlimited websites.',

    /* ------------------------------ create wizard -------------------------- */
    create: 'Create website',
    creating: 'Creating…',
    wizardTitle: 'New website',
    wizardNameLabel: 'Website name',
    wizardNamePh: 'e.g. Bella Italia',
    wizardSlugLabel: 'Web address',
    wizardSlugPh: 'e.g. bella-italia',
    wizardSlugHint: 'Customers will visit {url}',
    wizardTemplateLabel: 'Template',
    cancel: 'Cancel',
    confirm: 'Confirm',
    nameRequired: 'Please enter a website name.',
    slugRequired: 'Please enter a valid web address (a-z, 0-9 and dashes).',
    slugTaken: 'This web address is already taken — try another.',
    created: 'Website created',

    /* -------------------------------- errors ------------------------------- */
    loadError: 'Could not load your websites.',
    retry: 'Retry',
  },
}

const ar: Deep<typeof en> = {
  dashboardNav: {
    websites: 'المواقع',
  },
  websites: {
    count: 'المواقع: {used} / {max}',
    countUnlimited: 'المواقع: {used} / غير محدود',
    slotsRemaining: 'يتبقى موقع واحد',
    slotsRemainingPlural: 'يتبقى {n} مواقع',
    noSlotsRemaining: 'لا توجد مواقع متاحة',
    unlimited: 'غير محدود',
    upgradePlan: 'ترقية الباقة',
    sitesMax: '{max} مواقع كحد أقصى',
    sitesMaxOne: 'موقع واحد كحد أقصى',
    unlimitedWebsites: 'مواقع غير محدودة',
    templateCustom: 'مخصص',
    templateNone: 'بدون',

    yourSites: 'مواقعك',
    manage: 'إدارة',
    preview: 'معاينة',
    editMenu: 'تعديل المنيو',
    settings: 'الإعدادات',
    openSite: 'فتح الموقع',
    liveSite: 'منشور',
    draftSite: 'مسودة',
    items: '{n} صنف',
    ordersToday: '{n} طلب اليوم',
    updated: 'آخر تحديث {date}',
    createdOn: 'تم الإنشاء {date}',
    templateLabel: 'القالب',
    actions: 'إجراءات',

    emptyTitle: 'أنشئ موقعك الأول',
    emptyDesc: 'كل باقة تشمل موقعًا واحدًا على الأقل. اختر قالبًا وانشره خلال دقائق.',
    createFirstSite: 'إنشاء موقعك الأول',

    maxTitle: 'تم الوصول لحد المواقع',
    maxDesc: 'باقة الحالية تسمح بحد أقصى {max} مواقع. قم بالترقية لنشر مواقع إضافية.',
    maxDescUnlimited: 'باقتك تسمح بعدد غير محدود من المواقع.',

    create: 'إنشاء موقع',
    creating: 'جارٍ الإنشاء…',
    wizardTitle: 'موقع جديد',
    wizardNameLabel: 'اسم الموقع',
    wizardNamePh: 'مثال: بيتا إيطاليا',
    wizardSlugLabel: 'الرابط',
    wizardSlugPh: 'مثال: bella-italia',
    wizardSlugHint: 'سيزور العملاء {url}',
    wizardTemplateLabel: 'القالب',
    cancel: 'إلغاء',
    confirm: 'تأكيد',
    nameRequired: 'الرجاء إدخال اسم الموقع.',
    slugRequired: 'الرجاء إدخال رابط صحيح (أحرف إنجليزية وأرقام وشرطات).',
    slugTaken: 'هذا الرابط مستخدم بالفعل — جرّب رابطًا آخر.',
    created: 'تم إنشاء الموقع',

    loadError: 'تعذّر تحميل مواقعك.',
    retry: 'إعادة المحاولة',
  },
}

const ku: Deep<typeof en> = {
  dashboardNav: {
    websites: 'ماڵەکان',
  },
  websites: {
    count: 'ماڵەکان: {used} / {max}',
    countUnlimited: 'ماڵەکان: {used} / بێ سنوور',
    slotsRemaining: 'ماڵێکی تر ماوە',
    slotsRemainingPlural: '{n} ماڵ ماوە',
    noSlotsRemaining: 'هیچ ماڵێکی بەردەست نییە',
    unlimited: 'بێ سنوور',
    upgradePlan: 'بەرزکردنەوەی پلان',
    sitesMax: '{max} ماڵ بەرزترین ژمارە',
    sitesMaxOne: 'ماڵێک بەرزترین ژمارە',
    unlimitedWebsites: 'بێ سنوور ماڵ',
    templateCustom: 'دەستکرد',
    templateNone: 'هیچ',

    yourSites: 'ماڵەکانی تۆ',
    manage: 'ڕێکخستن',
    preview: 'پێشکەشکردن',
    editMenu: 'دەستکاری مینیو',
    settings: 'ڕێکخستنەکان',
    openSite: 'کردنەوەی ماڵەکە',
    liveSite: 'بەردەستە',
    draftSite: 'ڕەشنووس',
    items: '{n} شت',
    ordersToday: '{n} داوا ئەمڕۆ',
    updated: 'نوێکرایەوە {date}',
    createdOn: 'دروستکرا {date}',
    templateLabel: 'قاڵب',
    actions: 'کردارەکان',

    emptyTitle: 'ماڵی یەکەم دروست بکە',
    emptyDesc: 'هەموو پلانەکان لەکەڵی ماڵێک دەگرنەوە. قالبێک هەڵبژێرە و بڵاو بکەوە لە چەند خولەکدا.',
    createFirstSite: 'ماڵی یەکەم دروست بکە',

    maxTitle: 'سنووری ماڵەکان تێپەڕی',
    maxDesc: 'پلانی ئێستا هەتا {max} ماڵ ڕێگەپێدەدات. بۆ بڵاوکردنەوەی زیاتر بەرز بکەرەوە.',
    maxDescUnlimited: 'پلانی تۆ ڕێگەدەدات بە ماڵێکی بێ سنوور.',

    create: 'دروستکردنی ماڵ',
    creating: 'دروستکردن…',
    wizardTitle: 'ماڵی نوێ',
    wizardNameLabel: 'ناوی ماڵ',
    wizardNamePh: 'وەک: Bella Italia',
    wizardSlugLabel: 'ناونیشانی وێبسایت',
    wizardSlugPh: 'وەک: bella-italia',
    wizardSlugHint: 'کڕیارەکان {url} سەردەکەن',
    wizardTemplateLabel: 'قاڵب',
    cancel: 'هەڵوەشاندنەوە',
    confirm: 'پشتڕاستکردنەوە',
    nameRequired: 'تکایە ناوی ماڵ بنووسە.',
    slugRequired: 'تکایە ناونیشانی دروست بنووسە (پی لاتینی و ژمارە و شرطة).',
    slugTaken: 'ئەم ناونیشانە پێشتر بەکارهاتووە — یەکێکی تر تاقی بکەرەوە.',
    created: 'ماڵەکە دروست کرا',

    loadError: 'ماڵەکانت بار نەکرانەوە.',
    retry: 'دووبارە هەوڵبدەرەوە',
  },
}

export const websitesUi = { en, ar, ku }
