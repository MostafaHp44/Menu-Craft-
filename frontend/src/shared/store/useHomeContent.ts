import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Lang } from '../i18n'

/**
 * Marketing copy for the public home page (`/`), in EVERY language.
 *
 * The super admin edits it from the admin console → "Home page" tab; every
 * value is free-form marketing copy (not an i18n key — the copy is product
 * content, not UI chrome). The store keeps one full page per supported
 * language (`en` / `ar` / `ku`) and the admin edits the language currently
 * active in the console. All data is simulated and persisted to localStorage
 * only.
 *
 * Conventions understood by `Home.tsx`:
 * - `*text*` inside a title marks the accent span (e.g. "…look *finished*").
 * - `\n` inside the hero title becomes a line break.
 * - an empty string falls back to the same field of the English page, then to
 *   the active language's seed, so the page never breaks.
 */

export interface HomeSection {
  enabled: boolean
  eyebrow?: string
  title: string
  sub?: string
}

export interface HomeContent {
  hero: {
    enabled: boolean
    eyebrow: string
    title: string
    sub: string
    cta: string
    secondaryCta: string
    image: string
    note: string
  }
  templates: HomeSection
  editorShowcase: { enabled: boolean; eyebrow: string; title: string; sub: string; bullets: string[] }
  workflow: {
    enabled: boolean
    eyebrow: string
    title: string
    sub: string
    steps: { title: string; body: string }[]
  }
  highlights: { enabled: boolean; items: { title: string; body: string }[] }
  showcase: HomeSection
  pricing: HomeSection & { note: string }
  finalCta: { enabled: boolean; title: string; sub: string; cta: string }
}

/** the same home page in every supported language — explicit keys, not a free Record */
export interface HomeContentByLang {
  en: HomeContent
  ar: HomeContent
  ku: HomeContent
}

export type HomeSectionKey = keyof HomeContent

/**
 * The original MenuCraft home-page copy, per language.
 * English is the original seed verbatim; Arabic and Kurdish are full
 * translations of every string. This is the first-load content and the
 * fallback for anything left empty.
 */
const SEED_EN: HomeContent = {
  hero: {
    enabled: true,
    eyebrow: 'The digital menu builder for food businesses',
    title: 'Your Restaurant Menu.\nYour Brand. *Your Rules.*',
    sub: 'Create a beautiful digital menu for your restaurant, cafe, or bakery. Choose your design, customize every detail, and share your menu with the world — no coding required.',
    cta: 'Explore Templates',
    secondaryCta: 'Explore the Editor',
    // the hero uses the live restaurant preview as its visual — no photo today
    image: '',
    note: 'A real MenuCraft preview — the same renderer that powers the editor and the published site.',
  },
  templates: {
    enabled: true,
    eyebrow: 'Template marketplace',
    title: 'Designs that already look *finished*',
    sub: 'Every template is a complete restaurant website: its own typography, palette, header, hero and menu style. Start from one, then change anything.',
  },
  editorShowcase: {
    enabled: true,
    eyebrow: 'The visual editor',
    title: 'Change it and watch it happen.',
    sub: 'Colors, fonts, layout, menu content — every control in the MenuCraft editor writes to the live preview as you type. No preview button, no page reload, no guessing.',
    bullets: [],
  },
  workflow: {
    enabled: true,
    eyebrow: 'How it works',
    title: 'Three steps from idea to live menu',
    sub: 'The whole journey is designed to take minutes — and it is fully interactive in this demo.',
    steps: [
      {
        title: 'Choose',
        body: 'Browse eight complete restaurant designs and preview each one as a real, scrollable website.',
      },
      {
        title: 'Customize',
        body: 'Rename the restaurant, recolor, switch fonts, rework the menu — everything updates live.',
      },
      {
        title: 'Publish',
        body: 'Save your demo, open the mobile-friendly site and generate the QR code for your tables.',
      },
    ],
  },
  highlights: {
    enabled: true,
    items: [
      {
        title: 'Branding',
        body: 'Name, logo, tagline, hero photography, contact details and opening hours — all editable, all live.',
      },
      {
        title: 'Typography',
        body: 'Six curated families for headings, body and menu items, with size, weight and leading controls.',
      },
      {
        title: 'Menu management',
        body: 'Categories, items, prices, promotional pricing, availability, featured dishes and drag-free reordering.',
      },
      {
        title: 'QR codes',
        body: 'A real, scannable QR code for every menu — downloadable and print-ready for tables and windows.',
      },
      {
        title: 'Mobile-friendly',
        body: 'Every template is built responsive-first, so the menu reads perfectly on a phone at the table.',
      },
    ],
  },
  showcase: {
    enabled: true,
    eyebrow: 'Responsive by default',
    title: 'One menu. Every screen.',
    sub: 'Guests open your menu on the phone in their hand. MenuCraft templates reflow for desktop, tablet and mobile without a single extra setting — preview both sizes side by side before you publish.',
  },
  pricing: {
    enabled: true,
    eyebrow: 'Pricing',
    title: 'Simple plans, *demo pricing*',
    sub: 'These prices are illustrative only. This prototype processes no payments and provisions no real hosting.',
    note: 'Every button in this prototype leads somewhere — plans simply open the demo editor.',
  },
  finalCta: {
    enabled: true,
    title: 'Your menu deserves better than a PDF.',
    sub: 'Pick a template, change the restaurant name, edit a price, swap the font — in under two minutes you will have a menu worth sharing.',
    cta: 'Explore Templates',
  },
}

