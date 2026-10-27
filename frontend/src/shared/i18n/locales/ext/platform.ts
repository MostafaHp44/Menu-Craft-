/**
 * i18n extension owned by the **platform (super admin)** agent.
 * Merged into the main dictionaries by `src/shared/i18n/index.tsx` — do not import elsewhere.
 *
 * Rules: keep `ar` and `ku` typed as `Deep<typeof en>` so every key exists in all
 * three languages, and only add keys under your own top-level group `platformMore`.
 */
type Deep<T> = { [K in keyof T]: T[K] extends string ? string : Deep<T[K]> }

const en = {
  platformMore: {
    demoBadge: 'Demo data',
    footerNote:
      'MenuCraft platform console · every figure on this screen is simulated for the prototype.',
    tabsLabel: 'Admin sections',
    planLabel: 'Plan',
    access: {
      signInTitle: 'Platform access required',
      signInSub:
        'Sign in with the demo super admin account to manage clients, plans, payments and the platform team.',
      signInSuper: 'Sign in as super admin',
      noPermissions:
        'Your admin account has no tabs enabled yet. A super admin can grant access from the Team & access tab.',
      restrictedNote: 'Limited access — only the tabs granted to your account are shown.',
    },
    clients: {
      subtitle: 'Every restaurant on the platform, with its plan, status and simulated public URL.',
      ownerLabel: 'Owner',
      noOwner: 'No owner account',
      created: 'Created',
      viewSales: 'View sales report',
      suspendedMsg: '{name} is suspended — its team can no longer sign in.',
      activatedMsg: '{name} is active again.',
      deleteTitle: 'Delete {name}?',
      deleteBody:
        'The restaurant, every account on it, its subscription and payment connections leave this demo. This cannot be undone.',
      deletedMsg: '{name} was removed from the platform demo.',
      noResults: 'No clients match this search',
      noResultsHint: 'Try another name, slug or owner email.',
      clearSearch: 'Clear search',
      urlNote: 'Simulated subdomain — never provisioned in this prototype.',
    },
    subs: {
      trialing: 'Trialing',
      pastDue: 'Past due',
      expired: 'Expired',
      expireNow: 'Expire now',
      demoNote: 'Plans, dates and renewals are simulated — no payment is ever processed.',
      missingSub: 'No subscription yet',
      missingSubHint: 'This restaurant has no subscription record on the platform.',
    },
    sales: {
      client: 'Client',
      period: 'Period',
      comparisonTitle: 'Revenue by client · this month',
      thisMonth: 'This month',
      share: 'Share',
      demoNote:
        'Deterministic demo numbers per restaurant — no real orders sit behind this chart.',
    },
    templates: {
      copyNote:
        'A new template is a copy of the base design — edit the copy freely, the original stays untouched.',
      baseTemplate: 'Base template',
      category: 'Category',
      customBadge: 'Custom copy',
      usage: 'Usage counts are simulated, platform-wide numbers.',
      addedNote: 'Added copies become available to new sign-ups in this demo.',
      namePh: 'e.g. Summer menu 2026',
      addedMsg: '{name} was added to the platform templates.',
      removedMsg: '{name} was removed from the platform templates.',
    },
    team: {
      superAdminNote:
        'Super admins always see every tab — the permissions below only restrict admins.',
      permissionsFor: 'Access for {name}',
      namePh: 'e.g. Rania Aziz',
      emailPh: 'e.g. rania@menucraft.demo',
      addedMsg: '{name} joined the platform team.',
      permissionsSaved: 'Access updated for {name}.',
    },
    payments: {
      fee: 'Fee',
      connectedClients: 'Connected restaurants',
      noneConnected: 'No restaurant has this method connected yet.',
    },
  },
}

