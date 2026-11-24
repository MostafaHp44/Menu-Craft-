/**
 * Aurum Lounge — dedicated renderer (dark fine-dining, mobile-first, app-style).
 *
 * Self-contained: scoped CSS, local cart/saved state. Reads colors from
 * restaurant.design.colors and content from the Restaurant object itself
 * (name/tagline/logo/hours/menu). Selected by the 'aurum' layout variant via
 * templates/site/registry.ts — RestaurantSite dispatches to it at the top of
 * its render.
 */
import { useMemo, useState } from 'react'

import type { MenuItem, OpeningHour, Restaurant } from '../../../shared/lib/types.ts'
import { tx } from '../../../shared/lib/utils.ts'
import { Ed, EdImage, InlineEditProvider, type ActiveField } from '../../editor/inlineEdit.tsx'
import { confirmDialog } from '../../../shared/components/dialogs.tsx'
import { Icon } from '../../../shared/ui/icons.tsx'
import { fontStack } from '../../data/fonts.ts'
import { useI18n } from '../../../shared/i18n'
import type { InlineTextStyle } from '../../../shared/lib/types.ts'

interface Props {
  restaurant: Restaurant
  interactive?: boolean
  mode?: string
  currency?: string
  /** click-to-edit images (hero / logo / menu) inside the visual editor */
  editable?: boolean
  onActiveChange?: (field: ActiveField | null) => void
  onCommit?: (path: string, value: string) => void
  onStyle?: (path: string, patch: InlineTextStyle | null) => void
  /** in-place menu editing (admin): add/remove categories & items */
  onMenuEdit?: (recipe: (draft: Restaurant) => void) => void
}

/** transparent 1×1 so an unset image keeps the monogram / hero gradient visible */
const BLANK =
  'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>')

/** icon that matches the category name exactly */
const catIcon = (n: string) => {
  const s = n.toLowerCase()
  if (s === 'all') return '🍽'
  if (/steak|beef|rib|grill|meat/.test(s)) return '🥩'
  if (/pasta|main|noodle|linguine/.test(s)) return '🍝'
  if (/starter|salad|soup|appetiz/.test(s)) return '🥗'
  if (/dessert|sweet|cake|pudding/.test(s)) return '🍰'
  if (/drink|coffee|tea|juice|cocktail|bar|wine/.test(s)) return '🍹'
  if (/burger/.test(s)) return '🍔'
  if (/pizza/.test(s)) return '🍕'
  return '🍽'
}

const FILTERS = [
  ['all', 'templateUi.allItems'],
  ['chef', 'templateUi.chef'],
  ['spicy', 'templateUi.spicy'],
  ['veg', 'templateUi.vegetarian'],
  ['gf', 'templateUi.glutenFree'],
] as const
type Filter = (typeof FILTERS)[number][0]

const emojiFor = (n: string) => {
  const s = n.toLowerCase()
  if (/steak|beef|rib|grill|meat/.test(s)) return '🥩'
  if (/pasta|noodle|linguine|rigatoni/.test(s)) return '🍝'
  if (/salad|starter|soup/.test(s)) return '🥗'
  if (/dessert|cake|sweet|pudding/.test(s)) return '🍰'
  if (/drink|coffee|tea|juice/.test(s)) return '☕'
  if (/burger/.test(s)) return '🍔'
  if (/pizza/.test(s)) return '🍕'
  return '🍽'
}

/** true/false when the day's ranges contain now, null when nothing matches */
function isOpenNow(hours: OpeningHour[] | undefined): boolean | null {
  if (!hours?.length) return null
  const now = new Date()
  const cur = now.getHours() * 60 + now.getMinutes()
  for (const h of hours) {
    const m = h.hours?.match(/(\d{1,2}):(\d{2})\D+(\d{1,2}):(\d{2})/)
    if (!m) continue
    const from = +m[1] * 60 + +m[2]
    const to = +m[3] * 60 + +m[4]
    const open = to > from ? cur >= from && cur < to : cur >= from || cur < to
    if (open) return true
  }
  return false
}

