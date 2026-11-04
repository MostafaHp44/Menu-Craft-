import { useEffect } from 'react'
import type { RefObject } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * Progressive reveal tied to scroll position.
 *  - `[data-reveal]`      → y + opacity (text elements)
 *  - `[data-reveal-img]`  → clip-path mask reveal (images)
 * Both scrub with the scroll and reverse when scrolling back up.
 */
export function useScrollReveal(sectionRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const tweens: gsap.core.Tween[] = []

    /* text reveals */
    const textTargets = Array.from(el.querySelectorAll<HTMLElement>('[data-reveal]'))
    if (textTargets.length > 0) {
      gsap.set(textTargets, { y: 50, opacity: 0 })
      textTargets.forEach((target, i) => {
        tweens.push(
          gsap.to(target, {
            y: 0,
            opacity: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: el,
              start: `top ${88 - i * 8}%`,
              end: `top ${40 - i * 8}%`,
              scrub: 0.5,
              invalidateOnRefresh: true,
            },
          })
        )
      })
    }

    /* image mask reveals */
    const imgTargets = Array.from(el.querySelectorAll<HTMLElement>('[data-reveal-img]'))
    if (imgTargets.length > 0) {
      gsap.set(imgTargets, { clipPath: 'inset(100% 0 0 0)' })
      imgTargets.forEach((target) => {
        tweens.push(
          gsap.to(target, {
            clipPath: 'inset(0% 0 0 0)',
            ease: 'none',
            scrollTrigger: {
              trigger: target,
              start: 'top 90%',
              end: 'top 45%',
              scrub: 0.5,
              invalidateOnRefresh: true,
            },
          })
        )
      })
    }

    const raf = requestAnimationFrame(() => ScrollTrigger.refresh())

    return () => {
      cancelAnimationFrame(raf)
      tweens.forEach((t) => {
        t.scrollTrigger?.kill()
        t.kill()
      })
      gsap.set([...textTargets, ...imgTargets], { clearProps: 'all' })
    }
  }, [sectionRef])
}
