import { useState, type CSSProperties } from 'react'
import type { MenuCategory, MenuItem, Restaurant, SectionId } from '../../lib/types'
import { fontStack } from '../../lib/fonts'
import { getTemplate } from '../../lib/templates'
import { cx, mix, money, readableOn } from '../../lib/utils'
import { Icon } from '../icons'
import { Img } from '../ui'
import './site.css'

const SPACES = ['0.84', '1', '1.18'] as const

const ASPECTS: Record<string, string> = {
  square: '1 / 1',
  portrait: '4 / 5',
  landscape: '4 / 3',
  wide: '16 / 9',
}

const SECTION_LABELS: Record<SectionId, string> = {
  featured: 'Featured',
  menu: 'Menu',
  about: 'Our Story',
  gallery: 'Gallery',
  hours: 'Opening Hours',
  contact: 'Contact',
}

const NAV_SECTIONS: SectionId[] = ['menu', 'about', 'gallery', 'hours', 'contact']

function designVars(r: Restaurant): CSSProperties {
  const { colors: c, typography: t, layout: l } = r.design
  return {
    '--rs-bg': c.background,
    '--rs-text': c.text,
    '--rs-card': c.card,
    '--rs-primary': c.primary,
    '--rs-secondary': c.secondary,
    '--rs-accent': c.accent,
    '--rs-button': c.button,
    '--rs-on-button': readableOn(c.button),
    '--rs-border': mix(c.text, c.background, 0.15),
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
}

export function RestaurantSite({
  restaurant: r,
  interactive = true,
  mode = 'site',
  idPrefix = '',
}: RestaurantSiteProps) {
  const { layout } = r.design
  const enabled = r.design.sections.filter((s) => s.enabled).map((s) => s.id)
  const nav = NAV_SECTIONS.filter((id) => enabled.includes(id))
  const anchor = (id: string) => `#${idPrefix}rs-${id}`

  return (
    <div
      className="rs"
      style={designVars(r)}
      data-theme={layout.theme}
      data-card={layout.card}
      data-mode={mode}
      data-interactive={interactive ? 'true' : 'false'}
      id={`${idPrefix}rs-top`}
    >
      <SiteHeader r={r} nav={nav} anchor={anchor} prefix={idPrefix} />
      <SiteHero r={r} anchor={anchor} />

      {enabled.includes('featured') ? <FeaturedSection r={r} prefix={idPrefix} /> : null}
      {enabled.includes('menu') ? <MenuSection r={r} prefix={idPrefix} /> : null}
      {enabled.includes('about') ? <AboutSection r={r} prefix={idPrefix} /> : null}
      {enabled.includes('gallery') && r.gallery.length > 0 ? <GallerySection r={r} prefix={idPrefix} /> : null}
      {enabled.includes('hours') ? <HoursSection r={r} prefix={idPrefix} /> : null}
      {enabled.includes('contact') ? <ContactSection r={r} prefix={idPrefix} /> : null}

      <SiteFooter r={r} nav={nav} anchor={anchor} prefix={idPrefix} />
    </div>
  )
}

/* --------------------------------- header --------------------------------- */

function SiteHeader({
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
  const [open, setOpen] = useState(false)
  const category = getTemplate(r.templateId).category

  const links = nav.map((id) => (
    <a key={id} className="rs-nav__link" href={anchor(id)}>
      {SECTION_LABELS[id]}
    </a>
  ))

  return (
    <header className={cx('rs-header', `rs-header--${r.design.layout.header}`)}>
      <div className="rs-header__inner rs-shell">
        <a className={cx('rs-logo', `rs-logo--${r.logoStyle}`)} href={`#${prefix}rs-top`}>
          <span className="rs-logo__mark">{r.logoText}</span>
          <span>
            <span className="rs-logo__name">{r.name}</span>
            <span className="rs-logo__sub">{category}</span>
          </span>
        </a>

        <nav className="rs-nav" aria-label="Menu sections">
          {links}
        </nav>

        <div className="rs-header__actions">
          <span className="rs-header__phone">{r.phone}</span>
          <a className="rs-btn rs-header__cta" href={anchor('contact')}>
            Book a Table
          </a>
          <button
            type="button"
            className="rs-burger"
            aria-label={open ? 'Close navigation' : 'Open navigation'}
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
              {SECTION_LABELS[id]}
            </a>
          ))}
          <a className="rs-btn" href={anchor('contact')} onClick={() => setOpen(false)}>
            Book a Table
          </a>
        </div>
      ) : null}
    </header>
  )
}

/* ---------------------------------- hero ---------------------------------- */

