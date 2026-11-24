import type {
  ColorSet,
  DesignConfiguration,
  LayoutConfig,
  MenuCategory,
  MenuItem,
  SectionId,
  SectionState,
  TemplateCategory,
  TemplateDefinition,
  TypographyConfig,
} from '../../shared/lib/types.ts'
import { IMG } from '../../shared/lib/images.ts'
import { aurumLoungeDefinition } from '../designs/aurum/data.ts'
import { caffeBrewDefinition } from '../designs/caffe-brew/data.ts'
import { bastaDefinition } from '../designs/basta/data.ts'
import { dabbaDefinition } from '../designs/dabba/data.ts'
import { fastFoodMenuDefinition } from '../designs/fast-food-menu/data.ts'
import { dessertsMenuDefinition } from '../designs/desserts-menu/data.ts'
import { tavernDefinition } from '../designs/tavern/data.ts'

/* ------------------------------------------------------------------ *
 * Design construction helpers â€” every template is assembled from the
 * same building blocks so the renderer stays generic.
 * ------------------------------------------------------------------ */

const BASE: DesignConfiguration = {
  colors: {
    primary: '#1B1714',
    secondary: '#7D7263',
    accent: '#E8571F',
    background: '#FAF7F1',
    text: '#1B1714',
    card: '#FFFFFF',
    button: '#1B1714',
  },
  typography: {
    heading: 'playfair',
    body: 'inter',
    menu: 'inter',
    headingScale: 1,
    bodyScale: 1,
    headingWeight: 600,
    lineHeight: 1.65,
  },
  layout: {
    header: 'split',
    hero: 'editorial',
    menuLayout: 'grid',
    card: 'bordered',
    radius: 14,
    spacing: 1,
    aspect: 'landscape',
    theme: 'light',
  },
  sections: [],
}

const SECTION_ORDER: SectionId[] = ['featured', 'menu', 'about', 'gallery', 'hours', 'contact']

function makeSections(): SectionState[] {
  return SECTION_ORDER.map((id) => ({ id, enabled: true }))
}

function makeDesign(over: {
  colors?: Partial<ColorSet>
  typography?: Partial<TypographyConfig>
  layout?: Partial<LayoutConfig>
}): DesignConfiguration {
  // keep variant aligned with layout override
  return {
    colors: { ...BASE.colors, ...over.colors },
    typography: { ...BASE.typography, ...over.typography },
    layout: { ...BASE.layout, ...over.layout },
    sections: makeSections(),
  }
}

let seedCounter = 0
function item(
  name: string,
  description: string,
  price: number,
  image: string,
  extra: Partial<MenuItem> = {}
): MenuItem {
  seedCounter += 1
  return {
    id: `seed-item-${seedCounter}`,
    name,
    description,
    price,
    compareAt: null,
    image,
    featured: false,
    popular: false,
    available: true,
    ...extra,
  }
}

let catCounter = 0
function category(name: string, note: string, items: MenuItem[]): MenuCategory {
  catCounter += 1
  return { id: `seed-cat-${catCounter}`, name, note, items }
}

/* ------------------------------------------------------------------ *
 * The two stock template definitions
 * ------------------------------------------------------------------ */

