import { useState, type MouseEvent as ReactMouseEvent } from 'react'
import { useI18n, type TKey } from '../../../shared/i18n/index.tsx'
import { Button, Modal } from '../../../shared/ui/ui.tsx'
import { Icon } from '../../../shared/ui/icons.tsx'
import { cx } from '../../../shared/lib/utils.ts'
import { ImagePicker } from '../../../shared/ui/ImagePicker.tsx'
import { FONTS, fontName, fontStack } from '../../../templates/data/fonts.ts'
import type { ActiveField } from '../../../templates/editor/inlineEdit.tsx'
import type { InlineTextStyle } from '../../../shared/lib/types.ts'

/**
 * Floating toolbar for Elementor-style in-place editing.
 *
 * It sits *outside* the scaled preview (fixed to the viewport) so its touch
 * targets stay 1:1 on a phone. Every button keeps the caret in the edited
 * text by preventing the default `mousedown` focus steal.
 */

const SIZES = [
  '0.75rem',
  '0.875rem',
  '1rem',
  '1.125rem',
  '1.25rem',
  '1.5rem',
  '1.75rem',
  '2rem',
  '2.5rem',
  '3rem',
  '4rem',
  '5rem',
]

const ALIGNS: Array<NonNullable<InlineTextStyle['align']>> = ['start', 'center', 'end']

