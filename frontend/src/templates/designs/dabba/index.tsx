/**
 * Dabba — standalone light-monochrome fast-food menu template.
 * Same contract as the other designs: Restaurant data + click-to-edit + menu CRUD.
 */
import { useMemo, useRef, useState } from 'react'
import type { InlineTextStyle, MenuItem, Restaurant } from '../../../shared/lib/types.ts'
import { tx } from '../../../shared/lib/utils.ts'
import { fontStack } from '../../data/fonts.ts'
import { Ed, EdImage, InlineEditProvider, type ActiveField } from '../../editor/inlineEdit.tsx'
import { Icon } from '../../../shared/ui/icons.tsx'
import { confirmDialog } from '../../../shared/components/dialogs.tsx'
import { useI18n } from '../../../shared/i18n'

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

const BLANK =
  'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>')

const catIcon = (n: string) => {
  const s = n.toLowerCase()
  if (/burger/.test(s)) return '🍔'
  if (/fresh|salad|juicy/.test(s)) return '🥗'
  if (/chees/.test(s)) return '🧀'
  if (/chicken|fries/.test(s)) return '🍗'
  if (/pizza/.test(s)) return '🍕'
  return '🍽'
}

export function DabbaSite({
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
  const { t } = useI18n()
  const name = tx(restaurant.name) || 'Dabba'
  const [cat, setCat] = useState('all')
  const [cart, setCart] = useState<Record<string, number>>({})
  const [cartOpen, setCartOpen] = useState(false)
  const [msg, setMsg] = useState('')
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [table, setTable] = useState('')
  const [fav, setFav] = useState<Record<string, boolean>>({})
  const searchRef = useRef<HTMLInputElement | null>(null)
  const [query, setQuery] = useState('')

  const money = (n: number) => `${currency}${n.toFixed(2)}`
  const toast = (text: string) => {
    setMsg(text)
    window.setTimeout(() => setMsg(''), 1800)
  }
  const menu = restaurant.menu
  const dishes = useMemo(
    () => menu.flatMap((c) => c.items.filter((i) => i.available !== false).map((i) => ({ ...i, cat: c.id }))),
    [menu],
  )
  const byId = useMemo(() => Object.fromEntries(dishes.map((d) => [d.id, d])), [dishes])
  const list = dishes.filter((d) => {
    if (cat !== 'all' && d.cat !== cat) return false
    const q = query.trim().toLowerCase()
    if (!q) return true
    return `${d.name} ${d.description || ''}`.toLowerCase().includes(q)
  })
  const count = Object.values(cart).reduce((a, b) => a + b, 0)
  const total = Object.entries(cart).reduce((a, [id, n]) => a + (byId[id]?.price || 0) * n, 0)
  const add = (id: string) => interactive && setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }))
  const step = (id: string, by: number) =>
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
    '--db-bg': colors.background || '#F1EFEA',
    '--db-paper': colors.card || '#FFFFFF',
    '--db-ink': colors.text || '#0B0B0B',
    '--db-line': colors.border || '#E4E0DA',
    '--db-f-head': fontStack(restaurant.design?.typography?.heading || 'montserrat'),
    '--db-f-body': fontStack(restaurant.design?.typography?.body || 'inter'),
  } as React.CSSProperties

  const addCategory = () =>
    onMenuEdit!((draft) => {
      if (!Array.isArray(draft.menu)) draft.menu = []
      draft.menu.push({ id: `cat-${Date.now()}`, name: 'New Category', note: '', items: [] })
    })
  const addItem = (ci: number) =>
    onMenuEdit!((draft) => {
      const c = draft.menu[ci]
      if (!c) return
      if (!Array.isArray(c.items)) c.items = []
      c.items.push({ id: `item-${Date.now()}`, name: 'New dish', description: '', price: 0, compareAt: null, image: '', available: true, featured: false, popular: false })
    })

  const card = (d: MenuItem & { cat: string }) => {
    const ci = menu.findIndex((c) => c.id === d.cat)
    const ii = ci >= 0 ? menu[ci].items.findIndex((i) => i.id === d.id) : -1
    const base = ci >= 0 && ii >= 0 ? `menu.${ci}.items.${ii}` : ''
    const canEdit = editable && !!onMenuEdit && ci >= 0 && ii >= 0
    const badge = d.featured ? "CHEF'S PICK" : d.popular && ii % 2 === 0 ? 'NEW' : ii % 3 === 0 ? 'LIMITED' : ''
    return (
      <article className="db-card" key={d.id}>
        {badge ? <span className="db-badge">{badge}</span> : null}
        {canEdit ? (
          <button
            className="db-del"
            aria-label="Delete item"
            onClick={async (e) => {
              e.stopPropagation()
              if (await confirmDialog({ title: 'حذف الصنف؟', message: 'سيتم حذف هذا الصنف من القائمة.', confirmLabel: 'حذف', cancelLabel: 'إلغاء', tone: 'danger' })) {
                onMenuEdit!((draft) => {
                  const c = draft.menu[ci]
                  if (c && Array.isArray(c.items)) c.items.splice(ii, 1)
                })
              }
            }}
          >
            <Icon name="trash" size={12} />
          </button>
        ) : null}
        <button
          className={`db-heart${fav[d.id] ? ' on' : ''}`}
          aria-label="Save dish"
          onClick={() => interactive && setFav((f) => ({ ...f, [d.id]: !f[d.id] }))}
        >
          <Icon name="heart" size={15} />
        </button>
        <div className="db-card-pic">
          <EdImage path={base ? `${base}.image` : ''} src={d.image || BLANK} alt={d.name} className="db-card-img" />
        </div>
        <div className="db-card-body">
          <div className="db-card-top">
            <Ed as="h3" path={base ? `${base}.name` : ''} fallback={d.name} />
            <Ed as="b" numeric path={base ? `${base}.price` : ''} fallback={String(d.price)} format={(raw) => money(Number(raw) || 0)} />
          </div>
          <div className="db-meta"><span>🌿 Veg</span><span>◷ {10 + (ii % 4) * 5} min</span></div>
          <div className="db-card-foot">
            <span className="db-rate">★ {d.popular ? '4.9' : '4.7'}</span>
            <button className="db-add" onClick={() => add(d.id)} aria-label={t('templateUi.addToDish')} title={t('templateUi.addToDish')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 4h2l2.2 10.4a1.6 1.6 0 0 0 1.6 1.3h8.6a1.6 1.6 0 0 0 1.6-1.3L20 8H6" />
                <circle cx="10" cy="20" r="1.3" /><circle cx="17.5" cy="20" r="1.3" />
              </svg>
            </button>
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
      <div className="db-root" data-mode={mode} style={vars}>
        <style>{CSS}</style>
        <div className="db-shell">
          <div className="db-frame">
            {/* --------------------------- header --------------------------- */}
            <header className="db-header">
              <div className="db-brand">
                <span className="db-brand-icon"><Icon name="store" size={14} /></span>
                <Ed as="span" path="name" fallback={name} />
              </div>
              <nav className="db-nav">
                <a className="on" href="#db-top">Home</a>
                <a href="#db-menu">Our Menu</a>
                <a href="#db-offer">Offers</a>
                <a href="#db-visit">Contact</a>
                <a href="#db-why">FAQ</a>
              </nav>
              <div className="db-actions">
                <button aria-label="Search" onClick={() => searchRef.current?.focus()}><Icon name="search" size={17} /></button>
                <button className="db-cart" onClick={() => interactive && setCartOpen(true)} aria-label={t('templateUi.cart')}>
                  <Icon name="store" size={17} />{count > 0 ? <i>{count}</i> : null}
                </button>
                <button className="db-order" onClick={() => interactive && setCartOpen(true)}>Order Now <span>→</span></button>
              </div>
            </header>

            {/* ---------------------------- hero ---------------------------- */}
            <section className="db-hero" id="db-top">
              <div className="db-hero-copy">
                <span className="db-kicker">• HOME COOKED · MADE FRESH DAILY</span>
                <Ed as="h1" className="db-headline" path="copy.dabba.hero" fallback="Real food, made to crave." />
                <Ed as="p" className="db-lede" path="description" fallback={tx(restaurant.description) || ''} multiline />
                <div className="db-cta">
                  <button className="db-order" onClick={() => interactive && setCartOpen(true)}>Order Now <span>→</span></button>
                  <a className="db-ghost" href="#db-menu">View Full Menu</a>
                </div>
                <div className="db-stats">
                  <div><b>4</b><span>Stars</span></div>
                  <div><b>30 min</b><span>Avg Delivery</span></div>
                  <div><b>1,200+</b><span>Happy Customers</span></div>
                  <div><b>4.9</b><span>Avg Rating</span></div>
                </div>
              </div>
              <div className="db-hero-visual">
                <EdImage path="heroImage" src={restaurant.heroImage || BLANK} alt="" className="db-hero-img" eager />
                <div className="db-ticket"><b><Icon name="store" size={12} /> Gourmet Toast #204</b><span>Packed 7:40 AM</span></div>
                <div className="db-rating"><b>4.9</b><span>/ 5.0 ★<br />32 reviews</span></div>
              </div>
            </section>

            {/* ------------------------ food types ------------------------- */}
            <section className="db-types">
              <div className="db-section-head">
                <div><span className="db-kicker">• WHAT ARE YOU CRAVING?</span><Ed as="h2" path="copy.dabba.types" fallback="Browse by food type" /></div>
                <a href="#db-menu">See full menu →</a>
              </div>
              <div className="db-tiles">
                {menu.map((c) => (
                  <button key={c.id} className={`db-tile${cat === c.id ? ' on' : ''}`} onClick={() => interactive && setCat(cat === c.id ? 'all' : c.id)}>
                    <span className="db-tile-ico">{catIcon(c.name)}</span>
                    <Ed as="b" path={`menu.${menu.indexOf(c)}.name`} fallback={c.name} />
                    <span className="db-avail">Available</span>
                  </button>
                ))}
                {editable && onMenuEdit ? <button className="db-tile db-tile-add" onClick={addCategory}>+ new</button> : null}
              </div>
            </section>
          </div>

          {/* -------------------------- today's menu ------------------------ */}
          <section className="db-menu" id="db-menu">
            <div className="db-frame">
              <div className="db-section-head">
                <div><span className="db-kicker">• COOKED FRESH · SERVED HOT</span><Ed as="h2" path="copy.dabba.menu" fallback="Today's menu" /></div>
                <label className="db-search">
                  <Icon name="search" size={15} />
                  <input ref={searchRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('templateUi.searchPh')} />
                </label>
              </div>
              <div className="db-cards">
                {list.map(card)}
                {editable && onMenuEdit && cat !== 'all' ? (
                  <button className="db-card db-new" onClick={() => addItem(menu.findIndex((c) => c.id === cat))}>+ add item</button>
                ) : null}
                {!list.length ? <div className="db-empty">No dishes found.</div> : null}
              </div>
            </div>
          </section>

          <div className="db-frame">
            {/* ------------------------ how it works ----------------------- */}
            <section className="db-how" id="db-why">
              <span className="db-kicker">• FROM YOUR CRAVING TO YOUR DOOR</span>
              <Ed as="h2" path="copy.dabba.how" fallback="How it works" />
              <div className="db-steps">
                {[
                  ['01', 'search', 'Pick your Food', 'Choose from fresh burgers, meals, snacks and more.'],
                  ['02', 'plus', 'Add to your cart', 'Build your order with all your favourites.'],
                  ['03', 'save', 'Packed with care', 'Every dish is packed fresh and sealed with care.'],
                  ['04', 'store', 'Delivered to you', 'Track your order and enjoy every bite.'],
                ].map(([n, icon, title, text]) => (
                  <div className="db-step" key={n}>
                    <span>{n}</span><Icon name={icon} size={16} /><b>{title}</b><p>{text}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ---------------------- cooked with care --------------------- */}
            <section className="db-care">
              <div className="db-care-photo"><EdImage path="gallery.0" src={restaurant.gallery?.[0] || BLANK} alt="" /></div>
              <div>
                <span className="db-kicker">• WHY DABBA</span>
                <Ed as="h2" path="copy.dabba.care" fallback="Cooked with care, served with flavor." />
                <Ed as="p" path="description" fallback={tx(restaurant.description) || ''} multiline />
                <div className="db-feat"><Icon name="check" size={14} /> Fresh ingredients</div>
                <div className="db-feat"><Icon name="check" size={14} /> Made to order</div>
                <div className="db-feat"><Icon name="check" size={14} /> Real, simple flavors</div>
              </div>
            </section>

            {/* -------------------------- promo ---------------------------- */}
            <section className="db-promo" id="db-offer">
              <div><span className="db-kicker">• LIMITED TIME OFFER</span><Ed as="h2" path="copy.dabba.promo" fallback="Get 20% off your first order." /><p>Call us now to place your first order — good food, great value, delivered to your door.</p><button className="db-order" onClick={() => interactive && setCartOpen(true)}>Order Now →</button></div>
              <EdImage path="gallery.1" src={restaurant.gallery?.[1] || BLANK} alt="" className="db-promo-img" />
            </section>

            {/* ------------------------ testimonials ----------------------- */}
            <section className="db-reviews">
              <span className="db-kicker">• WHAT PEOPLE ARE SAYING</span>
              <Ed as="h2" path="copy.dabba.reviews" fallback="Real words, real hungry people." />
              <div className="db-review-grid">
                {[
                  ['“Simply one of the best burgers I’ve had in a long time. Everything tasted fresh and delicious.”', 'Anna Lee'],
                  ['“The monthly pass is well worth it. On-time every time, always piping hot when it arrives.”', 'Daniel Ortiz'],
                  ['“Ordered the fish curry on a whim — genuinely one of the best meals I’ve had this year.”', 'Priya Nandan'],
                ].map(([quote, who]) => (
                  <div className="db-review" key={who}><p>{quote}</p><div><span className="db-avatar">{who.charAt(0)}</span><div><b>{who}</b><span>Verified Customer</span></div></div></div>
                ))}
              </div>
            </section>

            <footer className="db-footer" id="db-visit">
              <div className="db-footer-brand"><span className="db-brand-icon"><Icon name="store" size={14} /></span>{name}</div>
              <Ed as="p" path="address" fallback={restaurant.address} />
              <Ed as="p" path="hours.0.hours" fallback={restaurant.hours?.[0]?.hours || ''} />
              {restaurant.phone ? <a href={`tel:${restaurant.phone.replace(/[^\d+]/g, '')}`}>{restaurant.phone}</a> : null}
            </footer>
          </div>
        </div>

        {/* ---------------------------- cart ------------------------------- */}
        {cartOpen ? (
          <div className="db-ov" onClick={() => setCartOpen(false)}>
            <div className="db-drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={t('templateUi.cart')}>
              <div className="db-drawer-h"><h3>{t('templateUi.yourOrder')}</h3><button onClick={() => setCartOpen(false)} aria-label={t('templateUi.close')}>×</button></div>
              {!count ? (
                <div className="db-empty">{t('templateUi.cartEmpty')}<br />{t('templateUi.cartEmptySub')}</div>
              ) : (
                <>
                  {Object.entries(cart).map(([id, n]) => (
                    <div className="db-line" key={id}>
                      <span>{byId[id]?.name}</span>
                      <span className="db-qty">
                        <button onClick={() => step(id, -1)} aria-label="Remove one">−</button>{n}
                        <button onClick={() => step(id, 1)} aria-label="Add one">+</button>
                      </span>
                      <b>{money((byId[id]?.price || 0) * n)}</b>
                    </div>
                  ))}
                  <div className="db-total"><span>{t('templateUi.total')}</span><b>{money(total)}</b></div>
                  <div className="db-form">
                    <div className="db-choices">
                      <button className={!table ? 'on' : ''} onClick={() => setTable('')}>( ) {t('templateUi.delivery')}</button>
                      <button className={table ? 'on' : ''} onClick={() => setTable(table || '1')}>( ) {t('templateUi.table')}</button>
                    </div>
                    {table ? <label><span>{t('templateUi.tableNo')}</span><input value={table} onChange={(e) => setTable(e.target.value)} /></label> : null}
                    <label><span>{t('templateUi.name')}</span><input value={guestName} onChange={(e) => setGuestName(e.target.value)} /></label>
                    <label><span>{t('templateUi.phone')}</span><input value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} inputMode="tel" /></label>
                  </div>
                  <button
                    className="db-order db-send"
                    disabled={!guestName.trim() || !guestPhone.trim()}
                    onClick={() => { setCart({}); setCartOpen(false); toast(t('templateUi.orderSent')) }}
                  >
                    {t('templateUi.placeOrder')} · {money(total)}
                  </button>
                </>
              )}
            </div>
          </div>
        ) : null}
        {msg ? <div className="db-toast" role="status">{msg}</div> : null}
      </div>
    </InlineEditProvider>
  )
}

export default DabbaSite

const CSS = `
.db-root{width:100%;max-width:none;margin:0;min-height:100vh;background:var(--db-bg);color:var(--db-ink);font-family:var(--db-f-body);position:relative;overflow-x:clip}
.db-root[data-mode="preview"]{min-height:100%}
.db-shell{container-type:inline-size;width:100%}
.db-root *{box-sizing:border-box}
.db-root button{font:inherit;color:inherit;border:0;background:none;cursor:pointer;padding:0}
.db-root a{color:inherit;text-decoration:none}
.db-frame{max-width:1240px;margin:0 auto;padding:0 20px}
.db-kicker{font-size:9px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#7a7672}
.db-header{display:flex;align-items:center;gap:16px;padding:18px 0}
.db-brand{display:flex;align-items:center;gap:8px;font-family:var(--db-f-head);font-weight:800;font-size:15px;letter-spacing:.06em}
.db-brand-icon{display:grid;place-items:center;width:28px;height:28px;border-radius:8px;background:var(--db-ink);color:#fff}
.db-nav{display:none;gap:20px;margin-left:30px;font-size:11px}
.db-nav a.on{font-weight:700}
.db-actions{display:flex;align-items:center;gap:10px;margin-left:auto}
.db-order{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:10px 16px;border-radius:999px;background:var(--db-ink);color:#fff;font-size:11px;font-weight:700;white-space:nowrap}
.db-cart{position:relative;display:grid;place-items:center;width:30px;height:30px}
.db-cart i{position:absolute;top:-4px;right:-4px;min-width:16px;height:16px;border-radius:50%;background:var(--db-ink);color:#fff;font-size:9px;font-style:normal;display:grid;place-items:center}
.db-hero{display:flex;flex-direction:column;gap:28px;padding:30px 0 50px}
.db-headline{margin:10px 0 0;font-family:var(--db-f-head);font-weight:800;font-size:clamp(38px,7vw,74px);line-height:1.02;letter-spacing:-.04em}
.db-lede{max-width:46ch;margin:16px 0 0;font-size:12px;line-height:1.7;color:#6f6b67}
.db-cta{display:flex;flex-wrap:wrap;gap:10px;margin-top:24px}
.db-ghost{display:inline-flex;align-items:center;padding:10px 18px;border-radius:999px;border:1px solid var(--db-line);font-size:11px;font-weight:700;background:#fff}
.db-stats{display:flex;flex-wrap:wrap;gap:24px;margin-top:34px}
.db-stats div{display:flex;flex-direction:column}
.db-stats b{font-family:var(--db-f-head);font-size:20px}
.db-stats span{font-size:9px;color:#7a7672}
.db-hero-visual{position:relative;min-height:280px;display:grid;place-items:center}
.db-hero-img{width:100%;max-height:340px;object-fit:contain;filter:drop-shadow(0 24px 28px rgba(0,0,0,.16))}
.db-ticket,.db-rating{position:absolute;background:#fff;box-shadow:0 10px 30px rgba(0,0,0,.1)}
.db-ticket{top:4%;left:0;padding:9px 12px;border-radius:10px;font-size:9px;display:flex;flex-direction:column;gap:3px}
.db-ticket b{display:flex;align-items:center;gap:5px;font-size:10px}
.db-ticket span{color:#7a7672}
.db-rating{bottom:4%;right:0;padding:10px 12px;border-radius:10px;background:var(--db-ink);color:#fff;display:flex;gap:8px;align-items:center}
.db-rating b{font-size:18px}.db-rating span{font-size:8px;line-height:1.3}
.db-section-head{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin-bottom:18px}
.db-section-head h2{margin:6px 0 0;font-family:var(--db-f-head);font-size:clamp(20px,4vw,30px);font-weight:800;letter-spacing:-.02em}
.db-section-head>a{font-size:10px;font-weight:700}
.db-tiles{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.db-tile{display:flex;flex-direction:column;align-items:center;gap:4px;padding:14px 6px;border-radius:16px;background:#fff;border:1px solid transparent}
.db-tile.on{border-color:var(--db-ink)}
.db-tile-ico{display:grid;place-items:center;width:40px;height:40px;border-radius:50%;background:var(--db-bg);font-size:18px}
.db-tile b{font-family:var(--db-f-head);font-size:10px}
.db-avail{font-size:8px;color:#9c9691}
.db-tile-add{color:#7a7672;border-style:dashed}
.db-menu{background:var(--db-paper);padding:34px 0 46px;margin-top:30px}
.db-search{display:flex;align-items:center;gap:6px;padding:8px 12px;border-radius:999px;background:var(--db-bg)}
.db-search input{border:0;background:transparent;outline:none;font:inherit;font-size:11px;width:130px}
.db-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.db-card{position:relative;border-radius:18px;background:var(--db-bg);padding:10px}
.db-card-pic{position:relative;aspect-ratio:1;border-radius:14px;overflow:hidden;background:#e7e3de}
.db-card-img{width:100%;height:100%;object-fit:cover}
.db-badge{position:absolute;top:14px;left:14px;z-index:2;padding:4px 8px;border-radius:999px;background:var(--db-ink);color:#fff;font-size:7px;font-weight:800;letter-spacing:.06em}
.db-heart{position:absolute;top:16px;right:16px;z-index:2;width:26px;height:26px;border-radius:50%;background:#fff;display:grid;place-items:center}
.db-heart.on{color:#e11d33}
.db-del{position:absolute;top:16px;left:14px;z-index:3;width:26px;height:26px;border-radius:50%;background:#e11d33;color:#fff;display:grid;place-items:center}
.db-card-body{padding:10px 2px 0}
.db-card-top{display:flex;align-items:baseline;justify-content:space-between;gap:8px}
.db-card-top h3{margin:0;font-family:var(--db-f-head);font-size:12px;font-weight:700}
.db-card-top b{font-size:12px;white-space:nowrap}
.db-meta{display:flex;gap:10px;margin-top:6px;font-size:8px;color:#8a857f}
.db-card-foot{display:flex;align-items:center;justify-content:space-between;margin-top:10px}
.db-rate{font-size:10px;font-weight:700}
.db-root .db-add{display:grid;place-items:center;width:38px;height:38px;padding:0;border-radius:999px;background:var(--db-ink);color:#fff;box-shadow:0 6px 16px rgba(0,0,0,.22);transition:transform .18s ease}
.db-add:hover{transform:scale(1.08)}
.db-add svg{width:20px;height:20px}
.db-new{display:grid;place-items:center;min-height:260px;border:2px dashed var(--db-line);color:#7a7672;font-size:11px}
.db-empty{padding:30px;text-align:center;font-size:12px;color:#8a857f}
.db-how{padding:40px 0 30px}
.db-steps{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:18px}
.db-step{padding:16px;border-radius:16px;background:var(--db-paper)}
.db-step>span{font-size:9px;color:#9c9691}
.db-step svg{display:block;margin:8px 0}
.db-step b{font-family:var(--db-f-head);font-size:12px}
.db-step p{margin:6px 0 0;font-size:9.5px;line-height:1.5;color:#8a857f}
.db-care{display:flex;flex-direction:column;gap:24px;padding:20px 0 40px}
.db-care-photo{min-height:260px;border-radius:20px;overflow:hidden;background:var(--db-paper)}
.db-care-photo img{width:100%;height:100%;object-fit:cover}
.db-care h2,.db-promo h2,.db-reviews h2{margin:8px 0 0;font-family:var(--db-f-head);font-size:clamp(20px,4vw,30px);font-weight:800;line-height:1.1}
.db-care p{font-size:11px;line-height:1.7;color:#7a7672}
.db-feat{display:flex;align-items:center;gap:8px;margin-top:10px;font-size:11px;font-weight:600}
.db-promo{display:flex;flex-direction:column;gap:20px;padding:26px;border-radius:22px;background:var(--db-bg)}
.db-promo p{max-width:42ch;font-size:10.5px;line-height:1.6;color:#7a7672}
.db-promo-img{width:100%;max-height:210px;object-fit:contain;filter:drop-shadow(0 16px 20px rgba(0,0,0,.15))}
.db-reviews{padding:40px 0}
.db-review-grid{display:grid;grid-template-columns:1fr;gap:12px;margin-top:18px}
.db-review{padding:16px;border-radius:16px;background:var(--db-paper)}
.db-review p{margin:0;font-size:10.5px;line-height:1.6;color:#5e5a56}
.db-review>div{display:flex;align-items:center;gap:8px;margin-top:14px}
.db-avatar{display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:var(--db-ink);color:#fff;font-size:11px;font-weight:700}
.db-review b,.db-review span{display:block;font-size:9px}
.db-review span{color:#9c9691}
.db-footer{padding:26px 0 40px;border-top:1px solid var(--db-line);font-size:10.5px;line-height:1.7;color:#7a7672}
.db-footer-brand{display:flex;align-items:center;gap:8px;font-family:var(--db-f-head);font-weight:800;color:var(--db-ink);font-size:14px}
.db-footer a{color:var(--db-ink)}
.db-ov{position:fixed;inset:0;z-index:50;background:rgba(0,0,0,.5)}
.db-drawer{position:absolute;top:0;right:0;bottom:0;width:min(400px,94vw);overflow:auto;background:var(--db-paper);padding:20px 18px}
.db-drawer-h{display:flex;align-items:center;justify-content:space-between}
.db-drawer-h h3{margin:0;font-family:var(--db-f-head);font-size:18px}
.db-drawer-h button{font-size:24px;line-height:1}
.db-line{display:flex;align-items:center;gap:8px;padding:10px 0;border-bottom:1px solid var(--db-line);font-size:12px}
.db-line>span:first-child{flex:1}
.db-qty button{width:20px;height:20px;border:1px solid var(--db-line);margin-right:3px}
.db-total{display:flex;justify-content:space-between;margin:16px 0;font-weight:700}
.db-form label{display:flex;flex-direction:column;gap:3px;margin-top:10px}
.db-form label span{font-size:9px;font-weight:700;color:#7a7672}
.db-form input{border:0;border-bottom:1px solid var(--db-line);background:transparent;padding:8px 0;font:inherit;font-size:13px;outline:none}
.db-choices{display:flex;flex-direction:column;gap:6px;margin-top:12px}
.db-choices button{text-align:left;font-size:11px}
.db-choices button.on{font-weight:700}
.db-send{width:100%;margin-top:16px}
.db-send:disabled{opacity:.45;cursor:not-allowed}
.db-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);padding:10px 16px;border-radius:999px;background:var(--db-ink);color:#fff;font-size:12px;font-weight:700;z-index:70}
.db-root .rs-ed{outline:1px dashed var(--db-line);outline-offset:2px;cursor:text}
.db-root .rs-ed[data-active="true"]{outline-color:var(--db-ink)}
.db-root .rs-ed-media{cursor:pointer;outline:1px dashed var(--db-ink)}
.db-root :focus-visible{outline:2px solid var(--db-ink);outline-offset:2px}
@container (min-width:900px){
  .db-frame{padding:0 40px}
  .db-nav{display:flex}
  .db-hero{flex-direction:row;align-items:center;gap:60px;padding:50px 0 70px}
  .db-hero-copy{flex:1}.db-hero-visual{flex:0 0 46%;min-height:420px}
  .db-hero-img{max-height:420px}
  .db-tiles{grid-template-columns:repeat(6,minmax(0,1fr))}
  .db-cards{grid-template-columns:repeat(4,minmax(0,1fr))}
  .db-steps{grid-template-columns:repeat(4,minmax(0,1fr))}
  .db-care{flex-direction:row;align-items:center;gap:50px}
  .db-care>div{flex:1}
  .db-care-photo{flex:0 0 40%}
  .db-promo{flex-direction:row;align-items:center;justify-content:space-between}
  .db-promo>div{flex:1}.db-promo-img{flex:0 0 38%;max-height:260px}
  .db-review-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
}
@media (prefers-reduced-motion:reduce){.db-root *{animation:none!important;transition:none!important}}
`
