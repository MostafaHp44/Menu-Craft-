/* Small pure helpers shared across the product. */

let counter = 0

/**
 * Active UI language, kept in sync by `<I18nProvider>` so `tx()` resolves
 * localized strings for the language the user is actually looking at — without
 * every display site having to thread `lang` through its props.
 */
let activeLang: string = 'en'

export function setActiveLang(lang: string): void {
  activeLang = lang
}

export function tx(
  value: string | { en?: string; ar?: string; ku?: string } | undefined | null,
  lang: string = activeLang
): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  const multi = value as Record<string, string | undefined>
  return multi[lang] || multi.en || multi.ar || multi.ku || ''
}

/** language currently shown in the UI — what new edits should be written to */
export function getActiveLang(): string {
  return activeLang
}

/**
 * Store an edited string on a field that may hold `{ en, ar, ku }`.
 * Object values keep their other languages: only the edited language is
 * replaced, so translations are never silently dropped.
 */
export function writeText(
  previous: string | { en?: string; ar?: string; ku?: string } | undefined,
  value: string,
  lang: string = activeLang
): string | { en?: string; ar?: string; ku?: string } {
  if (previous == null || typeof previous === 'string') return value
  const next: { en?: string; ar?: string; ku?: string } = { ...previous }
  if (lang === 'ar') next.ar = value
  else if (lang === 'ku') next.ku = value
  else next.en = value
  return next
}

export function uid(prefix = 'id'): string {
  counter += 1
  return `${prefix}-${Date.now().toString(36)}-${counter.toString(36)}`
}

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export function money(value: number, currency = '$'): string {
  const hasCents = Math.abs(value % 1) > 0.001
  return `${currency}${value.toFixed(hasCents ? 2 : 0)}`
}

/* ---------------------------------- color --------------------------------- */

function clamp(n: number, min = 0, max = 255): number {
  return Math.min(max, Math.max(min, n))
}

export function hexToRgb(hex: string): [number, number, number] {
  let value = hex.replace('#', '').trim()
  if (value.length === 3) {
    value = value
      .split('')
      .map((c) => c + c)
      .join('')
  }
  if (!/^[0-9a-fA-F]{6}$/.test(value)) return [0, 0, 0]
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ]
}

export function rgbToHex(r: number, g: number, b: number): string {
  const to = (n: number) => clamp(Math.round(n)).toString(16).padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`.toUpperCase()
}

export function isHex(value: string): boolean {
  return /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim())
}

export function normalizeHex(value: string): string {
  const v = value.trim()
  const withHash = v.startsWith('#') ? v : `#${v}`
  return isHex(withHash) ? withHash.toUpperCase() : '#000000'
}

/* -------------------------------- localization ------------------------------- */

export function resolveLocalized(
  value: string | { en?: string; ar?: string; ku?: string } | null | undefined,
  lang: string = 'en'
): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  const selected = value[lang as 'en' | 'ar' | 'ku'] ?? value.en ?? value.ar ?? value.ku ?? ''
  return typeof selected === 'string' ? selected : ''
}

/** Blend two hex colors; t=0 → a, t=1 → b */
export function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a)
  const [r2, g2, b2] = hexToRgb(b)
  return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t)
}

export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Readable foreground (near-white or near-black) for a given background. */
export function readableOn(hex: string): string {
  return luminance(hex) > 0.35 ? '#14110F' : '#FFFFFF'
}

/* ---------------------------------- misc ---------------------------------- */

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.max(1, Math.round(diff / 60000))
  if (mins < 60) return `${mins} min ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.round(hours / 24)
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days} days ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Resize + compress an uploaded image so localStorage stays small. */
export function fileToCompressedDataUrl(file: File, maxEdge = 900): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please choose an image file.'))
      return
    }
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read that file.'))
    reader.onload = () => {
      const src = String(reader.result || '')
      const image = new Image()
      image.onerror = () => reject(new Error('Could not decode that image.'))
      image.onload = () => {
        const scale = Math.min(1, maxEdge / Math.max(image.width, image.height))
        const w = Math.max(1, Math.round(image.width * scale))
        const h = Math.max(1, Math.round(image.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas unavailable.'))
          return
        }
        ctx.drawImage(image, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.78))
      }
      image.src = src
    }
    reader.readAsDataURL(file)
  })
}
