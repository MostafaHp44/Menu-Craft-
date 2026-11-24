/**
 * Desserts Menu — "ДОЛЬЧЕ" style renderer.
 * Organic editorial dessert menu: cream canvas, olive blob shapes, elegant
 * serif typography, dark round plates, line pictograms, alternating rows and
 * an "add to your dessert" extras card.
 *
 * Reuses shared contracts: useCartStore, TemplateCheckoutOverlay, Ed/EdImage.
 * No new business logic — cart/checkout/orders come from the shared system.
 */
import { useState, type CSSProperties, type ReactElement } from 'react'
import type { MenuItem, Restaurant, InlineTextStyle } from '../../../shared/lib/types.ts'
import { imageFitStyle } from '../../../shared/lib/types.ts'
import { fontStack } from '../../data/fonts.ts'
import { Ed, EdImage, InlineEditProvider, type ActiveField } from '../../editor/inlineEdit.tsx'
import { confirmDialog } from '../../../shared/components/dialogs.tsx'
import { money, mix, tx } from '../../../shared/lib/utils.ts'
import { useCartStore } from '../../../features/public/publicCart.ts'
import TemplateCheckoutOverlay from '../../site/CheckoutOverlay.tsx'
import { IMG } from '../../../shared/lib/images.ts'

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
 * Tokens — derived from DesignConfiguration (editor-driven colours).
 * ------------------------------------------------------------------ */

function dmVars(r: Restaurant): CSSProperties {
  const d = r.design
  const c = (d && d.colors) as unknown as Record<string, string>
  const t = (d && d.typography) as Record<string, any>
  const l = (d && d.layout) as Record<string, any>
  const bg = c.background ?? '#F1ECDF'
  const text = c.text ?? '#2B2B26'
  return {
    '--dm-bg': bg,
    '--dm-text': text,
    '--dm-card': c.card ?? '#F9F5EA',
    '--dm-primary': c.primary ?? '#5E6B43',
    '--dm-secondary': c.secondary ?? '#8A9468',
    '--dm-button': c.button ?? c.primary ?? '#5E6B43',
    '--dm-muted': mix(text, bg, 0.55),
    '--dm-border': c.border || mix(text, bg, 0.16),
    '--dm-heading': fontStack(t.heading || 'playfair'),
    '--dm-body': fontStack(t.body || 'dm-sans'),
    '--dm-radius': `${l.radius ?? 20}px`,
  } as CSSProperties
}

