import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Icon } from '../../shared/ui/icons.tsx'
import { MarketingFooter } from '../../shared/chrome/MarketingFooter.tsx'
import { MarketingHeader } from '../../shared/chrome/MarketingHeader.tsx'
import { BrowserFrame, ScaledFrame } from '../../shared/ui/ScaledFrame.tsx'
import { RestaurantSite } from '../../templates/site/RestaurantSite.tsx'
import { Badge, Button, Card, Img } from '../../shared/ui/ui.tsx'
import { useCustomize } from '../../shared/lib/hooks.ts'
import { FONTS } from '../../templates/data/fonts.ts'
import { buildTemplatePreviewRestaurant, getTemplate, hasTemplate } from '../../templates/data/templates.ts'
import { useTemplateList } from '../../templates/data/useTemplateList.ts'
import { cx, money } from '../../shared/lib/utils.ts'
import { useActiveRestaurant } from '../../shared/store/useStore.ts'
import { useI18n } from '../../shared/i18n'

type Device = 'desktop' | 'phone'

export default function TemplatePreview() {
  const { t } = useI18n()
  const { id = '' } = useParams()
  const exists = hasTemplate(id)
  const template = getTemplate(id)
  const active = useActiveRestaurant()
  const customize = useCustomize()
  const templates = useTemplateList()
  const [device, setDevice] = useState<Device>('desktop')

  const preview = useMemo(() => buildTemplatePreviewRestaurant(id), [id])

  if (!exists) {
    return (
      <div className="min-h-screen bg-ivory">
        <MarketingHeader solid />
        <main className="page flex min-h-[70vh] flex-col items-center justify-center py-24 text-center">
          <span className="eyebrow">{t('web.preview.unknownEyebrow')}</span>
          <h1 className="display-serif mt-4 text-[clamp(34px,5vw,56px)] leading-none">
            {t('web.preview.unknownTitle')}
          </h1>
          <p className="mt-4 max-w-md text-umber">
            {t('web.preview.unknownSub', { count: templates.length })}
          </p>
          <Button to="/templates" className="mt-7" icon="arrowLeft">
            {t('web.preview.backToGallery')}
          </Button>
        </main>
        <MarketingFooter />
      </div>
    )
  }

  const alreadyApplied = active.templateId === template.id
  const heading = FONTS.find((f) => f.id === template.defaultDesign.typography.heading)
  const body = FONTS.find((f) => f.id === template.defaultDesign.typography.body)

  return (
    <div className="min-h-screen bg-ivory">
      <MarketingHeader solid />

      {/* ------------------------------ action bar ----------------------------- */}
      <div className="sticky top-[70px] z-40 border-b border-sand bg-ivory/92 backdrop-blur-xl">
        <div className="page flex h-[62px] items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              to="/templates"
              className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border border-sand bg-paper text-espresso transition hover:border-clay hover:bg-cream sm:flex"
              aria-label={t('web.preview.backAria')}
            >
              <Icon name="arrowLeft" size={16} />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="line-clamp-1 text-[15.5px] font-semibold text-charcoal">{template.name}</h1>
                <Badge tone="outline">{template.category}</Badge>
                {alreadyApplied ? (
                  <Badge tone="moss" icon="check">
                    {t('web.preview.inUse')}
                  </Badge>
                ) : null}
              </div>
              <p className="hidden text-[12px] text-umber sm:line-clamp-1">{template.tagline}</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden items-center gap-1 rounded-full border border-sand bg-cream p-1 sm:flex">
              <button
                type="button"
                onClick={() => setDevice('desktop')}
                aria-pressed={device === 'desktop'}
                aria-label={t('web.preview.desktopAria')}
                className={cx(
                  'flex h-8 w-9 items-center justify-center rounded-full transition',
                  device === 'desktop' ? 'bg-paper text-charcoal shadow-sm' : 'text-umber hover:text-charcoal'
                )}
              >
                <Icon name="monitor" size={15} />
              </button>
              <button
                type="button"
                onClick={() => setDevice('phone')}
                aria-pressed={device === 'phone'}
                aria-label={t('web.preview.phoneAria')}
                className={cx(
                  'flex h-8 w-9 items-center justify-center rounded-full transition',
                  device === 'phone' ? 'bg-paper text-charcoal shadow-sm' : 'text-umber hover:text-charcoal'
                )}
              >
                <Icon name="smartphone" size={15} />
              </button>
            </div>
            <Button size="sm" variant="outline" to="/menu-demo" icon="external" className="hidden md:inline-flex">
              {t('web.preview.liveMenu')}
            </Button>
            <Button size="sm" variant="accent" icon="arrowRight" onClick={() => customize(template.id)}>
              {t('web.customize')}
            </Button>
          </div>
        </div>
      </div>

      {/* -------------------------------- preview ------------------------------- */}
      <section className="page pt-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-umber">
            <span className="flex items-center gap-1.5 rounded-full border border-sand bg-paper px-3 py-1.5">
              <Icon name="palette" size={13} className="text-flame" />
              {template.chips[0]} · {template.chips[1]} · {template.chips[2]}
            </span>
            <span className="flex items-center gap-1.5 rounded-full border border-sand bg-paper px-3 py-1.5">
              <Icon name="type" size={13} className="text-flame" />
              {heading?.name} / {body?.name}
            </span>
            <span className="hidden items-center gap-1.5 rounded-full border border-sand bg-paper px-3 py-1.5 sm:flex">
              <Icon name="layout" size={13} className="text-flame" />
              {t('web.preview.layoutMeta', {
                header: template.defaultDesign.layout.header,
                menu: template.defaultDesign.layout.menuLayout,
              })}
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-sand bg-paper px-3 py-1.5 text-[12.5px] text-umber sm:hidden">
            <Icon name="monitor" size={13} /> / <Icon name="smartphone" size={13} />{' '}
            {t('web.preview.barToggle')}
          </div>
        </div>

        <div className="h-[min(74vh,780px)] overflow-y-auto rounded-3xl border border-sand bg-cream/50 p-3 thin-scroll sm:p-5">
          {device === 'desktop' ? (
            <BrowserFrame url={`${template.sample.slug}.menucraft.com`} badge={t('web.preview.liveBadge')}>
              <ScaledFrame width={1440}>
                <RestaurantSite restaurant={preview} interactive={false} mode="preview" idPrefix="tp-" />
              </ScaledFrame>
            </BrowserFrame>
          ) : (
            <div className="mx-auto w-[320px]">
              <div className="overflow-hidden rounded-[42px] border-[10px] border-[#15120f] bg-[#15120f] shadow-[0_60px_110px_-55px_rgba(15,13,11,0.9)]">
                <div className="relative overflow-hidden rounded-[32px] bg-white">
                  <span className="absolute start-1/2 top-2 z-20 h-1.5 w-20 -translate-x-1/2 rounded-full bg-white/30 rtl:translate-x-1/2" />
                  <ScaledFrame width={390}>
                    <RestaurantSite restaurant={preview} interactive={false} mode="preview" idPrefix="tpm-" />
                  </ScaledFrame>
                </div>
              </div>
              <p className="mt-3 text-center text-[12px] text-clay">{t('web.preview.scrollHint')}</p>
            </div>
          )}
        </div>
      </section>

      {/* ------------------------------- details ------------------------------- */}
      <section className="page grid gap-6 py-12 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-6">
          <span className="eyebrow">{t('web.preview.aboutEyebrow')}</span>
          <h2 className="display-serif mt-3 text-[clamp(26px,3.4vw,38px)] leading-tight text-charcoal">
            {template.name} — {template.tagline}
          </h2>
          <p className="mt-4 text-[15.5px] leading-relaxed text-umber">{template.description}</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-sand bg-cream/50 p-4">
              <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-clay">
                {t('web.preview.palette')}
              </div>
              <div className="mt-2.5 flex gap-1.5">
                {template.chips.map((chip, i) => (
                  <span
                    key={i}
                    className="h-8 w-8 rounded-lg border border-black/10"
                    style={{ backgroundColor: chip }}
                    title={chip}
                  />
                ))}
              </div>
              <div className="mt-2 font-mono text-[11px] uppercase text-umber">{template.chips.join(' · ')}</div>
            </div>

            <div className="rounded-2xl border border-sand bg-cream/50 p-4">
              <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-clay">
                {t('web.preview.typography')}
              </div>
              <div className="mt-2 space-y-1.5">
                <div className="text-[15px] text-charcoal" style={{ fontFamily: heading?.stack }}>
                  {t('web.preview.fontHeadings', { name: heading?.name ?? '' })}
                </div>
                <div className="text-[13.5px] text-umber" style={{ fontFamily: body?.stack }}>
                  {t('web.preview.fontBody', { name: body?.name ?? '' })}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-sand bg-cream/50 p-4">
              <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-clay">
                {t('web.preview.sections')}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {template.defaultDesign.sections
                  .filter((s) => s.enabled)
                  .map((s) => (
                    <span key={s.id} className="rounded-full bg-paper px-2.5 py-1 text-[11.5px] capitalize text-umber">
                      {s.id}
                    </span>
                  ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="accent" size="lg" icon="arrowRight" onClick={() => customize(template.id)}>
              {t('web.preview.useTemplate')}
            </Button>
            <Button to="/templates" variant="outline" size="lg" icon="arrowLeft">
              {t('web.preview.compareOthers')}
            </Button>
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="overflow-hidden">
            <div className="border-b border-sand/80 px-5 py-4">
              <h3 className="text-[14.5px] font-semibold text-charcoal">{t('web.preview.sampleTitle')}</h3>
              <p className="mt-0.5 text-[12.5px] text-umber">
                {t('web.preview.sampleCounts', {
                  categories: template.sampleMenu.length,
                  dishes: template.sampleMenu.reduce((sum, c) => sum + c.items.length, 0),
                })}
              </p>
            </div>
            <ul className="max-h-[300px] divide-y divide-sand/70 overflow-y-auto thin-scroll">
              {template.sampleMenu.map((category) => (
                <li key={category.id} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[13.5px] font-semibold text-charcoal">{category.name}</span>
                    <span className="text-[11.5px] text-clay">
                      {t('web.preview.itemsCount', { count: category.items.length })}
                    </span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-[12.5px] leading-snug text-umber">
                    {category.items.slice(0, 3).map((i) => `${i.name} ${money(i.price)}`).join(' · ')}
                    {category.items.length > 3 ? ' …' : ''}
                  </p>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[14.5px] font-semibold text-charcoal">{t('web.preview.photoTitle')}</h3>
              <Badge tone="neutral">{t('web.preview.bundled')}</Badge>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {template.gallery.slice(0, 6).map((photo, i) => (
                <Img
                  key={i}
                  src={photo}
                  alt={t('web.preview.photoAlt', { name: template.name, index: i + 1 })}
                  className="aspect-square w-full rounded-lg border border-sand object-cover"
                />
              ))}
            </div>
            <p className="mt-3 text-[12px] leading-relaxed text-clay">
              {t('web.preview.photoNote')}
            </p>
          </Card>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}
