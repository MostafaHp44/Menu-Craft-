/**
 * Noir Bistro — premium French-Bistro / European-Editorial / Dark-Luxury renderer.
 *
 * Fully independent design: asymmetric editorial composition, cinematic dark
 * palette, serif headline typography, dramatic numbers, thin dividers and a
 * large whitespace flow. Reuses the shared application contracts:
 *   - `useCartStore` (public/cart store) for add-to-cart actions
 *   - `TemplateCheckoutOverlay` (templates/site/CheckoutOverlay.tsx) for checkout
 *   - `Ed` / `EdImage` (inline editor) — identical to the shared renderer
 *   - `DesignConfiguration` + `--rs-*`-style CSS variables for editor themes
 */
import { useState, type CSSProperties } from 'react'

import type { MenuItem, Restaurant, InlineTextStyle } from '../../../shared/lib/types.ts'
import { imageFitStyle } from '../../../shared/lib/types.ts'
import { fontStack } from '../../data/fonts.ts'
import { useI18n } from '../../../shared/i18n/index.tsx'
import { Ed, EdImage, InlineEditProvider, type ActiveField } from '../../editor/inlineEdit.tsx'
import { confirmDialog } from '../../../shared/components/dialogs.tsx'
import { money, mix, readableOn, tx } from '../../../shared/lib/utils.ts'
import { useCartStore } from '../../../features/public/publicCart.ts'
import { getTemplate } from '../../data/templates.ts'
import TemplateCheckoutOverlay from '../../site/CheckoutOverlay.tsx'

interface Props {
  restaurant: Restaurant
  interactive?: boolean
  mode?: string
  currency?: string
  editable?: boolean
  onActiveChange?: (field: ActiveField | null) => void
  onCommit?: (path: string, value: string) => void
  onStyle?: (path: string, patch: InlineTextStyle | null) => void
  onMenuEdit?: (recipe: (draft: Restaurant) => void) => void
}

/* ------------------------------------------------------------------ *
 * Design tokens — mirrors RestaurantSite.designVars(), renamed with a
 * dedicated `--nb-*` prefix so this template is self-contained.
 * ------------------------------------------------------------------ */

const ASPECTS: Record<string, string> = {
  square: '1 / 1',
  portrait: '4 / 5',
  landscape: '4 / 3',
  wide: '16 / 9',
}

function nbVars(r: Restaurant): CSSProperties {
  const d = r.design
  const c = (d && d.colors) as unknown as Record<string, string>
  const t = (d && d.typography) as Record<string, any>
  const l = (d && d.layout) as Record<string, any>
  const bg = c.background ?? '#0C0A08'
  const text = c.text ?? '#F7EFE4'
  return {
    '--nb-bg': bg,
    '--nb-text': text,
    '--nb-card': c.card ?? '#16110C',
    '--nb-primary': c.primary ?? '#0C0A08',
    '--nb-secondary': c.secondary ?? '#7A6E5D',
    '--nb-accent': c.accent ?? '#C8A25C',
    '--nb-button': c.button ?? '#C8A25C',
    '--nb-on-button': readableOn(c.button ?? '#C8A25C'),
    '--nb-border': c.border || mix(text, bg, 0.15),
    '--nb-muted': mix(text, bg, 0.55),
    '--nb-heading': fontStack(t.heading || 'playfair'),
    '--nb-body': fontStack(t.body || 'inter'),
    '--nb-menu': fontStack(t.menu || 'inter'),
    '--nb-h-scale': String(t.headingScale ?? 1.08),
    '--nb-b-scale': String(t.bodyScale ?? 1.02),
    '--nb-h-weight': String(t.headingWeight ?? 600),
    '--nb-leading': String(t.lineHeight ?? 1.65),
    '--nb-radius': `${l.radius ?? 14}px`,
    '--nb-radius-sm': `${Math.max(2, (l.radius ?? 14) - 6)}px`,
    '--nb-space': ['0.84', '1', '1.18'][l.spacing] ?? '1',
    '--nb-img': ASPECTS[l.aspect] ?? '4 / 3',
  } as CSSProperties
}

