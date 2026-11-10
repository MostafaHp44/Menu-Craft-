import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { HOME_SEED, useHomeContentByLang } from '../../shared/store/useHomeContent.ts'
import { useI18n } from '../../shared/i18n'
import { Particles } from '../../shared/ui/Particles.tsx'
import { getHeroVariant } from '../../templates/data/heroVariants.ts'

const FOOD_IMAGES = [
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80',
  'https://images.unsplash.com/photo-1546069901-d5bfd2cbfb1f?w=1200&q=80',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&q=80',
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=1200&q=80',
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200&q=80',
  'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=1200&q=80',
  'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=1200&q=80',
  'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=1200&q=80',
  'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=1200&q=80',
  'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=1200&q=80',
]

const FALLBACK_DESKTOP = 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4'
const FALLBACK_MOBILE = 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'

gsap.registerPlugin(ScrollTrigger)

// Configuração mobile-aware: تمنع ScrollTrigger من إعادة التفعيل بطريقة
// تسبب تعطل animations على الموبايل


/* --------------------------- roaming tagline ------------------------------ */

const TAGLINE = 'Your Restaurant Menu. Your Brand. Your Rules.'
const TAG_PHRASES = TAGLINE.match(/[^.]+\./g)?.map((s) => s.trim()) ?? [TAGLINE]

/** waypoints per phrase — x/y in vw/vh units, r = rotation, d = duration (s) */
const TAG_ROUTES: Array<Array<{ x: number; y: number; r: number; d: number }>> = [
  [
    { x: 7, y: -5, r: -4, d: 5 },
    { x: 28, y: 11, r: 3, d: 6 },
    { x: 14, y: 32, r: -2, d: 5.5 },
    { x: -7, y: 17, r: 4, d: 6 },
    { x: 0, y: 0, r: 0, d: 5 },
  ],
  [
    { x: -9, y: -14, r: 3, d: 6 },
    { x: -30, y: -3, r: -4, d: 5.5 },
    { x: -16, y: 13, r: 2, d: 6 },
    { x: 5, y: -7, r: -3, d: 5 },
    { x: 0, y: 0, r: 0, d: 6 },
  ],
  [
    { x: 19, y: -9, r: -3, d: 5 },
    { x: -13, y: -26, r: 4, d: 6 },
    { x: -31, y: -8, r: -2, d: 5.5 },
    { x: -7, y: 8, r: 3, d: 6 },
    { x: 0, y: 0, r: 0, d: 5 },
  ],
]

/** responsive anchor points (safe on mobile, spread out on desktop) */
const TAG_ANCHORS = [
  'left-[24%] top-[26%] md:left-[16%] md:top-[24%]',
  'left-[70%] top-[62%] lg:left-[76%] lg:top-[78%]',
  'left-[48%] top-[86%] md:left-[46%] md:top-[85%]',
]

const TAG_STYLES = [
  'text-[10.5px] sm:text-[12px] md:text-[15px] font-semibold text-[#55B8FF]',
  'text-[12px] sm:text-[15px] md:text-[20px] font-bold text-white',
  'text-[9.5px] sm:text-[11px] md:text-[13px] font-medium text-[#EAF4FF]/85',
]

