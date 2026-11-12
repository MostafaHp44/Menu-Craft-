import { useEffect, useRef, useState } from 'react'
import { Badge, Button, Field, Img, Input, Select } from '../../../shared/ui/ui.tsx'
import { templateAPI } from '../../../shared/lib/api.service.ts'
import { usePlatformStore } from '../../../shared/store/usePlatform.ts'
import { useStore } from '../../../shared/store/useStore.ts'
import { IMAGE_LIBRARY } from '../../../shared/lib/images.ts'
import { getTemplate } from '../../../templates/data/templates.ts'
import type { TemplateOverride } from '../../../shared/lib/types.ts'
import { MediaPickerModal, invalidateUploadedCache } from '../../../shared/ui/MediaPicker.tsx'
import { useI18n } from '../../../shared/i18n'
import { confirmDialog } from '../../../shared/components/dialogs.tsx'

function MediaField({
  label,
  value,
  onChange,
  kind,
  hint,
  aspect,
}: {
  label: string
  value: string | null | undefined
  onChange: (url: string | null) => void
  kind: 'image' | 'video'
  hint: string
  aspect?: '16:9' | '9:16'
}) {
  const { t } = useI18n()
  const showToast = useStore((s) => s.showToast)
  const [busy, setBusy] = useState(false)
  const [urlDraft, setUrlDraft] = useState(value || '')
  const [pickerOpen, setPickerOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setUrlDraft(value || '')
  }, [value])

  const pickFile = async (file: File | null) => {
    if (!file) return
    setBusy(true)
    try {
      const res = await templateAPI.upload(file)
      onChange(res.data.url)
      invalidateUploadedCache()
      showToast({ tone: 'success', title: t('adminUi.uploadedOk') })
    } catch (e: any) {
      showToast({ tone: 'error', title: e?.message || t('adminUi.uploadFail') })
    } finally {
      setBusy(false)
    }
  }

  const applyUrl = () => {
    const v = urlDraft.trim()
    onChange(v || null)
  }

  return (
    <div className="space-y-2 rounded-xl border border-white/10 bg-white/4 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-ivory">{label}</p>
          {aspect ? <Badge tone="neutral">{aspect}</Badge> : null}
        </div>
        <span className="shrink-0 text-[11px] text-ivory/45">{hint}</span>
      </div>
      {value ? (
        kind === 'video' ? (
          <video src={value} muted loop playsInline controls className="h-36 w-full rounded-lg bg-black object-contain" />
        ) : (
          <Img src={value} alt={label} className="h-36 w-full rounded-lg object-cover" />
        )
      ) : (
        <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-white/15 text-[12px] text-ivory/40">
          {t('adminUi.noMedia')}
        </div>
      )}
      <div className="flex gap-2">
        <input ref={fileRef} type="file" accept={kind === 'video' ? 'video/*' : 'image/*'} className="hidden" onChange={(e) => { pickFile(e.target.files?.[0] || null); e.target.value = '' }} />
        <Button size="sm" variant="outline" icon="plus" disabled={busy} onClick={() => fileRef.current?.click()}>
          {busy ? t('adminUi.uploading') : t(kind === 'video' ? 'adminUi.uploadVideo' : 'adminUi.uploadImage')}
        </Button>
        <Button size="sm" variant="outline" icon="image" disabled={busy} onClick={() => setPickerOpen(true)}>
          {t('adminUi.pickupMedia')}
        </Button>
        {value ? (
          <Button size="sm" variant="ghost" icon="trash" disabled={busy} onClick={() => onChange(null)}>
            {t('design.imageEdit.remove')}
          </Button>
        ) : null}
      </div>
      <div className="flex gap-2">
        <Input value={urlDraft} onChange={(e) => setUrlDraft(e.target.value)} placeholder={t('design.imageEdit.urlPlaceholder')} className="text-[12px]" dir="ltr" />
        <Button size="sm" variant="outline" disabled={!urlDraft.trim()} onClick={applyUrl}>
          {t('design.imageEdit.apply')}
        </Button>
      </div>
      {pickerOpen ? (
        <MediaPickerModal
          kind={kind}
          value={value || ''}
          onPick={(url) => {
            onChange(url)
            showToast({ tone: 'success', title: t('adminUi.tplPickedOk') })
          }}
          onClose={() => setPickerOpen(false)}
        />
      ) : null}
      <p className="text-[11px] leading-relaxed text-ivory/40">
        {aspect === '16:9' ? t('adminUi.aspectDesktop') : aspect === '9:16' ? t('adminUi.aspectMobile') : t('adminUi.aspectPreview')}
      </p>
    </div>
  )
}