/* ------------------------------------------------------------------ *
 * Scoped styles — asymmetric dark-luxury editorial theme.
 * ------------------------------------------------------------------ */

const NB_STYLE = `
.nb-root {
  display: block;
  color: var(--nb-text);
  background: var(--nb-bg);
  font-family: var(--nb-body);
  line-height: var(--nb-leading);
  text-align: start;
}
.nb-page > * { font-size: clamp(15px, 1.06cqw, 17px); }
/* Query container on an inner wrapper: fixed overlays (cart, checkout)
   must stay anchored to the viewport, not to the page top. */
.nb-page { position: relative; width: 100%; container-name: nb; container-type: inline-size; }
.nb-root h1, .nb-root h2, .nb-root h3, .nb-root h4 {
  font-family: var(--nb-heading);
  font-weight: var(--nb-h-weight);
  line-height: 1.02;
  letter-spacing: -0.02em;
  margin: 0;
  text-wrap: balance;
}
.nb-root button { font: inherit; color: inherit; cursor: pointer; }
.nb-section {
  padding-block: clamp(56px, 7.5cqw, 120px) var(--nb-space);
  animation: nbReveal 0.85s ease both;
}
/* Opacity-only reveal: a transform here would make .nb-root the containing block
   for the fixed cart/checkout overlays (they'd stick to the page top). */
@keyframes nbReveal { from { opacity: 0; } to { opacity: 1; } }
@media (prefers-reduced-motion: reduce) {
  .nb-section { animation: none; opacity: 1; transform: none; }
}
.nb-shell {
  max-width: 1420px;
  margin-inline: auto;
  padding-inline: clamp(18px, 4.5cqw, 72px);
}
.nb-eyebrow {
  display: inline-flex; align-items: center; gap: 0.7em;
  font-family: var(--nb-body);
  font-size: 0.68em; letter-spacing: 0.28em; text-transform: uppercase;
  color: var(--nb-accent); font-weight: 700;
}
.nb-eyebrow::before { content: ''; width: 28px; height: 1px; background: currentColor; opacity: 0.55; }

/* Hero — asymmetric: media large, text column beside */
.nb-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: clamp(24px, 4.5cqw, 60px);
  align-items: center;
}
@media (min-width: 900px) { .nb-hero { grid-template-columns: minmax(0, 10fr) minmax(0, 9fr); } }
.nb-hero__media {
  overflow: hidden; border-radius: var(--nb-radius);
  aspect-ratio: var(--nb-img);
  background: var(--nb-card);
  border: 1px solid var(--nb-border);
}
.nb-hero__media img { display: block; width: 100%; height: 100%; object-fit: cover; object-position: center; transition: transform 0.5s ease; }
.nb-hero:hover .nb-hero__media img { transform: scale(1.04); }
.nb-hero__text { min-width: 0; }
.nb-hero__kicker { font-size: 0.9rem; }
.nb-hero__title {
  font-size: clamp(3rem, 8.4cqw, 5.2rem);
  max-width: 0.86em;
}
.nb-hero__lead {
  margin-top: 1rem;
  font-size: clamp(1.05rem, 1.7cqw, 1.4rem);
  color: var(--nb-text);
  opacity: 0.96;
}
.nb-hero__cta {
  margin-top: 2rem;
  display: flex; flex-wrap: wrap; gap: 0.75rem;
}
.nb-cta {
  padding: 0.85rem 1.25rem; border-radius: 999px; font-weight: 700;
  border: 1px solid var(--nb-border); background: var(--nb-primary);
  color: #fff; text-transform: uppercase; letter-spacing: 0.06em; font-size: 0.78rem;
  transition: transform 0.2s ease, filter 0.2s ease;
}
.nb-cta:hover { filter: brightness(1.15); transform: translateY(-1px); }
.nb-cta--ghost { background: transparent; color: var(--nb-text); }
.nb-cta--ghost:hover { background: var(--nb-card); }

/* Identity — micro facts, thin separators */
.nb-facts {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1px; margin-top: 3rem;
  border-top: 1px solid var(--nb-border);
}
.nb-fact {
  padding: 1.25rem 1rem; border-inline-end: 1px solid var(--nb-border);
  display: grid; gap: 0.2rem;
}
.nb-fact__k { font-family: var(--nb-heading); font-size: 1rem; font-weight: 800; }
.nb-fact__v { font-size: 0.85rem; color: var(--nb-muted); }

/* Menu — editorial numbered categories */
.nb-menu { margin-top: 4rem; }
.nb-menu__cat {
  display: grid; gap: 1.25rem; margin-bottom: clamp(3rem, 4.5cqw, 5rem);
}
.nb-menu__head {
  display: flex; align-items: baseline; gap: 0.8em;
}
.nb-menu__num {
  font-family: var(--nb-heading); font-size: 3.5rem; color: var(--nb-accent);
  line-height: 0.8; letter-spacing: -0.03em; font-weight: 800;
}
.nb-menu__title {
  font-size: clamp(1.6rem, 3.2cqw, 2.4rem);
  color: var(--nb-text);
  border-bottom: 1px solid var(--nb-border);
  padding-bottom: 0.5rem;
}
.nb-menu__desc { color: var(--nb-muted); font-size: 0.9rem; margin-top: 0.5rem; }

/* Items — asymmetric card */
.nb-items {
  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(16px, 3cqw, 30px);
}
@media (max-width: 767px) { .nb-items { grid-template-columns: 1fr; } }
.nb-item {
  display: grid; grid-template-columns: minmax(0, 1fr);
  border: 1px solid var(--nb-border); border-radius: var(--nb-radius);
  overflow: hidden; background: var(--nb-card);
  transition: transform 0.25s ease, border-color 0.25s ease;
}
.nb-item:hover { transform: translateY(-4px); border-color: var(--nb-accent); }
.nb-item__media {
  aspect-ratio: var(--nb-img);
  border-bottom: 1px solid var(--nb-border);
}
.nb-item__media img { display: block; width: 100%; height: 100%; object-fit: cover; object-position: center; }
.nb-item__body { display: grid; gap: 0.7rem; padding: 1.1rem; }
.nb-item__row { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; }
.nb-item__name { font-size: clamp(1.05rem, 2.2cqw, 1.35rem); color: var(--nb-text); }
.nb-item__price {
  font-family: var(--nb-heading); font-weight: 800; font-size: clamp(1.15rem, 2.2cqw, 1.5rem);
  color: var(--nb-accent); text-align: end; white-space: nowrap;
}
.nb-item__desc { color: var(--nb-muted); font-size: 0.9rem; }
.nb-item__badges { display: flex; gap: 0.4rem; flex-wrap: wrap; }
.nb-badge {
  font-size: 0.62rem; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase;
  padding: 0.15rem 0.55rem; border: 1px solid var(--nb-accent); color: var(--nb-accent);
  background: transparent; border-radius: 4px;
}
.nb-item__add {
  align-self: start;
  margin-top: 0.3rem;
  padding: 0.55rem 1.1rem; border-radius: 999px; font-weight: 800;
  font-size: 0.78rem; letter-spacing: 0.05em;
  border: 1px solid var(--nb-text); color: var(--nb-text); background: transparent;
  transition: background 0.2s ease, color 0.2s ease;
}
.nb-item__add:hover { background: var(--nb-text); color: var(--nb-primary); }
.nb-item__add:disabled { opacity: 0.45; cursor: not-allowed; }

/* Footer */
.nb-footer {
  margin-top: 4rem; padding: 2rem 0 4rem; border-top: 1px solid var(--nb-border);
  display: grid; gap: 1rem;
}
.nb-footer__grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem;
}
.nb-footer__brand h2 { font-size: 2rem; margin: 0; }
.nb-footer__social { display: flex; gap: 0.8rem; margin-top: 0.8rem; flex-wrap: wrap; }
.nb-footer__social a {
  width: 38px; height: 38px; border-radius: var(--nb-radius-sm);
  display: grid; place-items: center; color: var(--nb-text); background: var(--nb-card);
  border: 1px solid var(--nb-border); text-decoration: none; transition: transform .2s ease, color .2s;
}
.nb-footer__social a:hover { transform: translateY(-3px); color: var(--nb-accent); }
.nb-footer__social a svg { width: 17px; height: 17px; }
.nb-footer__facts {
  display: grid; gap: 0.4rem;
  color: var(--nb-muted); font-size: 0.86rem;
}
.nb-footer__facts strong { color: var(--nb-text); font-weight: 700; }

/* Cart drawer */
.nb-cart {
  position: fixed; inset-inline: 0; bottom: 0; z-index: 50;
  padding: 0.8rem 1rem 0; pointer-events: none;
}
.nb-cart__panel {
  max-width: 480px; margin: 0 auto;
  border-radius: 1.75rem 1.75rem 0 0;
  background: var(--nb-card); border: 1px solid var(--nb-border);
  box-shadow: 0 40px 80px -32px rgba(0,0,0,0.7);
  overflow: hidden; pointer-events: auto;
}
.nb-cart__head { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.25rem; border-bottom: 1px solid var(--nb-border); }
.nb-cart__body { padding: 1.25rem; display: grid; gap: 0.9rem; }
.nb-cart__lines { display: grid; gap: 0.65rem; max-height: 34vh; overflow-y: auto; }
.nb-cart__line { display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; }
.nb-cart__line-info { min-width: 0; }
.nb-cart__line-name { font-weight: 700; font-size: 0.95rem; }
.nb-cart__line-price { color: var(--nb-muted); font-size: 0.85rem; }
.nb-cart__actions { display: flex; gap: 0.5rem; align-items: center; }
.nb-qty { display: flex; align-items: center; gap: 0.4rem; }
.nb-qty btn, .nb-qty button {
  width: 1.65rem; height: 1.65rem; display: grid; place-items: center;
  border-radius: 50%; border: 1px solid var(--nb-border); background: transparent; color: var(--nb-text);
  font-weight: 800; transition: background .2s ease;
}
.nb-qty btn:hover, .nb-qty button:hover { background: var(--nb-border); }
.nb-cart__summary { border-top: 1px solid var(--nb-border); padding: 1rem 1.25rem 1.5rem; }
.nb-cart__total { display: flex; justify-content: space-between; font-size: 1rem; font-weight: 800; }
.nb-cta-block { margin-top: 0.9rem; }

/* Product detail modal */
.nb-detail-overlay {
  position: fixed; inset: 0; z-index: 60;
  display: grid; place-items: center; background: rgba(12,10,8,0.85);
  backdrop-filter: blur(4px); padding: 1rem;
}
.nb-detail {
  width: min(460px, 100%); background: var(--nb-card);
  border: 1px solid var(--nb-border); border-radius: var(--nb-radius);
  overflow: hidden; box-shadow: 0 32px 64px -32px rgba(0,0,0,0.8);
}
.nb-detail__head { position: relative; }
.nb-detail__media { aspect-ratio: var(--nb-img); }
.nb-detail__media img { display: block; width: 100%; height: 100%; object-fit: cover; }
.nb-detail__close { position: absolute; top: 1rem; inset-inline-end: 1rem; background: rgba(0,0,0,0.4); border: 0; color: #fff; border-radius: 50%; width: 32px; height: 32px; cursor: pointer; }
.nb-detail__body { padding: 1.25rem; display: grid; gap: 0.6rem; }
.nb-detail__name { font-size: clamp(1.3rem, 2.5cqw, 1.7rem); }
.nb-detail__num { font-size: clamp(2rem, 4cqw, 3rem); font-family: var(--nb-heading); font-weight: 800; color: var(--nb-accent); line-height: 0.9; }
.nb-detail__desc { color: var(--nb-muted); font-size: 0.9rem; }
.nb-detail__add { align-self: start; margin-top: 0.5rem; padding: 0.7rem 1.2rem; border-radius: 999px; font-weight: 800; background: var(--nb-button); color: #fff; border: 0; cursor: pointer; }
`

