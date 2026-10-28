import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '../../../shared/ui/icons.tsx'
import { Badge, Button, ChoiceCard, ColorField, Field, IconButton, Img, Input, SliderField, Toggle } from '../../../shared/ui/ui.tsx'
import { ImagePicker } from '../../../shared/ui/ImagePicker.tsx'
import { TouchSegmented } from './TouchSegmented.tsx'
import { FONTS, fontName } from '../../../templates/data/fonts.ts'
import { PALETTE_PRESETS, THEME_OPTIONS, THEME_SURFACES } from '../../../templates/data/palettes.ts'
import { getTemplate } from '../../../templates/data/templates.ts'
import type { ColorSet, FontId, ImageAspect, LogoStyle, Restaurant, SectionId } from '../../../shared/lib/types.ts'
import {
  HeroVideoError,
  SAMPLE_HERO_VIDEO,
  deleteVideo,
  isRemoteVideoUrl,
  resolveVideoSrc,
  saveVideo,
} from '../../../shared/lib/heroVideo.ts'
import { cx, slugify } from '../../../shared/lib/utils.ts'
import { useStore } from '../../../shared/store/useStore.ts'
import { useI18n, type TKey } from '../../../shared/i18n'
import { setByPath } from '../../../templates/editor/inlineEdit.tsx'

/* ------------------------------------------------------------------ *
 * Design control panels — one implementation shared by the visual
 * editor and the dashboard's Design & Branding page.
 * ------------------------------------------------------------------ */

export function PanelNote({ children }: { children: React.ReactNode }) {
  return <p className="text-[12.5px] leading-relaxed text-clay">{children}</p>
}

export function PanelBlock({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-umber rtl:tracking-normal">{title}</h3>
        {description ? <p className="mt-1 text-[12.5px] leading-relaxed text-clay">{description}</p> : null}
      </div>
      {children}
    </section>
  )
}

/* -------------------------------- branding -------------------------------- */

