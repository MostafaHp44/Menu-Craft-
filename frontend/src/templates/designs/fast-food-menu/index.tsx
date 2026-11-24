/**
 * Fast Food Menu — "Foodie Khan" style renderer.
 * Dark near-black canvas + bold yellow accents, app-like delivery UI:
 * sticky header, live search, category chip rail, popular rail with
 * favourites, special-offer banner, find-us rail and a full menu list.
 *
 * Reuses shared contracts: useCartStore, TemplateCheckoutOverlay, Ed/EdImage.
 * No new business logic — cart/checkout/orders come from the shared system.
 */
import { useMemo, useState, type CSSProperties, type ReactElement } from 'react'
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

function ffVars(r: Restaurant): CSSProperties {
  const d = r.design
  const c = (d && d.colors) as unknown as Record<string, string>
  const t = (d && d.typography) as Record<string, any>
  const l = (d && d.layout) as Record<string, any>
  const bg = c.background ?? '#0B0B0C'
  const text = c.text ?? '#FFFFFF'
  return {
    '--ff-bg': bg,
    '--ff-text': text,
    '--ff-card': c.card ?? '#161618',
    '--ff-primary': c.primary ?? '#FFC627',
    '--ff-button': c.button ?? c.primary ?? '#FFC627',
    '--ff-muted': mix(text, bg, 0.55),
    '--ff-border': c.border || mix(text, bg, 0.14),
    '--ff-heading': fontStack(t.heading || 'montserrat'),
    '--ff-body': fontStack(t.body || 'poppins'),
    '--ff-radius': `${l.radius ?? 18}px`,
  } as CSSProperties
}