export function InlineToolbar({
  field,
  style,
  colors,
  onStyle,
  onCommit,
  onClear,
}: {
  field: ActiveField | null
  style: InlineTextStyle | undefined
  colors: string[]
  onStyle: (path: string, patch: InlineTextStyle | null) => void
  onCommit: (path: string, value: string) => void
  onClear: () => void
}) {
  const { t } = useI18n()
  const [pickerOpen, setPickerOpen] = useState(false)

  if (!field) return null

  const isImage = field.kind === 'image'
  const currentSize = style?.fontSize
  const sizeIndex = Math.max(0, SIZES.indexOf(currentSize ?? ''))
  const weight = style?.fontWeight ?? 400
  /** `undefined` → the template's own typeface (no per-element override) */
  const currentFont = style?.fontFamily

  /* keeps focus (and the caret) inside the contentEditable while tapping */
  const hold = (event: ReactMouseEvent) => event.preventDefault()

  const stepSize = (delta: number) => {
    const next = Math.min(SIZES.length - 1, Math.max(0, sizeIndex + delta))
    onStyle(field.path, { fontSize: SIZES[next] })
  }

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[90] flex justify-center px-3 pb-3">
        <div className="pointer-events-auto w-full max-w-xl overflow-hidden rounded-2xl border border-sand bg-paper shadow-[0_28px_60px_-24px_rgba(15,13,11,0.45)]">
          <div className="flex items-center justify-between gap-3 border-b border-sand/80 bg-cream/70 px-3 py-2">
            <span className="line-clamp-1 text-[12.5px] font-medium text-umber">
              {t(field.label as TKey)}
            </span>
            <button
              type="button"
              onMouseDown={hold}
              onClick={onClear}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-umber transition hover:bg-sand/60"
              aria-label={t('common.close')}
            >
              <Icon name="x" size={15} />
            </button>
          </div>

          {isImage ? (
            <div className="p-3">
              <Button
                full
                size="sm"
                variant="outline"
                icon="image"
                onClick={() => setPickerOpen(true)}
              >
                {t('editor.inline.changePhoto')}
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2 p-3">
              {/* font size */}
              <div className="flex items-center gap-1 rounded-full border border-sand bg-cream ps-2 pe-1 py-1">
                <button
                  type="button"
                  onMouseDown={hold}
                  onClick={() => stepSize(-1)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-semibold text-umber transition hover:bg-white"
                  aria-label={t('editor.inline.smaller')}
                >
                  A−
                </button>
                <span className="min-w-10 text-center font-mono text-[11px] text-clay">
                  {currentSize ? currentSize.replace('rem', '') : 'auto'}
                </span>
                <button
                  type="button"
                  onMouseDown={hold}
                  onClick={() => stepSize(1)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[15px] font-semibold text-umber transition hover:bg-white"
                  aria-label={t('editor.inline.larger')}
                >
                  A+
                </button>
              </div>

              {/* colour — de-duplicated: palettes may repeat a hex (e.g. button = primary) */}
              <div className="flex items-center gap-1.5 rounded-full border border-sand bg-cream px-2 py-1.5">
                {[...new Set(colors)].map((color, i) => (
                  <button
                    key={`${color}-${i}`}
                    type="button"
                    onMouseDown={hold}
                    onClick={() => onStyle(field.path, { color })}
                    className={cx(
                      'h-6 w-6 rounded-full ring-offset-2 ring-offset-cream transition',
                      style?.color === color && 'ring-2 ring-umber'
                    )}
                    style={{ background: color }}
                    aria-label={color}
                  />
                ))}
              </div>

              {/* alignment */}
              <div className="flex items-center gap-1 rounded-full border border-sand bg-cream px-1 py-1">
                {ALIGNS.map((align) => (
                  <button
                    key={align}
                    type="button"
                    onMouseDown={hold}
                    onClick={() => onStyle(field.path, { align })}
                    className={cx(
                      'flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-white',
                      (style?.align ?? 'start') === align ? 'text-flame' : 'text-umber'
                    )}
                    aria-label={t(`editor.inline.align${align === 'start' ? 'Start' : align === 'center' ? 'Center' : 'End'}` as TKey)}
                  >
                    <AlignGlyph align={align} />
                  </button>
                ))}
              </div>

              {/* weight */}
              <button
                type="button"
                onMouseDown={hold}
                onClick={() => onStyle(field.path, { fontWeight: weight >= 700 ? 400 : 700 })}
                className={cx(
                  'flex h-9 w-9 items-center justify-center rounded-full border border-sand text-[14px] transition',
                  weight >= 700 ? 'bg-charcoal text-ivory' : 'bg-cream text-umber hover:bg-white'
                )}
                aria-label={t('editor.inline.bold')}
              >
                <strong>B</strong>
              </button>

              {/* reset */}
              <button
                type="button"
                onMouseDown={hold}
                onClick={() => onStyle(field.path, null)}
                className="flex h-9 items-center gap-1.5 rounded-full border border-sand bg-cream px-3 text-[12px] text-umber transition hover:bg-white"
              >
                <Icon name="refresh" size={13} />
                {t('editor.inline.reset')}
              </button>

              {/* font family — full-width pill row, each name shown in its own typeface */}
              <div className="w-full">
                <div className="mb-1.5 text-[12px] font-medium text-umber">
                  {t('editor.inline.f.fontFamily')}
                </div>
                <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
                  <button
                    type="button"
                    onMouseDown={hold}
                    onClick={() => onStyle(field.path, { fontFamily: undefined })}
                    className={cx(
                      'flex h-8 shrink-0 items-center rounded-full border px-3 text-[12.5px] transition',
                      currentFont
                        ? 'border-sand bg-cream text-umber hover:bg-white'
                        : 'border-charcoal bg-charcoal text-ivory'
                    )}
                    aria-label={`${t('editor.inline.f.fontFamily')}: ${t('editor.inline.fontDefault')}`}
                    aria-pressed={!currentFont}
                  >
                    {t('editor.inline.fontDefault')}
                  </button>
                  {FONTS.map((font) => {
                    const active = currentFont === font.id
                    return (
                      <button
                        key={font.id}
                        type="button"
                        onMouseDown={hold}
                        onClick={() => onStyle(field.path, { fontFamily: font.id })}
                        className={cx(
                          'flex h-8 shrink-0 items-center rounded-full border px-3 text-[12.5px] transition',
                          active
                            ? 'border-charcoal bg-charcoal text-ivory'
                            : 'border-sand bg-cream text-umber hover:bg-white'
                        )}
                        style={{ fontFamily: fontStack(font.id) }}
                        aria-label={`${t('editor.inline.f.fontFamily')}: ${fontName(font.id)}`}
                        aria-pressed={active}
                      >
                        {font.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title={t('editor.inline.pickPhoto')}
        description={t('editor.inline.pickPhotoSub')}
        size="lg"
      >
        <ImagePicker
          value=""
          onSelect={(src) => {
            onCommit(field.path, src)
            setPickerOpen(false)
          }}
        />
      </Modal>
    </>
  )
}

/** tiny alignment glyph — three lines, no icon-font dependency */
function AlignGlyph({ align }: { align: 'start' | 'center' | 'end' }) {
  const widths = align === 'center' ? [10, 14, 8] : align === 'start' ? [14, 10, 12] : [8, 14, 10]
  const justify = align === 'center' ? 'center' : align === 'start' ? 'flex-start' : 'flex-end'
  return (
    <span className="flex w-4 flex-col gap-[3px]" style={{ alignItems: justify }}>
      {widths.map((w, i) => (
        <span key={i} className="h-[2px] rounded-full bg-current" style={{ width: w }} />
      ))}
    </span>
  )
}