const DM_STYLE = `
.dm-root {
  display: block; color: var(--dm-text); background: var(--dm-bg);
  font-family: var(--dm-body); min-height: 100vh; width: 100%;
  animation: dmReveal .7s ease both;
}
/* Query container on an inner wrapper: fixed overlays (cart, checkout)
   must stay anchored to the viewport, not to the page top. */
.dm-page { position: relative; width: 100%; container-name: dm; container-type: inline-size; }
@keyframes dmReveal { from { opacity: 0; } to { opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .dm-root, .dm-root * { animation: none !important; transition: none !important; } }
.dm-shell { max-width: 1160px; margin-inline: auto; padding-inline: clamp(16px, 4cqw, 56px); }

/* ---------- header ---------- */
.dm-header { padding-block: clamp(1.1rem, 3cqw, 1.8rem); }
.dm-header__in { display: flex; align-items: center; gap: 1rem; }
.dm-logo { display: flex; align-items: center; gap: .8rem; min-width: 0; }
.dm-logo__mark { width: 48px; height: 48px; flex: none; color: var(--dm-primary); }
.dm-logo__mark svg { width: 100%; height: 100%; }
.dm-logo__text { display: flex; flex-direction: column; min-width: 0; }
.dm-logo__name {
  font-family: var(--dm-heading); font-weight: 600; letter-spacing: .18em;
  text-transform: uppercase; font-size: clamp(1.05rem, 2.6cqw, 1.45rem); line-height: 1.1;
}
.dm-logo__tag { font-family: var(--dm-heading); font-style: italic; color: var(--dm-muted); font-size: .82rem; }
.dm-header__actions { margin-inline-start: auto; display: flex; gap: .6rem; }
.dm-iconbtn {
  position: relative; width: 44px; height: 44px; border-radius: 50%;
  background: transparent; border: 1px solid var(--dm-border); color: var(--dm-text);
  display: grid; place-items: center; cursor: pointer; transition: border-color .15s ease, color .15s ease;
}
.dm-iconbtn:hover { border-color: var(--dm-primary); color: var(--dm-primary); }
.dm-iconbtn svg { width: 19px; height: 19px; }
.dm-iconbtn__badge {
  position: absolute; top: -3px; inset-inline-end: -3px; min-width: 18px; height: 18px;
  border-radius: 999px; background: var(--dm-primary); color: var(--dm-bg);
  font-size: .66rem; font-weight: 700; display: grid; place-items: center; padding-inline: 4px;
}

/* ---------- hero ---------- */
.dm-hero { position: relative; padding-block: clamp(1rem, 4cqw, 3rem) clamp(2rem, 6cqw, 4rem); overflow: hidden; }
.dm-hero__blob { position: absolute; inset-block: 0; inset-inline-end: -8%; width: 46%; height: 100%; color: var(--dm-primary); pointer-events: none; }
.dm-hero__blob svg { width: 100%; height: 100%; }
.dm-hero__in { position: relative; display: grid; grid-template-columns: 1fr; gap: clamp(1.6rem, 5cqw, 3rem); align-items: center; }
@container dm (min-width: 760px) { .dm-hero__in { grid-template-columns: minmax(0, 1.02fr) minmax(0, .98fr); } }
.dm-hero__title {
  font-family: var(--dm-heading); font-weight: 600; text-transform: uppercase;
  font-size: clamp(2.6rem, 8cqw, 5rem); line-height: .95; letter-spacing: .06em; margin: 0;
}
.dm-hero__sub {
  font-family: var(--dm-heading); font-weight: 500; text-transform: uppercase;
  color: var(--dm-primary); letter-spacing: .04em; line-height: 1.25;
  font-size: clamp(1.15rem, 3.4cqw, 1.65rem); margin: .7rem 0 0; max-width: 15ch;
}
.dm-hero__desc { color: var(--dm-muted); font-size: .95rem; margin-top: .9rem; max-width: 34ch; line-height: 1.6; }
.dm-features { list-style: none; margin: clamp(1.4rem, 3.5cqw, 2rem) 0 0; padding: 0; display: grid; gap: .85rem; }
.dm-features li { display: flex; align-items: center; gap: .8rem; color: var(--dm-text); }
.dm-features svg { width: 26px; height: 26px; color: var(--dm-primary); flex: none; }
.dm-features span { font-size: .78rem; letter-spacing: .14em; text-transform: uppercase; line-height: 1.3; }
.dm-cta {
  display: inline-flex; align-items: center; gap: .55rem; margin-top: clamp(1.4rem, 3.5cqw, 2rem);
  background: var(--dm-button); color: var(--dm-bg); border: 1px solid var(--dm-button);
  font-family: var(--dm-heading); font-size: .85rem; letter-spacing: .12em; text-transform: uppercase;
  padding: .8rem 1.5rem; border-radius: 999px; cursor: pointer; text-decoration: none;
  transition: filter .15s ease, transform .15s ease;
}
.dm-cta:hover { filter: brightness(1.08); transform: translateY(-2px); }
.dm-cta svg { width: 15px; height: 15px; }
.dm-cta--ghost { background: transparent; color: var(--dm-primary); }

.dm-hero__plate { position: relative; display: grid; place-items: center; }
.dm-plate {
  position: relative; width: min(100%, 430px); aspect-ratio: 1; border-radius: 50%;
  background: radial-gradient(circle at 34% 28%, #2b2b2f 0%, #17171a 58%, #101012 100%);
  padding: clamp(14px, 4.6%, 26px);
  box-shadow: 0 34px 60px -30px rgba(20, 20, 15, .5), inset 0 0 0 1px rgba(255,255,255,.07);
}
.dm-plate__inner { width: 100%; height: 100%; border-radius: 50%; overflow: hidden; background: #222; }
.dm-plate img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .5s ease; }
.dm-plate:hover img { transform: scale(1.04); }

/* ---------- botanical decorations ---------- */
.dm-sprig { position: absolute; color: var(--dm-primary); pointer-events: none; }
.dm-sprig--hero { top: 2%; inset-inline-start: 44%; width: 64px; height: 96px; opacity: .55; transform: rotate(18deg); }
.dm-sprig--extras { bottom: 8%; inset-inline-end: 2%; width: 54px; height: 84px; opacity: .4; transform: rotate(-24deg); }
.dm-dots { position: absolute; display: grid; grid-template-columns: repeat(3, 8px); gap: 7px; opacity: .5; pointer-events: none; }
.dm-dots i { width: 8px; height: 8px; border-radius: 50%; background: var(--dm-primary); }
.dm-dots i:nth-child(2), .dm-dots i:nth-child(5) { opacity: .4; transform: scale(.7); }
.dm-dots i:nth-child(3) { opacity: .65; background: #B04A4A; }

/* ---------- menu ---------- */
.dm-menu { padding-block: clamp(1.5rem, 4cqw, 2.5rem); }
.dm-cat { margin-block: clamp(2rem, 6cqw, 3.5rem); }
.dm-cat__head { display: flex; align-items: baseline; gap: 1rem; margin-bottom: clamp(1rem, 3cqw, 1.6rem); }
.dm-cat__title {
  font-family: var(--dm-heading); font-weight: 600; font-size: clamp(1.05rem, 2.6cqw, 1.35rem);
  letter-spacing: .16em; text-transform: uppercase; margin: 0; white-space: nowrap;
}
.dm-cat__rule { flex: 1; height: 1px; background: var(--dm-border); }
.dm-cat__note { color: var(--dm-muted); font-size: .8rem; letter-spacing: .08em; text-transform: uppercase; }

.dm-row { display: grid; grid-template-columns: 1fr; gap: clamp(1rem, 4cqw, 2.2rem); align-items: center; margin-block: clamp(1.6rem, 5cqw, 3rem); }
@container dm (min-width: 700px) {
  .dm-row { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
  .dm-row:nth-child(even) .dm-row__media { order: 2; }
  .dm-row:nth-child(even) .dm-row__body { order: 1; padding-inline-start: 0; padding-inline-end: clamp(1rem, 4cqw, 2.5rem); }
}
.dm-row__media { display: grid; place-items: center; }
.dm-row__body { padding-inline-start: clamp(0px, 2cqw, 1rem); }
.dm-row__name {
  font-family: var(--dm-heading); font-weight: 600; text-transform: uppercase;
  font-size: clamp(1.1rem, 2.9cqw, 1.5rem); letter-spacing: .1em; margin: 0; line-height: 1.2;
}
.dm-row__desc { color: var(--dm-muted); font-size: .88rem; line-height: 1.6; margin: .55rem 0 0; max-width: 34ch; }
.dm-row__price {
  display: inline-block; margin-top: .7rem; font-family: var(--dm-heading);
  font-weight: 600; font-size: clamp(1.05rem, 2.7cqw, 1.35rem); letter-spacing: .04em;
}
.dm-row__actions { display: flex; align-items: center; gap: .6rem; margin-top: .9rem; }
.dm-add {
  width: 34px; height: 34px; border-radius: 50%; border: 1px solid var(--dm-primary);
  background: transparent; color: var(--dm-primary); font-size: 1.1rem; line-height: 1; cursor: pointer;
  display: grid; place-items: center; transition: background .15s ease, color .15s ease, transform .15s ease;
}
.dm-add:hover { background: var(--dm-primary); color: var(--dm-bg); transform: translateY(-2px); }
.dm-add:disabled { opacity: .35; cursor: not-allowed; }
.dm-x { background: transparent; border: 0; color: var(--dm-muted); cursor: pointer; font-size: 1rem; padding: .2rem .4rem; }
.dm-editbar {
  display: inline-flex; gap: .5rem; align-items: center; border: 1px dashed var(--dm-border);
  border-radius: 999px; padding: .45rem .9rem; color: var(--dm-muted); font-size: .8rem;
  background: transparent; cursor: pointer; margin-top: .6rem;
}

/* ---------- extras card ---------- */
.dm-extras { position: relative; overflow: clip; }
@container dm (max-width: 640px) { .dm-sprig--extras { display: none; } }
.dm-extras__card {
  background: color-mix(in srgb, var(--dm-primary) 10%, var(--dm-card));
  border: 1px solid color-mix(in srgb, var(--dm-primary) 26%, var(--dm-border));
  border-radius: var(--dm-radius); padding: clamp(1.1rem, 3.5cqw, 1.8rem);
  max-width: 520px;
}
.dm-extras__title {
  font-family: var(--dm-heading); font-weight: 600; text-transform: uppercase;
  letter-spacing: .14em; font-size: .92rem; margin: 0 0 .9rem;
}
.dm-extras__row { display: flex; align-items: baseline; gap: .6rem; padding-block: .45rem; border-bottom: 1px solid color-mix(in srgb, var(--dm-primary) 18%, transparent); }
.dm-extras__row:last-child { border-bottom: 0; }
.dm-extras__name { font-size: .88rem; }
.dm-extras__dots { flex: 1; border-bottom: 1px dotted color-mix(in srgb, var(--dm-primary) 40%, transparent); transform: translateY(-3px); }
.dm-extras__price { font-family: var(--dm-heading); font-weight: 600; font-size: .92rem; }
.dm-extras__add { border: 0; background: transparent; color: var(--dm-primary); cursor: pointer; font-size: .95rem; padding: 0 .15rem; }
.dm-extras__add:hover { transform: scale(1.15); }

/* ---------- footer ---------- */
.dm-footer { border-top: 1px solid var(--dm-border); margin-top: clamp(2.5rem, 7cqw, 4.5rem); padding-block: clamp(2rem, 5cqw, 3rem) 5.5rem; }
.dm-footer__in { display: flex; flex-wrap: wrap; gap: 2rem; justify-content: space-between; }
.dm-footer h4 { font-family: var(--dm-heading); font-weight: 600; font-size: 1rem; letter-spacing: .1em; text-transform: uppercase; margin: 0 0 .5rem; }
.dm-footer p { color: var(--dm-muted); font-size: .85rem; margin: 0 0 .25rem; line-height: 1.55; }
.dm-footer a { color: var(--dm-primary); text-decoration: none; font-size: .85rem; }

/* ---------- floating checkout ---------- */
.dm-float {
  position: fixed; bottom: 1.1rem; left: 50%; transform: translateX(-50%); z-index: 45;
  display: inline-flex; align-items: center; gap: .6rem;
  background: var(--dm-primary); color: var(--dm-bg); border: 0; cursor: pointer;
  font-family: var(--dm-heading); font-size: .85rem; letter-spacing: .08em;
  padding: .82rem 1.5rem; border-radius: 999px;
  box-shadow: 0 16px 36px -14px rgba(30, 32, 20, .55); transition: transform .15s ease;
}
.dm-float:hover { transform: translateX(-50%) translateY(-3px); }
.dm-float svg { width: 17px; height: 17px; }

/* ---------- cart drawer ---------- */
.dm-drawer { position: fixed; inset: 0; z-index: 60; display: flex; align-items: flex-end; justify-content: center; background: rgba(24, 24, 18, .55); }
@media (min-width: 720px) { .dm-drawer { align-items: center; } }
.dm-drawer__panel {
  width: min(460px, 100%); max-height: 86vh; overflow-y: auto;
  background: var(--dm-card); border: 1px solid var(--dm-border);
  border-radius: var(--dm-radius) var(--dm-radius) 0 0;
  box-shadow: 0 -24px 60px -24px rgba(24, 24, 18, .5);
}
@media (min-width: 720px) { .dm-drawer__panel { border-radius: var(--dm-radius); } }
.dm-drawer__head { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.2rem; border-bottom: 1px solid var(--dm-border); position: sticky; top: 0; background: var(--dm-card); }
.dm-drawer__head h3 { margin: 0; font-family: var(--dm-heading); font-weight: 600; font-size: 1.02rem; letter-spacing: .08em; text-transform: uppercase; }
.dm-drawer__body { padding: .9rem 1.2rem; display: grid; gap: .8rem; }
.dm-line { display: flex; align-items: center; gap: .7rem; }
.dm-line__info { flex: 1; min-width: 0; }
.dm-line__info p { margin: 0; font-size: .9rem; }
.dm-line__meta { color: var(--dm-muted); font-size: .8rem; }
.dm-qty { display: flex; align-items: center; gap: .45rem; }
.dm-qty button { width: 26px; height: 26px; border-radius: 50%; border: 1px solid var(--dm-border); background: transparent; color: var(--dm-text); cursor: pointer; font-weight: 700; }
.dm-qty b { min-width: 1.2rem; text-align: center; font-size: .9rem; }
.dm-drawer__foot { border-top: 1px solid var(--dm-border); padding: 1rem 1.2rem 1.3rem; position: sticky; bottom: 0; background: var(--dm-card); }
.dm-total { display: flex; justify-content: space-between; font-family: var(--dm-heading); font-weight: 600; font-size: 1.05rem; margin-bottom: .8rem; }
.dm-checkout { width: 100%; justify-content: center; margin-top: 0; }
.dm-empty { color: var(--dm-muted); text-align: center; padding: 1.6rem 0; }
`

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