const SEED_AR: HomeContent = {
  hero: {
    enabled: true,
    eyebrow: 'منشئ القوائم الرقمية لأعمال المطاعم',
    title: 'قائمة مطعمك.\nعلامتك التجارية. *شروطك أنت.*',
    sub: 'أنشئ قائمة رقمية جميلة لمطعمك أو مقهاك أو مخبزك. اختر تصميمك، وخصّص كل تفصيلة، وشارك قائمتك مع العالم — دون أي برمجة.',
    cta: 'تصفّح القوالب',
    secondaryCta: 'تصفّح المحرّر',
    image: '',
    note: 'معاينة حقيقية من MenuCraft — نفس المحرّك الذي يعمل عليه المحرّر والموقع المنشور.',
  },
  templates: {
    enabled: true,
    eyebrow: 'سوق القوالب',
    title: 'تصاميم تبدو *مهيّأة* بالفعل',
    sub: 'كل قالب موقع مطعم كامل: خطّه الطباعي ولوحاته اللونيّة وترويسته وواجهته ونمط قائمته. ابدأ من قالب واحد، ثم غيّر ما تشاء.',
  },
  editorShowcase: {
    enabled: true,
    eyebrow: 'المحرّر المرئي',
    title: 'غيّرها وشاهد ما يحدث مباشرة.',
    sub: 'الألوان والخطوط والتخطيط ومحتوى القائمة — كل عنصر تحكّم في محرّر MenuCraft يُطبَّق على المعاينة الحيّة أثناء الكتابة. لا زرّ معاينة، ولا إعادة تحميل، ولا تخمين.',
    bullets: [],
  },
  workflow: {
    enabled: true,
    eyebrow: 'كيف يعمل',
    title: 'ثلاث خطوات من الفكرة إلى القائمة الحيّة',
    sub: 'رحلة كاملة صُمِّمت لتأخذ دقائق — وهي تفاعلية بالكامل في هذا العرض.',
    steps: [
      {
        title: 'اختر',
        body: 'تصفّح ثمانية تصاميم مطاعم كاملة، وعاين كل واحد منها كموقع حقيقي يمكنك التصفّح فيه.',
      },
      {
        title: 'خصّص',
        body: 'غيّر اسم المطعم، وأعد التلوين، وبدّل الخطوط، وأعد تنسيق القائمة — كل شيء يتحدّث مباشرة.',
      },
      {
        title: 'انشر',
        body: 'احفظ عرضك التجريبي، وافتح الموقع المتوافق مع الجوال، وأنشئ رمز QR لطاولاتك.',
      },
    ],
  },
  highlights: {
    enabled: true,
    items: [
      {
        title: 'الهوية',
        body: 'الاسم والشعار والشعار النصي وصور الواجهة وبيانات التواصل وساعات العمل — كلها قابلة للتعديل، وكلها مباشر.',
      },
      {
        title: 'الخطوط',
        body: 'ست عائلات خطّية منتقاة للعناوين والنصوص وأصناف القائمة، مع تحكّم بالحجم والوزن وتباعد الأسطر.',
      },
      {
        title: 'إدارة القائمة',
        body: 'التصنيفات والأصناف والأسعار والتسعير الترويجي وحالة التوفّر والأطباق المميزة وإعادة الترتيب بلا سحب.',
      },
      {
        title: 'رموز QR',
        body: 'رمز QR حقيقي قابل للمسح لكل قائمة — قابل للتنزيل وجاهز للطباعة للطاولات والواجهات.',
      },
      {
        title: 'متوافق مع الجوال',
        body: 'كل قالب مبنيّ بالتوافق الجوال أولاً، لتُقرأ القائمة بإتقان على الهاتف فوق الطاولة.',
      },
    ],
  },
  showcase: {
    enabled: true,
    eyebrow: 'متجاوب افتراضياً',
    title: 'قائمة واحدة. كل شاشة.',
    sub: 'يفتح ضيوفك قائمتهم على الهاتف الذي في أيديهم. قوالب MenuCraft تتموضع مجدداً للحاسوب واللوح والجوال دون أي إعداد إضافي — عاين الحجمين جنباً إلى جنب قبل النشر.',
  },
  pricing: {
    enabled: true,
    eyebrow: 'الأسعار',
    title: 'خطط بسيطة، *أسعار تجريبية*',
    sub: 'هذه الأسعار توضيحية فقط. لا تعالج هذه النسخة أي مدفوعات ولا توفّر أي استضافة حقيقية.',
    note: 'كل زرّ في هذه النسخة يقود إلى وجهة — والخطط ببساطة تفتح المحرّر التجريبي.',
  },
  finalCta: {
    enabled: true,
    title: 'قائمتك تستحق أكثر من ملف PDF.',
    sub: 'اختر قالباً، وغيّر اسم المطعم، وعدّل سعراً، وبدّل الخط — في أقل من دقيقتين ستحصل على قائمة تستحق المشاركة.',
    cta: 'تصفّح القوالب',
  },
}