export const TEMPLATES: TemplateDefinition[] = [
  
  {
    id: 'kreme-deals',
    name: 'Kreme Deals',
    category: 'Dessert',
    tagline: 'Better together — dozen, minis and combos.',
    description:
      'A deal-first donut template: fullscreen hero, red banner chips and list rows that look like a promo board. Perfect for bundle offers.',
    personality: 'Deal · Bold · Promo',
    tags: ['Deals', 'Combos', 'Dozen'],
    featured: false,
    chips: ['#006241', '#C8102E', '#F5F5F5'],
    previewImage: IMG.tableSpread,
    heroImage: IMG.tableSpread,
    gallery: [IMG.tableSpread, IMG.chocolateCake, IMG.cupcakes, IMG.cookies],
    sample: {
      name: 'Kreme Deals',
      slug: 'kremedeals',
      tagline: 'Better together — dozen, minis and combos.',
      description: 'Dozen deals, minis by the box and better-together combos.',
      logoText: 'KD',
      logoStyle: 'wordmark',
      phone: '+20 2 555 0188',
      email: 'deals@kremedeals.demo',
      address: 'Deal Street, Cairo',
      hours: [
        { day: 'Daily', hours: '08:00 – 23:00' },
      ],
      socials: { instagram: '@kremedeals', facebook: 'kremedeals', website: 'deals.example.com' },
    },
    sampleMenu: [
      category('Doughnuts — Best Deal', 'Dozen deals', [
        item('Dozen — 35% OFF', 'Twelve donuts, assorted', 299, IMG.chocolateCake, { featured: true }),
        item('Half Dozen — 25% OFF', 'Six donuts, assorted', 179, IMG.cupcakes, { popular: true }),
        item('Better Together — 99 EGP', 'Coffee + donut', 99, IMG.icedCoffee, { featured: true }),
        item('Better Together — 119 EGP', 'Cold drink + chocolate donut', 119, IMG.cappuccino),
      ]),
      category('Minis', 'Boxes', [
        item('Assorted 4 Minis', '', 125, IMG.cupcakes),
        item('Assorted 16 Minis', '', 370, IMG.chocolateCake, { popular: true }),
      ]),
    ],
    defaultDesign: makeDesign({
      colors: {
        primary: '#006241',
        secondary: '#004D32',
        accent: '#C8102E',
        background: '#FFFFFF',
        text: '#006241',
        card: '#FFFFFF',
        button: '#C8102E',
        border: '#E6E6E6',
      },
      typography: {
        heading: 'montserrat',
        body: 'inter',
        menu: 'montserrat',
        headingScale: 1.15,
        bodyScale: 1,
        headingWeight: 800,
        lineHeight: 1.45,
      },
      layout: {
        header: 'split',
        hero: 'fullscreen',
        menuLayout: 'list',
        card: 'elevated',
        radius: 10,
        spacing: 1,
        aspect: 'wide',
        theme: 'custom',
        variant: 'krispy',
      },
    }),
    usageCount: 0,
  },

  aurumLoungeDefinition,
  caffeBrewDefinition,
  bastaDefinition,
  dabbaDefinition,
  tavernDefinition,
  fastFoodMenuDefinition,
  dessertsMenuDefinition,



]

/* ------------------------------------------------------------------ *
 * Super-admin duplicated designs live in the platform store (they are
 * user data, not stock data), so this module never imports the store.
 * The store injects a read-only provider instead â€” see usePlatform.ts.
 * ------------------------------------------------------------------ */

export interface CustomTemplateSeed {
  /** stock template the super admin duplicated */
  baseTemplateId: string
  name: string
  category?: string
}

let customTemplatesProvider: (() => CustomTemplateSeed[]) | null = null
let templateOverridesProvider: (() => Record<string, import('../../shared/lib/types.ts').TemplateOverride>) | null = null

/** Called once at startup with a reader for the platform store's duplicates. */
export function registerCustomTemplates(provider: () => CustomTemplateSeed[]): void {
  customTemplatesProvider = provider
}

/** Overrides from DB (TemplateOverrides) keyed by base_template_id — images, hero texts, videos, design. */
export function registerTemplateOverrides(
  provider: () => Record<string, import('../../shared/lib/types.ts').TemplateOverride>
): void {
  templateOverridesProvider = provider
}

function getOverrideFor(baseId: string) {
  const map = templateOverridesProvider?.() || {}
  return map[baseId] || null
}

