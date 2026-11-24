/**
 * Tavern — Neo-Brutalist Deli renderer.
 *
 * Bold printed price-board aesthetic: bone canvas, cobalt/tomato/mustard
 * blocks, heavy ink borders, hard offset shadows, condensed uppercase type and
 * monospaced prices. Reuses shared contracts: useCartStore,
 * TemplateCheckoutOverlay, Ed/EdImage. No new business logic.
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

function tvVars(r: Restaurant): CSSProperties {
  const d = r.design
  const c = (d && d.colors) as unknown as Record<string, string>
  const t = (d && d.typography) as Record<string, any>
  const l = (d && d.layout) as Record<string, any>
  const bg = c.background ?? '#F4F1EA'
  const text = c.text ?? '#0D0D0D'
  const ink = c.border || text
  return {
    '--tv-bg': bg,
    '--tv-text': text,
    '--tv-card': c.card ?? '#FFFFFF',
    '--tv-primary': c.primary ?? '#1B3AFF',
    '--tv-secondary': c.secondary ?? '#FF4D2E',
    '--tv-accent': c.accent ?? '#FFD23F',
    '--tv-button': c.button ?? text,
    '--tv-ink': ink,
    '--tv-muted': mix(text, bg, 0.5),
    '--tv-soft': mix(text, bg, 0.08),
    '--tv-heading': fontStack(t.heading || 'montserrat'),
    '--tv-body': fontStack(t.body || 'inter'),
    '--tv-radius': `${Math.min(l.radius ?? 4, 12)}px`,
    '--tv-shadow': `4px 4px 0 ${ink}`,
    '--tv-shadow-sm': `2px 2px 0 ${ink}`,
  } as CSSProperties
}

const TV_STYLE = `
.tv-root {
  display:block; color:var(--tv-text); background:var(--tv-bg);
  font-family:var(--tv-body); min-height:100vh; width:100%;
  animation:tvReveal .45s ease both;
}
.tv-page { position:relative; width:100%; container-name:tv; container-type:inline-size; }
/* Opacity-only reveal: transform on root would break fixed overlays. */
@keyframes tvReveal { from { opacity:0; } to { opacity:1; } }
@keyframes tvMarquee { from { transform:translateX(0); } to { transform:translateX(-50%); } }
@media (prefers-reduced-motion: reduce) {
  .tv-root, .tv-root * { animation:none !important; transition:none !important; scroll-behavior:auto !important; }
}
.tv-shell { max-width:1180px; margin-inline:auto; padding-inline:clamp(14px,3.2cqw,40px); }

/* header */
.tv-header {
  position:sticky; top:0; z-index:40; background:var(--tv-bg);
  border-bottom:3px solid var(--tv-ink);
}
.tv-header__in { display:flex; align-items:center; gap:1rem; padding-block:.85rem; }
.tv-logo { display:flex; align-items:center; gap:.7rem; min-width:0; }
.tv-logo__mark {
  width:44px; height:44px; flex:none; display:grid; place-items:center;
  background:var(--tv-primary); color:#fff; border:2px solid var(--tv-ink);
  box-shadow:var(--tv-shadow-sm); font-family:var(--tv-heading); font-weight:900; font-size:1.1rem;
}
.tv-logo__name {
  font-family:var(--tv-heading); font-weight:900; font-size:clamp(1.1rem,2.8cqw,1.6rem);
  text-transform:uppercase; letter-spacing:.02em; line-height:1;
}
.tv-logo__tag { color:var(--tv-muted); font-size:.76rem; font-weight:700; text-transform:uppercase; letter-spacing:.12em; }
.tv-header__actions { margin-inline-start:auto; display:flex; gap:.55rem; }
.tv-iconbtn {
  position:relative; width:44px; height:44px; display:grid; place-items:center;
  background:var(--tv-card); color:var(--tv-text); border:2px solid var(--tv-ink);
  box-shadow:var(--tv-shadow-sm); cursor:pointer; transition:transform .12s ease, box-shadow .12s ease;
}
.tv-iconbtn:hover { transform:translate(-1px,-1px); box-shadow:4px 4px 0 var(--tv-ink); }
.tv-iconbtn:active { transform:translate(2px,2px); box-shadow:none; }
.tv-iconbtn svg { width:20px; height:20px; }
.tv-iconbtn__badge {
  position:absolute; top:-7px; inset-inline-end:-7px; min-width:22px; height:22px; padding-inline:4px;
  background:var(--tv-secondary); color:#fff; border:2px solid var(--tv-ink);
  font-family:var(--tv-heading); font-size:.68rem; font-weight:900; display:grid; place-items:center;
}

