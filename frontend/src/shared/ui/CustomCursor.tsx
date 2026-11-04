import { useEffect, useRef, useState } from 'react'

/** Glowing blue dot cursor on desktop — grows on interactive elements. Hidden on touch. */
export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [hovering, setHovering] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return
    setVisible(true)

    let mouseX = -100
    let mouseY = -100
    let ringX = -100
    let ringY = -100
    let raf = 0

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`
      }
      const target = e.target as HTMLElement
      setHovering(!!target.closest('a, button, [role="button"], input, textarea, select'))
    }

    const loop = () => {
      ringX += (mouseX - ringX) * 0.4
      ringY += (mouseY - ringY) * 0.4
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    window.addEventListener('mousemove', onMove)
    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  if (!visible) return null

  return (
    <>
      {/* dot */}
      <div
        ref={dotRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[9999] h-2 w-2 rounded-full bg-[#55B8FF] mix-blend-difference"
        style={{ transform: 'translate(-100px, -100px) translate(-50%, -50%)' }}
      />
      {/* ring */}
      <div
        ref={ringRef}
        aria-hidden="true"
        className={`pointer-events-none fixed left-0 top-0 z-[9998] rounded-full border border-[#247BDF]/60 transition-[width,height,background-color] duration-200 ${
          hovering ? 'h-12 w-12 bg-[#247BDF]/10' : 'h-6 w-6'
        }`}
        style={{ transform: 'translate(-100px, -100px) translate(-50%, -50%)' }}
      />
    </>
  )
}
