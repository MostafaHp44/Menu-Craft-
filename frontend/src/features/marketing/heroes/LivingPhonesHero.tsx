/**
 * Hero concept 2 — "Living Phones".
 * Three template phones; each plays the template's own admin-uploaded video
 * (heroVideoDesktop / heroVideoMobile) before falling back to its hero image.
 * Calm, one-shot motion: no roaming text, no infinite bouncing.
 */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion'
import { TEMPLATES } from '../../../templates/data/templates.ts'
import { useHomeContentByLang } from '../../../shared/store/useHomeContent.ts'
import { useI18n } from '../../../shared/i18n'
import { getHeroVariant } from '../../../templates/data/heroVariants.ts'
import { Icon } from '../../../shared/ui/icons.tsx'

type Slot = { pos: string; rotate: string; delay: number; z: string }

const SLOTS: Slot[] = [
  { pos: 'start-[2%] top-[18%] w-[34%] max-w-[180px]', rotate: '-rotate-7', delay: 0.15, z: 'z-10' },
  { pos: 'end-[2%] top-[20%] w-[34%] max-w-[180px]', rotate: 'rotate-7', delay: 0.25, z: 'z-10' },
  { pos: 'start-1/2 top-[4%] w-[52%] max-w-[250px] -translate-x-1/2', rotate: '', delay: 0.35, z: 'z-20' },
]

export default function LivingPhonesHero() {
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
  const pointerX = useMotionValue(0)
  const shift = useTransform(pointerX, [-0.5, 0.5], [-8, 8])

  return (
    <section
      className="mc-living-hero relative isolate overflow-hidden bg-[#08090b] pb-16 pt-28 text-white sm:pb-24 lg:min-h-[100svh] lg:pt-32"
      style={{ backgroundColor: variant.bg }}
    >
      <div aria-hidden className="mc-hero-grid pointer-events-none absolute inset-0 opacity-40" />
      <div aria-hidden className="mc-hero-glow pointer-events-none absolute inset-0" />

      <div className="page relative z-10 mx-auto w-full max-w-[1600px] px-4 sm:px-8 lg:px-10">
        <div className="grid items-center gap-8 lg:min-h-[680px] lg:grid-cols-[0.9fr_1.1fr] lg:gap-6">
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
              className="mc-hero-title mt-6 text-[clamp(2.8rem,7vw,6rem)] font-semibold leading-[0.98] tracking-[-0.06em]"
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
              <Link to="/dashboard/editor" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/[0.04] px-7 py-3 text-sm font-semibold text-white/85 transition hover:border-white/40">
                {t('homeV2.secondaryCta')}
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

          {/* --------------------------- phones --------------------------- */}
          <motion.div
            style={reduce ? undefined : { x: shift }}
            onMouseMove={(event) => {
              if (reduce) return
              const r = event.currentTarget.getBoundingClientRect()
              if (r.width) pointerX.set((event.clientX - r.left) / r.width - 0.5)
            }}
            onMouseLeave={() => pointerX.set(0)}
            className="relative mx-auto mt-4 h-[430px] w-full max-w-[680px] sm:h-[580px] lg:mt-0 lg:h-[660px]"
          >
            <div aria-hidden className="pointer-events-none absolute inset-x-[10%] bottom-[10%] h-32 rounded-full blur-[80px]" style={{ background: `${variant.glow}24` }} />

            {templates.map((template, i) => {
              const slot = SLOTS[i]
              const video = isMobile
                ? (template as any).heroVideoMobile || (template as any).heroVideo || ''
                : (template as any).heroVideoDesktop || (template as any).heroVideo || ''
              const photo = template.heroImage || template.previewImage
              const label = template.sample?.name || template.name
              return (
                <motion.div
                  key={template.id}
                  className={`mc-phone absolute ${slot.pos} ${slot.rotate} ${slot.z}`}
                  initial={reduce ? false : { opacity: 0, y: 36, scale: 0.9 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.85, delay: slot.delay, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="rounded-[28px] border-[5px] border-[#30313a] bg-[#0d0e12] p-1.5 shadow-[0_35px_85px_rgba(0,0,0,.72)] sm:rounded-[36px] sm:border-[6px] sm:p-2">
                    <div className="relative h-[260px] overflow-hidden rounded-[21px] bg-[#f5f0e6] sm:h-[420px] sm:rounded-[27px] lg:h-[470px]">
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
                      <div className="absolute inset-x-3 top-3 text-[8px] font-semibold tracking-[0.16em] text-white/80 sm:text-[10px]">MENUCRAFT</div>
                      <div className="absolute inset-x-3 bottom-4 text-white">
                        <div className="font-serif text-xl sm:text-3xl">{label}</div>
                        <div className="mt-1 text-[9px] text-white/75">{template.name}</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}

            {/* small static tags — no floating animation */}
            <div className="mc-float-card absolute start-0 top-[8%] z-30 w-[112px] rounded-xl border border-white/10 bg-[#111813]/95 p-2.5 text-[9px] text-white/60 sm:w-[160px] sm:p-3 sm:text-[11px]">
              <div className="flex justify-between"><span>{t('homeV2.scans')}</span><span className="text-[#0e0ad8]">+18%</span></div>
              <div className="mt-1 text-lg font-semibold text-white sm:text-2xl">1,200</div>
            </div>
            <div className="absolute end-0 top-[54%] z-30 flex items-center gap-2 rounded-xl border border-white/10 bg-[#111813]/95 p-2 text-[9px] text-white/80 sm:top-[46%] sm:gap-3 sm:p-3 sm:text-[11px]">
              <Icon name="pencil" size={14} className="text-[#0e0ad8]" />
              <span>{t('homeV2.live')}</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
