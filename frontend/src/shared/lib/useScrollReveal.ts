import { useEffect } from 'react'
import type { RefObject } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function useScrollReveal(sectionRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const text = Array.from(el.querySelectorAll<HTMLElement>('[data-reveal]'))
    const imgs = Array.from(el.querySelectorAll<HTMLElement>('[data-reveal-img]'))
    if (!text.length && !imgs.length) return

    const ctx = gsap.context(() => {
     text.forEach((t) => {
  gsap.fromTo(
    t,
    { y: 100, opacity: 0 },
    {
      y: 0, opacity: 1, ease: 'power2.out',
      scrollTrigger: {
        trigger: t,
        start: 'top 95%',
        end: 'top 45%',
        scrub: 1.2,
        invalidateOnRefresh: true,
      },
    }
  )
})
imgs.forEach((t) => {
  gsap.fromTo(
    t,
    { clipPath: 'inset(100% 0 0 0)' },
    {
      clipPath: 'inset(0% 0 0 0)', ease: 'power2.out',
      scrollTrigger: {
        trigger: t,
        start: 'top 95%',
        end: 'top 35%',
        scrub: 1.2,
        invalidateOnRefresh: true,
      },
    }
  )
})
      imgs.forEach((t) => {
        gsap.fromTo(
          t,
          { clipPath: 'inset(100% 0 0 0)' },
          {
            clipPath: 'inset(0% 0 0 0)', ease: 'none',
            scrollTrigger: { trigger: t, start: 'top 92%', end: 'top 50%', scrub: 0.5, invalidateOnRefresh: true },
          }
        )
      })
    }, el)

    const refresh = () => ScrollTrigger.refresh()
    const raf = requestAnimationFrame(refresh)
    window.addEventListener('load', refresh)
    document.fonts?.ready.then(refresh)
    el.querySelectorAll('img').forEach((img) => {
      if (!img.complete) img.addEventListener('load', refresh, { once: true })
    })

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('load', refresh)
      ctx.revert()
    }
  }, [sectionRef])
}