import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react'
import type { InlineTextStyle, Restaurant } from '../../shared/lib/types.ts'
import { cx } from '../../shared/lib/utils.ts'
import { Img } from '../../shared/ui/ui.tsx'

/**
 * Elementor-style in-place editing.
 *
 * `<RestaurantSite>` renders a provider around the whole document; every text
 * node that should be editable is wrapped in `<Ed path="...">`. When editing is
 * enabled the element becomes `contentEditable`, so the owner taps the words
 * directly on the preview and types — exactly like Elementor.
 *
 * - data paths (`name`, `menu.0.items.2.price`) read/write the restaurant
 * - `copy.*` paths hold free-text overrides for template-owned strings
 * - per-element styles live in `restaurant.inline[path]`
 */

export type InlineKind = 'text' | 'image'

export interface ActiveField {
  path: string
  kind: InlineKind
  label: string
}

interface InlineEditValue {
  enabled: boolean
  restaurant: Restaurant
  active: ActiveField | null
  select: (field: ActiveField) => void
  clear: () => void
  /** stored value — `undefined` when nothing was overridden yet */
  read: (path: string) => string | undefined
  commit: (path: string, value: string) => void
  styleOf: (path: string) => InlineTextStyle | undefined
  applyStyle: (path: string, patch: InlineTextStyle | null) => void
}

const InlineEditContext = createContext<InlineEditValue | null>(null)

export function useInlineEdit(): InlineEditValue | null {
  return useContext(InlineEditContext)
}

/* -------------------------------- helpers -------------------------------- */

function getByPath(source: unknown, path: string): unknown {
  let cursor: unknown = source
  for (const key of path.split('.')) {
    if (typeof cursor !== 'object' || cursor === null) return undefined
    cursor = (cursor as Record<string, unknown>)[key]
  }
  return cursor
}

/** immutable deep set — used by the store commit */
export function setByPath<T extends object>(source: T, path: string, value: unknown): T {
  const keys = path.split('.')
  const root: unknown = Array.isArray(source) ? [...source] : { ...source }
  let cursor = root as Record<string, unknown>

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    const child = cursor[key]
    const copy: unknown = Array.isArray(child)
      ? [...child]
      : typeof child === 'object' && child !== null
        ? { ...(child as object) }
        : {}
    cursor[key] = copy
    cursor = copy as Record<string, unknown>
  }

  cursor[keys[keys.length - 1]] = value
  return root as T
}

function styleToCSS(style: InlineTextStyle | undefined): CSSProperties | undefined {
  if (!style) return undefined
  const css: CSSProperties = {}
  if (style.fontSize) css.fontSize = style.fontSize
  if (style.color) css.color = style.color
  if (style.fontWeight) css.fontWeight = style.fontWeight
  if (style.align) css.textAlign = style.align
  if (style.letterSpacing) css.letterSpacing = style.letterSpacing
  if (style.whiteSpace) css.whiteSpace = style.whiteSpace
  return css
}

/* -------------------------------- provider ------------------------------- */

export interface InlineEditProviderProps {
  restaurant: Restaurant
  enabled: boolean
  /** the editor keeps the selected field in its own state to render the toolbar */
  onActiveChange?: (field: ActiveField | null) => void
  onCommit?: (path: string, value: string) => void
  onStyle?: (path: string, patch: InlineTextStyle | null) => void
  children: ReactNode
}

export function InlineEditProvider({
  restaurant,
  enabled,
  onActiveChange,
  onCommit,
  onStyle,
  children,
}: InlineEditProviderProps) {
  const [active, setActive] = useState<ActiveField | null>(null)

  const select = useCallback((field: ActiveField) => {
    setActive((current) =>
      current && current.path === field.path && current.kind === field.kind ? current : field
    )
  }, [])

  const clear = useCallback(() => setActive(null), [])

  // a field is only meaningful while editing is on
  useEffect(() => {
    if (!enabled) setActive(null)
  }, [enabled])

  useEffect(() => {
    onActiveChange?.(active)
  }, [active, onActiveChange])

  const read = useCallback(
    (path: string): string | undefined => {
      if (path.startsWith('copy.')) {
        const override = restaurant.copy?.[path]
        return typeof override === 'string' ? override : undefined
      }
      const value = getByPath(restaurant, path)
      return typeof value === 'string' || typeof value === 'number'
        ? String(value)
        : undefined
    },
    [restaurant]
  )

  const commit = useCallback(
    (path: string, value: string) => {
      onCommit?.(path, value)
    },
    [onCommit]
  )

  const styleOf = useCallback(
    (path: string): InlineTextStyle | undefined => restaurant.inline?.[path],
    [restaurant]
  )

  const applyStyle = useCallback(
    (path: string, patch: InlineTextStyle | null) => {
      onStyle?.(path, patch)
    },
    [onStyle]
  )

  const value = useMemo<InlineEditValue>(
    () => ({
      enabled,
      restaurant,
      active,
      select,
      clear,
      read,
      commit,
      styleOf,
      applyStyle,
    }),
    [enabled, restaurant, active, select, clear, read, commit, styleOf, applyStyle]
  )

  return <InlineEditContext.Provider value={value}>{children}</InlineEditContext.Provider>
}