const FF_STYLE = `
.ff-root {
  display: block; color: var(--ff-text); background: var(--ff-bg);
  font-family: var(--ff-body); min-height: 100vh; width: 100%;
  animation: ffReveal .6s ease both;
}
/* The query container lives on an inner wrapper so fixed overlays
   (cart, checkout) stay anchored to the viewport, not to the page top. */
.ff-page { position: relative; width: 100%; container-name: ff; container-type: inline-size; }
/* Opacity-only reveal: a transform here would turn .ff-root into the containing
   block for the fixed cart/checkout overlays (they'd stick to the page top). */
@keyframes ffReveal { from { opacity: 0; } to { opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .ff-root, .ff-root * { animation: none !important; transition: none !important; scroll-behavior: auto !important; } }
.ff-shell { max-width: 1200px; margin-inline: auto; padding-inline: clamp(14px, 3cqw, 40px); }

/* --- sticky header --- */
.ff-header {
  position: sticky; top: 0; z-index: 40;
  background: color-mix(in srgb, var(--ff-bg) 88%, transparent);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--ff-border);
}
.ff-header__in { display: flex; align-items: center; gap: 1rem; padding-block: .7rem; }
.ff-logo { display: flex; flex-direction: column; min-width: 0; }
.ff-logo__mark {
  font-family: 'Playfair Display', var(--ff-heading); font-style: italic; font-weight: 700;
  font-size: clamp(1.3rem, 3cqw, 1.7rem); color: var(--ff-primary); line-height: 1;
}
.ff-logo__name { font-family: var(--ff-heading); font-weight: 800; font-size: .95rem; letter-spacing: .02em; }
.ff-logo__tag { font-family: 'Playfair Display', serif; font-style: italic; font-size: .78rem; color: var(--ff-muted); }
.ff-header__actions { margin-inline-start: auto; display: flex; gap: .6rem; }
.ff-iconbtn {
  position: relative; width: 42px; height: 42px; border-radius: 50%;
  background: var(--ff-card); border: 1px solid var(--ff-border); color: var(--ff-text);
  display: grid; place-items: center; cursor: pointer; transition: border-color .15s ease, transform .15s ease;
}
.ff-iconbtn:hover { border-color: var(--ff-primary); transform: translateY(-2px); }
.ff-iconbtn svg { width: 20px; height: 20px; }
.ff-iconbtn__badge {
  position: absolute; top: -4px; inset-inline-end: -4px; min-width: 18px; height: 18px;
  border-radius: 999px; background: var(--ff-primary); color: #0B0B0C;
  font-size: .66rem; font-weight: 800; display: grid; place-items: center; padding-inline: 4px;
}

/* --- search --- */
.ff-search { display: flex; align-items: center; gap: .7rem; margin-block: 1rem .4rem; }
.ff-search__box {
  flex: 1; display: flex; align-items: center; gap: .6rem;
  background: var(--ff-card); border: 1px solid var(--ff-border);
  border-radius: 999px; padding: .65rem 1.1rem;
  transition: border-color .15s ease;
}
.ff-search__box:focus-within { border-color: var(--ff-primary); }
.ff-search__box svg { width: 18px; height: 18px; color: var(--ff-muted); flex: none; }
.ff-search__input { flex: 1; background: transparent; border: 0; outline: 0; color: var(--ff-text); font-size: .92rem; font-family: var(--ff-body); min-width: 0; }
.ff-search__input::placeholder { color: var(--ff-muted); }
.ff-filter {
  width: 44px; height: 44px; flex: none; border-radius: 50%;
  background: var(--ff-card); border: 1px solid var(--ff-border); color: var(--ff-text);
  display: grid; place-items: center; cursor: pointer;
}
.ff-filter[aria-pressed='true'] { background: var(--ff-primary); color: #0B0B0C; border-color: var(--ff-primary); }
.ff-filter svg { width: 18px; height: 18px; }

/* --- hero banner --- */
.ff-hero {
  position: relative; margin-block: 1rem; border-radius: var(--ff-radius);
  overflow: hidden; background: var(--ff-card); border: 1px solid var(--ff-border);
  min-height: clamp(300px, 42cqw, 420px); display: grid; align-items: center;
}
.ff-hero__media { position: absolute; inset: 0; }
.ff-hero__media img { width: 100%; height: 100%; object-fit: cover; }
.ff-hero__scrim { position: absolute; inset: 0; background: linear-gradient(90deg, rgba(6,6,7,.94) 8%, rgba(6,6,7,.72) 48%, rgba(6,6,7,.15) 100%); }
@container ff (max-width: 640px) { .ff-hero__scrim { background: linear-gradient(180deg, rgba(6,6,7,.9) 10%, rgba(6,6,7,.55) 70%, rgba(6,6,7,.35) 100%); } }
.ff-hero__body { position: relative; padding: clamp(1.4rem, 4cqw, 2.6rem); max-width: 560px; }
.ff-hero__kicker { font-family: 'Playfair Display', serif; font-style: italic; color: var(--ff-primary); font-size: clamp(1.05rem, 2.4cqw, 1.4rem); }
.ff-hero__title { font-family: var(--ff-heading); font-weight: 800; line-height: .98; font-size: clamp(2.3rem, 7cqw, 3.9rem); margin-block: .2rem; letter-spacing: -.01em; }
.ff-hero__title em { font-style: normal; color: var(--ff-primary); }
.ff-hero__sub { color: var(--ff-muted); margin-block: .8rem 1.2rem; font-size: .95rem; }
.ff-cta {
  display: inline-flex; align-items: center; gap: .5rem;
  background: var(--ff-button); color: #0B0B0C; border: 0; cursor: pointer;
  font-family: var(--ff-heading); font-weight: 800; font-size: .85rem;
  padding: .75rem 1.4rem; border-radius: 999px; text-decoration: none;
  transition: transform .15s ease, filter .15s ease;
}
.ff-cta svg { width: 16px; height: 16px; flex: none; }
.ff-cta:hover { transform: translateY(-2px); filter: brightness(1.05); }
.ff-cta--ghost { background: transparent; color: var(--ff-text); border: 1px solid var(--ff-border); }

/* --- rails (horizontal scroll) --- */
.ff-rail { display: flex; gap: .8rem; overflow-x: auto; padding-block: .4rem 1rem; scrollbar-width: thin; scroll-snap-type: x proximity; }
.ff-rail > * { scroll-snap-align: start; }
.ff-cats { display: flex; gap: .7rem; overflow-x: auto; padding-block: .6rem 1rem; scrollbar-width: thin; }
.ff-cat {
  flex: none; width: 92px; display: flex; flex-direction: column; align-items: center; gap: .5rem;
  background: var(--ff-card); border: 1px solid var(--ff-border); border-radius: var(--ff-radius);
  padding: .9rem .4rem .75rem; cursor: pointer; color: var(--ff-text);
  font-size: .76rem; font-weight: 600; text-align: center;
  transition: border-color .15s ease, transform .15s ease, background .15s ease;
}
.ff-cat:hover { border-color: var(--ff-primary); transform: translateY(-3px); }
.ff-cat svg { width: 30px; height: 30px; color: var(--ff-primary); }
.ff-cat span { line-height: 1.15; word-break: break-word; }

/* --- section headings --- */
.ff-sec { margin-block: clamp(1.6rem, 4cqw, 2.8rem); }
.ff-sec__head { display: flex; align-items: center; gap: .6rem; margin-bottom: 1rem; }
.ff-sec__title { font-family: var(--ff-heading); font-weight: 800; font-size: clamp(1.15rem, 3cqw, 1.5rem); margin: 0; }
.ff-sec__more { margin-inline-start: auto; background: transparent; border: 0; color: var(--ff-primary); font-weight: 700; font-size: .82rem; cursor: pointer; display: inline-flex; gap: .35rem; align-items: center; }
.ff-sec__more svg { width: 14px; height: 14px; }

/* --- popular cards --- */
.ff-card {
  position: relative; flex: none; width: clamp(150px, 44cqw, 220px);
  background: var(--ff-card); border: 1px solid var(--ff-border);
  border-radius: var(--ff-radius); overflow: hidden;
  transition: transform .18s ease, border-color .18s ease;
}
.ff-card:hover { transform: translateY(-4px); border-color: var(--ff-primary); }
.ff-card__media { aspect-ratio: 4 / 3; overflow: hidden; position: relative; }
.ff-card__media img { width: 100%; height: 100%; object-fit: cover; transition: transform .35s ease; }
.ff-card:hover .ff-card__media img { transform: scale(1.06); }
.ff-heart {
  position: absolute; top: .5rem; inset-inline-end: .5rem; width: 30px; height: 30px;
  border-radius: 50%; background: rgba(10,10,11,.65); border: 0; color: #fff;
  display: grid; place-items: center; cursor: pointer; backdrop-filter: blur(4px);
}
.ff-heart svg { width: 16px; height: 16px; }
.ff-heart[aria-pressed='true'] { color: #FF5A5F; }
.ff-heart[aria-pressed='true'] svg { fill: currentColor; }
.ff-card__body { padding: .7rem .8rem .85rem; }
.ff-card__name { font-size: .86rem; font-weight: 600; margin: 0 0 .3rem; line-height: 1.25; }
.ff-card__row { display: flex; align-items: center; justify-content: space-between; gap: .5rem; }
.ff-card__price { font-family: var(--ff-heading); font-weight: 800; font-size: .95rem; }
.ff-add {
  width: 32px; height: 32px; flex: none; border-radius: 50%; border: 0; cursor: pointer;
  background: var(--ff-primary); color: #0B0B0C; font-size: 1.15rem; font-weight: 800;
  display: grid; place-items: center; line-height: 1; transition: transform .15s ease, filter .15s ease;
}
.ff-add:hover { transform: scale(1.08); filter: brightness(1.06); }
.ff-add:disabled { opacity: .4; cursor: not-allowed; }

/* --- offer banner --- */
.ff-offer {
  position: relative; display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  background: var(--ff-card); border: 1px solid var(--ff-border);
  border-radius: var(--ff-radius); overflow: hidden; min-height: 230px;
}
@container ff (max-width: 720px) { .ff-offer { grid-template-columns: 1fr; } }
.ff-offer__body { padding: clamp(1.3rem, 3.5cqw, 2.2rem); display: flex; flex-direction: column; justify-content: center; gap: .4rem; }
.ff-offer__ribbon {
  align-self: flex-start; background: var(--ff-primary); color: #0B0B0C;
  font-family: 'Playfair Display', serif; font-style: italic; font-weight: 700;
  padding: .3rem 1.1rem; transform: rotate(-3deg); font-size: 1rem; border-radius: 4px;
}
.ff-offer__title { font-family: var(--ff-heading); font-weight: 800; font-size: clamp(1.7rem, 5cqw, 2.6rem); margin: .6rem 0 0; }
.ff-offer__title em { font-style: normal; color: var(--ff-primary); }
.ff-offer__sub { color: var(--ff-muted); margin: 0 0 1rem; font-size: .92rem; }
.ff-offer__media { position: relative; min-height: 200px; }
.ff-offer__media img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.ff-offer__media::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, var(--ff-card), transparent 45%); }
@container ff (max-width: 720px) { .ff-offer__media { display: none; } }

/* --- find us cards --- */
.ff-info {
  flex: none; width: clamp(220px, 62cqw, 300px); background: var(--ff-card);
  border: 1px solid var(--ff-border); border-radius: var(--ff-radius); padding: 1rem 1.1rem;
  display: flex; gap: .9rem; align-items: flex-start;
}
.ff-info__icon { width: 40px; height: 40px; flex: none; border-radius: 12px; background: color-mix(in srgb, var(--ff-primary) 16%, transparent); color: var(--ff-primary); display: grid; place-items: center; }
.ff-info__icon svg { width: 20px; height: 20px; }
.ff-info h4 { margin: 0 0 .25rem; font-family: var(--ff-heading); font-size: .92rem; font-weight: 800; }
.ff-info p { margin: 0; color: var(--ff-muted); font-size: .84rem; line-height: 1.45; }
.ff-info a { color: var(--ff-primary); text-decoration: none; }

/* --- full menu list --- */
.ff-menu-cat { margin-block: 1.6rem; }
.ff-menu-cat__head { display: flex; align-items: center; gap: .7rem; margin-bottom: .8rem; }
.ff-menu-cat__title { font-family: var(--ff-heading); font-weight: 800; font-size: clamp(1.05rem, 2.6cqw, 1.3rem); margin: 0; display: inline-flex; align-items: center; gap: .5rem; }
.ff-menu-cat__title svg { width: 22px; height: 22px; color: var(--ff-primary); }
.ff-menu-cat__note { color: var(--ff-muted); font-size: .8rem; }
.ff-row {
  display: flex; gap: .9rem; align-items: center;
  background: var(--ff-card); border: 1px solid var(--ff-border);
  border-radius: var(--ff-radius); padding: .7rem .85rem; margin-bottom: .7rem;
  transition: border-color .15s ease;
}
.ff-row:hover { border-color: color-mix(in srgb, var(--ff-primary) 55%, var(--ff-border)); }
.ff-row__media { width: 66px; height: 66px; flex: none; border-radius: calc(var(--ff-radius) * .6); overflow: hidden; background: var(--ff-bg); }
.ff-row__media img { width: 100%; height: 100%; object-fit: cover; }
.ff-row__info { flex: 1; min-width: 0; }
.ff-row__name { font-weight: 600; font-size: .95rem; margin: 0 0 .15rem; }
.ff-row__desc { color: var(--ff-muted); font-size: .8rem; margin: 0; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; }
.ff-row__end { display: flex; align-items: center; gap: .7rem; flex: none; }
.ff-row__price { font-family: var(--ff-heading); font-weight: 800; color: var(--ff-primary); font-size: 1rem; white-space: nowrap; }
.ff-empty { color: var(--ff-muted); text-align: center; padding: 2.5rem 1rem; }

/* --- floating cart pill --- */
.ff-float {
  position: fixed; bottom: 1.1rem; left: 50%; transform: translateX(-50%);
  z-index: 45; display: inline-flex; align-items: center; gap: .6rem;
  background: var(--ff-primary); color: #0B0B0C; border: 0; cursor: pointer;
  font-family: var(--ff-heading); font-weight: 800; font-size: .85rem;
  padding: .8rem 1.4rem; border-radius: 999px;
  box-shadow: 0 14px 34px -12px rgba(0,0,0,.7); transition: transform .15s ease;
}
.ff-float:hover { transform: translateX(-50%) translateY(-3px); }
.ff-float svg { width: 18px; height: 18px; }

/* --- cart drawer --- */
.ff-drawer { position: fixed; inset: 0; z-index: 60; display: flex; align-items: flex-end; justify-content: center; background: rgba(5,5,6,.66); }
@media (min-width: 720px) { .ff-drawer { align-items: center; } }
.ff-drawer__panel {
  width: min(460px, 100%); max-height: 86vh; overflow-y: auto;
  background: var(--ff-card); border: 1px solid var(--ff-border);
  border-radius: var(--ff-radius) var(--ff-radius) 0 0; box-shadow: 0 -24px 60px -24px rgba(0,0,0,.8);
}
@media (min-width: 720px) { .ff-drawer__panel { border-radius: var(--ff-radius); } }
.ff-drawer__head { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.2rem; border-bottom: 1px solid var(--ff-border); position: sticky; top: 0; background: var(--ff-card); }
.ff-drawer__head h3 { margin: 0; font-family: var(--ff-heading); font-size: 1.05rem; font-weight: 800; }
.ff-drawer__body { padding: .9rem 1.2rem; display: grid; gap: .8rem; }
.ff-line { display: flex; align-items: center; gap: .7rem; }
.ff-line__info { flex: 1; min-width: 0; }
.ff-line__info p { margin: 0; font-size: .9rem; font-weight: 600; }
.ff-line__meta { color: var(--ff-muted); font-size: .8rem; }
.ff-qty { display: flex; align-items: center; gap: .45rem; }
.ff-qty button {
  width: 26px; height: 26px; border-radius: 50%; border: 1px solid var(--ff-border);
  background: transparent; color: var(--ff-text); cursor: pointer; font-weight: 800;
}
.ff-qty b { min-width: 1.2rem; text-align: center; font-size: .9rem; }
.ff-drawer__foot { border-top: 1px solid var(--ff-border); padding: 1rem 1.2rem 1.3rem; position: sticky; bottom: 0; background: var(--ff-card); }
.ff-total { display: flex; justify-content: space-between; font-family: var(--ff-heading); font-weight: 800; font-size: 1.02rem; margin-bottom: .8rem; }
.ff-checkout { width: 100%; }
.ff-x { background: transparent; border: 0; color: var(--ff-muted); font-size: 1.05rem; cursor: pointer; padding: .2rem .4rem; }

/* --- footer --- */
.ff-footer { margin-top: clamp(2.5rem, 6cqw, 4rem); border-top: 1px solid var(--ff-border); padding-block: 2rem 4.5rem; }
.ff-footer__in { display: flex; flex-wrap: wrap; gap: 1.4rem; align-items: flex-start; justify-content: space-between; }
.ff-footer h4 { font-family: var(--ff-heading); font-weight: 800; margin: 0 0 .4rem; }
.ff-footer p { color: var(--ff-muted); font-size: .85rem; margin: 0 0 .3rem; }
.ff-footer a { color: var(--ff-primary); text-decoration: none; font-size: .85rem; }
.ff-editbar { display: inline-flex; gap: .6rem; align-items: center; background: var(--ff-card); border: 1px dashed var(--ff-border); border-radius: 999px; padding: .45rem .9rem; color: var(--ff-muted); font-size: .8rem; cursor: pointer; }
`

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

