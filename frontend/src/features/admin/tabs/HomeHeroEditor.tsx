import { useEffect, useRef, useState } from 'react'
import { Badge, Button, Field, Input, Img, Select } from '../../../shared/ui/ui.tsx'
import { homeContentAPI, templateAPI } from '../../../shared/lib/api.service.ts'
import { useHomeContentStore } from '../../../shared/store/useHomeContent.ts'
import { useStore } from '../../../shared/store/useStore.ts'
import { HERO_VARIANTS } from '../../../templates/data/heroVariants.ts'
import { useI18n } from '../../../shared/i18n'
import { MediaPickerModal, invalidateUploadedCache } from '../../../shared/ui/MediaPicker.tsx'

function HeroMediaField({
  label,
  value,
  onChange,
  kind,
  aspect,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  kind: 'image' | 'video'
  aspect: string
}) {
  const { t } = useI18n()
  const showToast = useStore((s) => s.showToast)
  const [busy, setBusy] = useState(false)
  const [urlDraft, setUrlDraft] = useState(value)
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

  return (
    <div className="space-y-2 rounded-2xl border border-white/10 bg-white/4 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] font-semibold text-ivory">{label}</p>
        <Badge tone="neutral">{aspect}</Badge>
      </div>
      {value ? (
        kind === 'video' ? (
          <video src={value} muted loop playsInline controls className="h-44 w-full rounded-xl bg-black object-cover" />
        ) : (
          <Img src={value} alt={label} className="h-44 w-full rounded-xl object-cover" />
        )
      ) : (
        <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-white/15 text-[12px] text-ivory/40">
          {t('adminUi.noMedia')}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <input ref={fileRef} type="file" accept={kind === 'video' ? 'video/*' : 'image/*'} className="hidden" onChange={(e) => { pickFile(e.target.files?.[0] || null); e.target.value = '' }} />
        <Button size="sm" variant="outline" icon="plus" disabled={busy} onClick={() => fileRef.current?.click()}>
          {busy ? t('adminUi.uploading') : t(kind === 'video' ? 'adminUi.uploadVideo' : 'adminUi.uploadImage')}
        </Button>
        <Button size="sm" variant="outline" icon="image" disabled={busy} onClick={() => setPickerOpen(true)}>
          {t('adminUi.pickupMedia')}
        </Button>
        {value ? (
          <Button size="sm" variant="ghost" icon="trash" disabled={busy} onClick={() => { onChange(''); setUrlDraft('') }}>
            {t('design.imageEdit.remove')}
          </Button>
        ) : null}
      </div>
      <div className="flex gap-2">
        <Input value={urlDraft} onChange={(e) => setUrlDraft(e.target.value)} placeholder={t('design.imageEdit.urlPlaceholder')} className="text-[12px]" dir="ltr" />
        <Button size="sm" variant="outline" disabled={!urlDraft.trim()} onClick={() => onChange(urlDraft.trim())}>
          {t('design.imageEdit.apply')}
        </Button>
      </div>
      {pickerOpen ? (
        <MediaPickerModal
          kind={kind}
          value={value}
          onPick={(url) => {
            onChange(url)
            showToast({ tone: 'success', title: t('adminUi.pickedOk') })
          }}
          onClose={() => setPickerOpen(false)}
        />
      ) : null}
    </div>
  )
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  const { t } = useI18n()
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || '#ffffff'}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 shrink-0 cursor-pointer rounded-lg border border-white/15 bg-white/5 p-1"
          aria-label={label}
        />
        {value ? (
          <Button size="sm" variant="ghost" onClick={() => onChange('')}>
            {t('adminUi.colorReset')}
          </Button>
        ) : (
          <span className="text-[11px] text-ivory/50">{t('adminUi.colorNote')}</span>
        )}
      </div>
    </Field>
  )
}

