/* ------------------------------------------------------------------ *
 * MenuCraft — shared data model
 * All data in this application is simulated demo data.
 * ------------------------------------------------------------------ */

export type FontId = 'inter' | 'poppins' | 'dm-sans' | 'playfair' | 'lora' | 'montserrat' | 'cairo'

export type SectionId = 'featured' | 'menu' | 'about' | 'gallery' | 'hours' | 'contact'

export interface SectionState {
  id: SectionId
  enabled: boolean
}

export interface ColorSet {
  primary: string
  secondary: string
  accent: string
  background: string
  text: string
  card: string
  button: string
  /**
   * لون حدود الكروت والفواصل — اختياري: التمبليتات القديمة بلاه
   * فتُشتق آلياً من mix(text, background, 15%) كما كان سابقاً.
   */
  border?: string
}

export interface TypographyConfig {
  heading: FontId
  body: FontId
  menu: FontId
  /** multiplier applied to headline sizes (0.85 – 1.3) */
  headingScale: number
  /** multiplier applied to body sizes (0.9 – 1.2) */
  bodyScale: number
  /** 400 | 500 | 600 | 700 | 800 */
  headingWeight: number
  /** paragraph line-height (1.3 – 1.9) */
  lineHeight: number
}

export type HeaderStyle = 'split' | 'centered' | 'minimal'
export type HeroStyle = 'fullscreen' | 'split' | 'editorial'
export type MenuLayout = 'grid' | 'list' | 'board' | 'deck' | 'compact'
export type CardStyle = 'bordered' | 'elevated' | 'flat'
export type ImageAspect = 'square' | 'portrait' | 'landscape' | 'wide'
export type ThemeMode = 'light' | 'dark' | 'warm' | 'custom'

export interface LayoutConfig {
  header: HeaderStyle
  hero: HeroStyle
  menuLayout: MenuLayout
  card: CardStyle
  /** corner radius in px (0 – 24) */
  radius: number
  /** 0 compact · 1 balanced · 2 airy */
  spacing: 0 | 1 | 2
  aspect: ImageAspect
  theme: ThemeMode
  /** Structural variant for the public site. `classic` keeps the shared renderer;
   *  `krispy` enables the donut-shop treatment (green/red branding, banner chips, price-first list). */
  variant?: 'classic' | 'krispy'
  /** `tabs` (default) shows one category at a time. `scroll-sticky` stacks all
   *  categories vertically under sticky tabs with scrollspy: scrolling
   *  highlights the tab of the section in view, clicking a tab scrolls to it. */
  menuDisplay?: 'tabs' | 'scroll-sticky'
}

export interface DesignConfiguration {
  colors: ColorSet
  typography: TypographyConfig
  layout: LayoutConfig
  sections: SectionState[]
}

export interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  /** optional promotional / crossed-out price */
  compareAt: number | null
  image: string
  imageFit?: ImageFit
  featured: boolean
  popular: boolean
  available: boolean
  /** dietary / marketing flags used by stock template data */
  isVeg?: boolean
  isGf?: boolean
  isSpicy?: boolean
  isSpecial?: boolean
}

export interface MenuCategory {
  id: string
  name: string
  note: string
  items: MenuItem[]
}

export interface OpeningHour {
  day: string
  hours: string
}

export interface SocialLinks {
  instagram: string
  facebook: string
  website: string
}

export interface RestaurantStats {
  views: number
  qrScans: number
  /** last 7 days of menu views, used for sparklines */
  trend: number[]
}

export type PublishStatus = 'draft' | 'published'
export type DemoPlanId = 'trial' | 'starter' | 'professional' | 'business'
export type LogoStyle = 'monogram' | 'wordmark' | 'badge'

import { type Multilang } from '../i18n'

export interface ImageFit {
  position?: string
  width?: string
  height?: string
}

export const IMAGE_POSITIONS: Array<{ value: string; label: string }> = [
  { value: 'default', label: 'Default' },
  { value: 'center top', label: 'Top' },
  { value: 'right top', label: 'Top Right' },
  { value: 'left top', label: 'Top Left' },
  { value: 'center center', label: 'Center Center' },
  { value: 'center bottom', label: 'Bottom' },
  { value: 'right bottom', label: 'Bottom Right' },
  { value: 'left bottom', label: 'Bottom Left' },
]

