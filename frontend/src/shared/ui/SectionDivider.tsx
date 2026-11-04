import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/** Animated gradient line that draws itself when scrolled into view. */
export function SectionDivider() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const tween = gsap.fromTo(
      ref.current,
      { scaleX: 0 },
      {
        scaleX: 1,
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: { trigger: ref.current, start: 'top 90%', toggleActions: 'play none none reverse' },
      }
    )
    return () => {
      tween.scrollTrigger?.kill()
      tween.kill()
    }
  }, [])

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="mx-auto h-px w-full max-w-5xl origin-center bg-gradient-to-r from-transparent via-[#247BDF]/40 to-transparent"
    />
  )
}