function cartSignature(line: { options: Array<{ groupId: string; optionId: string }> }): string {
  return line.options.map((o) => `${o.groupId}:${o.optionId}`).sort().join('|')
}

function addToCart(restaurant: Restaurant, item: MenuItem, displayName?: string) {
  useCartStore.getState().add({
    restaurantId: restaurant.id,
    slug: restaurant.slug,
    restaurantName: tx(restaurant.name) || 'Restaurant',
    item,
    displayName: displayName || (tx(item.name) || 'Item'),
    options: [],
    note: '',
  })
}

/* ------------------------------------------------------------------ *
 * Components
 * ------------------------------------------------------------------ */

function NoirHero({ restaurant: r }: { restaurant: Restaurant }) {
  const { t } = useI18n()
  const category = r.menu?.[0]?.name || getTemplateCategory(r)
  return (
    <section className="nb-section nb-hero">
      <div className="nb-hero__media">
        <EdImage path="heroImage" src={r.heroImage || ''} alt={tx(r.name) || 'Noir Bistro'} eager label="Hero photo" style={imageFitStyle((r as any).heroImageFit) as CSSProperties} />
      </div>
      <div className="nb-hero__text">
        <span className="nb-eyebrow nb-hero__kicker">{category}</span>
        <h1 className="nb-hero__title">
          <Ed as="span" path="name" label="Editorial headline" />
        </h1>
        <p className="nb-hero__lead">
          <Ed as="span" path="tagline" multiline label="Tagline" />
        </p>
        <div className="nb-hero__cta">
          <a className="nb-cta" href={'#nb-menu'}>See a live menu</a>
          <a className="nb-cta nb-cta--ghost" href={'#nb-contact'}>{t('Contact')}</a>
        </div>
        {r.hours?.[0] ? (
          <span className="nb-eyebrow" style={{ marginTop: '2.25rem' }}>
            <Ed path="hours.0.day" label="Hours" /> {' '}
            <span style={{ color: 'var(--nb-text)' }}>/</span>{' '}
            <Ed path="hours.0.hours" label="Hours" />
          </span>
        ) : null}
      </div>
    </section>
  )
}

