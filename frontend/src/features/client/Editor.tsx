import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon, Wordmark } from '../../shared/ui/icons.tsx'
import { MenuEditor } from './menu/MenuEditor.tsx'
import {
  BrandingPanel,
  ColorPanel,
  LayoutPanel,
  PanelBlock,
  PanelNote,
  SectionsPanel,
  TypographyPanel,
} from './design/DesignPanels.tsx'
import { BrowserFrame, ScaledFrame } from '../../shared/ui/ScaledFrame.tsx'
import { RestaurantSite } from '../../templates/site/RestaurantSite.tsx'
import { setByPath, type ActiveField } from '../../templates/editor/inlineEdit.tsx'
import { InlineToolbar } from './editor/InlineToolbar.tsx'
import type { InlineTextStyle } from '../../shared/lib/types.ts'
import { Badge, Button, Field, IconButton, Input, Segmented, Toggle } from '../../shared/ui/ui.tsx'
import { publicUrl } from '../../shared/lib/hooks.ts'
import { getTemplate } from '../../templates/data/templates.ts'
import { cx } from '../../shared/lib/utils.ts'
import { useStore } from '../../shared/store/useStore.ts'
import { useAuthStore } from '../../shared/store/useAuth.ts'
import { useSubscription } from '../../shared/store/usePlatform.ts'
import { useI18n, type TKey } from '../../shared/i18n'
import { PricingBubble } from './billing/PricingBubble.tsx'
import { SubscribeModal } from './billing/SubscribeModal.tsx'
import { AuthModal } from './billing/AuthModal.tsx'

type PanelId = 'content' | 'menu' | 'colors' | 'type' | 'layout' | 'sections' | 'settings'
type Device = 'desktop' | 'phone'

const PANELS: Array<{ id: PanelId; labelKey: TKey; icon: string; noteKey: TKey }> = [
  { id: 'content', labelKey: 'editor.content', icon: 'pencil', noteKey: 'editor.panels.contentNote' },
  { id: 'menu', labelKey: 'editor.panels.menu', icon: 'utensils', noteKey: 'editor.panels.menuNote' },
  { id: 'colors', labelKey: 'editor.colors', icon: 'palette', noteKey: 'editor.panels.colorsNote' },
  { id: 'type', labelKey: 'editor.typography', icon: 'type', noteKey: 'editor.panels.typographyNote' },
  { id: 'layout', labelKey: 'editor.layout', icon: 'layout', noteKey: 'editor.panels.layoutNote' },
  { id: 'sections', labelKey: 'editor.sections', icon: 'sections', noteKey: 'editor.panels.sectionsNote' },
  { id: 'settings', labelKey: 'editor.panels.settings', icon: 'settings', noteKey: 'editor.panels.settingsNote' },
]

