import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'

/** Slowly drifting fluid blobs behind content — pure CSS shapes animated with GSAP. */
export function WaveBackground({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const blobs = Array.from(el.querySelectorAll<HTMLElement>('[data-blob]'))
    const tweens = blobs.map((blob, i) =>
      gsap.to(blob, {
        x: i % 2 === 0 ? 60 : -60,
        y: i % 2 === 0 ? -40 : 40,
        scale: i % 2 === 0 ? 1.15 : 0.9,
        duration: 6 + i * 2,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      })
    )
    return () => tweens.forEach((t) => t.kill())
  }, [])

  return (
    <div ref={ref} aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div
        data-blob
        className="absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(36,123,223,0.25),transparent_70%)] blur-2xl"
      />
      <div
        data-blob
        className="absolute -bottom-40 -right-24 h-[380px] w-[380px] rounded-full bg-[radial-gradient(circle,rgba(85,184,255,0.2),transparent_70%)] blur-2xl"
      />
      <div
        data-blob
        className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(21,87,166,0.18),transparent_70%)] blur-3xl"
      />
    </div>
  )
}
