import { useRef, useEffect, type ReactNode } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface Props {
  children: ReactNode
  className?: string
}

/**
 * A phone mockup that tilts into view as you scroll:
 * starts rotated back and flat, ends facing the user.
 */
export function DeviceMockup({ children, className = '' }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const tween = gsap.fromTo(
      el,
      { rotateY: -28, rotateX: 14, scale: 0.86, y: 80, opacity: 0.4 },
      {
        rotateY: 0,
        rotateX: 0,
        scale: 1,
        y: 0,
        opacity: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top 90%',
          end: 'top 35%',
          scrub: 0.7,
        },
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
      className={className}
      style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}
    >
      {children}
    </div>
  )
}
