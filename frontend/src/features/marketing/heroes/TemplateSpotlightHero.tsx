/**
 * Hero concept 5 — "Template Spotlight".
 * One big template in the spotlight: admin template video/image fills the
 * screen, a soft filmic light sweeps on change, arrows switch templates.
 * Minimal copy + Preview / Use. No new admin fields, no hardcoded video URLs.
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { TEMPLATES } from '../../../templates/data/templates.ts'
import { useHomeContentByLang } from '../../../shared/store/useHomeContent.ts'
import { useCustomize } from '../../../shared/lib/hooks.ts'
import { useI18n } from '../../../shared/i18n'
import { getHeroVariant } from '../../../templates/data/heroVariants.ts'
import { Icon } from '../../../shared/ui/icons.tsx'

export default function TemplateSpotlightHero() {
  const { lang, t } = useI18n()
  const reduce = useReducedMotion()
  const customize = useCustomize()
  const contentByLang = useHomeContentByLang()
  const hero = contentByLang[lang]?.hero || contentByLang.en?.hero
  const variant = getHeroVariant((hero as any)?.variant)

  const templates = useMemo(() => TEMPLATES.slice(0, 5), [])
  const [active, setActive] = useState(0)
  const [isMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches)
  const current = templates[active] || templates[0]

  const step = (dir: number) => setActive((i) => (i + dir + templates.length) % templates.length)

  const video = isMobile
    ? (current as any)?.heroVideoMobile || (current as any)?.heroVideo || ''
    : (current as any)?.heroVideoDesktop || (current as any)?.heroVideo || ''
  const photo = current?.heroImage || current?.previewImage
  const name = current?.name || ''
  const category = t(`homeV2.templateDetails.${current?.id}.category`)

  return (
    <section
      className="mc-spotlight relative isolate flex min-h-[100svh] w-full flex-col justify-end overflow-hidden pb-14 pt-28 text-white"
      style={{ backgroundColor: variant.bg }}
    >
      {/* ---------------------- template fills the stage ---------------------- */}
      <AnimatePresence mode="sync">
        <motion.div
          key={current?.id}
          initial={reduce ? false : { opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={reduce ? undefined : { opacity: 0, scale: 1.01 }}
          transition={{ duration: reduce ? 0 : 0.85, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
          aria-hidden="true"
        >
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
        </motion.div>
      </AnimatePresence>

      {/* one soft, filmic light sweep on each switch — then it rests */}
      <AnimatePresence>
        {!reduce ? (
          <motion.div
            key={`light-${current?.id}`}
            aria-hidden
            className="pointer-events-none absolute inset-0"
            initial={{ opacity: 0.55 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
            style={{ background: `radial-gradient(50% 60% at 70% 35%, ${variant.glow}55, transparent 70%)` }}
          />
        ) : null}
      </AnimatePresence>

      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#08090b] via-[#08090b]/55 to-[#08090b]/25" />

      {/* ------------------------------- arrows ------------------------------- */}
      <button
        type="button"
        onClick={() => step(-1)}
        aria-label="Previous template"
        className="absolute start-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/25 text-white/80 backdrop-blur transition hover:border-white/50 hover:text-white sm:start-8"
      >
        <Icon name="arrowRight" size={18} className="rtl:rotate-180" />
      </button>
      <button
        type="button"
        onClick={() => step(1)}
        aria-label="Next template"
        className="absolute end-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/25 text-white/80 backdrop-blur transition hover:border-white/50 hover:text-white sm:end-8"
      >
        <Icon name="arrowRight" size={18} className="ltr:rotate-180" />
      </button>

      {/* ------------------------------- copy -------------------------------- */}
      <div className="page relative z-10 mx-auto w-full max-w-[1600px] px-4 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
            <span className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-black/25 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-white/70 backdrop-blur">
              {String(active + 1).padStart(2, '0')} / {String(templates.length).padStart(2, '0')}
              <span className="h-1 w-1 rounded-full bg-white/40" />
              {category}
            </span>
          </motion.div>

          {/* keyed motion.div (not AnimatePresence mode="wait") so the name
              always updates immediately — never stuck waiting on an exit
              animation when the tab is hidden or motion is reduced */}
          <motion.div
            key={current?.id}
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1
              className="mc-hero-title mt-6 text-[clamp(3rem,8vw,7rem)] font-semibold leading-[0.98] tracking-[-0.06em]"
              style={{ color: variant.accent }}
            >
              {name}
            </h1>
          </motion.div>

          <motion.div initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => customize(current?.id)}
              className="mc-primary-cta inline-flex min-h-14 items-center gap-3 rounded-full px-8 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5"
              style={{ backgroundColor: variant.accent }}
            >
              {t('homeV2.useTemplate')} <Icon name="arrowRight" size={16} className="rtl:rotate-180" />
            </button>
            <Link
              to={`/templates/${current?.id || ''}`}
              className="inline-flex min-h-14 items-center gap-2 rounded-full border border-white/30 bg-black/20 px-8 py-3.5 text-sm font-semibold text-white transition hover:border-white/60 hover:bg-white/10"
            >
              {t('homeV2.previewTemplate')} <Icon name="external" size={14} />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
