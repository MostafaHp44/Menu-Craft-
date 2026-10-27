/**
 * i18n extension owned by the **visitor → client → subscriber** agent.
 * Merged into the main dictionaries by `src/shared/i18n/index.tsx` — do not import elsewhere.
 *
 * Rules: keep `ar` and `ku` typed as `Deep<typeof en>` so every key exists in all
 * three languages, and only add keys under your own top-level group `flow`.
 */
type Deep<T> = { [K in keyof T]: T[K] extends string ? string : Deep<T[K]> }

const en = {
  flow: {
    /* --------------------------- sign in / sign up ------------------------ */
    backHome: 'Back home',
    modeLabel: 'Account mode',
    signInTab: 'Sign in',
    signUpTab: 'Create account',
    signInLead: 'Welcome back — this prototype signs you in with a magic link. No password required.',
    signUpLead: 'Create your account in seconds — everything you have already designed comes with you.',
    magicNote: 'Magic link (demo) — enter any email and continue.',
    draftBecomesSite: 'Your current draft becomes your site — nothing you typed is lost.',
    useDemoEmail: 'Use demo email',
    validEmail: 'Enter a valid email address to continue.',
    suspended: 'This account is suspended. Try another email or contact the platform team.',
    openingWorkspace: 'Opening workspace…',
    creatingAccount: 'Creating your account…',
    browseFirst: 'Browse the templates first',
    adminLink: 'Platform admin',
    prototypeNote: 'Prototype · no credentials are stored or transmitted anywhere.',
    asideTitle: 'One workspace for every menu you serve.',
    asideLead:
      'Three independent restaurant configurations, a full visual editor, print-ready QR codes and mock analytics — all running locally in your browser.',
    asideDesign: 'Design studio',
    asideMenu: 'Menu CRUD',
    asideQr: 'QR generator',
    asideAnalytics: 'Demo analytics',
    asideFoot: 'Photography bundled locally · the demo works with no internet connection.',

    /* ----------------------------- publish gating ------------------------- */
    gateTitle: 'Almost ready to publish',
    gateSub: 'Publishing needs a free MenuCraft account — your current draft becomes the site behind it.',
    gateCta: 'Create account & publish',
    publishNeedsPlan: 'Publishing and the public menu need an active subscription.',
    expiredNotice:
      'Your subscription ended — publishing is paused and your public menu is offline until you renew.',

    /* ----------------------------- pricing bubble ------------------------- */
    simulated: 'simulated',
    bubbleFrom: 'Plans from {price}/month',
    bubbleCta: 'Subscribe',

    /* ---------------------------- subscribe modal ------------------------- */
    subTitle: 'Choose a plan for {name}',
    demoNotice: 'No real payment happens here — plans, dates and renewals are simulated.',
    freeForever: 'Free forever',
    accountStepTitle: 'Create your account',
    accountStepSub: 'One quick step — your draft and the chosen plan attach to the new account.',
    accountCta: 'Create account & subscribe',
    subscribedTitle: 'You are subscribed',
    subscribedSub: '{name} is on the {plan} plan. Keep editing, or publish when you are ready.',
    continueEditing: 'Continue editing',

    /* ------------------------------- paused menu -------------------------- */
    pausedTitle: 'This menu is paused',
    pausedSub: 'The subscription for this restaurant ended. Renew it to bring this public menu back online.',
    backToMenuCraft: 'Back to MenuCraft',
  },
}

