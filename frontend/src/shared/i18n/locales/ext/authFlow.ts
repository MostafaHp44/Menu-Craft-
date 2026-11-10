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
    signInLead: 'Welcome back — sign in with the email and password of your restaurant account.',
    signUpLead: 'Create your account in seconds — everything you have already designed comes with you.',
    draftBecomesSite: 'Your current draft becomes your site — nothing you typed is lost.',
    validEmail: 'Enter a valid email address to continue.',
    nameRequired: 'Enter your full name (2 characters or more).',
    restaurantRequired: 'Enter your restaurant name (2 characters or more).',
    suspended: 'This account is suspended. Try another email or contact the platform team.',
    openingWorkspace: 'Opening workspace…',
    creatingAccount: 'Creating your account…',
    browseFirst: 'Browse the templates first',
    adminLink: 'Platform admin',
    prototypeNote: 'Accounts are stored on the Digital Menu server — sign in with the credentials you registered.',

    /* ------------------------------ passwords ----------------------------- */
    passwordPh: 'At least 6 characters',
    passwordRequired: 'Enter your password to continue.',
    passwordMin: 'Use at least 6 characters for your password.',
    emailTaken: 'This email is already registered — sign in instead.',
    signUpFailed: 'Could not create the account. Please try again.',
    networkError: 'Could not reach the server — check your internet connection and try again.',
    serverError: 'Something went wrong on our side. Please try again in a moment.',
    signedInNotice: 'You are already signed in — taking you to your dashboard.',
    tooManyAttempts: 'Too many attempts in a short time. Wait a few minutes and try again.',
    subscribeFailed: 'Could not complete the subscription. Please try again.',
    wrongPassword: 'That password does not match this account. Try again.',
    noPasswordSet: 'This email has no password set yet. Create a new account or contact your platform administrator.',
    passwordsDontMatch: 'The two passwords do not match.',
    confirmPassword: 'Confirm password',
    showPassword: 'Show password',
    hidePassword: 'Hide password',

    /* --------------------------- forgot password -------------------------- */
    forgotEyebrow: 'Password recovery',
    forgotTitle: 'Reset your password',
    recoveryUnavailable:
      'Password reset is not available in this version. Contact your platform administrator to restore access.',
    backToSignIn: 'Back to sign in',

    asideTitle: 'One workspace for every menu you serve.',
    asideLead:
      'Three restaurant configurations, a full visual editor, print-ready QR codes and kitchen analytics — all in your browser.',
    asideDesign: 'Design studio',
    asideMenu: 'Menu CRUD',
    asideQr: 'QR generator',
    asideAnalytics: 'Kitchen analytics',
    asideFoot: 'Photography bundled locally · menus are served from your restaurant account.',

    /* ----------------------------- publish gating ------------------------- */
    gateTitle: 'Almost ready to publish',
    gateSub: 'Publishing needs a free Digital Menu account — your current draft becomes the site behind it.',
    gateCta: 'Create account & publish',
    publishNeedsPlan: 'Publishing and the public menu need an active subscription.',
    expiredNotice:
      'Your subscription ended — publishing is paused and your public menu is offline until you renew.',
    cancelledNotice:
      'Your subscription was cancelled by the platform admin — publishing is paused and your public menu is offline until reactivated.',
    pastDueNotice:
      'Your subscription payment is past due — publishing is paused and your public menu is offline until payment is completed.',

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
    backToMenuCraft: 'Back to Digital Menu',
  },
}

