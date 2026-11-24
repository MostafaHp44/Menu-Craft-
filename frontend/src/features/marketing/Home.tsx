import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform, useMotionValue } from 'framer-motion'
import { Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { MarketingHeader } from '../../shared/chrome/MarketingHeader.tsx'
import { MarketingFooter } from '../../shared/chrome/MarketingFooter.tsx'
import { Icon } from '../../shared/ui/icons.tsx'
import { Button, Badge } from '../../shared/ui/ui.tsx'
import { PLANS } from '../../shared/lib/demoData.ts'
import { useCustomize, publicSiteLink } from '../../shared/lib/hooks.ts'
import { useActiveRestaurant } from '../../shared/store/useStore.ts'
import { TEMPLATES, getTemplate } from '../../templates/data/templates.ts'
import MiniMenuScreen from './heroes/MiniMenuScreen.tsx'
import ScrollHero from './heroes/ScrollHero.tsx'
import { useI18n } from '../../shared/i18n'
import CinematicStageHero from './heroes/CinematicStageHero.tsx'
import LivingPhonesHero from './heroes/LivingPhonesHero.tsx'
import SingleFocusHero from './heroes/SingleFocusHero.tsx'
import StoryboardHero from './heroes/StoryboardHero.tsx'
import TemplateSpotlightHero from './heroes/TemplateSpotlightHero.tsx'
import { useHomeContentByLang } from '../../shared/store/useHomeContent.ts'
import { cx } from '../../shared/lib/utils.ts'

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1]

function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 26 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.72, delay, ease }}
    >
      {children}
    </motion.div>
  )
}



