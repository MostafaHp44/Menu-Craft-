/**
 * Hero concept 1 — "Cinematic Stage".
 * Full-bleed admin video/image background, one headline, one CTA, calm motion.
 * Admin-controlled via homeContent.hero.{videoDesktop,videoMobile,imageDesktop,imageMobile,image}.
 */
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { useHomeContentByLang } from '../../../shared/store/useHomeContent.ts'
import { useI18n } from '../../../shared/i18n'
import { getHeroVariant } from '../../../templates/data/heroVariants.ts'

export default function CinematicStageHero() {
  const { lang, t } = useI18n()
  const contentByLang = useHomeContentByLang()
  const hero = contentByLang[lang]?.hero || contentByLang.en?.hero
  const variant = getHeroVariant((hero as any)?.variant)
  const reduce = useReducedMotion()
  const stageRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: stageRef, offset: ['start start', 'end start'] })
  const mediaY = useTransform(scrollYProgress, [0, 1], ['0%', '12%'])

  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  const video = isMobile
    ? (hero as any)?.videoMobile || (hero as any)?.video
    : (hero as any)?.videoDesktop || (hero as any)?.video
  const image = isMobile
    ? (hero as any)?.imageMobile || (hero as any)?.imageDesktop || (hero as any)?.image
    : (hero as any)?.imageDesktop || (hero as any)?.image
  const [videoOk, setVideoOk] = useState(true)
  useEffect(() => setVideoOk(true), [video])

  return (
    <section
      ref={stageRef}
      className="mc-stage relative isolate flex h-[100svh] min-h-[540px] w-full items-center overflow-hidden text-white"
      style={{ backgroundColor: variant.bg }}
    >
      <motion.div aria-hidden className="absolute inset-0 -top-[8%] h-[116%] w-full" style={reduce ? undefined : { y: mediaY }}>
        {video && videoOk ? (
          <video
            key={video}
            autoPlay
            muted
            loop
            playsInline
            poster={image || undefined}
            src={video}
            onError={() => setVideoOk(false)}
            className="h-full w-full object-cover opacity-70"
          />
        ) : image ? (
          <img src={image} alt="" className="h-full w-full object-cover opacity-70" />
        ) : (
          <div className="h-full w-full" style={{ background: `radial-gradient(70% 60% at 70% 40%, ${variant.glow}40, transparent 70%)` }} />
        )}
      </motion.div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(90deg, ${variant.bg}f2 0%, ${variant.bg}b3 42%, ${variant.bg}33 100%), radial-gradient(60% 50% at 80% 30%, ${variant.glow}22, transparent 70%)`,
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-[1600px] px-6 md:px-16 lg:px-24">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl"
        >
          <span className="mb-6 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.28em] text-white/60">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: variant.accent }} />
            {t('homeV2.pill')}
          </span>
          <h1
            className="font-extrabold leading-[0.92] tracking-[-0.06em]"
            style={{ fontSize: 'clamp(56px, 10vw, 150px)', color: variant.accent }}
          >
            Digital Menu
          </h1>
          <Link
            to="/templates"
            className="mt-10 inline-flex min-h-14 items-center gap-3 rounded-full px-8 py-3.5 text-sm font-bold text-white transition duration-300 hover:-translate-y-0.5"
            style={{ backgroundColor: variant.accent }}
          >
            {t('homeV2.primaryCta')} <span aria-hidden="true">→</span>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
