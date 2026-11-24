/**
 * Scroll-choreographed marketing hero.
 * Everything starts hidden. A tall section + sticky viewport drives a progress
 * value that reveals one element per gentle scroll:
 *   pill → Digital → Menu → CTA → phone 1 → phone 2 → phone 3 → stats → cards
 * Background video/images come only from admin home content (no hardcoded URLs).
 */
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { getTemplate } from '../../../templates/data/templates.ts'
import MiniMenuScreen from './MiniMenuScreen.tsx'
import { useHomeContentByLang } from '../../../shared/store/useHomeContent.ts'
import { useActiveRestaurant } from '../../../shared/store/useStore.ts'
import { useI18n } from '../../../shared/i18n'
import { publicSiteLink } from '../../../shared/lib/hooks.ts'
import { Icon } from '../../../shared/ui/icons.tsx'

function useReveal(p: MotionValue<number>, from: number, to: number, distance = 34) {
  return {
    opacity: useTransform(p, [from, to], [0, 1]),
    y: useTransform(p, [from, to], [distance, 0]),
    scale: useTransform(p, [from, to], [0.94, 1]),
  }
}

export default function ScrollHero() {
  const { t, lang } = useI18n()
  const reduce = useReducedMotion()
  const restaurant = useActiveRestaurant()
  const sectionRef = useRef<HTMLElement>(null)

  const contentByLang = useHomeContentByLang()
  const heroContent = (contentByLang[lang]?.hero || contentByLang.en?.hero || {}) as any

  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  const video = isMobile
    ? heroContent.videoMobile || heroContent.video || ''
    : heroContent.videoDesktop || heroContent.video || ''
  const image = isMobile
    ? heroContent.imageMobile || heroContent.imageDesktop || heroContent.image || ''
    : heroContent.imageDesktop || heroContent.image || ''
  const [videoOk, setVideoOk] = useState(true)
  useEffect(() => setVideoOk(true), [video])

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  })

  // one step per scroll "click" of the wheel
  const pill = useReveal(scrollYProgress, 0.005, 0.095)
  const digital = useReveal(scrollYProgress, 0.10, 0.19)
  const menu = useReveal(scrollYProgress, 0.17, 0.26)
  const cta = useReveal(scrollYProgress, 0.27, 0.36)
  const phone1 = useReveal(scrollYProgress, 0.37, 0.47, 46)
  const phone2 = useReveal(scrollYProgress, 0.46, 0.56, 46)
  const phone3 = useReveal(scrollYProgress, 0.55, 0.67, 46)
  const stats = useReveal(scrollYProgress, 0.67, 0.77)
  const cards = useReveal(scrollYProgress, 0.77, 0.9)

  // the two words still "gather": they slide in from opposite sides
  const digitalX = useTransform(scrollYProgress, [0.10, 0.19], [-70, 0])
  const menuX = useTransform(scrollYProgress, [0.17, 0.26], [70, 0])

  // every visible string / colour comes from admin home content; i18n = fallback
  const heroEyebrow = heroContent.eyebrow || t('homeV2.pill')
  const heroCta = heroContent.cta || t('homeV2.primaryCta')
  const heroTitle = (heroContent.title || t('homeV2.titleA'))
    .replace(/\*/g, '')
    .replace(/\n/g, ' ')
    .trim()
  const titleWords = heroTitle.split(/\s+/)
  const titleFirst = titleWords[0] || 'Digital'
  const titleSecond = titleWords.slice(1).join(' ') || 'Menu'
  const eyebrowColor = heroContent.textColors?.eyebrow || '#0e0ad8'
  const titleColor = heroContent.textColors?.title || '#0e0ad8'
  const titleSize = Math.min(170, Math.max(40, Number(heroContent.textSizes?.title) || 100)) / 100
  const subSize = Math.min(170, Math.max(40, Number(heroContent.textSizes?.sub) || 100)) / 100

  const phones = [
    { tpl: getTemplate('aurum-lounge'), step: phone3, pos: 'start-1/2 top-[4%] z-30 w-[58%] max-w-[250px] -translate-x-1/2 sm:top-[5%] sm:w-[45%] sm:max-w-[290px]', rotate: '', frame: 'rounded-[30px] border-[5px] border-[#30313a] bg-[#0d0e12] p-1.5 shadow-[0_35px_85px_rgba(0,0,0,.72)] sm:rounded-[38px] sm:border-[6px] sm:p-2', screen: 'h-[215px] rounded-[23px] bg-[#101010] sm:h-[270px] sm:rounded-[29px] lg:h-[470px]' },
    { tpl: getTemplate('caffe-brew'), step: phone1, pos: 'start-[1%] top-[20%] z-10 w-[38%] max-w-[170px] -rotate-7 sm:start-[1%] sm:top-[13%] sm:w-[40%]', rotate: '', frame: 'rounded-[25px] border-[4px] border-[#343044] bg-[#11101c] p-1.5 shadow-[0_25px_65px_rgba(0,0,0,.65)] sm:rounded-[34px] sm:border-[5px] sm:p-2', screen: 'h-[195px] rounded-[19px] bg-[#0b3b2c] sm:h-[250px] sm:rounded-[25px] lg:h-[410px]' },
    { tpl: getTemplate('basta'), step: phone2, pos: 'end-[1%] top-[22%] z-10 w-[38%] max-w-[170px] rotate-7 sm:end-[1%] sm:top-[15%] sm:w-[40%]', rotate: '', frame: 'rounded-[25px] border-[4px] border-[#303832] bg-[#0d120e] p-1.5 shadow-[0_25px_65px_rgba(0,0,0,.65)] sm:rounded-[34px] sm:border-[5px] sm:p-2', screen: 'h-[195px] rounded-[19px] bg-[#f2eae3] sm:h-[250px] sm:rounded-[25px] lg:h-[410px]' },
  ]

  const st = (s: ReturnType<typeof useReveal>) => (reduce ? undefined : { opacity: s.opacity, y: s.y, scale: s.scale })

  return (
    <section
      ref={sectionRef}
      id="home"
      className="relative isolate bg-[#08090b] text-white"
      style={{ height: reduce ? 'auto' : '340svh' }}
    >
      <div className="sticky top-0 flex h-[100svh] w-full items-center overflow-hidden">
        {/* ------------------------- background ------------------------- */}
        <div aria-hidden className="absolute inset-0">
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
              className="h-full w-full object-cover opacity-45"
            />
          ) : image ? (
            <img src={image} alt="" className="h-full w-full object-cover opacity-45" />
          ) : null}
          <div className="absolute inset-0 bg-[#08090b]/55" />
          <div className="mc-hero-grid absolute inset-0 opacity-50" />
          <div className="mc-hero-glow absolute inset-0" />
        </div>

        <div className="page relative z-10 mx-auto w-full max-w-[1600px] px-4 sm:px-8 lg:px-10">
          <div className="grid items-center gap-4 pt-14 sm:gap-7 sm:pt-0 lg:min-h-[650px] lg:grid-cols-[0.9fr_1.1fr] lg:gap-5 xl:gap-10">
            {/* --------------------------- copy --------------------------- */}
            <div className="relative z-40 mx-auto w-full max-w-[650px] text-center lg:mx-0 lg:text-start">
              <motion.div style={st(pill)}>
                <span
                  className="mc-pill inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.14em] sm:px-4 sm:py-2 sm:text-[10px] sm:tracking-[0.16em]"
                  style={{ color: eyebrowColor, borderColor: `${eyebrowColor}66`, backgroundColor: `${eyebrowColor}1f` }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: eyebrowColor, boxShadow: `0 0 12px ${eyebrowColor}` }} />
                  {heroEyebrow}
                </span>
              </motion.div>

              <h1
                className="mx-auto mt-4 max-w-[760px] font-semibold leading-[0.98] tracking-[-0.065em] sm:mt-6 lg:mx-0 lg:leading-[0.96]"
                style={{ fontSize: `calc(clamp(2.5rem, 8vw, 6.8rem) * ${titleSize})` }}
              >
                <span className="inline-flex flex-wrap items-baseline justify-center gap-x-[0.22em] lg:justify-start">
                  <motion.span
                    className="[text-shadow:0_0_34px_rgba(14,10,216,.35)]"
                    style={{ color: titleColor, ...(reduce ? {} : { opacity: digital.opacity, x: digitalX }) }}
                  >
                    {titleFirst}
                  </motion.span>
                  <motion.span
                    className="text-white"
                    style={reduce ? undefined : { opacity: menu.opacity, x: menuX }}
                  >
                    {titleSecond}
                  </motion.span>
                </span>
              </h1>

              {heroContent.sub ? (
                <motion.p
                  className="mx-auto mt-4 max-w-xl leading-7 lg:mx-0"
                  style={{ ...st(cta), color: heroContent.textColors?.sub || 'rgba(255,255,255,.65)', fontSize: `calc(0.875rem * ${subSize})` }}
                >
                  {heroContent.sub}
                </motion.p>
              ) : null}

              <motion.div style={st(cta)} className="mt-5 flex justify-center sm:mt-8 lg:justify-start">
                <Link
                  to="/templates"
                  className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full px-7 py-3 text-sm font-bold text-white transition duration-300 hover:-translate-y-1 sm:min-h-14 sm:min-w-[220px]"
                  style={{ background: titleColor, boxShadow: `0 12px 38px -14px ${titleColor}bf` }}
                >
                  {heroCta}
                  <Icon name="arrowRight" size={16} className="rtl:rotate-180" />
                </Link>
              </motion.div>

              <motion.div style={st(stats)} className="mt-6 flex items-center justify-center gap-10 sm:mt-10 lg:justify-start">
                <div>
                  <div className="text-xl font-bold tracking-tight text-white sm:text-3xl">5 min</div>
                  <div className="mt-1 text-[10px] text-white/40 sm:mt-2 sm:text-[11px]">to go live</div>
                </div>
                <div>
                  <div className="text-xl font-bold tracking-tight text-white sm:text-3xl">4.9★</div>
                  <div className="mt-1 text-[10px] text-white/40 sm:mt-2 sm:text-[11px]">owner rating</div>
                </div>
              </motion.div>
            </div>

            {/* --------------------------- phones --------------------------- */}
            <div className="relative mx-auto mt-2 h-[225px] w-full max-w-[560px] sm:mt-3 sm:h-[290px] sm:max-w-[680px] lg:mt-0 lg:h-[610px] xl:h-[670px]">
              <div aria-hidden className="pointer-events-none absolute inset-x-[10%] bottom-[6%] h-28 rounded-full bg-[#0e0ad8]/[0.18] blur-[75px]" />
              <div aria-hidden className="pointer-events-none absolute inset-[16%] rounded-full bg-violet-600/[0.10] blur-[80px]" />

              {phones.map((p) => (
                <motion.div
                  key={p.tpl.id}
                  className={`mc-phone absolute ${p.pos}`}
                  style={st(p.step)}
                >
                  <motion.div
                    whileInView={reduce ? undefined : { y: [0, -3, 0] }}
                    viewport={{ once: false, amount: 0.2 }}
                    transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
                    className={p.frame}
                  >
                    <div className={`relative overflow-hidden ${p.screen}`}>
                      <MiniMenuScreen templateId={p.tpl.id} />
                    </div>
                  </motion.div>
                </motion.div>
              ))}

              {/* floating proof cards — revealed last */}
              <motion.div
                style={st(cards)}
                className="absolute start-0 top-[2%] z-40 w-[112px] rounded-xl border border-white/10 bg-[#111813]/95 p-2 shadow-2xl backdrop-blur-xl sm:start-0 sm:top-[8%] sm:w-[175px] sm:rounded-2xl sm:p-3"
              >
                <div className="flex items-center justify-between gap-1 text-[8px] text-white/55 sm:text-[10px]">
                  <span>QR scans</span><span className="text-[#0e0ad8]">+18%</span>
                </div>
                <div className="mt-1 text-lg font-semibold text-white sm:mt-2 sm:text-2xl">1,284</div>
                <div className="mt-1 flex h-5 items-end gap-0.5 sm:mt-2 sm:h-8 sm:gap-1">
                  {[40, 65, 50, 80, 60, 95, 70].map((h, i) => (
                    <span key={i} className="flex-1 rounded-sm bg-[#0e0ad8]/80" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </motion.div>

              <motion.div
                style={st(cards)}
                className="absolute end-0 top-[7%] z-40 flex items-center gap-2 rounded-xl border border-white/10 bg-[#111813]/95 p-2 shadow-2xl backdrop-blur-xl sm:top-[26%] sm:gap-3 sm:rounded-2xl sm:p-3"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#0e0ad8]/15 text-[#0e0ad8] sm:h-8 sm:w-8">
                  <Icon name="pencil" size={13} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[8px] font-semibold text-white sm:text-[10px]">{t('homeV2.live')}</span>
                  <span className="mt-0.5 block text-[7px] text-white/45 sm:text-[9px]">{t('homeV2.priceUpdated')}</span>
                </span>
              </motion.div>

              <motion.div
                style={st(cards)}
                className="absolute bottom-[2%] start-0 z-40 flex items-center gap-2 rounded-xl border border-white/10 bg-[#111813]/95 p-2 shadow-2xl backdrop-blur-xl sm:bottom-[4%] sm:gap-3 sm:rounded-2xl sm:p-3"
              >
                <span className="rounded-md bg-white p-1 sm:rounded-lg sm:p-1.5">
                  <QRCodeSVG value={publicSiteLink(restaurant?.slug || 'bella')} size={30} className="h-8 w-8 sm:h-11 sm:w-11" />
                </span>
                <span className="max-w-[70px] text-[7px] font-semibold leading-3 text-white sm:max-w-[90px] sm:text-[9px]">{t('homeV2.scanToOrder')}</span>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
