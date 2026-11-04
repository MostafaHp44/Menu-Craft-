/**
 * i18n extension owned by the **Subscription & billing** page.
 * Merged into the main dictionaries by `src/shared/i18n/index.tsx` — do not import elsewhere.
 *
 * Rules: keep `ar` and `ku` typed as `Deep<typeof en>` so every key exists in all
 * three languages, and only add keys under your own top-level group `billing`.
 */
type Deep<T> = { [K in keyof T]: T[K] extends string ? string : Deep<T[K]> }

const en = {
  billing: {
    /* ------------------------------ plan cards ----------------------------- */
    planFreeTrial: 'Free Trial',
    planProfessional: 'Professional',
    planBusiness: 'Business',
    trialLength: '3 days free',
    perMonth: '/ month',
    current: 'Current',
    currentPlan: 'Current plan',
    choose: 'Choose',
    upgradeTo: 'Upgrade to {name}',
    popular: 'Most popular',
    unlimited: 'Unlimited',
    sites: '{n} sites',

    /* ------------------------------- features ------------------------------ */
    featTrialDays: '3-day free trial',
    featSites1: '1 website',
    featSites3: '3 websites',
    featUnlimitedSites: 'Unlimited websites',
    featUnlimitedItems: 'Unlimited menu items',
    featCustomization: 'Full customization',
    featQrCode: 'QR code menu',
    featRemoveBranding: 'Remove Digital Menu branding',
    featGallery: 'Photo gallery',
    featFeaturedItems: 'Featured dishes',
    featTemplatePriority: 'Priority templates',
    featBrandKit: 'Brand Kit',
    featTeamAccounts: 'Team accounts',
    featPrioritySupport: 'Priority support',

    /* ---------------------------- current plan hero ------------------------ */
    statusActive: 'Active',
    statusTrialing: 'Trial',
    statusPastDue: 'Past due',
    statusCancelled: 'Cancelled',
    statusExpired: 'Expired',
    daysLeft: '{n} days left',
    renewsOn: 'Renews on {date}',
    endsOn: 'Ends on {date}',
    autoRenew: 'Auto-renew',
    autoRenewOn: 'Your plan renews automatically each month.',
    autoRenewOff: 'Auto-renew is off — your plan ends at the period end.',
    renew: 'Renew now',
    expired: 'Your subscription has expired',
    expiredHint: 'Upgrade to restore full access to your websites and menu tools.',

    /* ------------------------------ checkout ------------------------------- */
    subscribe: 'Subscribe',
    processing: 'Redirecting to secure checkout…',
    stripeNotConfigured:
      'Card payments are not configured on the server yet (no Stripe key). Your plan was NOT changed — choose a paid plan once payments are enabled.',
    freeNoCheckout: 'The Free Trial needs no payment — it is applied to your account.',
    checkoutFailed: 'Could not start checkout',
    redirectHint: 'You will be redirected to Stripe to pay securely. Your plan activates only after payment is confirmed.',

    /* ------------------------------ status cue ----------------------------- */
    loadingPlans: 'Loading plans…',
    loadError: 'Could not load plans.',
    retry: 'Retry',
  },
}

const ar: Deep<typeof en> = {
  billing: {
    planFreeTrial: 'تجربة مجانية',
    planProfessional: 'احترافي',
    planBusiness: 'أعمال',
    trialLength: '3 أيام مجاناً',
    perMonth: '/ شهرياً',
    current: 'الحالية',
    currentPlan: 'الباقة الحالية',
    choose: 'اختيار',
    upgradeTo: 'الترقية إلى {name}',
    popular: 'الأكثر شيوعاً',
    unlimited: 'بلا حد',
    sites: '{n} مواقع',

    featTrialDays: 'فترة تجربة 3 أيام',
    featSites1: 'موقع واحد',
    featSites3: '3 مواقع',
    featUnlimitedSites: 'مواقع بلا حد',
    featUnlimitedItems: 'أصناف منيو بلا حد',
    featCustomization: 'تخصيص كامل',
    featQrCode: 'منيو QR',
    featRemoveBranding: 'إزالة علامة Digital Menu',
    featGallery: 'معرض صور',
    featFeaturedItems: 'أصناف مميزة',
    featTemplatePriority: 'قوالب ذات أولوية',
    featBrandKit: 'حزمة الهوية',
    featTeamAccounts: 'حسابات فريق',
    featPrioritySupport: 'دعم ذو أولوية',

    statusActive: 'فعّال',
    statusTrialing: 'تجربة',
    statusPastDue: 'متأخر السداد',
    statusCancelled: 'ملغى',
    statusExpired: 'منتهٍ',
    daysLeft: '{n} يوم متبقي',
    renewsOn: 'يتجدد في {date}',
    endsOn: 'ينتهي في {date}',
    autoRenew: 'تجديد تلقائي',
    autoRenewOn: 'تتجدد باقتك تلقائياً كل شهر.',
    autoRenewOff: 'التجديد التلقائي مُعطّل — تنتهي باقتك بنهاية الفترة.',
    renew: 'تجديد الآن',
    expired: 'انتهى اشتراكك',
    expiredHint: 'قم بالترقية لاستعادة الوصول الكامل إلى مواقعك وأدوات المنيو.',

    subscribe: 'اشتراك',
    processing: 'جارٍ التحويل إلى صفحة دفع آمنة…',
    stripeNotConfigured:
      'مدفع البطاقات غير مهيأ على الخادم بعد (لا يوجد مفتاح Stripe). لم يتم تغيير باقتك — اختر باقة مدفوعة عند تفعيل المدفوعات.',
    freeNoCheckout: 'التجربة المجانية لا تحتاج دفعاً — تُطبَّق على حسابك مباشرة.',
    checkoutFailed: 'تعذّر بدء عملية الدفع',
    redirectHint: 'سيتم تحويلك إلى Stripe للدفع بأمان. تُفعَّل باقتك فقط بعد تأكيد الدفع.',

    loadingPlans: 'جارٍ تحميل الباقات…',
    loadError: 'تعذّر تحميل الباقات.',
    retry: 'إعادة المحاولة',
  },
}