const ar: Deep<typeof en> = {
  flow: {
    backHome: 'العودة إلى الرئيسية',
    modeLabel: 'وضع الحساب',
    signInTab: 'تسجيل الدخول',
    signUpTab: 'إنشاء حساب',
    signInLead: 'مرحباً بعودتك — يسجّلك هذا النموذج التجريبي برابط سحري، دون حاجة لكلمة مرور.',
    signUpLead: 'أنشئ حسابك في ثوانٍ — كل ما صمّمته حتى الآن ينتقل معك.',
    magicNote: 'رابط سحري (تجريبي) — أدخل أي بريد إلكتروني وتابع.',
    draftBecomesSite: 'مسودتك الحالية تصبح موقعك — لن يضيع أي شيء كتبته.',
    useDemoEmail: 'استخدم بريداً تجريبياً',
    validEmail: 'أدخل عنوان بريد إلكتروني صحيحاً للمتابعة.',
    suspended: 'هذا الحساب موقوف. جرّب بريداً آخر أو تواصل مع فريق المنصة.',
    openingWorkspace: 'جارٍ فتح مساحة العمل…',
    creatingAccount: 'جارٍ إنشاء حسابك…',
    browseFirst: 'تصفّح القوالب أولاً',
    adminLink: 'إدارة المنصة',
    prototypeNote: 'نموذج تجريبي · لا تُخزَّن أي بيانات ولا تُرسَل إلى أي جهة.',
    asideTitle: 'مساحة عمل واحدة لكل قوائمك.',
    asideLead:
      'ثلاثة إعدادات مستقلة للمطاعم، محرّر مرئي كامل، رموز QR جاهزة للطباعة وتحليلات تجريبية — كلها تعمل محلياً في متصفحك.',
    asideDesign: 'استوديو التصميم',
    asideMenu: 'إدارة القائمة',
    asideQr: 'مولّد رموز QR',
    asideAnalytics: 'تحليلات تجريبية',
    asideFoot: 'الصور مضمّنة محلياً · يعمل هذا العرض التجريبي دون إنترنت.',
    gateTitle: 'اقتربت من النشر',
    gateSub: 'النشر يتطلّب حساباً مجانياً في MenuCraft — ومسودتك الحالية تصبح الموقع خلفه.',
    gateCta: 'إنشاء حساب ونشر',
    publishNeedsPlan: 'النشر والقائمة العامة يتطلّبان اشتراكاً فعّالاً.',
    expiredNotice: 'انتهى اشتراكك — النشر متوقّف وقائمتك العامة غير متاحة حتى تجديد الاشتراك.',
    simulated: 'محاكاة',
    bubbleFrom: 'الخطط تبدأ من {price}/شهرياً',
    bubbleCta: 'اشترك',
    subTitle: 'اختر خطة لـ{name}',
    demoNotice: 'لا توجد دفعات حقيقية هنا — الخطط والمواعيد والتجديدات محاكاة تامة.',
    freeForever: 'مجاني للأبد',
    accountStepTitle: 'أنشئ حسابك',
    accountStepSub: 'خطوة واحدة سريعة — تُرفَق مسودتك والخطة المختارة بالحساب الجديد.',
    accountCta: 'إنشاء حساب واشتراك',
    subscribedTitle: 'تم اشتراكك',
    subscribedSub: '{name} الآن على خطة {plan}. يمكنك متابعة التحرير أو النشر حين تُريد.',
    continueEditing: 'متابعة التحرير',
    pausedTitle: 'هذه القائمة متوقفة',
    pausedSub: 'انتهى اشتراك هذا المطعم. جدّده لتعود قائمتك العامة إلى العمل.',
    backToMenuCraft: 'العودة إلى MenuCraft',
  },
}