function getTemplateCategory(r: Restaurant): string {
  try {
    return getTemplate(r.templateId || '').category || ''
  } catch {
    return ''
  }
}

function NoirIdentity({ restaurant: r, id }: { restaurant: Restaurant; id: string }) {
  const { t } = useI18n()
  return (
    <section className="nb-section" id={id} data-animate>
      <div className="nb-facts">
        <div className="nb-fact">
          <strong className="nb-fact__k"><Ed path="address" label="Address" /></strong>
          <span className="nb-fact__v"><Ed path="address" label="Address" /></span>
        </div>
        {r.hours?.[0] ? (
          <div className="nb-fact">
            <strong className="nb-fact__k">{t('Opening hours')}</strong>
            <span className="nb-fact__v">
              <Ed path="hours.0.day" label="Hours" /> — <Ed path="hours.0.hours" label="Hours" />
            </span>
          </div>
        ) : null}
        {r.phone ? (
          <div className="nb-fact">
            <strong className="nb-fact__k">{t('Phone')}</strong>
            <span className="nb-fact__v"><Ed path="phone" label="Phone" /></span>
          </div>
        ) : null}
        {r.email ? (
          <div className="nb-fact">
            <strong className="nb-fact__k">{t('Email')}</strong>
            <span className="nb-fact__v"><Ed path="email" label="Email" /></span>
          </div>
        ) : null}
      </div>
      <p style={{ color: 'var(--nb-muted)', marginTop: '1.5rem', fontSize: '0.92rem' }}>
        <Ed path="description" multiline label="Short statement" />
      </p>
    </section>
  )
}

