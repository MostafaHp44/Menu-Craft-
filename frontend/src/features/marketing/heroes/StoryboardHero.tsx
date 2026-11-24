/**
 * Hero concept 4 — "Storyboard".
 * Three quiet scenes crossfade: paper menu → QR scan → live digital menu.
 * Media comes from existing admin fields (hero image/video + template video)
 * and the real QR link — no new admin fields, no hardcoded video URLs.
 */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { TEMPLATES } from '../../../templates/data/templates.ts'
import { useHomeContentByLang } from '../../../shared/store/useHomeContent.ts'
import { useActiveRestaurant } from '../../../shared/store/useStore.ts'
import { useI18n } from '../../../shared/i18n'
import { getHeroVariant } from '../../../templates/data/heroVariants.ts'
import { publicSiteLink } from '../../../shared/lib/hooks.ts'

const SCENES = ['Paper', 'Scan', 'Live'] as const

export default function StoryboardHero() {
  const { lang, t } = useI18n()
  const reduce = useReducedMotion()
  const restaurant = useActiveRestaurant()
  const contentByLang = useHomeContentByLang()
  const hero = contentByLang[lang]?.hero || contentByLang.en?.hero
  const variant = getHeroVariant((hero as any)?.variant)

  const [scene, setScene] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (reduce) return
    const id = window.setInterval(() => setScene((s) => (s + 1) % SCENES.length), 4200)
    return () => window.clearInterval(id)
  }, [reduce])

  const template = useMemo(() => TEMPLATES[0], [])
  const video = isMobile
    ? (template as any)?.heroVideoMobile || (template as any)?.heroVideo || ''
    : (template as any)?.heroVideoDesktop || (template as any)?.heroVideo || ''
  const heroImage = isMobile
    ? (hero as any)?.imageMobile || (hero as any)?.imageDesktop || (hero as any)?.image
    : (hero as any)?.imageDesktop || (hero as any)?.image
  const menuImage = template?.heroImage || template?.previewImage
  const label = template?.sample?.name || template?.name || ''

  return (
    <section
      className="mc-story-hero relative isolate flex min-h-[100svh] w-full flex-col justify-end overflow-hidden pb-14 pt-32 text-white"
      style={{ backgroundColor: variant.bg }}
    >
      {/* ------------------------- crossfading scenes ------------------------- */}
      <AnimatePresence mode="sync">
        <motion.div
          key={scene}
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduce ? undefined : { opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.9, ease: 'easeInOut' }}
          className="absolute inset-0"
          aria-hidden="true"
        >
          {scene === 0 ? (
            /* scene 1 — a paper menu, drawn in code (no external asset) */
            <div className="flex h-full w-full items-center justify-center bg-[#e9e3d8]">
              <div className="w-[62%] max-w-[360px] rotate-[-2deg] bg-[#faf7f0] p-6 shadow-[0_30px_80px_rgba(0,0,0,.28)] sm:p-8">
                <div className="border-b-2 border-[#2f2a24] pb-3 text-center font-serif text-xl tracking-[.2em] text-[#2f2a24] sm:text-2xl">MENU</div>
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="mt-5 flex items-end gap-2">
                    <span className="h-2 flex-1 rounded bg-[#c9c1b4]" />
                    <span className="h-2 w-8 rounded bg-[#c9c1b4]" />
                  </div>
                ))}
                <div className="mt-9 text-center text-[9px] uppercase tracking-[.2em] text-[#8a8276]">ask your server</div>
              </div>
            </div>
          ) : null}

          {scene === 1 ? (
            /* scene 2 — real QR link for this restaurant */
            <div className="flex h-full w-full items-center justify-center" style={{ background: `radial-gradient(60% 60% at 50% 45%, ${variant.glow}33, transparent 70%), #08090b` }}>
              <div className="rounded-[26px] border border-white/10 bg-white p-5 shadow-[0_40px_100px_rgba(0,0,0,.6)]">
                <QRCodeSVG value={publicSiteLink(restaurant?.slug || 'bella')} size={190} />
              </div>
            </div>
          ) : null}

          {scene === 2 ? (
            /* scene 3 — admin video / image of a real template */
            <div className="h-full w-full bg-[#08090b]">
              {heroImage ? <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" /> : null}
              <img src={menuImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-55" />
              {video ? (
                <video
                  key={video}
                  autoPlay
                  muted
                  loop
                  playsInline
                  src={video}
                  poster={menuImage}
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                  className="absolute inset-0 h-full w-full object-cover opacity-70"
                />
              ) : null}
            </div>
          ) : null}
        </motion.div>
      </AnimatePresence>

      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#08090b] via-[#08090b]/50 to-[#08090b]/30" />

      {/* --------------------------- fixed copy --------------------------- */}
      <div className="page relative z-10 mx-auto w-full max-w-[1600px] px-4 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}>
            <span className="inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.26em] text-white/55">
              {SCENES.map((s, i) => (
                <span key={s} className={i === scene ? 'text-[#0e0ad8]' : ''}>{s}</span>
              ))}
            </span>
          </motion.div>
          <motion.h1
            initial={reduce ? false : { opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="mc-hero-title mt-6 text-[clamp(3rem,8vw,7rem)] font-semibold leading-[0.98] tracking-[-0.06em]"
            style={{ color: variant.accent }}
          >
            Digital Menu
          </motion.h1>
          <motion.div initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="mt-8 flex justify-center">
            <Link to="/templates" className="mc-primary-cta inline-flex min-h-14 items-center gap-3 rounded-full px-7 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5">
              {t('homeV2.primaryCta')} <span aria-hidden="true">→</span>
            </Link>
          </motion.div>
          <p className="mt-8 text-[11px] text-white/35">{label}</p>
        </div>
      </div>
    </section>
  )
}