export default function Editor() {
  const navigate = useNavigate()
  const { t } = useI18n()
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

  /* subscription gating -------------------------------------------------- */
  const session = useAuthStore((s) => s.session)
  const sub = useSubscription(draft?.id ?? '')
  const live = Boolean(sub && sub.status !== 'expired')
  const expired = sub?.status === 'expired'
  const [subscribeOpen, setSubscribeOpen] = useState(false)
  const [subscribeFromPublish, setSubscribeFromPublish] = useState(false)
  const [gateOpen, setGateOpen] = useState(false)

  const [panel, setPanel] = useState<PanelId>('content')
  const [device, setDevice] = useState<Device>('desktop')
  const [expanded, setExpanded] = useState(false)
  const [mobileView, setMobileView] = useState<'controls' | 'preview'>('controls')

  /* Elementor-style in-place editing ------------------------------------- */
  const updateDraft = useStore((s) => s.updateDraft)
  const [activeField, setActiveField] = useState<ActiveField | null>(null)

  const handleActiveChange = useCallback((field: ActiveField | null) => setActiveField(field), [])

  const handleCommit = useCallback(
    (path: string, value: string) => {
      updateDraft((d) => {
        if (path.startsWith('copy.')) {
          d.copy = { ...(d.copy ?? {}), [path]: value }
          return
        }
        setByPath(d, path, value)
      })
    },
    [updateDraft]
  )

  const handleStyle = useCallback(
    (path: string, patch: InlineTextStyle | null) => {
      updateDraft((d) => {
        const next = { ...(d.inline ?? {}) }
        if (patch === null) delete next[path]
        else next[path] = { ...(next[path] ?? {}), ...patch }
        d.inline = next
      })
    },
    [updateDraft]
  )

  useEffect(() => {
    if (!draft) beginEdit()
  }, [draft, beginEdit])

  /* publish is gated: session → live subscription → publish */
  const requestPublish = useCallback(() => {
    if (!session) {
      setGateOpen(true)
      return
    }
    if (!live) {
      setSubscribeFromPublish(true)
      setSubscribeOpen(true)
      return
    }
    publishDemo()
  }, [session, live, publishDemo])

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
        <p className="text-[14px] text-umber">{t('editor.preparing')}</p>
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
          ariaLabel={t('editor.previewDevice')}
          options={[
            { value: 'desktop', label: t('editor.desktop'), icon: 'monitor' },
            { value: 'phone', label: t('editor.phone'), icon: 'smartphone' },
          ]}
        />
        <span className="hidden min-w-0 items-center gap-2 rounded-full border border-sand bg-cream px-3 py-1.5 md:flex">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-moss anim-pulse-dot" />
          <span className="line-clamp-1 font-mono text-[11.5px] text-umber">{publicUrl(draft.slug)}</span>
          <span className="shrink-0 text-[10.5px] uppercase tracking-wider text-clay">
            {t('editor.simulated')}
          </span>
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <span className="hidden text-[11.5px] text-clay lg:inline">
          {width}px · {t(dirty ? 'editor.unsavedShort' : 'editor.saved')}
        </span>
        <IconButton
          icon="external"
          label={t('editor.openPublished')}
          size={16}
          onClick={() => navigate('/menu-demo')}
        />
        <IconButton
          icon={expanded ? 'minimize' : 'maximize'}
          label={expanded ? t('editor.collapse') : t('editor.expand')}
          size={16}
          onClick={() => setExpanded((v) => !v)}
        />
      </div>
    </div>
  )

  const previewBody = (
    <div className="min-h-0 flex-1 overflow-y-auto bg-cream/60 p-3 thin-scroll sm:p-5">
      {device === 'desktop' ? (
        <BrowserFrame url={`${draft.slug}.menucraft.com`} badge={t('editor.liveBadge')}>
          <ScaledFrame width={width}>
            <RestaurantSite
              restaurant={draft}
              interactive={false}
              mode="preview"
              idPrefix="ed-"
              editable
              onActiveChange={handleActiveChange}
              onCommit={handleCommit}
              onStyle={handleStyle}
            />
          </ScaledFrame>
        </BrowserFrame>
      ) : (
        <div className="mx-auto w-[320px]">
          <div className="overflow-hidden rounded-[42px] border-[10px] border-[#15120f] bg-[#15120f] shadow-[0_50px_100px_-55px_rgba(15,13,11,0.9)]">
            <div className="relative overflow-hidden rounded-[32px] bg-white">
              <span className="absolute start-1/2 top-2 z-20 h-1.5 w-20 -translate-x-1/2 rounded-full bg-white/30 rtl:translate-x-1/2" />
              <ScaledFrame width={width}>
                <RestaurantSite restaurant={draft} interactive={false} mode="preview" idPrefix="edm-" editable onActiveChange={handleActiveChange} onCommit={handleCommit} onStyle={handleStyle} />
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
          <IconButton
            icon="arrowLeft"
            label={t('web.demo.backDashAria')}
            onClick={() => navigate('/dashboard')}
          />
          <button type="button" onClick={() => navigate('/')} className="hidden shrink-0 md:block" aria-label={t('web.header.homeAria')}>
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
                  <span className="hidden sm:inline">{t('editor.unsaved')}</span>
                  <span className="sm:hidden">{t('editor.unsavedShort')}</span>
                </Badge>
              ) : (
                <Badge tone="moss" icon="check" className="hidden sm:inline-flex">
                  {t('editor.saved')}
                </Badge>
              )}
            </div>
            <p className="hidden text-[11.5px] text-clay sm:line-clamp-1">
              {t('editor.localHint')}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <IconButton icon="undo" label={t('editor.undo')} size={16} className="hidden lg:inline-flex" disabled={past.length === 0} onClick={undo} />
            <IconButton icon="redo" label={t('editor.redo')} size={16} className="hidden lg:inline-flex" disabled={future.length === 0} onClick={redo} />
            <span className="mx-1 hidden h-7 w-px bg-sand sm:block" />
            <Button
              size="sm"
              variant="ghost"
              className="hidden sm:inline-flex"
              icon="refresh"
              onClick={() => resetDesign()}
            >
              {t('editor.reset')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="hidden sm:inline-flex"
              disabled={!dirty}
              onClick={() => saveDraft()}
            >
              {t('editor.saveDraft')}
            </Button>
            <Button size="sm" variant="accent" icon="send" onClick={() => requestPublish()}>
              <span className="hidden sm:inline">{t('web.demo.publishDemo')}</span>
              <span className="sm:hidden">{t('editor.publishShort')}</span>
            </Button>
            <IconButton
              icon="trash"
              label={t('editor.discard')}
              size={16}
              disabled={!dirty}
              onClick={() => discardDraft()}
            />
          </div>
        </div>

        {/* mobile: controls / preview switch */}
        <div className="flex items-center justify-between gap-3 border-t border-sand/70 px-3 py-2 lg:hidden">
          <Segmented<'controls' | 'preview'>
            size="sm"
            value={mobileView}
            onChange={setMobileView}
            ariaLabel={t('editor.editorView')}
            options={[
              { value: 'controls', label: t('editor.controls'), icon: 'settings' },
              { value: 'preview', label: t('editor.preview'), icon: 'eye' },
            ]}
          />
          <div className="flex items-center gap-1.5 text-[11.5px] text-clay">
            <IconButton icon="undo" label={t('editor.undo')} size={14} disabled={past.length === 0} onClick={undo} />
            <IconButton icon="redo" label={t('editor.redo')} size={14} disabled={future.length === 0} onClick={redo} />
          </div>
        </div>
      </header>

      {/* ------------------------- expired subscription ------------------------ */}
      {expired ? (
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-rose/30 bg-rose/10 px-4 py-2.5">
          <span className="flex items-center gap-2 text-[13px] font-medium text-rose">
            <Icon name="alert" size={15} className="shrink-0" />
            {t('flow.expiredNotice')}
          </span>
          <Button size="sm" variant="danger" icon="refresh" onClick={() => navigate('/dashboard/subscription')}>
            {t('subscription.renew')}
          </Button>
        </div>
      ) : null}

      {/* --------------------------------- body -------------------------------- */}
      <div className="flex min-h-0 flex-1">
        {/* structure rail */}
        <nav
          className="hidden w-[228px] shrink-0 flex-col border-e border-sand bg-paper lg:flex"
          aria-label={t('editor.railAria')}
        >
          <div className="px-4 pb-2 pt-4">
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-clay">
              {t('editor.railTitle')}
            </span>
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
                      'flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-start transition',
                      active
                        ? 'bg-charcoal text-ivory shadow-[0_14px_30px_-22px_rgba(27,23,20,0.95)]'
                        : 'text-espresso hover:bg-cream'
                    )}
                  >
                    <span className={cx('mt-0.5', active ? 'text-flame-light' : 'text-umber')}>
                      <Icon name={item.icon} size={16} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13.5px] font-medium">{t(item.labelKey)}</span>
                      <span className={cx('block text-[11.5px] leading-snug', active ? 'text-ivory/60' : 'text-clay')}>
                        {t(item.noteKey)}
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
                {t('editor.demoWorkspace')}
              </div>
              <p className="mt-1 text-[11.5px] leading-relaxed text-umber">
                {t('editor.demoWorkspaceNote')}
              </p>
            </div>
          </div>
        </nav>

        {/* controls column */}
        <section
          className={cx(
            'min-h-0 w-full shrink-0 flex-col overflow-hidden border-e border-sand bg-paper lg:w-[378px]',
            mobileView === 'controls' ? 'flex' : 'hidden',
            'lg:flex'
          )}
          aria-label={t('editor.panelControls', { panel: t(activeMeta.labelKey) })}
        >
          <div className="shrink-0 border-b border-sand/80 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cream text-espresso">
                <Icon name={activeMeta.icon} size={16} />
              </span>
              <div className="min-w-0">
                <div className="line-clamp-1 text-[14px] font-semibold text-charcoal">
                  {t(activeMeta.labelKey)}
                </div>
                <div className="line-clamp-1 text-[11.5px] text-clay">{t(activeMeta.noteKey)}</div>
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
                  {t(item.labelKey)}
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
            {panel === 'settings' ? (
              <EditorSettings canPublish={Boolean(session) && live} onBlockedPublish={requestPublish} />
            ) : null}
          </div>
        </section>

        {/* preview column */}
        <section
          className={cx(
            'min-h-0 min-w-0 flex-1 flex-col overflow-hidden',
            mobileView === 'preview' ? 'flex' : 'hidden',
            'lg:flex'
          )}
          aria-label={t('editor.livePreview')}
        >
          {previewToolbar}
          {previewBody}
          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-sand bg-paper px-4 py-2.5">
            <span className="hidden text-[11.5px] text-clay sm:inline">
              {t('editor.previewHint')}
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" icon="refresh" onClick={() => resetDesign()}>
                {t('editor.reset')}
              </Button>
              <Button size="sm" variant="outline" icon="save" disabled={!dirty} onClick={() => saveDraft()}>
                {t('editor.saveDraft')}
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
                ariaLabel={t('editor.previewDevice')}
                options={[
                  { value: 'desktop', label: t('editor.desktop'), icon: 'monitor' },
                  { value: 'phone', label: t('editor.phone'), icon: 'smartphone' },
                ]}
              />
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-ivory transition hover:bg-white/20"
                aria-label={t('editor.collapse')}
                title={t('editor.collapse')}
              >
                <Icon name="x" size={17} />
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4 thin-scroll sm:p-6">
            {device === 'desktop' ? (
              <div className="mx-auto max-w-[1600px]">
                <ScaledFrame width={width}>
                  <RestaurantSite restaurant={draft} interactive={false} mode="preview" idPrefix="exp-" editable onActiveChange={handleActiveChange} onCommit={handleCommit} onStyle={handleStyle} />
                </ScaledFrame>
              </div>
            ) : (
              <div className="mx-auto w-[390px]">
                <div className="overflow-hidden rounded-[42px] border-[10px] border-[#2b2622] bg-[#2b2622] shadow-[0_60px_120px_-60px_rgba(0,0,0,1)]">
                  <div className="relative overflow-hidden rounded-[32px] bg-white">
                    <ScaledFrame width={width}>
                      <RestaurantSite restaurant={draft} interactive={false} mode="preview" idPrefix="expp-" editable onActiveChange={handleActiveChange} onCommit={handleCommit} onStyle={handleStyle} />
                    </ScaledFrame>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* ------------------------- inline edit toolbar ------------------------- */}
      <InlineToolbar
        field={activeField}
        style={activeField ? draft.inline?.[activeField.path] : undefined}
        colors={[
          draft.design.colors.text,
          draft.design.colors.primary,
          draft.design.colors.accent,
          draft.design.colors.button,
        ]}
        onStyle={handleStyle}
        onCommit={handleCommit}
        onClear={() => setActiveField(null)}
      />

      {/* --------------------- pricing bubble + subscribe gate ----------------- */}
      {!live && draft.name.trim() ? (
        <PricingBubble
          slug={draft.slug}
          onSubscribe={() => {
            setSubscribeFromPublish(false)
            setSubscribeOpen(true)
          }}
        />
      ) : null}

      <SubscribeModal
        open={subscribeOpen}
        onClose={() => setSubscribeOpen(false)}
        restaurantId={draft.id}
        restaurantName={draft.name}
        onSuccess={subscribeFromPublish ? () => publishDemo() : undefined}
      />

      <AuthModal
        open={gateOpen}
        onClose={() => setGateOpen(false)}
        restaurantName={draft.name}
        onSuccess={() => publishDemo()}
      />
    </div>
  )
}