const ku: Deep<typeof en> = {
  billing: {
    planFreeTrial: 'تاقی بەخۆڕایی',
    planProfessional: 'پروفەشنال',
    planBusiness: 'بیزنس',
    trialLength: '3 ڕۆژ بەخۆڕایی',
    perMonth: '/ ماوەیانە',
    current: 'ئێستا',
    currentPlan: 'پلانی ئێستا',
    choose: 'هەڵبژێرە',
    upgradeTo: 'بەرزکردنەوە بۆ {name}',
    popular: 'بەزۆری هەڵبژێردراو',
    unlimited: 'بێ سنوور',
    sites: '{n} ماڵ',

    featTrialDays: 'تاقیکردنەوەی 3 ڕۆژ',
    featSites1: 'ماڵێک',
    featSites3: '3 ماڵ',
    featUnlimitedSites: 'ماڵ بێ سنوور',
    featUnlimitedItems: 'شتی مینیو بێ سنوور',
    featCustomization: 'ڕێکخستنی تەواو',
    featQrCode: 'مینیوی QR',
    featRemoveBranding: 'سڕینەوەی نیشانەی Digital Menu',
    featGallery: 'گەلەری وێنە',
    featFeaturedItems: 'شتی تایبەت',
    featTemplatePriority: 'قاڵبی پێشینە',
    featBrandKit: 'هێوی براند',
    featTeamAccounts: 'هەژماری تیم',
    featPrioritySupport: 'پاڵپشتی پێشینە',

    statusActive: 'چالاک',
    statusTrialing: 'تاقیکردنەوە',
    statusPastDue: 'دواپارێکراو',
    statusCancelled: 'هەڵوەشێندراو',
    statusExpired: 'تەواوبوو',
    daysLeft: '{n} ڕۆژ ماوە',
    renewsOn: 'نوێ دەکرێتەوە {date}',
    endsOn: 'تەواو دەبێت {date}',
    autoRenew: 'نوێکردنەوەی خۆکار',
    autoRenewOn: 'پلانی تۆ بە خۆکاری نوێ دەکرێتەوە هەر مانگێک.',
    autoRenewOff: 'نوێکردنەوەی خۆکار ناچالاکە — پلانی تۆ لە کۆتایی کاتژمۆرەکە تەواو دەبێت.',
    renew: 'نوێکردنەوە ئێستا',
    expired: 'بەشداربوونی تۆ تەواو بووە',
    expiredHint: 'بەرز بکەرەوە بۆ گەیشتنەوەی تەواو بۆ ماڵەکان و ئامرازەکانی مینیو.',

    subscribe: 'بەشداربە',
    processing: 'گوازردنەوە بۆ پاراستنی پارەدان…',
    stripeNotConfigured:
      'پارەدانی کارت لەسەر سێرڤەر ڕێکنەخراوە (کلیلی Stripe نییە). پلانی تۆ نەگۆڕیت — پلانێکی پارەدان هەڵبژێرە کاتی ڕێکخستنی پارەدان چالاک دەبێت.',
    freeNoCheckout: 'تاقیکردنەوەی بەخۆڕایی پارەدان نیاز نییە — بەسەرخۆ ئەنجام دەدرێت.',
    checkoutFailed: 'دەستپێکردنی پارەدان سەرکەوتوو نەبوو',
    redirectHint: 'بۆ Stripe گوازردنەوە دەکرێت بۆ پارەدانی پاراستن. پلانی تۆ تەنها دوای پشتڕاستکردنەوە چالاک دەبێت.',

    loadingPlans: 'بارکردنی پلانەکان…',
    loadError: 'بارکردنی پلانەکان سەرکەوتوو نەبوو.',
    retry: 'دووبارە هەوڵبدەرەوە',
  },
}

export const billingUi = { en, ar, ku }