const SEED_KU: HomeContent = {
  hero: {
    enabled: true,
    eyebrow: 'دروستکەری لیستی دیجیتاڵی بۆ کارەکانی خواردن',
    title: 'لیستی چایەخانەکەت.\nناونیشانەکەت. *ڕێکەکانی تۆ.*',
    sub: 'لیستێکی دیجیتاڵی جوان دروست بکە بۆ چایەخانەکەت، قاوەخانەکەت یان نانکەکەت. دیزاینەکەت هەڵبژێر، هەموو وردەکارییەکان بگۆڕە، و لیستەکەت لەگەڵ جیهان هاوبەش بکە — بەبێ هیچ کۆدنووسینەوە.',
    cta: 'قاڵبەکان بگەڕێ بەدوایدا',
    secondaryCta: 'دەستکارکەرەکە بگەڕێ بەدوایدا',
    image: '',
    note: 'پێشبینینێکی ڕاستەقینەی MenuCraft — هەمان موتۆرەکەی دەستکارکەر و ماڵپەڕی بڵاوکراوەوە.',
  },
  templates: {
    enabled: true,
    eyebrow: 'بازاڕی قاڵبەکان',
    title: 'دیزاینەکانی *تەواو* دیاری دەکەن',
    sub: 'هەر قاڵبێک ماڵپەڕێکی تەواوی چایەخانەیە: ئەلفوبێی خۆی، ڕەنگەکانی، سەردێڕی، سەرەتا و شێوازی لیستەکەی. لە قاڵبێکوو دەست پێ بکە، پاشان هەرچیت دەوێت بگۆڕە.',
  },
  editorShowcase: {
    enabled: true,
    eyebrow: 'دەستکارکەری بینینی',
    title: 'بیگۆڕە و ببینە چۆن ڕاستەوخۆ دەکرێتەوە.',
    sub: 'ڕەنگەکان، فۆنتەکان، شێوازی جێگیرکردن، ناوەڕۆکی لیستە — هەموو کۆنترۆلێک لە دەستکارکەری MenuCraft ڕاستەوخۆ لەسەر پێشبینینی ڕاستە دەنووسرێت کاتێک دەنووسیت. نییە دوگمەی پێشبینین، نییە بارکردنەوەی لاپەڕە، نییە خەمڵاندن.',
    bullets: [],
  },
  workflow: {
    enabled: true,
    eyebrow: 'چۆن کار دەکات',
    title: 'سێ هەنگاو لە بیرۆکەوە تا لیستی ڕاستە',
    sub: 'گەشتەکەی تەواو بۆ چەند خولەکێک دروستکراوە — و لەم تاقیکردنەوەیە بە تەواوی تێکەڵەکارە.',
    steps: [
      {
        title: 'هەڵبژێر',
        body: 'هەشتا دیزاینی تەواوی چایەخانە بگەڕێ بەدوایدا و هەر یەکەی وەک ماڵپەڕێکی ڕاستەقینە ببینە کە بتوانیت بە ئاسایی بگەڕێیت بەدوایدا.',
      },
      {
        title: 'دەستکاری بکە',
        body: 'ناوی چایەخانەکە بگۆڕە، ڕەنگەکان بگۆڕە، فۆنتەکان بگۆڕە، لیستەکە دەستکاری بکە — هەموو شتێک ڕاستەوخۆ نوێ دەکرێتەوە.',
      },
      {
        title: 'بڵاو بکەرەوە',
        body: 'تاقیکردنەوەکەت پاشەکەوت بکە، ماڵپەڕی مۆبایلپەسەند بکەرەوە، و کۆدی QR بۆ مێزەکان دروست بکە.',
      },
    ],
  },
  highlights: {
    enabled: true,
    items: [
      {
        title: 'ناونیشان',
        body: 'ناو، لوگۆ، شیعار، وێنەی سەرەتا، وردەکاری پەیوەستی و کاتی کردنەوە — هەموویان دەستکاری دەکرێن، هەموویان ڕاستەن.',
      },
      {
        title: 'فۆنتەکان',
        body: 'شەش خێزانی فۆنتی هەڵبژێردراو بۆ سەردێڕەکان، دەق و شتەکانی لیستە، لەگەڵ کۆنترۆلی قەبارە، قورسی و نێوان دەقەکان.',
      },
      {
        title: 'بەڕێوەبردنی لیستە',
        body: 'پۆلەکان، شتەکان، نرخەکان، نرخی ڕیکلامی، بەردەستبوون، خواردنە تایبەتەکان و ڕیزکردنەوە بەبێ ڕەشکاندن.',
      },
      {
        title: 'کۆدەکانی QR',
        body: 'کۆدی QRی ڕاستەقینە و سکانکردنی بۆ هەر لیستێک — دادەبەزێنرێت و ئامادەیە بۆ چاپکردن بۆ مێز و جیڵەکان.',
      },
      {
        title: 'مۆبایلپەسەند',
        body: 'هەر قاڵبێک لە سەرەوە بۆ مۆبایل دروستکراوە، بۆیە لیستەکە لەسەر مۆبایل، لەسەر مێز، بە تەواوی دەخوێنرێتەوە.',
      },
    ],
  },
  showcase: {
    enabled: true,
    eyebrow: 'بە شێوەی بنەڕەت وەشانکراوە',
    title: 'لیستێکی یەک. هەموو شاشەیەک.',
    sub: 'میوانەکان لیستەکەت لەسەر مۆبایلەکەیان کردنەوە. قاڵبەکانی MenuCraft بۆ کۆمپیوتەر، تابلێت و مۆبایل ڕێک دەخورن بەبێ هیچ ڕێکخستنێکی زیادە — پێش بڵاوکردنەوە هەردوو قەبارە لە ڕێگایەکەوە ببینە.',
  },
  pricing: {
    enabled: true,
    eyebrow: 'نرخەکان',
    title: 'پلانە سادەکان، *نرخی تاقیکراو*',
    sub: 'ئەم نرخانی تەنها وەک نموونەن. ئەم پێشکەشکردنەیە هیچ پارەدانێک ناگرێتەوە و هیچ میزبانییەکی ڕاستەقینە دەست ناداتەوە.',
    note: 'هەر دوگمەیەک لەم پێشکەشکردنەوە بۆ شتێک دەبات — پلانەکان تەنها دەستکارکەری تاقیکراو دەکردنەوە.',
  },
  finalCta: {
    enabled: true,
    title: 'لیستەکەت شایانی شتێکی باشترە لە فایلێکی PDF.',
    sub: 'قاڵبێک هەڵبژێر، ناوی چایەخانەکە بگۆڕە، نرخێک دەستکاری بکە، فۆنتەکە بگۆڕە — لە خوارەوە دوو خولەکەکە لیستێکت هەیە کە شایانی هاوبەشکردنە.',
    cta: 'قاڵبەکان بگەڕێ بەدوایدا',
  },
}

