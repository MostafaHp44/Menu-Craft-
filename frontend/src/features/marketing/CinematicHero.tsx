/**
 * Home hero — calm editorial hero.
 * One line of copy, one reveal, subtle background parallax.
 * The previous kinetic-type layer, right-side showcase, particles and
 * bouncing scroll cue were intentionally removed (client feedback).
 */
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { HOME_SEED, useHomeContentByLang } from '../../shared/store/useHomeContent.ts'
import { useI18n } from '../../shared/i18n'
import { getHeroVariant } from '../../templates/data/heroVariants.ts'
import { IMG } from '../../shared/lib/images.ts'
import { SAMPLE_HERO_VIDEO } from '../../shared/lib/heroVideo.ts'

gsap.registerPlugin(ScrollTrigger)

export default function CinematicHero() {
  const sectionRef = useRef<HTMLElement>(null)
  const mediaRef = useRef<HTMLDivElement>(null)
  const copyRef = useRef<HTMLDivElement>(null)
  const [videoOk, setVideoOk] = useState(true)

  const { lang, t } = useI18n()
  const contentByLang = useHomeContentByLang()
  const hero = contentByLang[lang]?.hero || contentByLang.en?.hero || HOME_SEED[lang]?.hero
  const variant = getHeroVariant((hero as any)?.variant)

  const background =
    (hero as any)?.imageDesktop || (hero as any)?.image || IMG.diningRoomDark
  const adminVideo = (hero as any)?.videoDesktop || (hero as any)?.video || (hero as any)?.videoMobile
  const videoSrc = adminVideo || SAMPLE_HERO_VIDEO

  /* single entrance reveal — plays once, never loops */
  useEffect(() => {
    const root = sectionRef.current
    const copy = copyRef.current
    if (!root || !copy) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = gsap.context(() => {
      gsap.from(copy.children, {
        y: 16,
        opacity: 0,
        duration: 0.7,
        stagger: 0.12,
        ease: 'power2.out',
        clearProps: 'transform,opacity',
      })
    }, root)
    return () => ctx.revert()
  }, [])

  /* gentle background parallax while scrolling — no kinetic text */
  useEffect(() => {
    const root = sectionRef.current
    const media = mediaRef.current
    if (!root || !media) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = gsap.context(() => {
      gsap.to(media, {
        yPercent: 10,
        ease: 'none',
        scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: true },
      })
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative flex h-[92svh] min-h-[520px] w-full items-center overflow-hidden"
      style={{ backgroundColor: variant.bg }}
    >
      <div ref={mediaRef} className="absolute inset-0 -top-[5%] h-[110%] w-full">
        <img src={background} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />
        {videoOk ? (
          <video
            key={videoSrc}
            autoPlay
            muted
            loop
            playsInline
            poster={background}
            src={videoSrc}
            onError={() => setVideoOk(false)}
            className="absolute inset-0 h-full w-full object-cover opacity-70"
          />
        ) : null}
      </div>
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(90deg, ${variant.bg}e6 0%, ${variant.bg}99 45%, ${variant.bg}33 100%)`,
        }}
      />

      {/* minimal top navigation — kept inside the hero, no separate section restored */}
      <header className="absolute inset-x-0 top-0 z-30">
        <div className="mx-auto flex h-[70px] max-w-[1400px] items-center justify-between gap-6 px-6 md:px-16">
          <Link to="/" className="text-[15px] font-extrabold tracking-tight text-white">
            Digital Menu
          </Link>
          <nav className="hidden items-center gap-6 text-[13px] text-white/75 md:flex" aria-label={t('web.header.primaryNav')}>
            <Link to="/templates" className="transition hover:text-white">{t('nav.templates')}</Link>
            <Link to="/#features" className="transition hover:text-white">{t('nav.features')}</Link>
            <Link to="/#pricing" className="transition hover:text-white">{t('nav.pricing')}</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/signin" className="hidden text-[13px] text-white/75 transition hover:text-white sm:block">
              {t('nav.signIn')}
            </Link>
            <Link to="/templates" className="rounded-full bg-white px-5 py-2 text-[13px] font-semibold text-[#0B0B0B] transition hover:-translate-y-0.5">
              {t('nav.getStarted')}
            </Link>
          </div>
        </div>
      </header>

      <div ref={copyRef} className="relative z-10 px-6 md:px-16 lg:px-24">
        <span className="mb-5 inline-block text-[10px] font-bold uppercase tracking-[0.28em] text-white/60">
          Restaurant platform
        </span>
        <h1 className="font-extrabold leading-[0.95] tracking-tighter text-white" style={{ fontSize: 'clamp(56px, 9vw, 132px)' }}>
          Digital Menu
        </h1>
        <Link
          to="/templates"
          className="mt-9 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:shadow-lg"
          style={{ backgroundColor: variant.accent }}
        >
          View Menu <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  )
}
