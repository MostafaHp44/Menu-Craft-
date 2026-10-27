import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { cx } from '../lib/utils'

/**
 * Renders children at a fixed logical width and scales them down to fit the
 * available space, so a "desktop" preview really is a desktop rendering
 * (container queries inside respond to the true 1440px width).
 */
export function ScaledFrame({
  width,
  maxHeight,
  children,
  className,
  style,
}: {
  width: number
  maxHeight?: number
  children: ReactNode
  className?: string
  style?: CSSProperties
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [contentHeight, setContentHeight] = useState(0)

  useEffect(() => {
    const wrap = wrapRef.current
    const inner = innerRef.current
    if (!wrap || !inner) return

    const update = () => {
      const available = wrap.clientWidth
      if (available <= 0) return
      const next = Math.min(1, available / width)
      setScale(next)
      setContentHeight(Math.ceil(inner.scrollHeight * next))
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(wrap)
    observer.observe(inner)
    window.addEventListener('resize', update)

    const timer = window.setTimeout(update, 350)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', update)
      window.clearTimeout(timer)
    }
  }, [width, children])

  const frameHeight = maxHeight ? Math.min(contentHeight, maxHeight) : contentHeight

  return (
    <div
      ref={wrapRef}
      className={cx('relative w-full overflow-hidden', className)}
      style={{ height: frameHeight || undefined, ...style }}
    >
      <div
        ref={innerRef}
        style={{ width, transform: `scale(${scale})`, transformOrigin: 'top left' }}
      >
        {children}
      </div>
    </div>
  )
}

/** Device shell used for mobile previews. */
export function PhoneFrame({
  children,
  className,
  width = 268,
  screen = 540,
  label,
}: {
  children: ReactNode
  className?: string
  width?: number
  screen?: number
  label?: string
}) {
  return (
    <div className={cx('relative', className)} style={{ width }}>
      <div
        className="relative rounded-[38px] border border-black/25 bg-gradient-to-b from-[#2b2622] to-[#15120f] p-[9px] shadow-[0_50px_90px_-45px_rgba(15,13,11,0.85)]"
        style={{ paddingBottom: screen * 0 + 9 }}
      >
        <div className="absolute left-1/2 top-[15px] z-20 h-[5px] w-16 -translate-x-1/2 rounded-full bg-white/25" />
        <div
          className="relative overflow-hidden rounded-[30px] bg-white"
          style={{ height: screen }}
        >
          {children}
        </div>
      </div>
      {label ? (
        <div className="mt-3 text-center text-[11.5px] font-medium tracking-[0.14em] uppercase text-umber">
          {label}
        </div>
      ) : null}
    </div>
  )
}

/** Desktop browser chrome used across the marketing pages. */
export function BrowserFrame({
  url,
  badge,
  children,
  className,
}: {
  url: string
  badge?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cx(
        'overflow-hidden rounded-2xl border border-sand bg-paper shadow-[0_60px_120px_-55px_rgba(15,13,11,0.85)]',
        className
      )}
    >
      <div className="flex items-center gap-3 border-b border-sand bg-cream px-4 py-2.5">
        <span className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#e8a0a0]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#e8d2a0]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#a8d5b5]" />
        </span>
        <span className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-sand bg-paper px-3 py-1">
          <svg width="11" height="13" viewBox="0 0 12 14" fill="none" aria-hidden="true">
            <rect x="1" y="6" width="10" height="7" rx="2" fill="#7D7263" />
            <path d="M3.5 6V4a2.5 2.5 0 0 1 5 0v2" stroke="#7D7263" strokeWidth="1.6" />
          </svg>
          <span className="line-clamp-1 text-[12.5px] text-umber">{url}</span>
        </span>
        {badge ? (
          <span className="hidden items-center gap-1.5 rounded-full bg-moss/12 px-2.5 py-1 text-[11px] font-semibold text-moss sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-moss anim-pulse-dot" />
            {badge}
          </span>
        ) : null}
      </div>
      {children}
    </div>
  )
}