export default function HomeHeroEditor() {
  const { lang, t } = useI18n()
  const showToast = useStore((s) => s.showToast)
  const content = useHomeContentStore((s) => s.content[lang])
  const update = useHomeContentStore((s) => s.update)

  const [eyebrow, setEyebrow] = useState(content.hero.eyebrow || '')
  const [title, setTitle] = useState(content.hero.title || '')
  const [sub, setSub] = useState(content.hero.sub || '')
  const [imageDesktop, setImageDesktop] = useState(content.hero.imageDesktop || content.hero.image || '')
  const [imageMobile, setImageMobile] = useState(content.hero.imageMobile || '')
  const [videoDesktop, setVideoDesktop] = useState(content.hero.videoDesktop || content.hero.video || '')
  const [videoMobile, setVideoMobile] = useState(content.hero.videoMobile || content.hero.video || '')
  const [variantId, setVariantId] = useState(content.hero.variant || 'menu-alive')
  const [colorEyebrow, setColorEyebrow] = useState(content.hero.textColors?.eyebrow || '')
  const [colorTitle, setColorTitle] = useState(content.hero.textColors?.title || '')
  const [colorSub, setColorSub] = useState(content.hero.textColors?.sub || '')
  const [chipQr, setChipQr] = useState(content.hero.chipColors?.qr || '')
  const [chipOrder, setChipOrder] = useState(content.hero.chipColors?.order || '')
  const [chipPay, setChipPay] = useState(content.hero.chipColors?.pay || '')
  const [titleSize, setTitleSize] = useState(content.hero.textSizes?.title ?? 100)
  const [subSize, setSubSize] = useState(content.hero.textSizes?.sub ?? 100)
  const [saving, setSaving] = useState(false)

  // لو اللغة اتغيرت، حدّث الحقول من المحتوى
  useEffect(() => {
    setEyebrow(content.hero.eyebrow || '')
    setTitle(content.hero.title || '')
    setSub(content.hero.sub || '')
    setImageDesktop(content.hero.imageDesktop || content.hero.image || '')
    setImageMobile(content.hero.imageMobile || '')
    setVideoDesktop(content.hero.videoDesktop || content.hero.video || '')
    setVideoMobile(content.hero.videoMobile || content.hero.video || '')
    setVariantId(content.hero.variant || 'menu-alive')
    setColorEyebrow(content.hero.textColors?.eyebrow || '')
    setColorTitle(content.hero.textColors?.title || '')
    setColorSub(content.hero.textColors?.sub || '')
    setChipQr(content.hero.chipColors?.qr || '')
    setChipOrder(content.hero.chipColors?.order || '')
    setChipPay(content.hero.chipColors?.pay || '')
    setTitleSize(content.hero.textSizes?.title ?? 100)
    setSubSize(content.hero.textSizes?.sub ?? 100)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang])

  const save = async () => {
    setSaving(true)
    try {
      const hero = {
        ...content.hero,
        eyebrow,
        title,
        sub,
        image: imageDesktop,
        imageDesktop,
        imageMobile,
        video: videoDesktop || videoMobile,
        videoDesktop,
        videoMobile,
        variant: variantId,
        textColors: { eyebrow: colorEyebrow, title: colorTitle, sub: colorSub },
        chipColors: { qr: chipQr, order: chipOrder, pay: chipPay },
        textSizes: { title: titleSize, sub: subSize },
      }
      update(lang, (c) => {
        c.hero = hero
      })
      await homeContentAPI.update(lang, { hero })
      showToast({ tone: 'success', title: t('adminUi.savedOk') })
    } catch (e: any) {
      showToast({ tone: 'error', title: e?.message || t('adminUi.saveFail') })
    } finally {
      setSaving(false)
    }
  }

  const selectedVariant = HERO_VARIANTS.find((v) => v.id === variantId) || HERO_VARIANTS[0]

  return (
    <div className="space-y-5">
      <Field label={t('adminUi.variantLabel')}>
        <Select value={variantId} onChange={(e) => setVariantId(e.target.value)}>
          {HERO_VARIANTS.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name} — {v.note}
            </option>
          ))}
        </Select>
      </Field>
      <div className="rounded-2xl border border-white/10 bg-white/4 p-4">
        <p className="text-[12px] font-semibold text-ivory">{selectedVariant.name}</p>
        <p className="text-[11px] text-ivory/50">{t('adminUi.variantNote', { note: selectedVariant.note })}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label={t('adminUi.eyebrowLabel')}>
          <Input value={eyebrow} onChange={(e) => setEyebrow(e.target.value)} placeholder="The digital menu builder..." dir="ltr" />
        </Field>
        <Field label={t('adminUi.titleLabel')}>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} dir="ltr" />
        </Field>
      </div>
      <Field label={t('adminUi.subLabel')}>
        <Input value={sub} onChange={(e) => setSub(e.target.value)} dir="ltr" />
      </Field>

      <div className="grid gap-3 md:grid-cols-3">
        <ColorField label={t('adminUi.colorEyebrow')} value={colorEyebrow} onChange={setColorEyebrow} />
        <ColorField label={t('adminUi.colorTitle')} value={colorTitle} onChange={setColorTitle} />
        <ColorField label={t('adminUi.colorSub')} value={colorSub} onChange={setColorSub} />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <ColorField label={t('adminUi.chipQr')} value={chipQr} onChange={setChipQr} />
        <ColorField label={t('adminUi.chipOrder')} value={chipOrder} onChange={setChipOrder} />
        <ColorField label={t('adminUi.chipPay')} value={chipPay} onChange={setChipPay} />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Field label={t('adminUi.titleSize')}>
          <div className="flex items-center gap-3">
            <input type="range" min={40} max={170} step={5} value={titleSize} onChange={(e) => setTitleSize(Number(e.target.value))} className="w-full accent-flame" dir="ltr" />
            <span className="w-12 shrink-0 text-[12px] tabular-nums text-ivory/70" dir="ltr">{titleSize}%</span>
          </div>
        </Field>
        <Field label={t('adminUi.subSize')}>
          <div className="flex items-center gap-3">
            <input type="range" min={40} max={170} step={5} value={subSize} onChange={(e) => setSubSize(Number(e.target.value))} className="w-full accent-flame" dir="ltr" />
            <span className="w-12 shrink-0 text-[12px] tabular-nums text-ivory/70" dir="ltr">{subSize}%</span>
          </div>
        </Field>
      </div>
      {(titleSize !== 100 || subSize !== 100) ? (
        <Button size="sm" variant="ghost" onClick={() => { setTitleSize(100); setSubSize(100) }}>
          {t('adminUi.sizeReset')}
        </Button>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        <HeroMediaField label={t('adminUi.imgDesktopLabel')} value={imageDesktop} onChange={setImageDesktop} kind="image" aspect="16:9" />
        <HeroMediaField label={t('adminUi.imgMobileLabel')} value={imageMobile} onChange={setImageMobile} kind="image" aspect="9:16" />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <HeroMediaField label={t('adminUi.vidDesktopLabel')} value={videoDesktop} onChange={setVideoDesktop} kind="video" aspect="16:9" />
        <HeroMediaField label={t('adminUi.vidMobileLabel')} value={videoMobile} onChange={setVideoMobile} kind="video" aspect="9:16" />
      </div>

      <div className="flex gap-2">
        <Button variant="accent" icon="check" disabled={saving} onClick={save}>
          {saving ? t('adminUi.saving') : t('adminUi.save')}
        </Button>
      </div>
      <p className="text-[11px] leading-relaxed text-ivory/40">
        {t('adminUi.mediaNote')}
      </p>
    </div>
  )
}
