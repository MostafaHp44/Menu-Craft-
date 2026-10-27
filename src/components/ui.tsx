import {
  useEffect,
  useMemo,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { Link } from 'react-router-dom'
import { IMAGE_FALLBACK } from '../lib/images'
import { cx, isHex, normalizeHex } from '../lib/utils'
import { Icon } from './icons'
import { useStore } from '../store/useStore'

/* --------------------------------- Button --------------------------------- */

type ButtonVariant = 'accent' | 'dark' | 'outline' | 'ghost' | 'light' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  accent: 'bg-flame text-white hover:bg-flame-dark shadow-[0_12px_26px_-16px_rgba(232,87,31,0.9)]',
  dark: 'bg-charcoal text-ivory hover:bg-ink shadow-[0_12px_26px_-18px_rgba(27,23,20,0.9)]',
  outline: 'border border-stone bg-paper/70 text-charcoal hover:bg-cream hover:border-clay',
  ghost: 'text-espresso hover:bg-cream',
  light: 'bg-ivory/10 text-ivory border border-ivory/25 hover:bg-ivory/20 backdrop-blur-[2px]',
  danger: 'bg-rose text-white hover:brightness-95',
}

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-[13.5px]',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-7 text-[15px]',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  to?: string
  href?: string
  icon?: string
  iconRight?: string
  full?: boolean
  loading?: boolean
}

export function Button({
  variant = 'dark',
  size = 'md',
  to,
  href,
  icon,
  iconRight,
  full,
  loading,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  // If the caller hides the button (`hidden sm:inline-flex`), drop the base
  // display utility so the `hidden` class actually wins at small breakpoints.
  const selfHidden = /\bhidden\b/.test(className ?? '')
  const classes = cx(
    'group/btn relative items-center justify-center gap-2 rounded-full font-medium tracking-[-0.01em] transition-all duration-200 active:scale-[0.985] disabled:pointer-events-none disabled:opacity-50',
    selfHidden ? '' : 'inline-flex',
    BUTTON_VARIANTS[variant],
    BUTTON_SIZES[size],
    full && 'w-full',
    className
  )

  const content = (
    <>
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : icon ? (
        <Icon name={icon} size={size === 'lg' ? 18 : 16} />
      ) : null}
      <span>{children}</span>
      {iconRight ? <Icon name={iconRight} size={size === 'lg' ? 18 : 16} /> : null}
    </>
  )

  if (to) {
    return (
      <Link to={to} className={classes} {...(rest as object)}>
        {content}
      </Link>
    )
  }
  if (href) {
    return (
      <a href={href} className={classes} {...(rest as object)}>
        {content}
      </a>
    )
  }
  return (
    <button type={type} className={classes} {...rest}>
      {content}
    </button>
  )
}

/* -------------------------------- IconButton ------------------------------- */

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string
  label: string
  size?: number
  tone?: 'default' | 'onDark'
  active?: boolean
}

export function IconButton({
  icon,
  label,
  size = 17,
  tone = 'default',
  active,
  className,
  type = 'button',
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cx(
        'h-9 w-9 items-center justify-center rounded-full transition disabled:pointer-events-none disabled:opacity-40',
        /\bhidden\b/.test(className ?? '') ? '' : 'inline-flex',
        tone === 'onDark'
          ? cx(
              'text-ivory/75 hover:bg-ivory/12 hover:text-ivory',
              active && 'bg-ivory/15 text-ivory'
            )
          : cx(
              'text-espresso hover:bg-cream hover:text-charcoal',
              active && 'bg-charcoal text-ivory hover:bg-charcoal'
            ),
        className
      )}
      {...rest}
    >
      <Icon name={icon} size={size} />
    </button>
  )
}

/* ---------------------------------- Badge --------------------------------- */

type BadgeTone = 'neutral' | 'flame' | 'moss' | 'gold' | 'outline' | 'dark'

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: 'bg-cream text-espresso',
  flame: 'bg-flame/12 text-flame-dark',
  moss: 'bg-moss/12 text-moss',
  gold: 'bg-gold/15 text-gold',
  outline: 'border border-sand text-umber',
  dark: 'bg-charcoal text-ivory',
}

export function Badge({
  tone = 'neutral',
  icon,
  children,
  className,
}: {
  tone?: BadgeTone
  icon?: string
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cx(
        'items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium tracking-[0.01em]',
        /\bhidden\b/.test(className ?? '') ? '' : 'inline-flex',
        BADGE_TONES[tone],
        className
      )}
    >
      {icon ? <Icon name={icon} size={13} /> : null}
      {children}
    </span>
  )
}