/* marquee */
.tv-marquee {
  overflow:hidden; border-bottom:3px solid var(--tv-ink); background:var(--tv-accent);
  color:var(--tv-text); font-family:var(--tv-heading); font-weight:900; font-size:.76rem;
  letter-spacing:.12em; text-transform:uppercase;
}
.tv-marquee__track { display:flex; width:max-content; padding-block:.55rem; animation:tvMarquee 26s linear infinite; }
.tv-marquee:hover .tv-marquee__track { animation-play-state:paused; }
.tv-marquee__chunk { display:flex; gap:1.4rem; padding-inline-end:1.4rem; white-space:nowrap; }
.tv-marquee__dot { color:var(--tv-secondary); }

/* hero */
.tv-hero { padding-block:clamp(2rem,5cqw,4rem) clamp(1.4rem,4cqw,2.4rem); border-bottom:3px solid var(--tv-ink); }
.tv-hero__in { display:grid; grid-template-columns:1fr; gap:clamp(1.2rem,4cqw,2.4rem); align-items:end; }
@container tv (min-width:820px) { .tv-hero__in { grid-template-columns:minmax(0,1.3fr) minmax(0,.7fr); } }
.tv-kicker {
  display:inline-flex; align-items:center; gap:.45rem; width:fit-content;
  background:var(--tv-primary); color:#fff; border:2px solid var(--tv-ink); box-shadow:var(--tv-shadow-sm);
  font-family:var(--tv-heading); font-size:.72rem; font-weight:900; letter-spacing:.14em;
  text-transform:uppercase; padding:.4rem .75rem; margin-bottom:1rem;
}
.tv-title {
  font-family:var(--tv-heading); font-weight:900; text-transform:uppercase; line-height:.88;
  font-size:clamp(3rem,11cqw,7.2rem); letter-spacing:-.03em; margin:0; word-break:break-word;
}
.tv-title em { font-style:normal; color:var(--tv-primary); }
.tv-tagline {
  font-family:var(--tv-heading); font-weight:800; font-size:clamp(1rem,2.4cqw,1.35rem);
  text-transform:uppercase; letter-spacing:.04em; margin:.9rem 0 0; max-width:22ch;
}
.tv-desc { color:var(--tv-muted); font-size:.96rem; line-height:1.65; margin:.8rem 0 0; max-width:48ch; }
.tv-hero__side { display:grid; gap:.8rem; }
.tv-stamp {
  background:var(--tv-card); border:3px solid var(--tv-ink); box-shadow:var(--tv-shadow);
  padding:1rem 1.1rem;
}
.tv-stamp__label { display:flex; align-items:center; gap:.4rem; font-family:var(--tv-heading); font-weight:900; font-size:.7rem; letter-spacing:.16em; text-transform:uppercase; color:var(--tv-muted); margin-bottom:.35rem; }
.tv-stamp__label svg { width:14px; height:14px; flex:none; }
.tv-stamp__value { font-family:var(--tv-heading); font-weight:800; font-size:1rem; line-height:1.35; }
.tv-stamp__value a { color:var(--tv-primary); text-decoration:none; }
.tv-cta-row { display:flex; flex-wrap:wrap; gap:.7rem; margin-top:1.4rem; }
.tv-btn {
  display:inline-flex; align-items:center; justify-content:center; gap:.5rem;
  font-family:var(--tv-heading); font-weight:900; font-size:.82rem; letter-spacing:.08em; text-transform:uppercase;
  padding:.85rem 1.25rem; border:3px solid var(--tv-ink); cursor:pointer; text-decoration:none;
  box-shadow:var(--tv-shadow-sm); transition:transform .12s ease, box-shadow .12s ease;
}
.tv-btn:hover { transform:translate(-2px,-2px); box-shadow:6px 6px 0 var(--tv-ink); }
.tv-btn:active { transform:translate(2px,2px); box-shadow:none; }
.tv-btn--solid { background:var(--tv-text); color:var(--tv-bg); }
.tv-btn--ghost { background:var(--tv-card); color:var(--tv-text); }
.tv-btn--accent { background:var(--tv-accent); color:var(--tv-text); }
.tv-btn svg { width:16px; height:16px; flex:none; }

