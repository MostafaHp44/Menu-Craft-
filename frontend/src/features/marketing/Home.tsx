import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { BrowserFrame, PhoneFrame, ScaledFrame } from '../../shared/ui/ScaledFrame.tsx'
import { Icon } from '../../shared/ui/icons.tsx'
import { MarketingFooter } from '../../shared/chrome/MarketingFooter.tsx'
import { MarketingHeader } from '../../shared/chrome/MarketingHeader.tsx'
import { RestaurantSite } from '../../templates/site/RestaurantSite.tsx'
import { Badge, Button, SectionHeading, Sparkline } from '../../shared/ui/ui.tsx'
import { PLANS } from '../../shared/lib/demoData.ts'
import { useCustomize } from '../../shared/lib/hooks.ts'
import { PALETTE_PRESETS } from '../../templates/data/palettes.ts'
import { TEMPLATES } from '../../templates/data/templates.ts'
import type { ColorSet, FontId } from '../../shared/lib/types.ts'
import { cx } from '../../shared/lib/utils.ts'
import type { Restaurant } from '../../shared/lib/types.ts'
import { useActiveRestaurant } from '../../shared/store/useStore.ts'

export default function Home() {
  const restaurant = useActiveRestaurant()
  const customize = useCustomize()

  return (
    <div className="min-h-screen bg-ivory">
      <MarketingHeader />
      <Hero restaurant={restaurant} />
      <FeaturedTemplates onCustomize={customize} />
      <EditorShowcase restaurant={restaurant} />
      <Workflow onCustomize={customize} />
      <FeatureHighlights />
      <ResponsiveShowcase restaurant={restaurant} />
      <Pricing onCustomize={customize} />
      <FinalCta />
      <MarketingFooter />
    </div>
  )
}

/* ---------------------------------- hero ---------------------------------- */