/* ---------------------------------- Card ---------------------------------- */

export function Card({
  children,
  className,
  hover,
  as: As = 'div',
}: {
  children: ReactNode
  className?: string
  hover?: boolean
  as?: 'div' | 'article' | 'section'
}) {
  return (
    <As
      className={cx(
        'rounded-2xl border border-sand/80 bg-paper',
        hover && 'lift shadow-[0_18px_40px_-32px_rgba(27,23,20,0.5)] hover:border-clay/70',
        className
      )}
    >
      {children}
    </As>
  )
}

/* ---------------------------------- Field --------------------------------- */

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string
  hint?: string
  error?: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={cx('block', className)}>
      <span className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="text-[13px] font-medium text-espresso">{label}</span>
        {hint ? <span className="text-[11.5px] text-clay">{hint}</span> : null}
      </span>
      {children}
      {error ? (
        <span className="mt-1.5 flex items-center gap-1.5 text-[12px] text-rose">
          <Icon name="alert" size={13} />
          {error}
        </span>
      ) : null}
    </label>
  )
}

const FIELD_CLASS =
  'w-full rounded-xl border border-sand bg-paper px-3.5 text-sm text-charcoal placeholder:text-clay transition focus:border-flame focus:outline-none focus:ring-4 focus:ring-flame/12'

export function Input({
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(FIELD_CLASS, 'h-11', className)} {...rest} />
}

export function TextArea({
  className,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx(FIELD_CLASS, 'py-2.5 leading-relaxed', className)} {...rest} />
}

export function Select({
  className,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={cx(FIELD_CLASS, 'h-11 appearance-none pr-9', className)} {...rest}>
        {children}
      </select>
      <Icon
        name="chevronDown"
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-umber"
      />
    </div>
  )
}

/* -------------------------------- ColorField ------------------------------ */

export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (hex: string) => void
}) {
  const [text, setText] = useState(value)

  useEffect(() => {
    setText(value)
  }, [value])

  const valid = isHex(text)

  return (
    <div
      className={cx(
        'flex items-center gap-3 rounded-xl border bg-paper px-2.5 py-2 transition',
        valid ? 'border-sand hover:border-clay' : 'border-rose'
      )}
    >
      <span className="relative block h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-black/10 shadow-inner">
        <span className="absolute inset-0" style={{ backgroundColor: value }} />
        <input
          type="color"
          aria-label={`${label} color picker`}
          value={normalizeHex(value)}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="line-clamp-1 text-[12.5px] font-medium leading-tight text-espresso">
          {label}
        </span>
        <input
          value={text}
          spellCheck={false}
          aria-label={`${label} hex value`}
          onChange={(e) => {
            const next = e.target.value
            setText(next)
            if (isHex(next)) onChange(normalizeHex(next))
          }}
          onBlur={() => {
            if (!isHex(text)) setText(value)
          }}
          className="w-full bg-transparent font-mono text-[11.5px] uppercase tracking-wide text-umber outline-none"
        />
      </span>
    </div>
  )
}

/* ------------------------------- SliderField ------------------------------ */

export function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  suffix = '',
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  suffix?: string
  onChange: (value: number) => void
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-[13px] font-medium text-espresso">{label}</span>
        <span className="rounded-md bg-cream px-2 py-0.5 font-mono text-[11.5px] text-umber">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-sand accent-flame outline-none"
      />
    </div>
  )
}

/* -------------------------------- Segmented ------------------------------- */

export interface SegmentOption<T extends string> {
  value: T
  label: string
  icon?: string
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  full,
  size = 'md',
  ariaLabel,
}: {
  options: Array<SegmentOption<T>>
  value: T
  onChange: (value: T) => void
  full?: boolean
  size?: 'sm' | 'md'
  ariaLabel?: string
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cx('inline-flex items-center gap-1 rounded-full border border-sand bg-cream p-1', full && 'w-full')}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cx(
              'inline-flex items-center justify-center gap-1.5 rounded-full font-medium transition',
              size === 'sm' ? 'h-7 px-3 text-[12px]' : 'h-8 px-3.5 text-[13px]',
              full && 'flex-1',
              active ? 'bg-paper text-charcoal shadow-[0_2px_8px_-4px_rgba(27,23,20,0.4)]' : 'text-umber hover:text-charcoal'
            )}
          >
            {option.icon ? <Icon name={option.icon} size={14} /> : null}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

