import type {
  AdminRestaurantRow,
  DemoPlanId,
  DemoSubscription,
  PlatformActivity,
  RecentActivity,
  Restaurant,
} from './types'
import { IMG } from './images'
import { getTemplate } from './templates'

/* ------------------------------------------------------------------ *
 * Plans — demo pricing only, no payments are processed anywhere.
 * ------------------------------------------------------------------ */

export interface PlanCard {
  id: DemoPlanId
  name: string
  price: number
  period: string
  blurb: string
  features: string[]
  highlight: boolean
}

export const PLANS: PlanCard[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 0,
    period: 'forever',
    blurb: 'For the first digital menu of a small kitchen.',
    features: [
      '1 restaurant website',
      'Up to 15 menu items',
      'All 8 templates included',
      'QR code generator',
      'menucraft.com subdomain (demo)',
    ],
    highlight: false,
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 29,
    period: 'per month',
    blurb: 'For restaurants that change the menu often.',
    features: [
      'Unlimited menu items',
      'Full design studio: fonts, colors, layout',
      'QR scan tracking (demo analytics)',
      'Remove MenuCraft branding',
      'Photo gallery & featured dishes',
      'Priority template releases',
    ],
    highlight: true,
  },
  {
    id: 'business',
    name: 'Business',
    price: 79,
    period: 'per month',
    blurb: 'For groups, franchises and multi-location brands.',
    features: [
      'Everything in Professional',
      'Up to 10 restaurant sites',
      'Custom subdomain (simulated)',
      'Shared brand kit across locations',
      'Team seats (demo)',
      'Priority support',
    ],
    highlight: false,
  },
]

export const SUBSCRIPTIONS: Record<DemoPlanId, DemoSubscription> = {
  trial: {
    plan: 'trial',
    name: 'Trial',
    price: 0,
    period: '14 days',
    status: 'trialing',
    renews: 'Trial ends in 9 days',
    features: ['All editor features unlocked', '1 restaurant site', 'MenuCraft badge shown'],
  },
  starter: {
    plan: 'starter',
    name: 'Starter',
    price: 0,
    period: 'forever',
    status: 'active',
    renews: 'No renewal required',
    features: ['1 restaurant website', 'Up to 15 menu items', 'QR code generator'],
  },
  professional: {
    plan: 'professional',
    name: 'Professional',
    price: 29,
    period: 'per month',
    status: 'active',
    renews: 'Renews on Nov 12, 2026',
    features: [
      'Unlimited menu items',
      'Full design studio',
      'QR scan tracking',
      'No MenuCraft branding',
    ],
  },
  business: {
    plan: 'business',
    name: 'Business',
    price: 79,
    period: 'per month',
    status: 'active',
    renews: 'Renews on Nov 12, 2026',
    features: ['Up to 10 restaurant sites', 'Shared brand kit', 'Team seats', 'Priority support'],
  },
}

/* ------------------------------------------------------------------ *
 * Seed restaurants — each one owns an independent configuration.
 * ------------------------------------------------------------------ */

function fromTemplate(templateId: string, over: Partial<Restaurant>): Restaurant {
  const t = getTemplate(templateId)
  const base: Restaurant = {
    id: `rst-${templateId}`,
    name: t.sample.name,
    slug: t.sample.slug,
    tagline: t.sample.tagline,
    description: t.sample.description,
    logoText: t.sample.logoText,
    logoStyle: t.sample.logoStyle,
    heroImage: t.heroImage,
    gallery: [...t.gallery],
    phone: t.sample.phone,
    email: t.sample.email,
    address: t.sample.address,
    hours: structuredClone(t.sample.hours),
    socials: { ...t.sample.socials },
    templateId: t.id,
    design: structuredClone(t.defaultDesign),
    menu: structuredClone(t.sampleMenu),
    status: 'published',
    plan: 'professional',
    stats: { views: 0, qrScans: 0, trend: [0, 0, 0, 0, 0, 0, 0] },
    updatedAt: new Date().toISOString(),
  }
  return { ...base, ...over }
}

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString()

