import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/** Cinematic page-load intro: dark overlay + logo reveal + fade out. Runs once per session. */
export function PageIntro() {
  const [show, setShow] = useState(() => {
    try {
      return !sessionStorage.getItem('dm-intro-done')
    } catch {
      return true
    }
  })

  useEffect(() => {
    if (!show) return
    const t = setTimeout(() => {
      setShow(false)
      try {
        sessionStorage.setItem('dm-intro-done', '1')
      } catch { /* ignore */ }
    }, 2200)
    return () => clearTimeout(t)
  }, [show])

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          key="intro"
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#071426]"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center"
          >
            <div className="text-[clamp(40px,8vw,80px)] font-extrabold tracking-tight">
              <span className="text-[#55B8FF]">Digital</span>{' '}
              <span className="text-white">Menu</span>
            </div>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1, delay: 0.4, ease: 'easeInOut' }}
              className="mx-auto mt-4 h-[2px] w-40 origin-left bg-gradient-to-r from-[#1557A6] to-[#55B8FF]"
            />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