export default function CinematicHero() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const line1Ref = useRef<HTMLSpanElement>(null)
  const line2Ref = useRef<HTMLSpanElement>(null)
  const subRef = useRef<HTMLParagraphElement>(null)
  const tagRef = useRef<HTMLParagraphElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const floatLayerRef = useRef<HTMLDivElement>(null)

  const [reduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

  const { lang } = useI18n()
  const contentByLang = useHomeContentByLang()
  const hero = contentByLang[lang]?.hero || contentByLang.en?.hero || HOME_SEED[lang]?.hero
  const variant = getHeroVariant((hero as any)?.variant)

  const titleScale = (hero.textSizes?.title || 100) / 100
  const subScale = (hero.textSizes?.sub || 100) / 100

  /* pick video by viewport */
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    setIsMobile(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const hasAdminVideo = !!(hero?.videoMobile || hero?.videoDesktop || hero?.video)
  const hasAdminImage = !!(hero?.imageMobile || hero?.imageDesktop || hero?.image)
  // لو الأدمن اختار صورة فقط (من غير فيديو) — اعرض الصورة بدل ما نبدّل لفيديو تجريبي
  const useFallbackVideo = !hasAdminVideo && !hasAdminImage
  const videoSrc = hasAdminVideo
    ? (isMobile ? (hero?.videoMobile || hero?.video || FALLBACK_MOBILE) : (hero?.videoDesktop || hero?.video || FALLBACK_DESKTOP))
    : (useFallbackVideo ? (isMobile ? FALLBACK_MOBILE : FALLBACK_DESKTOP) : null)
  const heroImage = isMobile ? (hero?.imageMobile || hero?.imageDesktop || hero?.image || '') : (hero?.imageDesktop || hero?.image || '')

  /* text reveal — progressive with scroll (scrub) */
  useEffect(() => {
    if (!sectionRef.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set([line1Ref.current, line2Ref.current, subRef.current, tagRef.current], {
        y: 0, opacity: 1, clearProps: 'transform',
      })
      return
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=600',
          scrub: 0.6,
        },
      })

      tl.fromTo(line1Ref.current, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 1 }, 0)
        .fromTo(line2Ref.current, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 1 }, 0.25)
        .fromTo(subRef.current, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1 }, 0.55)
        .fromTo(tagRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 1 }, 0.85)
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  /* food showcase */
  const [foodIdx, setFoodIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setFoodIdx((i) => (i + 1) % FOOD_IMAGES.length), 5000)
    return () => clearInterval(t)
  }, [])

  /* tagline phrases roam around the screen + follow the cursor slightly */
  useEffect(() => {
    if (reduced) return
    const layer = floatLayerRef.current
    if (!layer) return

    const items = Array.from(layer.querySelectorAll<HTMLElement>('[data-phrase]'))
    if (items.length === 0) return

    const ctx = gsap.context(() => {
      /* entrance — chips pop in one by one */
      gsap.from(items, {
        opacity: 0,
        scale: 0.7,
        duration: 0.7,
        ease: 'back.out(1.8)',
        stagger: 0.18,
        delay: 0.9,
      })

      items.forEach((el, i) => {
        const route = TAG_ROUTES[i % TAG_ROUTES.length]
        const to = (v: number, axis: 'w' | 'h') =>
          (axis === 'w' ? window.innerWidth : window.innerHeight) * (v / 100)

        gsap.set(el, { xPercent: -50, yPercent: -50, x: 0, y: 0 })

        const tl = gsap.timeline({ repeat: -1, defaults: { ease: 'sine.inOut' } })
        route.forEach((step) => {
          tl.to(el, { x: to(step.x, 'w'), y: to(step.y, 'h'), rotation: step.r, duration: step.d })
        })
      })
    }, layer)

    /* cursor parallax — phrases drift a little toward the mouse */
    const onMove = (e: MouseEvent) => {
      const nx = e.clientX / window.innerWidth - 0.5
      const ny = e.clientY / window.innerHeight - 0.5
      items.forEach((el, i) => {
        const depth = 18 + i * 12
        gsap.to(el.parentElement, {
          x: -nx * depth,
          y: -ny * depth,
          duration: 0.9,
          ease: 'power3.out',
          overwrite: 'auto',
        })
      })
    }
    window.addEventListener('mousemove', onMove, { passive: true })

    /* subtle scroll drift so the phrase layer feels alive while scrolling */
    const onScroll = () => {
      const p = Math.min(window.scrollY / Math.max(window.innerHeight, 1), 1)
      gsap.to(layer, { y: p * -60, opacity: 1 - p * 0.35, duration: 0.5, overwrite: 'auto' })
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('scroll', onScroll)
      ctx.revert()
    }
  }, [reduced])

  return (
    <section ref={sectionRef} className="relative h-[100vh] w-full overflow-hidden flex items-center justify-center" style={{ backgroundColor: variant.bg }}>
      {videoSrc ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          poster={heroImage || ''}
          className="absolute inset-0 h-full w-full object-cover opacity-80"
          src={videoSrc}
          onError={(e) => {
            const v = e.currentTarget
            const fb = isMobile ? FALLBACK_MOBILE : FALLBACK_DESKTOP
            if (!v.src.endsWith(fb)) v.src = fb
          }}
        />
      ) : heroImage ? (
        <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" />
      ) : null}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at top, ${variant.glow}59, transparent 55%), linear-gradient(to bottom, ${variant.bg}b3 0%, ${variant.bg}59 45%, ${variant.bg}db 100%)`,
        }}
      />
      <div className="absolute inset-0 bg-black/20" />
      <Particles className="z-[1]" />

      {/* Food showcase — desktop only */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:block z-10 w-[280px]">
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl p-2.5 shadow-2xl shadow-[#071426]/60"
        >
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
            {FOOD_IMAGES.map((src, i) => (
              <img
                key={src}
                src={src}
                alt="Dish"
                loading={i === 0 ? 'eager' : 'lazy'}
                className="absolute inset-0 h-full w-full object-cover transition-opacity duration-1000"
                style={{ opacity: i === foodIdx ? 1 : 0 }}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-[#071426]/40 to-transparent" />
          </div>
          <div className="flex items-center justify-between px-2 pt-2">
            <span className="text-[11px] font-medium text-[#EAF4FF]/70">Signature Dishes</span>
            <div className="flex gap-1">
              {FOOD_IMAGES.map((_, i) => (
                <span key={i} className={`h-1 w-1 rounded-full transition-colors ${i === foodIdx ? 'bg-[#55B8FF]' : 'bg-white/30'}`} />
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tagline — phrases float and roam around the screen (kinetic type) */}
      {!reduced && variant.taglineRoam && (
        <div
          ref={floatLayerRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[2] overflow-hidden"
        >
          {TAG_PHRASES.map((phrase, i) => (
            <div
              key={phrase}
              className={`absolute ${TAG_ANCHORS[i % TAG_ANCHORS.length]}`}
            >
              <span
                data-phrase
                className={`block whitespace-nowrap rounded-full border border-white/20 bg-black/45 px-3 py-1.5 sm:px-4 sm:py-2 tracking-[0.18em] uppercase backdrop-blur-md ${TAG_STYLES[i % TAG_STYLES.length]}`}
                style={{
                  borderColor: `${variant.accent}40`,
                  boxShadow: `0 8px 40px -12px ${variant.accent}80`,
                  ...(i % TAG_STYLES.length === 0 ? { color: variant.accent } : {}),
                }}
              >
                {phrase}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Text — appears progressively with scroll (scrub) */}
      <div className={`relative z-10 px-6 max-w-5xl ${variant.align === 'left' ? 'text-start self-center ms-6 md:ms-16' : 'text-center'}`}>
        <span className="mb-4 inline-block rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-white/70 backdrop-blur-md" style={hero.textColors?.eyebrow ? { color: hero.textColors.eyebrow } : undefined}>
          {variant.name} · {variant.note}
        </span>
        <h1
          className="font-extrabold leading-[0.95] tracking-tighter"
          style={{
            fontSize: `clamp(${Math.round(60 * variant.bigType * titleScale)}px,${Math.round(10 * variant.bigType * titleScale)}vw,${Math.round(140 * variant.bigType * titleScale)}px)`,
            fontFamily: variant.font === 'playfair' ? '"Playfair Display", "Cairo", serif' : variant.font === 'inter' ? 'Inter, "Cairo", sans-serif' : 'Montserrat, "Cairo", sans-serif',
          }}
        >
          {(hero?.title || 'Your menu, alive.')
            .split('\n')
            .map((line: string, i: number) => (
              <span key={i} ref={i === 0 ? line1Ref : line2Ref} className="block" style={{ color: hero.textColors?.title || (i === 0 ? variant.accent : '#fff') }}>
                {line}
              </span>
            ))}
        </h1>
        <p ref={subRef} className={`mt-6 text-[#EAF4FF]/80 font-light ${variant.align === 'center' ? 'mx-auto max-w-2xl' : 'max-w-2xl'}`} style={{ fontSize: `clamp(${Math.round(16 * subScale)}px, ${Math.round(2.2 * subScale)}vw, ${Math.round(24 * subScale)}px)`, ...(hero.textColors?.sub ? { color: hero.textColors.sub } : {}) }}>
          {hero?.sub || 'The future of restaurant experiences starts with a scan.'}
        </p>
        {variant.chips ? (
          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            {(['QR', 'Order', 'Pay'] as const).map((c) => (
              <span key={c} className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] backdrop-blur-md" style={{ color: hero.chipColors?.[c.toLowerCase() as 'qr' | 'order' | 'pay'] || variant.accent }}>{c}</span>
            ))}
          </div>
        ) : null}
        {variant.phoneMock ? (
          <div className="mx-auto mt-6 w-[240px] rounded-3xl border border-white/25 bg-white/10 p-3 backdrop-blur-xl">
            <div className="flex items-center justify-between text-[13px]"><span>🍕 Margherita</span><b>$12</b></div>
            <div className="mt-2 rounded-full bg-white py-2 text-center text-[12px] font-bold text-black">Add to cart</div>
          </div>
        ) : null}
        <p
          ref={tagRef}
          className={
            reduced || variant.taglineRoam
              ? 'mt-4 text-sm md:text-base font-medium tracking-[0.2em] uppercase'
              : 'sr-only'
          }
          style={{ color: `${variant.accent}b3` }}
        >
          {TAGLINE}
        </p>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs tracking-[0.3em] uppercase animate-bounce" style={{ color: `${variant.accent}99` }}>
        Scroll to Enter
      </div>
    </section>
  )
}