function dmSignature(line: { options: Array<{ groupId: string; optionId: string }> }): string {
  return line.options.map((o) => `${o.groupId}:${o.optionId}`).sort().join('|')
}

function addToCart(r: Restaurant, item: MenuItem) {
  useCartStore.getState().add({
    restaurantId: r.id,
    slug: r.slug,
    restaurantName: tx(r.name) || 'Restaurant',
    item,
    displayName: tx(item.name) || 'Item',
    options: [],
    note: '',
  })
}

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function isExtras(name: string) {
  return /(extra|add[- ]?on|add to|sauce|side|topping|إضاف|اضاف|إضافة|مكمل)/i.test(name)
}

/* ---------------------------- icons ---------------------------- */

const STROKE = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

const ICON = {
  leaf: (<><path d="M20 4C10 5 4 10 4 17a3 3 0 0 0 3 3c7 0 12-6 13-16z" /><path d="M7 20c2-5 5-8 9-10" /></>),
  heart: (<path d="M12 20s-7.5-4.6-7.5-9.6A4.4 4.4 0 0 1 12 7.4a4.4 4.4 0 0 1 7.5 3c0 5-7.5 9.6-7.5 9.6z" />),
  cupcake: (<><path d="M5 12h14l-1.4 7.2a2 2 0 0 1-2 1.8H8.4a2 2 0 0 1-2-1.8L5 12z" /><path d="M7 12c-1.7-1.2-2-4 .4-5.2C7.2 4.4 9 3 11 3.6c1.9-1.6 4.6-.6 4.9 1.3 2.1.4 3 2.5 1.9 4.3l-.8 2.8" /></>),
  strawberry: (<><path d="M12 21c4-2.4 6.5-6 6.5-9.6 0-2.4-2.9-4.4-6.5-4.4s-6.5 2-6.5 4.4C5.5 15 8 18.6 12 21z" /><path d="M9 5.5C9.6 4 10.8 3 12 3s2.4 1 3 2.5" /><path d="M12 7v1.5M9.5 8l.7 1.2M14.5 8l-.7 1.2" /></>),
  cart: (<><path d="M4 5h2l2.2 10.2a1.5 1.5 0 0 0 1.5 1.3h7.6a1.5 1.5 0 0 0 1.5-1.2L20.5 8H6.4" /><circle cx="10" cy="20" r="1.3" fill="currentColor" stroke="none" /><circle cx="17.5" cy="20" r="1.3" fill="currentColor" stroke="none" /></>),
  arrow: (<path d="M5 12h13m-5-6 6 6-6 6" />),
  bowl: (<><path d="M4 12.5h16c0 4.2-3.3 7.5-8 7.5s-8-3.3-8-7.5z" /><path d="M9 9.5c0-1.3.8-2 1.6-2.6C11.4 6.2 12 5.6 12 4.5c0-.8-.4-1.4-1-1.9" /><path d="M14.5 9.2c.9-.1 1.7-.7 1.9-1.6" /></>),
}

