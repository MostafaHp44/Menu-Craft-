import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { useI18n, type TKey } from '../i18n/index.tsx'
import { IMAGE_LIBRARY, type LibraryImage } from '../lib/images.ts'
import { ImageUploadError, fileToDataUrl } from '../lib/imageUpload.ts'
import { useUploads } from '../store/useUploads.ts'
import { cx } from '../lib/utils.ts'
import { Button, Img, Input } from './ui.tsx'
import { Icon } from './icons.tsx'

/**
 * Shared image picker — search + category chips over the bundled library,
 * plus browser uploads (kept in the `useUploads` store) and an optional
 * "paste image URL" escape hatch.
 *
 * Single mode: `value: string` + `onSelect(src)`.
 * Multi mode:  `value: string[]` + `onToggle(src)` (+ optional `max` cap).
 */

/* ------------------------------ categories ------------------------------ */

export type CategoryId =
  | 'pizza'
  | 'pasta'
  | 'meat'
  | 'burger'
  | 'coffee'
  | 'dessert'
  | 'breakfast'
  | 'healthy'
  | 'interior'
  | 'lifestyle'

/** chip order mirrors the library's own grouping in `images.ts` */
const CATEGORY_ORDER: CategoryId[] = [
  'pizza',
  'pasta',
  'meat',
  'burger',
  'coffee',
  'dessert',
  'breakfast',
  'healthy',
  'interior',
  'lifestyle',
]

/** first tag (in order) that appears here wins; `lifestyle` is the catch-all */
const TAG_CATEGORY: Record<string, CategoryId> = {
  pizza: 'pizza',
  pasta: 'pasta',
  meat: 'meat',
  main: 'meat',
  burger: 'burger',
  sandwich: 'burger',
  coffee: 'coffee',
  drink: 'coffee',
  dessert: 'dessert',
  cake: 'dessert',
  bakery: 'dessert',
  breakfast: 'breakfast',
  brunch: 'breakfast',
  healthy: 'healthy',
  salad: 'healthy',
  bowl: 'healthy',
  interior: 'interior',
  cafe: 'interior',
  outdoor: 'interior',
  'fine dining': 'lifestyle',
  lifestyle: 'lifestyle',
  sharing: 'lifestyle',
  plate: 'lifestyle',
}

function categoryOf(image: LibraryImage): CategoryId {
  for (const tag of image.tags) {
    const match = TAG_CATEGORY[tag]
    if (match) return match
  }
  return 'lifestyle'
}

/* -------------------------------- component ------------------------------- */

export interface ImagePickerProps {
  /** current selection — a `src` string for single pickers, the array for galleries */
  value: string | string[]
  /** single-select callback */
  onSelect?: (src: string) => void
  /** multi-select toggle callback */
  onToggle?: (src: string) => void
  /** cap for multi pickers — unselected thumbs disable once reached */
  max?: number
  className?: string
}