export function imageFitStyle(fit?: ImageFit | null): Record<string, string> | undefined {
  if (!fit) return undefined
  const style: Record<string, string> = {}
  if (fit.position && fit.position !== 'default') style.objectPosition = fit.position
  if (fit.width) style.width = fit.width
  if (fit.height) style.height = fit.height
  return Object.keys(style).length ? style : undefined
}

export interface Restaurant {
  id: string
  name: string | Multilang
  /** simulated subdomain — never provisioned, purely a demo label */
  slug: string
  tagline: string | Multilang
  description: string | Multilang
  logoText: string | Multilang
  logoStyle: LogoStyle
  heroImage: string
  heroImageFit?: ImageFit
  /** optional mobile (9:16) variant of heroImage — desktop uses heroImage (16:9) */
  heroImageMobile?: string
  /** ambient hero clip — ''/absent = none · `https://…mp4` = remote URL · `idb:<uuid>` = uploaded blob in IndexedDB */
  heroVideo?: string
  /** responsive hero videos — desktop (16:9) wins on wide screens, mobile (9:16) on narrow screens */
  heroVideoDesktop?: string
  heroVideoMobile?: string
  gallery: string[]
  galleryFits?: (ImageFit | null)[]
  phone: string
  email: string
  address: string
  hours: OpeningHour[]
  socials: SocialLinks
  templateId: string
  design: DesignConfiguration
  menu: MenuCategory[]
  status: PublishStatus
  plan: DemoPlanId
  stats: RestaurantStats
  updatedAt: string

  /* --- inline (Elementor-style) overrides set in the visual editor --- */
  /** free text for template-owned strings, keyed by the full path ("copy.hero.cta") */
  copy?: Record<string, string>
  /** per-element style tweaks (size / colour / weight / alignment) */
  inline?: Record<string, InlineTextStyle>
}

export interface DemoSubscription {
  plan: DemoPlanId
  name: string
  price: number
  period: string
  status: 'active' | 'trialing' | 'past_due'
  renews: string
  features: string[]
}

export type TemplateCategory =
  | 'Fine Dining'
  | 'Cafe'
  | 'Bakery'
  | 'Restaurant'
  | 'Coffee'
  | 'Healthy'
  | 'Dessert'

export interface TemplateOverride {
  baseTemplateId: string
  heroTitle?: string | null
  heroSubtitle?: string | null
  heroImage?: string | null
  heroImageMobile?: string | null
  heroVideoDesktop?: string | null
  heroVideoMobile?: string | null
  previewImage?: string | null
  gallery?: string[] | null
  design?: Partial<DesignConfiguration> | null
  updatedAt?: string
  updatedBy?: string | null
}

export interface TemplateDefinition {
  id: string
  name: string
  category: TemplateCategory
  /** short line shown on gallery cards */
  tagline: string
  description: string
  /** personality keywords shown as chips */
  personality: string
  tags: string[]
  featured: boolean
  /** palette preview chips on the gallery card */
  chips: string[]
  previewImage: string
  heroImage: string
  heroImageMobile?: string
  heroVideo?: string
  heroVideoDesktop?: string
  heroVideoMobile?: string
  gallery: string[]
  /** sample restaurant rendered by the template preview page */
  sample: {
    name: string
    slug: string
    tagline: string
    description: string
    logoText: string
    logoStyle: LogoStyle
    phone: string
    email: string
    address: string
    hours: OpeningHour[]
    socials: SocialLinks
  }
  sampleMenu: MenuCategory[]
  defaultDesign: DesignConfiguration
  /** used by the platform admin view (mock) */
  usageCount: number
  /** true when the super admin duplicated an existing design */
  custom?: boolean
}

export interface AdminRestaurantRow {
  id: string
  name: string
  owner: string
  plan: DemoPlanId
  templateId: string
  status: PublishStatus
  views: number
  created: string
}

export interface PlatformActivity {
  id: string
  type: 'signup' | 'publish' | 'upgrade' | 'template' | 'qr'
  title: string
  detail: string
  time: string
}