export function createSeedRestaurants(): Restaurant[] {
  const bella = fromTemplate('bella-italia', {
    id: 'rst-bella',
    name: 'Bella Italian Kitchen',
    slug: 'bella',
    logoText: 'BK',
    status: 'published',
    plan: 'professional',
    stats: {
      views: 12480,
      qrScans: 1284,
      trend: [1420, 1680, 1510, 1990, 2240, 2010, 1630],
    },
    updatedAt: hoursAgo(3),
  })

  const copper = fromTemplate('urban-cafe', {
    id: 'rst-copper',
    name: 'The Copper Kettle',
    slug: 'copperkettle',
    logoText: 'CK',
    tagline: 'Slow mornings, properly poured coffee.',
    description:
      'A corner café on Cedar Road serving house-roasted espresso, laminated pastries and a short brunch menu until three.',
    heroImage: IMG.cafeInterior,
    gallery: [IMG.cafeInterior, IMG.latteHands, IMG.avocadoToast, IMG.cafeBright],
    phone: '+1 (720) 555-0122',
    email: 'hello@copperkettle.demo',
    address: '64 Cedar Road, Denver, CO',
    status: 'published',
    plan: 'starter',
    stats: {
      views: 4120,
      qrScans: 612,
      trend: [520, 610, 580, 640, 720, 690, 560],
    },
    updatedAt: hoursAgo(26),
  })

  const hearth = fromTemplate('sweet-atelier', {
    id: 'rst-hearth',
    name: 'Hearth & Crumb',
    slug: 'hearthcrumb',
    logoText: 'HC',
    tagline: 'Bread with a long memory.',
    description:
      'A small bakery fermenting for 36 hours and baking twice a day. Pre-orders close at six the evening before collection.',
    heroImage: IMG.artisanBread,
    gallery: [IMG.artisanBread, IMG.chocolateCake, IMG.cupcakes, IMG.cafeWindow],
    phone: '+1 (804) 555-0104',
    email: 'bake@hearthcrumb.demo',
    address: '2 Mill Court, Richmond, VA',
    status: 'draft',
    plan: 'trial',
    stats: {
      views: 860,
      qrScans: 96,
      trend: [90, 120, 140, 130, 160, 110, 110],
    },
    updatedAt: hoursAgo(74),
  })

  return [bella, copper, hearth]
}

export const ACTIVE_RESTAURANT_ID = 'rst-bella'

/* ------------------------------------------------------------------ *
 * Activity feeds
 * ------------------------------------------------------------------ */

export const RECENT_ACTIVITY: RecentActivity[] = [
  {
    id: 'a1',
    icon: 'publish',
    title: 'Website published',
    detail: 'bella.menucraft.com is live with the latest menu',
    time: '3 hours ago',
  },
  {
    id: 'a2',
    icon: 'design',
    title: 'Typography updated',
    detail: 'Headings switched to Playfair Display',
    time: '5 hours ago',
  },
  {
    id: 'a3',
    icon: 'qr',
    title: 'QR code scanned 214 times',
    detail: 'Table tents at the Harbor Street entrance',
    time: 'Yesterday',
  },
  {
    id: 'a4',
    icon: 'item',
    title: 'Dish marked as featured',
    detail: 'Tagliata di Manzo appears in Featured Dishes',
    time: 'Yesterday',
  },
  {
    id: 'a5',
    icon: 'edit',
    title: 'Price updated',
    detail: 'Spaghetti ai Frutti di Mare · $23',
    time: '2 days ago',
  },
]

/* ------------------------------------------------------------------ *
 * Platform administration (mock)
 * ------------------------------------------------------------------ */