const ku: Deep<typeof en> = {
  flow: {
    backHome: 'گەڕانەوە بۆ سەرەتا',
    modeLabel: 'شێوازی هەژمار',
    signInTab: 'چوونەژوورەوە',
    signUpTab: 'دروستکردنی هەژمار',
    signInLead: 'بەخێربێیتەوە — ئەم پرۆتوتایپە بە هەڵەبژێردنت بە بەستەرێکی سیحڕ دەچێتە ژوورەوە. پێویستی بە وشەی نهێنی نییە.',
    signUpLead: 'هەژمارەکەت لە چەند چرکەیەک دروست بکە — هەموو ئەوەی تا ئێستا دروستت کردووە لەگەڵت دەبێت.',
    magicNote: 'بەستەری سیحڕ (دیمۆ) — هەر ئیمەیلێک بنووسە و بەردەوام بە.',
    draftBecomesSite: 'پێشنویسەکەتی ئێستا دەبێتە ماڵپەڕەکەت — هیچ شتێک کەت ناچێتەوە.',
    useDemoEmail: 'ئیمەیلێکی دیمۆ بەکاربهێنە',
    validEmail: 'ئیمەیلێکی دروست بنووسە بۆ بەردەوامبوون.',
    suspended: 'ئەم هەژمارە وەستاوە. ئیمەیلێکی تر تاقی بکەرەوە یان پەیوەندی بکە بە تیمی پلاتفۆرم.',
    openingWorkspace: 'کارهەڵکردنی شوێنی کار…',
    creatingAccount: 'دروستکردنی هەژمارەکەت…',
    browseFirst: 'یەکەم جار وێبگەڕان بکە',
    adminLink: 'بەڕێوەبردنی پلاتفۆرم',
    prototypeNote: 'پرۆتوتایپ · هیچ زانیارییەک هەڵناگیرێت یان ناگەیەنرێت بۆ دەرەکی.',
    asideTitle: 'شوێنێکی کار بۆ هەموو مینیۆکانت.',
    asideLead:
      'سێ ڕێکخستنی جیاواز بۆ چێشتخانەکان، ڕێکخەرێکی تەواو، کۆدی QR چاپکراو و شیکارینی دیمۆ — هەموویان لە وێبگەڕەکەتدا کاردەکەن.',
    asideDesign: 'ستودیۆی دیزاین',
    asideMenu: 'بەڕێوەبردنی مینیۆ',
    asideQr: 'دروستکەری کۆدی QR',
    asideAnalytics: 'شیکاری دیمۆ',
    asideFoot: 'وێنەکان لە ناو ماڵپەڕەکەدا نهۆن — ئەم دیمۆیە بێ ئینتەرنێت کاردەکات.',
    gateTitle: 'نزیکی بڵاوکردنەوەیت',
    gateSub: 'بڵاوکردنەوە پێویستی بە هەژمارێکی بەخۆڕایی MenuCraft هەیە — پێشنویسەکەت دەبێتە ماڵپەڕەکەی.',
    gateCta: 'هەژمار دروست بکە و بڵاو بکەرەوە',
    publishNeedsPlan: 'بڵاوکردنەوە و مینیۆی گشتی پێویستیان بە ئاکامێکی چالاک هەیە.',
    expiredNotice: 'ئاکامەکەت تەواو بوو — بڵاوکردنەوە وەستاوە و مینیۆی گشتیت ناچالاکە تا تازەی بیکەیتەوە.',
    simulated: 'سیمولەیشن',
    bubbleFrom: 'پلانەکان لە {price}/مانگانەوە دەست پێدەکەن',
    bubbleCta: 'بژێرە',
    subTitle: 'پلانێک بۆ {name} هەڵبژێرە',
    demoNotice: 'هیچ پارەدانێکی ڕاستی لێرە نییە — پلانەکان، کاتەکان و تازەکردنەوەکان هەموویان سیمولەیشنن.',
    freeForever: 'بەخۆڕایی بۆ هەموو کات',
    accountStepTitle: 'هەژمارەکەت دروست بکە',
    accountStepSub: 'هەنگاوێکی خێرا — پێشنویسەکەت و پلانی هەڵبژێردراو پەیوەندی دەکرێن بە هەژمارە نوێکە.',
    accountCta: 'هەژمار دروست بکە و بژێرە',
    subscribedTitle: 'بژێردنت',
    subscribedSub: '{name} ئێستا لە پلانی {plan}دایە. بەردەوام بە بە دەستکاری، یان هەر کات خوێشت لێ بکەرەوە.',
    continueEditing: 'بەردەوامبوون بە دەستکاری',
    pausedTitle: 'ئەم مینیۆیە وەستاوە',
    pausedSub: 'ئاکامی ئەم چێشتخانەیە تەواو بوو. تازەی بکەرەوە بۆ گەڕاندنەوەی مینیۆی گشتی.',
    backToMenuCraft: 'گەڕانەوە بۆ MenuCraft',
  },
}

export const authFlow = { en, ar, ku }