function applyTemplateOverride(tpl: TemplateDefinition): TemplateDefinition {
  const override = getOverrideFor(tpl.id)
  if (!override) return tpl
  const merged: TemplateDefinition = { ...tpl }
  if (override.previewImage) merged.previewImage = override.previewImage
  if (override.heroImage) merged.heroImage = override.heroImage
  if (override.heroImageMobile) merged.heroImageMobile = override.heroImageMobile
  if (override.heroVideoDesktop) merged.heroVideoDesktop = override.heroVideoDesktop
  if (override.heroVideoMobile) merged.heroVideoMobile = override.heroVideoMobile
  // legacy single video field for renderers that still read heroVideo
  if (override.heroVideoDesktop && !merged.heroVideo) merged.heroVideo = override.heroVideoDesktop
  if (Array.isArray(override.gallery) && override.gallery.length) merged.gallery = [...override.gallery]
  if (override.heroTitle || override.heroSubtitle) {
    merged.sample = {
      ...merged.sample,
      tagline: override.heroSubtitle || merged.sample.tagline,
      description: override.heroTitle ? override.heroSubtitle || merged.sample.description : merged.sample.description,
    }
    if (override.heroTitle) merged.tagline = override.heroTitle
    if (override.heroSubtitle) merged.description = override.heroSubtitle
  }
  if (override.design) {
    const d = override.design as Partial<DesignConfiguration>
    merged.defaultDesign = {
      ...merged.defaultDesign,
      ...(d.colors ? { colors: { ...merged.defaultDesign.colors, ...d.colors } } : {}),
      ...(d.typography ? { typography: { ...merged.defaultDesign.typography, ...d.typography } } : {}),
      ...(d.layout ? { layout: { ...merged.defaultDesign.layout, ...d.layout } } : {}),
    }
  }
  return merged
}

/** Stable public id for a duplicated design ("My CafÃ©" â†’ "custom-my-cafÃ©"). */
export function customTemplateId(name: string): string {
  const slug =
    name
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '') || 'template'
  return `custom-${slug}`
}

function resolveCategory(value: string | undefined, fallback: TemplateCategory): TemplateCategory {
  const match = TEMPLATE_CATEGORIES.find(
    (c) => c !== 'All' && c.toLowerCase() === value?.toLowerCase()
  )
  return (match as TemplateCategory) ?? fallback
}

/** Duplicated designs rendered as full template definitions (design of the base). */
function customTemplateDefinitions(): TemplateDefinition[] {
  if (!customTemplatesProvider) return []
  return customTemplatesProvider().map((custom) => {
    const base = TEMPLATES.find((t) => t.id === custom.baseTemplateId) ?? TEMPLATES[0]
    const merged = applyTemplateOverride(base)
    return {
      ...merged,
      id: customTemplateId(custom.name),
      name: custom.name,
      category: resolveCategory(custom.category, base.category),
      featured: false,
      usageCount: 0,
      custom: true,
    }
  })
}

/** Every design a visitor can pick — super-admin duplicates first, then stock (with overrides merged). */
export function allTemplates(): TemplateDefinition[] {
  const customs = customTemplateDefinitions()
  const stock = TEMPLATES.map(applyTemplateOverride)
  return customs.length ? [...customs, ...stock] : stock
}

export function hasTemplate(id: string): boolean {
  return allTemplates().some((t) => t.id === id)
}

export function getTemplate(id: string): TemplateDefinition {
  return allTemplates().find((t) => t.id === id) ?? TEMPLATES[0]
}

export const TEMPLATE_CATEGORIES = [
  'All',
  'Fine Dining',
  'Restaurant',
  'Cafe',
  'Coffee',
  'Bakery',
  'Dessert',
  'Healthy',
] as const

/** Deep-cloned sample restaurant used by the template preview experience. */
export function buildTemplatePreviewRestaurant(templateId: string) {
  const t = getTemplate(templateId)
  const now = new Date().toISOString()
  return {
    id: `preview-${t.id}`,
    name: t.sample.name,
    slug: t.sample.slug,
    tagline: t.sample.tagline,
    description: t.sample.description,
    logoText: t.sample.logoText,
    logoStyle: t.sample.logoStyle,
    heroImage: t.heroImage,
    heroImageMobile: t.heroImageMobile || t.heroImage,
    heroVideo: t.heroVideo || t.heroVideoDesktop || '',
    heroVideoDesktop: t.heroVideoDesktop || t.heroVideo || '',
    heroVideoMobile: t.heroVideoMobile || '',
    gallery: [...t.gallery],
    phone: t.sample.phone,
    email: t.sample.email,
    address: t.sample.address,
    hours: structuredClone(t.sample.hours),
    socials: { ...t.sample.socials },
    templateId: t.id,
    design: structuredClone(t.defaultDesign),
    menu: structuredClone(t.sampleMenu),
    status: 'published' as const,
    plan: 'professional' as const,
    stats: { views: 0, qrScans: 0, trend: [0, 0, 0, 0, 0, 0, 0] },
    updatedAt: now,
  }
}