export const ADMIN_ROWS: AdminRestaurantRow[] = [
  { id: 'r1', name: 'Bella Italian Kitchen', owner: 'Marco Ferrante', plan: 'professional', templateId: 'bella-italia', status: 'published', views: 12480, created: '2026-03-04' },
  { id: 'r2', name: 'The Copper Kettle', owner: 'Dana Whitfield', plan: 'starter', templateId: 'urban-cafe', status: 'published', views: 4120, created: '2026-05-19' },
  { id: 'r3', name: 'Hearth & Crumb', owner: 'Owen Blake', plan: 'trial', templateId: 'sweet-atelier', status: 'draft', views: 860, created: '2026-09-30' },
  { id: 'r4', name: 'Burger District', owner: 'Tyrone Hayes', plan: 'professional', templateId: 'burger-district', status: 'published', views: 21870, created: '2025-11-12' },
  { id: 'r5', name: 'Bean & Brew', owner: 'Priya Raman', plan: 'business', templateId: 'bean-brew', status: 'published', views: 18340, created: '2025-08-02' },
  { id: 'r6', name: 'Green Table', owner: 'Sofia Mendes', plan: 'professional', templateId: 'green-table', status: 'published', views: 9640, created: '2026-01-27' },
  { id: 'r7', name: 'Maison Patisserie', owner: 'Julien Roux', plan: 'professional', templateId: 'maison-patisserie', status: 'published', views: 7210, created: '2026-02-14' },
  { id: 'r8', name: 'The Royal', owner: 'Alexandra Vane', plan: 'business', templateId: 'the-royal', status: 'published', views: 15990, created: '2025-06-21' },
  { id: 'r9', name: 'Nonna’s Table', owner: 'Luca Bianchi', plan: 'trial', templateId: 'bella-italia', status: 'draft', views: 320, created: '2026-10-18' },
  { id: 'r10', name: 'Sunrise Juice Co.', owner: 'Mia Coleman', plan: 'starter', templateId: 'green-table', status: 'draft', views: 540, created: '2026-10-22' },
]

export const PLATFORM_ACTIVITY: PlatformActivity[] = [
  { id: 'p1', type: 'signup', title: 'New restaurant created', detail: 'Nonna’s Table · Trial plan', time: '12 min ago' },
  { id: 'p2', type: 'publish', title: 'Site published', detail: 'Bella Italian Kitchen went live', time: '3 hours ago' },
  { id: 'p3', type: 'upgrade', title: 'Plan upgraded', detail: 'Bean & Brew · Professional → Business', time: '5 hours ago' },
  { id: 'p4', type: 'template', title: 'Template updated', detail: 'Maison Patisserie · new hero layouts', time: 'Yesterday' },
  { id: 'p5', type: 'qr', title: 'Milestone reached', detail: 'Burger District passed 5,000 QR scans', time: 'Yesterday' },
  { id: 'p6', type: 'signup', title: 'New restaurant created', detail: 'Sunrise Juice Co. · Trial plan', time: '2 days ago' },
]

/** Restaurant signups per month, last 12 months (mock). */
export const MONTHLY_SIGNUPS = [
  { month: 'Nov', value: 46 },
  { month: 'Dec', value: 52 },
  { month: 'Jan', value: 71 },
  { month: 'Feb', value: 66 },
  { month: 'Mar', value: 84 },
  { month: 'Apr', value: 92 },
  { month: 'May', value: 88 },
  { month: 'Jun', value: 104 },
  { month: 'Jul', value: 118 },
  { month: 'Aug', value: 126 },
  { month: 'Sep', value: 141 },
  { month: 'Oct', value: 158 },
]

export const PLATFORM_KPIS = {
  restaurants: 1284,
  subscriptions: 843,
  templates: 8,
  menuViews: 2412000,
  mrr: 24160,
  growth: 12.4,
}

export const PLAN_SPLIT = [
  { label: 'Trial', value: 248, color: '#B3A794' },
  { label: 'Starter', value: 193, color: '#E8571F' },
  { label: 'Professional', value: 321, color: '#F3ECE1' },
  { label: 'Business', value: 129, color: '#B98A2E' },
]
