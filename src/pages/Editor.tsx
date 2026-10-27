import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon, Wordmark } from '../components/icons'
import { MenuEditor } from '../components/menu/MenuEditor'
import {
  BrandingPanel,
  ColorPanel,
  LayoutPanel,
  PanelBlock,
  PanelNote,
  SectionsPanel,
  TypographyPanel,
} from '../components/panels/DesignPanels'
import { BrowserFrame, ScaledFrame } from '../components/ScaledFrame'
import { RestaurantSite } from '../components/site/RestaurantSite'
import { Badge, Button, Field, IconButton, Input, Segmented, Toggle } from '../components/ui'
import { publicUrl } from '../lib/hooks'
import { getTemplate } from '../lib/templates'
import { cx } from '../lib/utils'
import { useStore } from '../store/useStore'

type PanelId = 'content' | 'menu' | 'colors' | 'type' | 'layout' | 'sections' | 'settings'
type Device = 'desktop' | 'phone'

const PANELS: Array<{ id: PanelId; label: string; icon: string; note: string }> = [
  { id: 'content', label: 'Content', icon: 'pencil', note: 'Name, story, photos & contact' },
  { id: 'menu', label: 'Menu', icon: 'utensils', note: 'Categories, dishes & prices' },
  { id: 'colors', label: 'Colors', icon: 'palette', note: 'Palettes and 7 custom slots' },
  { id: 'type', label: 'Typography', icon: 'type', note: 'Six fonts, scale & rhythm' },
  { id: 'layout', label: 'Layout', icon: 'layout', note: 'Header, hero, cards, spacing' },
  { id: 'sections', label: 'Sections', icon: 'sections', note: 'Show, hide & reorder blocks' },
  { id: 'settings', label: 'Settings', icon: 'settings', note: 'Address & publish state' },
]