const ar: Deep<typeof en> = {
  platformMore: {
    demoBadge: 'بيانات تجريبية',
    footerNote: 'وحدة تحكم المنصة في MenuCraft · كل رقم في هذه الشاشة محاكاة للنموذج التجريبي.',
    tabsLabel: 'أقسام لوحة التحكم',
    planLabel: 'الخطة',
    access: {
      signInTitle: 'مطلوب صلاحية المنصة',
      signInSub:
        'سجّل الدخول بحساب المدير الأعلى التجريبي لإدارة العملاء والخطط والمدفوعات وفريق المنصة.',
      signInSuper: 'تسجيل الدخول كمدير أعلى',
      noPermissions:
        'لا توجد أقسام مفعّلة لحساب المدير لديك. يمكن للمدير الأعلى منح الصلاحية من تبويب الفريق والوصول.',
      restrictedNote: 'صلاحية محدودة — تظهر الأقسام الممنوحة لحسابك فقط.',
    },
    clients: {
      subtitle: 'كل مطعم على المنصة مع خطته وحالته ورابطه العام المحاكي.',
      ownerLabel: 'المالك',
      noOwner: 'لا يوجد حساب مالك',
      created: 'تاريخ الإنشاء',
      viewSales: 'عرض تقرير المبيعات',
      suspendedMsg: 'تم إيقاف {name} — لم يعد فريقه قادراً على تسجيل الدخول.',
      activatedMsg: '{name} نشط مرة أخرى.',
      deleteTitle: 'حذف {name}؟',
      deleteBody:
        'سيُزال المطعم وكل الحسابات المرتبطة به واشتراكه وطرق الدفع من هذا النموذج التجريبي. لا يمكن التراجع عن ذلك.',
      deletedMsg: 'تمت إزالة {name} من النموذج التجريبي للمنصة.',
      noResults: 'لا توجد عملاء يطابقون هذا البحث',
      noResultsHint: 'جرّب اسماً أو رابطاً أو بريداً إلكترونياً آخر.',
      clearSearch: 'مسح البحث',
      urlNote: 'نطاق فرعي محاكى — لا يُنشأ فعلياً في هذا النموذج.',
    },
    subs: {
      trialing: 'فترة تجريبية',
      pastDue: 'متأخر السداد',
      expired: 'منتهي',
      expireNow: 'إنهاء الآن',
      demoNote: 'الخطط والتواريخ والتجديدات محاكاة — لا تُعالج أي دفعة.',
      missingSub: 'لا يوجد اشتراك بعد',
      missingSubHint: 'لا يملك هذا المطعم سجل اشتراك على المنصة.',
    },
    sales: {
      client: 'العميل',
      period: 'الفترة',
      comparisonTitle: 'إيرادات العملاء · هذا الشهر',
      thisMonth: 'هذا الشهر',
      share: 'الحصة',
      demoNote: 'أرقام تجريبية حتمية لكل مطعم — لا توجد طلبات حقيقية خلف هذا الرسم.',
    },
    templates: {
      copyNote: 'القالب الجديد نسخة من التصميم الأساسي — عدّل النسخة بحرية والأصل يبقى كما هو.',
      baseTemplate: 'القالب الأساسي',
      category: 'التصنيف',
      customBadge: 'نسخة مخصصة',
      usage: 'أرقام الاستخدام محاكية على مستوى المنصة.',
      addedNote: 'تصبح النسخ المضافة متاحة للمسجلين الجدد في هذا النموذج.',
      namePh: 'مثال: قائمة الصيف ٢٠٢٦',
      addedMsg: 'أُضيف {name} إلى قوالب المنصة.',
      removedMsg: 'أُزيل {name} من قوالب المنصة.',
    },
    team: {
      superAdminNote: 'يرى المديرون الأعلىون كل التبويبات دائماً — الصلاحيات أدناه تحدّد المديرين فقط.',
      permissionsFor: 'الصلاحية لـ {name}',
      namePh: 'مثال: رانيا عزيز',
      emailPh: 'مثال: rania@menucraft.demo',
      addedMsg: 'انضم {name} إلى فريق المنصة.',
      permissionsSaved: 'تم تحديث صلاحيات {name}.',
    },
    payments: {
      fee: 'الرسوم',
      connectedClients: 'المطاعم المتصلة',
      noneConnected: 'لا يوجد مطعم متصل بهذه الطريقة بعد.',
    },
  },
}

