import { useEffect, useRef, useState } from 'react'

interface Props {
  value: number
  suffix?: string
  prefix?: string
  className?: string
}

/** Counts up from 0 to `value` when it scrolls into view. */
export function AnimatedCounter({ value, suffix = '', prefix = '', className = '' }: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const [display, setDisplay] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(value)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started.current) {
          started.current = true
          const duration = 1800
          const start = performance.now()
          const tick = (now: number) => {
            const p = Math.min((now - start) / duration, 1)
            const eased = 1 - Math.pow(1 - p, 4) // ease-out quart
            setDisplay(Math.round(value * eased))
            if (p < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.4 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [value])

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display.toLocaleString()}
      {suffix}
    </span>
  )
}