function SiteHero({ r, anchor }: { r: Restaurant; anchor: (id: string) => string }) {
  const style = r.design.layout.hero
  const firstHours = r.hours[0]

  const body = (
    <>
      <span className="rs-chip">{getTemplate(r.templateId).name} template</span>
      <h1 className="rs-hero__title">{style === 'split' ? r.name : r.tagline}</h1>
      <p className="rs-hero__lead">
        {style === 'split' ? r.tagline : r.description}
      </p>
      <div className="rs-hero__actions">
        <a className="rs-btn rs-btn--accent" href={anchor('menu')}>
          View the Menu
        </a>
        <a className="rs-btn rs-btn--ghost" href={anchor('contact')}>
          Book a Table
        </a>
      </div>
    </>
  )

  if (style === 'fullscreen') {
    return (
      <section className="rs-hero rs-hero--fullscreen">
        <div
          className="rs-hero__media"
          style={{ backgroundImage: `url(${r.heroImage})` }}
          role="img"
          aria-label={`${r.name} ambience`}
        />
        <div className="rs-hero__overlay" />
        <div className="rs-hero__inner">
          <span className="rs-chip">{getTemplate(r.templateId).category}</span>
          <h1 className="rs-hero__title">{r.name}</h1>
          <p className="rs-hero__lead">{r.tagline}</p>
          <div className="rs-hero__actions">
            <a className="rs-btn rs-btn--accent" href={anchor('menu')}>
              View the Menu
            </a>
            <a className="rs-btn rs-btn--ghost" href={anchor('contact')}>
              Book a Table
            </a>
          </div>
          <div className="rs-hero__meta">
            <span className="rs-hero__meta-item">
              <Icon name="clock" size={15} />
              {firstHours ? `${firstHours.day} · ${firstHours.hours}` : 'Open daily'}
            </span>
            <span className="rs-hero__meta-item">
              <Icon name="mapPin" size={15} />
              {r.address}
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
                {firstHours ? `${firstHours.day} · ${firstHours.hours}` : 'Open daily'}
              </span>
              <span className="rs-hero__meta-item">
                <Icon name="star" size={15} />
                Guest favourite
              </span>
            </div>
          </div>
          <figure className="rs-hero__figure">
            <Img src={r.heroImage} alt={`${r.name} signature dish`} eager />
            <figcaption className="rs-hero__float">
              <Icon name="utensils" size={15} />
              {r.name} <span>· {getTemplate(r.templateId).category}</span>
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
          <Img src={r.heroImage} alt={`${r.name} dining room`} eager />
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
}: {
  eyebrow: string
  title: string
  sub?: string
  split?: boolean
  action?: React.ReactNode
}) {
  return (
    <div className={cx('rs-head', split && 'rs-head--split')}>
      <div>
        <span className="rs-eyebrow">{eyebrow}</span>
        <h2 className="rs-head__title" style={{ marginTop: '0.45rem' }}>
          {title}
        </h2>
        {sub ? <p className="rs-head__sub" style={{ marginTop: '0.6rem' }}>{sub}</p> : null}
      </div>
      {action}
    </div>
  )
}

function Price({ item }: { item: MenuItem }) {
  if (item.compareAt && item.compareAt > item.price) {
    return (
      <span className="rs-item__price">
        <del>{money(item.compareAt)}</del>
        <ins>{money(item.price)}</ins>
      </span>
    )
  }
  return <span className="rs-item__price">{money(item.price)}</span>
}

function Badges({ item }: { item: MenuItem }) {
  if (item.available && item.featured) {
    return (
      <span className="rs-badge">Chef’s pick</span>
    )
  }
  if (item.available && item.popular) {
    return <span className="rs-badge rs-badge--soft">Popular</span>
  }
  if (!item.available) {
    return <span className="rs-badge rs-badge--muted">Sold out</span>
  }
  return null
}

function FeaturedSection({ r, prefix }: { r: Restaurant; prefix: string }) {
  const items = r.menu
    .flatMap((c) => c.items.map((i) => ({ item: i, category: c.name })))
    .filter((entry) => entry.item.featured && entry.item.available)
    .slice(0, 3)

  return (
    <section className="rs-section rs-featured" id={`${prefix}rs-featured`}>
      <div className="rs-shell">
        <SectionHead
          eyebrow="Chef’s selection"
          title="Featured dishes"
          sub="The plates we would order for you, updated with every service."
        />
        {items.length === 0 ? (
          <p className="rs-muted" style={{ fontSize: '0.95em' }}>
            No featured dishes yet — ask the kitchen what is good today.
          </p>
        ) : (
          <div className="rs-featured__grid">
            {items.map(({ item, category }) => (
              <article key={item.id} className="rs-feature-card">
                <div className="rs-feature-card__media">
                  <Img src={item.image} alt={item.name} />
                  <span className="rs-feature-card__tag rs-badge">Chef’s pick</span>
                </div>
                <div className="rs-feature-card__body">
                  <div className="rs-feature-card__row">
                    <h3 className="rs-feature-card__name">{item.name}</h3>
                    <span className="rs-feature-card__price">{money(item.price)}</span>
                  </div>
                  <p className="rs-feature-card__desc">{item.description}</p>
                  <span className="rs-muted" style={{ fontSize: '0.74em', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                    {category}
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

function MenuCard({ item }: { item: MenuItem }) {
  return (
    <article className={cx('rs-item', !item.available && 'rs-item--out')}>
      <div className="rs-item__media">
        <Img src={item.image} alt={item.name} />
        <div className="rs-item__badges">
          <Badges item={item} />
        </div>
      </div>
      <div className="rs-item__body">
        <div className="rs-item__row">
          <h3 className="rs-item__name">{item.name}</h3>
          <Price item={item} />
        </div>
        <p className="rs-item__desc">{item.description}</p>
        {!item.available ? <span className="rs-item__out-label">Back tomorrow</span> : null}
      </div>
    </article>
  )
}

function MenuRow({ item }: { item: MenuItem }) {
  return (
    <article className={cx('rs-item', !item.available && 'rs-item--out')}>
      <div className="rs-item__media">
        <Img src={item.image} alt={item.name} />
      </div>
      <div className="rs-item__body">
        <div className="rs-item__row">
          <h3 className="rs-item__name">{item.name}</h3>
          <Price item={item} />
        </div>
        <p className="rs-item__desc">{item.description}</p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.15rem' }}>
          <Badges item={item} />
          {!item.available ? <span className="rs-item__out-label">Currently unavailable</span> : null}
        </div>
      </div>
    </article>
  )
}

function MenuSection({ r, prefix }: { r: Restaurant; prefix: string }) {
  const categories: MenuCategory[] = r.menu.filter((c) => c.items.length > 0)
  const [selected, setSelected] = useState<string | null>(null)
  const current = categories.find((c) => c.id === selected) ?? categories[0]
  const listMode = r.design.layout.menuLayout === 'list'

  return (
    <section className="rs-section" id={`${prefix}rs-menu`}>
      <div className="rs-shell">
        <SectionHead
          eyebrow="The menu"
          title={current ? current.name : 'Our menu'}
          sub={current?.note || 'Freshly prepared, served all day.'}
          split
          action={
            <span className="rs-chip" style={{ alignSelf: 'flex-start' }}>
              {r.menu.reduce((sum, c) => sum + c.items.length, 0)} dishes
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
            <p style={{ marginTop: '0.7rem', fontWeight: 600 }}>The menu is being updated</p>
            <p style={{ fontSize: '0.9em' }}>Please check back in a few minutes.</p>
          </div>
        ) : (
          <>
            <div className="rs-menu__tabs" role="tablist" aria-label="Menu categories">
              {categories.map((category) => (
                <button
                  key={category.id}
                  role="tab"
                  type="button"
                  aria-selected={current?.id === category.id}
                  className="rs-menu__tab"
                  onClick={() => setSelected(category.id)}
                >
                  {category.name}
                  <span className="rs-menu__count">{category.items.length}</span>
                </button>
              ))}
            </div>

            <div className={listMode ? 'rs-list' : 'rs-menu__grid'}>
              {current?.items.map((menuItem) =>
                listMode ? (
                  <MenuRow key={menuItem.id} item={menuItem} />
                ) : (
                  <MenuCard key={menuItem.id} item={menuItem} />
                )
              )}
            </div>
          </>
        )}
      </div>
    </section>
  )
}

function AboutSection({ r, prefix }: { r: Restaurant; prefix: string }) {
  const dishCount = r.menu.reduce((sum, c) => sum + c.items.length, 0)

  return (
    <section className="rs-section" id={`${prefix}rs-about`}>
      <div className="rs-about__grid rs-shell">
        <figure className="rs-about__figure">
          <Img src={r.gallery[0] ?? r.heroImage} alt={`${r.name} interior`} />
        </figure>
        <div className="rs-about__body">
          <span className="rs-eyebrow">Our story</span>
          <h2 className="rs-about__title">{r.name}</h2>
          <p className="rs-about__text">{r.description}</p>
          <p className="rs-about__text">
            Everything is prepared in house each morning. We work with local growers, millers and
            roasters, and we change the menu whenever the season tells us to.
          </p>
          <div className="rs-about__sign">The team at {r.name}</div>
          <div className="rs-about__facts">
            <div className="rs-about__fact">
              <strong>{dishCount}</strong>
              <span>Dishes on the menu</span>
            </div>
            <div className="rs-about__fact">
              <strong>{r.menu.length}</strong>
              <span>Menu sections</span>
            </div>
            <div className="rs-about__fact">
              <strong>100%</strong>
              <span>Made in house</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function GallerySection({ r, prefix }: { r: Restaurant; prefix: string }) {
  return (
    <section className="rs-section rs-gallery" id={`${prefix}rs-gallery`}>
      <div className="rs-shell">
        <SectionHead
          eyebrow="Gallery"
          title="Inside the room"
          sub="A look at the plates, the pass and the people behind them."
        />
        <div className="rs-gallery__grid">
          {r.gallery.map((src, index) => (
            <div className="rs-gallery__item" key={`${src}-${index}`}>
              <Img src={src} alt={`${r.name} gallery image ${index + 1}`} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function HoursSection({ r, prefix }: { r: Restaurant; prefix: string }) {
  return (
    <section className="rs-section" id={`${prefix}rs-hours`}>
      <div className="rs-shell">
        <div className="rs-hours__panel">
          <div className="rs-hours__list">
            {r.hours.map((row, index) => (
              <div className="rs-hours__row" key={`${row.day}-${index}`}>
                <span className="rs-hours__day">{row.day}</span>
                <span className="rs-hours__time">{row.hours}</span>
              </div>
            ))}
          </div>
          <div className="rs-hours__aside">
            <span className="rs-eyebrow">Opening hours</span>
            <h2 className="rs-hours__title">Come hungry, leave slow.</h2>
            <p className="rs-muted" style={{ fontSize: '0.92em' }}>
              The kitchen closes 30 minutes before the listed time. Walk-ins are always welcome,
              reservations recommended for weekends.
            </p>
            <a className="rs-btn" href={`tel:${r.phone.replace(/[^+\d]/g, '')}`}>
              <Icon name="phone" size={16} />
              {r.phone}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

function ContactSection({ r, prefix }: { r: Restaurant; prefix: string }) {
  const cards = [
    { icon: 'mapPin', label: 'Find us', value: r.address },
    { icon: 'phone', label: 'Call', value: r.phone },
    { icon: 'mail', label: 'Email', value: r.email },
  ]

  return (
    <section className="rs-section" id={`${prefix}rs-contact`}>
      <div className="rs-shell">
        <SectionHead
          eyebrow="Contact"
          title="Reservations & directions"
          sub="Tables, takeaway and private dining — we answer within the hour during service."
        />
        <div className="rs-contact__grid">
          <div className="rs-contact__cards">
            {cards.map((card) => (
              <div className="rs-contact__card" key={card.label}>
                <span className="rs-contact__icon">
                  <Icon name={card.icon} size={17} />
                </span>
                <span>
                  <span className="rs-contact__label">{card.label}</span>
                  <span className="rs-contact__value">{card.value}</span>
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
              {r.slug}.menucraft.com <span>· simulated address</span>
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
  const year = new Date().getFullYear()

  return (
    <footer className="rs-footer">
      <div className="rs-shell">
        <div className="rs-footer__grid">
          <div className="rs-footer__brand">
            <a className={cx('rs-logo', `rs-logo--${r.logoStyle}`)} href={`#${prefix}rs-top`}>
              <span className="rs-logo__mark">{r.logoText}</span>
              <span>
                <span className="rs-logo__name">{r.name}</span>
                <span className="rs-logo__sub">{getTemplate(r.templateId).category}</span>
              </span>
            </a>
            <p className="rs-footer__blurb">{r.tagline}</p>
            <div className="rs-socials">
              <a href={`#${prefix}rs-top`} aria-label="Instagram">
                <Icon name="instagram" size={16} />
              </a>
              <a href={`#${prefix}rs-top`} aria-label="Facebook">
                <Icon name="facebook" size={16} />
              </a>
              <a href={`#${prefix}rs-top`} aria-label="Website">
                <Icon name="globe" size={16} />
              </a>
            </div>
          </div>

          <div>
            <div className="rs-footer__title">Explore</div>
            <div className="rs-footer__links">
              {nav.map((id) => (
                <a key={id} href={anchor(id)}>
                  {SECTION_LABELS[id]}
                </a>
              ))}
            </div>
          </div>

          <div>
            <div className="rs-footer__title">Visit</div>
            <div className="rs-footer__links">
              <span>{r.address}</span>
              <a href={`tel:${r.phone.replace(/[^+\d]/g, '')}`}>{r.phone}</a>
              <a href={`mailto:${r.email}`}>{r.email}</a>
            </div>
          </div>

          <div>
            <div className="rs-footer__title">Hours</div>
            <div className="rs-footer__links">
              {r.hours.map((row, index) => (
                <span key={`${row.day}-${index}`}>
                  {row.day} — {row.hours}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="rs-footer__bottom">
          <span>
            © {year} <strong>{r.name}</strong>. All rights reserved.
          </span>
          <span>
            Published with <strong>MenuCraft</strong> · {r.slug}.menucraft.com
          </span>
        </div>
      </div>
    </footer>
  )
}
