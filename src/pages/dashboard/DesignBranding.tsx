import { useEffect, useState } from 'react'
import { BrowserFrame, ScaledFrame } from '../../components/ScaledFrame'
import { BrandingPanel, ColorPanel, TypographyPanel } from '../../components/panels/DesignPanels'
import { RestaurantSite } from '../../components/site/RestaurantSite'
import { Badge, Button, Card, Segmented } from '../../components/ui'
import { publicUrl } from '../../lib/hooks'
import { cx } from '../../lib/utils'
import { useActiveRestaurant, useStore } from '../../store/useStore'

type Tab = 'identity' | 'colors' | 'type'

const TABS: Array<{ id: Tab; label: string; icon: string }> = [
  { id: 'identity', label: 'Identity', icon: 'pencil' },
  { id: 'colors', label: 'Colors', icon: 'palette' },
  { id: 'type', label: 'Typography', icon: 'type' },
]

export default function DesignBranding() {
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
      title: 'Demo published',
      message: `${r.slug}.menucraft.com is showing your latest changes.`,
      tone: 'success',
    })
  }

  const [tab, setTab] = useState<Tab>('identity')
  const [device, setDevice] = useState<'desktop' | 'phone'>('desktop')

  const working = draft ?? r

  return (
    <div className="space-y-5">
      <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <h2 className="text-[16px] font-semibold text-charcoal">Brand kit for {r.name}</h2>
          <p className="mt-1 text-[13.5px] text-umber">
            Changes appear in the preview instantly and reach the public menu after you publish.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {dirty ? <Badge tone="gold" icon="pencil">Unsaved</Badge> : <Badge tone="moss" icon="check">Saved</Badge>}
          <Button size="sm" variant="ghost" disabled={!dirty} onClick={() => discardDraft()}>
            Discard
          </Button>
          <Button
            size="sm"
            variant="outline"
            icon="save"
            disabled={!dirty}
            onClick={() => saveDraft()}
          >
            Save draft
          </Button>
          <Button
            size="sm"
            icon="send"
            disabled={!dirty && r.status === 'published'}
            onClick={() => {
              if (draft) publishDemo()
              else {
                publishSaved()
              }
            }}
          >
            Publish demo
          </Button>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
        {/* controls */}
        <Card className="p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <Segmented<Tab>
              value={tab}
              onChange={setTab}
              ariaLabel="Design sections"
              options={TABS.map((t) => ({ value: t.id, label: t.label, icon: t.icon }))}
            />
            <span className="text-[12px] text-clay">Working on the draft copy</span>
          </div>

          {tab === 'identity' ? <BrandingPanel /> : null}
          {tab === 'colors' ? <ColorPanel /> : null}
          {tab === 'type' ? <TypographyPanel /> : null}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sand bg-cream/60 p-4">
            <p className="text-[13px] leading-relaxed text-umber">
              Need layout, sections and menu edits too? The full editor has everything in one place.
            </p>
            <Button to="/dashboard/editor" size="sm" icon="layout" iconRight="arrowRight">
              Open full editor
            </Button>
          </div>
        </Card>

        {/* live preview */}
        <div className="lg:sticky lg:top-[92px] lg:self-start">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-sand/80 px-4 py-3">
              <div className="min-w-0">
                <div className="line-clamp-1 text-[13px] font-semibold text-charcoal">Live preview</div>
                <div className="line-clamp-1 font-mono text-[11.5px] text-umber">{publicUrl(working.slug)}</div>
              </div>
              <Segmented<'desktop' | 'phone'>
                size="sm"
                value={device}
                onChange={setDevice}
                ariaLabel="Preview device"
                options={[
                  { value: 'desktop', label: 'Desktop', icon: 'monitor' },
                  { value: 'phone', label: 'Phone', icon: 'smartphone' },
                ]}
              />
            </div>

            <div className={cx('bg-cream/50 p-3', device === 'phone' && 'flex justify-center')}>
              {device === 'desktop' ? (
                <BrowserFrame url={`${working.slug}.menucraft.com`}>
                  <ScaledFrame width={1440} maxHeight={620}>
                    <RestaurantSite restaurant={working} interactive={false} mode="preview" idPrefix="design-" />
                  </ScaledFrame>
                </BrowserFrame>
              ) : (
                <div className="w-[268px]">
                  <div className="overflow-hidden rounded-[26px] border-[7px] border-charcoal bg-charcoal shadow-[0_40px_80px_-40px_rgba(15,13,11,0.9)]">
                    <div className="overflow-hidden rounded-[20px] bg-white">
                      <ScaledFrame width={390} maxHeight={620}>
                        <RestaurantSite restaurant={working} interactive={false} mode="preview" idPrefix="design-p-" />
                      </ScaledFrame>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