export const HOME_SEED: HomeContentByLang = { en: SEED_EN, ar: SEED_AR, ku: SEED_KU }

interface HomeContentState {
  content: HomeContentByLang
  /** last edit timestamp, across every language */
  updatedAt: string
  /** draft-style immutable update of ONE language — bumps `updatedAt` */
  update: (lang: Lang, recipe: (content: HomeContent) => void) => void
  /** restores ONE section of ONE language to that language's `HOME_SEED` */
  resetSection: (lang: Lang, key: HomeSectionKey) => void
  /** restores the whole page, in ALL languages, to `HOME_SEED` */
  resetHome: () => void
}

/** guards against older/partial payloads sitting in localStorage */
function mergeLangWithSeed(lang: Lang, stored: Partial<HomeContent> | undefined): HomeContent {
  const seed = HOME_SEED[lang]
  const partial = stored ?? {}
  return {
    hero: { ...seed.hero, ...partial.hero },
    templates: { ...seed.templates, ...partial.templates },
    editorShowcase: { ...seed.editorShowcase, ...partial.editorShowcase },
    workflow: { ...seed.workflow, ...partial.workflow },
    highlights: { ...seed.highlights, ...partial.highlights },
    showcase: { ...seed.showcase, ...partial.showcase },
    pricing: { ...seed.pricing, ...partial.pricing },
    finalCta: { ...seed.finalCta, ...partial.finalCta },
  }
}

