import { useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent } from 'react'
import type {
  InlineTextStyle,
  MenuCategory,
  MenuItem,
  Restaurant,
  SectionId,
} from '../../shared/lib/types.ts'
import { fontStack } from '../data/fonts.ts'
import { getTemplate } from '../data/templates.ts'
import { cx, mix, money, readableOn } from '../../shared/lib/utils.ts'
import { Icon } from '../../shared/ui/icons.tsx'
import {
  Ed,
  EdImage,
  InlineEditProvider,
  useInlineEdit,
  type ActiveField,
} from '../editor/inlineEdit.tsx'
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

/** `Ed format` helper â€” renders a raw stored number as a price */
const moneyFormat = (raw: string) => money(Number(raw) || 0)

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
  /** site = published page (sticky header) Â· preview = editor frame */
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
}: RestaurantSiteProps) {
  const { layout } = r.design
  const enabled = r.design.sections.filter((s) => s.enabled).map((s) => s.id)
  const nav = NAV_SECTIONS.filter((id) => enabled.includes(id))
  const anchor = (id: string) => `#${idPrefix}rs-${id}`
  const rootRef = useRef<HTMLDivElement | null>(null)

  // while editing, the frame must accept pointer events (text taps) while
  // anchor jumps stay neutralised â€” otherwise `data-interactive="false"`
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
        data-interactive={interactive || editable ? 'true' : 'false'}
        data-editable={editable ? 'true' : undefined}
        id={`${idPrefix}rs-top`}
        onClick={editable ? stopNavigation : undefined}
      >
        <SiteHeader r={r} nav={nav} anchor={anchor} prefix={idPrefix} />
        <SiteHero r={r} anchor={anchor} />

        {enabled.includes('featured') ? <FeaturedSection r={r} prefix={idPrefix} /> : null}
        {enabled.includes('menu') ? <MenuSection r={r} prefix={idPrefix} /> : null}
        {enabled.includes('about') ? <AboutSection r={r} prefix={idPrefix} /> : null}
        {enabled.includes('gallery') && r.gallery.length > 0 ? (
          <GallerySection r={r} prefix={idPrefix} />
        ) : null}
        {enabled.includes('hours') ? <HoursSection r={r} prefix={idPrefix} /> : null}
        {enabled.includes('contact') ? <ContactSection r={r} prefix={idPrefix} /> : null}

        <SiteFooter r={r} nav={nav} anchor={anchor} prefix={idPrefix} />
      </div>
    </InlineEditProvider>
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
      <Ed path={`copy.nav.${id}`} fallback={SECTION_LABELS[id]} label="editor.inline.f.navLink" />
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

        <nav className="rs-nav" aria-label="Menu sections">
          {links}
        </nav>

        <div className="rs-header__actions">
          <Ed path="phone" as="span" className="rs-header__phone" label="editor.inline.f.phone" />
          <a className="rs-btn rs-header__cta" href={anchor('contact')}>
            <Ed path="copy.header.cta" fallback="Book a Table" label="editor.inline.f.headerBtn" />
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
              <Ed path={`copy.nav.${id}`} fallback={SECTION_LABELS[id]} label="editor.inline.f.navLink" />
            </a>
          ))}
          <a className="rs-btn" href={anchor('contact')} onClick={() => setOpen(false)}>
            <Ed path="copy.header.cta" fallback="Book a Table" label="editor.inline.f.headerBtn" />
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
  const inline = useInlineEdit()

  const body = (
    <>
      <span className="rs-chip">
        <Ed
          path="copy.hero.chip"
          fallback={`${getTemplate(r.templateId).name} template`}
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
          <Ed path="copy.hero.menuCta" fallback="View the Menu" label="editor.inline.f.heroBtn" />
        </a>
        <a className="rs-btn rs-btn--ghost" href={anchor('contact')}>
          <Ed path="copy.hero.bookCta" fallback="Book a Table" label="editor.inline.f.heroBtn" />
        </a>
      </div>
    </>
  )

  const hoursMeta = firstHours ? (
    <>
      <Ed path="hours.0.day" label="editor.inline.f.hours" />
      {' Â· '}
      <Ed path="hours.0.hours" label="editor.inline.f.hours" />
    </>
  ) : (
    <Ed path="copy.hero.hours" fallback="Open daily" label="editor.inline.f.hours" />
  )

  if (style === 'fullscreen') {
    return (
      <section className="rs-hero rs-hero--fullscreen">
        <div
          className="rs-hero__media"
          style={{ backgroundImage: `url(${r.heroImage})` }}
          role="img"
          aria-label={`${r.name} ambience`}
          onClick={
            inline?.enabled
              ? () => inline.select({ path: 'heroImage', kind: 'image', label: 'Hero photo' })
              : undefined
          }
        />
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
              <Ed path="copy.hero.menuCta" fallback="View the Menu" label="editor.inline.f.heroBtn" />
            </a>
            <a className="rs-btn rs-btn--ghost" href={anchor('contact')}>
              <Ed path="copy.hero.bookCta" fallback="Book a Table" label="editor.inline.f.heroBtn" />
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
                <Ed path="copy.hero.favourite" fallback="Guest favourite" label="editor.inline.f.heroNote" />
              </span>
            </div>
          </div>
          <figure className="rs-hero__figure">
            <EdImage
              path="heroImage"
              src={r.heroImage}
              alt={`${r.name} signature dish`}
              eager
              label="editor.inline.f.photo"
            />
            <figcaption className="rs-hero__float">
              <Icon name="utensils" size={15} />
              <Ed path="name" label="editor.inline.f.name" />
              <span>
                {' Â· '}
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
            src={r.heroImage}
            alt={`${r.name} dining room`}
            eager
            label="editor.inline.f.photo"
          />
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
  /** copy namespace, e.g. `featured` â†’ the `copy.featured.*` overrides */
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
  if (item.available && item.featured) {
    return (
      <span className="rs-badge">Chefâ€™s pick</span>
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
          eyebrow="Chefâ€™s selection"
          title="Featured dishes"
          sub="The plates we would order for you, updated with every service."
        />
        {items.length === 0 ? (
          <p className="rs-muted" style={{ fontSize: '0.95em' }}>
            <Ed
              path="copy.featured.empty"
              fallback="No featured dishes yet â€” ask the kitchen what is good today."
              multiline
              label="editor.inline.f.note"
            />
          </p>
        ) : (
          <div className="rs-featured__grid">
            {items.map(({ item, category, base, categoryPath }) => (
              <article key={item.id} className="rs-feature-card">
                <div className="rs-feature-card__media">
                  <EdImage path={`${base}.image`} src={item.image} alt={item.name} label="editor.inline.f.photo" />
                  <span className="rs-feature-card__tag rs-badge">
                    <Ed path="copy.featured.tag" fallback="Chefâ€™s pick" label="editor.inline.f.badge" />
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

function MenuCard({ item, base }: { item: MenuItem; base: string }) {
  return (
    <article className={cx('rs-item', !item.available && 'rs-item--out')}>
      <div className="rs-item__media">
        <EdImage path={`${base}.image`} src={item.image} alt={item.name} label="editor.inline.f.photo" />
        <div className="rs-item__badges">
          <Badges item={item} />
        </div>
      </div>
      <div className="rs-item__body">
        <div className="rs-item__row">
          <Ed as="h3" path={`${base}.name`} className="rs-item__name" label="editor.inline.f.dishName" />
          <Price item={item} base={base} />
        </div>
        <Ed
          as="p"
          path={`${base}.description`}
          className="rs-item__desc"
          multiline
          label="editor.inline.f.dishDesc"
        />
        {!item.available ? <span className="rs-item__out-label">Back tomorrow</span> : null}
      </div>
    </article>
  )
}

function MenuRow({ item, base }: { item: MenuItem; base: string }) {
  return (
    <article className={cx('rs-item', !item.available && 'rs-item--out')}>
      <div className="rs-item__media">
        <EdImage path={`${base}.image`} src={item.image} alt={item.name} label="editor.inline.f.photo" />
      </div>
      <div className="rs-item__body">
        <div className="rs-item__row">
          <Ed as="h3" path={`${base}.name`} className="rs-item__name" label="editor.inline.f.dishName" />
          <Price item={item} base={base} />
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
  const currentIndex = current ? r.menu.indexOf(current) : -1
  const listMode = r.design.layout.menuLayout === 'list'

  return (
    <section className="rs-section" id={`${prefix}rs-menu`}>
      <div className="rs-shell">
        <SectionHead
          copyKey="menu"
          eyebrow="The menu"
          title={current ? current.name : 'Our menu'}
          titlePath={current ? `menu.${currentIndex}.name` : undefined}
          sub={current?.note || 'Freshly prepared, served all day.'}
          subPath={current ? `menu.${currentIndex}.note` : undefined}
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
              {current?.items.map((menuItem, itemIndex) => {
                const base = `menu.${currentIndex}.items.${itemIndex}`
                return listMode ? (
                  <MenuRow key={menuItem.id} item={menuItem} base={base} />
                ) : (
                  <MenuCard key={menuItem.id} item={menuItem} base={base} />
                )
              })}
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
          <EdImage
            path="gallery.0"
            src={r.gallery[0] ?? r.heroImage}
            alt={`${r.name} interior`}
            label="editor.inline.f.photo"
          />
        </figure>
        <div className="rs-about__body">
          <Ed
            as="span"
            path="copy.about.eyebrow"
            fallback="Our story"
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
            fallback="Everything is prepared in house each morning. We work with local growers, millers and roasters, and we change the menu whenever the season tells us to."
            className="rs-about__text"
            multiline
            label="editor.inline.f.paragraph"
          />
          <div className="rs-about__sign">
            <Ed path="copy.about.sign" fallback="The team at" label="editor.inline.f.sign" />
            {' '}
            <Ed path="name" label="editor.inline.f.name" />
          </div>
          <div className="rs-about__facts">
            <div className="rs-about__fact">
              <strong>{dishCount}</strong>
              <Ed path="copy.about.fact1" fallback="Dishes on the menu" label="editor.inline.f.fact" />
            </div>
            <div className="rs-about__fact">
              <strong>{r.menu.length}</strong>
              <Ed path="copy.about.fact2" fallback="Menu sections" label="editor.inline.f.fact" />
            </div>
            <div className="rs-about__fact">
              <strong>100%</strong>
              <Ed path="copy.about.fact3" fallback="Made in house" label="editor.inline.f.fact" />
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
          copyKey="gallery"
          eyebrow="Gallery"
          title="Inside the room"
          sub="A look at the plates, the pass and the people behind them."
        />
        <div className="rs-gallery__grid">
          {r.gallery.map((src, index) => (
            <div className="rs-gallery__item" key={`${src}-${index}`}>
              <EdImage
                path={`gallery.${index}`}
                src={src}
                alt={`${r.name} gallery image ${index + 1}`}
                label="Gallery photo"
              />
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
              fallback="Opening hours"
              className="rs-eyebrow"
              label="editor.inline.f.eyebrow"
            />
            <Ed
              as="h2"
              path="copy.hours.title"
              fallback="Come hungry, leave slow."
              className="rs-hours__title"
              label="editor.inline.f.title"
            />
            <Ed
              as="p"
              path="copy.hours.body"
              fallback="The kitchen closes 30 minutes before the listed time. Walk-ins are always welcome, reservations recommended for weekends."
              className="rs-muted"
              style={{ fontSize: '0.92em' }}
              multiline
              label="Section note"
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
  const cards = [
    { icon: 'mapPin', label: 'Find us', value: r.address, path: 'address' },
    { icon: 'phone', label: 'Call', value: r.phone, path: 'phone' },
    { icon: 'mail', label: 'Email', value: r.email, path: 'email' },
  ]

  return (
    <section className="rs-section" id={`${prefix}rs-contact`}>
      <div className="rs-shell">
        <SectionHead
          copyKey="contact"
          eyebrow="Contact"
          title="Reservations & directions"
          sub="Tables, takeaway and private dining â€” we answer within the hour during service."
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
              {r.slug}.menucraft.com <span>Â· simulated address</span>
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
            <Ed
              as="div"
              path="copy.footer.explore"
              fallback="Explore"
              className="rs-footer__title"
              label="editor.inline.f.footerTitle"
            />
            <div className="rs-footer__links">
              {nav.map((id) => (
                <a key={id} href={anchor(id)}>
                  <Ed path={`copy.nav.${id}`} fallback={SECTION_LABELS[id]} label="editor.inline.f.navLink" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <Ed
              as="div"
              path="copy.footer.visit"
              fallback="Visit"
              className="rs-footer__title"
              label="editor.inline.f.footerTitle"
            />
            <div className="rs-footer__links">
              <Ed path="address" label="editor.inline.f.address" />
              <a href={`tel:${r.phone.replace(/[^+\d]/g, '')}`}>
                <Ed path="phone" label="editor.inline.f.phone" />
              </a>
              <a href={`mailto:${r.email}`}>
                <Ed path="email" label="Email" />
              </a>
            </div>
          </div>

          <div>
            <Ed
              as="div"
              path="copy.footer.hours"
              fallback="Hours"
              className="rs-footer__title"
              label="editor.inline.f.footerTitle"
            />
            <div className="rs-footer__links">
              {r.hours.map((row, index) => (
                <span key={`${row.day}-${index}`}>
                  <Ed path={`hours.${index}.day`} label="editor.inline.f.day" />
                  {' â€” '}
                  <Ed path={`hours.${index}.hours`} label="editor.inline.f.hours" />
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="rs-footer__bottom">
          <span>
            Â© {year} <strong><Ed path="name" label="editor.inline.f.name" /></strong>
            <Ed path="copy.footer.rights" fallback=". All rights reserved." label="editor.inline.f.note" />
          </span>
          <span>
            Published with <strong>MenuCraft</strong> Â· {r.slug}.menucraft.com
          </span>
        </div>
      </div>
    </footer>
  )
}