export interface RecentActivity {
  id: string
  icon: 'edit' | 'publish' | 'design' | 'qr' | 'item'
  title: string
  detail: string
  time: string
}

/* ------------------------------------------------------------------ *
 * Elementor-style inline editing (tap a text inside the preview)
 * ------------------------------------------------------------------ */

/** per-element style tweaks written by the floating editor toolbar */
export interface InlineTextStyle {
  /** CSS font-size, e.g. '2.4rem' */
  fontSize?: string
  color?: string
  fontWeight?: number
  align?: 'start' | 'center' | 'end'
  /** per-element typeface — absent means "inherit the template's own font" */
  fontFamily?: FontId
  letterSpacing?: string
  /** applied to the element while it is being edited in place */
  whiteSpace?: 'pre-line'
}

/* ------------------------------------------------------------------ *
 * Ordering — online menu orders + counter orders entered by staff
 * ------------------------------------------------------------------ */

export type OrderStatus = 'received' | 'preparing' | 'served'
export type OrderChannel = 'online' | 'counter'

export interface OrderLine {
  itemId: string
  name: string
  price: number
  qty: number
}

export interface Order {
  id: string
  /** human facing order number, resets per restaurant */
  number: number
  restaurantId: string
  channel: OrderChannel
  table: string
  customer: string
  lines: OrderLine[]
  note: string
  total: number
  status: OrderStatus
  createdAt: string
  /** actual backend status for API transitions */
  rawStatus?: string
  /** true for demo rows — they roll forward to stay on "today" */
  seed?: boolean
}

/* ------------------------------------------------------------------ *
 * Payments
 * ------------------------------------------------------------------ */

export type PaymentProviderId = 'cash' | 'card' | 'wallet' | 'bank'

export interface PaymentMethod {
  id: string
  provider: PaymentProviderId
  label: string
  account: string
  enabled: boolean
}

export interface PlatformProvider {
  id: PaymentProviderId
  label: string
  detail: string
  fee: string
  enabled: boolean
}

/* ------------------------------------------------------------------ *
 * Accounts, roles and access control
 * ------------------------------------------------------------------ */

export type Role = 'super_admin' | 'admin' | 'worker' | 'client'

export type AdminPermission =
  | 'clients'
  | 'subscriptions'
  | 'sales'
  | 'templates'
  | 'team'
  | 'payments'
  | 'plans'
  | 'revenue'

export const ALL_PERMISSIONS: AdminPermission[] = [
  'clients',
  'subscriptions',
  'sales',
  'templates',
  'team',
  'payments',
  'plans',
  'revenue',
]

export interface UserAccount {
  id: string
  name: string
  email: string
  role: Role
  /** restaurants this account belongs to (client / worker) */
  restaurantId?: string
  /** only meaningful for the admin role */
  permissions?: AdminPermission[]
  status: 'active' | 'suspended'
  createdAt: string
}

/* ------------------------------------------------------------------ *
 * Subscriptions (platform side)
 * ------------------------------------------------------------------ */

export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'expired' | 'cancelled'

export interface SubscriptionRecord {
  restaurantId: string
  plan: DemoPlanId
  price: number
  status: SubscriptionStatus
  startedAt: string
  renewsAt: string
  autoRenew: boolean
}

/** يتحقق مما إذا كان الاشتراك نشطاً (يمكن النشر والوصول للميزات الكاملة) */
export function isSubscriptionActive(status: string | undefined): boolean {
  return status === 'active' || status === 'trialing'
}

/** يتحقق مما إذا كان الاشتراك في حالة موقوفة (ملغي، منتهي، متأخر السداد) */
export function isSubscriptionSuspended(status: string | undefined): boolean {
  return status === 'cancelled' || status === 'expired' || status === 'past_due'
}

/* ------------------------------------------------------------------ *
 * Reporting series (demo numbers, deterministic per restaurant)
 * ------------------------------------------------------------------ */

export interface SalesPoint {
  /** ISO date, or YYYY-MM / YYYY for the longer series */
  date: string
  orders: number
  revenue: number
}

export interface SalesSeries {
  daily: SalesPoint[]
  monthly: SalesPoint[]
  yearly: SalesPoint[]
}