const ar: Deep<typeof en> = {
  flow: {
    backHome: 'العودة إلى الرئيسية',
    modeLabel: 'وضع الحساب',
    signInTab: 'تسجيل الدخول',
    signUpTab: 'إنشاء حساب',
    signInLead: 'مرحباً بعودتك — سجّل الدخول ببريد حساب مطعمك وكلمة المرور.',
    signUpLead: 'أنشئ حسابك في ثوانٍ — كل ما صمّمته حتى الآن ينتقل معك.',
    draftBecomesSite: 'مسودتك الحالية تصبح موقعك — لن يضيع أي شيء كتبته.',
    validEmail: 'أدخل عنوان بريد إلكتروني صحيحاً للمتابعة.',
    nameRequired: 'أدخل اسمك الكامل (حرفان على الأقل).',
    restaurantRequired: 'أدخل اسم المطعم (حرفان على الأقل).',
    suspended: 'هذا الحساب موقوف. جرّب بريداً آخر أو تواصل مع فريق المنصة.',
    openingWorkspace: 'جارٍ فتح مساحة العمل…',
    creatingAccount: 'جارٍ إنشاء حسابك…',
    browseFirst: 'تصفّح القوالب أولاً',
    adminLink: 'إدارة المنصة',
    prototypeNote: 'تُحفظ الحسابات على خادم Digital Menu — سجّل الدخول بالبيانات التي أنشأت بها الحساب.',

    /* ------------------------------ كلمات المرور ------------------------- */
    passwordPh: '6 أحرف على الأقل',
    passwordRequired: 'أدخل كلمة المرور للمتابعة.',
    passwordMin: 'استخدم 6 أحرف على الأقل لكلمة المرور.',
    emailTaken: 'هذا البريد مسجّل مسبقاً — سجّل الدخول بدلاً من ذلك.',
    signUpFailed: 'تعذّر إنشاء الحساب. حاول مرة أخرى.',
    networkError: 'تعذّر الوصول إلى الخادم — تحقق من اتصالك بالإنترنت وحاول مرة أخرى.',
    serverError: 'حدث خطأ غير متوقع من الخادم — حاول مرة أخرى بعد قليل.',
    signedInNotice: 'أنت مسجّل دخول بالفعل — سيتم تحويلك إلى لوحة التحكم.',
    tooManyAttempts: 'محاولات كثيرة خلال وقت قليل. انتظر دقائق ثم حاول مرة أخرى.',
    subscribeFailed: 'تعذّر إتمام الاشتراك. حاول مرة أخرى.',
    wrongPassword: 'كلمة المرور غير مطابقة لهذا الحساب. حاول مرة أخرى.',
    noPasswordSet: 'لا توجد كلمة مرور لهذا البريد بعد. أنشئ حساباً جديداً أو تواصل مع مسؤول المنصة.',
    passwordsDontMatch: 'كلمتا المرور غير متطابقتين.',
    confirmPassword: 'تأكيد كلمة المرور',
    showPassword: 'إظهار كلمة المرور',
    hidePassword: 'إخفاء كلمة المرور',

    /* --------------------------- استعادة كلمة المرور --------------------- */
    forgotEyebrow: 'استعادة كلمة المرور',
    forgotTitle: 'إعادة تعيين كلمة المرور',
    recoveryUnavailable:
      'إعادة تعيين كلمة المرور غير متاحة في هذا الإصدار. تواصل مع مسؤول المنصة لاستعادة الوصول.',
    backToSignIn: 'العودة إلى تسجيل الدخول',
    asideTitle: 'مساحة عمل واحدة لكل قوائمك.',
    asideLead:
      'ثلاثة إعدادات مستقلة للمطاعم، محرّر مرئي كامل، رموز QR جاهزة للطباعة وتحليلات تجريبية — كلها تعمل محلياً في متصفحك.',
    asideDesign: 'استوديو التصميم',
    asideMenu: 'إدارة القائمة',
    asideQr: 'مولّد رموز QR',
    asideAnalytics: 'تحليلات تجريبية',
    asideFoot: 'الصور مضمّنة محلياً · والقوائم تُقدَّم من حساب مطعمك.',
    gateTitle: 'اقتربت من النشر',
    gateSub: 'النشر يتطلّب حساباً مجانياً في Digital Menu — ومسودتك الحالية تصبح الموقع خلفه.',
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
    cancelledNotice: 'تم إلغاء اشتراكك من قبل مدير المنصة — النشر متوقف وقائمتك العامة غير متاحة حتى إعادة التفعيل.',
    pastDueNotice: 'اشتراكك متأخر في السداد — النشر متوقف وقائمتك العامة غير متاحة حتى إتمام الدفع.',
    backToMenuCraft: 'العودة إلى Digital Menu',
  },
}

