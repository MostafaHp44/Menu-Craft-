import { useEffect, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent } from 'react'
import type {
  InlineTextStyle,
  MenuCategory,
  MenuItem,
  Restaurant,
  SectionId,
} from '../../shared/lib/types.ts'
import { imageFitStyle } from '../../shared/lib/types.ts'
import { fontStack } from '../data/fonts.ts'
import { getTemplate } from '../data/templates.ts'
import { cx, mix, money, readableOn, tx } from '../../shared/lib/utils.ts'
import { resolveVideoSrc } from '../../shared/lib/heroVideo.ts'
import { Icon } from '../../shared/ui/icons.tsx'
import { cartSignature, useCartStore } from '../../features/public/publicCart.ts'
import { useI18n, type TKey } from '../../shared/i18n/index.tsx'
import {
  Ed,
  EdImage,
  InlineEditProvider,
  useInlineEdit,
  type ActiveField,
} from '../editor/inlineEdit.tsx'
import { confirmDialog } from '../../shared/components/dialogs.tsx'
import './site.css'
import CheckoutOverlay from './CheckoutOverlay';

const SPACES = ['0.84', '1', '1.18'] as const

const ASPECTS: Record<string, string> = {
  square: '1 / 1',
  portrait: '4 / 5',
  landscape: '4 / 3',
  wide: '16 / 9',
}

const SECTION_LABELS: Record<SectionId, TKey> = {
  featured: 'web.site.sections.featured',
  menu: 'web.site.sections.menu',
  about: 'web.site.sections.about',
  gallery: 'web.site.sections.gallery',
  hours: 'web.site.sections.hours',
  contact: 'web.site.sections.contact',
}

const NAV_SECTIONS: SectionId[] = ['menu', 'about', 'gallery', 'hours', 'contact']

/** `Ed format` helper — renders a raw stored number as a price */
const moneyFormat = (raw: string) => money(Number(raw) || 0)

function designVars(r: Restaurant): CSSProperties {
  const d = typeof r.design === 'string' ? JSON.parse(r.design) : (r.design || { colors: {}, typography: {}, layout: {} });
  const { colors: c, typography: t, layout: l } = d
  return {
    '--rs-bg': c.background,
    '--rs-text': c.text,
    '--rs-card': c.card,
    '--rs-primary': c.primary,
    '--rs-secondary': c.secondary,
    '--rs-accent': c.accent,
    '--rs-button': c.button,
    '--rs-on-button': readableOn(c.button),
    // لون البوردر: حقل مستقل إذا حدده صاحب الموقع، وإلا يُشتق من النص والخلفية
    '--rs-border': c.border || mix(c.text, c.background, 0.15),
    '--rs-muted': mix(c.text, c.background, 0.58),
    '--rs-accent-soft': mix(c.accent, c.background, 0.86),
    '--rs-accent-ink': mix(c.accent, c.text, 0.22),
    '--rs-heading': fontStack(t.heading),
    '--rs-body': fontStack(t.body),
    '--rs-menu': fontStack(t.menu),
    '--rs-h-scale': String(t.headingScale),
    '--rs-b-scale': String(t.bodyScale),
    '--rs-h-weight': String(t.headingWeight),
    '--rs-leading': String(t.lineHeight),
    '--rs-radius': `${l.radius}px`,
    '--rs-radius-sm': `${Math.max(2, l.radius - 6)}px`,
    '--rs-space': SPACES[l.spacing] ?? '1',
    '--rs-img': ASPECTS[l.aspect] ?? '4 / 3',
  } as CSSProperties
}

export interface RestaurantSiteProps {
  restaurant: Restaurant
  /** interactive = anchor navigation & menu tabs respond to clicks */
  interactive?: boolean
  /** site = published page (sticky header) · preview = editor frame */
  mode?: 'site' | 'preview'
  /** avoids id collisions when several renders share one page */
  idPrefix?: string
  /** Elementor-style in-place editing: tap any text in the preview and type */
  editable?: boolean
  /** the editor tracks the selected field to render its floating toolbar */
  onActiveChange?: (field: ActiveField | null) => void
  /** commit an edited text: `path` is a restaurant path or a `copy.*` override */
  onCommit?: (path: string, value: string) => void
  /** commit an inline style tweak (null patch clears it) */
  onStyle?: (path: string, patch: InlineTextStyle | null) => void
  /** external cart control (published page can manage its own overlays) */
  onOpenCart?: () => void
  /** external add-to-cart (published page's cart/checkout/branch) */
  onAddItem?: (item: MenuItem) => void
  /** in-place menu editing (admin): append/remove categories & items */
  onMenuEdit?: (recipe: (draft: Restaurant) => void) => void
  /**
   * false for menu-only (static) sites: full menu stays visible, but every
   * ordering affordance is removed — add-to-cart buttons and the cart button.
   * Defaults to true so editor previews and template demos stay interactive.
   */
  orderingEnabled?: boolean
}

export function RestaurantSite({
  restaurant: r,
  interactive = true,
  mode = 'site',
  idPrefix = '',
  editable = false,
  onActiveChange,
  onCommit,
  onStyle,
  onOpenCart,
  onMenuEdit,
  orderingEnabled = true,
}: RestaurantSiteProps) {
  const { layout } = r.design
  const enabled = r.design.sections.filter((s) => s.enabled).map((s) => s.id)
  const nav = NAV_SECTIONS.filter((id) => enabled.includes(id))
  const anchor = (id: string) => `#${idPrefix}rs-${id}`
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  // while editing, the frame must accept pointer events (text taps) while
  // anchor jumps stay neutralised — otherwise `data-interactive="false"`
  // would grey out every editable word
  const stopNavigation = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!editable) return
    if ((event.target as HTMLElement).closest('a')) event.preventDefault()
  }

  return (
    <InlineEditProvider
      restaurant={r}
      enabled={editable}
      onActiveChange={onActiveChange}
      onCommit={onCommit}
      onStyle={onStyle}
    >
      <div
        ref={rootRef}
        className="rs"
        style={designVars(r)}
        data-theme={layout.theme}
        data-card={layout.card}
        data-mode={mode}
        data-variant={(layout as any).variant || 'classic'}
        data-interactive={interactive || editable ? 'true' : 'false'}
        data-editable={editable ? 'true' : undefined}
        id={`${idPrefix}rs-top`}
        onClick={editable ? stopNavigation : undefined}
      >
        <SiteHeader r={r} nav={nav} anchor={anchor} prefix={idPrefix} orderingEnabled={orderingEnabled} onOpenCart={onOpenCart ? () => onOpenCart() : () => setCartOpen(true)} />
        <SiteHero r={r} anchor={anchor} />

        {enabled.includes('featured') ? <FeaturedSection r={r} prefix={idPrefix} /> : null}
        {enabled.includes('menu') ? <MenuSection r={r} prefix={idPrefix} editable={editable} onMenuEdit={onMenuEdit} orderingEnabled={orderingEnabled} /> : null}
        {enabled.includes('about') ? <AboutSection r={r} prefix={idPrefix} /> : null}
        {enabled.includes('gallery') && r.gallery.length > 0 ? (
          <GallerySection r={r} prefix={idPrefix} />
        ) : null}
        {enabled.includes('hours') ? <HoursSection r={r} prefix={idPrefix} /> : null}
        {enabled.includes('contact') ? <ContactSection r={r} prefix={idPrefix} /> : null}

        <SiteFooter r={r} nav={nav} anchor={anchor} prefix={idPrefix} />
        {orderingEnabled && cartOpen ? <SiteCartOverlay onClose={() => setCartOpen(false)} onCheckout={() => { setCartOpen(false); setCheckoutOpen(true); }} /> : null}
        {orderingEnabled && checkoutOpen ? <CheckoutOverlay restaurant={r} onClose={() => setCheckoutOpen(false)} onPlaced={() => { setCheckoutOpen(false); useCartStore.getState().clear(); }} /> : null}
      </div>
    </InlineEditProvider>
  )
}

