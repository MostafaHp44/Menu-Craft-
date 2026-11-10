import { useRef, useEffect, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface Props {
  src: string
  poster?: string
}

/**
 * A small picture-in-picture video that fades in once the user scrolls
 * past the hero, and hides again when the footer is reached.
 */
export function FloatingVideo({ src, poster }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    /* show after the first screen, hide again at the very bottom */
    const st = ScrollTrigger.create({
      start: '600 top',
      end: 'max',
      onUpdate: (self) => {
        const atBottom = self.progress > 0.97
        setVisible(self.scroll() > 600 && !atBottom)
      },
    })

    return () => st.kill()
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    gsap.to(el, {
      opacity: visible ? 1 : 0,
      y: visible ? 0 : 30,
      scale: visible ? 1 : 0.9,
      duration: 0.45,
      ease: 'power3.out',
      pointerEvents: visible ? 'auto' : 'none',
    })
  }, [visible])

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="fixed bottom-5 left-5 z-[90] hidden w-44 overflow-hidden rounded-xl border border-white/15 opacity-0 shadow-2xl shadow-black/40 lg:block"
    >
      <video src={src} poster={poster} autoPlay muted loop playsInline className="h-24 w-full object-cover" />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1">
        <span className="text-[10px] font-medium uppercase tracking-wider text-white/80">Live preview</span>
      </div>
    </div>
  )
}