const ku: Deep<typeof en> = {
  flow: {
    backHome: 'گەڕانەوە بۆ سەرەتا',
    modeLabel: 'شێوازی هەژمار',
    signInTab: 'چوونەژوورەوە',
    signUpTab: 'دروستکردنی هەژمار',
    signInLead: 'بەخێربێیتەوە — بە ئیمەیل و وشەی نهێنی هەژماری چێشتخانەکەت بچۆ ژوورەوە.',
    signUpLead: 'هەژمارەکەت لە چەند چرکەیەک دروست بکە — هەموو ئەوەی تا ئێستا دروستت کردووە لەگەڵت دەبێت.',
    draftBecomesSite: 'پێشنویسەکەتی ئێستا دەبێتە ماڵپەڕەکەت — هیچ شتێک کەت ناچێتەوە.',
    validEmail: 'ئیمەیلێکی دروست بنووسە بۆ بەردەوامبوون.',
    nameRequired: 'ناوی تەواو بنووسە (کەمەند دوو پیت).',
    restaurantRequired: 'ناوی چایسەرەکە بنووسە (کەمەند دوو پیت).',
    suspended: 'ئەم هەژمارە وەستاوە. ئیمەیلێکی تر تاقی بکەرەوە یان پەیوەندی بکە بە تیمی پلاتفۆرم.',
    openingWorkspace: 'کارهەڵکردنی شوێنی کار…',
    creatingAccount: 'دروستکردنی هەژمارەکەت…',
    browseFirst: 'یەکەم جار وێبگەڕان بکە',
    adminLink: 'بەڕێوەبردنی پلاتفۆرم',
    prototypeNote: 'هەژمارەکان لە سێرڤەری Digital Menu هەڵدەگیرێن — بەو زانیارییانە بچۆ ژوورەوە کە هەژمارەت پێ دروستکردووە.',

    /* ---------------------------- وشە نهێنییەکان ------------------------- */
    passwordPh: 'لەکەمەوە 6 تۆکە',
    passwordRequired: 'وشەی نهێنیت بنووسە بۆ بەردەوامبوون.',
    passwordMin: 'لەکەمەوە 6 تۆکە بۆ وشەی نهێنی بەکاربهێنە.',
    emailTaken: 'ئەم ئیمەیلە پێشتر تۆمارکراوە — لەبری ئەوە چوونەژوورەوە بکە.',
    signUpFailed: 'دروستکردنی هەژمارەکە سەرکەوتوو نەبوو. دووبارە هەوڵ بدە.',
    networkError: 'دەستنراوی سێرڤەر نەبوو — پەیوەندی ئینتەرنێتکەت پشکنین بکە و دووبارە هەوڵ بدە.',
    serverError: 'هەڵەیەکی چاوەڕوان نەکراو لەلایەن سێرڤەرەوە — لەم دوواندا دووبارە هەوڵ بدە.',
    signedInNotice: 'پێشتر چوونەژوورەوەت کردووە — گەیشتنت دەکەین بۆ داشبۆرد.',
    tooManyAttempts: 'هەوڵی زۆر لە کاتی کورتدا. چەند خولێک چاوەڕێ بکە و دووبارە هەوڵ بدە.',
    subscribeFailed: 'تەواوکردنی ئاواژەکە سەرکەوتوو نەبوو. دووبارە هەوڵ بدە.',
    wrongPassword: 'وشەی نهێنی لەگەڵ ئەم هەژمارە ناگونجێت. دووبارە هەوڵ بدە.',
    noPasswordSet: 'هێشتا وشەی نهێنی بۆ ئەم ئیمەیلە دانەنراوە. هەژمارێکی نوێ دروست بکە یان پەیوەندی بکە بە بەڕێوەبەری پلاتفۆرم.',
    passwordsDontMatch: 'دوو وشەی نهێنییەکە نایەکێن.',
    confirmPassword: 'دووپاتکردنەوەی وشەی نهێنی',
    showPassword: 'پیشاندانی وشەی نهێنی',
    hidePassword: 'شاردنەوەی وشەی نهێنی',

    /* -------------------------- گەڕاندنەوەی وشەی نهێنی ------------------ */
    forgotEyebrow: 'گەڕاندنەوەی وشەی نهێنی',
    forgotTitle: 'گۆڕینی وشەی نهێنی',
    recoveryUnavailable:
      'گەڕاندنەوەی وشەی نهێنی لەم وەشانەدا بەردەست نییە. پەیوەندی بکە بە بەڕێوەبەری پلاتفۆرم بۆ گەڕاندنەوەی دەستگەیشتن.',
    backToSignIn: 'گەڕانەوە بۆ چوونەژوورەوە',
    asideTitle: 'شوێنێکی کار بۆ هەموو مینیۆکانت.',
    asideLead:
      'سێ ڕێکخستنی جیاواز بۆ چێشتخانەکان، ڕێکخەرێکی تەواو، کۆدی QR چاپکراو و شیکاری ماڵپەڕ — هەموویان بێ ئینتەرنێت کاردەکەن.',
    asideDesign: 'ستودیۆی دیزاین',
    asideMenu: 'بەڕێوەبردنی مینیۆ',
    asideQr: 'دروستکەری کۆدی QR',
    asideAnalytics: 'شیکاری دیمۆ',
    asideFoot: 'وێنەکان لە ناو ماڵپەڕەکەدا نهۆن — وێبگەڕەکان لە هەژماری چێشتخانەکەت پیشان دەدرێن.',
    gateTitle: 'نزیکی بڵاوکردنەوەیت',
    gateSub: 'بڵاوکردنەوە پێویستی بە هەژمارێکی بەخۆڕایی Digital Menu هەیە — پێشنویسەکەت دەبێتە ماڵپەڕەکەی.',
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
    cancelledNotice: 'ئابونەتەکەت لەلایەن بەڕێوەبەری پلاتفۆرمەوە هەڵوەشایەوە — بڵاوکردنەوە وەستاوە و مینیۆی گشتیت ناچالاکە تا دووبارە چالاک بکرێتەوە.',
    pastDueNotice: 'ئاکامەکەت دویر لە قەرزەکەدا تەواو بووە — بڵاوکردنەوە وەستاوە و مینیۆی گشتیت ناچالاکە تا پارەدان تەواو بکرێت.',
    backToMenuCraft: 'گەڕانەوە بۆ Digital Menu',
  },
}

export const authFlow = { en, ar, ku }