interface NormalizedPersisted {
  content: HomeContentByLang
  updatedAt: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * Understands every payload that can sit under `menucraft-home-v1`:
 * - version 1 (old installs): `{ content: HomeContent }` — ONE flat, possibly
 *   admin-edited English page → becomes `content.en` (edits preserved) while
 *   `ar`/`ku` start from their seeds;
 * - version 2: `{ content: { en, ar, ku }, updatedAt }` → seed-merged per
 *   language so missing sections/fields fall back safely;
 * - empty/unknown → all seeds.
 * Builds only the two known keys, so a stray old payload can never create
 * bogus top-level state.
 */
function normalizePersisted(persisted: unknown): NormalizedPersisted {
  const stored: Record<string, unknown> = isRecord(persisted) ? persisted : {}
  const rawContent = stored.content

  // v1 flat HomeContent under `content` (or, defensively, at the root) —
  // the legacy shape also carried `updatedAt` inside that flat object
  type LegacyFlat = Partial<HomeContent> & { updatedAt?: string }
  const flat: LegacyFlat | null =
    isRecord(rawContent) && isRecord(rawContent.hero) && !isRecord(rawContent.en)
      ? (rawContent as unknown as LegacyFlat)
      : !isRecord(rawContent) && isRecord(stored.hero)
        ? (stored as unknown as LegacyFlat)
        : null

  if (flat) {
    return {
      content: {
        en: mergeLangWithSeed('en', flat),
        ar: structuredClone(HOME_SEED.ar),
        ku: structuredClone(HOME_SEED.ku),
      },
      updatedAt: typeof flat.updatedAt === 'string' ? flat.updatedAt : '',
    }
  }

  const langOf = (value: unknown, lang: Lang): HomeContent =>
    mergeLangWithSeed(lang, isRecord(value) ? (value as unknown as Partial<HomeContent>) : undefined)

  const perLang = isRecord(rawContent) ? rawContent : {}
  return {
    content: {
      en: langOf(perLang.en, 'en'),
      ar: langOf(perLang.ar, 'ar'),
      ku: langOf(perLang.ku, 'ku'),
    },
    updatedAt: typeof stored.updatedAt === 'string' ? stored.updatedAt : '',
  }
}

export const useHomeContentStore = create<HomeContentState>()(
  persist(
    (set) => ({
      content: structuredClone(HOME_SEED),
      updatedAt: '',

      update: (lang, recipe) =>
        set((state) => {
          const next = structuredClone(state.content[lang])
          recipe(next)
          const content: HomeContentByLang = { ...state.content }
          content[lang] = next
          return { content, updatedAt: new Date().toISOString() }
        }),

      resetSection: (lang, key) =>
        set((state) => {
          const next = structuredClone(state.content[lang])
          Object.assign(next, { [key]: structuredClone(HOME_SEED[lang][key]) })
          const content: HomeContentByLang = { ...state.content }
          content[lang] = next
          return { content, updatedAt: new Date().toISOString() }
        }),

      resetHome: () =>
        set({ content: structuredClone(HOME_SEED), updatedAt: new Date().toISOString() }),
    }),
    {
      name: 'menucraft-home-v1',
      version: 2,
      partialize: (state) => ({ content: state.content, updatedAt: state.updatedAt }),
      // v1 → v2: the old flat English page becomes `content.en`, edits preserved
      migrate: (persisted) => normalizePersisted(persisted),
      // also shape-safe for same-version payloads with missing fields
      merge: (persisted, current) => ({
        ...current,
        ...normalizePersisted(persisted),
      }),
    }
  )
)

/** selector hook — one language's copy; re-renders whenever it changes */
export function useHomeContent(lang: Lang): HomeContent {
  return useHomeContentStore((state) => state.content[lang])
}

/** all three languages — the public page falls back from the active language to English */
export function useHomeContentByLang(): HomeContentByLang {
  return useHomeContentStore((state) => state.content)
}
