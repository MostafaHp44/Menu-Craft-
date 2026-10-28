import { useEffect, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent } from 'react'
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
import { resolveVideoSrc } from '../../shared/lib/heroVideo.ts'
import { Icon } from '../../shared/ui/icons.tsx'
import { useI18n, type TKey } from '../../shared/i18n/index.tsx'
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

const SECTION_LABELS: Record<SectionId, TKey> = {
  featured: 'web.site.sections.featured',
  menu: 'web.site.sections.menu',
  about: 'web.site.sections.about',
  gallery: 'web.site.sections.gallery',
  hours: 'web.site.sections.hours',
  contact: 'web.site.sections.contact',
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
  const { t } = useI18n()
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
 * Ambient hero video — decorative layer over the hero photo.
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

function SiteHero({ r, anchor }: { r: Restaurant; anchor: (id: string) => string }) {
  const style = r.design.layout.hero
  const firstHours = r.hours[0]
  const inline = useInlineEdit()
  const { t } = useI18n()

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
      {' · '}
      <Ed path="hours.0.hours" label="editor.inline.f.hours" />
    </>
  ) : (
    <Ed path="copy.hero.hours" fallback={t('web.site.hero.openDaily')} label="editor.inline.f.hours" />
  )

  if (style === 'fullscreen') {
    return (
      <section className="rs-hero rs-hero--fullscreen">
        <div
          className="rs-hero__media"
          style={{ backgroundImage: `url(${r.heroImage})` }}
          role="img"
          aria-label={t('web.site.hero.ambienceAlt', { name: r.name })}
          onClick={
            inline?.enabled
              ? () => inline.select({ path: 'heroImage', kind: 'image', label: 'editor.inline.f.heroPhoto' })
              : undefined
          }
        >
          {r.heroVideo ? <HeroVideo src={r.heroVideo} poster={r.heroImage} /> : null}
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
              src={r.heroImage}
              alt={t('web.site.hero.signatureAlt', { name: r.name })}
              eager
              label="editor.inline.f.photo"
            />
            {r.heroVideo ? <HeroVideo src={r.heroVideo} poster={r.heroImage} /> : null}
            <figcaption className="rs-hero__float">
              <Icon name="utensils" size={15} />
              <Ed path="name" label="editor.inline.f.name" />
              <span>
                {' · '}
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
            alt={t('web.site.hero.diningAlt', { name: r.name })}
            eager
            label="editor.inline.f.photo"
          />
          {r.heroVideo ? <HeroVideo src={r.heroVideo} poster={r.heroImage} /> : null}
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
  const { t } = useI18n()
  if (item.available && item.featured) {
    return (
      <span className="rs-badge">{t('web.site.badges.chefsPick')}</span>
    )
  }
  if (item.available && item.popular) {
    return <span className="rs-badge rs-badge--soft">{t('web.site.badges.popular')}</span>
  }
  if (!item.available) {
    return <span className="rs-badge rs-badge--muted">{t('web.site.badges.soldOut')}</span>
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
                  <EdImage path={`${base}.image`} src={item.image} alt={item.name} label="editor.inline.f.photo" />
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

function MenuCard({ item, base }: { item: MenuItem; base: string }) {
  const { t } = useI18n()
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
        {!item.available ? (
          <span className="rs-item__out-label">{t('web.site.availability.backTomorrow')}</span>
        ) : null}
      </div>
    </article>
  )
}

function MenuRow({ item, base }: { item: MenuItem; base: string }) {
  const { t } = useI18n()
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
          {!item.available ? (
            <span className="rs-item__out-label">{t('web.site.availability.unavailable')}</span>
          ) : null}
        </div>
      </div>
    </article>
  )
}

function MenuSection({ r, prefix }: { r: Restaurant; prefix: string }) {
  const { t } = useI18n()
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
          eyebrow={t('web.site.menu.eyebrow')}
          title={current ? current.name : t('web.site.menu.noCategory')}
          titlePath={current ? `menu.${currentIndex}.name` : undefined}
          sub={current?.note || t('web.site.menu.noteFallback')}
          subPath={current ? `menu.${currentIndex}.note` : undefined}
          split
          action={
            <span className="rs-chip" style={{ alignSelf: 'flex-start' }}>
              {t('web.site.menu.dishesCount', {
                count: r.menu.reduce((sum, c) => sum + c.items.length, 0),
              })}
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
            <p style={{ marginTop: '0.7rem', fontWeight: 600 }}>{t('web.site.menu.updating')}</p>
            <p style={{ fontSize: '0.9em' }}>{t('web.site.menu.updatingSub')}</p>
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
  const { t } = useI18n()
  const dishCount = r.menu.reduce((sum, c) => sum + c.items.length, 0)

  return (
    <section className="rs-section" id={`${prefix}rs-about`}>
      <div className="rs-about__grid rs-shell">
        <figure className="rs-about__figure">
          <EdImage
            path="gallery.0"
            src={r.gallery[0] ?? r.heroImage}
            alt={t('web.site.about.interiorAlt', { name: r.name })}
            label="editor.inline.f.photo"
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
                alt={t('web.site.gallery.imageAlt', { name: r.name, index: index + 1 })}
                label="editor.inline.f.galleryPhoto"
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
              {r.slug}.menucraft.com <span>· {t('web.site.contact.simulated')}</span>
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
                  {' — '}
                  <Ed path={`hours.${index}.hours`} label="editor.inline.f.hours" />
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="rs-footer__bottom">
          <span>
            © {year} <strong><Ed path="name" label="editor.inline.f.name" /></strong>
            <Ed
              path="copy.footer.rights"
              fallback={t('web.site.footer.rights')}
              label="editor.inline.f.note"
            />
          </span>
          <span>
            {t('web.site.footer.publishedWith')} <strong>MenuCraft</strong> · {r.slug}.menucraft.com
          </span>
        </div>
      </div>
    </footer>
  )
}
