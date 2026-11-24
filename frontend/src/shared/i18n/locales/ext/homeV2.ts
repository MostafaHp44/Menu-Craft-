/**
 * i18n for the customer's redesigned marketing home (homeV2.*).
 * Keys mirror the sections of features/marketing/Home.tsx.
 */
type Deep<T> = { [K in keyof T]: T[K] extends string ? string : Deep<T[K]> }

const en = {
  homeV2: {
    pill: 'Your restaurant menu, live in minutes',
    titleA: 'Digital Menu',
    primaryCta: 'Explore templates',
    secondaryCta: 'Watch the demo',
    scans: 'QR scans',
    live: 'Live editing',
    priceUpdated: 'Price updated just now',
    preview: 'Preview mode',
    scanToOrder: 'Scan to order',
    templatesEyebrow: 'Pick your look',
    templatesTitle: 'A menu that feels like',
    templatesAccent: 'your restaurant',
    templatesDescription: 'Beautiful, fully editable templates. Choose one, add your dishes and publish your digital menu.',
    useTemplate: 'Use template',
    previewTemplate: 'Preview',
    templateDetails: {
      'kreme-deals': { category: 'Dessert', tagline: 'Doughnuts, deals and sweet combos.', tags: ['Deals', 'Combos', 'Dozen'] },
      'aurum-lounge': { category: 'Fine Dining', tagline: 'Dark, gold and made for chef-led menus.', tags: ['Steak', 'Seafood', 'Gold'] },
      'caffe-brew': { category: 'Coffee', tagline: 'Craft coffee with character.', tags: ['Coffee', 'Cafe', 'Amber'] },
      basta: { category: 'Restaurant', tagline: 'Fresh food, made to crave.', tags: ['Burgers', 'Fast Food', 'Modern'] },
      dabba: { category: 'Restaurant', tagline: 'Real food, made to crave.', tags: ['Burgers', 'Delivery', 'Black'] },
      'the-royal': { tagline: 'A royal table, dressed in gold.' },
      'urban-cafe': { tagline: 'A calm corner for good coffee.' },
    },
    pricingEyebrow: 'Simple pricing',
    pricingTitle: 'Built for',
    pricingAccent: 'every kitchen',
    pricingDescription: 'Start free. Grow when you are ready. No hidden fees, no long contracts.',
    monthly: 'Monthly',
    perMonth: '/ month',
    forever: 'forever',
    mostLoved: 'Most loved',
    choosePlan: 'Choose plan',
    startFree: 'Start for free',
    plans: {
      starter: {
        description: 'For the first digital menu of a small kitchen.',
        features: ['1 restaurant website', 'Up to 15 menu items', 'All templates included', 'QR code generator', 'Deployment domain (demo)'],
      },
      professional: {
        description: 'For restaurants that change the menu often.',
        features: ['Unlimited menu items', 'Full design studio', 'QR scan tracking', 'Remove Digital Menu badge', 'Photo gallery & featured dishes', 'Priority template releases'],
      },
      business: {
        description: 'For groups, franchises and multi-location brands.',
        features: ['Everything in Professional', 'Up to 10 restaurant sites', 'Custom subdomain', 'Shared brand kit', 'Team seats', 'Priority support'],
      },
    },
  },
}

const ar: Deep<typeof en> = {
  homeV2: {
    pill: 'منيو مطعمك جاهز في دقائق',
    titleA: 'Digital Menu',
    primaryCta: 'استكشف القوالب',
    secondaryCta: 'شاهد العرض',
    scans: 'مسح QR',
    live: 'تعديل مباشر',
    priceUpdated: 'تم تحديث السعر الآن',
    preview: 'وضع المعاينة',
    scanToOrder: 'امسح للطلب',
    templatesEyebrow: 'اختر شكلك',
    templatesTitle: 'منيو يحسوك',
    templatesAccent: 'مطعمك',
    templatesDescription: 'قوالب جميلة قابلة للتعديل بالكامل. اختر واحدًا، أضف أطباقك وانشر منيوك الرقمي.',
    useTemplate: 'استخدم القالب',
    previewTemplate: 'معاينة',
    templateDetails: {
      'kreme-deals': { category: 'حلويات', tagline: 'دوناتس وعروض ومجموعات حلوة.', tags: ['عروض', 'مجموعات', 'دزينة'] },
      'aurum-lounge': { category: 'فاخر', tagline: 'داكن وذهبي لقوائم الشيف.', tags: ['لحم', 'مأكولات بحرية', 'ذهبي'] },
      'caffe-brew': { category: 'قهوة', tagline: 'قهوة مصنوعة بشخصية.', tags: ['قهوة', 'كافيه', 'عنبر'] },
      basta: { category: 'مطاعم', tagline: 'أكل حقيقي يخليك تطلب أكتر.', tags: ['برجر', 'وجبات سريعة', 'عصري'] },
      dabba: { category: 'مطاعم', tagline: 'أكل حقيقي، مصنوع عشان يتطلب.', tags: ['برجر', 'توصيل', 'أسود'] },
      'the-royal': { tagline: 'طاولة ملكية بلمسة ذهبية.' },
      'urban-cafe': { tagline: 'زاوية هادية لقهوة حلوة.' },
    },
    pricingEyebrow: 'أسعار بسيطة',
    pricingTitle: 'مبني لكل',
    pricingAccent: 'مطبخ',
    pricingDescription: 'ابدأ مجانًا وكبّر لما تكون جاهز. بدون رسوم مخفية.',
    monthly: 'شهري',
    perMonth: '/ شهر',
    forever: 'مدى الحياة',
    mostLoved: 'الأكثر استخدامًا',
    choosePlan: 'اختر الباقة',
    startFree: 'ابدأ مجانًا',
    plans: {
      starter: {
        description: 'لأول منيو رقمي لمطبخ صغير.',
        features: ['موقع مطعم واحد', 'حتى 15 صنفًا', 'كل القوالب مشمولة', 'مولّد QR', 'نطاق تجريبي'],
      },
      professional: {
        description: 'للمطاعم اللي بتغيّر المنيو كتير.',
        features: ['أصناف غير محدودة', 'استوديو تصميم كامل', 'تتبع مسح QR', 'إزالة شعار Digital Menu', 'معرض صور وأطباق مميزة', 'قوالب جديدة أولًا'],
      },
      business: {
        description: 'للمجموعات والفروع والماركات.',
        features: ['كل مزايا Professional', 'حتى 10 مواقع', 'نطاق فرعي مخصص', 'هوية مشتركة للفروع', 'حسابات فريق', 'دعم ذو أولوية'],
      },
    },
  },
}