/* ---------------------------------- Toggle -------------------------------- */

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  description?: string
}) {
  const control = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label ?? 'toggle'}
      onClick={() => onChange(!checked)}
      className={cx(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
        checked ? 'bg-flame' : 'bg-stone'
      )}
    >
      <span
        className={cx(
          'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-200',
          checked ? 'left-[22px]' : 'left-0.5'
        )}
      />
    </button>
  )

  if (!label) return control

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="text-[13.5px] font-medium text-charcoal">{label}</div>
        {description ? (
          <p className="mt-0.5 text-[12.5px] leading-snug text-umber">{description}</p>
        ) : null}
      </div>
      {control}
    </div>
  )
}

/* -------------------------------- ChoiceCard ------------------------------ */

export function ChoiceCard({
  label,
  note,
  active,
  onClick,
  preview,
  className,
}: {
  label: string
  note?: string
  active: boolean
  onClick: () => void
  preview?: ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cx(
        'group rounded-2xl border p-3 text-left transition duration-200',
        active
          ? 'border-charcoal bg-paper shadow-[0_16px_34px_-26px_rgba(27,23,20,0.85)]'
          : 'border-sand bg-cream/60 hover:border-clay hover:bg-cream',
        className
      )}
    >
      {preview ? <div className="mb-2.5">{preview}</div> : null}
      <span className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-medium text-charcoal">{label}</span>
        <span
          className={cx(
            'flex h-[18px] w-[18px] items-center justify-center rounded-full transition',
            active ? 'bg-charcoal text-ivory' : 'border border-stone text-transparent'
          )}
        >
          <Icon name="check" size={11} strokeWidth={2.6} />
        </span>
      </span>
      {note ? <span className="mt-0.5 block text-[11.5px] text-umber">{note}</span> : null}
    </button>
  )
}

/* ---------------------------------- Modal --------------------------------- */

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  if (!open) return null

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  } as const

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 bg-ink/45 backdrop-blur-[3px] anim-fade-in"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cx(
          'relative w-full overflow-hidden rounded-3xl border border-sand bg-paper shadow-[0_50px_120px_-40px_rgba(15,13,11,0.6)] anim-pop',
          sizes[size]
        )}
      >
        <div className="flex items-start justify-between gap-6 border-b border-sand/70 px-6 py-5">
          <div>
            <h2 className="display-serif text-[22px] leading-tight text-charcoal">{title}</h2>
            {description ? (
              <p className="mt-1 text-[13.5px] text-umber">{description}</p>
            ) : null}
          </div>
          <IconButton icon="x" label="Close" onClick={onClose} />
        </div>
        <div className="max-h-[65vh] overflow-y-auto px-6 py-5 thin-scroll">{children}</div>
        {footer ? (
          <div className="flex items-center justify-end gap-3 border-t border-sand/70 bg-cream/50 px-6 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  )
}

/* ---------------------------------- Toast --------------------------------- */

export function Toaster() {
  const toast = useStore((s) => s.toast)
  const hideToast = useStore((s) => s.hideToast)

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => hideToast(), 4200)
    return () => window.clearTimeout(timer)
  }, [toast, hideToast])

  if (!toast) return null

  const toneClass =
    toast.tone === 'success'
      ? 'bg-moss text-white'
      : toast.tone === 'error'
        ? 'bg-rose text-white'
        : 'bg-charcoal text-ivory'

  const icon = toast.tone === 'success' ? 'check' : toast.tone === 'error' ? 'alert' : 'info'

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-[100] flex w-[min(360px,calc(100vw-40px))] items-start gap-3 rounded-2xl border border-sand bg-paper p-4 shadow-[0_30px_70px_-30px_rgba(15,13,11,0.55)] anim-pop"
    >
      <span className={cx('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', toneClass)}>
        <Icon name={icon} size={16} strokeWidth={2.2} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-semibold text-charcoal">{toast.title}</p>
        {toast.message ? <p className="mt-0.5 text-[12.5px] leading-snug text-umber">{toast.message}</p> : null}
      </div>
      <IconButton icon="x" label="Dismiss" size={14} onClick={hideToast} className="-mr-1 -mt-1 h-7 w-7" />
    </div>
  )
}

/* ---------------------------------- Img ----------------------------------- */

export function Img({
  src,
  alt,
  className,
  style,
  eager,
}: {
  src: string
  alt: string
  className?: string
  style?: React.CSSProperties
  eager?: boolean
}) {
  const [current, setCurrent] = useState(src)

  useEffect(() => {
    setCurrent(src)
  }, [src])

  return (
    <img
      src={current}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      className={className}
      style={style}
      onError={() => {
        if (current !== IMAGE_FALLBACK) setCurrent(IMAGE_FALLBACK)
      }}
    />
  )
}