export function AurumSite({
  restaurant,
  interactive = true,
  mode,
  currency = 'USD',
  editable = false,
  onActiveChange,
  onCommit,
  onStyle,
  onMenuEdit,
}: Props) {
  const name = tx(restaurant.name) || 'Aurum Lounge'
  const { t } = useI18n()
  const [cat, setCat] = useState('all')
  const [filter, setFilter] = useState<Filter>('all')
  const [q, setQ] = useState('')
  const [cart, setCart] = useState<Record<string, number>>({})
  const [sheet, setSheet] = useState(false)
  const [msg, setMsg] = useState('')
  const [custName, setCustName] = useState('')
  const [custPhone, setCustPhone] = useState('')
  const [fulfil, setFulfil] = useState<'delivery' | 'pickup'>('delivery')
  const [address, setAddress] = useState('')

  const toast = (t: string) => {
    setMsg(t)
    window.setTimeout(() => setMsg(''), 1800)
  }
  const money = (n: number) => `${currency}${n.toFixed(2)}`

  const menu: Array<{ id: string; name: string; items: MenuItem[] }> = restaurant.menu
  const dishes = useMemo(
    () => menu.flatMap((c) => c.items.filter((i) => i.available !== false).map((i) => ({ ...i, cat: c.id }))),
    [menu],
  )
  const byId = useMemo(() => Object.fromEntries(dishes.map((d) => [d.id, d])), [dishes])

  const list = dishes.filter((d) => {
    if (cat !== 'all' && d.cat !== cat) return false
    if (filter === 'chef' && !(d.featured || d.popular)) return false
    if (filter === 'spicy' && !d.isSpicy) return false
    if (filter === 'veg' && !d.isVeg) return false
    if (filter === 'gf' && !d.isGf) return false
    const s = q.trim().toLowerCase()
    return !s || `${d.name} ${d.description || ''}`.toLowerCase().includes(s)
  })

  const count = Object.values(cart).reduce((a, b) => a + b, 0)
  const total = Object.entries(cart).reduce((a, [id, n]) => a + (byId[id]?.price || 0) * n, 0)
  const change = (id: string, by: number) =>
    interactive &&
    setCart((c) => {
      const n = (c[id] || 0) + by
      const next = { ...c }
      if (n <= 0) delete next[id]
      else next[id] = n
      return next
    })
  const colors = restaurant.design?.colors || {}
  const vars = {
    '--au-f-head': fontStack(restaurant.design?.typography?.heading || 'playfair'),
    '--au-f-body': fontStack(restaurant.design?.typography?.body || 'inter'),
    '--au-gold': colors.accent || '#E6C25A',
    '--au-bg': colors.background || '#0B0B0D',
    '--au-card': colors.card || '#151518',
    '--au-text': colors.text || '#F4F1EA',
    '--au-mute': colors.secondary || '#A8A397',
    '--au-line': colors.border || '#26262B',
  } as React.CSSProperties
  const isOpen = isOpenNow(restaurant.hours)
  const grouped = cat === 'all' && !q && filter === 'all'
  const phone = restaurant.phone || ''
  const whatsappHref = phone ? `https://wa.me/${phone.replace(/\D/g, '')}` : null

  const card = (d: MenuItem & { cat: string }) => {
    const n = cart[d.id] || 0
    const ci = menu.findIndex((c) => c.id === d.cat)
    const ii = ci >= 0 ? menu[ci].items.findIndex((i) => i.id === d.id) : -1
    const imgPath = ci >= 0 && ii >= 0 ? `menu.${ci}.items.${ii}.image` : ''
    const base = imgPath ? imgPath.slice(0, -6) : ''
    const canEdit = editable && !!onMenuEdit && ci >= 0 && ii >= 0
    return (
      <article className="au-it" key={d.id}>
        {canEdit ? (
          <button
            className="au-del"
            aria-label="Delete item"
            onClick={async (e) => {
              e.stopPropagation()
              if (await confirmDialog({ title: 'حذف الصنف؟', message: 'سيتم حذف هذا الصنف من القائمة.', confirmLabel: 'حذف', cancelLabel: 'إلغاء', tone: 'danger' })) {
                onMenuEdit!((draft) => {
                  const cat = draft.menu[ci]
                  if (cat && Array.isArray(cat.items)) cat.items.splice(ii, 1)
                })
              }
            }}
          >
            <Icon name="trash" size={12} />
          </button>
        ) : null}
        <div className="au-art">
          {d.image || canEdit ? (
            <EdImage path={imgPath} src={d.image || BLANK} alt={d.name} className="au-art-img" />
          ) : (
            <span>{emojiFor(d.name)}</span>
          )}
        </div>
        <div className="au-bd">
          <div className="au-t">
            <Ed as="span" path={`${base}.name`} fallback={d.name} />
            <span>{(d.featured || d.popular ? '⭐' : '') + (d.isSpicy ? '🌶' : '') + (d.isVeg ? '🌿' : '')}</span>
          </div>
          {d.allergens?.length ? <div className="au-all">{d.allergens.join(', ')}</div> : null}
          <Ed as="p" className="au-d" path={`${base}.description`} fallback={d.description} multiline />
          <div className="au-ft">
            <Ed as="b" className="au-pr" numeric path={`${base}.price`} fallback={String(d.price)} format={(raw) => money(Number(raw) || 0)} />
            <span className="au-kc">{d.calories ? `${d.calories} kcal` : ''}</span>
            {n ? (
              <div className="au-qty">
                <button onClick={() => change(d.id, -1)} aria-label="Remove one">−</button>
                {n}
                <button onClick={() => change(d.id, 1)} aria-label="Add one">+</button>
              </div>
            ) : (
              <button className="au-add" onClick={() => change(d.id, 1)} aria-label="Add to cart">+</button>
            )}
          </div>
        </div>
      </article>
    )
  }

  return (
    <InlineEditProvider
      restaurant={restaurant}
      enabled={editable}
      onActiveChange={onActiveChange}
      onCommit={onCommit}
      onStyle={onStyle}
    >
    <div className="au-root" data-mode={mode} style={vars}>
      <style>{CSS}</style>
      <div className="au">
      <header className="au-hero">
        <EdImage path="heroImage" src={restaurant.heroImage || BLANK} alt="" className="au-hero-img" eager />
        {isOpen !== null && (
          <div className="au-badge l">
            <i className={isOpen ? '' : 'off'} />
            {isOpen ? t('templateUi.open') : t('templateUi.closed')}
          </div>
        )}
      </header>

      <div className="au-in">
        <section className="au-id">
        <div className="au-logo">
          <Ed as="span" className="au-logo-mono" path="logoText" fallback={tx(restaurant.logoText) || name.charAt(0)} />
          <EdImage path="logoImage" src={restaurant.logoImage || BLANK} alt="Logo" className="au-logo-img" />
        </div>
        <div>
          <Ed as="h1" className="au-name" path="name" fallback={name} />
          {tx(restaurant.tagline) ? <Ed as="div" className="au-sub" path="tagline" fallback={tx(restaurant.tagline) || ''} /> : null}
          {restaurant.hours?.[0] ? (
            <div className="au-hrs">
              <Ed as="span" path="hours.0.day" fallback={restaurant.hours[0].day} />:{' '}
              <Ed as="span" path="hours.0.hours" fallback={restaurant.hours[0].hours} />
            </div>
          ) : null}
        </div>
      </section>

      <label className="au-search">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
        <input id="au-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('templateUi.searchPh')} readOnly={!interactive} />
      </label>

      <nav className="au-row" aria-label="Categories">
        {[{ id: 'all', name: 'All' }, ...menu].map((c) => (
          <button key={c.id} className={`au-chip${cat === c.id ? ' on' : ''}`} onClick={() => interactive && setCat(c.id)}>
            <span className="au-chip-ico" aria-hidden="true">{catIcon(c.name)}</span>
            {c.name}
          </button>
        ))}
        {editable && onMenuEdit ? (
          <button
            className="au-chip au-addcat"
            aria-label="Add category"
            onClick={() => onMenuEdit!((draft) => {
              if (!Array.isArray(draft.menu)) draft.menu = []
              draft.menu.push({ id: `cat-${Date.now()}`, name: 'New Category', note: '', items: [] })
            })}
          >
            <span className="au-chip-ico" aria-hidden="true">＋</span>
            Add category
          </button>
        ) : null}
      </nav>
      <nav className="au-row au-row2" aria-label="Filters">
        {FILTERS.map(([id, label]) => (
          <button key={id} className={`au-chip sm${filter === id ? ' on' : ''}`} onClick={() => interactive && setFilter(id)}>
            {t(label)}
          </button>
        ))}
      </nav>

      <main>
        {!list.length ? (
          <div className="au-empty">
            <b>No dishes found</b>
            Try another word or clear the filters.
          </div>
        ) : grouped ? (
          <>
            {menu.map((c, ci) => {
              const g = list.filter((d) => d.cat === c.id)
              const canEdit = editable && !!onMenuEdit
              if (!g.length && !canEdit) return null
              return (
                <div key={c.id}>
                  <div className="au-sec-row">
                    <Ed as="h2" className="au-sec" path={`menu.${ci}.name`} fallback={c.name} />
                    {canEdit ? (
                      <button
                        className="au-del au-del-cat"
                        aria-label="Delete category"
                        onClick={async () => {
                          if (await confirmDialog({ title: 'حذف القسم؟', message: 'سيتم حذف القسم وكل أصنافه.', confirmLabel: 'حذف', cancelLabel: 'إلغاء', tone: 'danger' })) {
                            onMenuEdit!((draft) => { draft.menu.splice(ci, 1) })
                          }
                        }}
                      >
                        <Icon name="trash" size={12} />
                      </button>
                    ) : null}
                  </div>
                  {g.length ? <div className="au-list">{g.map(card)}</div> : null}
                  {canEdit ? (
                    <button
                      className="au-additem"
                      onClick={() => onMenuEdit!((draft) => {
                        const cat = draft.menu[ci]
                        if (!cat) return
                        if (!Array.isArray(cat.items)) cat.items = []
                        cat.items.push({ id: `item-${Date.now()}`, name: 'New dish', description: '', price: 0, compareAt: null, available: true, featured: false, popular: false, image: '' })
                      })}
                    >
                      + Add item
                    </button>
                  ) : null}
                </div>
              )
            })}
          </>
        ) : (
          <div className="au-list">{list.map(card)}</div>
        )}
      </main>
      </div>
      </div>

      {whatsappHref ? (
        <a className="au-wa" href={whatsappHref} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
          <svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-8.6 15l-1.4 5 5.1-1.3A10 10 0 1 0 12 2zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .5l-.4.6c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.1 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.8-1c.2-.2.4-.2.6-.1l2 .9c.3.1.4.2.5.3.1.2.1.8-.1 1.3z" /></svg>
        </a>
      ) : null}

      <nav className="au-tabs" aria-label="Main">
        <button className="au-tab on" onClick={() => window.scrollTo?.({ top: 0 })}>
          <svg viewBox="0 0 24 24"><path d="M3 5h8a1 1 0 0 1 1 1v14a3 3 0 0 0-3-3H3zM21 5h-8a1 1 0 0 0-1 1v14a3 3 0 0 1 3-3h6z" /></svg>{t('templateUi.menu')}
        </button>
        <button className="au-tab" onClick={() => document.getElementById('au-q')?.focus()}>
          <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>{t('templateUi.search')}
        </button>
        {phone ? (
          <a className="au-tab" href={`tel:${phone.replace(/[^\d+]/g, '')}`}>
            <svg viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.500 1.500a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>{t('templateUi.call')}
          </a>
        ) : null}
        <button className="au-pill" onClick={() => interactive && setSheet(true)} aria-label={t('templateUi.cart')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 8h12l1 13H5zM9 8a3 3 0 0 1 6 0" /></svg>
          {money(total)}
          {count > 0 && <span className="au-cnt" key={count}>{count}</span>}
        </button>
      </nav>

      {sheet && interactive && (
        <div className="au-ov" onClick={() => setSheet(false)}>
          <div className="au-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Checkout">
            <div className="au-sheet-h">
              <h3>Checkout</h3>
              <button className="au-x" onClick={() => setSheet(false)} aria-label={t('templateUi.close')}>
                <Icon name="trash" size={12} />
              </button>
            </div>
            {!count ? (
              <div className="au-empty"><b>{t('templateUi.cartEmpty')}</b>{t('templateUi.cartEmptySub')}</div>
            ) : (
              <>
                <div className="au-lines">
                  {Object.entries(cart).map(([id, n]) => (
                    <div className="au-ln" key={id}>
                      <span className="n">{byId[id]?.name}</span>
                      <div className="au-qty">
                        <button onClick={() => change(id, -1)} aria-label="Remove one">−</button>{n}<button onClick={() => change(id, 1)} aria-label="Add one">+</button>
                      </div>
                      <b>{money((byId[id]?.price || 0) * n)}</b>
                    </div>
                  ))}
                </div>
                <div className="au-tot"><span>{t('templateUi.total')}</span><span>{money(total)}</span></div>

                <div className="au-form">
                  <div className="au-fulfil" role="group" aria-label="Fulfillment">
                    <button className={`au-chip sm${fulfil === 'delivery' ? ' on' : ''}`} onClick={() => setFulfil('delivery')}>{t('templateUi.delivery')}</button>
                    <button className={`au-chip sm${fulfil === 'pickup' ? ' on' : ''}`} onClick={() => setFulfil('pickup')}>{t('templateUi.pickup')}</button>
                  </div>
                  <label className="au-field">
                    <span>{t('templateUi.name')}</span>
                    <input value={custName} onChange={(e) => setCustName(e.target.value)} placeholder="Your name" />
                  </label>
                  <label className="au-field">
                    <span>{t('templateUi.phone')}</span>
                    <input value={custPhone} onChange={(e) => setCustPhone(e.target.value)} placeholder="+44 …" inputMode="tel" />
                  </label>
                  {fulfil === 'delivery' && (
                    <label className="au-field">
                      <span>{t('templateUi.deliveryAddress')}</span>
                      <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, city, postcode" />
                    </label>
                  )}
                </div>

                <button
                  className="au-go"
                  disabled={!custName.trim() || !custPhone.trim() || (fulfil === 'delivery' && !address.trim())}
                  onClick={() => { setCart({}); setSheet(false); toast(t('templateUi.orderSent')) }}
                >
                  {t('templateUi.placeOrder')} · {money(total)}
                </button>
              </>
            )}
          </div>
        </div>
      )}
      {msg && <div className="au-toast" role="status">{msg}</div>}
    </div>
    </InlineEditProvider>
  )
}

export default AurumSite

const CSS = `
.au-root{width:100%;max-width:none;margin:0;min-height:100vh;background:var(--au-bg);color:var(--au-text);font-family:var(--au-f-body);padding-bottom:104px;position:relative;overflow-x:clip}
.au-root[data-mode="preview"]{min-height:100%}
.au{container-type:inline-size;width:100%}
.au-in{max-width:100%;margin:0}
.au-root *{box-sizing:border-box}
.au-root button{font:inherit;color:inherit;border:0;background:none;cursor:pointer;padding:0}
.au-hero{width:100%;height:230px;position:relative;background:radial-gradient(120% 90% at 80% 0%,rgba(230,194,90,.28),transparent 60%),repeating-linear-gradient(100deg,#141416 0 2px,#0E0E10 2px 26px);background-size:cover;background-position:center}
.au-hero::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 35%,var(--au-bg))}
.au-hero-img,.au-hero-img img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.au-badge{position:absolute;top:16px;z-index:2;display:flex;align-items:center;gap:7px;padding:7px 12px;border-radius:999px;background:rgba(11,11,13,.72);border:1px solid var(--au-line);backdrop-filter:blur(8px);font-size:12px;font-weight:700}
.au-badge.l{inset-inline-start:16px}.au-badge.r{inset-inline-end:16px}
.au-badge i{width:8px;height:8px;border-radius:50%;background:#2ECC8F;box-shadow:0 0 8px #2ECC8F}
.au-badge i.off{background:#E5604D;box-shadow:0 0 8px #E5604D}
.au-id{display:flex;gap:14px;align-items:center;margin:-62px 12px 0;position:relative;z-index:2}
.au-logo{width:78px;height:78px;flex:none;border-radius:16px;border:2px solid var(--au-gold);background:linear-gradient(145deg,#1b1810,#0b0b0d);display:grid;place-items:center;font-family:var(--au-f-head);font-weight:700;font-size:34px;color:var(--au-gold);position:relative;overflow:hidden}
.au-logo-img,.au-logo-img img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.au-name{margin:0;font-family:var(--au-f-head);font-size:23px;font-weight:700;letter-spacing:.03em;line-height:1.15}
.au-sub{font-size:12.5px;margin-top:3px}.au-hrs{font-size:11.5px;color:var(--au-mute);margin-top:4px}
.au-search{margin:12px;display:flex;align-items:center;gap:10px;padding:0 16px;height:48px;border-radius:14px;border:1px solid var(--au-line);background:var(--au-card);color:var(--au-mute)}
.au-search:focus-within{border-color:var(--au-gold)}
.au-search input{flex:1;min-width:0;background:none;border:0;outline:0;color:var(--au-text);font:inherit;font-size:14px}
.au-row{display:flex;gap:10px;overflow-x:auto;padding:12px;scrollbar-width:none}
.au-row::-webkit-scrollbar{display:none}.au-row2{margin-top:0;padding-top:0}
.au-root .au-chip{flex:none;display:flex;align-items:center;gap:8px;padding:12px 20px;border-radius:12px;border:1px solid var(--au-line)!important;background:var(--au-card)!important;font-size:13px;font-weight:600;transition:background .2s,color .2s}
.au-chip-ico{font-size:15px;line-height:1}
.au-root .au-chip.sm{padding:10px 18px;border-radius:999px;font-size:12px}
.au-chip.on{background:var(--au-gold)!important;border-color:var(--au-gold)!important;color:#1A1405}
.au-sec{margin:18px 12px 10px;font-family:var(--au-f-head);font-size:19px;font-weight:600}
.au-sec-row{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:18px 12px 10px}
.au-sec-row .au-sec{margin:0}
.au-del{position:absolute;top:8px;inset-inline-end:8px;z-index:3;width:26px;height:26px;border-radius:50%;background:rgba(229,96,77,.92)!important;color:#fff!important;display:grid;place-items:center}
.au-del svg{width:13px;height:13px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round}
.au-del-cat{position:static;flex:none;width:28px;height:28px}
.au-additem{display:flex;align-items:center;justify-content:center;gap:6px;margin:12px;width:calc(100% - 24px);min-height:56px;border:2px dashed var(--au-line)!important;border-radius:14px;background:transparent!important;color:var(--au-mute)!important;font-weight:600;font-size:13px}
.au-additem:hover{border-color:var(--au-gold)!important;color:var(--au-gold)!important}
.au-root .au-chip.au-addcat{border-style:dashed!important;border-color:var(--au-gold)!important;color:var(--au-gold)!important;background:transparent!important}
.au-root .rs-ed{outline:1px dashed var(--au-line);outline-offset:2px;border-radius:4px;cursor:text}
.au-root .rs-ed[data-active="true"]{outline-color:var(--au-gold)}
.au-root .rs-ed-media{cursor:pointer}
.au-list{display:grid;gap:12px;padding:0 12px}
.au-it{display:flex;gap:12px;padding:12px;border-radius:16px;border:1px solid var(--au-line);background:var(--au-card);position:relative}
.au-art{width:104px;height:104px;flex:none;border-radius:12px;position:relative;display:grid;place-items:center;font-size:44px;overflow:hidden;background:linear-gradient(145deg,#2a2218,#141416)}
.au-art img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.au-art-img{position:absolute;inset:0}
.au-bd{flex:1;min-width:0;display:flex;flex-direction:column}
.au-t{display:flex;justify-content:space-between;gap:8px;font-size:14.5px;font-weight:700;line-height:1.25}
.au-all{margin-top:3px;font-size:10.5px;color:var(--au-mute);overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.au-d{margin:4px 0 0;font-size:12px;line-height:1.45;color:var(--au-mute);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.au-ft{margin-top:auto;padding-top:8px;display:flex;align-items:center;gap:8px}
.au-pr{font-size:16px;color:var(--au-gold)}.au-kc{font-size:10.5px;color:var(--au-mute);flex:1}
.au-add{min-width:34px;height:34px;padding:0 10px;border-radius:9px;background:var(--au-gold)!important;color:#1A1405!important;font-size:17px;font-weight:700;line-height:1}
.au-qty{display:flex;align-items:center;gap:10px;background:var(--au-gold);color:#1A1405;border-radius:9px;padding:4px 8px;font-weight:700;font-size:13px}
.au-qty button{width:22px;height:22px;font-size:16px;line-height:1;color:#1A1405!important}
.au-empty{margin:30px 12px;text-align:center;color:var(--au-mute);font-size:13.5px;line-height:1.6;padding:28px 16px;border:1px dashed var(--au-line);border-radius:16px}
.au-empty b{display:block;color:var(--au-text);font-size:15px;margin-bottom:4px}
.au-tabs{position:fixed;left:0;right:0;bottom:0;z-index:20;display:flex;align-items:center;justify-content:space-around;width:100%;max-width:none;margin:0;padding:14px 16px calc(14px + env(safe-area-inset-bottom,0px));background:rgba(15,15,17,.94);backdrop-filter:blur(14px);border-top:1px solid var(--au-line)}
.au-tab{display:flex;flex-direction:column;align-items:center;gap:4px;font-size:10.5px;font-weight:600;color:var(--au-mute)!important;min-width:54px;text-decoration:none}
.au-tab svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.au-tab.on{color:var(--au-gold)!important}.au-tab.on svg{fill:currentColor}
.au-root .au-pill{position:relative;display:flex;align-items:center;gap:8px;padding:12px 20px;border-radius:999px;background:var(--au-gold)!important;color:#1A1405!important;font-weight:700;font-size:14px}
.au-pill svg{width:17px;height:17px}
.au-cnt{position:absolute;top:-6px;inset-inline-end:-2px;min-width:19px;height:19px;border-radius:999px;background:#E5604D;color:#fff;font-size:10.5px;display:grid;place-items:center;padding:0 5px;animation:au-pop .35s}
@keyframes au-pop{40%{transform:scale(1.5)}}
.au-wa{position:fixed;inset-inline-start:16px;bottom:104px;z-index:15;width:48px;height:48px;border-radius:50%;background:#25D366;display:grid;place-items:center;box-shadow:0 8px 20px rgba(0,0,0,.45)}
.au-wa svg{width:26px;height:26px;fill:#fff}
.au-ov{position:fixed;inset:0;z-index:50;background:rgba(0,0,0,.6)}
.au-sheet{position:absolute;left:50%;bottom:0;transform:translateX(-50%);width:100%;max-width:520px;max-height:86vh;overflow:auto;background:var(--au-card);border-radius:22px 22px 0 0;border-top:1px solid var(--au-line);box-shadow:0 -18px 50px rgba(0,0,0,.5);padding:18px 16px calc(18px + env(safe-area-inset-bottom,0px))}
.au-sheet-h{display:flex;align-items:center;justify-content:space-between;margin:0 0 12px}
.au-sheet-h h3{margin:0;font-family:var(--au-f-head);font-size:20px;color:var(--au-text)}
.au-x{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.06)!important;color:var(--au-mute)!important}
.au-x svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}
.au-lines{max-height:34vh;overflow:auto;margin:0 -4px;padding:0 4px}
.au-ln{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--au-line);font-size:13.5px}
.au-ln .n{flex:1;font-weight:600}
.au-tot{display:flex;justify-content:space-between;margin:14px 0;font-weight:700;font-size:16px;color:var(--au-gold)}
.au-form{display:flex;flex-direction:column;gap:12px;margin:6px 0 14px}
.au-fulfil{display:flex;gap:8px}
.au-field{display:flex;flex-direction:column;gap:6px}
.au-field span{font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--au-mute)}
.au-field input{height:44px;border-radius:12px;border:1px solid var(--au-line);background:var(--au-bg);color:var(--au-text);padding:0 14px;font:inherit;font-size:14px;outline:none}
.au-field input:focus{border-color:var(--au-gold)}
.au-field input::placeholder{color:var(--au-mute)}
.au-go{width:100%;padding:14px;border-radius:12px;background:var(--au-gold)!important;color:#1A1405!important;font-weight:700;font-size:15px}
.au-go:disabled{opacity:.45;cursor:not-allowed}
.au-toast{position:fixed;left:50%;bottom:118px;transform:translateX(-50%);background:#F4F1EA;color:#111;padding:10px 16px;border-radius:999px;font-size:13px;font-weight:600;z-index:60}
.au-root :focus-visible{outline:2px solid var(--au-gold);outline-offset:2px}
@container (min-width:900px){
  .au-in{max-width:1080px;margin:0 auto}
  .au-hero{height:340px}
  .au-list{grid-template-columns:repeat(2,1fr);padding:0 24px}
  .au-row{flex-wrap:wrap;overflow-x:visible;padding-inline:24px}
  .au-sec{margin-inline:24px}
  .au-sec-row{margin-inline:24px}
  .au-additem{margin-inline:24px;width:calc(100% - 48px)}
  .au-search{margin-inline:24px}
  .au-id{margin-inline:24px}
}
@media (prefers-reduced-motion:reduce){.au-root *{animation:none!important;transition:none!important}}
`