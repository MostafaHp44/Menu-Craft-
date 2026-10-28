import { useEffect, useState } from 'react'
import { BrowserFrame, ScaledFrame } from '../../shared/ui/ScaledFrame.tsx'
import { BrandingPanel, ColorPanel, TypographyPanel } from './design/DesignPanels.tsx'
import { RestaurantSite } from '../../templates/site/RestaurantSite.tsx'
import { Badge, Button, Card, IconButton } from '../../shared/ui/ui.tsx'
import { TouchSegmented } from './design/TouchSegmented.tsx'
import { publicUrl } from '../../shared/lib/hooks.ts'
import { cx } from '../../shared/lib/utils.ts'
import { useActiveRestaurant, useStore } from '../../shared/store/useStore.ts'
import { useI18n, type TKey } from '../../shared/i18n'
import { useMediaQuery } from './design/useMediaQuery.ts'

type Tab = 'identity' | 'colors' | 'type'

const TABS: Array<{ id: Tab; labelKey: TKey; icon: string }> = [
  { id: 'identity', labelKey: 'design.tabIdentity', icon: 'pencil' },
  { id: 'colors', labelKey: 'design.tabColors', icon: 'palette' },
  { id: 'type', labelKey: 'design.tabType', icon: 'type' },
]

/** phones get the device-sized preview by default — a 1440px canvas is unreadable at 390 */
const isPhoneViewport = () => typeof window !== 'undefined' && window.innerWidth < 1024

export default function DesignBranding() {
  const { t } = useI18n()
  const r = useActiveRestaurant()
  const draft = useStore((s) => s.draft)
  const dirty = useStore((s) => s.dirty)
  const saveDraft = useStore((s) => s.saveDraft)
  const publishDemo = useStore((s) => s.publishDemo)
  const discardDraft = useStore((s) => s.discardDraft)
  const updateSaved = useStore((s) => s.updateSaved)
  const showToast = useStore((s) => s.showToast)
  const beginEdit = useStore((s) => s.beginEdit)

  // Panels edit the shared draft copy — start one when arriving from elsewhere.
  useEffect(() => {
    if (!draft) beginEdit()
  }, [draft, beginEdit])

  const publishSaved = () => {
    updateSaved((target) => {
      target.status = 'published'
    })
    showToast({
      title: t('toast.published'),
      message: t('toast.publishedMsg', { url: `${r.slug}.menucraft.com` }),
      tone: 'success',
    })
  }

  const [tab, setTab] = useState<Tab>('identity')
  const [device, setDevice] = useState<'desktop' | 'phone'>(() => (isPhoneViewport() ? 'phone' : 'desktop'))
  const [previewOpen, setPreviewOpen] = useState(true)
  const isWide = useMediaQuery('(min-width: 1024px)')

  const working = draft ?? r

  return (
    <div className="space-y-4 sm:space-y-5">
      <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="min-w-0">
          <h2 className="break-words text-[16px] font-semibold text-charcoal">
            {t('design.brandKit', { name: r.name })}
          </h2>
          <p className="mt-1 text-[13.5px] leading-relaxed text-umber">{t('design.brandKitSub')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {dirty ? (
            <Badge tone="gold" icon="pencil">
              {t('design.badgeUnsaved')}
            </Badge>
          ) : (
            <Badge tone="moss" icon="check">
              {t('design.badgeSaved')}
            </Badge>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="min-h-10 sm:min-h-9"
            disabled={!dirty}
            onClick={() => discardDraft()}
          >
            {t('common.discard')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            icon="save"
            className="min-h-10 sm:min-h-9"
            disabled={!dirty}
            onClick={() => saveDraft()}
          >
            {t('common.saveDraft')}
          </Button>
          <Button
            size="sm"
            icon="send"
            className="min-h-10 sm:min-h-9"
            disabled={!dirty && r.status === 'published'}
            onClick={() => {
              if (draft) publishDemo()
              else {
                publishSaved()
              }
            }}
          >
            {t('design.publishDemo')}
          </Button>
        </div>
      </Card>

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
        {/* live preview — first on phones (compact + collapsible), right column on desktop */}
        <div className="lg:col-start-2 lg:row-start-1 lg:sticky lg:top-[92px] lg:self-start">
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-sand/80 px-4 py-3">
              <div className="min-w-0">
                <div className="line-clamp-1 text-[13px] font-semibold text-charcoal">{t('design.livePreview')}</div>
                <div className="line-clamp-1 font-mono text-[11.5px] text-umber">{publicUrl(working.slug)}</div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <TouchSegmented<'desktop' | 'phone'>
                  size="sm"
                  value={device}
                  onChange={setDevice}
                  ariaLabel={t('design.previewDevice')}
                  options={[
                    { value: 'desktop', label: t('design.deviceDesktop'), icon: 'monitor' },
                    { value: 'phone', label: t('design.devicePhone'), icon: 'smartphone' },
                  ]}
                />
                <IconButton
                  icon={previewOpen ? 'chevronUp' : 'chevronDown'}
                  label={previewOpen ? t('design.hidePreview') : t('design.showPreview')}
                  aria-expanded={previewOpen}
                  className="min-h-10 min-w-10 sm:min-h-9 sm:min-w-9"
                  onClick={() => setPreviewOpen((v) => !v)}
                />
              </div>
            </div>

            {previewOpen ? (
              <div className={cx('bg-cream/50 p-2.5 sm:p-3', device === 'phone' && 'flex justify-center')}>
                {device === 'desktop' ? (
                  <BrowserFrame url={`${working.slug}.menucraft.com`}>
                    <ScaledFrame width={1440} maxHeight={isWide ? 620 : 380}>
                      <RestaurantSite restaurant={working} interactive={false} mode="preview" idPrefix="design-" />
                    </ScaledFrame>
                  </BrowserFrame>
                ) : (
                  <div className="w-full max-w-[300px] lg:max-w-[268px]">
                    <div className="overflow-hidden rounded-[26px] border-[7px] border-charcoal bg-charcoal shadow-[0_40px_80px_-40px_rgba(15,13,11,0.9)]">
                      <div className="overflow-hidden rounded-[20px] bg-white">
                        <ScaledFrame width={390} maxHeight={isWide ? 620 : 460}>
                          <RestaurantSite restaurant={working} interactive={false} mode="preview" idPrefix="design-p-" />
                        </ScaledFrame>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </Card>
        </div>

        {/* controls */}
        <Card className="p-4 sm:p-6 lg:col-start-1 lg:row-start-1">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <TouchSegmented<Tab>
              value={tab}
              onChange={setTab}
              ariaLabel={t('design.sectionsLabel')}
              options={TABS.map((item) => ({ value: item.id, label: t(item.labelKey), icon: item.icon }))}
            />
            <span className="text-[12px] text-clay">{t('design.draftHint')}</span>
          </div>

          {tab === 'identity' ? <BrandingPanel /> : null}
          {tab === 'colors' ? <ColorPanel /> : null}
          {tab === 'type' ? <TypographyPanel /> : null}

          <div className="mt-6 flex flex-col items-stretch gap-3 rounded-2xl border border-sand bg-cream/60 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[13px] leading-relaxed text-umber">{t('design.editorNote')}</p>
            <Button
              to="/dashboard/editor"
              size="sm"
              icon="layout"
              iconRight="arrowRight"
              className="min-h-10 w-full shrink-0 sm:min-h-9 sm:w-auto"
            >
              {t('design.openEditor')}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
