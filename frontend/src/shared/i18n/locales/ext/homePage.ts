/**
 * i18n extension owned by the **home page content** agent (public Home.tsx chrome).
 * Merged into the main dictionaries by `src/shared/i18n/index.tsx` — do not import elsewhere.
 *
 * Rules: keep `ar` and `ku` typed as `Deep<typeof en>` so every key exists in all
 * three languages, and only add keys under your own top-level group `home`.
 *
 * These keys cover the STATIC chrome of the public home page. The editable
 * marketing copy (hero text, section titles, pricing note, …) lives in the
 * `useHomeContent` store, one language per entry.
 */
type Deep<T> = { [K in keyof T]: T[K] extends string ? string : Deep<T[K]> }

const en = {
  home: {
    hero: {
      bulletNoCoding: 'No coding required',
      bulletTemplates: '{count} designer templates',
      bulletPublish: 'Publish in minutes',
      viewsLabel: 'Menu views',
      qrTitle: 'Table QR ready',
      scans: '{count} scans',
      liveBadge: 'Live demo',
    },
    templates: {
      previewChip: 'Preview template',
      preview: 'Preview',
      customize: 'Customize',
      browseAll: 'Browse all {count} templates',
      previewAlt: '{name} preview',
    },
    editor: {
      palette: 'Palette',
      headingFont: 'Heading font',
      layout: 'Menu layout',
      grid: 'Grid menu',
      list: 'List menu',
      openEditor: 'Open the full editor',
      seeAll: 'See all templates',
      liveBadge: 'Live preview',
      appliedNote: 'Applied instantly — same controls as the real editor',
    },
    workflow: {
      browseTemplates: 'Browse templates',
      tryEditor: 'Try the editor',
      seePublished: 'See a published site',
      learnMore: 'Learn more',
      startWith: 'Start with {name}',
    },
    highlights: {
      eyebrow: 'Everything included',
      title: 'The details that make it feel premium',
      sub: 'Not a page builder with food plugins — a focused system for how restaurants actually present food.',
      scansTo: 'Scans straight to',
      mobileFirst: 'Phone-first layouts,\ntested from 320px up.',
    },
    showcase: {
      desktop: 'Desktop',
      desktopCopy: 'Wide layouts, editorial heroes, three-column menus.',
      mobile: 'Mobile',
      mobileCopy: 'Touch-friendly tabs, stacked cards, readable prices.',
      table: 'At the table',
      tableCopy: 'Scan-to-menu in one tap, no app install.',
      openMenu: 'Open the published menu',
      liveBadge: 'Live',
      phoneLabel: 'Mobile · {px}',
    },
    pricing: {
      demoBadge: 'DEMO PRICING — no real charges',
      mostPopular: 'Most popular',
      free: 'Free',
      forever: 'forever',
      perMonth: '/ month',
      startFree: 'Start free demo',
      choosePlan: 'Choose {name}',
    },
    finalCta: {
      eyebrow: 'Ready when you are',
      secondary: 'Explore the Editor',
      noCard: 'No credit card',
      noCode: 'No code',
      demoOnly: 'Demo data only',
    },
  },
}

const ar: Deep<typeof en> = {
  home: {
    hero: {
      bulletNoCoding: 'بدون أي برمجة',
      bulletTemplates: '{count} قوالب مصمّمة',
      bulletPublish: 'انشر خلال دقائق',
      viewsLabel: 'مشاهدات القائمة',
      qrTitle: 'رمز QR للطاولة جاهز',
      scans: '{count} مسح',
      liveBadge: 'عرض حيّ',
    },
    templates: {
      previewChip: 'معاينة القالب',
      preview: 'معاينة',
      customize: 'خصّص',
      browseAll: 'تصفّح القوالب الـ{count} كلها',
      previewAlt: 'معاينة {name}',
    },
    editor: {
      palette: 'لوحة الألوان',
      headingFont: 'خط العناوين',
      layout: 'تخطيط القائمة',
      grid: 'عرض شبكيّ',
      list: 'عرض قائمة',
      openEditor: 'افتح المحرّر الكامل',
      seeAll: 'شاهد كل القوالب',
      liveBadge: 'معاينة حيّة',
      appliedNote: 'يُطبَّق فوراً — نفس عناصر التحكّم في المحرّر الحقيقي',
    },
    workflow: {
      browseTemplates: 'تصفّح القوالب',
      tryEditor: 'جرّب المحرّر',
      seePublished: 'شاهد موقعاً منشوراً',
      learnMore: 'اعرف المزيد',
      startWith: 'ابدأ بـ{name}',
    },
    highlights: {
      eyebrow: 'كل ما تحتاجه',
      title: 'التفاصيل التي تمنح إحساساً فاخراً',
      sub: 'لست أداة بناء صفحات بإضافات طعام — بل نظام متكامل لطريقة تقديم المطاعم للأكل فعلاً.',
      scansTo: 'مسح مباشر إلى',
      mobileFirst: 'تصاميم تبدأ بالجوال،\nمختبرة من 320px فما فوق.',
    },
    showcase: {
      desktop: 'سطح المكتب',
      desktopCopy: 'تصاميم واسعة، واجهات تحريرية، وقوائم بثلاثة أعمدة.',
      mobile: 'الجوال',
      mobileCopy: 'ألسنة مريحة لللمس، بطاقات متراصّة، وأسعار واضحة.',
      table: 'على الطاولة',
      tableCopy: 'مسح يفتح القائمة بضغطة واحدة، بلا تحميل تطبيق.',
      openMenu: 'افتح القائمة المنشورة',
      liveBadge: 'حيّ',
      phoneLabel: 'الجوال · {px}',
    },
    pricing: {
      demoBadge: 'أسعار تجريبية — لا توجد رسوم حقيقية',
      mostPopular: 'الأكثر شيوعاً',
      free: 'مجاني',
      forever: 'للأبد',
      perMonth: 'شهرياً',
      startFree: 'ابدأ عرضاً مجانياً',
      choosePlan: 'اختر خطة {name}',
    },
    finalCta: {
      eyebrow: 'جاهز عندما تكون مستعداً',
      secondary: 'تصفّح المحرّر',
      noCard: 'بدون بطاقة ائتمان',
      noCode: 'بدون برمجة',
      demoOnly: 'بيانات تجريبية فقط',
    },
  },
}

