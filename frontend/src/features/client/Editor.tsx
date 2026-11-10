import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Icon } from '../../shared/ui/icons.tsx'
import { MenuEditor } from './menu/MenuEditor.tsx'
import { RestaurantSite } from '../../templates/site/RestaurantSite.tsx'
import { setByPath, type ActiveField } from '../../templates/editor/inlineEdit.tsx'
import { InlineToolbar } from './editor/InlineToolbar.tsx'
import { ColorSidebar } from './FullscreenEditorColorSidebar.tsx'
import { Button } from '../../shared/ui/ui.tsx'
import { getTemplate } from '../../templates/data/templates.ts'
import { cx, tx } from '../../shared/lib/utils.ts'
import { isSubscriptionActive, type InlineTextStyle } from '../../shared/lib/types.ts'
import { useStore } from '../../shared/store/useStore.ts'
import { useAuthStore } from '../../shared/store/useAuth.ts'
import { useBackendAuth } from '../../shared/store/useBackendAuth.ts'
import { usePlatformStore, useSubscription } from '../../shared/store/usePlatform.ts'
import { useI18n } from '../../shared/i18n'
import { PricingBubble } from './billing/PricingBubble.tsx'
import { SubscribeModal } from './billing/SubscribeModal.tsx'
import { AuthModal } from './billing/AuthModal.tsx'

/* ------------------------------------------------------------------ *
 * المحرر — الموقع نفسه بملء الشاشة، بدون أي أشرطة تحرير.
 * كل شيء يُعدَّل بالضغط عليه مباشرة داخل الموقع:
 *   نصوص + صور + أسعار + المنيو (إضافة/حذف أصناف وفئات)
 * سايدبار جانبي بأزرار الألوان (بوردر، خلفية، خطوط…) وتبويب منيو احتياطي.
 * الحفظ تلقائي (pushSiteConfig بعد 1.5 ث من آخر تعديل) + Ctrl/Cmd+S للحفظ اليدوي.
 * زرار Publish بارز دائمًا أعلى الشاشة.
 * ------------------------------------------------------------------ */

type SideTab = 'colors' | 'menu'