function ffSignature(line: { options: Array<{ groupId: string; optionId: string }> }): string {
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

/* ---------------------------- icons ---------------------------- */

const ICON = {
  burger: (<><path d="M4 10c0-3.3 3.6-6 8-6s8 2.7 8 6" /><path d="M4 14h16" /><path d="M4 18c0 2.2 3.6 4 8 4s8-1.8 8-4" /></>),
  pizza: (<><path d="M12 3 3 20h18L12 3z" /><circle cx="12" cy="12" r=".9" fill="currentColor" stroke="none" /><circle cx="9.2" cy="16" r=".9" fill="currentColor" stroke="none" /><circle cx="14.8" cy="16" r=".9" fill="currentColor" stroke="none" /></>),
  pasta: (<><path d="M4 13h16c0 4-3.6 7-8 7s-8-3-8-7z" /><path d="M7 13c0-3 2.2-5 5-5s5 2 5 5" /><path d="M12 8V5" /></>),
  fries: (<><path d="M6 10h12l-1.2 10H7.2L6 10z" /><path d="M9.3 10V5M12 10V4M14.7 10V5" /></>),
  drink: (<><path d="M7 8h10l-1 12H8L7 8z" /><path d="M6.5 8 8 4h8l1.5 4" /><path d="m13.5 4 2.5-2" /></>),
  dessert: (<><path d="M5 20v-5a7 7 0 0 1 14 0v5" /><path d="M5 15.5h14" /><path d="M12 8V5.5" /><circle cx="12" cy="3.8" r="1" /></>),
  cutlery: (<><path d="M7 3v7a2.5 2.5 0 0 0 2.5 2.5V21" /><path d="M9.5 3v6.5" /><path d="M17 3c-1.6 1.8-1.6 5.5.4 7.3V21" /></>),
  search: (<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.6-3.6" /></>),
  filter: (<><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></>),
  bell: (<><path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6" /><path d="M10 20a2 2 0 0 0 4 0" /></>),
  cart: (<><path d="M4 5h2l2.2 10.2a1.5 1.5 0 0 0 1.5 1.3h7.6a1.5 1.5 0 0 0 1.5-1.2L20.5 8H6.4" /><circle cx="10" cy="20" r="1.3" fill="currentColor" stroke="none" /><circle cx="17.5" cy="20" r="1.3" fill="currentColor" stroke="none" /></>),
  heart: (<path d="M12 20s-7.5-4.6-7.5-9.6A4.4 4.4 0 0 1 12 7.4a4.4 4.4 0 0 1 7.5 3c0 5-7.5 9.6-7.5 9.6z" />),
  arrow: (<path d="M5 12h13m-5-6 6 6-6 6" />),
  pin: (<><path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11z" /><circle cx="12" cy="10" r="2.6" /></>),
  clock: (<><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>),
  phone: (<path d="M6.5 4h3l1.5 4-2 1.5a12 12 0 0 0 5.5 5.5L16 13l4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 6.2 2 2 0 0 1 6.5 4z" />),
  flame: (<path d="M12 3s5.5 4 5.5 9.5A5.5 5.5 0 0 1 6.5 13c0-2 1.2-3.6 1.2-3.6s.6 1.7 1.8 2.3c0-3 2.5-5.7 2.5-8.7z" />),
  star: (<path d="m12 3.6 2.6 5.3 5.9.8-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.8L12 3.6z" />),
}

function CatIcon({ name }: { name: string }) {
  const n = name.toLowerCase()
  const body = n.includes('burger') ? ICON.burger
    : n.includes('pizza') ? ICON.pizza
    : n.includes('pasta') || n.includes('noodle') ? ICON.pasta
    : n.includes('fries') || n.includes('side') ? ICON.fries
    : n.includes('drink') || n.includes('beverage') || n.includes('coffee') ? ICON.drink
    : n.includes('dessert') || n.includes('sweet') || n.includes('cake') ? ICON.dessert
    : ICON.cutlery
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {body}
    </svg>
  )
}

function Ico({ path, filled = false }: { path: ReactElement; filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {path}
    </svg>
  )
}

/* ---------------------------- header ---------------------------- */

function FastFoodHeader({ count, onCart }: { count: number; onCart: () => void }) {
  return (
    <header className="ff-header">
      <div className="ff-shell ff-header__in">
        <div className="ff-logo">
          <span className="ff-logo__mark"><Ed path="logoText" fallback="FF" label="Logo" /></span>
          <span className="ff-logo__name"><Ed path="name" label="Restaurant name" /></span>
          <span className="ff-logo__tag"><Ed path="tagline" fallback="Good Food, Good Mood" label="Tagline" /></span>
        </div>
        <div className="ff-header__actions">
          <button type="button" className="ff-iconbtn" aria-label="Offers" onClick={() => scrollToId('ff-offer')}>
            <Ico path={ICON.bell} />
          </button>
          <button type="button" className="ff-iconbtn" aria-label="Cart" onClick={onCart}>
            <Ico path={ICON.cart} />
            {count > 0 ? <span className="ff-iconbtn__badge">{count}</span> : null}
          </button>
        </div>
      </div>
    </header>
  )
}

/* ---------------------------- search ---------------------------- */

function FastFoodSearch({
  query, onQuery, availableOnly, onToggleAvailable,
}: { query: string; onQuery: (v: string) => void; availableOnly: boolean; onToggleAvailable: () => void }) {
  return (
    <div className="ff-shell ff-search">
      <div className="ff-search__box">
        <Ico path={ICON.search} />
        <input
          className="ff-search__input"
          type="search"
          value={query}
          placeholder="Search for food, restaurant or items..."
          aria-label="Search menu"
          onChange={(e) => onQuery(e.target.value)}
        />
      </div>
      <button type="button" className="ff-filter" aria-label="Show available only" aria-pressed={availableOnly} onClick={onToggleAvailable}>
        <Ico path={ICON.filter} />
      </button>
    </div>
  )
}

/* ---------------------------- hero ---------------------------- */

function FastFoodHero({ r }: { r: Restaurant }) {
  return (
    <div className="ff-shell">
      <section className="ff-hero" id="ff-hero">
        <div className="ff-hero__media">
          {r.heroImage
            ? <EdImage path="heroImage" src={r.heroImage} alt={tx(r.name) || ''} label="Hero photo" />
            : <img src={IMG.dramaticBurger} alt="" />}
        </div>
        <div className="ff-hero__scrim" aria-hidden="true" />
        <div className="ff-hero__body">
          <span className="ff-hero__kicker">Delicious Food</span>
          <h1 className="ff-hero__title">Delivered<br /><em>Fresh</em></h1>
          <p className="ff-hero__sub">Hot • Fresh • On Time</p>
          <button type="button" className="ff-cta" onClick={() => scrollToId('ff-menu')}>
            Order Now <Ico path={ICON.arrow} />
          </button>
        </div>
      </section>
    </div>
  )
}

/* ---------------------------- category rail ---------------------------- */

function FastFoodCats({ cats, onPick }: { cats: MenuCategoryLite[]; onPick: (id: string) => void }) {
  return (
    <div className="ff-shell">
      <nav className="ff-cats" aria-label="Categories">
        {cats.map((c) => (
          <button key={c.id} type="button" className="ff-cat" onClick={() => onPick(c.id)}>
            <CatIcon name={c.name} />
            <span>{c.name}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

interface MenuCategoryLite { id: string; name: string }

/* ---------------------------- popular rail ---------------------------- */

function FastFoodPopular({ items, r, currency }: { items: Array<{ item: MenuItem; base: string }>; r: Restaurant; currency?: string }) {
  const [liked, setLiked] = useState<Record<string, boolean>>({})
  const toggle = (id: string) => setLiked((m) => ({ ...m, [id]: !m[id] }))
  return (
    <section className="ff-shell ff-sec" id="ff-popular">
      <div className="ff-sec__head">
        <span style={{ color: 'var(--ff-primary)', display: 'inline-flex' }}><Ico path={ICON.flame} /></span>
        <h2 className="ff-sec__title">Popular Right Now</h2>
        <button type="button" className="ff-sec__more" onClick={() => scrollToId('ff-menu')}>
          See All <Ico path={ICON.arrow} />
        </button>
      </div>
      {items.length === 0 ? <p className="ff-empty">New favourites coming soon.</p> : (
        <div className="ff-rail">
          {items.map(({ item, base }) => (
            <article key={item.id || base} className="ff-card">
              <div className="ff-card__media">
                {item.image
                  ? <EdImage path={`${base}.image`} src={item.image} alt={tx(item.name) || ''} label="Product photo" style={imageFitStyle(item.imageFit) as CSSProperties} />
                  : <img src={IMG.classicBurger} alt="" />}
                <button
                  type="button" className="ff-heart" aria-label="Favourite" aria-pressed={Boolean(liked[item.id || base])}
                  onClick={() => toggle(item.id || base)}
                >
                  <Ico path={ICON.heart} filled={Boolean(liked[item.id || base])} />
                </button>
              </div>
              <div className="ff-card__body">
                <p className="ff-card__name">{tx(item.name)}</p>
                <div className="ff-card__row">
                  <span className="ff-card__price">{money(item.price, currency || '$')}</span>
                  <button
                    type="button" className="ff-add" aria-label={`Add ${tx(item.name)}`}
                    disabled={!item.available}
                    onClick={() => addToCart(r, item)}
                  >+</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

/* ---------------------------- offer ---------------------------- */

function FastFoodOffer() {
  return (
    <div className="ff-shell">
      <section className="ff-offer ff-sec" id="ff-offer">
        <div className="ff-offer__body">
          <span className="ff-offer__ribbon">Special Offer</span>
          <h2 className="ff-offer__title">
            <Ed path="copy.ffOfferTitle" fallback="Get 20% OFF" label="Offer title" />
          </h2>
          <p className="ff-offer__sub">
            <Ed path="copy.ffOfferSub" fallback="On Your First Order" label="Offer subtitle" />
          </p>
          <button type="button" className="ff-cta" onClick={() => scrollToId('ff-menu')}>
            Order Now <Ico path={ICON.arrow} />
          </button>
        </div>
        <div className="ff-offer__media">
          <img src={IMG.grilledMeat} alt="" loading="lazy" />
        </div>
      </section>
    </div>
  )
}

/* ---------------------------- find us ---------------------------- */

function FastFoodFindUs({ r }: { r: Restaurant }) {
  const hours = (r.hours || []).map((h) => `${h.day}: ${h.hours}`).join(' · ')
  return (
    <section className="ff-shell ff-sec" id="ff-find">
      <div className="ff-sec__head">
        <span style={{ color: 'var(--ff-primary)', display: 'inline-flex' }}><Ico path={ICON.pin} /></span>
        <h2 className="ff-sec__title">Find Us</h2>
      </div>
      <div className="ff-rail">
        {r.address ? (
          <div className="ff-info">
            <span className="ff-info__icon"><Ico path={ICON.pin} /></span>
            <div><h4>Address</h4><p><Ed path="address" label="Address" /></p></div>
          </div>
        ) : null}
        {hours ? (
          <div className="ff-info">
            <span className="ff-info__icon"><Ico path={ICON.clock} /></span>
            <div><h4>Opening Hours</h4><p>{hours}</p></div>
          </div>
        ) : null}
        {r.phone ? (
          <div className="ff-info">
            <span className="ff-info__icon"><Ico path={ICON.phone} /></span>
            <div><h4>Call Us</h4><p><a href={`tel:${r.phone}`}>{r.phone}</a></p></div>
          </div>
        ) : null}
        {r.email ? (
          <div className="ff-info">
            <span className="ff-info__icon"><Ico path={ICON.star} /></span>
            <div><h4>Email</h4><p><a href={`mailto:${r.email}`}>{r.email}</a></p></div>
          </div>
        ) : null}
      </div>
    </section>
  )
}

/* ---------------------------- menu list ---------------------------- */

function FastFoodMenu({
  r, categories, editable, onMenuEdit, currency,
}: {
  r: Restaurant
  categories: Array<{ id: string; name: string; note: string; items: Array<{ item: MenuItem; base: string }> }>
  editable?: boolean
  onMenuEdit?: (recipe: (draft: Restaurant) => void) => void
  currency?: string
}) {
  if (categories.length === 0) return <p className="ff-empty">No dishes match your search.</p>
  return (
    <div className="ff-shell" id="ff-menu">
      <div className="ff-sec__head">
        <span style={{ color: 'var(--ff-primary)', display: 'inline-flex' }}><Ico path={ICON.star} /></span>
        <h2 className="ff-sec__title">Full Menu</h2>
        {editable ? (
          <button
            type="button" className="ff-editbar"
            onClick={() => onMenuEdit?.((d) => {
              if (!Array.isArray(d.menu)) d.menu = []
              d.menu.push({ id: `cat-${Date.now()}`, name: 'New category', note: '', items: [] })
            })}
          >+ Add category</button>
        ) : null}
      </div>
      {categories.map((cat) => (
        <section key={cat.id} className="ff-menu-cat" id={`ff-cat-${cat.id}`}>
          <div className="ff-menu-cat__head">
            <h3 className="ff-menu-cat__title"><CatIcon name={cat.name} /> {cat.name}</h3>
            {cat.note ? <span className="ff-menu-cat__note">{cat.note}</span> : null}
          </div>
          {cat.items.length === 0 ? (
            editable ? (
              <button
                type="button" className="ff-editbar"
                onClick={() => onMenuEdit?.((d) => {
                  const idx = d.menu.findIndex((m) => m.id === cat.id)
                  if (idx >= 0) d.menu[idx].items.push({ id: `item-${Date.now()}`, name: 'New dish', description: '', price: 0, compareAt: null, image: '', available: true, featured: false, popular: false })
                })}
              >+ Add dish</button>
            ) : <p className="ff-empty" style={{ padding: '1rem 0' }}>Coming soon.</p>
          ) : cat.items.map(({ item, base }) => (
            <article key={item.id || base} className="ff-row">
              <div className="ff-row__media">
                {item.image
                  ? <EdImage path={`${base}.image`} src={item.image} alt={tx(item.name) || ''} label="Product photo" style={imageFitStyle(item.imageFit) as CSSProperties} />
                  : <img src={IMG.classicBurger} alt="" />}
              </div>
              <div className="ff-row__info">
                <p className="ff-row__name"><Ed path={`${base}.name`} label="Product name" /></p>
                <p className="ff-row__desc"><Ed path={`${base}.description`} multiline label="Product description" /></p>
              </div>
              <div className="ff-row__end">
                <span className="ff-row__price">
                  <Ed numeric path={`${base}.price`} format={(v) => money(Number(v) || 0, currency || '$')} label="Product price" />
                </span>
                {editable ? (
                  <button
                    type="button" className="ff-x" aria-label="Delete dish"
                    onClick={() => { void confirmDialog({ title: 'Delete this dish?', tone: 'danger' }).then(() => onMenuEdit?.((d) => { const ci = d.menu.findIndex((m) => m.id === cat.id); if (ci >= 0) d.menu[ci].items.splice(d.menu[ci].items.findIndex((it) => it.id === item.id), 1) })) }}
                  >✕</button>
                ) : null}
                <button
                  type="button" className="ff-add" aria-label={`Add ${tx(item.name)}`}
                  disabled={!item.available}
                  onClick={() => addToCart(r, item)}
                >+</button>
              </div>
            </article>
          ))}
        </section>
      ))}
    </div>
  )
}

/* ---------------------------- cart drawer ---------------------------- */

function FastFoodDrawer({
  onClose, onCheckout, currency,
}: { onClose: () => void; onCheckout: () => void; currency?: string }) {
  const cart = useCartStore()
  return (
    <div className="ff-drawer" role="dialog" aria-label="Cart" onClick={onClose}>
      <div className="ff-drawer__panel" onClick={(e) => e.stopPropagation()}>
        <div className="ff-drawer__head">
          <h3>Your Cart · {cart.count}</h3>
          <button type="button" className="ff-x" aria-label="Close cart" onClick={onClose}>✕</button>
        </div>
        <div className="ff-drawer__body">
          {cart.lines.length === 0 ? <p className="ff-empty">Your cart is empty.</p> : cart.lines.map((line) => {
            const sig = ffSignature(line)
            return (
              <div key={`${line.itemId}-${sig}`} className="ff-line">
                <div className="ff-line__info">
                  <p>{line.name}</p>
                  <span className="ff-line__meta">{money(line.price, currency || '$')} × {line.qty}</span>
                </div>
                <div className="ff-qty">
                  <button type="button" aria-label="Decrease" onClick={() => cart.setQty(line.itemId, sig, line.qty - 1)}>−</button>
                  <b>{line.qty}</b>
                  <button type="button" aria-label="Increase" onClick={() => cart.setQty(line.itemId, sig, line.qty + 1)}>+</button>
                </div>
                <button type="button" className="ff-x" aria-label="Remove" onClick={() => cart.remove(line.itemId, sig)}>✕</button>
              </div>
            )
          })}
        </div>
        {cart.lines.length > 0 ? (
          <div className="ff-drawer__foot">
            <div className="ff-total"><span>Total</span><span>{money(cart.subtotal, currency || '$')}</span></div>
            <button type="button" className="ff-cta ff-checkout" onClick={onCheckout}>
              Proceed to Checkout <Ico path={ICON.arrow} />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

/* ---------------------------- footer ---------------------------- */

function FastFoodFooter({ r }: { r: Restaurant }) {
  return (
    <footer className="ff-footer">
      <div className="ff-shell ff-footer__in">
        <div>
          <h4><Ed path="name" label="Restaurant name" /></h4>
          <p><Ed path="address" label="Address" /></p>
          {r.phone ? <p><a href={`tel:${r.phone}`}>{r.phone}</a></p> : null}
        </div>
        <div>
          <h4>Hours</h4>
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

/* ---------------------------- site ---------------------------- */

export function FastFoodMenuSite({
  restaurant: r, interactive = true, currency, editable = false,
  onActiveChange, onCommit, onStyle, onMenuEdit,
}: Props): ReactElement {
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [availableOnly, setAvailableOnly] = useState(false)
  const cart = useCartStore()

  /* searchable + availability-filtered categories */
  const categories = useMemo(() => {
    const q = query.trim().toLowerCase()
    return r.menu.map((cat) => {
      const base = r.menu.indexOf(cat)
      const items = cat.items
        .map((item, ii) => ({ item, base: `menu.${base}.items.${ii}` }))
        .filter(({ item }) => {
          if (availableOnly && !item.available) return false
          if (!q) return true
          return `${tx(item.name)} ${tx(item.description)}`.toLowerCase().includes(q)
        })
      return { id: cat.id, name: tx(cat.name), note: tx(cat.note || ''), items }
    }).filter((c) => editable || c.items.length > 0 || !q)
  }, [r.menu, query, availableOnly, editable])

  /* popular rail: popular → featured → first picks */
  const popular = useMemo(() => {
    const all: Array<{ item: MenuItem; base: string }> = []
    r.menu.forEach((cat, ci) => {
      cat.items.forEach((item, ii) => {
        if (item.popular || item.featured) all.push({ item, base: `menu.${ci}.items.${ii}` })
      })
    })
    if (all.length >= 4) return all.slice(0, 8)
    const seen = new Set(all.map((p) => p.item.id))
    r.menu.forEach((cat, ci) => {
      cat.items.forEach((item, ii) => {
        if (all.length < 8 && !seen.has(item.id) && item.available) {
          seen.add(item.id)
          all.push({ item, base: `menu.${ci}.items.${ii}` })
        }
      })
    })
    return all
  }, [r.menu])

  const openCheckout = () => { setCartOpen(false); setCheckoutOpen(true) }

  return (
    <InlineEditProvider restaurant={r} enabled={editable} onActiveChange={onActiveChange} onCommit={onCommit} onStyle={onStyle}>
      <div className="ff-root" style={ffVars(r)} data-mode="site" data-interactive={interactive ? 'true' : 'false'} data-variant={(r.design?.layout as any)?.variant || 'fast-food-menu'}>
        <style>{FF_STYLE}</style>

        <div className="ff-page">
          <FastFoodHeader count={cart.count} onCart={() => setCartOpen(true)} />
          <FastFoodSearch query={query} onQuery={setQuery} availableOnly={availableOnly} onToggleAvailable={() => setAvailableOnly((v) => !v)} />
          <FastFoodHero r={r} />
          <FastFoodCats cats={categories} onPick={(id) => scrollToId(`ff-cat-${id}`)} />
          <FastFoodPopular items={popular} r={r} currency={currency} />
          <FastFoodOffer />
          <FastFoodFindUs r={r} />
          <FastFoodMenu
            r={r}
            categories={categories}
            editable={editable}
            onMenuEdit={onMenuEdit}
            currency={currency}
          />
          <FastFoodFooter r={r} />
        </div>

        <button
          type="button"
          className="ff-float"
          onClick={() => { if (cart.count > 0) openCheckout(); else scrollToId('ff-menu') }}
          aria-label={cart.count > 0 ? 'Checkout' : 'Start your order'}
        >
          <Ico path={cart.count > 0 ? ICON.cart : ICON.arrow} />
          {cart.count > 0
            ? <>Checkout · {cart.count} · {money(cart.subtotal, currency || '$')}</>
            : <>Start your order</>}
        </button>

        {cartOpen ? (
          <FastFoodDrawer onClose={() => setCartOpen(false)} onCheckout={openCheckout} currency={currency} />
        ) : null}
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

export default FastFoodMenuSite