/* ---------------------------------- Ed ----------------------------------- */

export interface EdProps {
  /** restaurant data path (`tagline`, `menu.2.items.0.name`) or `copy.*` override */
  path: string
  /** template literal shown until the owner overrides it (copy.* paths) */
  fallback?: string
  as?: ElementType
  className?: string
  style?: CSSProperties
  /** when given, the parent owns rendering the current value */
  children?: ReactNode
  /** store a number (prices) — focus selects the text for quick re-typing */
  numeric?: boolean
  /** keep line breaks (descriptions, notes) */
  multiline?: boolean
  /** human name shown in the floating toolbar */
  label?: string
  /** renders the raw stored value for display, e.g. `money` */
  format?: (raw: string) => string
}

export function Ed({
  path,
  fallback = '',
  as,
  className,
  style,
  children,
  numeric,
  multiline,
  label,
  format,
}: EdProps) {
  const ctx = useInlineEdit()
  const ref = useRef<HTMLElement | null>(null)

  const stored = ctx?.read(path)
  let display: ReactNode
  if (children !== undefined) display = children
  else if (stored !== undefined) display = format ? format(stored) : stored
  else display = fallback

  const isText = typeof display === 'string'
  const editable = Boolean(ctx?.enabled && isText)
  const css = styleToCSS(ctx?.styleOf(path))
  const isActive = Boolean(editable && ctx?.active?.path === path && ctx?.active.kind === 'text')

  const baseline = numeric
    ? String(stored ?? fallback)
    : typeof display === 'string'
      ? display
      : ''

  const handleFocus = () => {
    ctx?.select({ path, kind: 'text', label: label ?? path })
    if (numeric && ref.current) {
      const selection = window.getSelection()
      const range = document.createRange()
      range.selectNodeContents(ref.current)
      selection?.removeAllRanges()
      selection?.addRange(range)
    }
  }

  const handleBlur = () => {
    const el = ref.current
    if (!el || !ctx || !isText) return

    const raw = el.innerText ?? ''
    let next: string

    if (numeric) {
      const parsed = Number.parseFloat(raw.replace(/[^\d.]/g, ''))
      if (Number.isNaN(parsed)) {
        el.innerText = baseline
        return
      }
      next = String(parsed)
    } else if (multiline) {
      next = raw.replace(/\r/g, '').replace(/[ \t]+\n/g, '\n').trim()
    } else {
      next = raw.replace(/\s*\n+\s*/g, ' ').trim()
    }

    if (next !== baseline) ctx.commit(path, next)
  }

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter' && !multiline) {
      event.preventDefault()
      ref.current?.blur()
    } else if (event.key === 'Escape' && ref.current) {
      ref.current.innerText = baseline
      ref.current.blur()
    }
  }

  if (!ctx) {
    return (
      <TagOf as={as} className={className} style={{ ...style, ...css }}>
        {display}
      </TagOf>
    )
  }

  if (!editable) {
    // published renders keep the exact same markup — plus any inline style override
    return (
      <TagOf
        as={as}
        className={className}
        style={{
          ...style,
          ...css,
          ...(multiline ? { whiteSpace: 'pre-line' as const } : null),
        }}
      >
        {display}
      </TagOf>
    )
  }

  return (
    <TagOf
      as={as}
      ref={ref}
      className={cx('rs-ed', className)}
      style={{
        ...style,
        ...css,
        ...(multiline ? { whiteSpace: 'pre-line' as const } : null),
      }}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      data-active={isActive ? 'true' : undefined}
      data-field={label ?? path}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    >
      {display}
    </TagOf>
  )
}

/* -------------------------------- EdImage -------------------------------- */

export interface EdImageProps {
  path: string
  src: string
  alt: string
  className?: string
  eager?: boolean
  /** short name shown in the toolbar, e.g. "Hero photo" */
  label?: string
}

export function EdImage({ path, src, alt, className, eager, label }: EdImageProps) {
  const ctx = useInlineEdit()

  if (!ctx?.enabled) {
    return <Img src={src} alt={alt} className={className} eager={eager} />
  }

  const select = () => ctx.select({ path, kind: 'image', label: label ?? alt })

  return (
    <span
      className={cx('rs-ed-media', className)}
      data-active={ctx.active?.path === path ? 'true' : undefined}
      role="button"
      tabIndex={0}
      aria-label={alt}
      onClick={select}
      onKeyDown={(event) => {
        if (event.key === 'Enter') select()
      }}
    >
      <Img src={src} alt={alt} eager={eager} />
    </span>
  )
}

/* ------------------------------- TagOf ---------------------------------- */

/** renders the requested element, forwarding refs to intrinsic tags */
function TagOf({
  as,
  children,
  ...rest
}: {
  as?: ElementType
  children?: ReactNode
} & Record<string, unknown>) {
  const Tag = (as ?? 'span') as ElementType
  return <Tag {...rest}>{children}</Tag>
}