export default function Editor() {
  const navigate = useNavigate()
  const { t, lang } = useI18n()
  const draft = useStore((s) => s.draft)
  const dirty = useStore((s) => s.dirty)
  const past = useStore((s) => s.past)
  const future = useStore((s) => s.future)
  const beginEdit = useStore((s) => s.beginEdit)
  const undo = useStore((s) => s.undo)
  const redo = useStore((s) => s.redo)
  const saveDraft = useStore((s) => s.saveDraft)
  const publishDemo = useStore((s) => s.publishDemo)
  const updateDraft = useStore((s) => s.updateDraft)

  const session = useAuthStore((s) => s.session)
  // الاشتراك يُطلب بـ backend restaurant_id (الـ id المحلي rst-... يرد 403)
  const backendRid = useBackendAuth((s) => s.user?.restaurant_id || s.user?.restaurantId || '')
  const subId = backendRid || draft?.id || ''
  const sub = useSubscription(subId)
  const live = isSubscriptionActive(sub?.status)
  const suspended = Boolean(sub && !isSubscriptionActive(sub.status))
  const [subscribeOpen, setSubscribeOpen] = useState(false)
  const [subscribeFromPublish, setSubscribeFromPublish] = useState(false)
  const [gateOpen, setGateOpen] = useState(false)

  // حالة الاشتراك تُقرأ من السيرفر — بدونها يظن المحرر أن الموقع منشور وهو ليس كذلك
  const fetchSubscription = usePlatformStore((s) => s.fetchSubscription)
  const loadDraftFromBackend = useStore((s) => s.loadDraftFromBackend)
  const backendUserForEditor = useBackendAuth((s) => s.user)
  useEffect(() => {
    if (backendUserForEditor && draft?.id) {
      void loadDraftFromBackend();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backendUserForEditor?.restaurant_id, draft?.id]);
  useEffect(() => {
    if (session && subId) {
      fetchSubscription(subId)
    }
  }, [session, subId, fetchSubscription])

  /* تبويب السايدبار + الدرج المنزلق على الشاشات الصغيرة */
  const [sideTab, setSideTab] = useState<SideTab>('colors')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [searchParams] = useSearchParams()

  /* Elementor-style in-place editing ------------------------------------- */
  const [activeField, setActiveField] = useState<ActiveField | null>(null)

  const handleActiveChange = useCallback((field: ActiveField | null) => setActiveField(field), [])

  const handleCommit = useCallback(
    (path: string, value: string) => {
      updateDraft((d) => {
        if (path.startsWith('copy.')) {
          d.copy = { ...(d.copy ?? {}), [path]: value }
          return
        }
        // setByPath تُرجع كائناً جديداً (immutable) — يجب تطبيق النتيجة
        // على الـ draft وإلا لا يتغيّر أي شيء (كان يبدو "لا تُقبل الصورة")
        Object.assign(d, setByPath(d, path, value))
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
    const apply = searchParams.get('apply') === '1'
    const templateId = searchParams.get('templateId')
    if (apply && templateId && draft?.templateId !== templateId) {
      beginEdit(templateId)
      return
    }
    if (!draft) {
      if (templateId) {
        beginEdit(templateId)
      } else {
        beginEdit()
      }
    }
  }, [draft, beginEdit, searchParams])

  const backendStatus = useBackendAuth((s) => s.status)
  const backendUser = useBackendAuth((s) => s.user)
  /* publish is gated: session → live subscription → publish */
  const isGuest = !session && !(backendStatus === 'ready' && backendUser)
  const requestPublish = useCallback(() => {
    if (isGuest) {
      setGateOpen(true)
      return
    }
    if (!live) {
      setSubscribeFromPublish(true)
      setSubscribeOpen(true)
      return
    }
    publishDemo()
  }, [isGuest, live, publishDemo])

  /* unsaved-changes guard — الحفظ التلقائي يحفظ على السيرفر كل 1.5 ث تلقائيًا */
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

  const template = getTemplate(draft.templateId)

  /* --------------------------- السايدبار الجانبي --------------------------- */
  const sideContent = (
    <div className="flex min-h-0 flex-1 flex-col bg-ink">
      <div className="flex shrink-0 items-center gap-1.5 border-b border-white/10 px-3 py-3">
        {([
          { id: 'colors' as SideTab, icon: 'palette', label: t('editor.colors') },
          { id: 'menu' as SideTab, icon: 'utensils', label: t('editor.panels.menu') },
        ]).map((tab) => (
          <button
            key={tab.id}
            type="button"
            aria-pressed={sideTab === tab.id}
            onClick={() => setSideTab(tab.id)}
            className={cx(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition',
              sideTab === tab.id
                ? 'border-flame bg-flame text-white'
                : 'border-white/15 text-ivory/70 hover:border-white/30 hover:text-ivory'
            )}
          >
            <Icon name={tab.icon} size={14} />
            {tab.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setDrawerOpen(false)}
          className="ms-auto flex h-9 w-9 items-center justify-center rounded-full text-ivory/70 transition hover:bg-white/10 hover:text-ivory lg:hidden"
          aria-label={t('editor.collapse')}
          title={t('editor.collapse')}
        >
          <Icon name="x" size={17} />
        </button>
      </div>

      <p className="shrink-0 border-b border-white/10 bg-white/5 px-3.5 py-2.5 text-[11.5px] leading-relaxed text-ivory/70">
        <Icon name="info" size={13} className="me-1.5 inline text-flame" />
        {t('editor.inlineEditHint')}
      </p>

      <div className="min-h-0 flex-1">
        {sideTab === 'colors' ? (
          <ColorSidebar draft={draft} updateDraft={updateDraft} template={template} />
        ) : (
          <div className="h-full overflow-y-auto p-3 thin-scroll">
            <div className="rounded-xl bg-paper p-3 shadow-[0_20px_50px_-35px_rgba(0,0,0,0.9)]">
              <MenuEditor compact />
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-cream/60">
      {/* ------------------------- الموقع بملء الشاشة ------------------------- */}
      <div className="relative min-w-0 flex-1">
        {/* الموقع نفسه — بالشكل المناسب للجهاز (responsive) */}
        <div className="absolute inset-0 overflow-y-auto thin-scroll">
          <RestaurantSite
            restaurant={draft}
            interactive={false}
            mode="preview"
            idPrefix="ed-"
            editable
            onActiveChange={handleActiveChange}
            onCommit={handleCommit}
            onStyle={handleStyle}
            onMenuEdit={(recipe) => updateDraft(recipe)}
          />
        </div>

        {/* الحافة العلوية — زرار الرجوع + زرار النشر + حالة الحفظ */}
        <div className="pointer-events-none absolute start-2.5 top-2.5 z-[60] flex items-center gap-2 sm:start-3.5 sm:top-3.5">
          <button
            type="button"
            onClick={() => navigate(isGuest ? '/templates' : '/dashboard')}
            className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-paper/90 text-espresso shadow-[0_10px_30px_-12px_rgba(0,0,0,0.45)] backdrop-blur transition hover:bg-paper"
            aria-label={t('web.demo.backDashAria')}
            title={t('web.demo.backDashAria')}
          >
            <Icon name="arrowLeft" size={19} />
          </button>
          {/* النشر جنب زرار الرجوع — أهم زر في الصفحة */}
          <Button
            size="md"
            variant="accent"
            icon="send"
            className="pointer-events-auto h-11 rounded-full px-5 text-[14px] shadow-[0_18px_40px_-18px_rgba(232,87,31,0.8)]"
            onClick={() => requestPublish()}
          >
            <span className="hidden sm:inline">{t('web.demo.publishDemo')}</span>
            <span className="sm:hidden">{t('editor.publishShort')}</span>
          </Button>
          <div className="pointer-events-auto hidden h-11 items-center gap-2.5 rounded-full border border-black/10 bg-paper/90 px-3.5 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.45)] backdrop-blur lg:flex">
            <span className="line-clamp-1 max-w-[110px] text-[13px] font-semibold text-charcoal sm:max-w-[210px]">
              {tx(draft.name, lang)}
            </span>
            <span className="hidden h-4 w-px bg-sand sm:block" />
            {dirty ? (
              <span className="flex items-center gap-1.5 text-[11.5px] font-medium text-gold">
                <Icon name="pencil" size={12} />
                {t('editor.unsaved')}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[11.5px] font-medium text-moss">
                <Icon name="check" size={12} />
                {t('editor.saved')}
              </span>
            )}
          </div>
        </div>

        {/* الحافة العلوية — تراجع/تقديم (يمين) */}
        <div className="pointer-events-none absolute end-2.5 top-2.5 z-[60] flex items-center gap-2 sm:end-3.5 sm:top-3.5">
          <button
            type="button"
            onClick={undo}
            disabled={past.length === 0}
            className="pointer-events-auto hidden h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-paper/90 text-espresso shadow-[0_10px_30px_-12px_rgba(0,0,0,0.45)] backdrop-blur transition enabled:hover:bg-paper disabled:opacity-35 lg:flex"
            aria-label={t('editor.undo')}
            title={t('editor.undo')}
          >
            <Icon name="undo" size={17} />
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={future.length === 0}
            className="pointer-events-auto hidden h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-paper/90 text-espresso shadow-[0_10px_30px_-12px_rgba(0,0,0,0.45)] backdrop-blur transition enabled:hover:bg-paper disabled:opacity-35 lg:flex"
            aria-label={t('editor.redo')}
            title={t('editor.redo')}
          >
            <Icon name="redo" size={17} />
          </button>
        </div>

        {/* تلميح صغير غير حاجب — اضغط على أي عنصر لتعديله */}
        <p className="pointer-events-none absolute bottom-3 start-1/2 z-[60] hidden -translate-x-1/2 whitespace-nowrap rounded-full bg-ink/70 px-3.5 py-1.5 text-[11px] font-medium text-ivory/90 backdrop-blur md:block">
          {t('editor.inlineEditHint')}
        </p>

        {/* زرار فتح اللينك الحي — صغير وفوق زرار الألوان */}
        <button
          type="button"
          onClick={() => window.open(`/site/${draft.slug}`, '_blank', 'noopener,noreferrer')}
          className="absolute bottom-[4.75rem] start-4 z-[60] inline-flex h-10 items-center gap-2 rounded-full border border-black/10 bg-paper/95 px-3.5 text-[12px] font-semibold text-espresso shadow-[0_10px_30px_-12px_rgba(0,0,0,0.45)] backdrop-blur transition hover:bg-paper lg:bottom-4"
          title={t('editor.openLive')}
          aria-label={t('editor.openLive')}
        >
          <Icon name="external" size={15} />
          {t('editor.openLive')}
        </button>

        {/* زرار السايدبار على الشاشات الصغيرة */}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="absolute bottom-4 start-4 z-[60] inline-flex h-12 items-center gap-2 rounded-full bg-flame px-4 text-[13px] font-semibold text-white shadow-[0_18px_40px_-12px_rgba(232,87,31,0.75)] transition hover:bg-flame/90 lg:hidden"
        >
          <Icon name="palette" size={16} />
          {t('editor.colors')}
        </button>
      </div>

      {/* السايدبار الثابت (شاشات كبيرة) */}
      <aside
        className="hidden w-[340px] shrink-0 flex-col overflow-hidden border-s border-sand lg:flex"
        aria-label={t('editor.colors')}
      >
        {sideContent}
      </aside>

      {/* السايدبار كدرج منزلق على الشاشات الصغيرة */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div
            className="absolute inset-0 bg-black/55"
            onClick={() => setDrawerOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 end-0 flex w-[88vw] max-w-[360px] flex-col overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.5)]">
            {sideContent}
          </div>
        </div>
      ) : null}

      {/* شريط الاشتراك المعلّق */}
      {suspended ? (
        <div className="absolute bottom-4 end-4 z-[65] flex max-w-sm flex-col gap-2 rounded-2xl border border-rose/40 bg-rose/95 p-3 text-white shadow-2xl backdrop-blur">
          <span className="flex items-center gap-2 text-[12px] font-medium leading-snug">
            <Icon name="alert" size={15} className="shrink-0" />
            {sub?.status === 'cancelled'
              ? t('flow.cancelledNotice')
              : sub?.status === 'past_due'
              ? t('flow.pastDueNotice')
              : t('flow.expiredNotice')}
          </span>
          <Button size="sm" variant="danger" icon="refresh" onClick={() => navigate('/dashboard/subscription')}>
            {t('subscription.renew')}
          </Button>
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
      {!live && tx(draft.name, lang).trim() ? (
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
        restaurantName={tx(draft.name, lang)}
        onSuccess={subscribeFromPublish ? () => publishDemo() : undefined}
      />

      <AuthModal
        open={gateOpen}
        onClose={() => setGateOpen(false)}
        restaurantName={tx(draft.name, lang)}
        onSuccess={() => navigate('/dashboard')}
      />
    </div>
  )
}