function NoahProductDetail({ restaurant: r, item, base, onClose, currency }: { restaurant: Restaurant; item: MenuItem; base: string; onClose: () => void; currency?: string }) {
  const fmt = (v: string) => money(Number(v) || 0, currency || undefined)
  return (
    <div className="nb-detail-overlay" onClick={onClose}>
      <button className="nb-detail__close" onClick={onClose} aria-label="Close detail">✕</button>
      <div className="nb-detail" onClick={(e) => e.stopPropagation()}>
        {item.image ? (
          <div className="nb-detail__media">
            <EdImage path={`${base}.image`} src={item.image} alt={tx(item.name) || 'Item'} label="Product detail photo" />
          </div>
        ) : null}
        <div className="nb-detail__body">
          <h3 className="nb-detail__name"><Ed path={`${base}.name`} label="Product name" /></h3>
          {item.allergens?.length ? <p className="nb-detail__desc">{item.allergens.join(', ')}</p> : null}
          <Ed as="p" path={`${base}.description`} className="nb-detail__desc" multiline label="Product description" />
          <p className="nb-detail__num">{fmt(String(item.price))}</p>
          <button
            type="button"
            className="nb-detail__add"
            onClick={() => {
              addToCart(r, item)
              onClose()
            }}
          >
            Add to cart
          </button>
        </div>
      </div>
    </div>
  )
}