function Hero({ restaurant }: { restaurant: Restaurant }) {
  return (
    <section className="relative overflow-hidden pb-28 pt-[118px] lg:pt-[142px]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[760px] bg-[radial-gradient(ellipse_at_top,rgba(232,87,31,0.14),transparent_62%)]"
      />
      <div aria-hidden="true" className="grid-lines pointer-events-none absolute inset-0 opacity-70" />

      <div className="page relative">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-sand bg-paper px-3.5 py-1.5 text-[12.5px] font-medium text-espresso shadow-[0_10px_24px_-20px_rgba(27,23,20,0.8)]">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-flame text-white">
              <Icon name="sparkles" size={11} strokeWidth={2.2} />
            </span>
            The digital menu builder for food businesses
          </span>

          <h1 className="display-serif mt-7 text-[clamp(40px,6.6vw,82px)] leading-[1.03] text-charcoal">
            Your Restaurant Menu.
            <br />
            Your Brand. <span className="text-flame">Your Rules.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-[17px] leading-relaxed text-espresso/85">
            Create a beautiful digital menu for your restaurant, cafe, or bakery. Choose your
            design, customize every detail, and share your menu with the world — no coding
            required.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button to="/templates" size="lg" icon="arrowRight">
              Explore Templates
            </Button>
            <Button to="/dashboard/editor" size="lg" variant="outline" icon="layout">
              Explore the Editor
            </Button>
          </div>

          <ul className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13.5px] text-umber">
            {['No coding required', '8 designer templates', 'Publish in minutes'].map((point) => (
              <li key={point} className="flex items-center gap-1.5">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-moss/12 text-moss">
                  <Icon name="check" size={11} strokeWidth={3} />
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        {/* ------------------------- product composition ------------------------ */}
        <div className="relative mx-auto mt-14 w-full max-w-[1100px] lg:mt-16">
          <BrowserFrame url="bella.menucraft.com" badge="Live demo">
            <ScaledFrame width={1440} maxHeight={540}>
              <RestaurantSite
                restaurant={restaurant}
                interactive={false}
                mode="preview"
                idPrefix="hero-"
              />
            </ScaledFrame>
          </BrowserFrame>

          {/* floating analytics card */}
          <div className="absolute -start-6 top-8 hidden w-[196px] rounded-2xl border border-sand bg-paper p-3.5 shadow-[0_30px_60px_-40px_rgba(15,13,11,0.8)] lg:block xl:-start-14">
            <div className="flex items-center justify-between">
              <span className="text-[11.5px] font-medium text-umber">Menu views</span>
              <Badge tone="moss" icon="trendUp">
                +18%
              </Badge>
            </div>
            <div className="mt-1 text-[22px] font-semibold tracking-[-0.02em] text-charcoal">
              12,480
            </div>
            <div className="mt-1 text-flame">
              <Sparkline values={restaurant.stats.trend} />
            </div>
          </div>

          {/* floating QR card */}
          <div className="absolute -start-4 bottom-6 hidden w-[218px] rounded-2xl border border-sand bg-paper p-3.5 shadow-[0_30px_60px_-40px_rgba(15,13,11,0.8)] lg:block xl:-start-12">
            <div className="flex items-center gap-3">
              <span className="rounded-lg border border-sand bg-white p-1.5">
                <QRCodeSVG value={`https://${restaurant.slug}.menucraft.com`} size={54} level="M" />
              </span>
              <span className="min-w-0">
                <span className="block text-[12.5px] font-semibold text-charcoal">Table QR ready</span>
                <span className="line-clamp-1 text-[11.5px] text-umber">
                  {restaurant.slug}.menucraft.com
                </span>
                <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-moss">
                  <span className="h-1.5 w-1.5 rounded-full bg-moss anim-pulse-dot" />
                  1,284 scans
                </span>
              </span>
            </div>
          </div>

          {/* phone preview */}
          <div className="absolute -bottom-16 -end-6 hidden w-[252px] xl:block">
            <PhoneFrame width={252} screen={476}>
              <ScaledFrame width={390} maxHeight={476}>
                <RestaurantSite
                  restaurant={restaurant}
                  interactive={false}
                  mode="preview"
                  idPrefix="herophone-"
                />
              </ScaledFrame>
            </PhoneFrame>
          </div>
        </div>

        <p className="mt-14 text-center text-[13px] text-clay xl:mt-24">
          A real MenuCraft preview — the same renderer that powers the editor and the published site.
        </p>
      </div>
    </section>
  )
}

/* ---------------------------- featured templates --------------------------- */

function FeaturedTemplates({ onCustomize }: { onCustomize: (id: string) => void }) {
  const featured = TEMPLATES.filter((t) => t.featured).slice(0, 3)

  return (
    <section className="border-t border-sand bg-paper py-20 lg:py-28" id="templates">
      <div className="page">
        <SectionHeading
          eyebrow="Template marketplace"
          title={
            <>
              Designs that already look{' '}
              <span className="italic text-flame">finished</span>
            </>
          }
          description="Every template is a complete restaurant website: its own typography, palette, header, hero and menu style. Start from one, then change anything."
        />

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {featured.map((template) => (
            <article
              key={template.id}
              className="group flex flex-col overflow-hidden rounded-3xl border border-sand bg-ivory transition duration-300 hover:border-clay hover:shadow-[0_40px_80px_-56px_rgba(15,13,11,0.9)]"
            >
              <Link to={`/templates/${template.id}`} className="relative block aspect-[4/3] overflow-hidden">
                <img
                  src={template.previewImage}
                  alt={`${template.name} preview`}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.06]"
                />
                <span className="absolute start-4 top-4 flex gap-1.5 rounded-full bg-ink/65 px-2.5 py-1.5 backdrop-blur-sm">
                  {template.chips.map((chip) => (
                    <span
                      key={chip}
                      className="h-3.5 w-3.5 rounded-full border border-white/40"
                      style={{ backgroundColor: chip }}
                    />
                  ))}
                </span>
                <span className="absolute inset-x-4 bottom-4 flex justify-center opacity-0 transition duration-300 group-hover:opacity-100">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-paper px-3.5 py-1.5 text-[12.5px] font-semibold text-charcoal">
                    <Icon name="eye" size={14} />
                    Preview template
                  </span>
                </span>
              </Link>

              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="eyebrow">{template.category}</span>
                    <h3 className="display-serif mt-1.5 text-[24px] leading-none text-charcoal">
                      {template.name}
                    </h3>
                  </div>
                  <Badge tone="outline">{template.personality.split(' · ')[0]}</Badge>
                </div>

                <p className="mt-3 flex-1 text-[14.5px] leading-relaxed text-umber">
                  {template.tagline}
                </p>

                <div className="mt-5 flex items-center gap-2">
                  <Button
                    to={`/templates/${template.id}`}
                    size="sm"
                    variant="outline"
                    icon="eye"
                    className="flex-1"
                  >
                    Preview
                  </Button>
                  <Button size="sm" onClick={() => onCustomize(template.id)} className="flex-1">
                    Customize
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Button to="/templates" size="lg" variant="outline" icon="grid" iconRight="arrowRight">
            Browse all 8 templates
          </Button>
        </div>
      </div>
    </section>
  )
}

/* ----------------------------- editor showcase ----------------------------- */

const SHOWCASE_PALETTES: ColorSet[] = [
  PALETTE_PRESETS[0].colors,
  PALETTE_PRESETS[1].colors,
  PALETTE_PRESETS[3].colors,
]

const SHOWCASE_PALETTE_NAMES = ['Ivory & Flame', 'Midnight & Gold', 'Olive Garden']

function EditorShowcase({ restaurant }: { restaurant: Restaurant }) {
  const [palette, setPalette] = useState(0)
  const [headingFont, setHeadingFont] = useState<FontId>('playfair')
  const [menuLayout, setMenuLayout] = useState<'grid' | 'list'>('list')

  const preview = useMemo(() => {
    const next = structuredClone(restaurant)
    next.design.colors = { ...next.design.colors, ...SHOWCASE_PALETTES[palette] }
    next.design.typography.heading = headingFont
    next.design.layout.menuLayout = menuLayout
    return next
  }, [restaurant, palette, headingFont, menuLayout])

  return (
    <section className="relative overflow-hidden bg-ink py-20 text-ivory lg:py-28" id="features">
      <div className="page">
        <div className="grid items-center gap-12 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <span className="eyebrow text-ivory/50">The visual editor</span>
            <h2 className="display-serif mt-4 text-[clamp(30px,4vw,48px)] leading-[1.06]">
              Change it and watch it happen.
            </h2>
            <p className="mt-5 text-[16px] leading-relaxed text-ivory/65">
              Colors, fonts, layout, menu content — every control in the MenuCraft editor writes to
              the live preview as you type. No preview button, no page reload, no guessing.
            </p>

            <div className="mt-8 space-y-6">
              <div>
                <div className="mb-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-ivory/45">
                  Palette
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {SHOWCASE_PALETTE_NAMES.map((name, index) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setPalette(index)}
                      aria-pressed={palette === index}
                      className={cx(
                        'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[13px] font-medium transition',
                        palette === index
                          ? 'border-flame bg-flame/12 text-ivory'
                          : 'border-ivory/15 text-ivory/65 hover:border-ivory/35 hover:text-ivory'
                      )}
                    >
                      <span className="flex">
                        {SHOWCASE_PALETTES[index].accent === SHOWCASE_PALETTES[index].background ? null : (
                          <span
                            className="h-4 w-4 rounded-full border border-white/25"
                            style={{ backgroundColor: SHOWCASE_PALETTES[index].accent }}
                          />
                        )}
                        <span
                          className="-ms-1.5 h-4 w-4 rounded-full border border-white/25"
                          style={{ backgroundColor: SHOWCASE_PALETTES[index].background }}
                        />
                      </span>
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-ivory/45">
                  Heading font
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {(['playfair', 'inter', 'montserrat'] as FontId[]).map((font) => (
                    <button
                      key={font}
                      type="button"
                      onClick={() => setHeadingFont(font)}
                      aria-pressed={headingFont === font}
                      className={cx(
                        'rounded-xl border px-4 py-2.5 text-[15px] transition',
                        headingFont === font
                          ? 'border-flame bg-flame/12 text-ivory'
                          : 'border-ivory/15 text-ivory/65 hover:border-ivory/35 hover:text-ivory'
                      )}
                      style={{
                        fontFamily:
                          font === 'playfair'
                            ? '"Playfair Display", serif'
                            : font === 'montserrat'
                              ? 'Montserrat, sans-serif'
                              : '"Inter", sans-serif',
                      }}
                    >
                      Aa
                      <span className="ms-2 text-[12.5px] opacity-70">
                        {font === 'playfair' ? 'Playfair' : font === 'montserrat' ? 'Montserrat' : 'Inter'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-ivory/45">
                  Menu layout
                </div>
                <div className="inline-flex rounded-full border border-ivory/15 p-1">
                  {(['grid', 'list'] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setMenuLayout(option)}
                      aria-pressed={menuLayout === option}
                      className={cx(
                        'inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-medium capitalize transition',
                        menuLayout === option
                          ? 'bg-ivory text-charcoal'
                          : 'text-ivory/60 hover:text-ivory'
                      )}
                    >
                      <Icon name={option === 'grid' ? 'grid' : 'list'} size={14} />
                      {option} menu
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-9 flex flex-wrap gap-3">
              <Button to="/dashboard/editor" variant="accent" icon="arrowRight">
                Open the full editor
              </Button>
              <Button to="/templates" variant="light">
                See all templates
              </Button>
            </div>
          </div>

          <div className="relative">
            <BrowserFrame url={`${restaurant.slug}.menucraft.com/preview`} badge="Live preview">
              <ScaledFrame width={1440} maxHeight={560}>
                <RestaurantSite
                  restaurant={preview}
                  interactive={false}
                  mode="preview"
                  idPrefix="showcase-"
                />
              </ScaledFrame>
            </BrowserFrame>
            <div className="absolute -bottom-5 start-6 hidden rounded-full border border-ivory/15 bg-smoke px-3.5 py-2 text-[12px] text-ivory/70 shadow-xl sm:block">
              <span className="flex items-center gap-2">
                <Icon name="sparkles" size={13} className="text-flame" />
                Applied instantly — same controls as the real editor
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* -------------------------------- workflow -------------------------------- */

const STEPS = [
  {
    step: '01',
    icon: 'layers',
    title: 'Choose',
    copy: 'Browse eight complete restaurant designs and preview each one as a real, scrollable website.',
    to: '/templates',
    cta: 'Browse templates',
  },
  {
    step: '02',
    icon: 'palette',
    title: 'Customize',
    copy: 'Rename the restaurant, recolor, switch fonts, rework the menu — everything updates live.',
    to: '/dashboard/editor',
    cta: 'Try the editor',
  },
  {
    step: '03',
    icon: 'send',
    title: 'Publish',
    copy: 'Save your demo, open the mobile-friendly site and generate the QR code for your tables.',
    to: '/menu-demo',
    cta: 'See a published site',
  },
]

function Workflow({ onCustomize }: { onCustomize: (id: string) => void }) {
  return (
    <section className="bg-ivory py-20 lg:py-28" id="how">
      <div className="page">
        <SectionHeading
          eyebrow="How it works"
          title="Three steps from idea to live menu"
          description="The whole journey is designed to take minutes — and it is fully interactive in this demo."
        />

        <div className="relative mt-14 grid gap-6 md:grid-cols-3">
          <div
            aria-hidden="true"
            className="absolute start-[16%] end-[16%] top-[46px] hidden h-px bg-gradient-to-r from-transparent via-stone to-transparent md:block"
          />
          {STEPS.map((step) => (
            <Link
              key={step.step}
              to={step.to}
              className="group relative rounded-3xl border border-sand bg-paper p-6 transition duration-300 hover:border-clay hover:shadow-[0_36px_70px_-52px_rgba(15,13,11,0.9)]"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-charcoal text-ivory transition group-hover:bg-flame">
                  <Icon name={step.icon} size={21} />
                </span>
                <span className="display-serif text-[38px] leading-none text-sand transition group-hover:text-flame/70">
                  {step.step}
                </span>
              </div>
              <h3 className="display-serif mt-5 text-[25px] text-charcoal">{step.title}</h3>
              <p className="mt-2.5 text-[14.5px] leading-relaxed text-umber">{step.copy}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-charcoal">
                {step.cta}
                <Icon
                  name="arrowRight"
                  size={15}
                  className="transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1"
                />
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <Button onClick={() => onCustomize('bella-italia')} variant="outline" icon="sparkles">
            Start with Bella Italia
          </Button>
        </div>
      </div>
    </section>
  )
}

/* --------------------------- feature highlights --------------------------- */

const HIGHLIGHTS = [
  {
    icon: 'palette',
    title: 'Branding',
    copy: 'Name, logo, tagline, hero photography, contact details and opening hours — all editable, all live.',
    wide: true,
  },
  {
    icon: 'type',
    title: 'Typography',
    copy: 'Six curated families for headings, body and menu items, with size, weight and leading controls.',
    wide: false,
  },
  {
    icon: 'book',
    title: 'Menu management',
    copy: 'Categories, items, prices, promotional pricing, availability, featured dishes and drag-free reordering.',
    wide: false,
  },
  {
    icon: 'qr',
    title: 'QR codes',
    copy: 'A real, scannable QR code for every menu — downloadable and print-ready for tables and windows.',
    wide: false,
  },
  {
    icon: 'smartphone',
    title: 'Mobile-friendly',
    copy: 'Every template is built responsive-first, so the menu reads perfectly on a phone at the table.',
    wide: false,
  },
]

function FeatureHighlights() {
  const restaurant = useActiveRestaurant()

  return (
    <section className="border-y border-sand bg-paper py-20 lg:py-28">
      <div className="page">
        <SectionHeading
          eyebrow="Everything included"
          title="The details that make it feel premium"
          description="Not a page builder with food plugins — a focused system for how restaurants actually present food."
        />

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {HIGHLIGHTS.map((item) => (
            <article
              key={item.title}
              className={cx(
                'flex flex-col justify-between rounded-3xl border border-sand bg-ivory p-6 transition duration-300 hover:border-clay hover:bg-paper',
                item.wide && 'lg:col-span-2'
              )}
            >
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-charcoal text-ivory">
                  <Icon name={item.icon} size={20} />
                </span>
                <div>
                  <h3 className="text-[17px] font-semibold tracking-[-0.01em] text-charcoal">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 max-w-md text-[14.5px] leading-relaxed text-umber">
                    {item.copy}
                  </p>
                </div>
              </div>

              <div className="mt-6">{highlightVisual(item.title, restaurant)}</div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function highlightVisual(title: string, restaurant: Restaurant) {
  switch (title) {
    case 'Branding':
      return (
        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-sand bg-paper p-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-charcoal font-display text-[17px] text-ivory">
            <span className="font-[family-name:'Playfair_Display']">{restaurant.logoText}</span>
          </span>
          <span className="min-w-0">
            <span className="line-clamp-1 text-[15px] font-semibold text-charcoal">
              {restaurant.name}
            </span>
            <span className="line-clamp-1 text-[13px] text-umber">{restaurant.tagline}</span>
          </span>
          <span className="ms-auto hidden gap-1.5 sm:flex">
            {['#1B1714', '#E8571F', '#3F5D45', '#C6A15B'].map((color) => (
              <span
                key={color}
                className="h-6 w-6 rounded-full border border-black/10"
                style={{ backgroundColor: color }}
              />
            ))}
          </span>
        </div>
      )
    case 'Typography':
      return (
        <div className="flex items-end justify-between gap-4 rounded-2xl border border-sand bg-paper p-4">
          <span className="display-serif text-[46px] leading-[0.85] text-charcoal">Aa</span>
          <span className="text-end text-[13px] leading-relaxed text-umber">
            Playfair Display
            <br />
            Inter · Lora · DM Sans
          </span>
        </div>
      )
    case 'Menu management':
      return (
        <div className="divide-y divide-sand rounded-2xl border border-sand bg-paper">
          {restaurant.menu[0]?.items.slice(0, 3).map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <span className="line-clamp-1 text-[13.5px] text-charcoal">{item.name}</span>
              <span className="font-mono text-[13px] text-umber">${item.price}</span>
            </div>
          ))}
        </div>
      )
    case 'QR codes':
      return (
        <div className="flex items-center gap-4 rounded-2xl border border-sand bg-paper p-4">
          <span className="rounded-xl border border-sand bg-white p-2">
            <QRCodeSVG value={`https://${restaurant.slug}.menucraft.com`} size={72} level="M" />
          </span>
          <span className="text-[13px] leading-relaxed text-umber">
            Scans straight to
            <br />
            <span className="font-medium text-charcoal">{restaurant.slug}.menucraft.com</span>
          </span>
        </div>
      )
    default:
      return (
        <div className="flex items-center gap-4 rounded-2xl border border-sand bg-paper p-4">
          <span className="w-[74px] shrink-0 rounded-[14px] border-2 border-charcoal bg-white p-1.5">
            <span className="block space-y-1 rounded-lg bg-ivory p-1.5">
              <span className="block h-1.5 w-full rounded-full bg-clay/60" />
              <span className="block h-1.5 w-3/4 rounded-full bg-clay/40" />
              <span className="block h-4 w-full rounded bg-flame/80" />
              <span className="block h-1.5 w-2/3 rounded-full bg-clay/40" />
            </span>
          </span>
          <span className="text-[13px] leading-relaxed text-umber">
            Phone-first layouts,
            <br />
            tested from 320px up.
          </span>
        </div>
      )
  }
}

/* --------------------------- responsive showcase -------------------------- */

function ResponsiveShowcase({ restaurant }: { restaurant: Restaurant }) {
  return (
    <section className="overflow-hidden bg-charcoal py-20 text-ivory lg:py-28">
      <div className="page-wide page">
        <div className="grid items-center gap-14 lg:grid-cols-[1fr_1.25fr]">
          <div>
            <span className="eyebrow text-ivory/50">Responsive by default</span>
            <h2 className="display-serif mt-4 text-[clamp(30px,4vw,48px)] leading-[1.06]">
              One menu. Every screen.
            </h2>
            <p className="mt-5 text-[16px] leading-relaxed text-ivory/65">
              Guests open your menu on the phone in their hand. MenuCraft templates reflow for
              desktop, tablet and mobile without a single extra setting — preview both sizes side by
              side before you publish.
            </p>
            <ul className="mt-8 space-y-3.5">
              {[
                { icon: 'monitor', title: 'Desktop', copy: 'Wide layouts, editorial heroes, three-column menus.' },
                { icon: 'smartphone', title: 'Mobile', copy: 'Touch-friendly tabs, stacked cards, readable prices.' },
                { icon: 'qr', title: 'At the table', copy: 'Scan-to-menu in one tap, no app install.' },
              ].map((point) => (
                <li key={point.title} className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ivory/10 text-flame-light">
                    <Icon name={point.icon} size={18} />
                  </span>
                  <span>
                    <span className="block text-[15px] font-semibold">{point.title}</span>
                    <span className="block text-[14px] text-ivory/60">{point.copy}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-9">
              <Button to="/menu-demo" variant="accent" icon="external">
                Open the published menu
              </Button>
            </div>
          </div>

          <div className="relative">
            <BrowserFrame url={`${restaurant.slug}.menucraft.com`} badge="Live">
              <ScaledFrame width={1440} maxHeight={470}>
                <RestaurantSite
                  restaurant={restaurant}
                  interactive={false}
                  mode="preview"
                  idPrefix="resp-"
                />
              </ScaledFrame>
            </BrowserFrame>
            <div className="absolute -bottom-12 end-2 hidden md:block lg:-end-6">
              <PhoneFrame width={214} screen={396} label="Mobile · 390px">
                <ScaledFrame width={390} maxHeight={396}>
                  <RestaurantSite
                    restaurant={restaurant}
                    interactive={false}
                    mode="preview"
                    idPrefix="respphone-"
                  />
                </ScaledFrame>
              </PhoneFrame>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* --------------------------------- pricing -------------------------------- */

function Pricing({ onCustomize }: { onCustomize: (id: string) => void }) {
  return (
    <section className="bg-ivory py-20 lg:py-28" id="pricing">
      <div className="page">
        <SectionHeading
          eyebrow="Pricing"
          title={
            <>
              Simple plans, <span className="italic text-flame">demo pricing</span>
            </>
          }
          description="These prices are illustrative only. This prototype processes no payments and provisions no real hosting."
        />

        <div className="mt-6 flex justify-center">
          <Badge tone="gold" icon="info">
            DEMO PRICING — no real charges
          </Badge>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={cx(
                'flex flex-col rounded-3xl border p-7 transition duration-300',
                plan.highlight
                  ? 'border-charcoal bg-charcoal text-ivory shadow-[0_50px_90px_-60px_rgba(15,13,11,1)]'
                  : 'border-sand bg-paper hover:border-clay'
              )}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-[15px] font-semibold uppercase tracking-[0.14em]">
                  {plan.name}
                </h3>
                {plan.highlight ? (
                  <span className="rounded-full bg-flame px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                    Most popular
                  </span>
                ) : null}
              </div>

              <div className="mt-5 flex items-end gap-2">
                <span className="display-serif text-[52px] leading-none">
                  {plan.price === 0 ? 'Free' : `$${plan.price}`}
                </span>
                <span
                  className={cx(
                    'pb-1.5 text-[13.5px]',
                    plan.highlight ? 'text-ivory/55' : 'text-umber'
                  )}
                >
                  {plan.period === 'forever' ? 'forever' : '/ month'}
                </span>
              </div>

              <p
                className={cx(
                  'mt-3 text-[14.5px] leading-relaxed',
                  plan.highlight ? 'text-ivory/65' : 'text-umber'
                )}
              >
                {plan.blurb}
              </p>

              <ul
                className={cx(
                  'mt-6 flex-1 space-y-3 border-t pt-6 text-[14.5px]',
                  plan.highlight ? 'border-ivory/12' : 'border-sand'
                )}
              >
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2.5">
                    <span
                      className={cx(
                        'mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full',
                        plan.highlight ? 'bg-flame text-white' : 'bg-moss/12 text-moss'
                      )}
                    >
                      <Icon name="check" size={11} strokeWidth={3} />
                    </span>
                    <span className={plan.highlight ? 'text-ivory/85' : 'text-espresso'}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-7">
                <Button
                  full
                  size="lg"
                  variant={plan.highlight ? 'accent' : 'outline'}
                  onClick={() => onCustomize('bella-italia')}
                >
                  {plan.price === 0 ? 'Start free demo' : `Choose ${plan.name}`}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-7 text-center text-[13px] text-clay">
          Every button in this prototype leads somewhere — plans simply open the demo editor.
        </p>
      </div>
    </section>
  )
}

/* -------------------------------- final CTA ------------------------------- */

function FinalCta() {
  return (
    <section className="bg-ivory pb-24">
      <div className="page">
        <div className="relative overflow-hidden rounded-[36px] bg-ink px-8 py-16 text-center text-ivory lg:px-16 lg:py-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(232,87,31,0.35),transparent_55%)]"
          />
          <div aria-hidden="true" className="grid-lines pointer-events-none absolute inset-0 opacity-30" />

          <div className="relative mx-auto max-w-3xl">
            <span className="eyebrow text-flame-light">Ready when you are</span>
            <h2 className="display-serif mt-4 text-[clamp(32px,5vw,58px)] leading-[1.05]">
              Your menu deserves better than a PDF.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-[16.5px] leading-relaxed text-ivory/65">
              Pick a template, change the restaurant name, edit a price, swap the font — in under two
              minutes you will have a menu worth sharing.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button to="/templates" size="lg" icon="arrowRight">
                Explore Templates
              </Button>
              <Button to="/dashboard/editor" size="lg" variant="light">
                Explore the Editor
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[13px] text-ivory/45">
              <span>No credit card</span>
              <span>·</span>
              <span>No code</span>
              <span>·</span>
              <span>Demo data only</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