const ku: Deep<typeof en> = {
  home: {
    hero: {
      bulletNoCoding: 'بەبێ کۆدنووسی',
      bulletTemplates: '{count} قاڵبی دیزاینکراو',
      bulletPublish: 'لە چەند خولەکدا بڵاو بکەرەوە',
      viewsLabel: 'بینینەکانی لیستە',
      qrTitle: 'کۆدی QRی مێز ئامادەیە',
      scans: '{count} سکان',
      liveBadge: 'تاقیکردنەوەی ڕاستە',
    },
    templates: {
      previewChip: 'پێشبینینی قاڵبەکە',
      preview: 'پێشبینین',
      customize: 'دەستکاری بکە',
      browseAll: 'هەموو {count} قاڵب ببینە',
      previewAlt: 'پێشبینینی {name}',
    },
    editor: {
      palette: 'ڕەنگەکان',
      headingFont: 'فۆنتی سەردێڕ',
      layout: 'شێوازی لیستە',
      grid: 'شێوازی توری',
      list: 'شێوازی لیست',
      openEditor: 'دەستکارکەری تەواو بکەرەوە',
      seeAll: 'هەموو قاڵبەکان ببینە',
      liveBadge: 'پێشبینینی ڕاستە',
      appliedNote: 'ڕاستەوخۆ جێ دەکرێتەوە — هەمان کۆنترۆلەکانی دەستکارکەری ڕاستەقینە',
    },
    workflow: {
      browseTemplates: 'قاڵبەکان بگەڕێ بەدوایدا',
      tryEditor: 'دەستکارکەر تاقی بکەرەوە',
      seePublished: 'ماڵپەڕێکی بڵاوکراوەوە ببینە',
      learnMore: 'زیاتر بزانە',
      startWith: 'لەگەڵ {name} دەست پێ بکە',
    },
    highlights: {
      eyebrow: 'هەموو ئەو شتەی پێویستت',
      title: 'وردەکارییەکانی ئەم هەستی باشە',
      sub: 'ئەمە ئامرازێکی دروستکردنی لاپەڕە نییە بە زیادکردنی خواردن — بل سیستێمێکی تەواوە بۆ شێوازی پێشکەشکردنی خواردن لە چایەخانەکاندا.',
      scansTo: 'سکانکردن ڕاستەوخۆ بۆ',
      mobileFirst: 'شێوازییەکەم بۆ مۆبایل،\nتاقیکراوە لە 320px و سەروو.',
    },
    showcase: {
      desktop: 'کۆمپیوتەر',
      desktopCopy: 'شێوازی فراو، سەرەتای دەقنووسی، و لیستی سێستونی.',
      mobile: 'مۆبایل',
      mobileCopy: 'زمانە مۆبایلپەسەند، کارتی کۆکراوە، و نرخی خوێندنەوەکردن.',
      table: 'لەسەر مێز',
      tableCopy: 'بە یەک جێکردنەوە لیستەکە دەکرێتەوە، بەبێ دادەبارتنی ئەپێک.',
      openMenu: 'لیستی بڵاوکراوەوە بکەرەوە',
      liveBadge: 'ڕاستە',
      phoneLabel: 'مۆبایل · {px}',
    },
    pricing: {
      demoBadge: 'نرخی تاقیکراو — هیچ باجی ڕاستەقینە نییە',
      mostPopular: 'باشترین هەڵبژاردە',
      free: 'بەخۆڕایی',
      forever: 'بۆ هەمیشە',
      perMonth: 'ژێ مانگێک',
      startFree: 'بەخۆڕایی دەست پێ بکە',
      choosePlan: 'پلانی {name} هەڵبژێر',
    },
    finalCta: {
      eyebrow: 'ئامادەیە کاتێک تۆ ئامادەیت',
      secondary: 'دەستکارکەرەکە بگەڕێ بەدوایدا',
      noCard: 'بەبێ کارتی بانکی',
      noCode: 'بەبێ کۆد',
      demoOnly: 'تەنها داتای تاقیکراو',
    },
  },
}

export const homePage = { en, ar, ku }
