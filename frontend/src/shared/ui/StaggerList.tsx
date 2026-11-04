import { useRef, useEffect, type ReactNode } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface Props {
  children: ReactNode
  className?: string
  /** selector for the individual items inside */
  itemSelector?: string
}

/** Reveals list items one after another as the section scrolls in. */
export function StaggerList({ children, className = '', itemSelector = 'li' }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const items = Array.from(el.querySelectorAll<HTMLElement>(itemSelector))
    if (items.length === 0) return

    gsap.set(items, { x: -30, opacity: 0 })

    const tween = gsap.to(items, {
      x: 0,
      opacity: 1,
      duration: 0.7,
      ease: 'power3.out',
      stagger: 0.12,
      scrollTrigger: {
        trigger: el,
        start: 'top 80%',
        toggleActions: 'play none none reverse',
      },
    })

    return () => {
      tween.scrollTrigger?.kill()
      tween.kill()
      gsap.set(items, { clearProps: 'all' })
    }
  }, [itemSelector])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