const ku: Deep<typeof en> = {
  homeV2: {
    pill: 'مێنۆی چێشتخانەکەت بە خێرایی ئامادەیە',
    titleA: 'Digital Menu',
    primaryCta: 'قوالب ببینە',
    secondaryCta: 'دیمۆ ببینە',
    scans: 'سکانەکانی QR',
    live: 'دەستکاری ڕاستەوخۆ',
    priceUpdated: 'نرخ تازە نوێکراوە',
    preview: 'دۆخی پێشبینین',
    scanToOrder: 'بسکە بۆ داوا',
    templatesEyebrow: 'شێوەی خۆت هەڵبژێرە',
    templatesTitle: 'مێنۆیەک هەست بە',
    templatesAccent: 'چێشتخانەکەت بکات',
    templatesDescription: 'قوالبی جوان و بە تەواوی دەستکاریکراو. یەکێک هەڵبژێرە، خواردنەکانت زیاد بکە و مێنۆکەت بڵاو بکەرەوە.',
    useTemplate: 'قالب بەکاربهێنە',
    previewTemplate: 'پێشبینین',
    templateDetails: {
      'kreme-deals': { category: 'شیرینی', tagline: 'دۆنات و ئۆفەری شیرین.', tags: ['ئۆفەر', 'کۆمەڵ', 'دۆنات'] },
      'aurum-lounge': { category: 'ئاڵتوونی', tagline: 'تاریک و زێڕین بۆ مێنۆی شێف.', tags: ['گۆشت', 'خواردنی دەریا', 'زێڕ'] },
      'caffe-brew': { category: 'قاوه', tagline: 'قاوه بە کەسایەتی.', tags: ['قاوه', 'کافێ', 'کەهرuba'] },
      basta: { category: 'چێشتخانە', tagline: 'خواردنی ڕاستەقینە.', tags: ['برگر', 'خواردنی خێرا', 'مۆدێرن'] },
      dabba: { category: 'چێشتخانە', tagline: 'خواردنی ڕاستەقینە بۆ داوا.', tags: ['برگر', 'گەیاندن', 'ڕەش'] },
      'the-royal': { tagline: 'مێزی شاهانە بە زێڕ.' },
      'urban-cafe': { tagline: 'گۆشەیەکی ئارام بۆ قاوه.' },
    },
    pricingEyebrow: 'نرخی سادە',
    pricingTitle: 'بۆ هەر',
    pricingAccent: 'چێشتخانەیەک',
    pricingDescription: 'بە خۆڕایی دەست پێ بکە. بەبێ نرخی شاراوە.',
    monthly: 'مانگانە',
    perMonth: '/ مانگ',
    forever: 'هەتاهەتایە',
    mostLoved: 'ئەوەی زۆرترین بەکاردێت',
    choosePlan: 'پلان هەڵبژێرە',
    startFree: 'بە خۆڕایی دەست پێ بکە',
    plans: {
      starter: {
        description: 'بۆ یەکەم مێنۆی دیجیتالی چێشتخانەی بچووک.',
        features: ['یەک سایتی چێشتخانە', 'تا 15 بابەت', 'هەموو قوالبەکان', 'دروستکەری QR', 'دۆمەینی تاقیکردنەوە'],
      },
      professional: {
        description: 'بۆ ئەو چێشتخانانەی زۆر مێنۆ دەگۆڕن.',
        features: ['بابەتی بێ سنوور', 'ستودیۆی دیزاینی تەواو', 'شوێنکەوتنی QR', 'لابردنی نیشانەی Digital Menu', 'گالەری وێنە', 'قوالبی نوێ پێشتر'],
      },
      business: {
        description: 'بۆ گرووپ و لق و براندەکان.',
        features: ['هەموو تایبەتمەندییەکانی Professional', 'تا 10 سایت', 'دۆمەینی تایبەت', 'ناسنامەی هاوبەش', 'حسابی تیم', 'پشتگیریی لە پێشینە'],
      },
    },
  },
}

export const homeV2 = { en, ar, ku }