function SiteCartOverlay({ onClose, onCheckout }: { onClose: () => void; onCheckout?: () => void }) {
  const cart = useCartStore()
  const lines = cart.lines
  const total = cart.subtotal

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-label="Cart">
      <div className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-6">
        <div className="flex items-center justify-between">
          <Ed as="h3" path="copy.site.cart.title" fallback="Cart" className="text-lg font-bold text-gray-900" label="editor.inline.f.cart" />
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-gray-100" aria-label="Close cart">
            <Icon name="x" size={18} />
          </button>
        </div>
        {lines.length === 0 ? (
          <Ed as="p" path="copy.site.cart.empty" fallback="Your cart is empty." className="mt-6 text-sm text-gray-600" label="editor.inline.f.note" />
        ) : (
          <ul className="mt-4 max-h-80 space-y-3 overflow-y-auto">
            {lines.map((line) => (
              <li key={`${line.itemId}-${cartSignature(line)}`} className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">{line.name}</p>
                  <p className="text-[12px] text-gray-500">{Number(line.price).toFixed(2)} × {line.qty}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => cart.setQty(line.itemId, cartSignature(line), line.qty - 1)} className="h-7 w-7 rounded-md bg-gray-100 text-sm font-bold leading-none" aria-label="Decrease">−</button>
                  <span className="w-6 text-center text-sm font-medium tabular-nums">{line.qty}</span>
                  <button type="button" onClick={() => cart.setQty(line.itemId, cartSignature(line), line.qty + 1)} className="h-7 w-7 rounded-md bg-gray-100 text-sm font-bold leading-none" aria-label="Increase">+</button>
                  <button type="button" onClick={() => cart.remove(line.itemId, cartSignature(line))} className="ms-1 text-[11px] font-semibold text-red-600" aria-label="Remove"><Ed path="copy.site.cart.remove" fallback="Remove" label="editor.inline.f.cart" /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {lines.length > 0 && (
          <div className="mt-5 border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between text-sm">
              <Ed as="span" path="copy.site.cart.total" fallback="Total" className="text-gray-600" label="editor.inline.f.price" />
              <span className="text-base font-bold text-gray-900">{total.toFixed(2)}</span>
            </div>
            <Ed
              as="p"
              path="copy.site.cart.note"
              fallback="Checkout is available on the published ordering page. This preview cart is connected to the same shared ordering flow; placing an order requires a published restaurant linked to the backend."
              className="mt-3 text-[11px] leading-relaxed text-gray-500"
              multiline
              label="editor.inline.f.note"
            />
            <button type="button" onClick={onCheckout ? onCheckout : undefined} disabled={!onCheckout} className={`mt-3 w-full rounded-xl py-2.5 text-sm font-semibold text-white transition ${onCheckout ? 'bg-primary hover:bg-primary-dark' : 'cursor-not-allowed bg-gray-300 text-gray-700'}`}>
              <Ed path="copy.site.cart.checkout" fallback="Checkout" label="editor.inline.f.cart" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}



function SiteHeader({
  r,
  nav,
  anchor,
  prefix,
  onOpenCart,
  orderingEnabled = true,
}: {
  r: Restaurant
  nav: SectionId[]
  anchor: (id: string) => string
  prefix: string
  onOpenCart: () => void
  orderingEnabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const { t } = useI18n()
  const cartCount = useCartStore(s => s.count)
  const category = getTemplate(r.templateId).category

  const links = nav.map((id) => (
    <a key={id} className="rs-nav__link" href={anchor(id)}>
      <Ed
        path={`copy.nav.${id}`}
        fallback={t(SECTION_LABELS[id])}
        label="editor.inline.f.navLink"
      />
    </a>
  ))

  return (
    <header className={cx('rs-header', `rs-header--${r.design.layout.header}`)}>
      <div className="rs-header__inner rs-shell">
        <a className={cx('rs-logo', `rs-logo--${r.logoStyle}`)} href={`#${prefix}rs-top`}>
          <Ed path="logoText" as="span" className="rs-logo__mark" label="editor.inline.f.logo" />
          <span>
            <Ed path="name" as="span" className="rs-logo__name" label="editor.inline.f.name" />
            <Ed
              path="copy.header.category"
              fallback={category}
              as="span"
              className="rs-logo__sub"
              label="editor.inline.f.category"
            />
          </span>
        </a>

        <nav className="rs-nav" aria-label={t('web.site.header.navAria')}>
          {links}
        </nav>

        <div className="rs-header__actions">
          <Ed path="phone" as="span" className="rs-header__phone" label="editor.inline.f.phone" />
          <a className="rs-btn rs-header__cta" href={anchor('contact')}>
            <Ed
              path="copy.header.cta"
              fallback={t('web.site.cta.book')}
              label="editor.inline.f.headerBtn"
            />
          </a>
          {orderingEnabled ? (
            <button
              type="button"
              onClick={onOpenCart}
              className="rs-btn rs-header__cta"
              style={{ marginLeft: '0.5rem', display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}
              aria-label={t('web.site.cart', { defaultValue: 'Cart' })}
            >
              <Ed as="span" path="copy.site.cart.title" fallback={t('web.site.cart', { defaultValue: 'Cart' })} label="editor.inline.f.cart" />
              <span className="rs-cart-badge" style={{ minWidth: '1.4rem', height: '1.4rem', lineHeight: '1.4rem', textAlign: 'center', borderRadius: '999px', background: 'var(--rs-accent)', color: 'var(--rs-on-button)', fontSize: '0.72rem', fontWeight: 700 }}>
                {cartCount}
              </span>
            </button>
          ) : null}
          <button
            type="button"
            className="rs-burger"
            aria-label={open ? t('web.site.header.closeNav') : t('web.site.header.openNav')}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <Icon name={open ? 'x' : 'menu'} size={18} />
          </button>
        </div>
      </div>

      {open ? (
        <div className="rs-mobile-nav">
          {nav.map((id) => (
            <a
              key={id}
              className="rs-nav__link"
              href={anchor(id)}
              onClick={() => setOpen(false)}
            >
              <Ed
                path={`copy.nav.${id}`}
                fallback={t(SECTION_LABELS[id])}
                label="editor.inline.f.navLink"
              />
            </a>
          ))}
          <a className="rs-btn" href={anchor('contact')} onClick={() => setOpen(false)}>
            <Ed
              path="copy.header.cta"
              fallback={t('web.site.cta.book')}
              label="editor.inline.f.headerBtn"
            />
          </a>
        </div>
      ) : null}
    </header>
  )
}

/* ---------------------------------- hero ---------------------------------- */

/**
 * Ambient hero video � decorative layer over the hero photo.
 * `idb:` refs resolve to object URLs (revoked on cleanup); until resolved
 * nothing renders, so the photo/poster stays visible underneath. Always
 * pointer-events-none: taps must reach the inline-editable image below.
 */
function HeroVideo({ src, poster, className }: { src: string; poster: string; className?: string }) {
  const [resolved, setResolved] = useState<string | null>(null)

  useEffect(() => {
    let objectUrl: string | null = null
    let cancelled = false
    resolveVideoSrc(src).then((url) => {
      if (cancelled) {
        if (url?.startsWith('blob:')) URL.revokeObjectURL(url)
        return
      }
      if (url?.startsWith('blob:')) objectUrl = url
      setResolved(url)
    })
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      setResolved(null)
    }
  }, [src])

  if (!resolved) return null
  return (
    <video
      autoPlay
      muted
      loop
      playsInline
      src={resolved}
      poster={poster}
      className={cx('rs-hero__video', className)}
    />
  )
}

function ResponsiveHeroMedia({ r, poster, className }: { r: Restaurant; poster: string; className?: string }) {
  const [isMobile, setIsMobile] = useState<boolean>(() => typeof window !== 'undefined' && window.innerWidth < 768)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  const src =
    (isMobile && r.heroVideoMobile) ? r.heroVideoMobile :
    (r.heroVideoDesktop) ? r.heroVideoDesktop :
    r.heroVideo
  if (!src) return null
  return <HeroVideo src={src} poster={poster} className={className} />
}

function SiteHero({ r, anchor }: { r: Restaurant; anchor: (id: string) => string }) {
  const style = r.design.layout.hero
  const firstHours = r.hours[0]
  const inline = useInlineEdit()
  const { t } = useI18n()
  const [isMobile, setIsMobile] = useState<boolean>(() => typeof window !== 'undefined' && window.innerWidth < 768)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  const heroImage = (isMobile && (r as any).heroImageMobile) ? (r as any).heroImageMobile : r.heroImage
  const heroPoster = heroImage

  const body = (
    <>
      <span className="rs-chip">
        <Ed
          path="copy.hero.chip"
          fallback={t('web.site.hero.chipTemplate', { name: getTemplate(r.templateId).name })}
          label="editor.inline.f.chip"
        />
      </span>
      <Ed
        as="h1"
        path={style === 'split' ? 'name' : 'tagline'}
        className="rs-hero__title"
        label="editor.inline.f.heroTitle"
      />
      <Ed
        as="p"
        path={style === 'split' ? 'tagline' : 'description'}
        className="rs-hero__lead"
        multiline
        label="editor.inline.f.heroLead"
      />
      <div className="rs-hero__actions">
        <a className="rs-btn rs-btn--accent" href={anchor('menu')}>
          <Ed
            path="copy.hero.menuCta"
            fallback={t('web.site.cta.viewMenu')}
            label="editor.inline.f.heroBtn"
          />
        </a>
        <a className="rs-btn rs-btn--ghost" href={anchor('contact')}>
          <Ed
            path="copy.hero.bookCta"
            fallback={t('web.site.cta.book')}
            label="editor.inline.f.heroBtn"
          />
        </a>
      </div>
    </>
  )

  const hoursMeta = firstHours ? (
    <>
      <Ed path="hours.0.day" label="editor.inline.f.hours" />
      {' � '}
      <Ed path="hours.0.hours" label="editor.inline.f.hours" />
    </>
  ) : (
    <Ed path="copy.hero.hours" fallback={t('web.site.hero.openDaily')} label="editor.inline.f.hours" />
  )

  if (style === 'fullscreen') {
    const fit = (r as any).heroImageFit || {}
    return (
      <section className="rs-hero rs-hero--fullscreen">
        <div
          className="rs-hero__media"
          style={{ backgroundImage: `url(${heroImage})`, backgroundPosition: fit.position && fit.position !== 'default' ? fit.position : undefined }}
          role="img"
          aria-label={t('web.site.hero.ambienceAlt', { name: tx(r.name) })}
          onClick={
            inline?.enabled
              ? () => inline.select({ path: 'heroImage', kind: 'image', label: 'editor.inline.f.heroPhoto' })
              : undefined
          }
        >
          <ResponsiveHeroMedia r={r} poster={heroPoster} />
        </div>
        <div className="rs-hero__overlay" />
        <div className="rs-hero__inner">
          <span className="rs-chip">
            <Ed
              path="copy.hero.chip"
              fallback={getTemplate(r.templateId).category}
              label="editor.inline.f.chip"
            />
          </span>
          <Ed as="h1" path="name" className="rs-hero__title" label="editor.inline.f.name" />
          <Ed as="p" path="tagline" className="rs-hero__lead" multiline label="editor.inline.f.heroLead" />
          <div className="rs-hero__actions">
            <a className="rs-btn rs-btn--accent" href={anchor('menu')}>
              <Ed
                path="copy.hero.menuCta"
                fallback={t('web.site.cta.viewMenu')}
                label="editor.inline.f.heroBtn"
              />
            </a>
            <a className="rs-btn rs-btn--ghost" href={anchor('contact')}>
              <Ed
                path="copy.hero.bookCta"
                fallback={t('web.site.cta.book')}
                label="editor.inline.f.heroBtn"
              />
            </a>
          </div>
          <div className="rs-hero__meta">
            <span className="rs-hero__meta-item">
              <Icon name="clock" size={15} />
              {hoursMeta}
            </span>
            <span className="rs-hero__meta-item">
              <Icon name="mapPin" size={15} />
              <Ed path="address" label="editor.inline.f.address" />
            </span>
          </div>
        </div>
      </section>
    )
  }

  if (style === 'split') {
    return (
      <section className="rs-hero rs-hero--split">
        <div className="rs-hero__grid rs-shell">
          <div className="rs-hero__inner">
            {body}
            <div className="rs-hero__meta">
              <span className="rs-hero__meta-item">
                <Icon name="clock" size={15} />
                {hoursMeta}
              </span>
              <span className="rs-hero__meta-item">
                <Icon name="star" size={15} />
                <Ed
                  path="copy.hero.favourite"
                  fallback={t('web.site.hero.favourite')}
                  label="editor.inline.f.heroNote"
                />
              </span>
            </div>
          </div>
          <figure className="rs-hero__figure">
            <EdImage
              path="heroImage"
              src={heroImage}
              alt={t('web.site.hero.signatureAlt', { name: tx(r.name) })}
              eager
              label="editor.inline.f.photo"
              style={imageFitStyle((r as any).heroImageFit) as any}
            />
            <ResponsiveHeroMedia r={r} poster={heroPoster} />
            <figcaption className="rs-hero__float">
              <Icon name="utensils" size={15} />
              <Ed path="name" label="editor.inline.f.name" />
              <span>
                {' � '}
                <Ed
                  path="copy.hero.chip"
                  fallback={getTemplate(r.templateId).category}
                  label="editor.inline.f.chip"
                />
              </span>
            </figcaption>
          </figure>
        </div>
      </section>
    )
  }

  return (
    <section className="rs-hero rs-hero--editorial">
      <div className="rs-hero__inner rs-shell">
        {body}
        <figure className="rs-hero__figure">
          <EdImage
            path="heroImage"
            src={heroImage}
            alt={t('web.site.hero.diningAlt', { name: tx(r.name) })}
            eager
            label="editor.inline.f.photo"
            style={imageFitStyle((r as any).heroImageFit) as any}
          />
          <ResponsiveHeroMedia r={r} poster={heroPoster} />
        </figure>
      </div>
    </section>
  )
}

/* -------------------------------- sections -------------------------------- */

function SectionHead({
  eyebrow,
  title,
  sub,
  split,
  action,
  copyKey,
  titlePath,
  subPath,
}: {
  eyebrow: string
  title: string
  sub?: string
  split?: boolean
  action?: React.ReactNode
  /** copy namespace, e.g. `featured` → the `copy.featured.*` overrides */
  copyKey: string
  /** lets a section bind the title to real data (the menu edits its category) */
  titlePath?: string
  subPath?: string
}) {
  return (
    <div className={cx('rs-head', split && 'rs-head--split')}>
      <div>
        <Ed
          as="span"
          path={`copy.${copyKey}.eyebrow`}
          fallback={eyebrow}
          className="rs-eyebrow"
          label="editor.inline.f.eyebrow"
        />
        <Ed
          as="h2"
          path={titlePath ?? `copy.${copyKey}.title`}
          fallback={title}
          className="rs-head__title"
          style={{ marginTop: '0.45rem' }}
          label="editor.inline.f.title"
        />
        {sub ? (
          <Ed
            as="p"
            path={subPath ?? `copy.${copyKey}.sub`}
            fallback={sub}
            className="rs-head__sub"
            style={{ marginTop: '0.6rem' }}
            multiline
            label="editor.inline.f.subtitle"
          />
        ) : null}
      </div>
      {action}
    </div>
  )
}

function Price({ item, base }: { item: MenuItem; base?: string }) {
  if (item.compareAt && item.compareAt > item.price) {
    return (
      <span className="rs-item__price">
        <del>{money(item.compareAt)}</del>
        <ins>{money(item.price)}</ins>
      </span>
    )
  }
  if (base) {
    return (
      <Ed
        numeric
        path={`${base}.price`}
        format={moneyFormat}
        as="span"
        className="rs-item__price"
        label="editor.inline.f.price"
      />
    )
  }
  return <span className="rs-item__price">{money(item.price)}</span>
}

function Badges({ item }: { item: MenuItem }) {
  const { t } = useI18n()
  if (item.available && item.featured) {
    return (
      <span className="rs-badge"><Ed path="copy.site.badges.chefsPick" fallback={t('web.site.badges.chefsPick')} label="editor.inline.f.badge" /></span>
    )
  }
  if (item.available && item.popular) {
    return <span className="rs-badge rs-badge--soft"><Ed path="copy.site.badges.popular" fallback={t('web.site.badges.popular')} label="editor.inline.f.badge" /></span>
  }
  if (!item.available) {
    return <span className="rs-badge rs-badge--muted"><Ed path="copy.site.badges.soldOut" fallback={t('web.site.badges.soldOut')} label="editor.inline.f.badge" /></span>
  }
  return null
}

function FeaturedSection({ r, prefix }: { r: Restaurant; prefix: string }) {
  const { t } = useI18n()
  const items = r.menu
    .flatMap((c, ci) =>
      c.items.map((i, ii) => ({
        item: i,
        category: c.name,
        base: `menu.${ci}.items.${ii}`,
        categoryPath: `menu.${ci}.name`,
      }))
    )
    .filter((entry) => entry.item.featured && entry.item.available)
    .slice(0, 3)

  return (
    <section className="rs-section rs-featured" id={`${prefix}rs-featured`}>
      <div className="rs-shell">
        <SectionHead
          copyKey="featured"
          eyebrow={t('web.site.featured.eyebrow')}
          title={t('web.site.featured.title')}
          sub={t('web.site.featured.sub')}
        />
        {items.length === 0 ? (
          <p className="rs-muted" style={{ fontSize: '0.95em' }}>
            <Ed
              path="copy.featured.empty"
              fallback={t('web.site.featured.empty')}
              multiline
              label="editor.inline.f.note"
            />
          </p>
        ) : (
          <div className="rs-featured__grid">
            {items.map(({ item, category, base, categoryPath }) => (
              <article key={item.id} className="rs-feature-card">
                <div className="rs-feature-card__media">
                  <EdImage path={`${base}.image`} src={item.image} alt={item.name} label="editor.inline.f.photo" style={imageFitStyle(item.imageFit) as any} />
                  <span className="rs-feature-card__tag rs-badge">
                    <Ed
                      path="copy.featured.tag"
                      fallback={t('web.site.featured.tag')}
                      label="editor.inline.f.badge"
                    />
                  </span>
                </div>
                <div className="rs-feature-card__body">
                  <div className="rs-feature-card__row">
                    <Ed as="h3" path={`${base}.name`} className="rs-feature-card__name" label="editor.inline.f.dishName" />
                    <Ed
                      numeric
                      path={`${base}.price`}
                      format={moneyFormat}
                      as="span"
                      className="rs-feature-card__price"
                      label="editor.inline.f.price"
                    />
                  </div>
                  <Ed
                    as="p"
                    path={`${base}.description`}
                    className="rs-feature-card__desc"
                    multiline
                    label="editor.inline.f.dishDesc"
                  />
                  <span
                    className="rs-muted"
                    style={{ fontSize: '0.74em', letterSpacing: '0.14em', textTransform: 'uppercase' }}
                  >
                    <Ed path={categoryPath} fallback={category} label="editor.inline.f.category" />
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

/** live dish count for the `{count}` placeholder in editable chip copy */
function dishCount(restaurant: Restaurant): number {
  return restaurant.menu.reduce((sum, c) => sum + c.items.length, 0)
}

/** `{count}` tokens get replaced; legacy saved strings with a baked-in number get their first number swapped */
function dishCountFormat(count: number) {
  const n = String(count)
  return (raw: string) => (raw.includes('{count}') ? raw.split('{count}').join(n) : raw.replace(/\d+/, n))
}

function addToCart(restaurant: Restaurant, item: MenuItem) {
  useCartStore.getState().add({
    restaurantId: restaurant.id,
    slug: restaurant.slug,
    restaurantName: tx(restaurant.name) || 'Restaurant',
    item,
    displayName: tx(item.name) || 'Item',
    options: [],
    note: '',
  })
}

function MenuCard({ item, base, restaurant, editable = false, onDelete, orderingEnabled = true }: { item: MenuItem; base: string; restaurant: Restaurant; editable?: boolean; onDelete?: () => void; orderingEnabled?: boolean }) {
  const { t } = useI18n()
  return (
    <article className={cx('rs-item group relative overflow-hidden rounded-2xl bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md', !item.available && 'rs-item--out')}>
      <div className="rs-item__media">
        <EdImage path={`${base}.image`} src={item.image} alt={item.name} label="editor.inline.f.photo" style={imageFitStyle(item.imageFit) as any} />
        <div className="rs-item__badges">
          <Badges item={item} />
        </div>
      </div>
      <div className="rs-item__body">
        <div className="rs-item__row">
          <Ed as="h3" path={`${base}.name`} className="rs-item__name" label="editor.inline.f.dishName" />
          <span className="flex shrink-0 items-center gap-1.5">
            <Price item={item} base={base} />
            {editable && onDelete ? (
              <button
                type="button"
                onClick={async (e) => { e.stopPropagation(); if (await confirmDialog({ title: t('editor.deleteItemTitle', { defaultValue: 'حذف الصنف؟' }), message: t('editor.deleteItemConfirm', { defaultValue: 'سيتم حذف هذا الصنف من القائمة.' }), confirmLabel: t('common.delete'), cancelLabel: t('common.cancel'), tone: 'danger' })) onDelete() }}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(220,38,38,0.92)] text-[13px] leading-none text-white transition hover:bg-[rgba(220,38,38,1)]"
                aria-label="Delete item"
                title="Delete item"
              >
                ×
              </button>
            ) : null}
          </span>
        </div>
        <Ed
          as="p"
          path={`${base}.description`}
          className="rs-item__desc"
          multiline
          label="editor.inline.f.dishDesc"
        />
        {!item.available ? (
          <Ed as="span" path="copy.site.availability.backTomorrow" fallback={t('web.site.availability.backTomorrow')} className="rs-item__out-label" label="editor.inline.f.note" />
        ) : orderingEnabled ? (
          <button
            type="button"
            onClick={() => addToCart(restaurant, item)}
            className="rs-btn"
            style={{ marginTop: '0.5rem', display: 'inline-block', fontSize: '0.85rem', padding: '0.35rem 0.7rem' }}
          >
            <Ed as="span" path="copy.site.menu.add" fallback={t('web.site.menu.add', { defaultValue: 'Add to cart' })} label="editor.inline.f.addButton" />
          </button>
        ) : null}
      </div>
    </article>
  )
}

function MenuRow({ item, base, restaurant, editable = false, onDelete, orderingEnabled = true }: { item: MenuItem; base: string; restaurant: Restaurant; editable?: boolean; onDelete?: () => void; orderingEnabled?: boolean }) {
  const { t } = useI18n()
  return (
    <article className={cx('rs-item group relative overflow-hidden rounded-2xl bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md', !item.available && 'rs-item--out')}>
      <div className="rs-item__media">
        <EdImage path={`${base}.image`} src={item.image} alt={item.name} label="editor.inline.f.photo" style={imageFitStyle(item.imageFit) as any} />
      </div>
      <div className="rs-item__body">
        <div className="rs-item__row">
          <Ed as="h3" path={`${base}.name`} className="rs-item__name" label="editor.inline.f.dishName" />
          <span className="flex shrink-0 items-center gap-1.5">
            <Price item={item} base={base} />
            {editable && onDelete ? (
              <button
                type="button"
                onClick={async (e) => { e.stopPropagation(); if (await confirmDialog({ title: t('editor.deleteItemTitle', { defaultValue: 'حذف الصنف؟' }), message: t('editor.deleteItemConfirm', { defaultValue: 'سيتم حذف هذا الصنف من القائمة.' }), confirmLabel: t('common.delete'), cancelLabel: t('common.cancel'), tone: 'danger' })) onDelete() }}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(220,38,38,0.92)] text-[13px] leading-none text-white transition hover:bg-[rgba(220,38,38,1)]"
                aria-label="Delete item"
                title="Delete item"
              >
                ×
              </button>
            ) : null}
          </span>
        </div>
        <Ed
          as="p"
          path={`${base}.description`}
          className="rs-item__desc"
          multiline
          label="editor.inline.f.dishDesc"
        />
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.15rem' }}>
          <Badges item={item} />
          {!item.available ? (
            <Ed as="span" path="copy.site.availability.unavailable" fallback={t('web.site.availability.unavailable')} className="rs-item__out-label" label="editor.inline.f.note" />
          ) : null}
        </div>
        {item.available && orderingEnabled ? (
          <button
            type="button"
            onClick={() => addToCart(restaurant, item)}
            className="rs-btn"
            style={{ marginTop: '0.35rem', display: 'inline-block', fontSize: '0.85rem', padding: '0.35rem 0.7rem' }}
          >
            <Ed as="span" path="copy.site.menu.add" fallback={t('web.site.menu.add', { defaultValue: 'Add to cart' })} label="editor.inline.f.addButton" />
          </button>
        ) : null}
      </div>
    </article>
  )
}

function MenuBoardItem({ item, base, restaurant, orderingEnabled = true }: { item: MenuItem; base: string; restaurant: Restaurant; orderingEnabled?: boolean }) {
  const { t } = useI18n()
  return (
    <article className="rs-board-item">
      <div className="rs-board-item__row">
        <Ed as="h3" path={`${base}.name`} className="rs-board-item__name" label="editor.inline.f.dishName" />
        <span className="rs-board-item__dots" />
        <Ed numeric path={`${base}.price`} format={moneyFormat} as="span" className="rs-board-item__price" label="editor.inline.f.price" />
      </div>
      {item.description ? <Ed as="p" path={`${base}.description`} className="rs-board-item__desc" multiline label="editor.inline.f.dishDesc" /> : null}
      {orderingEnabled ? (
        <button type="button" className="rs-board-item__add" onClick={() => addToCart(restaurant, item)}>
          <Ed path="copy.site.menu.addShort" fallback={t('web.site.menu.addShort', { defaultValue: 'Add' })} label="editor.inline.f.addButton" />
        </button>
      ) : null}
    </article>
  )
}

function MenuCompactItem({ item, base, restaurant, editable = false, onDelete, orderingEnabled = true }: { item: MenuItem; base: string; restaurant: Restaurant; editable?: boolean; onDelete?: () => void; orderingEnabled?: boolean }) {
  return (
    <article className="rs-compact-item">
      <div className="rs-compact-item__thumb"><EdImage path={`${base}.image`} src={item.image} alt={item.name} label="editor.inline.f.photo" style={imageFitStyle(item.imageFit) as any} /></div>
      <div className="rs-compact-item__body">
        <Ed as="h3" path={`${base}.name`} className="rs-compact-item__name" label="editor.inline.f.dishName" />
        <Ed as="p" path={`${base}.description`} className="rs-compact-item__desc" multiline label="editor.inline.f.dishDesc" />
      </div>
      <Ed numeric path={`${base}.price`} format={moneyFormat} as="span" className="rs-compact-item__price" label="editor.inline.f.price" />
      {orderingEnabled ? (
        <button type="button" className="rs-compact-item__add" onClick={() => addToCart(restaurant, item)}>+</button>
      ) : null}
      {editable && onDelete ? <button type="button" onClick={onDelete} className="rs-compact-item__del" aria-label="Delete">×</button> : null}
    </article>
  )
}

function MenuItemsGrid({ items, baseFor, restaurant, editable = false, orderingEnabled = true }: { items: MenuItem[]; baseFor: (index: number, item: MenuItem) => { base: string; onDelete?: () => void }; restaurant: Restaurant; editable?: boolean; onMenuEdit?: any; orderingEnabled?: boolean }) {
  const layout = restaurant.design.layout.menuLayout
  if (layout === 'board') return <div className="rs-board">{items.map((it, idx) => { const { base } = baseFor(idx, it); return <MenuBoardItem key={it.id} item={it} base={base} restaurant={restaurant} orderingEnabled={orderingEnabled} /> })}</div>
  if (layout === 'compact') return <div className="rs-compact">{items.map((it, idx) => { const { base, onDelete } = baseFor(idx, it); return <MenuCompactItem key={it.id} item={it} base={base} restaurant={restaurant} editable={editable} onDelete={onDelete} orderingEnabled={orderingEnabled} /> })}</div>
  if (layout === 'deck') return <div className="rs-deck">{items.map((it, idx) => { const { base, onDelete } = baseFor(idx, it); return <MenuCard key={it.id} item={it} base={base} restaurant={restaurant} editable={editable} onDelete={onDelete} orderingEnabled={orderingEnabled} /> })}</div>
  const listMode = layout === 'list'
  return (
    <div className={listMode ? 'rs-list' : 'rs-menu__grid'}>
      {items.map((it, idx) => { const { base, onDelete } = baseFor(idx, it); return listMode ? <MenuRow key={it.id} item={it} base={base} restaurant={restaurant} editable={editable} onDelete={onDelete} orderingEnabled={orderingEnabled} /> : <MenuCard key={it.id} item={it} base={base} restaurant={restaurant} editable={editable} onDelete={onDelete} orderingEnabled={orderingEnabled} /> })}
    </div>
  )
}

function MenuSection({ r, prefix, editable = false, onMenuEdit, orderingEnabled = true }: { r: Restaurant; prefix: string; editable?: boolean; onMenuEdit?: (recipe: (draft: Restaurant) => void) => void; orderingEnabled?: boolean }) {
  const { t } = useI18n()
  const categories: MenuCategory[] = editable ? r.menu : r.menu.filter((c) => c.items.length > 0)
  const [selected, setSelected] = useState<string | null>(null)
  const current = categories.find((c) => c.id === selected) ?? categories[0]
  const currentIndex = current ? r.menu.indexOf(current) : -1
  const displayMode = (r.design.layout as any).menuDisplay || 'tabs'
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map())
  const [activeId, setActiveId] = useState<string | null>(null)

  // Scrollspy: highlight the tab of the section currently in view
  useEffect(() => {
    if (displayMode !== 'scroll-sticky' || editable) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.getAttribute('data-cat-id'))
        })
      },
      { rootMargin: '-90px 0px -65% 0px', threshold: 0 }
    )
    sectionRefs.current.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [categories.length, displayMode, editable])

  useEffect(() => {
    if (!activeId && categories[0]) setActiveId(categories[0].id)
  }, [categories.length, activeId])

  const scrollToCat = (id: string) => {
    const el = sectionRefs.current.get(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActiveId(id)
    // keep the active tab visible in the sticky bar
    const tabEl = document.querySelector(`[data-tab-id="${id}"]`) as HTMLElement | null
    if (tabEl) tabEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }

  // ---------- scroll-sticky presentation (stacked categories + sticky tabs + scrollspy) ----------
  if (displayMode === 'scroll-sticky' && !editable) {
    return (
      <section className="rs-section" id={`${prefix}rs-menu`}>
        <div className="rs-shell">
          <SectionHead
            copyKey="menu"
            eyebrow={t('web.site.menu.eyebrow')}
            title={t('web.site.menu.title', { defaultValue: 'Menu' } as any) || 'Menu'}
            sub={t('web.site.menu.noteFallback')}
            split
            action={<span className="rs-chip"><Ed path="copy.site.menu.dishesCount" fallback={t('web.site.menu.dishesCount', { count: dishCount(r) })} format={dishCountFormat(dishCount(r))} label="editor.inline.f.note" /></span>}
          />
          <div className="rs-menu__sticky" role="tablist" aria-label={t('web.site.menu.categoriesAria')}>
            {categories.map((cat) => (
              <button key={cat.id} type="button" data-tab-id={cat.id} aria-selected={activeId === cat.id} role="tab" className={`rs-menu__tab rs-menu__tab--sticky${activeId === cat.id ? ' is-active' : ''}`} onClick={() => scrollToCat(cat.id)}>
                <Ed path={`menu.${r.menu.indexOf(cat)}.name`} fallback={cat.name} label="editor.inline.f.category" /><span className="rs-menu__count">{cat.items.length}</span>
              </button>
            ))}
          </div>
          <div className="rs-menu__stack">
            {categories.map((cat) => {
              const idx = r.menu.indexOf(cat)
              return (
                <div key={cat.id} id={`${prefix}cat-${cat.id}`} data-cat-id={cat.id} ref={(el) => { if (el) sectionRefs.current.set(cat.id, el); else sectionRefs.current.delete(cat.id) }} className="rs-menu-cat">
                  <header className="rs-menu-cat__head">
                    <h3 className="rs-menu-cat__title"><Ed path={`menu.${idx}.name`} fallback={cat.name} label="editor.inline.f.category" /></h3>
                    {cat.note ? <Ed as="p" path={`menu.${idx}.note`} fallback={cat.note} className="rs-menu-cat__note" multiline label="editor.inline.f.note" /> : null}
                  </header>
                  <MenuItemsGrid
                    items={cat.items}
                    restaurant={r}
                    orderingEnabled={orderingEnabled}
                    baseFor={(itemIdx) => ({ base: `menu.${idx}.items.${itemIdx}` })}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="rs-section" id={`${prefix}rs-menu`}>
      <div className="rs-shell">
        <SectionHead
          copyKey="menu"
          eyebrow={t('web.site.menu.eyebrow')}
          title={current ? current.name : t('web.site.menu.noCategory')}
          titlePath={current ? `menu.${currentIndex}.name` : undefined}
          sub={current?.note || t('web.site.menu.noteFallback')}
          subPath={current ? `menu.${currentIndex}.note` : undefined}
          split
          action={
            <span className="rs-chip" style={{ alignSelf: 'flex-start' }}>
              <Ed path="copy.site.menu.dishesCount" fallback={t('web.site.menu.dishesCount', { count: dishCount(r) })} format={dishCountFormat(dishCount(r))} label="editor.inline.f.note" />
            </span>
          }
        />

        {categories.length === 0 ? (
          <div
            style={{
              padding: '3rem 1.5rem',
              textAlign: 'center',
              border: '1px dashed var(--rs-border)',
              borderRadius: 'var(--rs-radius)',
              color: 'var(--rs-muted)',
            }}
          >
            <Icon name="book" size={26} />
            <Ed as="p" path="copy.site.menu.updating" fallback={t('web.site.menu.updating')} style={{ marginTop: '0.7rem', fontWeight: 600 }} label="editor.inline.f.note" />
            <Ed as="p" path="copy.site.menu.updatingSub" fallback={t('web.site.menu.updatingSub')} style={{ fontSize: '0.9em' }} label="editor.inline.f.note" />
          </div>
        ) : (
          <>
            <div
              className="rs-menu__tabs"
              role="tablist"
              aria-label={t('web.site.menu.categoriesAria')}
            >
              {categories.map((category) => (
                <button
                  key={category.id}
                  role="tab"
                  type="button"
                  aria-selected={current?.id === category.id}
                  className="rs-menu__tab"
                  onClick={() => setSelected(category.id)}
                >
                  <Ed path={`menu.${r.menu.indexOf(category)}.name`} fallback={category.name} label="editor.inline.f.category" />
                  <span className="rs-menu__count">{category.items.length}</span>
                </button>
              ))}
              {editable && onMenuEdit ? (
                <button
                  type="button"
                  className="rs-menu__tab"
                  style={{ borderStyle: 'dashed' }}
                  onClick={() => {
                    // اسم افتراضي — يُعدّل بالضغط عليه مباشرة في رأس القسم (titlePath)
                    const id = `cat-${Date.now()}`
                    onMenuEdit((draft) => {
                      if (!Array.isArray(draft.menu)) draft.menu = []
                      draft.menu.push({ id, name: 'New Category', note: '', items: [] })
                    })
                    setSelected(id)
                  }}
                >
                  + Add category
                </button>
              ) : null}
            </div>

            <MenuItemsGrid
              items={current?.items || []}
              restaurant={r}
              editable={editable}
              orderingEnabled={orderingEnabled}
              baseFor={(itemIdx) => {
                const onDelete = editable && onMenuEdit
                  ? () => onMenuEdit((draft) => {
                      const cat = draft.menu[currentIndex]
                      if (cat && Array.isArray(cat.items)) cat.items.splice(itemIdx, 1)
                    })
                  : undefined
                return { base: `menu.${currentIndex}.items.${itemIdx}`, onDelete }
              }}
            />
            <div style={{ marginTop: '1rem' }}>
              {editable && onMenuEdit && current ? (
                <button
                  type="button"
                  onClick={() => {
                    // صنف افتراضي بسعر صفر — الاسم والسعر والوصف والصورة تُعدَّل بالضغط المباشر
                    onMenuEdit((draft) => {
                      const cat = draft.menu[currentIndex]
                      if (!cat) return
                      if (!Array.isArray(cat.items)) cat.items = []
                      cat.items.push({ id: `item-${Date.now()}`, name: 'New dish', description: '', price: 0, compareAt: null, available: true, featured: false, popular: false, image: '' })
                    })
                  }}
                  style={{
                    minHeight: '8rem',
                    border: '2px dashed var(--rs-border)',
                    borderRadius: 'var(--rs-radius)',
                    background: 'transparent',
                    color: 'var(--rs-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    fontWeight: 600,
                  }}
                >
                  + Add item
                </button>
              ) : null}
            </div>
          </>
        )}
      </div>
    </section>
  )
}

function AboutSection({ r, prefix }: { r: Restaurant; prefix: string }) {
  const { t } = useI18n()
  const dishCount = r.menu.reduce((sum, c) => sum + c.items.length, 0)

  return (
    <section className="rs-section" id={`${prefix}rs-about`}>
      <div className="rs-about__grid rs-shell">
        <figure className="rs-about__figure">
          <EdImage
            path="gallery.0"
            src={r.gallery[0] ?? r.heroImage}
            alt={t('web.site.about.interiorAlt', { name: tx(r.name) })}
            label="editor.inline.f.photo"
            style={imageFitStyle(r.galleryFits?.[0]) as any}
          />
        </figure>
        <div className="rs-about__body">
          <Ed
            as="span"
            path="copy.about.eyebrow"
            fallback={t('web.site.about.eyebrow')}
            className="rs-eyebrow"
            label="editor.inline.f.eyebrow"
          />
          <Ed as="h2" path="name" className="rs-about__title" label="editor.inline.f.name" />
          <Ed
            as="p"
            path="description"
            className="rs-about__text"
            multiline
            label="editor.inline.f.paragraph"
          />
          <Ed
            as="p"
            path="copy.about.body"
            fallback={t('web.site.about.body')}
            className="rs-about__text"
            multiline
            label="editor.inline.f.paragraph"
          />
          <div className="rs-about__sign">
            <Ed
              path="copy.about.sign"
              fallback={t('web.site.about.sign')}
              label="editor.inline.f.sign"
            />
            {' '}
            <Ed path="name" label="editor.inline.f.name" />
          </div>
          <div className="rs-about__facts">
            <div className="rs-about__fact">
              <strong>{dishCount}</strong>
              <Ed
                path="copy.about.fact1"
                fallback={t('web.site.about.fact1')}
                label="editor.inline.f.fact"
              />
            </div>
            <div className="rs-about__fact">
              <strong>{r.menu.length}</strong>
              <Ed
                path="copy.about.fact2"
                fallback={t('web.site.about.fact2')}
                label="editor.inline.f.fact"
              />
            </div>
            <div className="rs-about__fact">
              <strong>100%</strong>
              <Ed
                path="copy.about.fact3"
                fallback={t('web.site.about.fact3')}
                label="editor.inline.f.fact"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function GallerySection({ r, prefix }: { r: Restaurant; prefix: string }) {
  const { t } = useI18n()
  return (
    <section className="rs-section rs-gallery" id={`${prefix}rs-gallery`}>
      <div className="rs-shell">
        <SectionHead
          copyKey="gallery"
          eyebrow={t('web.site.gallery.eyebrow')}
          title={t('web.site.gallery.title')}
          sub={t('web.site.gallery.sub')}
        />
        <div className="rs-gallery__grid">
          {r.gallery.map((src, index) => (
            <div className="rs-gallery__item" key={`${src}-${index}`}>
              <EdImage
                path={`gallery.${index}`}
                src={src}
                alt={t('web.site.gallery.imageAlt', { name: tx(r.name), index: index + 1 })}
                label="editor.inline.f.galleryPhoto"
                style={imageFitStyle(r.galleryFits?.[index]) as any}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function HoursSection({ r, prefix }: { r: Restaurant; prefix: string }) {
  const { t } = useI18n()
  return (
    <section className="rs-section" id={`${prefix}rs-hours`}>
      <div className="rs-shell">
        <div className="rs-hours__panel">
          <div className="rs-hours__list">
            {r.hours.map((row, index) => (
              <div className="rs-hours__row" key={`${row.day}-${index}`}>
                <Ed path={`hours.${index}.day`} as="span" className="rs-hours__day" label="editor.inline.f.day" />
                <Ed
                  path={`hours.${index}.hours`}
                  as="span"
                  className="rs-hours__time"
                  label="editor.inline.f.hours"
                />
              </div>
            ))}
          </div>
          <div className="rs-hours__aside">
            <Ed
              as="span"
              path="copy.hours.eyebrow"
              fallback={t('web.site.hours.eyebrow')}
              className="rs-eyebrow"
              label="editor.inline.f.eyebrow"
            />
            <Ed
              as="h2"
              path="copy.hours.title"
              fallback={t('web.site.hours.title')}
              className="rs-hours__title"
              label="editor.inline.f.title"
            />
            <Ed
              as="p"
              path="copy.hours.body"
              fallback={t('web.site.hours.body')}
              className="rs-muted"
              style={{ fontSize: '0.92em' }}
              multiline
              label="editor.inline.f.sectionNote"
            />
            <a className="rs-btn" href={`tel:${r.phone.replace(/[^+\d]/g, '')}`}>
              <Icon name="phone" size={16} />
              <Ed path="phone" label="editor.inline.f.phone" />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

function ContactSection({ r, prefix }: { r: Restaurant; prefix: string }) {
  const { t } = useI18n()
  const cards = [
    { icon: 'mapPin', label: t('web.site.contact.findUs'), value: r.address, path: 'address' },
    { icon: 'phone', label: t('web.site.contact.call'), value: r.phone, path: 'phone' },
    { icon: 'mail', label: t('web.site.contact.email'), value: r.email, path: 'email' },
  ]

  return (
    <section className="rs-section" id={`${prefix}rs-contact`}>
      <div className="rs-shell">
        <SectionHead
          copyKey="contact"
          eyebrow={t('web.site.contact.eyebrow')}
          title={t('web.site.contact.title')}
          sub={t('web.site.contact.sub')}
        />
        <div className="rs-contact__grid">
          <div className="rs-contact__cards">
            {cards.map((card, index) => (
              <div className="rs-contact__card" key={card.label}>
                <span className="rs-contact__icon">
                  <Icon name={card.icon} size={17} />
                </span>
                <span>
                  <Ed
                    as="span"
                    path={`copy.contact.card${index + 1}`}
                    fallback={card.label}
                    className="rs-contact__label"
                    label="editor.inline.f.contactLabel"
                  />
                  <Ed
                    as="span"
                    path={card.path}
                    className="rs-contact__value"
                    label="editor.inline.f.contactValue"
                  />
                </span>
              </div>
            ))}
          </div>
          <div className="rs-map">
            <span className="rs-map__pin">
              <Icon name="mapPin" size={19} />
            </span>
            <div className="rs-map__label">
              <Icon name="globe" size={15} />
              {r.slug}.example.com
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* --------------------------------- footer --------------------------------- */

function SiteFooter({
  r,
  nav,
  anchor,
  prefix,
}: {
  r: Restaurant
  nav: SectionId[]
  anchor: (id: string) => string
  prefix: string
}) {
  const { t } = useI18n()
  const year = new Date().getFullYear()
  const inline = useInlineEdit()
  const editing = Boolean(inline?.enabled)

  // socials live on the restaurant; empty values fall back to the template sample
  const sampleSocials = getTemplate(r.templateId).sample.socials
  const instagram = r.socials.instagram.trim() || sampleSocials.instagram.trim()
  const facebook = r.socials.facebook.trim() || sampleSocials.facebook.trim()
  const website = r.socials.website.trim() || sampleSocials.website.trim()

  const profileHref = (base: string, handle: string) => `${base}/${handle.replace(/^@/, '')}`
  const siteHref = (value: string) => (/^https?:\/\//i.test(value) ? value : `https://${value}`)

  return (
    <footer className="rs-footer">
      <div className="rs-shell">
        <div className="rs-footer__grid">
          <div className="rs-footer__brand">
            <a className={cx('rs-logo', `rs-logo--${r.logoStyle}`)} href={`#${prefix}rs-top`}>
              <Ed path="logoText" as="span" className="rs-logo__mark" label="editor.inline.f.logo" />
              <span>
                <Ed path="name" as="span" className="rs-logo__name" label="editor.inline.f.name" />
                <Ed
                  path="copy.header.category"
                  fallback={getTemplate(r.templateId).category}
                  as="span"
                  className="rs-logo__sub"
                  label="editor.inline.f.category"
                />
              </span>
            </a>
            <Ed as="p" path="tagline" className="rs-footer__blurb" multiline label="editor.inline.f.tagline" />
            <div className="rs-socials">
              {instagram ? (
                <a
                  href={editing ? undefined : profileHref('https://instagram.com', instagram)}
                  target={editing ? undefined : '_blank'}
                  rel="noreferrer"
                  aria-label={`Instagram ${instagram}`}
                >
                  <Icon name="instagram" size={16} />
                  <Ed
                    as="span"
                    path="socials.instagram"
                    className="rs-socials__handle"
                    label="editor.inline.f.socialInstagram"
                  />
                </a>
              ) : null}
              {facebook ? (
                <a
                  href={editing ? undefined : profileHref('https://facebook.com', facebook)}
                  target={editing ? undefined : '_blank'}
                  rel="noreferrer"
                  aria-label={`Facebook ${facebook}`}
                >
                  <Icon name="facebook" size={16} />
                  <Ed
                    as="span"
                    path="socials.facebook"
                    className="rs-socials__handle"
                    label="editor.inline.f.socialFacebook"
                  />
                </a>
              ) : null}
              {website ? (
                <a
                  href={editing ? undefined : siteHref(website)}
                  target={editing ? undefined : '_blank'}
                  rel="noreferrer"
                  aria-label={`${t('web.site.footer.websiteAria')} ${website}`}
                >
                  <Icon name="globe" size={16} />
                  <Ed
                    as="span"
                    path="socials.website"
                    className="rs-socials__handle"
                    label="editor.inline.f.socialWebsite"
                  />
                </a>
              ) : null}
            </div>
          </div>

          <div>
            <Ed
              as="div"
              path="copy.footer.explore"
              fallback={t('web.site.footer.explore')}
              className="rs-footer__title"
              label="editor.inline.f.footerTitle"
            />
            <div className="rs-footer__links">
              {nav.map((id) => (
                <a key={id} href={anchor(id)}>
                  <Ed
                    path={`copy.nav.${id}`}
                    fallback={t(SECTION_LABELS[id])}
                    label="editor.inline.f.navLink"
                  />
                </a>
              ))}
            </div>
          </div>

          <div>
            <Ed
              as="div"
              path="copy.footer.visit"
              fallback={t('web.site.footer.visit')}
              className="rs-footer__title"
              label="editor.inline.f.footerTitle"
            />
            <div className="rs-footer__links">
              <Ed path="address" label="editor.inline.f.address" />
              <a href={`tel:${r.phone.replace(/[^+\d]/g, '')}`}>
                <Ed path="phone" label="editor.inline.f.phone" />
              </a>
              <a href={`mailto:${r.email}`}>
                <Ed path="email" label="editor.inline.f.email" />
              </a>
            </div>
          </div>

          <div>
            <Ed
              as="div"
              path="copy.footer.hours"
              fallback={t('web.site.footer.hours')}
              className="rs-footer__title"
              label="editor.inline.f.footerTitle"
            />
            <div className="rs-footer__links">
              {r.hours.map((row, index) => (
                <span key={`${row.day}-${index}`}>
                  <Ed path={`hours.${index}.day`} label="editor.inline.f.day" />
                  {' � '}
                  <Ed path={`hours.${index}.hours`} label="editor.inline.f.hours" />
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="rs-footer__bottom">
          <span>
            � {year} <strong><Ed path="name" label="editor.inline.f.name" /></strong>
            <Ed
              path="copy.footer.rights"
              fallback={t('web.site.footer.rights')}
              label="editor.inline.f.note"
            />
          </span>
          <span>
            <Ed path="copy.site.footer.publishedWith" fallback={t('web.site.footer.publishedWith')} label="editor.inline.f.footerTitle" /> <strong>Digital Menu</strong> · {r.slug}.example.com
          </span>
        </div>
      </div>
    </footer>
  )
}