function NoirMenuItem({
  r, item, base, interactive, editable, onDelete, currency, onOpenDetail,
}: {
  r: Restaurant
  item: MenuItem
  base: string
  interactive?: boolean
  editable?: boolean
  onDelete?: () => void
  currency?: string
  onOpenDetail: () => void
}) {
  const fmt = (v: number) => money(Number(v) || 0, currency || undefined)
  const canEditDelete = Boolean(editable && onDelete)

  return (
    <article
      className="nb-item"
      onClick={() => { if (item.available && interactive) onOpenDetail() }}
      onKeyDown={(e) => { if (e.key === 'Enter' && item.available && interactive) onOpenDetail() }}
      role={item.available && interactive ? 'button' : undefined}
      aria-label={tx(item.name) || 'Product'}
    >
      {item.image ? (
        <div className="nb-item__media">
          <EdImage path={`${base}.image`} src={item.image} alt={tx(item.name) || ''} label="Product photo" style={imageFitStyle(item.imageFit) as CSSProperties} />
        </div>
      ) : null}
      <div className="nb-item__body">
        <div className="nb-item__row">
          <h3 className="nb-item__name"><Ed path={`${base}.name`} label="Product name" /></h3>
          <span className="nb-item__price"><Ed numeric path={`${base}.price`} format={(v) => fmt(Number(v))} label="Product price" /></span>
        </div>
        <Ed path={`${base}.description`} className="nb-item__desc" multiline label="Product description" />
        <div className="nb-item__badges">
          {item.featured ? <span className="nb-badge">Chef's Pick</span> : null}
          {item.popular ? <span className="nb-badge">Popular</span> : null}
          {item.allergens?.length ? <span className="nb-badge">{item.allergens.join(' · ')}</span> : null}
          {!item.available ? <span className="nb-badge">Sold Out</span> : null}
        </div>
        {editable && canEditDelete ? (
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <span
              className="nb-item__add"
              onClick={(e) => {
                e.stopPropagation()
                void confirmDialog({ title: 'Delete item?', message: 'This dish will be removed from the menu.', confirmLabel: 'Remove', cancelLabel: 'Cancel', tone: 'danger' }).then(() => onDelete?.())
              }}
              style={{ cursor: 'pointer' }}
            >
              Remove
            </span>
          </div>
        ) : null}
        {item.available ? (
          <button
            type="button"
            className="nb-item__add"
            onClick={(e) => { e.stopPropagation(); addToCart(r, item) }}
          >
            Add to cart
          </button>
        ) : null}
      </div>
    </article>
  )
}

function NoirMenu({ r, editable = false, onMenuEdit, currency, interactive }: { r: Restaurant; editable?: boolean; onMenuEdit?: (recipe: (draft: Restaurant) => void) => void; currency?: string; interactive?: boolean }) {
  const { t } = useI18n()
  const [detail, setDetail] = useState<{ item: MenuItem; base: string } | null>(null)
  const categories = r.menu.filter((c) => (editable ? true : c.items.length > 0))

  return (
    <section className="nb-section nb-menu" id="nb-menu">
      <span className="nb-eyebrow">{t('Menu')}</span>
      {categories.map((cat, ci) => {
        const catIdx = r.menu.indexOf(cat)
        const num = String(ci + 1).padStart(2, '0')
        return (
          <div className="nb-menu__cat" key={cat.id} data-animate>
            <div className="nb-menu__head">
              <span className="nb-menu__num">{num}</span>
              <h2 className="nb-menu__title"><Ed path={`menu.${catIdx}.name`} label="Category name" /></h2>
            </div>
            <p className="nb-menu__desc"><Ed path={`menu.${catIdx}.note`} className="nb-menu__desc" multiline label="Category note" /></p>
            <div className="nb-items">
              {cat.items.map((item, ii) => {
                const base = `menu.${catIdx}.items.${ii}`
                return (
                  <NoirMenuItem
                    key={item.id || `item-${ci}-${ii}`}
                    r={r}
                    item={item}
                    base={base}
                    interactive={interactive}
                    editable={editable}
                    currency={currency}
                    onDelete={onMenuEdit ? () => onMenuEdit((d) => { d.menu[catIdx]?.items.splice(ii, 1) }) : undefined}
                    onOpenDetail={() => setDetail({ item, base })}
                  />
                )
              })}
            </div>
          </div>
        )
      })}
      {editable && onMenuEdit ? (
        <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.5rem', alignItems: 'center' }}>
          <button type="button" className="nb-item__add" style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }} onClick={() => onMenuEdit((d) => { if (!Array.isArray(d.menu)) d.menu = []; d.menu.push({ id: `cat-${Date.now()}`, name: 'New Category', note: '', items: [] }) })}>
            + Add Category
          </button>
        </div>
      ) : null}
      {detail ? (
        <NoahProductDetail restaurant={r} item={detail.item} base={detail.base} onClose={() => setDetail(null)} currency={currency} />
      ) : null}
    </section>
  )
}

