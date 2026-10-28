import { Fragment, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { BrowserFrame, PhoneFrame, ScaledFrame } from '../../shared/ui/ScaledFrame.tsx'
import { Icon } from '../../shared/ui/icons.tsx'
import { MarketingFooter } from '../../shared/chrome/MarketingFooter.tsx'
import { MarketingHeader } from '../../shared/chrome/MarketingHeader.tsx'
import { RestaurantSite } from '../../templates/site/RestaurantSite.tsx'
import { Badge, Button, Img, SectionHeading, Sparkline } from '../../shared/ui/ui.tsx'
import { PLANS } from '../../shared/lib/demoData.ts'
import { useCustomize } from '../../shared/lib/hooks.ts'
import { PALETTE_PRESETS } from '../../templates/data/palettes.ts'
import { TEMPLATES } from '../../templates/data/templates.ts'
import type { ColorSet, FontId } from '../../shared/lib/types.ts'
import { cx } from '../../shared/lib/utils.ts'
import type { Restaurant } from '../../shared/lib/types.ts'
import { useI18n } from '../../shared/i18n'
import type { TKey, Lang } from '../../shared/i18n'
import { useActiveRestaurant } from '../../shared/store/useStore.ts'
import { HOME_SEED, useHomeContentByLang } from '../../shared/store/useHomeContent.ts'
import type { HomeContent, HomeContentByLang } from '../../shared/store/useHomeContent.ts'

/* ------------------------- store copy → rendered copy ------------------------ */

/**
 * Stored titles may contain `*accent*` spans and `\n` line breaks — the seed
 * copy uses them to reproduce the original hand-written markup exactly.
 */
function AccentText({ text, accentClass = 'text-flame' }: { text: string; accentClass?: string }) {
  return (
    <>
      {text.split('\n').map((line, lineIndex) => (
        <Fragment key={lineIndex}>
          {lineIndex > 0 ? <br /> : null}
          {line.split(/(\*[^*]+\*)/g).map((part, partIndex) =>
            part.length > 2 && part.startsWith('*') && part.endsWith('*') ? (
              <span key={partIndex} className={accentClass}>
                {part.slice(1, -1)}
              </span>
            ) : (
              part
            )
          )}
        </Fragment>
      ))}
    </>
  )
}

/** an emptied field falls back to the next candidate, so the page can never look broken */
function firstText(...candidates: (string | undefined)[]): string {
  for (const candidate of candidates) {
    if (candidate && candidate.trim()) return candidate
  }
  return ''
}

/** an emptied list falls back to the next candidate list */
function firstList<T>(...candidates: (T[] | undefined)[]): T[] {
  for (const candidate of candidates) {
    if (candidate && candidate.length > 0) return candidate
  }
  return []
}

/**
 * Reads the copy for the active language, with a per-field fallback chain:
 * active language → English page → the active language's seed.
 */
function safeCopy(content: HomeContentByLang, lang: Lang): HomeContent {
  const active = content[lang]
  const en = content.en
  const seed = HOME_SEED[lang]
  return {
    ...active,
    hero: {
      ...active.hero,
      eyebrow: firstText(active.hero.eyebrow, en.hero.eyebrow, seed.hero.eyebrow),
      title: firstText(active.hero.title, en.hero.title, seed.hero.title),
      sub: firstText(active.hero.sub, en.hero.sub, seed.hero.sub),
      cta: firstText(active.hero.cta, en.hero.cta, seed.hero.cta),
      secondaryCta: firstText(active.hero.secondaryCta, en.hero.secondaryCta, seed.hero.secondaryCta),
      note: firstText(active.hero.note, en.hero.note, seed.hero.note),
    },
    templates: {
      ...active.templates,
      eyebrow: firstText(active.templates.eyebrow, en.templates.eyebrow, seed.templates.eyebrow ?? ''),
      title: firstText(active.templates.title, en.templates.title, seed.templates.title),
      sub: firstText(active.templates.sub, en.templates.sub, seed.templates.sub ?? ''),
    },
    editorShowcase: {
      ...active.editorShowcase,
      eyebrow: firstText(
        active.editorShowcase.eyebrow,
        en.editorShowcase.eyebrow,
        seed.editorShowcase.eyebrow
      ),
      title: firstText(active.editorShowcase.title, en.editorShowcase.title, seed.editorShowcase.title),
      sub: firstText(active.editorShowcase.sub, en.editorShowcase.sub, seed.editorShowcase.sub),
      bullets: firstList(
        active.editorShowcase.bullets,
        en.editorShowcase.bullets,
        seed.editorShowcase.bullets
      ),
    },
    workflow: {
      ...active.workflow,
      eyebrow: firstText(active.workflow.eyebrow, en.workflow.eyebrow, seed.workflow.eyebrow),
      title: firstText(active.workflow.title, en.workflow.title, seed.workflow.title),
      sub: firstText(active.workflow.sub, en.workflow.sub, seed.workflow.sub),
      steps: firstList(active.workflow.steps, en.workflow.steps, seed.workflow.steps),
    },
    highlights: {
      ...active.highlights,
      items: firstList(active.highlights.items, en.highlights.items, seed.highlights.items),
    },
    showcase: {
      ...active.showcase,
      eyebrow: firstText(active.showcase.eyebrow, en.showcase.eyebrow, seed.showcase.eyebrow ?? ''),
      title: firstText(active.showcase.title, en.showcase.title, seed.showcase.title),
      sub: firstText(active.showcase.sub, en.showcase.sub, seed.showcase.sub ?? ''),
    },
    pricing: {
      ...active.pricing,
      eyebrow: firstText(active.pricing.eyebrow, en.pricing.eyebrow, seed.pricing.eyebrow ?? ''),
      title: firstText(active.pricing.title, en.pricing.title, seed.pricing.title),
      sub: firstText(active.pricing.sub, en.pricing.sub, seed.pricing.sub ?? ''),
      note: firstText(active.pricing.note, en.pricing.note, seed.pricing.note),
    },
    finalCta: {
      ...active.finalCta,
      title: firstText(active.finalCta.title, en.finalCta.title, seed.finalCta.title),
      sub: firstText(active.finalCta.sub, en.finalCta.sub, seed.finalCta.sub),
      cta: firstText(active.finalCta.cta, en.finalCta.cta, seed.finalCta.cta),
    },
  }
}

export default function Home() {
  const restaurant = useActiveRestaurant()
  const customize = useCustomize()
  const { lang } = useI18n()
  const contentByLang = useHomeContentByLang()
  const copy = useMemo(() => safeCopy(contentByLang, lang), [contentByLang, lang])

  return (
    <div className="min-h-screen bg-ivory">
      <MarketingHeader />
      {copy.hero.enabled ? <Hero restaurant={restaurant} hero={copy.hero} /> : null}
      {copy.templates.enabled ? (
        <FeaturedTemplates onCustomize={customize} section={copy.templates} />
      ) : null}
      {copy.editorShowcase.enabled ? (
        <EditorShowcase restaurant={restaurant} section={copy.editorShowcase} />
      ) : null}
      {copy.workflow.enabled ? <Workflow onCustomize={customize} section={copy.workflow} /> : null}
      {copy.highlights.enabled ? <FeatureHighlights section={copy.highlights} /> : null}
      {copy.showcase.enabled ? (
        <ResponsiveShowcase restaurant={restaurant} section={copy.showcase} />
      ) : null}
      {copy.pricing.enabled ? <Pricing onCustomize={customize} section={copy.pricing} /> : null}
      {copy.finalCta.enabled ? <FinalCta section={copy.finalCta} /> : null}
      <MarketingFooter />
    </div>
  )
}

/* ---------------------------------- hero ---------------------------------- */

function Hero({ restaurant, hero }: { restaurant: Restaurant; hero: HomeContent['hero'] }) {
  const { t } = useI18n()

  return (
    <section className="relative overflow-hidden pb-28 pt-[118px] lg:pt-[142px]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[760px] bg-[radial-gradient(ellipse_at_top,rgba(232,87,31,0.14),transparent_62%)]"
      />
      {hero.image ? (
        <Img
          src={hero.image}
          alt=""
          eager
          className="pointer-events-none absolute inset-x-0 top-0 h-[760px] w-full object-cover opacity-25 [mask-image:radial-gradient(ellipse_at_top,black,transparent_62%)]"
        />
      ) : null}
      <div aria-hidden="true" className="grid-lines pointer-events-none absolute inset-0 opacity-70" />

      <div className="page relative">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-sand bg-paper px-3.5 py-1.5 text-[12.5px] font-medium text-espresso shadow-[0_10px_24px_-20px_rgba(27,23,20,0.8)]">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-flame text-white">
              <Icon name="sparkles" size={11} strokeWidth={2.2} />
            </span>
            {hero.eyebrow}
          </span>

          <h1 className="display-serif mt-7 text-[clamp(40px,6.6vw,82px)] leading-[1.03] text-charcoal">
            <AccentText text={hero.title} />
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-[17px] leading-relaxed text-espresso/85">
            {hero.sub}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button to="/templates" size="lg" icon="arrowRight">
              {hero.cta}
            </Button>
            <Button to="/dashboard/editor" size="lg" variant="outline" icon="layout">
              {hero.secondaryCta}
            </Button>
          </div>

          <ul className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13.5px] text-umber">
            {[
              t('home.hero.bulletNoCoding'),
              t('home.hero.bulletTemplates', { count: TEMPLATES.length }),
              t('home.hero.bulletPublish'),
            ].map((point) => (
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
          <BrowserFrame url="bella.menucraft.com" badge={t('home.hero.liveBadge')}>
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
              <span className="text-[11.5px] font-medium text-umber">{t('home.hero.viewsLabel')}</span>
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
                <span className="block text-[12.5px] font-semibold text-charcoal">
                  {t('home.hero.qrTitle')}
                </span>
                <span className="line-clamp-1 text-[11.5px] text-umber">
                  {restaurant.slug}.menucraft.com
                </span>
                <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-moss">
                  <span className="h-1.5 w-1.5 rounded-full bg-moss anim-pulse-dot" />
                  {t('home.hero.scans', { count: '1,284' })}
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

        <p className="mt-14 text-center text-[13px] text-clay xl:mt-24">{hero.note}</p>
      </div>
    </section>
  )
}

/* ---------------------------- featured templates --------------------------- */

function FeaturedTemplates({
  onCustomize,
  section,
}: {
  onCustomize: (id: string) => void
  section: HomeContent['templates']
}) {
  const { t } = useI18n()
  const featured = TEMPLATES.filter((item) => item.featured).slice(0, 3)

  return (
    <section className="border-t border-sand bg-paper py-20 lg:py-28" id="templates">
      <div className="page">
        <SectionHeading
          eyebrow={section.eyebrow ?? ''}
          title={<AccentText text={section.title} accentClass="italic text-flame" />}
          description={section.sub ?? ''}
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
                  alt={t('home.templates.previewAlt', { name: template.name })}
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
                    {t('home.templates.previewChip')}
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
                    {t('home.templates.preview')}
                  </Button>
                  <Button size="sm" onClick={() => onCustomize(template.id)} className="flex-1">
                    {t('home.templates.customize')}
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Button to="/templates" size="lg" variant="outline" icon="grid" iconRight="arrowRight">
            {t('home.templates.browseAll', { count: TEMPLATES.length })}
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

function EditorShowcase({
  restaurant,
  section,
}: {
  restaurant: Restaurant
  section: HomeContent['editorShowcase']
}) {
  const { t } = useI18n()
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

  const bullets = section.bullets.filter((bullet) => bullet.trim())

  return (
    <section className="relative overflow-hidden bg-ink py-20 text-ivory lg:py-28" id="features">
      <div className="page">
        <div className="grid items-center gap-12 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <span className="eyebrow text-ivory/50">{section.eyebrow}</span>
            <h2 className="display-serif mt-4 text-[clamp(30px,4vw,48px)] leading-[1.06]">
              <AccentText text={section.title} />
            </h2>
            <p className="mt-5 text-[16px] leading-relaxed text-ivory/65">{section.sub}</p>

            {bullets.length > 0 ? (
              <ul className="mt-6 space-y-2.5">
                {bullets.map((bullet) => (
                  <li key={bullet} className="flex items-center gap-2.5 text-[14.5px] text-ivory/70">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-flame/15 text-flame-light">
                      <Icon name="check" size={12} strokeWidth={3} />
                    </span>
                    {bullet}
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="mt-8 space-y-6">
              <div>
                <div className="mb-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-ivory/45">
                  {t('home.editor.palette')}
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
                  {t('home.editor.headingFont')}
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
                  {t('home.editor.layout')}
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
                      {option === 'grid' ? t('home.editor.grid') : t('home.editor.list')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-9 flex flex-wrap gap-3">
              <Button to="/dashboard/editor" variant="accent" icon="arrowRight">
                {t('home.editor.openEditor')}
              </Button>
              <Button to="/templates" variant="light">
                {t('home.editor.seeAll')}
              </Button>
            </div>
          </div>

          <div className="relative">
            <BrowserFrame
              url={`${restaurant.slug}.menucraft.com/preview`}
              badge={t('home.editor.liveBadge')}
            >
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
                {t('home.editor.appliedNote')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* -------------------------------- workflow -------------------------------- */

/** step number, icon, link and CTA label stay structural — only copy is editable */
const STEP_META: { icon: string; to: string; cta: TKey }[] = [
  { icon: 'layers', to: '/templates', cta: 'home.workflow.browseTemplates' },
  { icon: 'palette', to: '/dashboard/editor', cta: 'home.workflow.tryEditor' },
  { icon: 'send', to: '/menu-demo', cta: 'home.workflow.seePublished' },
]

const STEP_META_FALLBACK: { icon: string; to: string; cta: TKey } = {
  icon: 'sparkles',
  to: '/templates',
  cta: 'home.workflow.learnMore',
}

function Workflow({
  onCustomize,
  section,
}: {
  onCustomize: (id: string) => void
  section: HomeContent['workflow']
}) {
  const { t } = useI18n()

  return (
    <section className="bg-ivory py-20 lg:py-28" id="how">
      <div className="page">
        <SectionHeading
          eyebrow={section.eyebrow ?? ''}
          title={<AccentText text={section.title} />}
          description={section.sub ?? ''}
        />

        <div className="relative mt-14 grid gap-6 md:grid-cols-3">
          <div
            aria-hidden="true"
            className="absolute start-[16%] end-[16%] top-[46px] hidden h-px bg-gradient-to-r from-transparent via-stone to-transparent md:block"
          />
          {section.steps.map((step, index) => {
            const meta = STEP_META[index] ?? STEP_META_FALLBACK
            const number = String(index + 1).padStart(2, '0')
            return (
              <Link
                key={number}
                to={meta.to}
                className="group relative rounded-3xl border border-sand bg-paper p-6 transition duration-300 hover:border-clay hover:shadow-[0_36px_70px_-52px_rgba(15,13,11,0.9)]"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-charcoal text-ivory transition group-hover:bg-flame">
                    <Icon name={meta.icon} size={21} />
                  </span>
                  <span className="display-serif text-[38px] leading-none text-sand transition group-hover:text-flame/70">
                    {number}
                  </span>
                </div>
                <h3 className="display-serif mt-5 text-[25px] text-charcoal">{step.title}</h3>
                <p className="mt-2.5 text-[14.5px] leading-relaxed text-umber">{step.body}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-charcoal">
                  {t(meta.cta)}
                  <Icon
                    name="arrowRight"
                    size={15}
                    className="transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1"
                  />
                </span>
              </Link>
            )
          })}
        </div>

        <div className="mt-8 flex justify-center">
          <Button onClick={() => onCustomize('bella-italia')} variant="outline" icon="sparkles">
            {t('home.workflow.startWith', { name: 'Bella Italia' })}
          </Button>
        </div>
      </div>
    </section>
  )
}

/* --------------------------- feature highlights --------------------------- */

/** icon + wide-card flag per highlight position — copy is fully editable */
const HIGHLIGHT_META = [
  { icon: 'palette', wide: true },
  { icon: 'type', wide: false },
  { icon: 'book', wide: false },
  { icon: 'qr', wide: false },
  { icon: 'smartphone', wide: false },
]

const HIGHLIGHT_META_FALLBACK = { icon: 'sparkles', wide: false }

function FeatureHighlights({ section }: { section: HomeContent['highlights'] }) {
  const restaurant = useActiveRestaurant()
  const { t } = useI18n()

  return (
    <section className="border-y border-sand bg-paper py-20 lg:py-28">
      <div className="page">
        <SectionHeading
          eyebrow={t('home.highlights.eyebrow')}
          title={t('home.highlights.title')}
          description={t('home.highlights.sub')}
        />

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {section.items.map((item, index) => {
            const meta = HIGHLIGHT_META[index] ?? HIGHLIGHT_META_FALLBACK
            return (
              <article
                key={`${index}-${item.title}`}
                className={cx(
                  'flex flex-col justify-between rounded-3xl border border-sand bg-ivory p-6 transition duration-300 hover:border-clay hover:bg-paper',
                  meta.wide && 'lg:col-span-2'
                )}
              >
                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-charcoal text-ivory">
                    <Icon name={meta.icon} size={20} />
                  </span>
                  <div>
                    <h3 className="text-[17px] font-semibold tracking-[-0.01em] text-charcoal">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 max-w-md text-[14.5px] leading-relaxed text-umber">
                      {item.body}
                    </p>
                  </div>
                </div>

                <div className="mt-6">{highlightVisual(index, restaurant, t)}</div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function highlightVisual(
  index: number,
  restaurant: Restaurant,
  t: ReturnType<typeof useI18n>['t']
) {
  switch (index) {
    case 0:
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
    case 1:
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
    case 2:
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
    case 3:
      return (
        <div className="flex items-center gap-4 rounded-2xl border border-sand bg-paper p-4">
          <span className="rounded-xl border border-sand bg-white p-2">
            <QRCodeSVG value={`https://${restaurant.slug}.menucraft.com`} size={72} level="M" />
          </span>
          <span className="text-[13px] leading-relaxed text-umber">
            {t('home.highlights.scansTo')}
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
            {t('home.highlights.mobileFirst')
              .split('\n')
              .map((line, lineIndex, lines) => (
                <Fragment key={lineIndex}>
                  {line}
                  {lineIndex < lines.length - 1 ? <br /> : null}
                </Fragment>
              ))}
          </span>
        </div>
      )
  }
}

/* --------------------------- responsive showcase -------------------------- */

function ResponsiveShowcase({
  restaurant,
  section,
}: {
  restaurant: Restaurant
  section: HomeContent['showcase']
}) {
  const { t } = useI18n()

  return (
    <section className="overflow-hidden bg-charcoal py-20 text-ivory lg:py-28">
      <div className="page-wide page">
        <div className="grid items-center gap-14 lg:grid-cols-[1fr_1.25fr]">
          <div>
            <span className="eyebrow text-ivory/50">{section.eyebrow}</span>
            <h2 className="display-serif mt-4 text-[clamp(30px,4vw,48px)] leading-[1.06]">
              <AccentText text={section.title} />
            </h2>
            <p className="mt-5 text-[16px] leading-relaxed text-ivory/65">{section.sub}</p>
            <ul className="mt-8 space-y-3.5">
              {[
                {
                  icon: 'monitor',
                  title: t('home.showcase.desktop'),
                  copy: t('home.showcase.desktopCopy'),
                },
                {
                  icon: 'smartphone',
                  title: t('home.showcase.mobile'),
                  copy: t('home.showcase.mobileCopy'),
                },
                {
                  icon: 'qr',
                  title: t('home.showcase.table'),
                  copy: t('home.showcase.tableCopy'),
                },
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
                {t('home.showcase.openMenu')}
              </Button>
            </div>
          </div>

          <div className="relative">
            <BrowserFrame url={`${restaurant.slug}.menucraft.com`} badge={t('home.showcase.liveBadge')}>
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
              <PhoneFrame width={214} screen={396} label={t('home.showcase.phoneLabel', { px: '390px' })}>
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

function Pricing({
  onCustomize,
  section,
}: {
  onCustomize: (id: string) => void
  section: HomeContent['pricing']
}) {
  const { t } = useI18n()

  return (
    <section className="bg-ivory py-20 lg:py-28" id="pricing">
      <div className="page">
        <SectionHeading
          eyebrow={section.eyebrow ?? ''}
          title={<AccentText text={section.title} accentClass="italic text-flame" />}
          description={section.sub ?? ''}
        />

        <div className="mt-6 flex justify-center">
          <Badge tone="gold" icon="info">
            {t('home.pricing.demoBadge')}
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
                    {t('home.pricing.mostPopular')}
                  </span>
                ) : null}
              </div>

              <div className="mt-5 flex items-end gap-2">
                <span className="display-serif text-[52px] leading-none">
                  {plan.price === 0 ? t('home.pricing.free') : `$${plan.price}`}
                </span>
                <span
                  className={cx(
                    'pb-1.5 text-[13.5px]',
                    plan.highlight ? 'text-ivory/55' : 'text-umber'
                  )}
                >
                  {plan.period === 'forever' ? t('home.pricing.forever') : t('home.pricing.perMonth')}
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
                  {plan.price === 0
                    ? t('home.pricing.startFree')
                    : t('home.pricing.choosePlan', { name: plan.name })}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-7 text-center text-[13px] text-clay">{section.note}</p>
      </div>
    </section>
  )
}

/* -------------------------------- final CTA ------------------------------- */

function FinalCta({ section }: { section: HomeContent['finalCta'] }) {
  const { t } = useI18n()

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
            <span className="eyebrow text-flame-light">{t('home.finalCta.eyebrow')}</span>
            <h2 className="display-serif mt-4 text-[clamp(32px,5vw,58px)] leading-[1.05]">
              <AccentText text={section.title} />
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-[16.5px] leading-relaxed text-ivory/65">
              {section.sub}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button to="/templates" size="lg" icon="arrowRight">
                {section.cta}
              </Button>
              <Button to="/dashboard/editor" size="lg" variant="light">
                {t('home.finalCta.secondary')}
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[13px] text-ivory/45">
              <span>{t('home.finalCta.noCard')}</span>
              <span>·</span>
              <span>{t('home.finalCta.noCode')}</span>
              <span>·</span>
              <span>{t('home.finalCta.demoOnly')}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