function Ico({ path, className }: { path: ReactElement; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" {...STROKE} aria-hidden="true">{path}</svg>
  )
}

/* ---------------------------- decorations ---------------------------- */

function Sprig({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 60 92" aria-hidden="true" style={{ fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' }}>
      <path d="M30 90C30 64 34 38 46 10" />
      <path d="M32 74c8-2 13-7 13-15-8 2-12 6-13 15z" fill="currentColor" opacity=".45" stroke="none" />
      <path d="M34 58c-8-1-13-6-14-13 8 1 12 5 14 13z" fill="currentColor" opacity=".35" stroke="none" />
      <path d="M38 42c8-2 12-7 12-14-7 2-11 6-12 14z" fill="currentColor" opacity=".45" stroke="none" />
      <path d="M41 27c-7-1-11-5-12-11 7 1 10 4 12 11z" fill="currentColor" opacity=".3" stroke="none" />
    </svg>
  )
}

function Dots({ style }: { style?: CSSProperties }) {
  return (
    <span className="dm-dots" style={style} aria-hidden="true">
      <i /><i /><i /><i /><i /><i />
    </span>
  )
}

/* ---------------------------- header ---------------------------- */

function DessertsHeader({ count, onCart }: { count: number; onCart: () => void }) {
  return (
    <header className="dm-header">
      <div className="dm-shell dm-header__in">
        <div className="dm-logo">
          <span className="dm-logo__mark"><Ico path={ICON.bowl} /></span>
          <span className="dm-logo__text">
            <span className="dm-logo__name"><Ed path="name" label="Restaurant name" /></span>
            <span className="dm-logo__tag"><Ed path="tagline" fallback="Desserts made with soul" label="Tagline" /></span>
          </span>
        </div>
        <div className="dm-header__actions">
          <button type="button" className="dm-iconbtn" aria-label="Cart" onClick={onCart}>
            <Ico path={ICON.cart} />
            {count > 0 ? <span className="dm-iconbtn__badge">{count}</span> : null}
          </button>
        </div>
      </div>
    </header>
  )
}