export default function TemplateMediaEditor({ baseId, onClose }: { baseId: string; onClose: () => void }) {
  const { t } = useI18n()
  const showToast = useStore((s) => s.showToast)
  const overrides = usePlatformStore((s) => s.templateOverrides)
  const saveOverride = usePlatformStore((s) => s.saveOverride)
  const deleteOverride = usePlatformStore((s) => s.deleteOverride)
  const tpl = getTemplate(baseId)
  const existing: TemplateOverride | undefined = overrides[baseId]

  const [heroTitle, setHeroTitle] = useState(existing?.heroTitle || tpl.tagline || '')
  const [heroSubtitle, setHeroSubtitle] = useState(existing?.heroSubtitle || tpl.description || '')
  const [heroImage, setHeroImage] = useState(existing?.heroImage || tpl.heroImage || '')
  const [heroImageMobile, setHeroImageMobile] = useState(existing?.heroImageMobile || (tpl as any).heroImageMobile || '')
  const [heroVideoDesktop, setHeroVideoDesktop] = useState(existing?.heroVideoDesktop || (tpl as any).heroVideoDesktop || '')
  const [heroVideoMobile, setHeroVideoMobile] = useState(existing?.heroVideoMobile || (tpl as any).heroVideoMobile || '')
  const [previewImage, setPreviewImage] = useState(existing?.previewImage || tpl.previewImage || '')
  const [gallery, setGallery] = useState<string[]>(existing?.gallery?.length ? existing.gallery : tpl.gallery || [])
  const [saving, setSaving] = useState(false)
  const [busy, setBusy] = useState(false)

  const [layoutHeader, setLayoutHeader] = useState<(any)>(existing?.design?.layout?.header || tpl.defaultDesign.layout.header)
  const [layoutHero, setLayoutHero] = useState<(any)>(existing?.design?.layout?.hero || tpl.defaultDesign.layout.hero)
  const [menuLayout, setMenuLayout] = useState<(any)>(existing?.design?.layout?.menuLayout || tpl.defaultDesign.layout.menuLayout)
  const [menuDisplay, setMenuDisplay] = useState<(any)>(existing?.design?.layout?.menuDisplay || (tpl.defaultDesign.layout as any).menuDisplay || 'tabs')
  const [card, setCard] = useState<(any)>(existing?.design?.layout?.card || tpl.defaultDesign.layout.card)
  const [aspect, setAspect] = useState<(any)>(existing?.design?.layout?.aspect || tpl.defaultDesign.layout.aspect)
  const [theme, setTheme] = useState<(any)>(existing?.design?.layout?.theme || tpl.defaultDesign.layout.theme)
  const [radius, setRadius] = useState<number>(existing?.design?.layout?.radius ?? tpl.defaultDesign.layout.radius)

  useEffect(() => {
    const o = overrides[baseId]
    if (!o) return
    setHeroTitle(o.heroTitle || tpl.tagline || '')
    setHeroSubtitle(o.heroSubtitle || tpl.description || '')
    setHeroImage(o.heroImage || tpl.heroImage || '')
    setHeroImageMobile(o.heroImageMobile || '')
    setHeroVideoDesktop(o.heroVideoDesktop || '')
    setHeroVideoMobile(o.heroVideoMobile || '')
    setPreviewImage(o.previewImage || tpl.previewImage || '')
    if (o.gallery?.length) setGallery(o.gallery)
    if (o.design?.layout) {
      const l: any = o.design.layout
      if (l.header) setLayoutHeader(l.header)
      if (l.hero) setLayoutHero(l.hero)
      if (l.menuLayout) setMenuLayout(l.menuLayout)
      if (l.menuDisplay) setMenuDisplay(l.menuDisplay)
      if (l.card) setCard(l.card)
      if (l.aspect) setAspect(l.aspect)
      if (l.theme) setTheme(l.theme)
      if (typeof l.radius === 'number') setRadius(l.radius)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseId, overrides[baseId]?.updatedAt])

  const save = async () => {
    setSaving(true)
    try {
      await saveOverride(baseId, {
        baseTemplateId: baseId,
        heroTitle: heroTitle || null,
        heroSubtitle: heroSubtitle || null,
        heroImage: heroImage || null,
        heroImageMobile: heroImageMobile || null,
        heroVideoDesktop: heroVideoDesktop || null,
        heroVideoMobile: heroVideoMobile || null,
        previewImage: previewImage || null,
        gallery,
        design: {
          layout: { header: layoutHeader, hero: layoutHero, menuLayout, menuDisplay, card, aspect, theme, radius },
        } as any,
      })
      showToast({ tone: 'success', title: t('adminUi.tplSavedOk') })
    } catch (e: any) {
      showToast({ tone: 'error', title: e?.message || t('adminUi.saveFail') })
    } finally {
      setSaving(false)
    }
  }

  const reset = async () => {
    const ok = await confirmDialog({
      title: t('adminUi.tplResetTitle', { defaultValue: 'إعادة تعيين الوسائط؟' }),
      message: t('adminUi.tplResetConfirm'),
      confirmLabel: t('common.confirm'),
      cancelLabel: t('common.cancel'),
      tone: 'danger',
    })
    if (!ok) return
    setBusy(true)
    try {
      await deleteOverride(baseId)
      showToast({ tone: 'info', title: t('adminUi.tplResetOk') })
      onClose()
    } catch (e: any) {
      showToast({ tone: 'error', title: e?.message || t('adminUi.tplFail') })
    } finally {
      setBusy(false)
    }
  }

  const addFromLibrary = (src: string) => setGallery((g) => (g.includes(src) ? g : [...g, src]))
  const removeGallery = (src: string) => setGallery((g) => g.filter((s) => s !== src))

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Img src={previewImage || tpl.previewImage} alt={tpl.name} className="h-14 w-20 rounded-lg object-cover" />
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-semibold text-ivory">{tpl.name}</h3>
          <p className="text-[12px] text-ivory/50">baseTemplateId: <span className="font-mono" dir="ltr">{baseId}</span></p>
        </div>
        {existing ? <Badge tone="flame">{t('adminUi.tplUpdated')}</Badge> : <Badge tone="neutral">{t('adminUi.tplOriginal')}</Badge>}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Field label={t('adminUi.tplTitle')}>
          <Input value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} dir="ltr" />
        </Field>
        <Field label={t('adminUi.tplSubtitle')}>
          <Input value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} dir="ltr" />
        </Field>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <MediaField label={t('adminUi.mImgDesktop')} value={heroImage || null} onChange={(v) => setHeroImage(v || '')} kind="image" hint={t('adminUi.mHintDesktop')} aspect="16:9" />
        <MediaField label={t('adminUi.mImgMobile')} value={heroImageMobile || null} onChange={(v) => setHeroImageMobile(v || '')} kind="image" hint={t('adminUi.mHintMobile')} aspect="9:16" />
        <MediaField label={t('adminUi.mVidDesktop')} value={heroVideoDesktop || null} onChange={(v) => setHeroVideoDesktop(v || '')} kind="video" hint={t('adminUi.mHintVideo')} aspect="16:9" />
        <MediaField label={t('adminUi.mVidMobile')} value={heroVideoMobile || null} onChange={(v) => setHeroVideoMobile(v || '')} kind="video" hint={t('adminUi.mHintVideo')} aspect="9:16" />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <MediaField label={t('adminUi.mPreview')} value={previewImage || null} onChange={(v) => setPreviewImage(v || '')} kind="image" hint={t('adminUi.mHintCard')} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-[13px] font-semibold text-ivory">{t('adminUi.galleryTitle')}</h4>
          <span className="text-[11px] text-ivory/45">{t('adminUi.galleryCount', { n: gallery.length })}</span>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {gallery.map((src) => (
            <div key={src} className="group relative overflow-hidden rounded-lg">
              <Img src={src} alt="" className="h-24 w-full object-cover" />
              <button type="button" onClick={() => removeGallery(src)} className="absolute inset-x-0 bottom-0 bg-black/70 py-1 text-center text-[11px] text-white opacity-0 transition group-hover:opacity-100">
                {t('design.imageEdit.remove')}
              </button>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {IMAGE_LIBRARY.slice(0, 12).map((lib) => (
            <button key={lib.src} type="button" onClick={() => addFromLibrary(lib.src)} className="overflow-hidden rounded-lg border border-white/10" title={lib.label}>
              <Img src={lib.src} alt={lib.label} className="h-16 w-full object-cover hover:scale-105 transition" />
            </button>
          ))}
        </div>
        <p className="text-[11px] text-ivory/40">{t('adminUi.galleryHint')}</p>
      </div>

      <div className="space-y-3">
        <h4 className="text-[13px] font-semibold text-ivory">{t('adminUi.layoutTitle')}</h4>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label={t('adminUi.layoutHeaderL')}><Select value={layoutHeader} onChange={(e) => setLayoutHeader(e.target.value)}><option value="split">Split</option><option value="centered">Centered</option><option value="minimal">Minimal</option></Select></Field>
          <Field label={t('adminUi.layoutHeroL')}><Select value={layoutHero} onChange={(e) => setLayoutHero(e.target.value)}><option value="fullscreen">Fullscreen</option><option value="split">Split</option><option value="editorial">Editorial</option></Select></Field>
          <Field label={t('adminUi.layoutMenuLayoutL')}><Select value={menuLayout} onChange={(e) => setMenuLayout(e.target.value)}><option value="grid">Grid</option><option value="list">List</option><option value="board">Board</option><option value="deck">Deck</option><option value="compact">Compact</option></Select></Field>
          <Field label={t('adminUi.layoutTabsL')}><Select value={menuDisplay} onChange={(e) => setMenuDisplay(e.target.value)}><option value="tabs">Tabs</option><option value="scroll-sticky">Scroll Sticky</option></Select></Field>
          <Field label={t('adminUi.layoutCardL')}><Select value={card} onChange={(e) => setCard(e.target.value)}><option value="bordered">Bordered</option><option value="elevated">Elevated</option><option value="flat">Flat</option></Select></Field>
          <Field label={t('adminUi.layoutAspectL')}><Select value={aspect} onChange={(e) => setAspect(e.target.value)}><option value="square">Square</option><option value="portrait">Portrait</option><option value="landscape">Landscape</option><option value="wide">Wide</option></Select></Field>
          <Field label={t('adminUi.layoutThemeL')}><Select value={theme} onChange={(e) => setTheme(e.target.value)}><option value="light">Light</option><option value="dark">Dark</option><option value="warm">Warm</option><option value="custom">Custom</option></Select></Field>
          <Field label={t('adminUi.layoutRadiusL')}><Input type="number" value={radius} onChange={(e) => setRadius(Number(e.target.value) || 0)} /></Field>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-2">
        <Button variant="accent" icon="check" disabled={saving} onClick={save}>
          {saving ? t('adminUi.tplSaving') : t('adminUi.tplSave')}
        </Button>
        {existing ? (
          <Button variant="outline" icon="refresh" disabled={busy} onClick={reset}>
            {t('adminUi.tplReset')}
          </Button>
        ) : null}
        <Button variant="ghost" onClick={onClose}>
          {t('adminUi.tplClose')}
        </Button>
      </div>
    </div>
  )
}