/* section head */
.tv-sec { padding-block:clamp(1.6rem,4cqw,2.8rem); }
.tv-sec__head {
  display:flex; flex-wrap:wrap; align-items:end; gap:.8rem 1rem;
  padding-bottom:1rem; margin-bottom:1.2rem; border-bottom:3px solid var(--tv-ink);
}
.tv-sec__title {
  font-family:var(--tv-heading); font-weight:900; text-transform:uppercase;
  font-size:clamp(1.8rem,5cqw,3rem); line-height:.95; letter-spacing:-.02em; margin:0;
}
.tv-sec__count {
  font-family:ui-monospace, SFMono-Regular, Menlo, monospace; font-weight:700; font-size:.78rem;
  background:var(--tv-accent); border:2px solid var(--tv-ink); padding:.2rem .55rem;
}
.tv-sec__note { color:var(--tv-muted); font-size:.84rem; font-weight:700; text-transform:uppercase; letter-spacing:.08em; margin-inline-start:auto; }

/* category tabs */
.tv-cats { display:flex; flex-wrap:wrap; gap:.55rem; margin-bottom:1.2rem; }
.tv-catbtn {
  font-family:var(--tv-heading); font-weight:900; font-size:.72rem; letter-spacing:.08em; text-transform:uppercase;
  padding:.55rem .85rem; border:2px solid var(--tv-ink); background:var(--tv-card); color:var(--tv-text);
  cursor:pointer; box-shadow:2px 2px 0 var(--tv-ink); transition:transform .1s ease, box-shadow .1s ease;
}
.tv-catbtn:hover { transform:translate(-1px,-1px); box-shadow:3px 3px 0 var(--tv-ink); }
.tv-catbtn[aria-pressed="true"] { background:var(--tv-primary); color:#fff; }

/* menu grid */
.tv-grid { display:grid; grid-template-columns:1fr; gap:1rem; }
@container tv (min-width:640px) { .tv-grid { grid-template-columns:repeat(2, minmax(0,1fr)); } }
.tv-card {
  display:grid; grid-template-rows:auto 1fr; background:var(--tv-card);
  border:3px solid var(--tv-ink); box-shadow:var(--tv-shadow); min-width:0;
  transition:transform .12s ease, box-shadow .12s ease;
}
.tv-card:hover { transform:translate(-2px,-2px); box-shadow:7px 7px 0 var(--tv-ink); }
.tv-card__media { position:relative; aspect-ratio:4/3; border-bottom:3px solid var(--tv-ink); background:var(--tv-soft); overflow:hidden; }
.tv-card__media img { width:100%; height:100%; object-fit:cover; display:block; }
.tv-card__badges { position:absolute; top:.65rem; inset-inline-start:.65rem; display:flex; flex-wrap:wrap; gap:.35rem; }
.tv-badge {
  font-family:var(--tv-heading); font-weight:900; font-size:.62rem; letter-spacing:.08em; text-transform:uppercase;
  padding:.28rem .5rem; border:2px solid var(--tv-ink); background:var(--tv-accent); color:var(--tv-text);
}
.tv-badge--hot { background:var(--tv-secondary); color:#fff; }
.tv-badge--veg { background:#1F9D55; color:#fff; }
.tv-card__body { display:flex; flex-direction:column; padding:1rem; gap:.55rem; }
.tv-card__top { display:flex; align-items:flex-start; justify-content:space-between; gap:.8rem; }
.tv-card__name { font-family:var(--tv-heading); font-weight:900; font-size:1.02rem; text-transform:uppercase; line-height:1.1; margin:0; }
.tv-card__price {
  font-family:ui-monospace, SFMono-Regular, Menlo, monospace; font-weight:800; font-size:.95rem;
  white-space:nowrap; background:var(--tv-bg); border:2px solid var(--tv-ink); padding:.2rem .45rem;
}
.tv-card__desc { color:var(--tv-muted); font-size:.86rem; line-height:1.55; margin:0; flex:1; }
.tv-card__foot { display:flex; align-items:center; justify-content:space-between; gap:.7rem; margin-top:.35rem; }
.tv-add {
  display:inline-flex; align-items:center; gap:.45rem;
  font-family:var(--tv-heading); font-weight:900; font-size:.72rem; letter-spacing:.08em; text-transform:uppercase;
  padding:.55rem .85rem; border:2px solid var(--tv-ink); background:var(--tv-text); color:var(--tv-bg);
  cursor:pointer; box-shadow:2px 2px 0 var(--tv-primary); transition:transform .1s ease, box-shadow .1s ease;
}
.tv-add:hover:not(:disabled) { transform:translate(-1px,-1px); box-shadow:4px 4px 0 var(--tv-primary); }
.tv-add:active:not(:disabled) { transform:translate(2px,2px); box-shadow:none; }
.tv-add:disabled { opacity:.4; cursor:not-allowed; }
.tv-sold { font-family:var(--tv-heading); font-weight:900; font-size:.72rem; letter-spacing:.08em; text-transform:uppercase; color:var(--tv-secondary); }
.tv-x { background:transparent; border:0; color:var(--tv-muted); cursor:pointer; font-size:1rem; padding:.2rem .35rem; }

/* editor bars */
.tv-editbar {
  display:inline-flex; align-items:center; gap:.45rem; margin-top:.8rem;
  font-family:var(--tv-heading); font-weight:800; font-size:.72rem; letter-spacing:.06em; text-transform:uppercase;
  padding:.55rem .85rem; background:transparent; color:var(--tv-muted);
  border:2px dashed var(--tv-ink); cursor:pointer;
}
.tv-editbar:hover { color:var(--tv-text); background:var(--tv-soft); }

/* footer / info */
.tv-footer { border-top:3px solid var(--tv-ink); padding-block:clamp(2rem,5cqw,3rem) 6rem; background:var(--tv-card); }
.tv-footer__grid { display:grid; grid-template-columns:1fr; gap:1.2rem; }
@container tv (min-width:700px) { .tv-footer__grid { grid-template-columns:1.2fr 1fr 1fr; } }
.tv-footer__block { border:2px solid var(--tv-ink); padding:1rem; background:var(--tv-bg); }
.tv-footer h4 { font-family:var(--tv-heading); font-weight:900; font-size:.78rem; letter-spacing:.14em; text-transform:uppercase; margin:0 0 .6rem; }
.tv-footer p, .tv-footer a { font-size:.88rem; line-height:1.6; color:var(--tv-text); margin:0 0 .25rem; text-decoration:none; }
.tv-footer a { color:var(--tv-primary); font-weight:700; }
.tv-footer__big { font-family:var(--tv-heading); font-weight:900; font-size:clamp(1.4rem,4cqw,2.2rem); text-transform:uppercase; line-height:.95; margin:0 0 .5rem; }

/* float cart */
.tv-float {
  position:fixed; bottom:1rem; left:50%; transform:translateX(-50%); z-index:45;
  display:inline-flex; align-items:center; gap:.65rem; max-width:calc(100vw - 2rem);
  font-family:var(--tv-heading); font-weight:900; font-size:.78rem; letter-spacing:.06em; text-transform:uppercase;
  padding:.85rem 1.2rem; border:3px solid var(--tv-ink); background:var(--tv-primary); color:#fff;
  box-shadow:6px 6px 0 var(--tv-ink); cursor:pointer; transition:transform .12s ease, box-shadow .12s ease;
}
.tv-float:hover { transform:translateX(-50%) translateY(-3px); box-shadow:8px 8px 0 var(--tv-ink); }
.tv-float:active { transform:translateX(-50%) translateY(2px); box-shadow:2px 2px 0 var(--tv-ink); }
.tv-float svg { width:18px; height:18px; flex:none; }
.tv-float__count { background:#fff; color:var(--tv-ink); padding:.1rem .45rem; border:2px solid var(--tv-ink); font-size:.72rem; }

/* drawer */
.tv-drawer { position:fixed; inset:0; z-index:60; display:flex; align-items:flex-end; justify-content:center; background:rgba(13,13,13,.55); }
@media (min-width:720px) { .tv-drawer { align-items:center; padding:1rem; } }
.tv-drawer__panel {
  width:min(520px,100%); max-height:86vh; overflow-y:auto; background:var(--tv-bg);
  border:3px solid var(--tv-ink); box-shadow:8px 8px 0 rgba(13,13,13,.35);
}
@media (min-width:720px) { .tv-drawer__panel { max-height:82vh; } }
.tv-drawer__head {
  display:flex; align-items:center; justify-content:space-between; gap:1rem;
  padding:1rem 1.1rem; border-bottom:3px solid var(--tv-ink); background:var(--tv-accent);
  position:sticky; top:0; z-index:1;
}
.tv-drawer__head h3 { margin:0; font-family:var(--tv-heading); font-weight:900; font-size:1rem; text-transform:uppercase; letter-spacing:.04em; }
.tv-drawer__body { padding:1rem 1.1rem; display:grid; gap:.8rem; }
.tv-line { display:flex; align-items:center; gap:.75rem; padding-bottom:.8rem; border-bottom:2px dashed color-mix(in srgb, var(--tv-ink) 25%, transparent); }
.tv-line:last-child { padding-bottom:0; border-bottom:0; }
.tv-line__info { flex:1; min-width:0; }
.tv-line__info p { margin:0; font-family:var(--tv-heading); font-weight:800; font-size:.88rem; text-transform:uppercase; }
.tv-line__meta { color:var(--tv-muted); font-size:.8rem; font-family:ui-monospace, SFMono-Regular, Menlo, monospace; }
.tv-qty { display:flex; align-items:center; gap:.4rem; }
.tv-qty button {
  width:30px; height:30px; border:2px solid var(--tv-ink); background:var(--tv-card);
  font-family:var(--tv-heading); font-weight:900; cursor:pointer; box-shadow:1px 1px 0 var(--tv-ink);
}
.tv-qty button:hover { background:var(--tv-accent); }
.tv-qty b { min-width:1.3rem; text-align:center; font-family:ui-monospace, SFMono-Regular, Menlo, monospace; }
.tv-drawer__foot { padding:1rem 1.1rem 1.2rem; border-top:3px solid var(--tv-ink); background:var(--tv-card); position:sticky; bottom:0; }
.tv-total { display:flex; justify-content:space-between; align-items:baseline; margin-bottom:.9rem; font-family:var(--tv-heading); font-weight:900; text-transform:uppercase; }
.tv-total span:last-child { font-family:ui-monospace, SFMono-Regular, Menlo, monospace; font-size:1.2rem; }
.tv-checkout { width:100%; justify-content:center; }
.tv-empty { color:var(--tv-muted); font-weight:700; text-align:center; padding:1.5rem 0; margin:0; }
`
function tvSignature(line: { options: Array<{ groupId: string; optionId: string }> }): string {
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

const STROKE = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const
const ICON = {
  cart: (<><path d="M3 5h2l2.2 10.5a1.5 1.5 0 0 0 1.5 1.2h8a1.5 1.5 0 0 0 1.5-1.2L20 8H6" /><circle cx="10" cy="19.5" r="1.4" fill="currentColor" stroke="none" /><circle cx="16.5" cy="19.5" r="1.4" fill="currentColor" stroke="none" /></>),
  arrow: (<path d="M5 12h13m-5-6 6 6-6 6" />),
  plus: (<path d="M12 5v14M5 12h14" />),
  pin: (<><path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></>),
  phone: (<path d="M6.5 4h3l1.5 4-2 1.5a12 12 0 0 0 5.5 5.5L16 13l4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 6.2 2 2 0 0 1 6.5 4z" />),
  clock: (<><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>),
}
function Ico({ path }: { path: ReactElement }) {
  return <svg viewBox="0 0 24 24" {...STROKE} aria-hidden="true">{path}</svg>
}

function TavernHeader({ count, onCart }: { count: number; onCart: () => void }) {
  return (
    <header className="tv-header">
      <div className="tv-shell tv-header__in">
        <div className="tv-logo">
          <span className="tv-logo__mark" aria-hidden="true"><Ed path="logoText" fallback="T" label="Logo letter" /></span>
          <div style={{ minWidth: 0 }}>
            <div className="tv-logo__name"><Ed path="name" label="Restaurant name" /></div>
            <div className="tv-logo__tag"><Ed path="copy.tvTag" fallback="Deli · Diner · Bar" label="Header tag" /></div>
          </div>
        </div>
        <div className="tv-header__actions">
          <button type="button" className="tv-iconbtn" aria-label="Cart" onClick={onCart}>
            <Ico path={ICON.cart} />
            {count > 0 ? <span className="tv-iconbtn__badge">{count}</span> : null}
          </button>
        </div>
      </div>
    </header>
  )
}

function TavernMarquee({ r }: { r: Restaurant }) {
  const items = r.menu.flatMap((c) => c.items).slice(0, 10)
  const words = items.length ? items.map((i) => tx(i.name)) : ['Fresh daily', 'Made to order', 'No fuss']
  const chunk = words.map((w, i) => <span key={i}>{w} <span className="tv-marquee__dot">★</span> </span>)
  return (
    <div className="tv-marquee" aria-hidden="true">
      <div className="tv-marquee__track">
        <div className="tv-marquee__chunk">{chunk}{chunk}{chunk}</div>
        <div className="tv-marquee__chunk">{chunk}{chunk}{chunk}</div>
      </div>
    </div>
  )
}

function TavernHero({ r }: { r: Restaurant }) {
  const hours = (r.hours || [])[0]
  return (
    <section className="tv-hero">
      <div className="tv-shell tv-hero__in">
        <div>
          <div className="tv-kicker"><Ed path="copy.tvKicker" fallback="Open for orders" label="Kicker" /></div>
          <h1 className="tv-title">
            <Ed path="copy.tvTitleA" fallback="Eat" label="Title line 1" />{' '}
            <em><Ed path="copy.tvTitleB" fallback="Bold." label="Title accent" /></em>
          </h1>
          <p className="tv-tagline"><Ed path="tagline" fallback="Good food. No fuss." label="Tagline" /></p>
          <p className="tv-desc"><Ed path="description" multiline fallback="A neighbourhood deli and diner." label="Description" /></p>
          <div className="tv-cta-row">
            <button type="button" className="tv-btn tv-btn--solid" onClick={() => scrollToId('tv-menu')}>
              <Ed path="copy.tvCta" fallback="Order now" label="CTA" /> <Ico path={ICON.arrow} />
            </button>
            <button type="button" className="tv-btn tv-btn--ghost" onClick={() => scrollToId('tv-footer')}>
              <Ico path={ICON.pin} /> <Ed path="copy.tvVisit" fallback="Find us" label="Visit CTA" />
            </button>
          </div>
        </div>
        <div className="tv-hero__side">
          <div className="tv-stamp">
            <div className="tv-stamp__label"><Ico path={ICON.clock} /> <Ed path="copy.tvHoursLabel" fallback="Today" label="Hours label" /></div>
            <div className="tv-stamp__value">{hours ? `${hours.day} · ${hours.hours}` : 'Open daily'}</div>
          </div>
          <div className="tv-stamp">
            <div className="tv-stamp__label"><Ico path={ICON.pin} /> <Ed path="copy.tvAddressLabel" fallback="Address" label="Address label" /></div>
            <div className="tv-stamp__value"><Ed path="address" fallback="48 Market Row" label="Address" /></div>
          </div>
          {r.phone ? (
            <div className="tv-stamp">
              <div className="tv-stamp__label"><Ico path={ICON.phone} /> <Ed path="copy.tvPhoneLabel" fallback="Call" label="Phone label" /></div>
              <div className="tv-stamp__value"><a href={`tel:${r.phone}`}>{r.phone}</a></div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function TavernMenu({
  r, activeCat, setActiveCat, currency, editable, onMenuEdit,
}: {
  r: Restaurant
  activeCat: string
  setActiveCat: (id: string) => void
  currency?: string
  editable?: boolean
  onMenuEdit?: (recipe: (draft: Restaurant) => void) => void
}) {
  const cats = r.menu.filter((c) => editable || c.items.length > 0)
  const current = cats.find((c) => c.id === activeCat) || cats[0]
  const ci = current ? r.menu.indexOf(current) : -1

  return (
    <section className="tv-sec tv-shell" id="tv-menu">
      <div className="tv-sec__head">
        <h2 className="tv-sec__title"><Ed path="copy.tvMenuTitle" fallback="The Menu" label="Menu title" /></h2>
        <span className="tv-sec__count">{cats.reduce((n, c) => n + c.items.length, 0)} items</span>
        {current?.note ? <span className="tv-sec__note"><Ed path={`menu.${ci}.note`} label="Category note" /></span> : null}
      </div>

      <div className="tv-cats" role="tablist" aria-label="Menu categories">
        {cats.map((cat) => (
          <button
            key={cat.id}
            type="button"
            role="tab"
            className="tv-catbtn"
            aria-pressed={cat.id === (current?.id || '')}
            onClick={() => setActiveCat(cat.id)}
          >
            {tx(cat.name)}
          </button>
        ))}
        {editable ? (
          <button
            type="button" className="tv-editbar" style={{ marginTop: 0 }}
            onClick={() => onMenuEdit?.((d) => {
              if (!Array.isArray(d.menu)) d.menu = []
              d.menu.push({ id: `cat-${Date.now()}`, name: 'New category', note: '', items: [] })
            })}
          >+ Category</button>
        ) : null}
      </div>

      {current ? (
        <>
          <div className="tv-grid" role="tabpanel">
            {current.items.map((item, ii) => {
              const base = `menu.${ci}.items.${ii}`
              return (
                <article key={item.id || base} className="tv-card">
                  <div className="tv-card__media">
                    {item.image
                      ? <EdImage path={`${base}.image`} src={item.image} alt={tx(item.name) || ''} label="Product photo" style={imageFitStyle(item.imageFit) as CSSProperties} />
                      : <img src={IMG.classicBurger} alt="" />}
                    <div className="tv-card__badges">
                      {item.popular ? <span className="tv-badge">Hot</span> : null}
                      {item.isSpicy ? <span className="tv-badge tv-badge--hot">Spicy</span> : null}
                      {item.isVeg ? <span className="tv-badge tv-badge--veg">Veg</span> : null}
                      {!item.available ? <span className="tv-badge tv-badge--hot">Sold out</span> : null}
                    </div>
                  </div>
                  <div className="tv-card__body">
                    <div className="tv-card__top">
                      <h3 className="tv-card__name"><Ed path={`${base}.name`} label="Product name" /></h3>
                      <span className="tv-card__price">
                        <Ed numeric path={`${base}.price`} format={(v) => money(Number(v) || 0, currency || '$')} label="Product price" />
                      </span>
                    </div>
                    <p className="tv-card__desc"><Ed path={`${base}.description`} multiline label="Product description" /></p>
                    <div className="tv-card__foot">
                      {item.available ? (
                        <button type="button" className="tv-add" onClick={() => addToCart(r, item)}>
                          <Ico path={ICON.plus} /> Add
                        </button>
                      ) : <span className="tv-sold">Unavailable</span>}
                      {editable ? (
                        <button
                          type="button" className="tv-x" aria-label="Delete item"
                          onClick={() => { void confirmDialog({ title: 'Delete this item?', tone: 'danger' }).then(() => onMenuEdit?.((d) => { const idx = d.menu.findIndex((m) => m.id === current.id); if (idx >= 0) { const j = d.menu[idx].items.findIndex((it) => it.id === item.id); if (j >= 0) d.menu[idx].items.splice(j, 1) } })) }}
                        >✕</button>
                      ) : null}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
          {editable ? (
            <button
              type="button" className="tv-editbar"
              onClick={() => onMenuEdit?.((d) => {
                const idx = d.menu.findIndex((m) => m.id === current.id)
                if (idx >= 0) d.menu[idx].items.push({ id: `item-${Date.now()}`, name: 'New item', description: '', price: 0, compareAt: null, image: '', available: true, featured: false, popular: false })
              })}
            >+ Add item</button>
          ) : null}
        </>
      ) : null}
    </section>
  )
}

function TavernFooter({ r }: { r: Restaurant }) {
  return (
    <footer className="tv-footer" id="tv-footer">
      <div className="tv-shell tv-footer__grid">
        <div className="tv-footer__block">
          <p className="tv-footer__big"><Ed path="name" label="Restaurant name" /></p>
          <p><Ed path="tagline" label="Tagline" /></p>
          <p style={{ marginTop: '.6rem' }}><Ed path="address" label="Address" /></p>
          {r.phone ? <p><a href={`tel:${r.phone}`}>{r.phone}</a></p> : null}
          {r.email ? <p><a href={`mailto:${r.email}`}>{r.email}</a></p> : null}
        </div>
        <div className="tv-footer__block">
          <h4>Hours</h4>
          {(r.hours || []).map((h) => <p key={h.day + h.hours}>{h.day}: {h.hours}</p>)}
        </div>
        <div className="tv-footer__block">
          <h4>Follow</h4>
          {r.socials?.instagram ? <p><a href={r.socials.instagram} target="_blank" rel="noreferrer">Instagram</a></p> : null}
          {r.socials?.facebook ? <p><a href={r.socials.facebook} target="_blank" rel="noreferrer">Facebook</a></p> : null}
          {r.socials?.website ? <p><a href={r.socials.website} target="_blank" rel="noreferrer">Website</a></p> : null}
        </div>
      </div>
    </footer>
  )
}

function TavernDrawer({ onClose, onCheckout, currency }: { onClose: () => void; onCheckout: () => void; currency?: string }) {
  const cart = useCartStore()
  return (
    <div className="tv-drawer" role="dialog" aria-label="Cart" onClick={onClose}>
      <div className="tv-drawer__panel" onClick={(e) => e.stopPropagation()}>
        <div className="tv-drawer__head">
          <h3>Your order · {cart.count}</h3>
          <button type="button" className="tv-x" aria-label="Close cart" onClick={onClose}>✕</button>
        </div>
        <div className="tv-drawer__body">
          {cart.lines.length === 0 ? <p className="tv-empty">Your cart is empty.</p> : cart.lines.map((line) => {
            const sig = tvSignature(line)
            return (
              <div key={`${line.itemId}-${sig}`} className="tv-line">
                <div className="tv-line__info">
                  <p>{line.name}</p>
                  <span className="tv-line__meta">{money(line.price, currency || '$')} × {line.qty}</span>
                </div>
                <div className="tv-qty">
                  <button type="button" aria-label="Decrease" onClick={() => cart.setQty(line.itemId, sig, line.qty - 1)}>−</button>
                  <b>{line.qty}</b>
                  <button type="button" aria-label="Increase" onClick={() => cart.setQty(line.itemId, sig, line.qty + 1)}>+</button>
                </div>
                <button type="button" className="tv-x" aria-label="Remove" onClick={() => cart.remove(line.itemId, sig)}>✕</button>
              </div>
            )
          })}
        </div>
        {cart.lines.length > 0 ? (
          <div className="tv-drawer__foot">
            <div className="tv-total"><span>Total</span><span>{money(cart.subtotal, currency || '$')}</span></div>
            <button type="button" className="tv-btn tv-btn--solid tv-checkout" onClick={onCheckout}>
              Checkout <Ico path={ICON.arrow} />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function TavernSite({
  restaurant: r, interactive = true, currency, editable = false,
  onActiveChange, onCommit, onStyle, onMenuEdit,
}: Props): ReactElement {
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const cart = useCartStore()
  const cats = r.menu.filter((c) => editable || c.items.length > 0)
  const [activeCat, setActiveCat] = useState(cats[0]?.id || '')

  const resolvedCat = cats.some((c) => c.id === activeCat) ? activeCat : (cats[0]?.id || '')
  const openCheckout = () => { setCartOpen(false); setCheckoutOpen(true) }

  return (
    <InlineEditProvider restaurant={r} enabled={editable} onActiveChange={onActiveChange} onCommit={onCommit} onStyle={onStyle}>
      <div className="tv-root" style={tvVars(r)} data-mode="site" data-interactive={interactive ? 'true' : 'false'} data-variant={(r.design?.layout as any)?.variant || 'tavern'}>
        <style>{TV_STYLE}</style>

        <div className="tv-page">
          <TavernHeader count={cart.count} onCart={() => setCartOpen(true)} />
          <TavernMarquee r={r} />
          <TavernHero r={r} />
          <TavernMenu r={r} activeCat={resolvedCat} setActiveCat={setActiveCat} currency={currency} editable={editable} onMenuEdit={onMenuEdit} />
          <TavernFooter r={r} />
        </div>

        <button
          type="button"
          className="tv-float"
          onClick={() => { if (cart.count > 0) openCheckout(); else scrollToId('tv-menu') }}
          aria-label={cart.count > 0 ? 'Checkout' : 'Order now'}
        >
          <Ico path={cart.count > 0 ? ICON.cart : ICON.arrow} />
          {cart.count > 0 ? (
            <>Checkout <span className="tv-float__count">{cart.count}</span> {money(cart.subtotal, currency || '$')}</>
          ) : <><Ed path="copy.tvCta" fallback="Order now" label="CTA" /></>}
        </button>

        {cartOpen ? <TavernDrawer onClose={() => setCartOpen(false)} onCheckout={openCheckout} currency={currency} /> : null}
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

export default TavernSite
