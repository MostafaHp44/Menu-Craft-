import { IMAGE_POSITIONS, type ImageFit } from '../../../shared/lib/types.ts'
import { Field, Input, Select } from '../../../shared/ui/ui.tsx'
import { useI18n } from '../../../shared/i18n'

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

export function ImageFitControls({
  value,
  onChange,
  prefix,
}: {
  value?: ImageFit
  onChange: (next: ImageFit) => void
  prefix?: string
}) {
  const { t, lang } = useI18n()
  const position = value?.position || 'default'
  const width = value?.width || ''
  const height = value?.height || ''

  const set = (patch: Partial<ImageFit>) => onChange({ ...(value || {}), ...patch })

  return (
    <div className="space-y-3 rounded-xl border border-sand bg-cream/60 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-umber">
        {prefix ? `${prefix} — ` : ''}{t('design.imageEdit.position')}
      </p>
      <Field label={t('design.imageEdit.position')}>
        <Select value={position} onChange={(e) => set({ position: e.target.value === 'default' ? undefined : e.target.value })}>
          {IMAGE_POSITIONS.map((p) => (
            <option key={p.value} value={p.value}>
              {POSITION_LABEL[p.value]?.[lang as 'en' | 'ar' | 'ku'] || p.value}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('design.imageEdit.width')}>
          <Input value={width} onChange={(e) => set({ width: e.target.value || undefined })} placeholder="100%" dir="ltr" />
        </Field>
        <Field label={t('design.imageEdit.height')}>
          <Input value={height} onChange={(e) => set({ height: e.target.value || undefined })} placeholder="100%" dir="ltr" />
        </Field>
      </div>
      <p className="text-[11px] leading-relaxed text-umber/70">{t('design.imageEdit.fitHint')}</p>
    </div>
  )
}
