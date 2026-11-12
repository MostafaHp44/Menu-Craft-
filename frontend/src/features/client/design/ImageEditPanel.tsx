import { useEffect, useRef, useState } from 'react'
import { apiUrl } from '../../../shared/api/url.ts'
import { IMAGE_POSITIONS, type ImageFit } from '../../../shared/lib/types.ts'
import { Badge, Button, Field, Input, Img, Select } from '../../../shared/ui/ui.tsx'
import { MediaPickerModal, loadClientUploads } from '../../../shared/ui/MediaPicker.tsx'
import { cx } from '../../../shared/lib/utils.ts'
import { useStore } from '../../../shared/store/useStore.ts'
import { useI18n, type TKey } from '../../../shared/i18n'

const POSITION_GRID: Array<{ row: number; col: number; value: string; labelKey: TKey | string }> = [
  { row: 0, col: 0, value: 'left top', labelKey: 'design.imageEdit.posTopLeft' },
  { row: 0, col: 1, value: 'center top', labelKey: 'design.imageEdit.posTop' },
  { row: 0, col: 2, value: 'right top', labelKey: 'design.imageEdit.posTopRight' },
  { row: 1, col: 0, value: 'left center', labelKey: 'design.imageEdit.posCenterLeft' },
  { row: 1, col: 1, value: 'center center', labelKey: 'design.imageEdit.posCenter' },
  { row: 1, col: 2, value: 'right center', labelKey: 'design.imageEdit.posCenterRight' },
  { row: 2, col: 0, value: 'left bottom', labelKey: 'design.imageEdit.posBottomLeft' },
  { row: 2, col: 1, value: 'center bottom', labelKey: 'design.imageEdit.posBottom' },
  { row: 2, col: 2, value: 'right bottom', labelKey: 'design.imageEdit.posBottomRight' },
]

/** Human-friendly names for each position, translated per language. */
const POSITION_LABEL: Record<string, Record<'en' | 'ar' | 'ku', string>> = {
  'default': { en: 'Default', ar: 'الافتراضي', ku: 'Default' },
  'center top': { en: 'Top', ar: 'فوق', ku: 'سەرەوە' },
  'right top': { en: 'Top Right', ar: 'فوق يمين', ku: 'سەرەوەی ڕاست' },
  'left top': { en: 'Top Left', ar: 'فوق شمال', ku: 'سەرەوەی چەپ' },
  'center center': { en: 'Center Center', ar: 'في النص', ku: 'ناوەڕاست' },
  'center bottom': { en: 'Bottom', ar: 'تحت', ku: 'خوارەوە' },
  'right bottom': { en: 'Bottom Right', ar: 'تحت يمين', ku: 'خوارەوەی ڕاست' },
  'left bottom': { en: 'Bottom Left', ar: 'تحت شمال', ku: 'خوارەوەی چەپ' },
  'left center': { en: 'Center Left', ar: 'وسط شمال', ku: 'ناوەڕاستی چەپ' },
  'right center': { en: 'Center Right', ar: 'وسط يمين', ku: 'ناوەڕاستی ڕاست' },
}

async function uploadToServer(file: File): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(apiUrl('/api/uploads'), { method: 'POST', body: form, credentials: 'include' })
  const json = await res.json().catch(() => null)
  if (!res.ok || !json?.ok) throw new Error(json?.error || `Upload failed: ${res.status}`)
  return json.data.url as string
}