export default function Editor() {
  const navigate = useNavigate()
  const draft = useStore((s) => s.draft)
  const dirty = useStore((s) => s.dirty)
  const past = useStore((s) => s.past)
  const future = useStore((s) => s.future)
  const beginEdit = useStore((s) => s.beginEdit)
  const undo = useStore((s) => s.undo)
  const redo = useStore((s) => s.redo)
  const saveDraft = useStore((s) => s.saveDraft)
  const publishDemo = useStore((s) => s.publishDemo)
  const resetDesign = useStore((s) => s.resetDesign)
  const discardDraft = useStore((s) => s.discardDraft)

  const [panel, setPanel] = useState<PanelId>('content')
  const [device, setDevice] = useState<Device>('desktop')
  const [expanded, setExpanded] = useState(false)
  const [mobileView, setMobileView] = useState<'controls' | 'preview'>('controls')

  useEffect(() => {
    if (!draft) beginEdit()
  }, [draft, beginEdit])

  /* unsaved-changes guard */
  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  /* keyboard shortcuts */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey
      if (!meta) return
      const key = e.key.toLowerCase()
      if (key === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      } else if (key === 'y') {
        e.preventDefault()
        redo()
      } else if (key === 's') {
        e.preventDefault()
        saveDraft()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo, saveDraft])

  if (!draft) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-ivory">
        <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-sand border-t-flame" />
        <p className="text-[14px] text-umber">Preparing your editor…</p>
      </div>
    )
  }

  const activeMeta = PANELS.find((p) => p.id === panel)!
  const template = getTemplate(draft.templateId)
  const width = device === 'desktop' ? 1440 : 390

  const previewToolbar = (
    <div className="flex items-center justify-between gap-3 border-b border-sand/80 bg-paper px-4 py-2.5">
      <div className="flex min-w-0 items-center gap-2">
        <Segmented<Device>
          size="sm"
          value={device}
          onChange={setDevice}
          ariaLabel="Preview device"
          options={[
            { value: 'desktop', label: 'Desktop', icon: 'monitor' },
            { value: 'phone', label: 'Phone', icon: 'smartphone' },
          ]}
        />
        <span className="hidden min-w-0 items-center gap-2 rounded-full border border-sand bg-cream px-3 py-1.5 md:flex">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-moss anim-pulse-dot" />
          <span className="line-clamp-1 font-mono text-[11.5px] text-umber">{publicUrl(draft.slug)}</span>
          <span className="shrink-0 text-[10.5px] uppercase tracking-wider text-clay">simulated</span>
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <span className="hidden text-[11.5px] text-clay lg:inline">
          {width}px · {dirty ? 'unsaved' : 'saved'}
        </span>
        <IconButton icon="external" label="Open published menu" size={16} onClick={() => navigate('/menu-demo')} />
        <IconButton
          icon={expanded ? 'minimize' : 'maximize'}
          label={expanded ? 'Exit full preview' : 'Expand preview'}
          size={16}
          onClick={() => setExpanded((v) => !v)}
        />
      </div>
    </div>
  )

  const previewBody = (
    <div className="min-h-0 flex-1 overflow-y-auto bg-cream/60 p-3 thin-scroll sm:p-5">
      {device === 'desktop' ? (
        <BrowserFrame url={`${draft.slug}.menucraft.com`} badge="Live">
          <ScaledFrame width={width}>
            <RestaurantSite restaurant={draft} interactive={false} mode="preview" idPrefix="ed-" />
          </ScaledFrame>
        </BrowserFrame>
      ) : (
        <div className="mx-auto w-[320px]">
          <div className="overflow-hidden rounded-[42px] border-[10px] border-[#15120f] bg-[#15120f] shadow-[0_50px_100px_-55px_rgba(15,13,11,0.9)]">
            <div className="relative overflow-hidden rounded-[32px] bg-white">
              <span className="absolute left-1/2 top-2 z-20 h-1.5 w-20 -translate-x-1/2 rounded-full bg-white/30" />
              <ScaledFrame width={width}>
                <RestaurantSite restaurant={draft} interactive={false} mode="preview" idPrefix="edm-" />
              </ScaledFrame>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-ivory">
      {/* -------------------------------- top bar ------------------------------- */}
      <header className="z-40 shrink-0 border-b border-sand bg-paper">
        <div className="flex h-[62px] items-center gap-3 px-3 sm:px-4">
          <IconButton icon="arrowLeft" label="Back to dashboard" onClick={() => navigate('/dashboard')} />
          <button type="button" onClick={() => navigate('/')} className="hidden shrink-0 md:block" aria-label="MenuCraft home">
            <Wordmark markSize={26} />
          </button>

          <div className="mx-1 hidden h-7 w-px bg-sand md:block" />

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              <span className="line-clamp-1 text-[14.5px] font-semibold text-charcoal">{draft.name}</span>
              <Badge tone="outline" className="hidden sm:inline-flex">
                {template.name}
              </Badge>
              {dirty ? (
                <Badge tone="gold" icon="pencil">
                  <span className="hidden sm:inline">Unsaved changes</span>
                  <span className="sm:hidden">Unsaved</span>
                </Badge>
              ) : (
                <Badge tone="moss" icon="check" className="hidden sm:inline-flex">
                  Saved
                </Badge>
              )}
            </div>
            <p className="hidden text-[11.5px] text-clay sm:line-clamp-1">
              Edits are local until you save or publish · ⌘S save · ⌘Z undo
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <IconButton icon="undo" label="Undo" size={16} className="hidden lg:inline-flex" disabled={past.length === 0} onClick={undo} />
            <IconButton icon="redo" label="Redo" size={16} className="hidden lg:inline-flex" disabled={future.length === 0} onClick={redo} />
            <span className="mx-1 hidden h-7 w-px bg-sand sm:block" />
            <Button
              size="sm"
              variant="ghost"
              className="hidden sm:inline-flex"
              icon="refresh"
              onClick={() => resetDesign()}
            >
              Reset design
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="hidden sm:inline-flex"
              disabled={!dirty}
              onClick={() => saveDraft()}
            >
              Save draft
            </Button>
            <Button size="sm" variant="accent" icon="send" onClick={() => publishDemo()}>
              <span className="hidden sm:inline">Publish demo</span>
              <span className="sm:hidden">Publish</span>
            </Button>
            <IconButton icon="trash" label="Discard unsaved changes" size={16} disabled={!dirty} onClick={() => discardDraft()} />
          </div>
        </div>

        {/* mobile: controls / preview switch */}
        <div className="flex items-center justify-between gap-3 border-t border-sand/70 px-3 py-2 lg:hidden">
          <Segmented<'controls' | 'preview'>
            size="sm"
            value={mobileView}
            onChange={setMobileView}
            ariaLabel="Editor view"
            options={[
              { value: 'controls', label: 'Controls', icon: 'settings' },
              { value: 'preview', label: 'Preview', icon: 'eye' },
            ]}
          />
          <div className="flex items-center gap-1.5 text-[11.5px] text-clay">
            <IconButton icon="undo" label="Undo" size={14} disabled={past.length === 0} onClick={undo} />
            <IconButton icon="redo" label="Redo" size={14} disabled={future.length === 0} onClick={redo} />
          </div>
        </div>
      </header>

      {/* --------------------------------- body -------------------------------- */}
      <div className="flex min-h-0 flex-1">
        {/* structure rail */}
        <nav
          className="hidden w-[228px] shrink-0 flex-col border-r border-sand bg-paper lg:flex"
          aria-label="Editor sections"
        >
          <div className="px-4 pb-2 pt-4">
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-clay">Editor</span>
          </div>
          <ul className="flex-1 space-y-1 overflow-y-auto px-2.5 pb-4 thin-scroll">
            {PANELS.map((item) => {
              const active = item.id === panel
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    aria-current={active ? 'page' : undefined}
                    onClick={() => setPanel(item.id)}
                    className={cx(
                      'flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition',
                      active
                        ? 'bg-charcoal text-ivory shadow-[0_14px_30px_-22px_rgba(27,23,20,0.95)]'
                        : 'text-espresso hover:bg-cream'
                    )}
                  >
                    <span className={cx('mt-0.5', active ? 'text-flame-light' : 'text-umber')}>
                      <Icon name={item.icon} size={16} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13.5px] font-medium">{item.label}</span>
                      <span className={cx('block text-[11.5px] leading-snug', active ? 'text-ivory/60' : 'text-clay')}>
                        {item.note}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>

          <div className="border-t border-sand p-3">
            <div className="rounded-xl bg-cream/70 p-3">
              <div className="flex items-center gap-2 text-[12px] font-medium text-espresso">
                <Icon name="info" size={13} className="text-flame" />
                Demo workspace
              </div>
              <p className="mt-1 text-[11.5px] leading-relaxed text-umber">
                Changes stay in this browser. Nothing is deployed to a real domain.
              </p>
            </div>
          </div>
        </nav>

        {/* controls column */}
        <section
          className={cx(
            'min-h-0 w-full shrink-0 flex-col overflow-hidden border-r border-sand bg-paper lg:w-[378px]',
            mobileView === 'controls' ? 'flex' : 'hidden',
            'lg:flex'
          )}
          aria-label={`${activeMeta.label} controls`}
        >
          <div className="shrink-0 border-b border-sand/80 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cream text-espresso">
                <Icon name={activeMeta.icon} size={16} />
              </span>
              <div className="min-w-0">
                <div className="line-clamp-1 text-[14px] font-semibold text-charcoal">{activeMeta.label}</div>
                <div className="line-clamp-1 text-[11.5px] text-clay">{activeMeta.note}</div>
              </div>
            </div>

            {/* horizontal panel switcher (small screens) */}
            <div className="mt-3 flex gap-1.5 overflow-x-auto no-scrollbar lg:hidden">
              {PANELS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPanel(item.id)}
                  aria-pressed={item.id === panel}
                  className={cx(
                    'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition',
                    item.id === panel
                      ? 'border-charcoal bg-charcoal text-ivory'
                      : 'border-sand text-umber hover:border-clay'
                  )}
                >
                  <Icon name={item.icon} size={13} />
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 thin-scroll">
            {panel === 'content' ? <BrandingPanel compact /> : null}
            {panel === 'menu' ? <MenuEditor compact /> : null}
            {panel === 'colors' ? <ColorPanel /> : null}
            {panel === 'type' ? <TypographyPanel /> : null}
            {panel === 'layout' ? <LayoutPanel /> : null}
            {panel === 'sections' ? <SectionsPanel /> : null}
            {panel === 'settings' ? <EditorSettings /> : null}
          </div>
        </section>

        {/* preview column */}
        <section
          className={cx(
            'min-h-0 min-w-0 flex-1 flex-col overflow-hidden',
            mobileView === 'preview' ? 'flex' : 'hidden',
            'lg:flex'
          )}
          aria-label="Live preview"
        >
          {previewToolbar}
          {previewBody}
          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-sand bg-paper px-4 py-2.5">
            <span className="hidden text-[11.5px] text-clay sm:inline">
              Preview updates as you type · same renderer as the published page
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" icon="refresh" onClick={() => resetDesign()}>
                Reset design
              </Button>
              <Button size="sm" variant="outline" icon="save" disabled={!dirty} onClick={() => saveDraft()}>
                Save draft
              </Button>
            </div>
          </div>
        </section>
      </div>

      {/* ------------------------------ full preview ---------------------------- */}
      {expanded ? (
        <div className="fixed inset-0 z-[80] flex flex-col bg-ink">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="line-clamp-1 text-[14.5px] font-semibold text-ivory">{draft.name}</span>
              <span className="hidden rounded-full bg-white/10 px-2.5 py-1 font-mono text-[11.5px] text-ivory/70 sm:inline">
                {publicUrl(draft.slug)}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Segmented<Device>
                size="sm"
                value={device}
                onChange={setDevice}
                ariaLabel="Preview device"
                options={[
                  { value: 'desktop', label: 'Desktop', icon: 'monitor' },
                  { value: 'phone', label: 'Phone', icon: 'smartphone' },
                ]}
              />
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-ivory transition hover:bg-white/20"
                aria-label="Close full preview"
                title="Close full preview"
              >
                <Icon name="x" size={17} />
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4 thin-scroll sm:p-6">
            {device === 'desktop' ? (
              <div className="mx-auto max-w-[1600px]">
                <ScaledFrame width={width}>
                  <RestaurantSite restaurant={draft} interactive={false} mode="preview" idPrefix="exp-" />
                </ScaledFrame>
              </div>
            ) : (
              <div className="mx-auto w-[390px]">
                <div className="overflow-hidden rounded-[42px] border-[10px] border-[#2b2622] bg-[#2b2622] shadow-[0_60px_120px_-60px_rgba(0,0,0,1)]">
                  <div className="relative overflow-hidden rounded-[32px] bg-white">
                    <ScaledFrame width={width}>
                      <RestaurantSite restaurant={draft} interactive={false} mode="preview" idPrefix="expp-" />
                    </ScaledFrame>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

/* ----------------------------- editor settings ---------------------------- */

function EditorSettings() {
  const draft = useStore((s) => s.draft)
  const updateDraft = useStore((s) => s.updateDraft)
  const showToast = useStore((s) => s.showToast)
  const [value, setValue] = useState(draft?.slug ?? '')

  if (!draft) return <PanelNote>Loading the working copy…</PanelNote>

  const valid = /^[a-z0-9-]{3,32}$/.test(value)

  return (
    <div className="space-y-6">
      <PanelBlock title="Public address" description="Simulated subdomain — DNS is never provisioned.">
        <Field label="Slug" hint={valid ? 'available' : '3–32 lowercase chars'}>
          <Input value={value} spellCheck={false} onChange={(e) => setValue(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} />
        </Field>
        <div className="rounded-xl border border-sand bg-cream/60 px-3.5 py-3">
          <span className="block font-mono text-[13px] text-charcoal">{value || draft.slug}.menucraft.com</span>
          <span className="mt-0.5 block text-[11.5px] text-clay">Label only — the domain does not resolve.</span>
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={!valid || value === draft.slug}
          onClick={() => {
            updateDraft((d) => {
              d.slug = value
            })
            showToast({ title: 'Address updated', message: `${value}.menucraft.com`, tone: 'success' })
          }}
        >
          Apply address
        </Button>
      </PanelBlock>

      <PanelBlock title="Publish state">
        <Toggle
          label="Published"
          description="Published menus appear on the public demo page"
          checked={draft.status === 'published'}
          onChange={(v) =>
            updateDraft((d) => {
              d.status = v ? 'published' : 'draft'
            })
          }
        />
        <div className="rounded-xl border border-sand bg-cream/50 p-3.5">
          <div className="text-[12.5px] font-medium text-espresso">Template in use</div>
          <div className="mt-0.5 text-[13px] text-charcoal">{getTemplate(draft.templateId).name}</div>
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-umber">
            Applying another template replaces the design but keeps the menu and content.
          </p>
          <Button size="sm" variant="ghost" icon="layers" className="mt-2" to="/dashboard/templates">
            Browse templates
          </Button>
        </div>
      </PanelBlock>

      <PanelBlock title="Quick facts">
        <ul className="space-y-2 text-[12.5px] text-umber">
          <li className="flex items-center justify-between gap-3 rounded-lg border border-sand px-3 py-2">
            <span>Categories</span>
            <strong className="text-charcoal">{draft.menu.length}</strong>
          </li>
          <li className="flex items-center justify-between gap-3 rounded-lg border border-sand px-3 py-2">
            <span>Dishes</span>
            <strong className="text-charcoal">{draft.menu.reduce((s, c) => s + c.items.length, 0)}</strong>
          </li>
          <li className="flex items-center justify-between gap-3 rounded-lg border border-sand px-3 py-2">
            <span>Sections enabled</span>
            <strong className="text-charcoal">
              {draft.design.sections.filter((s) => s.enabled).length}/{draft.design.sections.length}
            </strong>
          </li>
          <li className="flex items-center justify-between gap-3 rounded-lg border border-sand px-3 py-2">
            <span>Plan</span>
            <strong className="capitalize text-charcoal">{draft.plan}</strong>
          </li>
        </ul>
      </PanelBlock>
    </div>
  )
}