export function BrandingPanel({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n()
  const draft = useStore((s) => s.draft)
  const updateDraft = useStore((s) => s.updateDraft)
  const [heroOpen, setHeroOpen] = useState(false)

  if (!draft) return <PanelNote>{t('design.loading')}</PanelNote>

  const set = <K extends keyof Restaurant>(key: K, value: Restaurant[K]) =>
    updateDraft((d) => {
      d[key] = value
    })

  /** deep commit — e.g. `setDeep('socials.instagram', v)` */
  const setDeep = (path: string, value: string) =>
    updateDraft((d) => {
      Object.assign(d, setByPath(d, path, value))
    })

  return (
    <div className={cx('space-y-6', compact && 'space-y-5')}>
      <PanelBlock title={t('design.identity')} description={t('design.identityDesc')}>
        <div className="space-y-3">
          <Field label={t('design.restaurantName')}>
            <Input value={draft.name} onChange={(e) => set('name', e.target.value)} />
          </Field>
          <Field label={t('design.tagline')}>
            <Input value={draft.tagline} onChange={(e) => set('tagline', e.target.value)} />
          </Field>
          <Field label={t('design.shortDescription')} hint={t('design.chars', { count: draft.description.length })}>
            <textarea
              value={draft.description}
              rows={3}
              maxLength={180}
              onChange={(e) => set('description', e.target.value)}
              className="w-full rounded-xl border border-sand bg-paper px-3.5 py-2.5 text-sm leading-relaxed text-charcoal transition focus:border-flame focus:outline-none focus:ring-4 focus:ring-flame/12"
            />
          </Field>
          <div className="rounded-xl border border-sand bg-cream/50 px-3.5 py-3">
            <button
              type="button"
              onClick={() =>
                set('slug', slugify(draft.name).replace(/[^a-z0-9-]/g, '') || draft.slug)
              }
              className="flex w-full items-center justify-between gap-3 text-start"
            >
              <span className="min-w-0">
                <span className="block text-[12.5px] font-medium text-espresso">{t('design.publicAddress')}</span>
                <span className="block font-mono text-[12.5px] text-umber">{draft.slug}.menucraft.com</span>
              </span>
              <span className="shrink-0 text-end text-[11.5px] font-medium text-flame">
                {t('design.syncWithName')}
                <span className="block font-mono font-normal text-umber">
                  {slugify(draft.name) || draft.slug}
                </span>
              </span>
            </button>
          </div>
        </div>
      </PanelBlock>

      <PanelBlock title={t('design.logo')} description={t('design.logoDesc')}>
        <div className="flex items-center gap-3">
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-[15px] font-semibold text-white shadow-inner"
            style={{ backgroundColor: draft.design.colors.primary }}
          >
            {draft.logoText.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1 space-y-2.5">
            <Field label={t('design.logoText')} hint={t('design.logoTextHint')}>
              <Input
                value={draft.logoText}
                maxLength={3}
                onChange={(e) => set('logoText', e.target.value.toUpperCase())}
              />
            </Field>
          </div>
        </div>
        <TouchSegmented<LogoStyle>
          full
          size="sm"
          ariaLabel={t('design.logoStyle')}
          value={draft.logoStyle}
          onChange={(v) => set('logoStyle', v)}
          options={[
            { value: 'monogram', label: t('design.logoMonogram') },
            { value: 'wordmark', label: t('design.logoWordmark') },
            { value: 'badge', label: t('design.logoBadge') },
          ]}
        />
      </PanelBlock>

      <PanelBlock title={t('design.heroImage')} description={t('design.heroDesc')}>
        <button
          type="button"
          onClick={() => setHeroOpen((v) => !v)}
          aria-expanded={heroOpen}
          className="group relative block w-full overflow-hidden rounded-xl border border-sand"
        >
          <Img src={draft.heroImage} alt={t('design.currentHero')} className="h-36 w-full object-cover transition group-hover:scale-[1.02]" />
          <span className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-3 pb-2.5 pt-8 text-[12px] font-medium text-white">
            {t('design.changeHero')}
            <Icon name={heroOpen ? 'chevronUp' : 'chevronDown'} size={14} />
          </span>
        </button>
        {heroOpen ? (
          <ImagePicker
            value={draft.heroImage}
            onSelect={(src) => {
              set('heroImage', src)
              setHeroOpen(false)
            }}
          />
        ) : null}
      </PanelBlock>

      <PanelBlock title={t('design.heroVideoGroup')} description={t('design.heroVideoNote')}>
        <HeroVideoBlock draft={draft} />
      </PanelBlock>

      <PanelBlock
        title={t('design.gallery')}
        description={t('design.galleryDesc', { count: draft.gallery.length })}
      >
        <ImagePicker
          value={draft.gallery}
          onToggle={(src) =>
            set(
              'gallery',
              draft.gallery.includes(src)
                ? draft.gallery.filter((s) => s !== src)
                : [...draft.gallery, src]
            )
          }
        />
      </PanelBlock>

      <PanelBlock title={t('design.contactDetails')} description={t('design.contactDesc')}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t('design.phone')}>
            <Input value={draft.phone} onChange={(e) => set('phone', e.target.value)} />
          </Field>
          <Field label={t('design.email')}>
            <Input value={draft.email} onChange={(e) => set('email', e.target.value)} />
          </Field>
        </div>
        <Field label={t('design.address')}>
          <Input value={draft.address} onChange={(e) => set('address', e.target.value)} />
        </Field>
      </PanelBlock>

      <PanelBlock title={t('design.socialsGroup')} description={t('design.socialsNote')}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t('design.instagram')}>
            <Input
              value={draft.socials.instagram}
              placeholder={t('design.instagramPlaceholder')}
              onChange={(e) => setDeep('socials.instagram', e.target.value)}
            />
          </Field>
          <Field label={t('design.facebook')}>
            <Input
              value={draft.socials.facebook}
              placeholder={t('design.facebookPlaceholder')}
              onChange={(e) => setDeep('socials.facebook', e.target.value)}
            />
          </Field>
        </div>
        <Field label={t('design.website')}>
          <Input
            value={draft.socials.website}
            placeholder={t('design.websitePlaceholder')}
            onChange={(e) => setDeep('socials.website', e.target.value)}
          />
        </Field>
      </PanelBlock>
    </div>
  )
}