/* ---------------------------- hero ---------------------------- */

const FEATURES = [
  { icon: ICON.leaf, path: 'copy.dmFeature1', fallback: 'Natural ingredients' },
  { icon: ICON.heart, path: 'copy.dmFeature2', fallback: 'Made with love' },
  { icon: ICON.cupcake, path: 'copy.dmFeature3', fallback: 'Delicate taste & aroma' },
  { icon: ICON.strawberry, path: 'copy.dmFeature4', fallback: 'Fresh every day' },
]

function DessertsHero({ r }: { r: Restaurant }) {
  return (
    <section className="dm-hero" id="dm-hero">
      <div className="dm-hero__blob" aria-hidden="true">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M46 0 C60 12 42 26 48 40 C54 54 38 64 46 78 C53 91 44 96 46 100 L100 100 L100 0 Z" fill="currentColor" />
        </svg>
      </div>
      <Sprig className="dm-sprig dm-sprig--hero" />
      <Dots style={{ top: '12%', insetInlineStart: '52%' }} />
      <div className="dm-shell dm-hero__in">
        <div className="dm-hero__text">
          <h1 className="dm-hero__title"><Ed path="copy.dmTitle" fallback="Desserts" label="Hero title" /></h1>
          <p className="dm-hero__sub"><Ed path="copy.dmSubtitle" fallback="For special moments" label="Hero subtitle" /></p>
          <p className="dm-hero__desc"><Ed path="description" fallback="Small-batch desserts, baked fresh every morning." label="Description" /></p>
          <ul className="dm-features">
            {FEATURES.map((f) => (
              <li key={f.path}><Ico path={f.icon} /><span><Ed path={f.path} fallback={f.fallback} label="Feature" /></span></li>
            ))}
          </ul>
          <button type="button" className="dm-cta" onClick={() => scrollToId('dm-menu')}>
            See the live menu <Ico path={ICON.arrow} />
          </button>
        </div>
        <div className="dm-hero__plate">
          <div className="dm-plate">
            <div className="dm-plate__inner">
              {r.heroImage
                ? <EdImage path="heroImage" src={r.heroImage} alt={tx(r.name) || ''} label="Hero photo" />
                : <img src={IMG.platedDessert} alt="" />}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------------------------- menu ---------------------------- */

function DessertsMenu({
  r, extrasId, editable, onMenuEdit, currency,
}: {
  r: Restaurant
  extrasId: string | null
  editable?: boolean
  onMenuEdit?: (recipe: (draft: Restaurant) => void) => void
  currency?: string
}) {
  const cats = r.menu.filter((c) => c.id !== extrasId && (editable || c.items.length > 0))
  return (
    <div className="dm-shell dm-menu" id="dm-menu">
      {cats.map((cat) => {
        const ci = r.menu.indexOf(cat)
        return (
          <section key={cat.id} className="dm-cat" id={`dm-cat-${cat.id}`}>
            <div className="dm-cat__head">
              <h2 className="dm-cat__title"><Ed path={`menu.${ci}.name`} label="Category name" /></h2>
              <span className="dm-cat__rule" aria-hidden="true" />
              {cat.note ? <span className="dm-cat__note"><Ed path={`menu.${ci}.note`} label="Category note" /></span> : null}
            </div>
            {cat.items.map((item, ii) => {
              const base = `menu.${ci}.items.${ii}`
              return (
                <article key={item.id || base} className="dm-row">
                  <div className="dm-row__media">
                    <div className="dm-plate">
                      <div className="dm-plate__inner">
                        {item.image
                          ? <EdImage path={`${base}.image`} src={item.image} alt={tx(item.name) || ''} label="Product photo" style={imageFitStyle(item.imageFit) as CSSProperties} />
                          : <img src={IMG.platedDessert} alt="" />}
                      </div>
                    </div>
                  </div>
                  <div className="dm-row__body">
                    <h3 className="dm-row__name"><Ed path={`${base}.name`} label="Product name" /></h3>
                    <p className="dm-row__desc"><Ed path={`${base}.description`} multiline label="Product description" /></p>
                    <span className="dm-row__price">
                      <Ed numeric path={`${base}.price`} format={(v) => money(Number(v) || 0, currency || '$')} label="Product price" />
                    </span>
                    <div className="dm-row__actions">
                      <button
                        type="button" className="dm-add" aria-label={`Add ${tx(item.name)}`}
                        disabled={!item.available}
                        onClick={() => addToCart(r, item)}
                      >+</button>
                      {editable ? (
                        <button
                          type="button" className="dm-x" aria-label="Delete dessert"
                          onClick={() => { void confirmDialog({ title: 'Delete this dessert?', tone: 'danger' }).then(() => onMenuEdit?.((d) => { const idx = d.menu.findIndex((m) => m.id === cat.id); if (idx >= 0) { const j = d.menu[idx].items.findIndex((it) => it.id === item.id); if (j >= 0) d.menu[idx].items.splice(j, 1) } })) }}
                        >✕</button>
                      ) : null}
                    </div>
                  </div>
                </article>
              )
            })}
            {editable ? (
              <button
                type="button" className="dm-editbar"
                onClick={() => onMenuEdit?.((d) => {
                  const idx = d.menu.findIndex((m) => m.id === cat.id)
                  if (idx >= 0) d.menu[idx].items.push({ id: `item-${Date.now()}`, name: 'New dessert', description: '', price: 0, compareAt: null, image: '', available: true, featured: false, popular: false })
                })}
              >+ Add dessert</button>
            ) : null}
          </section>
        )
      })}
      {editable ? (
        <button
          type="button" className="dm-editbar"
          onClick={() => onMenuEdit?.((d) => {
            if (!Array.isArray(d.menu)) d.menu = []
            d.menu.push({ id: `cat-${Date.now()}`, name: 'New category', note: '', items: [] })
          })}
        >+ Add category</button>
      ) : null}
    </div>
  )
}

/* ---------------------------- extras ---------------------------- */

function DessertExtras({
  r, catIndex, currency, editable, onMenuEdit,
}: {
  r: Restaurant
  catIndex: number
  currency?: string
  editable?: boolean
  onMenuEdit?: (recipe: (draft: Restaurant) => void) => void
}) {
  const cat = r.menu[catIndex]
  if (!cat) return null
  return (
    <div className="dm-shell dm-extras">
      <Sprig className="dm-sprig dm-sprig--extras" />
      <div className="dm-extras__card">
        <h3 className="dm-extras__title"><Ed path={`menu.${catIndex}.name`} label="Extras title" /></h3>
        {cat.items.map((item, ii) => {
          const base = `menu.${catIndex}.items.${ii}`
          return (
            <div key={item.id || base} className="dm-extras__row">
              <span className="dm-extras__name"><Ed path={`${base}.name`} label="Extra name" /></span>
              <span className="dm-extras__dots" aria-hidden="true" />
              <span className="dm-extras__price">
                <Ed numeric path={`${base}.price`} format={(v) => money(Number(v) || 0, currency || '$')} label="Extra price" />
              </span>
              <button
                type="button" className="dm-extras__add" aria-label={`Add ${tx(item.name)}`}
                disabled={!item.available}
                onClick={() => addToCart(r, item)}
              >+</button>
              {editable ? (
                <button
                  type="button" className="dm-x" aria-label="Delete extra"
                  onClick={() => onMenuEdit?.((d) => { const j = d.menu[catIndex]?.items.findIndex((it) => it.id === item.id) ?? -1; if (j >= 0) d.menu[catIndex].items.splice(j, 1) })}
                >✕</button>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ---------------------------- footer ---------------------------- */

function DessertsFooter({ r }: { r: Restaurant }) {
  return (
    <footer className="dm-footer">
      <div className="dm-shell dm-footer__in">
        <div>
          <h4><Ed path="name" label="Restaurant name" /></h4>
          <p><Ed path="address" label="Address" /></p>
          {r.phone ? <p><a href={`tel:${r.phone}`}>{r.phone}</a></p> : null}
          {r.email ? <p><a href={`mailto:${r.email}`}>{r.email}</a></p> : null}
        </div>
        <div>
          <h4>Opening hours</h4>
          {(r.hours || []).map((h) => <p key={h.day + h.hours}>{h.day}: {h.hours}</p>)}
        </div>
        <div>
          <h4>Follow</h4>
          {r.socials?.instagram ? <p><a href={r.socials.instagram} target="_blank" rel="noreferrer">Instagram</a></p> : null}
          {r.socials?.facebook ? <p><a href={r.socials.facebook} target="_blank" rel="noreferrer">Facebook</a></p> : null}
          {r.socials?.website ? <p><a href={r.socials.website} target="_blank" rel="noreferrer">Website</a></p> : null}
        </div>
      </div>
    </footer>
  )
}

/* ---------------------------- cart drawer ---------------------------- */

function DessertsDrawer({
  onClose, onCheckout, currency,
}: { onClose: () => void; onCheckout: () => void; currency?: string }) {
  const cart = useCartStore()
  return (
    <div className="dm-drawer" role="dialog" aria-label="Cart" onClick={onClose}>
      <div className="dm-drawer__panel" onClick={(e) => e.stopPropagation()}>
        <div className="dm-drawer__head">
          <h3>Your order · {cart.count}</h3>
          <button type="button" className="dm-x" aria-label="Close cart" onClick={onClose}>✕</button>
        </div>
        <div className="dm-drawer__body">
          {cart.lines.length === 0 ? <p className="dm-empty">Your cart is empty.</p> : cart.lines.map((line) => {
            const sig = dmSignature(line)
            return (
              <div key={`${line.itemId}-${sig}`} className="dm-line">
                <div className="dm-line__info">
                  <p>{line.name}</p>
                  <span className="dm-line__meta">{money(line.price, currency || '$')} × {line.qty}</span>
                </div>
                <div className="dm-qty">
                  <button type="button" aria-label="Decrease" onClick={() => cart.setQty(line.itemId, sig, line.qty - 1)}>−</button>
                  <b>{line.qty}</b>
                  <button type="button" aria-label="Increase" onClick={() => cart.setQty(line.itemId, sig, line.qty + 1)}>+</button>
                </div>
                <button type="button" className="dm-x" aria-label="Remove" onClick={() => cart.remove(line.itemId, sig)}>✕</button>
              </div>
            )
          })}
        </div>
        {cart.lines.length > 0 ? (
          <div className="dm-drawer__foot">
            <div className="dm-total"><span>Total</span><span>{money(cart.subtotal, currency || '$')}</span></div>
            <button type="button" className="dm-cta dm-checkout" onClick={onCheckout}>
              Checkout <Ico path={ICON.arrow} />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

/* ---------------------------- site ---------------------------- */

export function DessertsMenuSite({
  restaurant: r, interactive = true, currency, editable = false,
  onActiveChange, onCommit, onStyle, onMenuEdit,
}: Props): ReactElement {
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const cart = useCartStore()

  const extrasIndex = r.menu.findIndex((c) => isExtras(tx(c.name)))
  const extrasId = extrasIndex >= 0 ? r.menu[extrasIndex].id : null

  const openCheckout = () => { setCartOpen(false); setCheckoutOpen(true) }

  return (
    <InlineEditProvider restaurant={r} enabled={editable} onActiveChange={onActiveChange} onCommit={onCommit} onStyle={onStyle}>
      <div className="dm-root" style={dmVars(r)} data-mode="site" data-interactive={interactive ? 'true' : 'false'} data-variant={(r.design?.layout as any)?.variant || 'desserts-menu'}>
        <style>{DM_STYLE}</style>

        <div className="dm-page">
          <DessertsHeader count={cart.count} onCart={() => setCartOpen(true)} />
          <DessertsHero r={r} />
          <DessertsMenu r={r} extrasId={extrasId} editable={editable} onMenuEdit={onMenuEdit} currency={currency} />
          {extrasIndex >= 0 ? (
            <DessertExtras r={r} catIndex={extrasIndex} currency={currency} editable={editable} onMenuEdit={onMenuEdit} />
          ) : null}
          <DessertsFooter r={r} />
        </div>

        <button
          type="button"
          className="dm-float"
          onClick={() => { if (cart.count > 0) openCheckout(); else scrollToId('dm-menu') }}
          aria-label={cart.count > 0 ? 'Checkout' : 'See the live menu'}
        >
          <Ico path={cart.count > 0 ? ICON.cart : ICON.arrow} />
          {cart.count > 0
            ? <>Checkout · {cart.count} · {money(cart.subtotal, currency || '$')}</>
            : <>See the live menu</>}
        </button>

        {cartOpen ? <DessertsDrawer onClose={() => setCartOpen(false)} onCheckout={openCheckout} currency={currency} /> : null}
        {checkoutOpen ? (
          <TemplateCheckoutOverlay
            restaurant={r}
            onClose={() => setCheckoutOpen(false)}
            onPlaced={() => { void useCartStore.getState().clear(); setCheckoutOpen(false) }}
          />
        ) : null}
      </div>
    </InlineEditProvider>
  )
}

export default DessertsMenuSite
