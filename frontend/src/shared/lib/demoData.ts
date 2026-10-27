import type {
  AdminRestaurantRow,
  DemoPlanId,
  DemoSubscription,
  Order,
  OrderLine,
  PlatformActivity,
  PlatformProvider,
  RecentActivity,
  Restaurant,
  SalesSeries,
  SubscriptionRecord,
  UserAccount,
  PaymentMethod,
  PaymentProviderId,
} from './types.ts'
import { IMG } from './images.ts'
import { getTemplate } from '../../templates/data/templates.ts'

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

export function createRestaurantFromTemplate(
  templateId: string,
  over: Partial<Restaurant>
): Restaurant {
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
  const bella = createRestaurantFromTemplate('bella-italia', {
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

  const copper = createRestaurantFromTemplate('urban-cafe', {
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

  const hearth = createRestaurantFromTemplate('sweet-atelier', {
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

/* ------------------------------------------------------------------ *
 * Deterministic helpers — demo data must look the same on every reload
 * ------------------------------------------------------------------ */

function hash(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const isoDay = (d: Date) => d.toISOString().slice(0, 10)

const CUSTOMERS = [
  'Layla H.',
  'Omar S.',
  'Chris P.',
  'Amina R.',
  'Noah K.',
  'Yasmin A.',
  'Daniel M.',
  'Farida E.',
  'Jonas B.',
  'Salma T.',
]

/* ------------------------------------------------------------------ *
 * Today's orders — the kitchen board starts alive
 * ------------------------------------------------------------------ */

export function createSeedOrders(restaurants: Restaurant[]): Order[] {
  const seeded: Order[] = []

  for (const r of restaurants) {
    const rnd = mulberry32(hash(r.id + 'orders'))
    const items = r.menu.flatMap((c) => c.items).filter((i) => i.available)
    if (items.length === 0) continue

    const count = r.id === 'rst-bella' ? 9 : r.id === 'rst-copper' ? 5 : 4
    const now = Date.now()
    const dayStart = new Date()
    dayStart.setHours(0, 0, 0, 0)
    const lo = Math.max(dayStart.getTime() + 8 * 3600_000, now - 9 * 3600_000)
    const hi = now - 3 * 60_000

    for (let n = 1; n <= count; n++) {
      const lines: OrderLine[] = []
      const wanted = 1 + Math.floor(rnd() * 3)
      for (let l = 0; l < wanted && lines.length < 4; l++) {
        const item = items[Math.floor(rnd() * items.length)]
        if (lines.some((x) => x.itemId === item.id)) continue
        lines.push({
          itemId: item.id,
          name: item.name,
          price: item.price,
          qty: 1 + Math.floor(rnd() * 2),
        })
      }
      if (lines.length === 0) continue

      const counter = rnd() < 0.3
      const ts = hi > lo ? lo + rnd() * (hi - lo) : hi - n * 60_000
      seeded.push({
        id: `ord-${r.id}-${n}`,
        number: n,
        restaurantId: r.id,
        channel: counter ? 'counter' : 'online',
        table: counter ? '—' : String(1 + Math.floor(rnd() * 18)),
        customer: CUSTOMERS[Math.floor(rnd() * CUSTOMERS.length)],
        lines,
        note: rnd() < 0.25 ? 'No onions, please.' : '',
        total: lines.reduce((sum, line) => sum + line.price * line.qty, 0),
        status: 'served',
        createdAt: new Date(ts).toISOString(),
        seed: true,
      })
    }

    // newest first, then give the board a live mix of statuses
    const mine = seeded.filter((o) => o.restaurantId === r.id)
    mine.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    mine.forEach((order, i) => {
      order.number = i + 1
      order.status = i === 0 ? 'received' : i < 3 ? 'preparing' : 'served'
    })
  }

  return seeded
}

/** Demo rows jump forward so the board is never empty, even tomorrow. */
export function rollOrdersToToday(orders: Order[]): Order[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return orders.map((o) => {
    if (!o.seed) return o
    const created = new Date(o.createdAt)
    const sameDay =
      created.getFullYear() === today.getFullYear() &&
      created.getMonth() === today.getMonth() &&
      created.getDate() === today.getDate()
    if (sameDay) return o
    const next = new Date(today)
    next.setHours(created.getHours(), created.getMinutes(), 0, 0)
    if (next.getTime() > Date.now() - 5 * 60_000) next.setHours(9, 0, 0, 0)
    return { ...o, createdAt: next.toISOString() }
  })
}

/* ------------------------------------------------------------------ *
 * Reporting series (demo numbers per restaurant)
 * ------------------------------------------------------------------ */

export function createSalesSeries(restaurantId: string, plan: DemoPlanId): SalesSeries {
  const rnd = mulberry32(hash(restaurantId + 'sales'))
  const scale = plan === 'business' ? 3.4 : plan === 'professional' ? 2.1 : plan === 'trial' ? 0.5 : 1

  const daily = []
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  for (let i = 179; i >= 0; i--) {
    const d = new Date(start.getTime() - i * 86400_000)
    const dow = d.getDay()
    const weekend = dow === 5 || dow === 6 ? 1.32 : dow === 0 ? 1.14 : 1
    const growth = 1 + ((179 - i) / 179) * 0.22
    const orders = Math.max(4, Math.round(11 * scale * weekend * growth * (0.78 + rnd() * 0.44)))
    daily.push({
      date: isoDay(d),
      orders,
      revenue: Math.round(orders * (18 + rnd() * 15)),
    })
  }

  const monthly = []
  const now = new Date()
  for (let i = 23; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const seasonal = 1 + Math.sin((d.getMonth() / 12) * Math.PI * 2) * 0.14
    const growth = 1 + ((23 - i) / 23) * 0.3
    const orders = Math.max(60, Math.round(330 * scale * seasonal * growth * (0.9 + rnd() * 0.2)))
    monthly.push({
      date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      orders,
      revenue: Math.round(orders * (19 + rnd() * 14)),
    })
  }

  const yearly = []
  for (let i = 2; i >= 0; i--) {
    const year = now.getFullYear() - i
    const growth = 1 + (2 - i) * 0.35
    const orders = Math.max(400, Math.round(3600 * scale * growth * (0.92 + rnd() * 0.16)))
    yearly.push({
      date: String(year),
      orders,
      revenue: Math.round(orders * (20 + rnd() * 12)),
    })
  }

  return { daily, monthly, yearly }
}

/* ------------------------------------------------------------------ *
 * Accounts, subscriptions, payments
 * ------------------------------------------------------------------ */

const daysFromNow = (days: number) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function createSeedAccounts(): UserAccount[] {
  const created = new Date(Date.now() - 240 * 86400_000).toISOString()
  return [
    {
      id: 'u-super',
      name: 'Mostafa Adel',
      email: 'super@menucraft.demo',
      role: 'super_admin',
      status: 'active',
      createdAt: created,
    },
    {
      id: 'u-admin',
      name: 'Nora Haddad',
      email: 'admin@menucraft.demo',
      role: 'admin',
      permissions: ['clients', 'subscriptions', 'sales'],
      status: 'active',
      createdAt: created,
    },
    {
      id: 'u-client',
      name: 'Marco Ferrante',
      email: 'owner@bella.demo',
      role: 'client',
      restaurantId: 'rst-bella',
      status: 'active',
      createdAt: created,
    },
    {
      id: 'u-client-2',
      name: 'Dana Whitfield',
      email: 'owner@copper.demo',
      role: 'client',
      restaurantId: 'rst-copper',
      status: 'active',
      createdAt: created,
    },
    {
      id: 'u-worker',
      name: 'Samir Kaddour',
      email: 'worker@bella.demo',
      role: 'worker',
      restaurantId: 'rst-bella',
      status: 'active',
      createdAt: created,
    },
  ]
}

export function createSeedSubscriptions(): SubscriptionRecord[] {
  return [
    {
      restaurantId: 'rst-bella',
      plan: 'professional',
      price: 29,
      status: 'active',
      startedAt: daysFromNow(-28),
      renewsAt: daysFromNow(30),
      autoRenew: true,
    },
    {
      restaurantId: 'rst-copper',
      plan: 'starter',
      price: 0,
      status: 'active',
      startedAt: daysFromNow(-120),
      renewsAt: daysFromNow(240),
      autoRenew: false,
    },
    {
      restaurantId: 'rst-hearth',
      plan: 'trial',
      price: 0,
      status: 'trialing',
      startedAt: daysFromNow(-8),
      renewsAt: daysFromNow(6),
      autoRenew: false,
    },
  ]
}

export function createSeedPayments(): Record<string, PaymentMethod[]> {
  return {
    'rst-bella': [
      {
        id: 'pay-bella-1',
        provider: 'cash',
        label: 'Cash at the table',
        account: 'Handled by staff',
        enabled: true,
      },
      {
        id: 'pay-bella-2',
        provider: 'card',
        label: 'Card terminal · Verifone',
        account: 'Merchant ****4242',
        enabled: true,
      },
      {
        id: 'pay-bella-3',
        provider: 'wallet',
        label: 'Mobile wallet',
        account: 'Not connected yet',
        enabled: false,
      },
    ],
    'rst-copper': [
      {
        id: 'pay-copper-1',
        provider: 'cash',
        label: 'Cash',
        account: 'Handled by staff',
        enabled: true,
      },
    ],
    'rst-hearth': [],
  }
}

export const PLATFORM_PROVIDERS: PlatformProvider[] = [
  {
    id: 'cash',
    label: 'Cash',
    detail: 'Paid at the counter or table',
    fee: '0%',
    enabled: true,
  },
  {
    id: 'card',
    label: 'Card terminal',
    detail: 'In-person card payments',
    fee: '1.4% + $0.25',
    enabled: true,
  },
  {
    id: 'wallet',
    label: 'Mobile wallet',
    detail: 'Apple Pay, Google Pay and local wallets',
    fee: '1.2%',
    enabled: false,
  },
  {
    id: 'bank',
    label: 'Bank transfer',
    detail: 'IBAN shown at checkout, confirmed manually',
    fee: '0%',
    enabled: false,
  },
]

export const PAYMENT_LABELS: Record<PaymentProviderId, string> = {
  cash: 'Cash',
  card: 'Card terminal',
  wallet: 'Mobile wallet',
  bank: 'Bank transfer',
}
