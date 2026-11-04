import { useRef, useEffect, type ReactNode } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface Props {
  lines: ReactNode[]
  className?: string
}

/** Each line slides up from behind a mask, one after another, on scroll. */
export function MaskTextReveal({ lines, className = '' }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const targets = Array.from(el.querySelectorAll<HTMLElement>('[data-line]'))
    if (targets.length === 0) return

    gsap.set(targets, { yPercent: 120 })

    const tween = gsap.to(targets, {
      yPercent: 0,
      duration: 1,
      ease: 'power4.out',
      stagger: 0.15,
      scrollTrigger: {
        trigger: el,
        start: 'top 82%',
        toggleActions: 'play none none reverse',
      },
    })

    return () => {
      tween.scrollTrigger?.kill()
      tween.kill()
      gsap.set(targets, { clearProps: 'all' })
    }
  }, [lines])

  return (
    <div ref={ref} className={className}>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden">
          <span data-line className="block">
            {line}
          </span>
        </span>
      ))}
    </div>
  )
}