function NoahCartDrawer({ onClose, onCheckout, currency }: { onClose: () => void; onCheckout?: () => void; currency?: string }) {
  const cart = useCartStore()
  const fmt = (v: number) => money(Number(v) || 0, currency || undefined)
  return (
    <div className="nb-cart">
      <div className="nb-cart__panel">
        <div className="nb-cart__head">
          <strong>Cart</strong>
          <button type="button" className="nb-qty" aria-label="Close cart" onClick={onClose}>✕</button>
        </div>
        <div className="nb-cart__body">
          <div className="nb-cart__lines">
            {cart.lines.length === 0 ? (
              <p className="nb-cart__line-name">Your cart is empty</p>
            ) : cart.lines.map((line) => {
              const sig = cartSignature(line)
              return (
                <div className="nb-cart__line" key={`${line.itemId}-${sig}`}>
                  <div className="nb-cart__line-info">
                    <p className="nb-cart__line-name">{line.name}</p>
                    <p className="nb-cart__line-price">{fmt(line.price)} × {line.qty}</p>
                  </div>
                  <div className="nb-cart__actions">
                    <span className="nb-qty">
                      <button type="button" onClick={() => cart.setQty(line.itemId, sig, line.qty - 1)} aria-label="Decrease">−</button>
                      <b>{line.qty}</b>
                      <button type="button" onClick={() => cart.setQty(line.itemId, sig, line.qty + 1)} aria-label="Increase">+</button>
                    </span>
                    <button type="button" onClick={() => cart.remove(line.itemId, sig)} aria-label="Remove" style={{ fontSize: '0.8rem', fontWeight: 800 }}>✕</button>
                  </div>
                </div>
              )
            })}
          </div>
          {cart.lines.length > 0 ? (
            <>
              <div className="nb-cart__summary">
                <div className="nb-cart__total">
                  <span>Subtotal</span>
                  <span>{fmt(cart.subtotal)}</span>
                </div>
              </div>
              <div className="nb-cta-block">
                <button type="button" className="nb-cta" onClick={onCheckout}>Proceed to Checkout</button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function NoirFooter({ r, id }: { r: Restaurant; id: string }) {
  return (
    <footer className="nb-section" id={id} data-animate>
      <div className="nb-footer">
        <div className="nb-footer__grid">
          <div>
            <h2><Ed path="name" label="Restaurant name" /></h2>
            <p><Ed path="tagline" multiline label="Tagline" /></p>
            <p className="nb-footer__facts">
              <strong><Ed path="address" label="Address" /></strong>
              <br />
              <strong><Ed path="phone" label="Phone" /></strong>
              <br />
              <strong><Ed path="email" label="Email" /></strong>
            </p>
          </div>
          <div>
            <h3>Explore</h3>
            <p><a href={'#nb-menu'}>Menu</a></p>
            <p><a href={'#nb-hero'}>Landing</a></p>
          </div>
          <div>
            <h3>Connect</h3>
            <div className="nb-footer__social">
              {r.socials?.instagram ? <a href={r.socials.instagram} target="_blank" rel="noreferrer">IG</a> : null}
              {r.socials?.facebook ? <a href={r.socials.facebook} target="_blank" rel="noreferrer">FB</a> : null}
              {r.socials?.website ? <a href={r.socials.website} target="_blank" rel="noreferrer">Web</a> : null}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

/* ------------------------------------------------------------------ *
 * Main component
 * ------------------------------------------------------------------ */

export function NoirBistroSite({ restaurant: r, mode, currency, editable = false, onActiveChange, onCommit, onStyle, onMenuEdit, interactive = true }: Props) {
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const cart = useCartStore()
  const cartCount = cart.count

  return (
    <InlineEditProvider restaurant={r} enabled={editable} onActiveChange={onActiveChange} onCommit={onCommit} onStyle={onStyle}>
      <div className="nb-root" style={nbVars(r)} data-mode={mode || 'site'} data-editable={editable ? 'true' : undefined}>
        <style>{NB_STYLE}</style>
        <div className="nb-page">
          <NoirHero restaurant={r} />
          <NoirIdentity restaurant={r} id="nb-contact" />
          <NoirMenu
            r={r}
            editable={editable}
            onMenuEdit={onMenuEdit}
            currency={currency}
            interactive={interactive}
          />
          <NoirFooter r={r} id="nb-footer" />
        </div>

        <button
          className="nb-cart__panel"
          style={{ left: '50%', bottom: '2.25rem', position: 'fixed', zIndex: 45, transform: 'translateX(-50%)', borderRadius: 999, padding: '0.65rem 1rem', fontWeight: 800, fontSize: '0.85rem', background: 'var(--nb-accent)', color: '#000', border: '0', boxShadow: '0 18px 40px -18px rgba(0,0,0,0.55)' }}
          onClick={() => { if (cartCount > 0) setCartOpen(true); else document.getElementById('nb-menu')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}
        >
          {cartCount > 0 ? `Checkout · ${cartCount} · ${money(cart.subtotal, currency || '$')}` : 'See the live menu'}
        </button>

        {cartOpen && interactive ? (
          <NoahCartDrawer
            onClose={() => setCartOpen(false)}
            onCheckout={() => { setCartOpen(false); setCheckoutOpen(true) }}
            currency={currency}
          />
        ) : null}

        {interactive && checkoutOpen ? (
          <TemplateCheckoutOverlay
            restaurant={r}
            onClose={() => setCheckoutOpen(false)}
            onPlaced={() => {
              void useCartStore.getState().clear()
              setCheckoutOpen(false)
            }}
          />
        ) : null}
      </div>
    </InlineEditProvider>
  )
}

export default NoirBistroSite
