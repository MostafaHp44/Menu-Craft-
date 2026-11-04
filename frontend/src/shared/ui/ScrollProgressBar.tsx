import { useEffect, useState } from 'react'

/** Horizontal scroll progress bar at the top — visible on desktop and mobile. */
export function ScrollProgressBar() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement
      const scrollTop = doc.scrollTop || document.body.scrollTop
      const scrollHeight = doc.scrollHeight - doc.clientHeight
      setProgress(scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-[100] h-[3px] origin-left bg-gradient-to-r from-[#1557A6] via-[#247BDF] to-[#55B8FF]"
      style={{ transform: `scaleX(${progress / 100})` }}
    />
  )
}