export function ImagePicker({ value, onSelect, onToggle, max, className }: ImagePickerProps) {
  const { t } = useI18n()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryId | 'all' | 'uploads'>('all')
  const [urlDraft, setUrlDraft] = useState('')
  const [urlError, setUrlError] = useState(false)
  const [uploadError, setUploadError] = useState<TKey | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const uploads = useUploads((s) => s.items)
  const addUpload = useUploads((s) => s.add)
  const removeUpload = useUploads((s) => s.remove)

  const multi = Array.isArray(value)
  const selected = useMemo(
    () => new Set(Array.isArray(value) ? value : value ? [value] : []),
    [value]
  )
  const librarySrcs = useMemo(() => new Set(IMAGE_LIBRARY.map((image) => image.src)), [])
  const uploadSrcs = useMemo(() => new Set(uploads), [uploads])
  /** custom URL selections (multi mode) — kept visible & removable at the top */
  const extras = useMemo(
    () => (Array.isArray(value) ? value.filter((src) => !librarySrcs.has(src)) : []),
    [value, librarySrcs]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return IMAGE_LIBRARY.filter((image) => {
      if (category !== 'all' && categoryOf(image) !== category) return false
      if (!q) return true
      return `${image.label} ${image.tags.join(' ')}`.toLowerCase().includes(q)
    })
  }, [query, category])

  /* pre-highlighted thumb scrolls into view when the picker mounts/opens —
     scoped to the picker's own scroll area so the page itself never jumps */
  useEffect(() => {
    const container = scrollRef.current
    const el = container?.querySelector<HTMLElement>('[data-selected="true"]')
    if (!container || !el) return
    const box = container.getBoundingClientRect()
    const thumb = el.getBoundingClientRect()
    if (thumb.top < box.top || thumb.bottom > box.bottom) {
      el.scrollIntoView({ block: 'nearest' })
    }
  }, [])

  const atCap = multi && max !== undefined && selected.size >= max

  const pick = (src: string) => {
    if (multi) onToggle?.(src)
    else onSelect?.(src)
  }

  const applyUrl = () => {
    const raw = urlDraft.trim()
    let valid = false
    try {
      const parsed = new URL(raw)
      valid = parsed.protocol === 'http:' || parsed.protocol === 'https:'
    } catch {
      valid = false
    }
    if (!valid) {
      setUrlError(true)
      return
    }
    setUrlError(false)
    setUrlDraft('')
    pick(raw)
  }

  const onFileChosen = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setUploadError(null)
    try {
      const dataURL = await fileToDataUrl(file)
      const result = addUpload(dataURL)
      if (!result.ok) {
        setUploadError('images.uploadFailed')
        return
      }
      // the upload is selected immediately — no hunting for it in a grid
      pick(dataURL)
    } catch (error) {
      setUploadError(
        error instanceof ImageUploadError && error.code === 'tooLarge'
          ? 'images.uploadTooLarge'
          : error instanceof ImageUploadError && error.code === 'type'
            ? 'images.uploadTypeError'
            : 'images.uploadFailed'
      )
    }
  }

  const chips: Array<{ id: CategoryId | 'all' | 'uploads'; label: string }> = [
    { id: 'all', label: t('images.all') },
    { id: 'uploads', label: t('images.uploads') },
    ...CATEGORY_ORDER.map((id) => ({ id, label: t(`images.categories.${id}` as TKey) })),
  ]

  return (
    <div className={cx('space-y-2.5', className)}>
      {/* search */}
      <div className="relative">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('images.search')}
          aria-label={t('images.search')}
          className="pe-10 text-[13px]"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label={t('images.clear')}
            className="absolute end-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-umber transition hover:bg-cream hover:text-charcoal"
          >
            <Icon name="x" size={14} />
          </button>
        ) : (
          <Icon
            name="search"
            size={15}
            className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-umber"
          />
        )}
      </div>

      {/* category chips — horizontally scrollable on phones */}
      <div className="no-scrollbar -mx-0.5 flex gap-1.5 overflow-x-auto px-0.5 pb-0.5">
        {chips.map((chip) => {
          const active = category === chip.id
          return (
            <button
              key={chip.id}
              type="button"
              aria-pressed={active}
              onClick={() => setCategory(chip.id)}
              className={cx(
                'h-9 shrink-0 rounded-full border px-3.5 text-[12.5px] font-medium transition',
                active
                  ? 'border-charcoal bg-charcoal text-ivory'
                  : 'border-sand bg-cream/60 text-umber hover:border-clay hover:text-charcoal'
              )}
            >
              {chip.label}
            </button>
          )
        })}
      </div>

      {/* grid — height-capped so it works inline and inside modals */}
      <div ref={scrollRef} className="thin-scroll max-h-[45vh] overflow-y-auto">
        {category === 'uploads' ? (
          uploads.length === 0 ? (
            <p className="rounded-xl border border-dashed border-stone bg-cream/40 px-4 py-8 text-center text-[13px] text-umber">
              {t('images.empty')}
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {uploads.map((src) => (
                <div key={src} className="relative">
                  <Thumb
                    src={src}
                    label={t('images.uploads')}
                    selected={selected.has(src)}
                    disabled={atCap && !selected.has(src)}
                    stateLabel={multi ? t('images.selected') : t('images.current')}
                    onClick={() => pick(src)}
                  />
                  <button
                    type="button"
                    aria-label={t('images.deleteUpload')}
                    onClick={(event) => {
                      event.stopPropagation()
                      removeUpload(src)
                    }}
                    className="absolute end-1 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-charcoal/70 text-white shadow transition hover:bg-charcoal"
                  >
                    <Icon name="x" size={12} strokeWidth={2.5} />
                  </button>
                </div>
              ))}
            </div>
          )
        ) : filtered.length === 0 && extras.length === 0 ? (
          <p className="rounded-xl border border-dashed border-stone bg-cream/40 px-4 py-8 text-center text-[13px] text-umber">
            {t('images.empty')}
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {extras.map((src) => (
              <Thumb
                key={src}
                src={src}
                label={uploadSrcs.has(src) ? t('images.uploads') : t('images.useUrl')}
                selected={selected.has(src)}
                disabled={atCap && !selected.has(src)}
                stateLabel={multi ? t('images.selected') : t('images.current')}
                onClick={() => pick(src)}
              />
            ))}
            {filtered.map((image) => (
              <Thumb
                key={image.src}
                src={image.src}
                label={image.label}
                selected={selected.has(image.src)}
                disabled={atCap && !selected.has(image.src)}
                stateLabel={multi ? t('images.selected') : t('images.current')}
                onClick={() => pick(image.src)}
              />
            ))}
          </div>
        )}
      </div>

      {/* bring-your-own image — uploads or a pasted URL */}
      <div className="space-y-1.5 border-t border-sand/70 pt-2.5">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChosen} />
        <Button size="sm" variant="outline" icon="plus" full onClick={() => fileRef.current?.click()}>
          {t('images.upload')}
        </Button>
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
            placeholder={t('images.urlPlaceholder')}
            aria-label={t('images.urlPlaceholder')}
            className="text-[13px]"
            dir="ltr"
          />
          <Button
            size="sm"
            variant="outline"
            className="shrink-0"
            disabled={!urlDraft.trim()}
            onClick={applyUrl}
          >
            {t('common.apply')}
          </Button>
        </div>
        {uploadError ? (
          <p className="flex items-center gap-1.5 text-[12px] text-rose">
            <Icon name="alert" size={13} />
            {t(uploadError)}
          </p>
        ) : urlError ? (
          <p className="flex items-center gap-1.5 text-[12px] text-rose">
            <Icon name="alert" size={13} />
            {t('images.urlInvalid')}
          </p>
        ) : null}
      </div>
    </div>
  )
}

/* --------------------------------- thumb ---------------------------------- */

function Thumb({
  src,
  label,
  selected,
  disabled,
  stateLabel,
  onClick,
}: {
  src: string
  label: string
  selected: boolean
  disabled: boolean
  stateLabel: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      data-selected={selected ? 'true' : undefined}
      aria-pressed={selected}
      aria-label={selected ? `${label} — ${stateLabel}` : label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cx(
        'relative overflow-hidden rounded-xl border-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-flame focus-visible:ring-offset-1',
        selected ? 'border-flame ring-2 ring-flame/25' : 'border-transparent hover:border-clay',
        disabled && 'pointer-events-none opacity-40'
      )}
    >
      <Img src={src} alt={label} className="aspect-square w-full object-cover" />
      {selected ? (
        <span className="absolute end-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-flame text-white shadow">
          <Icon name="check" size={12} strokeWidth={3} />
        </span>
      ) : null}
    </button>
  )
}