const ku: Deep<typeof en> = {
  platformMore: {
    demoBadge: 'داتای تاقیکراوە',
    footerNote:
      'کۆنتڕۆڵی پلاتفۆرمی MenuCraft · هەموو ژمارەیەکان لەم شاشەیەدا بۆ ئەم پێوانەی تاقیکراوە تەقەکراون.',
    tabsLabel: 'بەشەکانی ئەدمین',
    planLabel: 'پلان',
    access: {
      signInTitle: 'دەستگەیشتن بۆ پلاتفۆرم دەوێت',
      signInSub:
        'بە هەژماری تاقیکراوی سوپەر ئەدمین چوونەژوورەوە بۆ بەڕێوەبردنی کڕیاران، پلانەکان، پارەدانەکان و تیمی پلاتفۆرم.',
      signInSuper: 'چوونەژوورەوە وەک سوپەر ئەدمین',
      noPermissions:
        'هیچ بەشێک بۆ هەژماری ئەدمینەکەت چالاک نەکراوە. سوپەر ئەدمین دەتوانێت دەستگەیشتن پێ بخات لە بەشی تیم و دەستگەیشتن.',
      restrictedNote: 'دەستگەیشتنی سنووردار — تەنها بەشەکانی هەژمارەکەت پیشان دەدرێن.',
    },
    clients: {
      subtitle: 'هەموو چایەخانەیەک لە پلاتفۆرمەوە لەگەڵ پلان، دۆخ و لینکی سروشتی تاقیکراوەکەی.',
      ownerLabel: 'خاوهن',
      noOwner: 'هەژماری خاوهن نییە',
      created: 'دروستکراوە',
      viewSales: 'پیشاندانی ڕاپۆرتی فرۆشتن',
      suspendedMsg: '{name} وەستاوە — تیمەکەی ناتوانێت بچێتەژوورەوە.',
      activatedMsg: '{name} دووبارە چالاک بوو.',
      deleteTitle: '{name} بسڕدرێتەوە؟',
      deleteBody:
        'چایەخانەکە، هەموو هەژمارەکانی، ئابونەتایی و هەڵبژاردنەکانی پارەدان لەم تاقیکردنەوەیە دەسڕدرێنەوە. ئەمە ناتوانرێت بگەڕێنرێتەوە.',
      deletedMsg: '{name} لە تاقیکردنەوەی پلاتفۆرمەوە لابرا.',
      noResults: 'هیچ کڕیارێک لەگەڵ ئەم گەڕانەوە ناگونجێت',
      noResultsHint: 'ناوێکی تر یان لینکێکی تر هەوڵ بدە.',
      clearSearch: 'سڕینەوەی گەڕان',
      urlNote: 'سوبدۆمینی تاقیکراو — لەم پێوانەیەدا دروست ناکرێت.',
    },
    subs: {
      trialing: 'تاقیکردنەوە',
      pastDue: 'قەرسدار',
      expired: 'تەواوبوو',
      expireNow: 'ئێستا بخە بەسەرچوو',
      demoNote: 'پلانەکان، ڕێکەخەکان و نوێکردنەوەکان تاقیکراون — هیچ پارەیەک نادەدرێت.',
      missingSub: 'هێشتا ئابونەتایی نییە',
      missingSubHint: 'ئەم چایەخانەیە هیچ تۆماری ئابونەتایی لە پلاتفۆرمدا نییە.',
    },
    sales: {
      client: 'کڕیار',
      period: 'کاتژمێر',
      comparisonTitle: 'داهاتی کڕیاران · ئەم مانگە',
      thisMonth: 'ئەم مانگە',
      share: 'بەش',
      demoNote: 'ژمارەی تاقیکراوی دیاریکراو بۆ هەر چایەخانەیەک — هیچ داواکارییەکی ڕاستەقینە لە ئەم وێنەیەدا نییە.',
    },
    templates: {
      copyNote:
        'قاڵبێکی نوێ کۆپی لە دیزاینە بنەڕەتییەکەیە — کۆپییەکە بە آزادی دەستکاری بکە، یەکەمەکە وەک خۆی مەمێنرێتەوە.',
      baseTemplate: 'قاڵبی بنەڕەت',
      category: 'پۆل',
      customBadge: 'کۆپی تایبەت',
      usage: 'ژمارەی بەکارهێنان ژمارەی تاقیکراوی سەرتاپلاتفۆرمە.',
      addedNote: 'کۆپییەکانی زیادکراو بۆ تۆماربووانی نوێ لەم تاقیکردنەوەیە بەردەست دەبن.',
      namePh: 'ونە: لیستی دووربەستنی ٢٠٢٦',
      addedMsg: '{name} زیادکرا بۆ قاڵبەکانی پلاتفۆرم.',
      removedMsg: '{name} لە قاڵبەکانی پلاتفۆرمەوە لابرا.',
    },
    team: {
      superAdminNote:
        'سوپەر ئەدمینەکان هەمیشە هەموو بەشەکان بینن — مۆڵەتەکانی خوارەوە تەنها ئەدمینەکان سنوور دەدەن.',
      permissionsFor: 'دەستگەیشتن بۆ {name}',
      namePh: 'ونە: ڕانیا عەزیز',
      emailPh: 'ونە: rania@menucraft.demo',
      addedMsg: '{name} پیوستی بۆ تیمی پلاتفۆرم بوو.',
      permissionsSaved: 'مۆڵەتی {name} نوێکرایەوە.',
    },
    payments: {
      fee: 'باج',
      connectedClients: 'چایەخانە پەیوەستکراوەکان',
      noneConnected: 'هیچ چایەخانەیەک بەم ڕێگایەوە پەیوەست نەکراوە.',
    },
  },
}

export const platform = { en, ar, ku }
