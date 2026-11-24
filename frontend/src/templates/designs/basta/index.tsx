/**
 * Basta — Foody-inspired restaurant menu template.
 * Same isolated structure/editing contract; distinct light editorial design:
 * oversized headline, circular hero plate, floating offer card, dish carousel.
 */
import { useMemo, useRef, useState } from 'react'
import type { InlineTextStyle, MenuItem, Restaurant } from '../../../shared/lib/types.ts'
import { tx } from '../../../shared/lib/utils.ts'
import { Ed, EdImage, InlineEditProvider, type ActiveField } from '../../editor/inlineEdit.tsx'
import { confirmDialog } from '../../../shared/components/dialogs.tsx'
import { Icon } from '../../../shared/ui/icons.tsx'
import { fontStack } from '../../data/fonts.ts'
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

export function BastaSite({
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
  const name = tx(restaurant.name) || 'Basta'
  const { t } = useI18n()
  const [cat, setCat] = useState('all')
  const [cart, setCart] = useState<Record<string, number>>({})
  const [cartOpen, setCartOpen] = useState(false)
  const [msg, setMsg] = useState('')
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [table, setTable] = useState('')
  const railRef = useRef<HTMLDivElement | null>(null)

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
  const list = cat === 'all' ? dishes : dishes.filter((d) => d.cat === cat)
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
  const scrollRail = (dir: number) =>
    railRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' })

  const colors = restaurant.design?.colors || {}
  const vars = {
    '--bs-f-head': fontStack(restaurant.design?.typography?.heading || 'playfair'),
    '--bs-f-body': fontStack(restaurant.design?.typography?.body || 'inter'),
    '--bs-bg': colors.background || '#EAE4E3',
    '--bs-paper': colors.card || '#F3EFEF',
    '--bs-red': colors.accent || '#E11D33',
    '--bs-ink': colors.text || '#0B0B0B',
    '--bs-line': colors.border || '#D9D0D0',
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
  const paths = (d: MenuItem & { cat: string }) => {
    const ci = menu.findIndex((c) => c.id === d.cat)
    const ii = ci >= 0 ? menu[ci].items.findIndex((i) => i.id === d.id) : -1
    const base = ci >= 0 && ii >= 0 ? `menu.${ci}.items.${ii}` : ''
    return { ci, ii, base, canEdit: editable && !!onMenuEdit && ci >= 0 && ii >= 0 }
  }

  return (
    <InlineEditProvider
      restaurant={restaurant}
      enabled={editable}
      onActiveChange={onActiveChange}
      onCommit={onCommit}
      onStyle={onStyle}
    >
      <div className="bs-root" data-mode={mode} style={vars}>
        <style>{CSS}</style>
        <div className="bs-shell">
          <div className="bs-frame">
            {/* -------------------------- header -------------------------- */}
            <header className="bs-header">
              <Ed as="span" className="bs-wordmark" path="name" fallback={name} />
              <nav className="bs-nav">
                <a className="on" href="#bs-top">Home</a>
                <a href="#bs-menu">Menu</a>
                <a href="#bs-about">About Us</a>
                <a href="#bs-visit">Contact</a>
              </nav>
              <div className="bs-right">
                <button className="bs-cart" onClick={() => interactive && setCartOpen(true)} aria-label={t('templateUi.cart')}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6 8h12l1 13H5zM9 8a3 3 0 0 1 6 0" /></svg>
                  {count > 0 ? <i>{count}</i> : null}
                </button>
                <button className="bs-signup" onClick={() => interactive && setCartOpen(true)}>{t('templateUi.orderNow')}</button>
              </div>
            </header>

            {/* --------------------------- hero --------------------------- */}
            <section className="bs-hero" id="bs-top">
              <div className="bs-copy">
                <h1 className="bs-headline">
                  <Ed as="span" path="copy.basta.hero.a" fallback="it's not just " />
                  <Ed as="span" path="copy.basta.hero.b" fallback="Food" />
                  <Ed as="span" path="copy.basta.hero.c" fallback=", It's an " />
                  <Ed as="span" path="copy.basta.hero.d" fallback="Experience." />
                </h1>
                <div className="bs-cta">
                  <a className="bs-primary" href="#bs-menu">{t('templateUi.viewMenu')}</a>
                  <a className="bs-ghost" href="#bs-visit">{t('templateUi.bookTable')}</a>
                </div>
                <div className="bs-reviews">
                  <span className="bs-review-label">{t('templateUi.reviews')}</span>
                  <div className="bs-avatars"><i>AM</i><i>SK</i><i>JD</i><i>45+</i></div>
                  <span className="bs-stars">★★★★★</span>
                </div>
              </div>
              <div className="bs-visual">
                <div className="bs-plate">
                  <EdImage path="heroImage" src={restaurant.heroImage || BLANK} alt="" className="bs-plate-img" eager />
                </div>
                <div className="bs-offer"><b>5%</b><span>Discount<br />for 2 orders</span></div>
                <span className="bs-leaf bs-leaf-a" aria-hidden="true">🥬</span>
                <span className="bs-leaf bs-leaf-b" aria-hidden="true">🍅</span>
                <span className="bs-leaf bs-leaf-c" aria-hidden="true">🌿</span>
              </div>
            </section>

            {/* -------------------------- menu rail ------------------------ */}
            <section className="bs-menu" id="bs-menu">
              <div className="bs-menu-head">
                <div>
                  <span className="bs-eyebrow">Our Menu</span>
                  <Ed as="h2" path="copy.basta.menu.title" fallback="Fresh from the kitchen" />
                </div>
                <div className="bs-arrows">
                  <button onClick={() => scrollRail(-1)} aria-label="Scroll left">←</button>
                  <button className="next" onClick={() => scrollRail(1)} aria-label="Scroll right">→</button>
                </div>
              </div>
              <div className="bs-cats">
                {[{ id: 'all', name: 'All' }, ...menu].map((c) => (
                  <button key={c.id} className={`bs-cat${cat === c.id ? ' on' : ''}`} onClick={() => interactive && setCat(c.id)}>{c.name}</button>
                ))}
                {editable && onMenuEdit ? <button className="bs-cat bs-cat-add" onClick={addCategory}>+ new section</button> : null}
              </div>
              <div className="bs-rail" ref={railRef}>
                {list.map((d) => {
                  const { base, canEdit, ci, ii } = paths(d)
                  return (
                    <article className="bs-card" key={d.id}>
                      {canEdit ? (
                        <button
                          className="bs-del" aria-label="Delete item"
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
                      <div className="bs-card-pic">
                        <EdImage path={base ? `${base}.image` : ''} src={d.image || BLANK} alt={d.name} className="bs-card-img" />
                        <button className="bs-add" onClick={() => add(d.id)} aria-label={`Add ${d.name}`}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 8h12l1 13H5zM9 8a3 3 0 0 1 6 0" /></svg>
                        </button>
                      </div>
                      <Ed as="h3" className="bs-dish" path={base ? `${base}.name` : ''} fallback={d.name} />
                      <Ed as="p" className="bs-dish-sub" path={base ? `${base}.description` : ''} fallback={d.description} />
                      <Ed as="b" className="bs-price" numeric path={base ? `${base}.price` : ''} fallback={String(d.price)} format={(raw) => money(Number(raw) || 0)} />
                    </article>
                  )
                })}
                {editable && onMenuEdit && cat !== 'all' ? (
                  <button className="bs-card bs-new" onClick={() => addItem(menu.findIndex((c) => c.id === cat))}>+ add item</button>
                ) : null}
                {!list.length ? <div className="bs-empty">Nothing here yet.</div> : null}
              </div>
            </section>

            {/* -------------------------- about --------------------------- */}
            <section className="bs-about" id="bs-about">
              <div>
                <span className="bs-eyebrow">About Us</span>
                <Ed as="h2" path="copy.basta.about.title" fallback="Good food, good mood." />
                <Ed as="p" path="description" fallback={tx(restaurant.description) || ''} multiline />
              </div>
              <div className="bs-visit" id="bs-visit">
                <Ed as="p" path="address" fallback={restaurant.address} />
                <Ed as="p" path="hours.0.hours" fallback={restaurant.hours?.[0]?.hours || ''} />
                {restaurant.phone ? <a href={`tel:${restaurant.phone.replace(/[^\d+]/g, '')}`}>{restaurant.phone}</a> : null}
              </div>
            </section>
          </div>
        </div>

        {/* --------------------------- cart drawer ------------------------ */}
        {cartOpen ? (
          <div className="bs-ov" onClick={() => setCartOpen(false)}>
            <div className="bs-drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Cart">
              <div className="bs-drawer-h"><h3>{t('templateUi.yourOrder')}</h3><button onClick={() => setCartOpen(false)} aria-label="Close cart">×</button></div>
              {!count ? (
                <div className="bs-empty">{t('templateUi.cartEmpty')}<br />{t('templateUi.cartEmptySub')}</div>
              ) : (
                <>
                  {Object.entries(cart).map(([id, n]) => (
                    <div className="bs-line" key={id}>
                      <span>{byId[id]?.name}</span>
                      <span className="bs-qty">
                        <button onClick={() => step(id, -1)} aria-label="Remove one">−</button>{n}
                        <button onClick={() => step(id, 1)} aria-label="Add one">+</button>
                      </span>
                      <b>{money((byId[id]?.price || 0) * n)}</b>
                    </div>
                  ))}
                  <div className="bs-total"><span>{t('templateUi.total')}</span><b>{money(total)}</b></div>
                  <div className="bs-form">
                    <div className="bs-choices">
                      <button className={!table ? 'on' : ''} onClick={() => setTable('')}>({t('templateUi.delivery')}</button>
                      <button className={table ? 'on' : ''} onClick={() => setTable(table || '1')}>({t('templateUi.table')}</button>
                    </div>
                    {table ? <label><span>{t('templateUi.tableNo')}</span><input value={table} onChange={(e) => setTable(e.target.value)} placeholder="Table no." /></label> : null}
                    <label><span>{t('templateUi.name')}</span><input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Your name" /></label>
                    <label><span>{t('templateUi.phone')}</span><input value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} placeholder="+1 …" inputMode="tel" /></label>
                  </div>
                  <button
                    className="bs-send"
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
        {msg ? <div className="bs-toast" role="status">{msg}</div> : null}
      </div>
    </InlineEditProvider>
  )
}

export default BastaSite

const CSS = `
.bs-root{width:100%;max-width:none;margin:0;min-height:100vh;background:var(--bs-bg);color:var(--bs-ink);font-family:var(--bs-f-body);position:relative;overflow-x:clip}
.bs-root[data-mode="preview"]{min-height:100%}
.bs-shell{container-type:inline-size;width:100%}
.bs-root *{box-sizing:border-box}
.bs-root button{font:inherit;color:inherit;border:0;background:none;cursor:pointer;padding:0}
.bs-root a{color:inherit;text-decoration:none}
.bs-frame{max-width:1360px;margin:0 auto;padding:0 16px 50px}
.bs-header{display:flex;align-items:center;gap:16px;padding:18px 0}
.bs-wordmark{font-family:var(--bs-f-head);font-size:24px;font-weight:700;letter-spacing:-.02em;white-space:nowrap}
.bs-wordmark::first-letter{color:var(--bs-red)}
.bs-nav{display:none;gap:24px;margin-left:40px;font-size:12px}
.bs-nav a{color:var(--bs-ink)}
.bs-nav a.on{color:var(--bs-red);font-weight:600}
.bs-right{display:flex;align-items:center;gap:12px;margin-left:auto}
.bs-root .bs-cart{position:relative;display:grid;place-items:center;width:44px;height:44px;border-radius:999px;background:#1a1714;color:#fff;box-shadow:0 8px 20px rgba(0,0,0,.22);transition:transform .18s ease}
.bs-cart:hover{transform:scale(1.06)}
.bs-cart svg{width:24px;height:24px}
.bs-cart i{position:absolute;top:-3px;right:-3px;min-width:19px;height:19px;border-radius:50%;background:var(--bs-red);color:#fff;font-size:10px;font-weight:800;font-style:normal;display:grid;place-items:center;border:2px solid #fff}
.bs-signup{padding:11px 20px;border-radius:999px;background:var(--bs-red);color:#fff;font-size:12px;font-weight:600;white-space:nowrap}
.bs-hero{display:flex;flex-direction:column;gap:28px;padding:24px 0 40px}
.bs-copy{position:relative;z-index:1}
.bs-headline{margin:0;font-family:var(--bs-f-head);font-size:clamp(40px,8vw,86px);font-weight:700;line-height:1.02;letter-spacing:-.035em}
.bs-cta{display:flex;flex-wrap:wrap;gap:12px;margin-top:28px}
.bs-primary,.bs-ghost{display:inline-flex;align-items:center;justify-content:center;padding:13px 26px;border-radius:999px;font-size:12px;font-weight:600}
.bs-primary{background:var(--bs-red);color:#fff}
.bs-ghost{background:#fff;color:var(--bs-ink)}
.bs-reviews{display:flex;align-items:center;gap:12px;margin-top:34px}
.bs-review-label{font-size:11px;font-weight:600}
.bs-avatars{display:flex}
.bs-avatars i{display:grid;place-items:center;width:28px;height:28px;margin-left:-7px;border-radius:50%;border:2px solid var(--bs-bg);background:#c9a99a;color:#fff;font-size:8px;font-style:normal;font-weight:700}
.bs-avatars i:first-child{margin-left:0;background:#b98f7d}.bs-avatars i:nth-child(2){background:#7e9b8c}.bs-avatars i:nth-child(3){background:#a9887a}.bs-avatars i:last-child{background:#0b0b0b;font-size:9px}
.bs-stars{font-size:13px;letter-spacing:.08em;color:#F5A623}
.bs-visual{position:relative;display:flex;align-items:center;justify-content:center;min-height:300px}
.bs-plate{position:relative;width:min(80vw,460px);aspect-ratio:1;border-radius:50%;overflow:hidden;box-shadow:0 30px 70px -30px rgba(0,0,0,.35)}
.bs-plate-img{width:100%;height:100%;object-fit:cover}
.bs-offer{position:absolute;top:4%;left:0;display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:12px;background:#fff;box-shadow:0 10px 30px rgba(0,0,0,.12)}
.bs-offer b{font-size:22px;color:var(--bs-red)}
.bs-offer span{font-size:9px;line-height:1.25;color:var(--bs-ink)}
.bs-leaf{position:absolute;font-size:34px;filter:drop-shadow(0 8px 14px rgba(0,0,0,.2))}
.bs-leaf-a{top:6%;right:2%}.bs-leaf-b{bottom:8%;right:-2%;font-size:44px}.bs-leaf-c{bottom:18%;left:2%;font-size:26px}
.bs-menu{padding:30px 0 20px}
.bs-menu-head{display:flex;align-items:flex-end;justify-content:space-between;gap:12px}
.bs-eyebrow{font-size:10px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--bs-red)}
.bs-menu-head h2,.bs-about h2{margin:6px 0 0;font-family:var(--bs-f-head);font-size:clamp(24px,4vw,38px);line-height:1.1}
.bs-arrows{display:flex;gap:8px}
.bs-arrows button{width:34px;height:34px;border-radius:50%;background:#3a3a3a;color:#fff;font-size:14px}
.bs-arrows button.next{background:var(--bs-red)}
.bs-cats{display:flex;gap:16px;margin:20px 0 14px;border-bottom:1px solid var(--bs-line);overflow-x:auto;scrollbar-width:none}
.bs-cat{flex:none;padding:8px 0 10px;font-size:11px;font-weight:600;color:#7a7373;border-bottom:2px solid transparent}
.bs-cat.on{color:var(--bs-red);border-bottom-color:var(--bs-red)}
.bs-cat-add{color:var(--bs-red);border-style:dashed}
.bs-rail{display:flex;gap:14px;overflow-x:auto;scroll-snap-type:x mandatory;padding:6px 2px 14px;scrollbar-width:none}
.bs-rail::-webkit-scrollbar,.bs-cats::-webkit-scrollbar{display:none}
.bs-card{position:relative;flex:0 0 min(74vw,230px);scroll-snap-align:start;padding:0 0 14px;text-align:center}
.bs-card-pic{position:relative;width:100%;aspect-ratio:1;border-radius:50%;background:linear-gradient(160deg,#f7f4f4,#dcd5d5);display:grid;place-items:center;overflow:visible}
.bs-card-img{width:100%;height:100%;border-radius:50%;object-fit:cover}
.bs-add{position:absolute;top:6%;right:2%;width:34px;height:34px;border-radius:50%;background:#0b0b0b;color:#fff;display:grid;place-items:center;box-shadow:0 6px 14px rgba(0,0,0,.25)}
.bs-add svg{width:16px;height:16px}
.bs-dish{margin:14px 0 0;font-family:var(--bs-f-head);font-size:14px;font-weight:700}
.bs-dish-sub{margin:4px 0 0;font-size:10.5px;color:#7a7373}
.bs-price{display:block;margin-top:10px;font-size:13px;font-weight:700}
.bs-del{position:absolute;top:2px;left:2px;z-index:2;padding:4px 8px;border-radius:999px;background:var(--bs-red);color:#fff;font-size:9px}
.bs-new{display:grid;place-items:center;min-height:220px;border:2px dashed var(--bs-line);border-radius:18px;color:var(--bs-red);font-size:12px;font-weight:700}
.bs-empty{padding:30px;text-align:center;color:#7a7373;font-size:12px}
.bs-about{display:flex;flex-direction:column;gap:24px;margin-top:26px;padding:30px 0 10px;border-top:1px solid var(--bs-line)}
.bs-about p{max-width:48ch;margin:12px 0 0;font-size:12px;line-height:1.7;color:#6f6868}
.bs-visit{font-size:11px;line-height:1.8;color:#6f6868}
.bs-visit a{color:var(--bs-red);font-weight:700}
.bs-ov{position:fixed;inset:0;z-index:50;background:rgba(11,11,11,.5)}
.bs-drawer{position:absolute;top:0;right:0;bottom:0;width:min(400px,94vw);overflow:auto;background:var(--bs-paper);padding:20px 18px;box-shadow:-18px 0 50px rgba(0,0,0,.2)}
.bs-drawer-h{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.bs-drawer-h h3{margin:0;font-family:var(--bs-f-head);font-size:20px}
.bs-drawer-h button{font-size:24px;line-height:1}
.bs-line{display:flex;align-items:center;gap:8px;padding:10px 0;border-bottom:1px solid var(--bs-line);font-size:12px}
.bs-line>span:first-child{flex:1}
.bs-qty button{width:20px;height:20px;border:1px solid var(--bs-line);margin-right:3px}
.bs-total{display:flex;justify-content:space-between;margin:16px 0;font-size:14px;font-weight:700;color:var(--bs-red)}
.bs-form label{display:flex;flex-direction:column;gap:3px;margin-top:10px}
.bs-form label span{font-size:9px;font-weight:700;letter-spacing:.12em;color:#7a7373}
.bs-form input{border:0;border-bottom:1px solid var(--bs-line);background:transparent;padding:8px 0;font:inherit;font-size:13px;outline:none}
.bs-choices{display:flex;flex-direction:column;gap:6px;margin-top:12px}
.bs-choices button{text-align:left;font-size:11px;font-weight:600}
.bs-choices button.on{color:var(--bs-red)}
.bs-root .bs-send{width:100%;margin-top:18px;padding:15px;border-radius:999px;background:#000;color:#fff;font-size:12px;font-weight:800;letter-spacing:.08em;box-shadow:0 8px 22px rgba(0,0,0,.2)}
.bs-send:disabled{opacity:.45;cursor:not-allowed}
.bs-toast{position:fixed;left:50%;bottom:26px;transform:translateX(-50%);padding:10px 18px;border-radius:999px;background:var(--bs-ink);color:#fff;font-size:12px;font-weight:600;z-index:70}
.bs-root .rs-ed{outline:1px dashed var(--bs-line);outline-offset:2px;cursor:text}
.bs-root .rs-ed[data-active="true"]{outline-color:var(--bs-red)}
.bs-root .rs-ed-media{cursor:pointer;outline:1px dashed var(--bs-red)}
.bs-root :focus-visible{outline:2px solid var(--bs-red);outline-offset:2px}
@container (min-width:900px){
  .bs-frame{padding:0 40px 60px}
  .bs-nav{display:flex}
  .bs-hero{flex-direction:row;align-items:center;gap:48px;padding:50px 0 70px}
  .bs-copy{flex:1}.bs-visual{flex:0 0 48%;min-height:480px}
  .bs-plate{width:min(38vw,480px)}
  .bs-menu{padding:40px 0 30px}
  .bs-card{flex:0 0 220px}
  .bs-about{flex-direction:row;justify-content:space-between;gap:50px;padding:40px 0}
  .bs-about>div{flex:1}
}
@media (prefers-reduced-motion:reduce){.bs-root *{animation:none!important;transition:none!important}}
`