/* ------------------------------- EmptyState ------------------------------- */

export function EmptyState({
  icon = 'sparkles',
  title,
  message,
  action,
}: {
  icon?: string
  title: string
  message: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone bg-cream/40 px-6 py-12 text-center">
      <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-paper text-umber shadow-sm">
        <Icon name={icon} size={20} />
      </span>
      <h3 className="text-[15px] font-semibold text-charcoal">{title}</h3>
      <p className="mt-1 max-w-sm text-[13.5px] leading-relaxed text-umber">{message}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

/* -------------------------------- Sparkline -------------------------------- */

export function Sparkline({
  values,
  className,
  strokeWidth = 1.8,
}: {
  values: number[]
  className?: string
  strokeWidth?: number
}) {
  const path = useMemo(() => {
    if (values.length < 2) return { line: '', area: '' }
    const w = 100
    const h = 32
    const max = Math.max(...values)
    const min = Math.min(...values)
    const span = max - min || 1
    const points = values.map((v, i) => {
      const x = (i / (values.length - 1)) * w
      const y = h - ((v - min) / span) * (h - 6) - 3
      return [x, y] as const
    })
    const line = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
    const area = `${line} L${w} ${h} L0 ${h} Z`
    return { line, area }
  }, [values])

  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className={cx('h-8 w-full', className)} aria-hidden="true">
      <path d={path.area} fill="currentColor" opacity="0.1" />
      <path
        d={path.line}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

/* --------------------------------- StatCard -------------------------------- */

export function StatCard({
  label,
  value,
  delta,
  icon,
  trend,
  tone = 'default',
}: {
  label: string
  value: string
  delta?: string
  icon?: string
  trend?: number[]
  tone?: 'default' | 'dark'
}) {
  const positive = delta?.startsWith('+')
  return (
    <div
      className={cx(
        'rounded-2xl border p-5 transition',
        tone === 'dark'
          ? 'border-white/10 bg-smoke text-ivory'
          : 'border-sand bg-paper hover:border-clay/70'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={cx(
            'text-[12.5px] font-medium',
            tone === 'dark' ? 'text-ivory/60' : 'text-umber'
          )}
        >
          {label}
        </span>
        {icon ? (
          <span
            className={cx(
              'flex h-8 w-8 items-center justify-center rounded-full',
              tone === 'dark' ? 'bg-white/10 text-ivory/70' : 'bg-cream text-espresso'
            )}
          >
            <Icon name={icon} size={16} />
          </span>
        ) : null}
      </div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <span className="text-[27px] font-semibold tracking-[-0.02em] leading-none">{value}</span>
        {trend && trend.length > 1 ? (
          <span className={cx('w-20', tone === 'dark' ? 'text-flame-light' : 'text-flame')}>
            <Sparkline values={trend} />
          </span>
        ) : null}
      </div>
      {delta ? (
        <div
          className={cx(
            'mt-2.5 flex items-center gap-1.5 text-[12px] font-medium',
            tone === 'dark' ? 'text-ivory/55' : 'text-umber'
          )}
        >
          <span className={cx('flex items-center gap-1', positive ? 'text-moss' : 'text-rose')}>
            <Icon name="trendUp" size={13} className={positive ? '' : 'rotate-90'} />
            {delta}
          </span>
          <span className={tone === 'dark' ? 'text-ivory/45' : 'text-clay'}>vs. last week</span>
        </div>
      ) : null}
    </div>
  )
}

/* ------------------------------ SectionHeading ----------------------------- */

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
  tone = 'light',
  className,
}: {
  eyebrow: string
  title: ReactNode
  description?: string
  align?: 'center' | 'left'
  tone?: 'light' | 'dark'
  className?: string
}) {
  return (
    <div className={cx(align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-2xl', className)}>
      <span
        className={cx(
          'eyebrow flex items-center gap-2',
          align === 'center' && 'justify-center',
          tone === 'dark' && 'text-ivory/55'
        )}
      >
        <span className="h-px w-6 bg-current opacity-50" />
        {eyebrow}
        <span className="h-px w-6 bg-current opacity-50" />
      </span>
      <h2
        className={cx(
          'display-serif mt-4 text-[clamp(30px,4vw,46px)] leading-[1.08]',
          tone === 'dark' ? 'text-ivory' : 'text-charcoal'
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cx(
            'mt-4 text-[16px] leading-relaxed',
            tone === 'dark' ? 'text-ivory/65' : 'text-espresso/85'
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  )
}

/* -------------------------------- Skeleton --------------------------------- */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('skeleton rounded-lg', className)} />
}
