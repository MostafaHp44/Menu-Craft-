/**
 * BREWNI — reference-matched coffee-shop template.
 * Structure/editing contract is shared; the presentation is this design:
 * dark-green brand splash → green hero with polaroids → paper product grid →
 * green order menu with cards → About section. Cart + click-to-edit stay intact.
 */
import { useMemo, useState } from 'react'
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

export function CaffeBrewSite({
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
  const name = tx(restaurant.name) || 'BREWNI'
  const { t } = useI18n()
  const [cat, setCat] = useState('all')
  const [cart, setCart] = useState<Record<string, number>>({})
  const [cartOpen, setCartOpen] = useState(false)
  const [msg, setMsg] = useState('')
  const [custName, setCustName] = useState('')
  const [custPhone, setCustPhone] = useState('')
  const [place, setPlace] = useState<'counter' | 'table'>('counter')
  const [table, setTable] = useState('')

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
  const add = (id: string) =>
    interactive && setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }))
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
    '--cb-f-head': fontStack(restaurant.design?.typography?.heading || 'montserrat'),
    '--cb-f-body': fontStack(restaurant.design?.typography?.body || 'inter'),
    '--cb-f-script': fontStack('playfair'),
    '--cb-night': colors.background || '#031106',
    '--cb-green': colors.secondary || '#0B5D43',
    '--cb-amber': colors.accent || '#D18B34',
    '--cb-paper': colors.card || '#F3F3F3',
    '--cb-ink': colors.primary || '#031106',
    '--cb-olive': '#565943',
    '--cb-coral': '#E04E2E',
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
      c.items.push({ id: `item-${Date.now()}`, name: 'New drink', description: '', price: 0, compareAt: null, image: '', available: true, featured: false, popular: false })
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
      <div className="cb-root" data-mode={mode} style={vars}>
        <style>{CSS}</style>
        <div className="cb-shell">
          {/* ---------------------- brand splash ---------------------- */}
          <div className="cb-splash">
            <span className="cb-splash-deco cb-splash-deco-a" />
            <span className="cb-splash-deco cb-splash-deco-b" />
            <div className="cb-splash-in">
              <div className="cb-splash-brand">
                <Ed as="span" path="name" fallback={name} />
              </div>
              <Ed as="div" className="cb-splash-script" path="tagline" fallback={tx(restaurant.tagline) || 'Coffee Shop Template'} />
            </div>
          </div>

          {/* ------------------------- hero site ------------------------- */}
          <header className="cb-hero cb-tear">
            <div className="cb-hero-in">
              <nav className="cb-nav">
                <Ed as="span" className="cb-logo" path="logoText" fallback={tx(restaurant.logoText) || name.charAt(0)} />
                <div className="cb-navlinks"><a href="#cb-menu">HOME</a><a href="#cb-menu">PAGES ▾</a><a href="#cb-visit">LOCATION</a><a href="#cb-menu">MENU</a><a href="#cb-order">ORDER</a></div>
                <button className="cb-make" onClick={() => interactive && setCartOpen(true)}>{t('templateUi.makeOrder')}</button>
              </nav>
              <div className="cb-hero-body">
                <div className="cb-hero-copy">
                  <h1 className="cb-headline">
                    <Ed as="span" path="copy.brewni.hero.a" fallback="START " />
                    <Ed as="span" className="cb-gold" path="copy.brewni.hero.b" fallback="YOUR DAY" />
                    <Ed as="span" path="copy.brewni.hero.c" fallback=" RIGHT WITH FRESHLY BREWED COFFEE" />
                  </h1>
                  <Ed as="p" className="cb-lede" path="description" fallback={tx(restaurant.description) || ''} multiline />
                  <span className="cb-burst">GOOD<br />VIBES</span>
                  <a className="cb-see" href="#cb-menu">{t('templateUi.viewMenu')}</a>
                  <div className="cb-minis">
                    <span>✦<br />QUALITY<br />FIRST</span>
                    <span>✦<br />QUALITY<br />FIRST</span>
                    <span>☕<br />COFFEE<br />COMMUNITY</span>
                  </div>
                </div>
                <div className="cb-polaroids">
                  <div className="cb-pola cb-pola-back">
                    <EdImage path="heroImage" src={restaurant.heroImage || BLANK} alt="" className="cb-pola-img" />
                  </div>
                  <div className="cb-pola cb-pola-front">
                    <EdImage path="gallery.0" src={restaurant.gallery?.[0] || BLANK} alt="" className="cb-pola-img" />
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* ------------------------ products grid ----------------------- */}
          <section className="cb-products" id="cb-menu">
            <Ed as="span" className="cb-script-kicker" path="copy.brewni.menu.kicker" fallback="Coffee Category" />
            <Ed as="h2" className="cb-section-title" path="copy.brewni.menu.title" fallback="OUR COFFEE, YOUR EXPERIENCE" />
            <Ed as="span" className="cb-products-badge" path="copy.brewni.menu.badge" fallback="OUR PRODUCTS" />
            <div className="cb-tiles">
              {dishes.slice(0, 6).map((d) => {
                const { base } = paths(d)
                return (
                  <div className="cb-tile" key={d.id}>
                    <EdImage path={base ? `${base}.image` : ''} src={d.image || BLANK} alt={d.name} className="cb-tile-img" />
                    <Ed as="span" className="cb-tile-name" path={base ? `${base}.name` : ''} fallback={d.name} />
                  </div>
                )
              })}
              {editable && onMenuEdit ? (
                <button className="cb-tile cb-tile-add" type="button" onClick={() => addItem(0)}>
                  <span aria-hidden="true">＋</span> {t('templateUi.addDish', { defaultValue: 'Add product' })}
                </button>
              ) : null}
            </div>
          </section>

          {/* -------------------------- order menu ------------------------ */}
          <section className="cb-order cb-tear-top" id="cb-order">
            <span className="cb-script-kicker">Our Menu</span>
            <Ed as="h2" className="cb-order-title" path="copy.brewni.order.title" fallback="YOUR FAVORITE BREWS AND BITES, ALL IN ONE MENU" />
            <div className="cb-tabs" role="group" aria-label="Categories">
              {[{ id: 'all', name: 'All' }, ...menu].map((c) => (
                <button key={c.id} className={`cb-tab${cat === c.id ? ' on' : ''}`} onClick={() => interactive && setCat(c.id)}>{c.name}</button>
              ))}
              {editable && onMenuEdit ? (
                <button className="cb-tab cb-tab-add" onClick={addCategory}>+ new section</button>
              ) : null}
            </div>
            <div className="cb-cards">
              {list.map((d) => {
                const { base, canEdit, ci, ii } = paths(d)
                return (
                  <article className="cb-card" key={d.id}>
                    {canEdit ? (
                      <button
                        className="cb-card-del" aria-label="Delete item"
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
                    <EdImage path={base ? `${base}.image` : ''} src={d.image || BLANK} alt={d.name} className="cb-card-img" />
                    <div className="cb-card-body">
                      <span className="cb-stars">★★★★★</span>
                      <Ed as="h3" className="cb-card-name" path={base ? `${base}.name` : ''} fallback={d.name} />
                      <Ed as="p" className="cb-card-desc" path={base ? `${base}.description` : ''} fallback={d.description} multiline />
                      <div className="cb-card-foot">
                        <Ed as="b" className="cb-card-price" numeric path={base ? `${base}.price` : ''} fallback={String(d.price)} format={(raw) => money(Number(raw) || 0)} />
                        <button className="cb-card-add" onClick={() => add(d.id)} aria-label={t('templateUi.addToDish')} title={t('templateUi.addToDish')}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M3 4h2l2.2 10.4a1.6 1.6 0 0 0 1.6 1.3h8.6a1.6 1.6 0 0 0 1.6-1.3L20 8H6" />
                            <circle cx="10" cy="20" r="1.3" /><circle cx="17.5" cy="20" r="1.3" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
              {editable && onMenuEdit && cat !== 'all' ? (
                <button className="cb-card-new" onClick={() => addItem(menu.findIndex((c) => c.id === cat))}>+ add item</button>
              ) : null}
            </div>
            {!list.length ? <div className="cb-none">No drinks in this section yet.</div> : null}
          </section>

          {/* --------------------------- about ---------------------------- */}
          <section className="cb-about" id="cb-visit">
            <span className="cb-script-kicker">About Us</span>
            <Ed as="h2" className="cb-about-title" path="copy.brewni.story.title" fallback="THE HEART BEHIND EVERY BREW EXPERIENCE" />
            <div className="cb-features">
              <div><span>✦</span><b>{t('templateUi.specialtyCoffee')}</b><Ed as="p" path="description" fallback={tx(restaurant.description) || ''} /></div>
              <div className="cb-feature-photo"><EdImage path="heroImage" src={restaurant.heroImage || BLANK} alt="" /></div>
              <div><span>✦</span><b>{t('templateUi.bakedGoods')}</b><p>Baked fresh daily with love and care — taste the homeliness within every bite.</p></div>
              <div><span>✦</span><b>{t('templateUi.cozy')}</b><p>Warm corners, soft light and a place that feels like yours.</p></div>
              <div><span>✦</span><b>{t('templateUi.baristas')}</b><p>Craft and character in every cup, poured by people who care.</p></div>
            </div>
            <div className="cb-visit">
              <Ed as="p" path="address" fallback={restaurant.address} />
              <Ed as="p" path="hours.0.hours" fallback={restaurant.hours?.[0]?.hours || ''} />
              {restaurant.phone ? <a href={`tel:${restaurant.phone.replace(/[^\d+]/g, '')}`}>{restaurant.phone}</a> : null}
            </div>
          </section>
        </div>

        {/* ------------------------- floating cart ------------------------ */}
        <button className="cb-cart" onClick={() => interactive && setCartOpen(true)} aria-label={t('templateUi.cart')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 8h12l1 13H5zM9 8a3 3 0 0 1 6 0" /></svg>
          <span>{money(total)}</span>
          <i>{count}</i>
        </button>

        {cartOpen ? (
          <div className="cb-ov" onClick={() => setCartOpen(false)}>
            <div className="cb-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Cart">
              <div className="cb-sheet-h"><h3>{t('templateUi.yourOrder')}</h3><button onClick={() => setCartOpen(false)} aria-label="Close cart">×</button></div>
              {!count ? (
                <div className="cb-none">{t('templateUi.cartEmpty')}<br />{t('templateUi.cartEmptySub')}</div>
              ) : (
                <>
                  {Object.entries(cart).map(([id, n]) => (
                    <div className="cb-line" key={id}>
                      <span>{byId[id]?.name}</span>
                      <span className="cb-qty">
                        <button onClick={() => step(id, -1)} aria-label="Remove one">−</button>{n}
                        <button onClick={() => step(id, 1)} aria-label="Add one">+</button>
                      </span>
                      <b>{money((byId[id]?.price || 0) * n)}</b>
                    </div>
                  ))}
                  <div className="cb-total"><span>{t('templateUi.total')}</span><b>{money(total)}</b></div>
                  <div className="cb-form">
                    <div className="cb-choices">
                      <button className={place === 'counter' ? 'on' : ''} onClick={() => setPlace('counter')}>({t('templateUi.counter')}</button>
                      <button className={place === 'table' ? 'on' : ''} onClick={() => setPlace('table')}>({t('templateUi.table')}</button>
                    </div>
                    {place === 'table' ? <label><span>{t('templateUi.tableNo')}</span><input value={table} onChange={(e) => setTable(e.target.value)} placeholder="Table no." /></label> : null}
                    <label><span>{t('templateUi.name')}</span><input value={custName} onChange={(e) => setCustName(e.target.value)} placeholder="Your name" /></label>
                    <label><span>{t('templateUi.phone')}</span><input value={custPhone} onChange={(e) => setCustPhone(e.target.value)} placeholder="+44 …" inputMode="tel" /></label>
                  </div>
                  <button
                    className="cb-send"
                    disabled={!custName.trim() || !custPhone.trim() || (place === 'table' && !table.trim())}
                    onClick={() => { setCart({}); setCartOpen(false); toast(t('templateUi.orderSent')) }}
                  >
                    {t('templateUi.placeOrder')} · {money(total)}
                  </button>
                </>
              )}
            </div>
          </div>
        ) : null}
        {msg ? <div className="cb-toast" role="status">{msg}</div> : null}
      </div>
    </InlineEditProvider>
  )
}

export default CaffeBrewSite

const CSS = `
.cb-root{width:100%;max-width:none;margin:0;min-height:100vh;background:var(--cb-night);color:var(--cb-paper);font-family:var(--cb-f-body);position:relative;overflow-x:clip;padding-bottom:0}
.cb-root[data-mode="preview"]{min-height:100%}
.cb-shell{container-type:inline-size;width:100%}
.cb-root *{box-sizing:border-box}
.cb-root button{font:inherit;color:inherit;border:0;background:none;cursor:pointer;padding:0}
.cb-root a{color:inherit;text-decoration:none}
.cb-splash{position:relative;overflow:hidden;background:var(--cb-night);padding:26px 16px 16px}
.cb-splash::before{content:"";position:absolute;inset:0;background:radial-gradient(60% 80% at 85% 20%,rgba(11,93,67,.5),transparent 70%),radial-gradient(50% 60% at 5% 90%,rgba(31,71,52,.4),transparent 70%)}
.cb-splash-deco{position:absolute;border:3px solid rgba(80,130,100,.35);border-radius:50%}
.cb-splash-deco-a{width:300px;height:300px;top:-120px;right:-60px}
.cb-splash-deco-b{width:200px;height:200px;bottom:-110px;left:-50px}
.cb-splash-in{position:relative}
.cb-splash-brand{display:flex;align-items:center;gap:14px}
.cb-splash-brand>span:first-child{font-family:var(--cb-f-head);font-weight:800;font-size:clamp(34px,8vw,72px);letter-spacing:.04em;line-height:1}
.cb-shapes{display:flex;align-items:center;gap:4px}
.cb-shape-arrow{width:26px;height:30px;background:linear-gradient(135deg,#2f80ed 50%,#56ccf2 50%);clip-path:polygon(0 0,100% 0,100% 40%,40% 40%,40% 100%,0 100%)}
.cb-shape-dots{width:26px;height:30px;background:radial-gradient(circle at 25% 25%,#f2c94c 22%,transparent 23%),radial-gradient(circle at 75% 25%,#eb5757 22%,transparent 23%),radial-gradient(circle at 25% 75%,#27ae60 22%,transparent 23%),radial-gradient(circle at 75% 75%,#9b51e0 22%,transparent 23%)}
.cb-splash-script{margin-top:4px;font-family:var(--cb-f-script);font-style:italic;font-size:clamp(26px,7vw,58px);color:var(--cb-amber)}
.cb-hero{position:relative;background:var(--cb-green);padding:0 0 20px}
.cb-tear::after,.cb-tear-top::before{content:"";position:absolute;left:0;right:0;height:14px;background:inherit;clip-path:polygon(0 60%,4% 20%,8% 70%,12% 30%,16% 80%,20% 25%,24% 65%,28% 15%,32% 75%,36% 35%,40% 85%,44% 20%,48% 60%,52% 25%,56% 75%,60% 30%,64% 80%,68% 20%,72% 65%,76% 25%,80% 75%,84% 30%,88% 70%,92% 20%,96% 65%,100% 35%,100% 100%,0 100%)}
.cb-tear::after{bottom:-13px}
.cb-tear-top::before{top:-13px;transform:rotate(180deg);background:var(--cb-paper)}
.cb-hero-in{max-width:1120px;margin:0 auto;padding:10px 16px 26px}
.cb-nav{display:flex;align-items:center;gap:12px;padding:10px 0 14px}
.cb-logo{font-family:var(--cb-f-head);font-weight:800;font-size:14px;letter-spacing:.16em}
.cb-navlinks{display:none;gap:16px;margin-left:auto;font-size:8px;font-weight:700;letter-spacing:.1em;color:rgba(243,243,243,.8)}
.cb-make{margin-left:auto;padding:9px 14px;border-radius:999px;background:var(--cb-amber);color:#1a1405;font-size:9px;font-weight:800;letter-spacing:.08em;white-space:nowrap}
.cb-hero-body{display:flex;flex-direction:column;gap:26px;margin-top:22px}
.cb-hero-copy{position:relative}
.cb-headline{margin:0;font-family:var(--cb-f-head);font-weight:800;font-size:clamp(28px,6vw,58px);line-height:1.05;max-width:14ch}
.cb-headline::first-line{color:var(--cb-paper)}
.cb-gold{color:var(--cb-amber)}
.cb-lede{max-width:38ch;margin:14px 0 0;font-size:11px;line-height:1.6;color:rgba(243,243,243,.75)}
.cb-burst{position:absolute;top:8px;right:6px;width:66px;height:66px;display:grid;place-items:center;text-align:center;font-size:9px;font-weight:800;line-height:1.2;color:#fff;background:var(--cb-coral);clip-path:polygon(50% 0,61% 12%,76% 5%,79% 22%,95% 22%,91% 38%,100% 50%,91% 62%,95% 78%,79% 78%,76% 95%,61% 88%,50% 100%,39% 88%,24% 95%,21% 78%,5% 78%,9% 62%,0 50%,9% 38%,5% 22%,21% 22%,24% 5%,39% 12%)}
.cb-see{display:inline-flex;margin-top:20px;padding:9px 16px;border-radius:999px;background:var(--cb-coral);color:#fff;font-size:9px;font-weight:800;letter-spacing:.1em}
.cb-minis{display:flex;gap:10px;margin-top:26px}
.cb-minis span{display:grid;place-items:center;min-width:58px;height:58px;border:1px solid rgba(243,243,243,.2);font-size:7px;font-weight:700;letter-spacing:.04em;line-height:1.2;text-align:center}
.cb-minis span::first-letter{font-size:14px}
.cb-polaroids{position:relative;height:300px}
.cb-pola{position:absolute;background:#fff;padding:6px 6px 20px;box-shadow:0 14px 30px rgba(0,0,0,.35)}
.cb-pola-back{width:62%;right:2%;top:0;transform:rotate(7deg)}
.cb-pola-front{width:58%;left:4%;bottom:0;transform:rotate(-9deg)}
.cb-pola-img{display:block;width:100%;height:100%;max-height:210px;object-fit:cover}
.cb-products{background:var(--cb-paper);color:var(--cb-ink);padding:30px 16px 40px;text-align:center}
.cb-script-kicker{font-family:var(--cb-f-script);font-style:italic;font-size:13px;color:var(--cb-coral)}
.cb-section-title{margin:6px 0 0;font-family:var(--cb-f-head);font-weight:800;font-size:clamp(20px,4vw,32px);line-height:1.08;color:var(--cb-green)}
.cb-products-badge{display:inline-block;margin-top:14px;padding:8px 14px;border-radius:999px;background:var(--cb-green);color:#fff;font-size:9px;font-weight:800;letter-spacing:.08em}
.cb-tiles{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:22px;max-width:1040px;margin-inline:auto}
.cb-tile{background:#e9e9e6;padding:10px 6px 12px;border-radius:2px}
.cb-tile-img{display:block;width:100%;height:110px;object-fit:contain;mix-blend-mode:multiply}
.cb-tile-name{display:block;margin-top:8px;font-size:11px;font-weight:800;letter-spacing:.08em;color:var(--cb-green)}
.cb-order{position:relative;background:var(--cb-green);color:var(--cb-paper);padding:34px 16px 44px;text-align:center}
.cb-order-title{margin:6px auto 0;max-width:22ch;font-family:var(--cb-f-head);font-weight:800;font-size:clamp(20px,4vw,32px);line-height:1.08}
.cb-tabs{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:20px 0 24px}
.cb-tabs{gap:10px;margin:22px 0 26px}
.cb-root .cb-tab{padding:12px 22px;border-radius:999px;border:1px solid rgba(243,243,243,.35)!important;font-size:12px;font-weight:700;letter-spacing:.02em;line-height:1}
.cb-tab.on{background:var(--cb-amber);border-color:var(--cb-amber)!important;color:#1a1405}
.cb-tab-add{border-style:dashed!important;color:var(--cb-amber)}
.cb-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px;max-width:1040px;margin:0 auto}
.cb-card{position:relative;overflow:hidden;background:#fff;color:var(--cb-ink);text-align:left;border-radius:4px}
.cb-card-img{display:block;width:100%;height:170px;object-fit:cover}
.cb-card-body{padding:12px}
.cb-stars{font-size:10px;letter-spacing:.1em;color:var(--cb-amber)}
.cb-card-name{margin:6px 0 0;font-family:var(--cb-f-head);font-size:12px;font-weight:800;letter-spacing:.06em;color:var(--cb-green)}
.cb-card-desc{margin:6px 0 0;font-size:10.5px;line-height:1.5;color:#6b6b6b}
.cb-card-foot{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:12px}
.cb-card-price{font-size:13px;font-weight:800;color:var(--cb-green)}
.cb-root .cb-card-add{display:grid;place-items:center;width:40px;height:40px;flex:0 0 40px;padding:0;border-radius:999px;background:var(--cb-amber);color:#1a1405;box-shadow:0 6px 16px rgba(0,0,0,.18);transition:transform .18s ease,filter .18s ease}
.cb-card-add:hover{transform:scale(1.08);filter:brightness(1.06)}
.cb-card-add svg{width:20px;height:20px}
.cb-root .cb-tile-add{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;min-height:150px;border:2px dashed rgba(11,93,67,.4);background:transparent;color:var(--cb-green);font-size:12px;font-weight:800;cursor:pointer}
.cb-tile-add span{font-size:24px;line-height:1}
.cb-card-del{position:absolute;top:8px;right:8px;z-index:2;padding:4px 8px;background:rgba(224,78,46,.9);color:#fff;font-size:9px}
.cb-card-new{min-height:120px;border:2px dashed rgba(243,243,243,.35);font-size:11px;font-weight:700;color:var(--cb-amber)}
.cb-none{padding:24px;text-align:center;color:var(--cb-paper);font-size:12px}
.cb-about{background:var(--cb-paper);color:var(--cb-ink);padding:34px 16px 50px;text-align:center}
.cb-about-title{margin:6px auto 24px;max-width:22ch;font-family:var(--cb-f-head);font-weight:800;font-size:clamp(20px,4vw,32px);line-height:1.1;color:var(--cb-green)}
.cb-features{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;max-width:1040px;margin:0 auto;text-align:left}
.cb-features>div{padding:14px;background:#e9e9e6}
.cb-features span{color:var(--cb-green);font-size:18px}
.cb-features b{display:block;margin-top:6px;font-size:10px;font-weight:800;letter-spacing:.06em;color:var(--cb-green)}
.cb-features p{margin:6px 0 0;font-size:10px;line-height:1.5;color:#6b6b6b}
.cb-feature-photo{padding:0!important;min-height:150px}
.cb-feature-photo img{width:100%;height:100%;object-fit:cover}
.cb-visit{margin-top:24px;font-size:11px;line-height:1.8;color:var(--cb-olive)}
.cb-visit a{color:var(--cb-coral);font-weight:700}
.cb-cart{position:fixed;right:14px;bottom:14px;z-index:30;display:flex;align-items:center;gap:8px;padding:11px 16px;border-radius:999px;background:var(--cb-amber);color:#1a1405;font-size:12px;font-weight:800;box-shadow:0 10px 30px rgba(0,0,0,.35)}
.cb-cart svg{width:17px;height:17px}
.cb-cart i{display:grid;place-items:center;min-width:19px;height:19px;border-radius:50%;background:var(--cb-night);color:#fff;font-size:10px;font-style:normal}
.cb-ov{position:fixed;inset:0;z-index:50;background:rgba(0,0,0,.6)}
.cb-sheet{position:absolute;left:50%;bottom:0;transform:translateX(-50%);width:100%;max-width:460px;max-height:86vh;overflow:auto;background:var(--cb-paper);color:var(--cb-ink);border-radius:18px 18px 0 0;padding:18px 16px}
.cb-sheet-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
.cb-sheet-h h3{margin:0;font-family:var(--cb-f-head);font-size:17px;color:var(--cb-green)}
.cb-sheet-h button{font-size:22px;line-height:1}
.cb-line{display:flex;align-items:center;gap:8px;padding:9px 0;border-bottom:1px solid rgba(3,17,6,.12);font-size:12px}
.cb-line>span:first-child{flex:1}
.cb-qty button{width:20px;height:20px;border:1px solid rgba(3,17,6,.25);margin-right:3px}
.cb-total{display:flex;justify-content:space-between;margin:14px 0;font-weight:800;color:var(--cb-green)}
.cb-form label{display:flex;flex-direction:column;gap:3px;margin-top:10px}
.cb-form label span{font-size:9px;font-weight:800;letter-spacing:.12em;color:var(--cb-olive)}
.cb-form input{border:0;border-bottom:1px solid rgba(3,17,6,.3);background:transparent;padding:7px 0;font:inherit;font-size:13px;outline:none}
.cb-choices{display:flex;flex-direction:column;gap:6px;margin-top:10px}
.cb-choices button{text-align:left;font-size:10px;font-weight:700;letter-spacing:.08em}
.cb-choices button.on{color:var(--cb-coral)}
.cb-send{width:100%;margin-top:16px;padding:13px;border-radius:999px;background:var(--cb-amber);color:#1a1405;font-size:11px;font-weight:800;letter-spacing:.08em}
.cb-send:disabled{opacity:.45;cursor:not-allowed}
.cb-toast{position:fixed;left:50%;bottom:74px;transform:translateX(-50%);padding:9px 16px;background:#fff;color:var(--cb-ink);border-radius:999px;font-size:12px;font-weight:700;z-index:70}
.cb-root .rs-ed{outline:1px dashed var(--cb-olive);outline-offset:2px;cursor:text}
.cb-root .rs-ed[data-active="true"]{outline-color:var(--cb-amber)}
.cb-root .rs-ed-media{cursor:pointer;outline:1px dashed var(--cb-amber)}
.cb-root :focus-visible{outline:2px solid var(--cb-amber);outline-offset:2px}
@container (min-width:900px){
  .cb-splash{padding:40px 44px 26px}
  .cb-hero-in{padding:14px 44px 50px}
  .cb-navlinks{display:flex}
  .cb-make{margin-left:24px}
  .cb-hero-body{flex-direction:row;align-items:center;gap:60px;margin-top:50px}
  .cb-hero-copy{flex:1}.cb-polaroids{flex:0 0 42%;height:360px}
  .cb-pola-img{max-height:270px}
  .cb-products{padding:50px 44px 60px}
  .cb-tiles{grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
  .cb-tile-img{height:170px}
  .cb-order{padding:50px 44px 60px}
  .cb-about{padding:50px 44px 60px}
  .cb-features{grid-template-columns:repeat(3,minmax(0,1fr))}
}
@media (prefers-reduced-motion:reduce){.cb-root *{animation:none!important;transition:none!important}}
`
