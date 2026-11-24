/**
 * Hero concept 3 — "Single Focus".
 * One hero phone (admin template video), one headline, two quiet CTAs.
 * Calm one-shot motion, no kinetic type, no infinite bouncing.
 */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion'
import { TEMPLATES } from '../../../templates/data/templates.ts'
import { useHomeContentByLang } from '../../../shared/store/useHomeContent.ts'
import { useI18n } from '../../../shared/i18n'
import { getHeroVariant } from '../../../templates/data/heroVariants.ts'
import { Icon } from '../../../shared/ui/icons.tsx'

export default function SingleFocusHero() {
  const { lang, t } = useI18n()
  const reduce = useReducedMotion()
  const contentByLang = useHomeContentByLang()
  const hero = contentByLang[lang]?.hero || contentByLang.en?.hero
  const variant = getHeroVariant((hero as any)?.variant)

  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  const templates = useMemo(() => TEMPLATES.slice(0, 3), [])
  const [active, setActive] = useState(0)
  const template = templates[active] || templates[0]
  const video = isMobile
    ? (template as any)?.heroVideoMobile || (template as any)?.heroVideo || ''
    : (template as any)?.heroVideoDesktop || (template as any)?.heroVideo || ''
  const photo = template?.heroImage || template?.previewImage
  const label = template?.sample?.name || template?.name || ''

  const pointerX = useMotionValue(0)
  const shift = useTransform(pointerX, [-0.5, 0.5], [-7, 7])

  return (
    <section
      className="mc-focus-hero relative isolate overflow-hidden bg-[#08090b] pb-16 pt-28 text-white sm:pb-24 lg:min-h-[100svh] lg:pt-32"
      style={{ backgroundColor: variant.bg }}
    >
      <div aria-hidden className="mc-hero-grid pointer-events-none absolute inset-0 opacity-40" />
      <div aria-hidden className="mc-hero-glow pointer-events-none absolute inset-0" />

      <div className="page relative z-10 mx-auto w-full max-w-[1500px] px-4 sm:px-8 lg:px-10">
        <div className="grid items-center gap-10 lg:min-h-[680px] lg:grid-cols-[1fr_0.95fr] lg:gap-12">
          {/* --------------------------- copy --------------------------- */}
          <div className="relative z-20 mx-auto w-full max-w-[620px] text-center lg:mx-0 lg:text-start">
            <motion.div initial={reduce ? false : { opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
              <span className="mc-pill inline-flex items-center gap-2 rounded-full border border-[#0e0ad8]/45 bg-[#0e0ad8]/[0.14] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#0e0ad8]">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: variant.accent }} />
                {t('homeV2.pill')}
              </span>
            </motion.div>
            <motion.h1
              initial={reduce ? false : { opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="mc-hero-title mt-6 text-[clamp(3rem,7.5vw,6.5rem)] font-semibold leading-[0.98] tracking-[-0.06em]"
              style={{ color: variant.accent }}
            >
              Digital Menu
            </motion.h1>
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.18 }}
              className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center lg:justify-start"
            >
              <Link to="/templates" className="mc-primary-cta inline-flex min-h-14 items-center justify-center gap-3 rounded-full px-7 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5">
                {t('homeV2.primaryCta')} <Icon name="arrowRight" size={16} className="rtl:rotate-180" />
              </Link>
              <Link to={`/templates/${template?.id || ''}`} className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/[0.04] px-7 py-3 text-sm font-semibold text-white/85 transition hover:border-white/40">
                {t('homeV2.previewTemplate')}
              </Link>
            </motion.div>
            <motion.div
              initial={reduce ? false : { opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="mt-8 flex items-center justify-center gap-10 lg:justify-start"
            >
              <div><div className="text-2xl font-bold tracking-tight">5 min</div><div className="mt-1 text-[11px] text-white/40">to go live</div></div>
              <div><div className="text-2xl font-bold tracking-tight">4.9★</div><div className="mt-1 text-[11px] text-white/40">owner rating</div></div>
            </motion.div>
          </div>

          {/* ------------------------- hero phone ------------------------ */}
          <motion.div
            style={reduce ? undefined : { x: shift }}
            onMouseMove={(event) => {
              if (reduce) return
              const r = event.currentTarget.getBoundingClientRect()
              if (r.width) pointerX.set((event.clientX - r.left) / r.width - 0.5)
            }}
            onMouseLeave={() => pointerX.set(0)}
            className="relative mx-auto flex w-full max-w-[460px] justify-center lg:max-w-none"
          >
            <div aria-hidden className="pointer-events-none absolute inset-[12%] rounded-full blur-[90px]" style={{ background: `${variant.glow}26` }} />

            <motion.div
              initial={reduce ? false : { opacity: 0, y: 42, scale: 0.88 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.95, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-[72%] max-w-[300px] sm:w-[62%] lg:w-[58%]"
            >
              <div className="rounded-[38px] border-[6px] border-[#2f3138] bg-[#0d0e12] p-1.5 shadow-[0_45px_110px_rgba(0,0,0,.75)] sm:rounded-[44px] sm:border-[7px] sm:p-2">
                <div className="relative h-[430px] overflow-hidden rounded-[29px] bg-[#f5f0e6] sm:h-[580px] sm:rounded-[34px] lg:h-[640px]">
                  <img src={photo} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  {video ? (
                    <video
                      key={video}
                      autoPlay
                      muted
                      loop
                      playsInline
                      poster={photo}
                      src={video}
                      onError={(e) => { e.currentTarget.style.display = 'none' }}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10" />
                  <div className="absolute inset-x-4 top-4 flex items-center justify-between text-[9px] font-semibold tracking-[0.16em] text-white/80">MENUCRAFT <span>•••</span></div>
                  <div className="absolute inset-x-4 bottom-5 text-white">
                    <div className="font-serif text-3xl sm:text-4xl">{label}</div>
                    <div className="mt-1 text-[10px] text-white/75">{template?.name}</div>
                    <div className="mt-3 rounded-full border border-white/40 bg-white/15 px-3 py-2 text-center text-[10px] backdrop-blur">{t('homeV2.scanToOrder')}</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* tiny static switcher — no looping motion */}
            {templates.length > 1 ? (
              <div className="absolute bottom-0 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-[#111813]/95 p-1.5 backdrop-blur">
                {templates.map((tpl, i) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setActive(i)}
                    aria-label={tpl.name}
                    className={`h-2.5 rounded-full transition-all ${i === active ? 'w-7 bg-[#0e0ad8]' : 'w-2.5 bg-white/25 hover:bg-white/50'}`}
                  />
                ))}
              </div>
            ) : null}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