/* ------------------------------- hero video ------------------------------- */

function HeroVideoBlock({ draft }: { draft: Restaurant }) {
  const { t } = useI18n()
  const updateDraft = useStore((s) => s.updateDraft)
  const [preview, setPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [urlDraft, setUrlDraft] = useState('')
  const [urlError, setUrlError] = useState(false)
  const [uploadError, setUploadError] = useState<'tooLarge' | 'failed' | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const ref = draft.heroVideo

  const set = (value: string) =>
    updateDraft((d) => {
      d.heroVideo = value
    })

  /* resolve `idb:` refs to object URLs for the preview — revoked on cleanup */
  useEffect(() => {
    let objectUrl: string | null = null
    let cancelled = false
    resolveVideoSrc(ref).then((url) => {
      if (cancelled) {
        if (url?.startsWith('blob:')) URL.revokeObjectURL(url)
        return
      }
      if (url?.startsWith('blob:')) objectUrl = url
      setPreview(url)
    })
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [ref])

  const applyUrl = () => {
    const raw = urlDraft.trim()
    if (!isRemoteVideoUrl(raw)) {
      setUrlError(true)
      return
    }
    setUrlError(false)
    setUrlDraft('')
    set(raw)
  }

  const onFileChosen = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setUrlError(false)
    setUploadError(null)
    setBusy(true)
    try {
      set(await saveVideo(file))
    } catch (error) {
      setUploadError(error instanceof HeroVideoError && error.code === 'tooLarge' ? 'tooLarge' : 'failed')
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    try {
      await deleteVideo(ref)
      set('')
    } finally {
      setBusy(false)
    }
  }

  if (!ref) {
    return (
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={onFileChosen} />
          <Button size="sm" variant="outline" icon="plus" disabled={busy} onClick={() => fileRef.current?.click()}>
            {busy ? t('design.heroVideoSaving') : t('design.heroVideoUpload')}
          </Button>
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => set(SAMPLE_HERO_VIDEO)}>
            {t('design.heroVideoSample')}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={urlDraft}
            onChange={(e) => {
              setUrlDraft(e.target.value)
              setUrlError(false)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                applyUrl()
              }
            }}
            placeholder={t('design.heroVideoUrl')}
            aria-label={t('design.heroVideoUrl')}
            className="text-[13px]"
            dir="ltr"
          />
          <Button
            size="sm"
            variant="outline"
            className="shrink-0"
            disabled={!urlDraft.trim() || busy}
            onClick={applyUrl}
          >
            {t('common.apply')}
          </Button>
        </div>
        {urlError ? (
          <p className="flex items-center gap-1.5 text-[12px] text-rose">
            <Icon name="alert" size={13} />
            {t('design.heroVideoInvalidUrl')}
          </p>
        ) : null}
        {uploadError ? (
          <p className="flex items-center gap-1.5 text-[12px] text-rose">
            <Icon name="alert" size={13} />
            {t(uploadError === 'tooLarge' ? 'design.heroVideoTooLarge' : 'images.uploadFailed')}
          </p>
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      {preview ? (
        <video
          autoPlay
          muted
          loop
          playsInline
          poster={draft.heroImage}
          src={preview}
          className="h-36 w-full rounded-xl object-cover"
        />
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge tone="neutral">
          {ref.startsWith('idb:') ? (
            t('design.heroVideoUploaded')
          ) : (
            <span dir="ltr" className="max-w-[190px] truncate">
              {ref}
            </span>
          )}
        </Badge>
        <Button size="sm" variant="outline" icon="trash" loading={busy} onClick={remove}>
          {t('design.heroVideoRemove')}
        </Button>
      </div>
    </div>
  )
}

/* --------------------------------- colors --------------------------------- */

const COLOR_LABELS: Array<{ key: keyof ColorSet; labelKey: TKey; noteKey: TKey }> = [
  { key: 'primary', labelKey: 'design.colorPrimary', noteKey: 'design.colorPrimaryNote' },
  { key: 'accent', labelKey: 'design.colorAccent', noteKey: 'design.colorAccentNote' },
  { key: 'button', labelKey: 'design.colorButton', noteKey: 'design.colorButtonNote' },
  { key: 'background', labelKey: 'design.colorBackground', noteKey: 'design.colorBackgroundNote' },
  { key: 'card', labelKey: 'design.colorCard', noteKey: 'design.colorCardNote' },
  { key: 'text', labelKey: 'design.colorText', noteKey: 'design.colorTextNote' },
  { key: 'secondary', labelKey: 'design.colorSecondary', noteKey: 'design.colorSecondaryNote' },
]

export function ColorPanel() {
  const { t } = useI18n()
  const draft = useStore((s) => s.draft)
  const updateDraft = useStore((s) => s.updateDraft)

  if (!draft) return <PanelNote>{t('design.loading')}</PanelNote>

  const template = getTemplate(draft.templateId)
  const activePreset = PALETTE_PRESETS.find((p) =>
    Object.entries(p.colors).every(([key, value]) => draft.design.colors[key as keyof typeof p.colors] === value)
  )

  return (
    <div className="space-y-6">
      <PanelBlock title={t('design.palettes')} description={t('design.palettesDesc')}>
        <div className="grid gap-2 sm:grid-cols-2">
          {PALETTE_PRESETS.map((preset) => {
            const active = activePreset?.id === preset.id
            return (
              <button
                key={preset.id}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  updateDraft((d) => {
                    d.design.colors = { ...preset.colors }
                    d.design.layout.theme = 'custom'
                  })
                }
                className={cx(
                  'rounded-xl border p-2.5 text-start transition',
                  active
                    ? 'border-charcoal bg-paper shadow-[0_14px_30px_-24px_rgba(27,23,20,0.9)]'
                    : 'border-sand bg-cream/50 hover:border-clay hover:bg-cream'
                )}
              >
                <span className="flex items-center gap-1.5">
                  {[preset.colors.accent, preset.colors.primary, preset.colors.background, preset.colors.card].map(
                    (color, i) => (
                      <span
                        key={i}
                        className="h-5 w-5 rounded-full border border-black/10"
                        style={{ backgroundColor: color }}
                      />
                    )
                  )}
                </span>
                <span className="mt-2 block text-[12.5px] font-semibold text-charcoal">{preset.name}</span>
                <span className="block text-[11.5px] leading-snug text-umber">{preset.note}</span>
              </button>
            )
          })}
        </div>
      </PanelBlock>

      <PanelBlock title={t('design.customColors')} description={t('design.customColorsDesc')}>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {COLOR_LABELS.map((row) => (
            <ColorField
              key={row.key}
              label={t(row.labelKey)}
              value={draft.design.colors[row.key]}
              onChange={(hex) =>
                updateDraft((d) => {
                  d.design.colors[row.key] = hex
                  if (row.key === 'background' || row.key === 'text' || row.key === 'card') {
                    d.design.layout.theme = 'custom'
                  }
                })
              }
            />
          ))}
        </div>
        <div className="flex flex-col items-start gap-3 rounded-xl border border-sand bg-cream/50 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-[12.5px] leading-relaxed text-umber">
            {t('design.resetColorsNote', { name: template.name })}
          </span>
          <Button
            size="sm"
            variant="outline"
            icon="refresh"
            className="min-h-10 shrink-0 sm:min-h-9"
            onClick={() =>
              updateDraft((d) => {
                d.design.colors = { ...template.defaultDesign.colors }
                d.design.layout.theme = template.defaultDesign.layout.theme
              })
            }
          >
            {t('design.resetColors')}
          </Button>
        </div>
      </PanelBlock>
    </div>
  )
}

/* ------------------------------- typography ------------------------------- */

export function TypographyPanel() {
  const { t } = useI18n()
  const draft = useStore((s) => s.draft)
  const updateDraft = useStore((s) => s.updateDraft)

  const presets = useMemo(
    () => [
      { nameKey: 'design.presetEditorial' as TKey, heading: 'playfair' as FontId, body: 'inter' as FontId, weight: 600, scale: 1.05 },
      { nameKey: 'design.presetModern' as TKey, heading: 'inter' as FontId, body: 'inter' as FontId, weight: 700, scale: 1 },
      { nameKey: 'design.presetBold' as TKey, heading: 'montserrat' as FontId, body: 'poppins' as FontId, weight: 700, scale: 1.1 },
      { nameKey: 'design.presetLiterary' as TKey, heading: 'lora' as FontId, body: 'dm-sans' as FontId, weight: 600, scale: 1.02 },
    ],
    []
  )

  if (!draft) return <PanelNote>{t('design.loading')}</PanelNote>
  const t2 = draft.design.typography

  const apply = (patch: Partial<typeof t2>) =>
    updateDraft((d) => {
      Object.assign(d.design.typography, patch)
    })

  const fontGroup = (labelKey: TKey, key: 'heading' | 'body' | 'menu') => (
    <div>
      <div className="mb-2 text-[12.5px] font-medium text-espresso">{t(labelKey)}</div>
      <div className="grid grid-cols-2 gap-2">
        {FONTS.map((font) => {
          const active = t2[key] === font.id
          return (
            <button
              key={font.id}
              type="button"
              aria-pressed={active}
              onClick={() => apply({ [key]: font.id } as Partial<typeof t2>)}
              className={cx(
                'rounded-xl border px-3 py-2 text-start transition',
                active
                  ? 'border-charcoal bg-paper shadow-[0_12px_26px_-22px_rgba(27,23,20,0.9)]'
                  : 'border-sand bg-cream/50 hover:border-clay hover:bg-cream'
              )}
            >
              <span className="line-clamp-1 text-[15px] leading-tight text-charcoal" style={{ fontFamily: font.stack }}>
                Aa
              </span>
              <span className="mt-0.5 line-clamp-1 text-[11.5px] font-medium text-umber">{font.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <PanelBlock title={t('design.presets')} description={t('design.presetsDesc')}>
        <div className="grid grid-cols-2 gap-2">
          {presets.map((preset) => (
            <button
              key={preset.nameKey}
              type="button"
              onClick={() => apply({ heading: preset.heading, body: preset.body, headingWeight: preset.weight, headingScale: preset.scale })}
              className="rounded-xl border border-sand bg-cream/50 px-3 py-2.5 text-start transition hover:border-clay hover:bg-cream"
            >
              <span className="block text-[13px] font-semibold text-charcoal">{t(preset.nameKey)}</span>
              <span className="line-clamp-1 text-[11.5px] text-umber">
                {fontName(preset.heading)} · {fontName(preset.body)}
              </span>
            </button>
          ))}
        </div>
      </PanelBlock>

      <PanelBlock title={t('design.fontFamilies')} description={t('design.fontFamiliesDesc')}>
        <div className="space-y-4">
          {fontGroup('design.headings', 'heading')}
          {fontGroup('design.bodyCopy', 'body')}
          {fontGroup('design.menuItems', 'menu')}
        </div>
      </PanelBlock>

      <PanelBlock title={t('design.scaleRhythm')}>
        <div className="space-y-4">
          <SliderField
            label={t('design.headlineSize')}
            value={t2.headingScale}
            min={0.85}
            max={1.3}
            step={0.01}
            suffix="×"
            onChange={(v) => apply({ headingScale: v })}
          />
          <SliderField
            label={t('design.bodySize')}
            value={t2.bodyScale}
            min={0.9}
            max={1.2}
            step={0.01}
            suffix="×"
            onChange={(v) => apply({ bodyScale: v })}
          />
          <SliderField
            label={t('design.headlineWeight')}
            value={t2.headingWeight}
            min={400}
            max={800}
            step={100}
            onChange={(v) => apply({ headingWeight: v })}
          />
          <SliderField
            label={t('design.lineHeight')}
            value={t2.lineHeight}
            min={1.3}
            max={1.9}
            step={0.05}
            onChange={(v) => apply({ lineHeight: v })}
          />
        </div>
      </PanelBlock>
    </div>
  )
}

/* --------------------------------- layout --------------------------------- */

const ASPECTS: Array<{ value: ImageAspect; labelKey: TKey }> = [
  { value: 'square', labelKey: 'design.aspectSquare' },
  { value: 'portrait', labelKey: 'design.aspectPortrait' },
  { value: 'landscape', labelKey: 'design.aspectLandscape' },
  { value: 'wide', labelKey: 'design.aspectWide' },
]

export function LayoutPanel() {
  const { t } = useI18n()
  const draft = useStore((s) => s.draft)
  const updateDraft = useStore((s) => s.updateDraft)

  if (!draft) return <PanelNote>{t('design.loading')}</PanelNote>
  const l = draft.design.layout

  const apply = (patch: Partial<typeof l>) =>
    updateDraft((d) => {
      Object.assign(d.design.layout, patch)
    })

  return (
    <div className="space-y-6">
      <PanelBlock title={t('design.theme')} description={t('design.themeDesc')}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {THEME_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={l.theme === option.id}
              onClick={() =>
                updateDraft((d) => {
                  const surface = THEME_SURFACES[option.id]
                  d.design.colors.background = surface.background
                  d.design.colors.text = surface.text
                  d.design.colors.card = surface.card
                  d.design.layout.theme = option.id
                })
              }
              className={cx(
                'rounded-xl border p-2.5 text-start transition',
                l.theme === option.id ? 'border-charcoal bg-paper' : 'border-sand bg-cream/50 hover:border-clay'
              )}
            >
              <span className="flex gap-1">
                <span
                  className="h-5 w-5 rounded-md border border-black/10"
                  style={{ backgroundColor: THEME_SURFACES[option.id].background }}
                />
                <span
                  className="h-5 w-5 rounded-md border border-black/10"
                  style={{ backgroundColor: THEME_SURFACES[option.id].card }}
                />
                <span
                  className="h-5 w-5 rounded-md border border-black/10"
                  style={{ backgroundColor: THEME_SURFACES[option.id].text }}
                />
              </span>
              <span className="mt-1.5 block text-[12.5px] font-semibold text-charcoal">{option.name}</span>
              <span className="block text-[11px] text-umber">{option.note}</span>
            </button>
          ))}
          <button
            type="button"
            aria-pressed={l.theme === 'custom'}
            onClick={() => apply({ theme: 'custom' })}
            className={cx(
              'rounded-xl border p-2.5 text-start transition',
              l.theme === 'custom' ? 'border-charcoal bg-paper' : 'border-sand bg-cream/50 hover:border-clay'
            )}
          >
            <span className="flex gap-1">
              <span className="h-5 w-5 rounded-md border border-black/10 bg-paper" />
              <span className="h-5 w-5 rounded-md border border-black/10" style={{ backgroundColor: draft.design.colors.background }} />
              <span className="h-5 w-5 rounded-md border border-black/10" style={{ backgroundColor: draft.design.colors.text }} />
            </span>
            <span className="mt-1.5 block text-[12.5px] font-semibold text-charcoal">{t('design.customTheme')}</span>
            <span className="block text-[11px] text-umber">{t('design.customThemeNote')}</span>
          </button>
        </div>
      </PanelBlock>

      <PanelBlock title={t('design.headerStyle')}>
        <div className="grid gap-2">
          <ChoiceCard
            label={t('design.headerSplit')}
            note={t('design.headerSplitNote')}
            active={l.header === 'split'}
            onClick={() => apply({ header: 'split' })}
          />
          <ChoiceCard
            label={t('design.headerCentered')}
            note={t('design.headerCenteredNote')}
            active={l.header === 'centered'}
            onClick={() => apply({ header: 'centered' })}
          />
          <ChoiceCard
            label={t('design.headerMinimal')}
            note={t('design.headerMinimalNote')}
            active={l.header === 'minimal'}
            onClick={() => apply({ header: 'minimal' })}
          />
        </div>
      </PanelBlock>

      <PanelBlock title={t('design.heroStyle')}>
        <div className="grid grid-cols-3 gap-2">
          {(['fullscreen', 'split', 'editorial'] as const).map((value) => (
            <ChoiceCard
              key={value}
              label={
                value === 'fullscreen'
                  ? t('design.heroFull')
                  : value === 'split'
                    ? t('design.heroSplit')
                    : t('design.heroEditorial')
              }
              active={l.hero === value}
              onClick={() => apply({ hero: value })}
              preview={
                <span className="flex h-12 items-center justify-center overflow-hidden rounded-lg border border-sand bg-cream">
                  {value === 'fullscreen' ? (
                    <span className="h-6 w-10 rounded bg-clay/60" />
                  ) : value === 'split' ? (
                    <span className="flex h-6 w-10 gap-0.5">
                      <span className="flex-1 rounded-s bg-clay/60" />
                      <span className="flex-1 rounded-e bg-stone" />
                    </span>
                  ) : (
                    <span className="h-1.5 w-10 rounded bg-clay/60" />
                  )}
                </span>
              }
            />
          ))}
        </div>
      </PanelBlock>

      <PanelBlock title={t('design.menuLayout')}>
        <TouchSegmented
          full
          value={l.menuLayout}
          onChange={(v) => apply({ menuLayout: v })}
          options={[
            { value: 'grid', label: t('design.menuGrid'), icon: 'grid' },
            { value: 'list', label: t('design.menuList'), icon: 'list' },
          ]}
        />
        <TouchSegmented
          full
          value={l.card}
          onChange={(v) => apply({ card: v })}
          options={[
            { value: 'bordered', label: t('design.cardBordered') },
            { value: 'elevated', label: t('design.cardElevated') },
            { value: 'flat', label: t('design.cardFlat') },
          ]}
        />
      </PanelBlock>

      <PanelBlock title={t('design.imagesBlock')}>
        <div className="grid grid-cols-4 gap-2">
          {ASPECTS.map((aspect) => (
            <button
              key={aspect.value}
              type="button"
              aria-pressed={l.aspect === aspect.value}
              onClick={() => apply({ aspect: aspect.value })}
              className={cx(
                'rounded-xl border p-2 transition',
                l.aspect === aspect.value ? 'border-charcoal bg-paper' : 'border-sand bg-cream/50 hover:border-clay'
              )}
            >
              <span className="mx-auto flex h-9 items-center justify-center">
                <span
                  className={cx(
                    'rounded-sm border-2',
                    l.aspect === aspect.value ? 'border-flame bg-flame/25' : 'border-clay bg-clay/20'
                  )}
                  style={{
                    width:
                      aspect.value === 'square' ? 26 : aspect.value === 'portrait' ? 22 : aspect.value === 'landscape' ? 32 : 34,
                    height:
                      aspect.value === 'square' ? 26 : aspect.value === 'portrait' ? 28 : aspect.value === 'landscape' ? 24 : 19,
                  }}
                />
              </span>
              <span className="mt-1 block text-center text-[11px] font-medium text-umber">{t(aspect.labelKey)}</span>
            </button>
          ))}
        </div>
      </PanelBlock>

      <PanelBlock title={t('design.shapeSpacing')}>
        <div className="space-y-4">
          <SliderField label={t('design.cornerRadius')} value={l.radius} min={0} max={24} suffix="px" onChange={(v) => apply({ radius: v })} />
          <div>
            <div className="mb-1.5 text-[13px] font-medium text-espresso">{t('design.sectionSpacing')}</div>
            <TouchSegmented
              full
              value={String(l.spacing)}
              onChange={(v) => apply({ spacing: Number(v) as 0 | 1 | 2 })}
              options={[
                { value: '0', label: t('design.spacingCompact') },
                { value: '1', label: t('design.spacingBalanced') },
                { value: '2', label: t('design.spacingAiry') },
              ]}
            />
          </div>
        </div>
      </PanelBlock>
    </div>
  )
}

/* -------------------------------- sections -------------------------------- */

const SECTION_META: Record<SectionId, { labelKey: TKey; noteKey: TKey; icon: string }> = {
  featured: { labelKey: 'design.sectionFeatured', noteKey: 'design.sectionFeaturedNote', icon: 'star' },
  menu: { labelKey: 'design.sectionMenu', noteKey: 'design.sectionMenuNote', icon: 'utensils' },
  about: { labelKey: 'design.sectionAbout', noteKey: 'design.sectionAboutNote', icon: 'book' },
  gallery: { labelKey: 'design.sectionGallery', noteKey: 'design.sectionGalleryNote', icon: 'image' },
  hours: { labelKey: 'design.sectionHours', noteKey: 'design.sectionHoursNote', icon: 'clock' },
  contact: { labelKey: 'design.sectionContact', noteKey: 'design.sectionContactNote', icon: 'mapPin' },
}

export function SectionsPanel() {
  const { t } = useI18n()
  const draft = useStore((s) => s.draft)
  const updateDraft = useStore((s) => s.updateDraft)

  if (!draft) return <PanelNote>{t('design.loading')}</PanelNote>
  const sections = draft.design.sections

  const toggle = (id: SectionId) =>
    updateDraft((d) => {
      const section = d.design.sections.find((s) => s.id === id)
      if (section) section.enabled = !section.enabled
    })

  const move = (id: SectionId, dir: -1 | 1) =>
    updateDraft((d) => {
      const index = d.design.sections.findIndex((s) => s.id === id)
      const next = index + dir
      if (index < 0 || next < 0 || next >= d.design.sections.length) return
      const [moved] = d.design.sections.splice(index, 1)
      d.design.sections.splice(next, 0, moved)
    })

  const enabledCount = sections.filter((s) => s.enabled).length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <PanelNote>{t('design.sectionsNote')}</PanelNote>
        <Badge tone="neutral">{t('design.sectionsOn', { enabled: enabledCount, total: sections.length })}</Badge>
      </div>

      <ul className="space-y-2">
        {sections.map((section, index) => {
          const meta = SECTION_META[section.id]
          return (
            <li
              key={section.id}
              className={cx(
                'flex items-center gap-3 rounded-xl border p-3 transition',
                section.enabled ? 'border-sand bg-paper' : 'border-dashed border-stone bg-cream/40'
              )}
            >
              <span
                className={cx(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition',
                  section.enabled ? 'bg-charcoal text-ivory' : 'bg-stone/50 text-umber'
                )}
              >
                <Icon name={meta.icon} size={16} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="line-clamp-1 text-[13.5px] font-medium text-charcoal">{t(meta.labelKey)}</span>
                <span className="line-clamp-1 text-[12px] text-umber">{t(meta.noteKey)}</span>
              </span>
              <span className="flex shrink-0 items-center gap-0.5">
                <IconButton
                  icon="chevronUp"
                  label={t('design.moveUp', { name: t(meta.labelKey) })}
                  size={14}
                  disabled={index === 0}
                  onClick={() => move(section.id, -1)}
                />
                <IconButton
                  icon="chevronDown"
                  label={t('design.moveDown', { name: t(meta.labelKey) })}
                  size={14}
                  disabled={index === sections.length - 1}
                  onClick={() => move(section.id, 1)}
                />
                <span className="ms-1">
                  <Toggle checked={section.enabled} onChange={() => toggle(section.id)} />
                </span>
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
