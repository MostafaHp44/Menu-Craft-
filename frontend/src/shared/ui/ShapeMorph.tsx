import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * Background shapes that morph between border-radius forms as you scroll.
 * Pure CSS border-radius morphing driven by ScrollTrigger — no SVG libs needed.
 */
export function ShapeMorph({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const shapes = Array.from(el.querySelectorAll<HTMLElement>('[data-shape]'))
    if (shapes.length === 0) return

    const tweens = shapes.map((shape, i) =>
      gsap.to(shape, {
        borderRadius:
          i % 2 === 0
            ? '60% 40% 30% 70% / 60% 30% 70% 40%'
            : '30% 60% 70% 40% / 50% 60% 30% 60%',
        rotation: i % 2 === 0 ? 180 : -180,
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.2,
        },
      })
    )

    return () => {
      tweens.forEach((t) => {
        t.scrollTrigger?.kill()
        t.kill()
      })
    }
  }, [])

  return (
    <div ref={ref} aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div
        data-shape
        className="absolute -left-24 top-1/4 h-72 w-72 rounded-[40%_60%_70%_40%/60%_30%_70%_40%] bg-[#247BDF]/10 blur-3xl"
      />
      <div
        data-shape
        className="absolute -right-20 bottom-1/4 h-64 w-64 rounded-[30%_60%_70%_40%/50%_60%_30%_60%] bg-[#55B8FF]/10 blur-3xl"
      />
    </div>
  )
}
