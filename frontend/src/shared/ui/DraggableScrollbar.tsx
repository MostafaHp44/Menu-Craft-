import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * Draggable vertical scrollbar on the right edge.
 * Grab the thumb and drag it to scroll the page (instead of the mouse wheel).
 * Thumb is blue; track is subtle. Hidden on touch devices.
 */
export function DraggableScrollbar() {
  const trackRef = useRef<HTMLDivElement>(null)
  const thumbRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [thumbHeight, setThumbHeight] = useState(60)
  const [thumbTop, setThumbTop] = useState(0)
  const dragging = useRef(false)
  const startY = useRef(0)
  const startScroll = useRef(0)

  /* show only when the page is scrollable and pointer is fine */
  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return
    setVisible(true)
  }, [])

  /* compute thumb size + position from scroll */
  const update = useCallback(() => {
    const doc = document.documentElement
    const scrollable = doc.scrollHeight - doc.clientHeight
    if (scrollable <= 0) return
    const trackH = trackRef.current?.clientHeight ?? 0
    if (trackH <= 0) return
    const ratio = doc.clientHeight / doc.scrollHeight
    const h = Math.max(trackH * ratio, 40)
    const maxTop = trackH - h
    const top = (doc.scrollTop / scrollable) * maxTop
    setThumbHeight(h)
    setThumbTop(top)
  }, [])

  useEffect(() => {
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [update])

  /* drag to scroll */
  const onThumbDown = (e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = true
    startY.current = e.clientY
    startScroll.current = window.scrollY
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'grabbing'
  }

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return
      const trackH = trackRef.current?.clientHeight ?? 0
      const thumbH = thumbHeight
      const maxTop = Math.max(trackH - thumbH, 1)
      const deltaY = e.clientY - startY.current
      const scrollable = document.documentElement.scrollHeight - document.documentElement.clientHeight
      const newScroll = startScroll.current + (deltaY / maxTop) * scrollable
      window.scrollTo({ top: Math.max(0, Math.min(newScroll, scrollable)) })
    }
    const onUp = () => {
      if (!dragging.current) return
      dragging.current = false
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [thumbHeight])

  /* click on track → jump */
  const onTrackClick = (e: React.MouseEvent) => {
    if (e.target !== trackRef.current) return
    const rect = trackRef.current!.getBoundingClientRect()
    const clickY = e.clientY - rect.top
    const trackH = rect.height
    const ratio = Math.max(0, Math.min(clickY / trackH, 1))
    const scrollable = document.documentElement.scrollHeight - document.documentElement.clientHeight
    window.scrollTo({ top: ratio * scrollable })
  }

  if (!visible) return null

  return (
    <div
      ref={trackRef}
      onClick={onTrackClick}
      className="fixed right-1.5 top-16 bottom-16 z-[99] hidden w-3 cursor-pointer rounded-full bg-black/[0.06] backdrop-blur-sm transition-colors hover:bg-black/[0.1] md:block"
      aria-hidden="true"
    >
      <div
        ref={thumbRef}
        onMouseDown={onThumbDown}
        className="absolute left-1/2 w-[6px] -translate-x-1/2 rounded-full bg-gradient-to-b from-[#1557A6] via-[#247BDF] to-[#55B8FF] shadow-[0_0_8px_rgba(36,123,223,0.5)] transition-colors hover:from-[#247BDF] hover:to-[#55B8FF]"
        style={{
          height: `${thumbHeight}px`,
          top: `${thumbTop}px`,
          cursor: 'grab',
        }}
        onMouseDownCapture={(e) => e.stopPropagation()}
      />
    </div>
  )
}
