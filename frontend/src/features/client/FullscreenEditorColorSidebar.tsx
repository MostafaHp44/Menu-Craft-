import { useMemo } from 'react'
import { Badge, Button, ColorField } from '../../shared/ui/ui.tsx'
import { PanelBlock } from './design/DesignPanels.tsx'
import { PALETTE_PRESETS, THEME_OPTIONS, THEME_SURFACES } from '../../templates/data/palettes.ts'
import type { ColorSet } from '../../shared/lib/types.ts'
import { cx, mix } from '../../shared/lib/utils.ts'
import { useI18n, type TKey } from '../../shared/i18n'

interface Props {
  draft: any
  updateDraft: (recipe: (draft: any) => void) => void
  template: any
}

const COLOR_LABELS: Array<{ key: keyof ColorSet; labelKey: TKey; noteKey: TKey }> = [
  { key: 'text', labelKey: 'design.colorText', noteKey: 'design.colorTextNote' },
  { key: 'background', labelKey: 'design.colorBackground', noteKey: 'design.colorBackgroundNote' },
  { key: 'card', labelKey: 'design.colorCard', noteKey: 'design.colorCardNote' },
  { key: 'primary', labelKey: 'design.colorPrimary', noteKey: 'design.colorPrimaryNote' },
  { key: 'secondary', labelKey: 'design.colorSecondary', noteKey: 'design.colorSecondaryNote' },
  { key: 'accent', labelKey: 'design.colorAccent', noteKey: 'design.colorAccentNote' },
  { key: 'button', labelKey: 'design.colorButton', noteKey: 'design.colorButtonNote' },
  { key: 'border', labelKey: 'design.colorBorder', noteKey: 'design.colorBorderNote' },
]

export function ColorSidebar({ draft, updateDraft, template }: Props) {
  const { t } = useI18n()

  const activePreset = useMemo(() =>
    PALETTE_PRESETS.find((p) =>
      Object.entries(p.colors).every(([key, value]) => draft.design.colors[key as keyof typeof p.colors] === value)
    ), [draft.design.colors])

  return (
    <div className="flex flex-col h-full overflow-y-auto thin-scroll p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-ivory">{t('editor.colors')}</h3>
        <Badge tone="outline" className="text-ivory/70">{t('design.livePreview')}</Badge>
      </div>

      {/* Palette Presets */}
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
                    // البوردر المستخدم يدويًا يبقى كما هو — الباليتة تغيّر الباقي
                    const keptBorder = d.design.colors.border
                    d.design.colors = { ...preset.colors, ...(keptBorder ? { border: keptBorder } : null) }
                    d.design.layout.theme = 'custom'
                  })
                }
                className={cx(
                  'rounded-xl border p-2.5 text-start transition',
                  active
                    ? 'border-flame bg-white/10 shadow-[0_14px_30px_-24px_rgba(232,87,31,0.5)]'
                    : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'
                )}
              >
                <span className="flex items-center gap-1.5">
                  {[preset.colors.accent, preset.colors.primary, preset.colors.background, preset.colors.card].map(
                    (color, i) => (
                      <span
                        key={i}
                        className="h-5 w-5 rounded-full border border-white/20"
                        style={{ backgroundColor: color }}
                      />
                    )
                  )}
                </span>
                <span className="mt-2 block text-[12.5px] font-semibold text-ivory">{preset.name}</span>
                <span className="block text-[11.5px] leading-snug text-ivory/60">{preset.note}</span>
              </button>
            )
          })}
        </div>
      </PanelBlock>

      {/* Custom Colors - Main 4 colors first */}
      <PanelBlock title={t('designPanel.mainColors')} description={t('designPanel.mainColorsDesc')}>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {['text', 'background', 'card', 'primary', 'border'].map((key) => (
            <ColorField
              key={key}
              label={t(COLOR_LABELS.find(c => c.key === key)!.labelKey)}
              value={
                (draft.design.colors as ColorSet)[key as keyof ColorSet] ??
                (key === 'border'
                  ? mix(draft.design.colors.text, draft.design.colors.background, 0.15)
                  : '')
              }
              onChange={(hex) =>
                updateDraft((d) => {
                  d.design.colors[key as keyof ColorSet] = hex
                  if (key === 'background' || key === 'text' || key === 'card') {
                    d.design.layout.theme = 'custom'
                  }
                })
              }
            />
          ))}
        </div>
      </PanelBlock>

      {/* Accent & Button Colors */}
      <PanelBlock title={t('designPanel.accentColors')} description={t('designPanel.accentColorsDesc')}>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {['accent', 'button', 'secondary'].map((key) => (
            <ColorField
              key={key}
              label={t(COLOR_LABELS.find(c => c.key === key)!.labelKey)}
              value={draft.design.colors[key as keyof ColorSet]}
              onChange={(hex) =>
                updateDraft((d) => {
                  d.design.colors[key as keyof ColorSet] = hex
                  if (key === 'background' || key === 'text' || key === 'card') {
                    d.design.layout.theme = 'custom'
                  }
                })
              }
            />
          ))}
        </div>
      </PanelBlock>

      {/* Theme Switcher */}
      <PanelBlock title={t('design.theme')} description={t('design.themeDesc')}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {THEME_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={draft.design.layout.theme === option.id}
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
                draft.design.layout.theme === option.id ? 'border-flame bg-white/10' : 'border-white/10 bg-white/5 hover:border-white/20'
              )}
            >
              <span className="flex gap-1">
                <span className="h-5 w-5 rounded-md border border-white/20" style={{ backgroundColor: THEME_SURFACES[option.id].background }} />
                <span className="h-5 w-5 rounded-md border border-white/20" style={{ backgroundColor: THEME_SURFACES[option.id].card }} />
                <span className="h-5 w-5 rounded-md border border-white/20" style={{ backgroundColor: THEME_SURFACES[option.id].text }} />
              </span>
              <span className="mt-1.5 block text-[12.5px] font-semibold text-ivory">{option.name}</span>
              <span className="block text-[11px] text-ivory/60">{option.note}</span>
            </button>
          ))}
          <button
            type="button"
            aria-pressed={draft.design.layout.theme === 'custom'}
            onClick={() => updateDraft((d) => { d.design.layout.theme = 'custom' })}
            className={cx(
              'rounded-xl border p-2.5 text-start transition',
              draft.design.layout.theme === 'custom' ? 'border-flame bg-white/10' : 'border-white/10 bg-white/5 hover:border-white/20'
            )}
          >
            <span className="flex gap-1">
              <span className="h-5 w-5 rounded-md border border-white/20 bg-white/10" />
              <span className="h-5 w-5 rounded-md border border-white/20" style={{ backgroundColor: draft.design.colors.background }} />
              <span className="h-5 w-5 rounded-md border border-white/20" style={{ backgroundColor: draft.design.colors.text }} />
            </span>
            <span className="mt-1.5 block text-[12.5px] font-semibold text-ivory">{t('design.customTheme')}</span>
            <span className="block text-[11px] text-ivory/60">{t('design.customThemeNote')}</span>
          </button>
        </div>
      </PanelBlock>

      {/* Reset Colors */}
      <div className="flex flex-col items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-[12.5px] leading-relaxed text-ivory/70">
          {t('designPanel.resetColorsNote', { name: template.name })}
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
    </div>
  )
}