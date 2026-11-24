/**
 * Tiny, real menu screens for the three hero phones.
 * Reads the stock template sample data (categories, items, prices, images)
 * so the phones show actual menu UI instead of decorative food photos.
 * No new assets, no external URLs — everything comes from template data.
 */
import { getTemplate } from '../../../templates/data/templates.ts'

type Props = { templateId: string; className?: string }

const money = (n: number) => `USD${n.toFixed(2)}`

export default function MiniMenuScreen({ templateId, className = '' }: Props) {
  const tpl = getTemplate(templateId)
  const items = tpl.sampleMenu?.[0]?.items || []
  const root = `h-full w-full overflow-hidden ${className}`

  if (templateId === 'caffe-brew') {
    const featured = items.find((i) => i.featured) || items[0]
    return (
      <div dir="ltr" className={`${root} bg-[#0b3b2c] text-white`}>
        <div className="px-2 pt-2 text-center sm:px-3 sm:pt-3">
          <div className="font-serif text-[8px] italic text-[#e9a23b] sm:text-[11px]">Our Menu</div>
          <div className="mt-1 text-[10px] font-extrabold leading-[1.05] tracking-[0.02em] sm:text-[15px]">
            YOUR FAVORITE BREWS AND BITES, ALL IN ONE MENU
          </div>
          <div className="mt-2 flex justify-center gap-1 sm:mt-3 sm:gap-1.5">
            <span className="rounded-full bg-[#e9a23b] px-2 py-[3px] text-[6px] font-bold text-[#0b3b2c] sm:px-3 sm:text-[8px]">All</span>
            {['Espresso', 'Italian', 'Drinks'].map((c) => (
              <span key={c} className="rounded-full border border-white/45 px-1.5 py-[3px] text-[6px] text-white/90 sm:px-2.5 sm:text-[8px]">{c}</span>
            ))}
          </div>
        </div>
        <div className="mx-2 mt-2 h-[86px] overflow-hidden rounded-[6px] sm:mx-3 sm:mt-3 sm:h-[130px] lg:h-[150px]">
          <img src={featured?.image} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="mx-2 mt-2 rounded-[7px] bg-white p-2 text-[#0b3b2c] sm:mx-3 sm:mt-3 sm:p-3">
          <div className="text-[7px] tracking-[0.18em] text-[#e9a23b] sm:text-[9px]">★★★★★</div>
          <div className="mt-1 text-[10px] font-bold sm:text-[14px]">{featured?.name}</div>
          <div className="mt-1 line-clamp-2 text-[6px] leading-[1.5] text-[#5d6a62] sm:text-[8px]">{featured?.description}</div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-[9px] font-extrabold sm:text-[12px]">{money(featured?.price || 0)}</span>
            <span className="rounded-full bg-[#0b3b2c] px-2 py-1 text-[6px] font-bold text-white sm:px-3 sm:text-[8px]">Add to cart</span>
          </div>
        </div>
        <div className="mx-2 mt-2 h-[52px] overflow-hidden rounded-[6px] sm:mx-3 sm:mt-3 sm:h-[80px]">
          <img src={tpl.previewImage} alt="" className="h-full w-full object-cover" />
        </div>
      </div>
    )
  }

  if (templateId === 'basta') {
    const dish = items[0]
    return (
      <div dir="ltr" className={`${root} bg-[#f2eae3] text-[#1a1714]`}>
        <div className="flex items-center justify-between px-2 pt-2 sm:px-3 sm:pt-3">
          <div className="font-serif text-[11px] font-bold tracking-tight sm:text-[17px]">
            <span className="text-[#e23b2e]">B</span>asta
          </div>
          <div className="flex items-center gap-1 text-[6px] font-semibold sm:gap-1.5 sm:text-[8px]">
            <span className="text-[9px] sm:text-[12px]">🛍</span> Order now
          </div>
        </div>
        <div className="mt-3 px-2 text-[15px] font-bold leading-[1.02] tracking-[-0.04em] sm:mt-5 sm:px-3 sm:text-[24px] lg:text-[28px]">
          it&apos;s not just Food, It&apos;s an Experience.
        </div>
        <div className="mt-2 flex items-center gap-1.5 px-2 sm:mt-3 sm:gap-2 sm:px-3">
          <span className="rounded-full bg-[#e23b2e] px-2.5 py-1 text-[6px] font-bold text-white sm:px-4 sm:text-[8px]">View menu</span>
          <span className="rounded-full border border-[#1a1714]/25 bg-white px-2.5 py-1 text-[6px] font-bold sm:px-4 sm:text-[8px]">Book a table</span>
        </div>
        <div className="mt-3 flex items-center gap-1 px-2 sm:mt-4 sm:gap-1.5 sm:px-3">
          <span className="text-[6px] font-bold sm:text-[8px]">Reviews</span>
          {['AM', 'SK', 'JD', '45+'].map((a) => (
            <span key={a} className="flex h-3 w-3 items-center justify-center rounded-full bg-[#3c4a3f] text-[4px] font-bold text-white sm:h-5 sm:w-5 sm:text-[6px]">{a}</span>
          ))}
          <span className="text-[6px] text-[#e9a23b] sm:text-[8px]">★★★★★</span>
        </div>
        <div className="relative mx-2 mt-2 h-[150px] overflow-hidden rounded-[8px] sm:mx-3 sm:mt-3 sm:h-[220px]">
          <img src={tpl.previewImage} alt="" className="h-full w-full object-cover" />
          <div className="absolute -bottom-2 -left-2 h-10 w-10 rounded-full sm:h-16 sm:w-16" style={{ background: `radial-gradient(circle at 40% 40%, rgba(255,255,255,.5), transparent 70%)` }} />
          <div className="absolute end-1 top-1 rounded bg-white/85 px-1.5 py-0.5 text-[5px] font-bold text-[#e23b2e] sm:text-[7px]">5% OFF</div>
        </div>
        <div className="mt-1 px-2 text-[6px] text-[#6d655d] sm:px-3 sm:text-[8px]">{dish?.name} · {money(dish?.price || 0)}</div>
      </div>
    )
  }

  // aurum-lounge (and fallback) — dark fine-dining menu
  const catNames = tpl.sampleMenu?.map((c) => c.name) || []
  return (
    <div dir="ltr" className={`${root} bg-[#101010] text-white`}>
      <div className="px-1.5 pt-2 sm:px-3 sm:pt-3">
        <div className="flex gap-1 overflow-hidden">
          <span className="shrink-0 rounded-full bg-[#e6c25a] px-2 py-[3px] text-[6px] font-bold text-[#101010] sm:px-3 sm:text-[8px]">🍿 All</span>
          {catNames.slice(0, 2).map((c) => (
            <span key={c} className="shrink-0 rounded-full border border-white/15 bg-[#1b1b1b] px-2 py-[3px] text-[6px] text-white/80 sm:px-3 sm:text-[8px]">🥗 {c}</span>
          ))}
        </div>
        <div className="mt-1.5 flex gap-1 overflow-hidden sm:mt-2">
          <span className="shrink-0 rounded-full bg-[#e6c25a] px-2 py-[3px] text-[6px] font-bold text-[#101010] sm:px-3 sm:text-[8px]">All items</span>
          {["★ Chef's special", 'Spicy', 'Veg'].map((c) => (
            <span key={c} className="shrink-0 rounded-full border border-white/15 bg-[#1b1b1b] px-2 py-[3px] text-[6px] text-white/75 sm:px-3 sm:text-[8px]">{c}</span>
          ))}
        </div>
        <div className="mt-3 font-serif text-[13px] font-bold sm:mt-5 sm:text-[20px]">{tpl.sampleMenu?.[0]?.name}</div>
      </div>
      <div className="mt-1.5 space-y-1.5 px-1.5 sm:mt-3 sm:space-y-2.5 sm:px-3">
        {items.slice(0, 3).map((item, i) => (
          <div key={item.id} className="flex gap-1.5 rounded-[8px] bg-[#1b1b1b] p-1.5 sm:gap-2.5 sm:rounded-[12px] sm:p-2.5">
            <img src={item.image} alt="" className="h-[52px] w-[52px] shrink-0 rounded-[5px] object-cover sm:h-[76px] sm:w-[76px] sm:rounded-[8px] lg:h-[88px] lg:w-[88px]" />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-1">
                <span className="text-[7px] font-bold leading-tight sm:text-[11px]">{item.name}</span>
                {item.featured || i === 1 ? <span className="text-[7px] text-[#e6c25a] sm:text-[10px]">★</span> : null}
              </div>
              <div className="mt-0.5 text-[5px] text-white/45 sm:text-[7px]">{item.allergens?.[0] || (item.isVeg ? 'Veg' : 'Chef')}</div>
              <div className="mt-0.5 line-clamp-2 text-[5px] leading-[1.45] text-white/55 sm:text-[7px]">{item.description}</div>
              <div className="mt-1 flex items-center justify-between gap-1">
                <span className="text-[7px] font-extrabold text-[#e6c25a] sm:text-[11px]">{money(item.price)}</span>
                <span className="flex h-4 w-4 items-center justify-center rounded-[4px] bg-[#e6c25a] text-[9px] font-bold text-[#101010] sm:h-6 sm:w-6 sm:rounded-[6px] sm:text-[13px]">+</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 border-t border-white/10 bg-[#0c0c0c] px-1.5 py-1.5 sm:px-3 sm:py-2.5">
        <div className="flex items-center gap-1.5 text-[5px] text-white/55 sm:gap-3 sm:text-[8px]">
          <span className="text-[#e6c25a]">🍽 Menu</span>
          <span>🔍 Search</span>
          <span>📞 Call</span>
        </div>
        <span className="rounded-full bg-white px-2 py-[3px] text-[5px] font-bold text-[#1a1714] sm:text-[8px]">← Digital Menu</span>
      </div>
    </div>
  )
}
