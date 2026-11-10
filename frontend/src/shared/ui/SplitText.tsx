import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface Props {
  text: string
  className?: string
  /** reveal each word individually with a stagger */
  mode?: 'words' | 'chars'
  delay?: number
}

/** Splits text into words (or chars) and reveals them on scroll — word by word. */
export function SplitText({ text, className = '', mode = 'words', delay = 0 }: Props) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const targets = Array.from(el.querySelectorAll<HTMLElement>('[data-part]'))
    if (targets.length === 0) return

    gsap.set(targets, { y: '110%', opacity: 0 })

    const tween = gsap.to(targets, {
      y: '0%',
      opacity: 1,
      duration: 0.9,
      ease: 'power4.out',
      stagger: mode === 'chars' ? 0.03 : 0.09,
      delay,
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        toggleActions: 'play none none reverse',
      },
    })

    /* Safety net: if the scroll-timeline toggle never fires on touch, reveal */
    /* the words so content is never left stuck at opacity 0. */
    const safety = window.setTimeout(() => {
      targets.forEach((t) => {
        const o = parseFloat(getComputedStyle(t).opacity)
        if (o < 0.3) gsap.set(t, { y: '0%', opacity: 1 })
      })
    }, 2500)

    return () => {
      window.clearTimeout(safety)
      tween.scrollTrigger?.kill()
      tween.kill()
      gsap.set(targets, { clearProps: 'all' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, mode, delay])

  return (
    <span ref={ref} className={`inline-block overflow-hidden ${className}`} aria-label={text}>
      {mode === 'chars'
        ? text.split('').map((c, i) => (
            <span key={i} className="inline-block overflow-hidden align-bottom">
              <span data-part className="inline-block">
                {c === ' ' ? '\u00A0' : c}
              </span>
            </span>
          ))
        : text.split(' ').map((w, i, arr) => (
            <span key={i} className="inline-block overflow-hidden align-bottom">
              <span data-part className="inline-block">
                {w}
                {i < arr.length - 1 ? '\u00A0' : ''}
              </span>
            </span>
          ))}
    </span>
  )
}