function Hero() {
  const { t, lang } = useI18n();
  const restaurant = useActiveRestaurant();
  const reduce = useReducedMotion();

  const stageRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ["start end", "end start"],
  });

  const stageParallax = useTransform(scrollYProgress, [0, 1], [18, -18]);
  const pointerX = useMotionValue(0);
  const pointerParallax = useTransform(pointerX, [-0.5, 0.5], [-7, 7]);

  // the three phones show real menu screens — same templates as the screenshots
  const heroTemplates = [
    getTemplate('aurum-lounge'),
    getTemplate('caffe-brew'),
    getTemplate('basta'),
  ];

  // split the i18n title into two colourable words (stays admin/i18n editable)
  const titleWords = t("homeV2.titleA").trim().split(/\s+/);
  const titleFirst = titleWords[0] || "Digital";
  const titleSecond = titleWords.slice(1).join(" ") || "Menu";

  const qrScans = new Intl.NumberFormat(
    lang === "ar"
      ? "ar-EG"
      : lang === "ku"
        ? "ckb-IQ"
        : "en-US",
  ).format(restaurant.stats?.qrScans ?? 0);

  const [live, setLive] = useState(true);

  return (
    <section
      id="home"
      className="mc-hero relative isolate overflow-hidden bg-[#08090b] pb-12 pt-28 text-white sm:pb-20 sm:pt-32 lg:min-h-[calc(100svh-5rem)] lg:pb-16 lg:pt-24"
    >
      {/* Background */}
      <div
        aria-hidden
        className="mc-hero-grid pointer-events-none absolute inset-0 opacity-50"
      />

      <div
        aria-hidden
        className="mc-hero-glow pointer-events-none absolute inset-0"
      />

      <div className="page relative z-10 mx-auto w-full max-w-[1600px] px-4 sm:px-8 lg:px-10">
        <div className="grid items-center gap-7 lg:min-h-[650px] lg:grid-cols-[0.9fr_1.1fr] lg:gap-5 xl:gap-10">
          {/* ================= HERO CONTENT ================= */}
          <div className="relative z-20 mx-auto w-full max-w-[650px] text-center lg:mx-0 lg:text-start">
            <Reveal>
              <span className="mc-pill inline-flex items-center gap-2 rounded-full border border-[#0e0ad8]/45 bg-[#0e0ad8]/[0.14] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#0e0ad8] sm:text-[11px]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0e0ad8] shadow-[0_0_12px_#0e0ad8]" />
                {t("homeV2.pill")}
              </span>
            </Reveal>

            {/* Main title — the two words converge once when the page opens */}
            <div className="mt-6 sm:mt-7">
              <h1 className="mc-hero-title mx-auto max-w-[760px] text-[clamp(2.5rem,8vw,6.8rem)] font-semibold leading-[0.98] tracking-[-0.065em] lg:mx-0 lg:text-[clamp(2.8rem,6.2vw,6.8rem)] lg:leading-[0.96]">
                <span className="inline-flex flex-wrap items-baseline justify-center gap-x-[0.22em] lg:justify-start">
                  <motion.span
                    className="text-[#0e0ad8] [text-shadow:0_0_34px_rgba(14,10,216,.35)]"
                    initial={reduce ? false : { opacity: 0, x: -70, filter: "blur(9px)" }}
                    animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                    transition={{ duration: 0.9, ease }}
                  >
                    {titleFirst}
                  </motion.span>
                  <motion.span
                    className="text-white"
                    initial={reduce ? false : { opacity: 0, x: 70, filter: "blur(9px)" }}
                    animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                    transition={{ duration: 0.9, delay: 0.12, ease }}
                  >
                    {titleSecond}
                  </motion.span>
                </span>
              </h1>
            </div>

   

            {/* CTA buttons */}
            <Reveal
              delay={0.24}
              className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:mt-8 sm:flex-row sm:items-center lg:justify-start"
            >
              <Link
                to="/templates"
                className="inline-flex min-h-14 items-center justify-center gap-3 rounded-full px-7 py-3 text-sm font-bold text-white transition duration-300 hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0e0ad8] sm:min-w-[220px]"
                style={{ background: '#0e0ad8', boxShadow: '0 12px 38px -14px rgba(14,10,216,.75)' }}
              >
                {t("homeV2.primaryCta")}
                <Icon name="arrowRight" size={16} className="rtl:rotate-180" />
              </Link>

              <Link
                to="/dashboard/editor"
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/[0.035] px-7 py-3 text-sm font-semibold text-white/85 transition hover:border-white/40 hover:bg-white/[0.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:min-w-[190px]"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/25">
                  <Icon name="play" size={10} />
                </span>
                {t("homeV2.secondaryCta")}
              </Link>
            </Reveal>

            {/* Quick stats */}
            <Reveal delay={0.32}>
              <div className="mt-8 flex items-center justify-center gap-10 sm:mt-10 lg:justify-start">
                <div>
                  <div className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    5 min
                  </div>
                  <div className="mt-2 text-[11px] text-white/40">
                    to go live
                  </div>
                </div>

                <div>
                  <div className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    4.9★
                  </div>
                  <div className="mt-2 text-[11px] text-white/40">
                    owner rating
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

          {/* ================= HERO VISUAL ================= */}
          <motion.div
            ref={stageRef}
            style={
              reduce
                ? undefined
                : {
                    y: stageParallax,
                    x: pointerParallax,
                  }
            }
            onMouseMove={(event) => {
              if (reduce) return;

              const bounds = event.currentTarget.getBoundingClientRect();

              if (bounds.width > 0) {
                pointerX.set(
                  (event.clientX - bounds.left) / bounds.width - 0.5,
                );
              }
            }}
            onMouseLeave={() => pointerX.set(0)}
            className="mc-hero-stage relative mx-auto mt-3 h-[440px] w-full max-w-[680px] xs:h-[470px] sm:mt-5 sm:h-[610px] lg:mt-0 lg:h-[650px] xl:h-[700px]"
          >
            {/* Background glows */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-[8%] bottom-[8%] h-32 rounded-full bg-[#0e0ad8]/[0.18] blur-[75px] sm:inset-x-[10%] sm:h-40 sm:blur-[90px]"
            />

            <div
              aria-hidden
              className="pointer-events-none absolute inset-[12%] rounded-full bg-violet-600/[0.10] blur-[80px] sm:blur-[100px]"
            />

            {/* ================= BACK PHONE LEFT ================= */}
            {heroTemplates[1] && (
              <motion.div
                className="mc-phone absolute start-[1%] top-[20%] z-10 w-[36%] max-w-[190px] rotate-[-7deg] sm:start-[1%] sm:top-[20%] sm:w-[40%] lg:start-[3%] lg:top-[18%]"
                initial={
                  reduce
                    ? false
                    : {
                        opacity: 0,
                        x: -35,
                        y: 30,
                        scale: 0.88,
                      }
                }
                whileInView={
                  reduce
                    ? undefined
                    : {
                        opacity: 1,
                        x: 0,
                        y: 0,
                        scale: 1,
                      }
                }
                viewport={{ once: true }}
                transition={{ duration: 0.85, delay: 0.2, ease }}
              >
                <motion.div
                  whileInView={reduce ? undefined : { y: [0, -3, 0] }}
                  viewport={{ once: false, amount: 0.2 }}
                  transition={{
                    duration: 9,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="rounded-[25px] border-[4px] border-[#343044] bg-[#11101c] p-1.5 shadow-[0_25px_65px_rgba(0,0,0,.65)] sm:rounded-[34px] sm:border-[5px] sm:p-2 sm:shadow-[0_35px_90px_rgba(0,0,0,.65)]"
                >
                  <div className="relative h-[255px] overflow-hidden rounded-[19px] bg-[#0b3b2c] sm:h-[390px] sm:rounded-[25px] lg:h-[430px]">
                    <MiniMenuScreen templateId={heroTemplates[1].id} />
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* ================= BACK PHONE RIGHT ================= */}
            {heroTemplates[2] && (
              <motion.div
                className="mc-phone absolute end-[1%] top-[23%] z-10 w-[36%] max-w-[190px] rotate-[7deg] sm:end-[1%] sm:top-[23%] sm:w-[40%] lg:end-[2%] lg:top-[20%]"
                initial={
                  reduce
                    ? false
                    : {
                        opacity: 0,
                        x: 35,
                        y: 30,
                        scale: 0.88,
                      }
                }
                whileInView={
                  reduce
                    ? undefined
                    : {
                        opacity: 1,
                        x: 0,
                        y: 0,
                        scale: 1,
                      }
                }
                viewport={{ once: true }}
                transition={{ duration: 0.85, delay: 0.28, ease }}
              >
                <motion.div
                  whileInView={reduce ? undefined : { y: [0, -3, 0] }}
                  viewport={{ once: false, amount: 0.2 }}
                  transition={{
                    duration: 9,
                    delay: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="rounded-[25px] border-[4px] border-[#303832] bg-[#0d120e] p-1.5 shadow-[0_25px_65px_rgba(0,0,0,.65)] sm:rounded-[34px] sm:border-[5px] sm:p-2 sm:shadow-[0_35px_90px_rgba(0,0,0,.65)]"
                >
                  <div className="relative h-[255px] overflow-hidden rounded-[19px] bg-[#f2eae3] sm:h-[390px] sm:rounded-[25px] lg:h-[430px]">
                    <MiniMenuScreen templateId={heroTemplates[2].id} />
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* ================= MAIN FRONT PHONE ================= */}
            {heroTemplates[0] && (
              <motion.div
                className="mc-phone absolute start-1/2 top-[5%] z-20 w-[54%] max-w-[230px] -translate-x-1/2 sm:top-[9%] sm:w-[43%] sm:max-w-[285px] lg:top-[7%]"
                initial={
                  reduce
                    ? false
                    : {
                        opacity: 0,
                        y: 45,
                        scale: 0.82,
                      }
                }
                whileInView={
                  reduce
                    ? undefined
                    : {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                      }
                }
                viewport={{ once: true }}
                transition={{ duration: 0.95, delay: 0.35, ease }}
              >
                <motion.div
                  whileInView={reduce ? undefined : { y: [0, -3, 0] }}
                  viewport={{ once: false, amount: 0.2 }}
                  transition={{
                    duration: 9,
                    delay: 5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="rounded-[30px] border-[5px] border-[#30313a] bg-[#0d0e12] p-1.5 shadow-[0_35px_85px_rgba(0,0,0,.72)] sm:rounded-[38px] sm:border-[6px] sm:p-2 sm:shadow-[0_40px_100px_rgba(0,0,0,.72)]"
                >
                  <div className="relative h-full overflow-hidden rounded-[23px] bg-[#101010] sm:rounded-[29px]">
                    <MiniMenuScreen templateId={heroTemplates[0].id} />
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* ================= QR SCANS ANALYTICS ================= */}
            <motion.div
              className="mc-float-card absolute start-0 top-[2%] z-30 w-[118px] rounded-xl border border-white/10 bg-[#111813]/95 p-2.5 shadow-2xl backdrop-blur-xl sm:start-0 sm:top-[10%] sm:w-[190px] sm:rounded-2xl sm:p-4"
              animate={reduce ? undefined : { y: [0, -9, 0] }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <div className="flex items-center justify-between gap-1 text-[8px] text-white/55 sm:text-[11px]">
                <span className="truncate">{t("homeV2.scans")}</span>
                <span className="shrink-0 rounded-full bg-[#0e0ad8]/15 px-1.5 py-1 text-[8px] font-bold text-[#0e0ad8] sm:px-2 sm:text-[10px]">
                  +18%
                </span>
              </div>

              <div className="mt-2 text-xl font-semibold tracking-tight text-white sm:mt-3 sm:text-3xl">
                {qrScans}
              </div>

              <div className="mt-2 flex h-6 items-end gap-1 sm:mt-4 sm:h-10 sm:gap-1.5">
                {[35, 54, 43, 72, 57, 88, 68, 100, 77].map((height, index) => (
                  <span
                    key={index}
                    className="flex-1 rounded-t bg-gradient-to-t from-[#8ab63d] to-[#d4fa83]"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>

              <div className="mt-1 text-[8px] text-white/35 sm:mt-2 sm:text-[10px]">
                + {t("homeV2.scans")}
              </div>
            </motion.div>

            {/* ================= LIVE EDIT CARD ================= */}
            <motion.button
              type="button"
              onClick={() => setLive((value) => !value)}
              aria-pressed={live}
              className="absolute end-0 top-[53%] z-30 flex min-h-11 max-w-[155px] items-center gap-2 rounded-xl border border-white/10 bg-[#111813]/95 p-2 text-start shadow-2xl backdrop-blur-xl transition hover:border-[#0e0ad8]/40 sm:top-[43%] sm:min-h-14 sm:max-w-none sm:gap-3 sm:rounded-2xl sm:p-3.5 lg:end-0"
              animate={reduce ? undefined : { y: [0, 8, 0] }}
              transition={{
                duration: 5.4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#0e0ad8]/15 text-[#0e0ad8] sm:h-9 sm:w-9 sm:rounded-xl">
                <Icon name="pencil" size={14} />
              </span>

              <span className="block min-w-0">
                <span className="block text-[9px] font-semibold text-white sm:text-[11px]">
                  {t("homeV2.live")}
                </span>

                <span className="mt-1 block truncate text-[8px] text-white/45 sm:text-[10px]">
                  {live ? t("homeV2.priceUpdated") : t("homeV2.preview")}
                </span>
              </span>

              <span
                className={cx(
                  "relative ms-1 h-4 w-7 shrink-0 rounded-full transition-colors sm:ms-2 sm:h-5 sm:w-9",
                  live ? "bg-[#0e0ad8]" : "bg-white/20",
                )}
              >
                <span
                  className={cx(
                    "absolute top-0.5 h-3 w-3 rounded-full bg-[#10150a] transition-all sm:h-4 sm:w-4",
                    live ? "end-0.5" : "start-0.5",
                  )}
                />
              </span>
            </motion.button>

            {/* ================= QR CODE CARD ================= */}
            <motion.div
              className="absolute bottom-[1%] start-0 z-30 flex items-center gap-2 rounded-xl border border-white/10 bg-[#111813]/95 p-2 shadow-2xl backdrop-blur-xl sm:bottom-[5%] sm:start-[2%] sm:gap-3 sm:rounded-2xl sm:p-3"
              animate={reduce ? undefined : { y: [0, -7, 0] }}
              transition={{
                duration: 5.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <span className="rounded-md bg-white p-1 sm:rounded-lg sm:p-1.5">
                <QRCodeSVG
                  value={publicSiteLink(restaurant.slug)}
                  size={36}
                  className="h-9 w-9 sm:h-[52px] sm:w-[52px]"
                />
              </span>

              <span className="max-w-[75px] text-[8px] font-semibold leading-3 text-white sm:max-w-[100px] sm:text-[10px] sm:leading-4">
                {t("homeV2.scanToOrder")}
              </span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}


function Templates({ onCustomize }: { onCustomize: (id: string) => void }) {
  const { t } = useI18n()
  const reduce = useReducedMotion()
  const templates = useMemo(() => TEMPLATES.slice(0, 5), [])
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const current = templates[active]

  // cycle templates every 5s; hovering / keyboard focus pauses so manual picks stick
  useEffect(() => {
    if (reduce || paused) return
    const id = window.setInterval(() => setActive((i) => (i + 1) % templates.length), 5000)
    return () => window.clearInterval(id)
  }, [reduce, paused, templates.length, active])

  return (
    <section
      id="templates"
      className="mc-templates bg-[#0b100d] py-20 text-white sm:py-24 lg:py-28"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false)
      }}
    >
      <div className="page">
        <Reveal>
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-[.24em] text-[#0e0ad8]">{t('homeV2.templatesEyebrow')}</p>
            <h2 className="mt-5 text-[clamp(2.1rem,5vw,4.5rem)] font-semibold leading-[1.02] tracking-[-.055em]">
              {t('homeV2.templatesTitle')}{' '}
              <span className="mc-serif-accent text-[#0e0ad8]">{t('homeV2.templatesAccent')}</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/55">{t('homeV2.templatesDescription')}</p>
          </div>
        </Reveal>

        <div className="mt-14 grid gap-7 lg:grid-cols-[1.35fr_.65fr] lg:items-stretch">
          <div className="relative min-h-[430px] overflow-hidden rounded-[28px] border border-white/10 bg-[#131a15] sm:min-h-[520px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                className="absolute inset-0"
                initial={reduce ? false : { opacity: 0, scale: 1.025, x: 12 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={reduce ? undefined : { opacity: 0, scale: 0.985, x: -12 }}
                transition={{ duration: 0.45, ease }}
              >
                <img src={current.previewImage} alt={current.name} className="h-full w-full object-cover opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#080c09] via-[#080c09]/20 to-transparent" />
                <div className="absolute inset-x-5 top-5 flex items-center justify-between sm:inset-x-8 sm:top-8">
                  <span className="rounded-full border border-white/25 bg-black/25 px-3 py-1.5 text-[10px] font-semibold tracking-[.18em] backdrop-blur">{String(active + 1).padStart(2, '0')} / {String(templates.length).padStart(2, '0')}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-[.18em] text-white/70">{t(`homeV2.templateDetails.${current.id}.category`)}</span>
                </div>
                <div className="absolute inset-x-5 bottom-6 sm:inset-x-8 sm:bottom-8">
                  <div className="flex flex-wrap gap-2">
                    {current.tags.slice(0, 3).map((tag, tagIndex) => <span key={tag} className="rounded-full border border-white/20 bg-black/20 px-3 py-1.5 text-[10px] text-white/80 backdrop-blur">{t(`homeV2.templateDetails.${current.id}.tags.${tagIndex}`)}</span>)}
                  </div>
                  <h3 className="mt-4 font-serif text-4xl leading-none sm:text-5xl">{current.name}</h3>
                  <p className="mt-3 max-w-lg text-sm leading-6 text-white/70">{t(`homeV2.templateDetails.${current.id}.tagline`)}</p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button type="button" onClick={() => onCustomize(current.id)} className="mc-primary-cta inline-flex min-h-11 items-center gap-2 rounded-full px-5 py-3 text-xs font-bold text-white transition hover:-translate-y-0.5">
                      {t('homeV2.useTemplate')} <Icon name="arrowRight" size={14} className="rtl:rotate-180" />
                    </button>
                    <Link to={`/templates/${current.id}`} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/30 px-5 py-3 text-xs font-semibold text-white transition hover:bg-white/10">
                      {t('homeV2.preview')} <Icon name="external" size={13} />
                    </Link>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex flex-col gap-2">
            {templates.map((template, index) => ({ template, index })).filter(({ index }) => index !== active).map(({ template, index }) => {
              const selected = index === active
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setActive(index)}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
                      event.preventDefault()
                      setActive((index + 1) % templates.length)
                    }
                    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
                      event.preventDefault()
                      setActive((index - 1 + templates.length) % templates.length)
                    }
                  }}
                  aria-pressed={selected}
                  className={cx(
                    'group flex min-h-[76px] items-center gap-4 rounded-2xl border px-3 py-3 text-start transition duration-300 sm:min-h-[88px] sm:px-4',
                    selected ? 'border-[#0e0ad8]/55 bg-[#0e0ad8]/[0.08]' : 'border-white/10 bg-white/[0.025] hover:border-white/25 hover:bg-white/[0.06]'
                  )}
                >
                  <span className="h-14 w-16 shrink-0 overflow-hidden rounded-xl sm:h-16 sm:w-[76px]">
                    <img src={template.previewImage} alt="" className={cx('h-full w-full object-cover transition duration-500 group-hover:scale-110', selected && 'scale-105')} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cx('block text-[10px] font-bold tracking-[.16em]', selected ? 'text-[#0e0ad8]' : 'text-white/35')}>{String(index + 1).padStart(2, '0')}</span>
                    <span className="mt-1 block truncate text-sm font-semibold text-white">{template.name}</span>
                    <span className="mt-1 block truncate text-[11px] text-white/45">{t(`homeV2.templateDetails.${template.id}.category`)}</span>
                  </span>
                  <Icon name={selected ? 'arrowUpRight' : 'arrowRight'} size={16} className={cx('shrink-0 transition', selected ? 'text-[#0e0ad8]' : 'text-white/30 group-hover:text-white')} />
                </button>
              )
            })}
            <Link to="/templates" className="mt-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/15 px-5 text-xs font-semibold text-white/70 transition hover:border-white/35 hover:text-white">
              {t('nav.templates')} <Icon name="arrowRight" size={14} className="rtl:rotate-180" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

function Pricing({ onCustomize }: { onCustomize: (id: string) => void }) {
  const { t } = useI18n()
  const reduce = useReducedMotion()

  return (
    <section id="pricing" className="mc-pricing bg-[#080b09] pb-24 pt-20 text-white sm:pb-28 sm:pt-24">
      <div className="page">
        <Reveal>
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-[.24em] text-[#0e0ad8]">{t('homeV2.pricingEyebrow')}</p>
            <h2 className="mt-5 text-[clamp(2.1rem,5vw,4.5rem)] font-semibold leading-[1.02] tracking-[-.055em]">
              {t('homeV2.pricingTitle')}{' '}
              <span className="mc-serif-accent text-[#0e0ad8]">{t('homeV2.pricingAccent')}</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/55">{t('homeV2.pricingDescription')}</p>
            <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] p-1">
              <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white">{t('homeV2.monthly')}</span>
            </div>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-5 lg:grid-cols-3 lg:items-stretch">
          {PLANS.map((plan, index) => (
            <Reveal key={plan.id} delay={index * 0.08} className="h-full">
              <motion.article
                whileHover={reduce ? undefined : { y: -7 }}
                transition={{ duration: 0.25 }}
                className={cx(
                  'relative flex h-full flex-col rounded-[26px] border p-6 sm:p-7',
                  plan.highlight
                    ? 'mc-featured-plan border-transparent bg-[#111813] shadow-[0_25px_90px_rgba(0,0,0,.35)]'
                    : 'border-white/10 bg-white/[0.035] hover:border-white/25'
                )}
              >
                {plan.highlight ? <span className="absolute -top-3 end-6 rounded-full bg-[#0e0ad8] px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-[.12em] text-white">{t('homeV2.mostLoved')}</span> : null}
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold uppercase tracking-[.15em]">{plan.name}</h3>
                  <Badge tone={plan.highlight ? 'moss' : 'outline'}>{t(plan.mode === 'live' ? 'home.pricing.modeLive' : 'home.pricing.modeStatic')}</Badge>
                </div>
                <p className="mt-4 min-h-[48px] text-sm leading-6 text-white/50">{t(`homeV2.plans.${plan.id}.description`)}</p>
                <div className="mt-7 flex items-end gap-2">
                  <span className="text-5xl font-semibold tracking-[-.06em]">{plan.price === 0 ? t('home.pricing.free') : `$${plan.price}`}</span>
                  <span className="pb-1.5 text-xs text-white/45">{plan.period === 'forever' ? t('homeV2.forever') : t('homeV2.perMonth')}</span>
                </div>
                <ul className="mt-7 flex-1 space-y-4 border-t border-white/10 pt-6">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={feature} className="flex items-start gap-3 text-sm leading-6 text-white/75">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0e0ad8]/15 text-[#0e0ad8]"><Icon name="check" size={12} /></span>
                      <span>{t(`homeV2.plans.${plan.id}.features.${featureIndex}`)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Button
                    full
                    size="lg"
                    variant={plan.highlight ? 'accent' : 'outline'}
                    onClick={() => onCustomize('bella-italia')}
                    className={plan.highlight ? 'mc-plan-button' : ''}
                  >
                    {plan.price === 0 ? t('homeV2.startFree') : t('homeV2.choosePlan')}
                  </Button>
                </div>
              </motion.article>
            </Reveal>
          ))}
        </div>
        <div className="mt-9 text-center">
          <Link to="/plans" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-xs font-semibold text-white/70 transition hover:border-[#0e0ad8]/60 hover:text-[#0e0ad8]">
            {t('home.pricing.viewAllPlans')} <Icon name="arrowRight" size={14} className="rtl:rotate-180" />
          </Link>
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  const customize = useCustomize()
  const { lang } = useI18n()
  const contentByLang = useHomeContentByLang()
  const heroVariantId = (contentByLang[lang]?.hero as any)?.variant
  const previewHero = new URLSearchParams(window.location.search).get('hero')
  const heroPreview = previewHero || heroVariantId
  const showCinematicStage = heroPreview === 'cinematic-stage'
  const showLivingPhones = heroPreview === 'living-phones'
  const showSingleFocus = heroPreview === 'single-focus'
  const showStoryboard = heroPreview === 'storyboard'
  const showSpotlight = heroPreview === 'template-spotlight'
  const showClassic = heroPreview === 'classic'
  return (
    <div className="mc-home min-h-screen bg-[#080b09]">
      <MarketingHeader themeEnabled darkTheme />
      <main>
        {showCinematicStage ? <CinematicStageHero /> : showLivingPhones ? <LivingPhonesHero /> : showSingleFocus ? <SingleFocusHero /> : showStoryboard ? <StoryboardHero /> : showSpotlight ? <TemplateSpotlightHero /> : showClassic ? <Hero /> : <ScrollHero />}
        <Templates onCustomize={customize} />
        <Pricing onCustomize={customize} />
      </main>
      <MarketingFooter />
    </div>
  )
}