export function ImageEditPanel({
  title,
  value,
  fit,
  onChange,
  onFitChange,
  kind = 'image',
  onRemove,
  open = true,
}: {
  title: string
  value: string
  fit?: ImageFit
  onChange: (src: string) => void
  onFitChange?: (fit: ImageFit | undefined) => void
  kind?: 'image' | 'video'
  onRemove?: () => void
  open?: boolean
}) {
  const { t, lang } = useI18n()
  const showToast = useStore((s) => s.showToast)
  const [busy, setBusy] = useState(false)
  const [urlDraft, setUrlDraft] = useState(value || '')
  const [libOpen, setLibOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setUrlDraft(value || '')
  }, [value])

  const pickFile = async (file: File | null) => {
    if (!file) return
    setBusy(true)
    try {
      const url = await uploadToServer(file)
      onChange(url)
      showToast({ tone: 'success', title: t('design.imageEdit.uploaded') })
    } catch (e: any) {
      showToast({ tone: 'error', title: (e?.message as string) || t('design.imageEdit.uploadFailed') })
    } finally {
      setBusy(false)
    }
  }

  const applyUrl = () => {
    const v = urlDraft.trim()
    if (!v) return
    onChange(v)
  }

  const position = fit?.position || 'default'
  const width = fit?.width || ''
  const height = fit?.height || ''
  const setFit = (patch: Partial<ImageFit>) => {
    if (!onFitChange) return
    const next = { ...(fit || {}), ...patch }
    const clean: ImageFit = {}
    if (next.position && next.position !== 'default') clean.position = next.position
    if (next.width) clean.width = next.width
    if (next.height) clean.height = next.height
    onFitChange(Object.keys(clean).length ? clean : undefined)
  }

  if (!open) return null

  return (
    <div className="space-y-3 rounded-2xl border border-sand bg-cream/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-[13px] font-semibold text-charcoal">{title}</h4>
        <Badge tone="neutral">{kind === 'video' ? t('design.imageEdit.video') : t('design.imageEdit.image')}</Badge>
      </div>

      {/* live preview */}
      {value ? (
        kind === 'video' ? (
          <video src={value} muted loop playsInline controls className="h-44 w-full rounded-xl bg-black object-cover"
            style={{ objectPosition: position !== 'default' ? position : undefined }} />
        ) : (
          <Img src={value} alt={title} className="h-44 w-full rounded-xl border border-sand object-cover"
            style={{ objectPosition: position !== 'default' ? position : undefined, width: width || undefined, height: height || undefined }} />
        )
      ) : (
        <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-sand text-[12px] text-umber">
          {t('design.imageEdit.pickFirst')}
        </div>
      )}

      {/* choose from device */}
      <div className="grid grid-cols-2 gap-2">
        <input ref={fileRef} type="file" accept={kind === 'video' ? 'video/*' : 'image/*'} className="hidden" onChange={(e) => { pickFile(e.target.files?.[0] || null); e.target.value = '' }} />
        <Button full size="sm" variant="dark" icon="plus" disabled={busy} onClick={() => fileRef.current?.click()}>
          {busy ? t('design.imageEdit.uploading') : t('design.imageEdit.upload')}
        </Button>
        <Button full size="sm" variant="outline" icon="image" onClick={() => setLibOpen((v) => !v)}>
          {libOpen ? t('design.imageEdit.hideLibrary') : t('design.imageEdit.fromLibrary')}
        </Button>
      </div>

      {libOpen ? (
        <MediaPickerModal
          kind={kind}
          value={value}
          loader={loadClientUploads}
          onPick={(url) => {
            onChange(url)
            setLibOpen(false)
            showToast({ tone: 'success', title: t('design.imageEdit.uploaded') })
          }}
          onClose={() => setLibOpen(false)}
        />
      ) : null}

      <div className="flex gap-2">
        <Input value={urlDraft} onChange={(e) => setUrlDraft(e.target.value)} placeholder={t('design.imageEdit.urlPlaceholder')} dir="ltr" className="text-[12px]" />
        <Button size="sm" variant="outline" disabled={!urlDraft.trim()} onClick={applyUrl}>
          {t('design.imageEdit.apply')}
        </Button>
        {value && onRemove ? (
          <Button size="sm" variant="ghost" icon="trash" onClick={onRemove}>
            {t('design.imageEdit.remove')}
          </Button>
        ) : null}
      </div>

      {onFitChange ? (
        <div className="space-y-3 border-t border-sand pt-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-umber">{t('design.imageEdit.position')}</p>
          <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label={t('design.imageEdit.position')}>
            {POSITION_GRID.map((cell) => {
              const fallback = POSITION_LABEL[cell.value]?.[lang as 'en' | 'ar' | 'ku'] || cell.labelKey
              return (
                <button
                  key={cell.value}
                  type="button"
                  role="radio"
                  aria-checked={position === cell.value}
                  onClick={() => setFit({ position: cell.value })}
                  className={cx(
                    'rounded-lg border px-2 py-2 text-[11px] font-medium transition',
                    position === cell.value
                      ? 'border-charcoal bg-charcoal text-ivory'
                      : 'border-sand bg-paper text-umber hover:border-clay'
                  )}
                >
                  {fallback}
                </button>
              )
            })}
          </div>
          <Field label={t('design.imageEdit.positionList')}>
            <Select value={position} onChange={(e) => setFit({ position: e.target.value === 'default' ? undefined : e.target.value })}>
              {IMAGE_POSITIONS.map((p) => (
                <option key={p.value} value={p.value}>{POSITION_LABEL[p.value]?.[lang as 'en' | 'ar' | 'ku'] || p.value}</option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('design.imageEdit.width')}>
              <Input value={width} onChange={(e) => setFit({ width: e.target.value || undefined })} placeholder="100%" dir="ltr" />
            </Field>
            <Field label={t('design.imageEdit.height')}>
              <Input value={height} onChange={(e) => setFit({ height: e.target.value || undefined })} placeholder="100%" dir="ltr" />
            </Field>
          </div>
          <p className="text-[11px] leading-relaxed text-umber/70">{t('design.imageEdit.fitHint')}</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => onFitChange(undefined)}>
              {t('design.imageEdit.resetFit')}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