/* ----------------------------- editor settings ---------------------------- */

function EditorSettings({
  canPublish,
  onBlockedPublish,
}: {
  canPublish: boolean
  onBlockedPublish: () => void
}) {
  const { t } = useI18n()
  const draft = useStore((s) => s.draft)
  const updateDraft = useStore((s) => s.updateDraft)
  const showToast = useStore((s) => s.showToast)
  const [value, setValue] = useState(draft?.slug ?? '')

  if (!draft) return <PanelNote>{t('editor.settings.loading')}</PanelNote>

  const valid = /^[a-z0-9-]{3,32}$/.test(value)

  return (
    <div className="space-y-6">
      <PanelBlock
        title={t('editor.publicAddress')}
        description={t('editor.settings.publicDesc')}
      >
        <Field
          label={t('editor.settings.slug')}
          hint={valid ? t('editor.settings.slugOk') : t('editor.settings.slugHint')}
        >
          <Input value={value} spellCheck={false} onChange={(e) => setValue(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} />
        </Field>
        <div className="rounded-xl border border-sand bg-cream/60 px-3.5 py-3">
          <span className="block font-mono text-[13px] text-charcoal">{value || draft.slug}.menucraft.com</span>
          <span className="mt-0.5 block text-[11.5px] text-clay">
            {t('editor.settings.domainNote')}
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={!valid || value === draft.slug}
          onClick={() => {
            updateDraft((d) => {
              d.slug = value
            })
            showToast({
              title: t('editor.settings.addressUpdated'),
              message: `${value}.menucraft.com`,
              tone: 'success',
            })
          }}
        >
          {t('editor.settings.applyAddress')}
        </Button>
      </PanelBlock>

      <PanelBlock title={t('editor.settings.publishState')}>
        <Toggle
          label={t('editor.settings.published')}
          description={t('editor.settings.publishedDesc')}
          checked={draft.status === 'published'}
          onChange={(v) => {
            // publishing is gated the same way as the top-bar button:
            // no session or no live subscription → open the flow instead
            if (v && !canPublish) {
              onBlockedPublish()
              return
            }
            updateDraft((d) => {
              d.status = v ? 'published' : 'draft'
            })
          }}
        />
        {!canPublish ? (
          <p className="flex items-start gap-2 rounded-xl border border-gold/35 bg-gold/10 px-3.5 py-2.5 text-[12px] leading-relaxed text-gold">
            <Icon name="info" size={14} className="mt-0.5 shrink-0" />
            {t('flow.publishNeedsPlan')}
          </p>
        ) : null}
        <div className="rounded-xl border border-sand bg-cream/50 p-3.5">
          <div className="text-[12.5px] font-medium text-espresso">
            {t('editor.settings.templateUse')}
          </div>
          <div className="mt-0.5 text-[13px] text-charcoal">{getTemplate(draft.templateId).name}</div>
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-umber">
            {t('editor.settings.templateKeep')}
          </p>
          <Button size="sm" variant="ghost" icon="layers" className="mt-2" to="/dashboard/templates">
            {t('editor.settings.browseTemplates')}
          </Button>
        </div>
      </PanelBlock>

      <PanelBlock title={t('editor.settings.quickFacts')}>
        <ul className="space-y-2 text-[12.5px] text-umber">
          <li className="flex items-center justify-between gap-3 rounded-lg border border-sand px-3 py-2">
            <span>{t('editor.settings.factCategories')}</span>
            <strong className="text-charcoal">{draft.menu.length}</strong>
          </li>
          <li className="flex items-center justify-between gap-3 rounded-lg border border-sand px-3 py-2">
            <span>{t('editor.settings.factDishes')}</span>
            <strong className="text-charcoal">{draft.menu.reduce((s, c) => s + c.items.length, 0)}</strong>
          </li>
          <li className="flex items-center justify-between gap-3 rounded-lg border border-sand px-3 py-2">
            <span>{t('editor.settings.factSections')}</span>
            <strong className="text-charcoal">
              {draft.design.sections.filter((s) => s.enabled).length}/{draft.design.sections.length}
            </strong>
          </li>
          <li className="flex items-center justify-between gap-3 rounded-lg border border-sand px-3 py-2">
            <span>{t('editor.settings.factPlan')}</span>
            <strong className="capitalize text-charcoal">{draft.plan}</strong>
          </li>
        </ul>
      </PanelBlock>
    </div>
  )
}
