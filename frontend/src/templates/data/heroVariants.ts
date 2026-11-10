/**
 * Hero variants for the public home page first section (`/`).
 * The admin picks one in /admin?tab=home — it is stored as
 * `hero.variant` inside HomeContent (JSON column, no schema change).
 * All variants share the same media (image / video desktop & mobile)
 * and copy (eyebrow / title / sub / cta) — they change *shape* and the
 * background (bg + glow) of the section.
 */
export interface HeroVariant {
  id: string
  name: string
  note: string
  align: 'center' | 'left'
  font: 'montserrat' | 'inter' | 'playfair'
  /** first title line + accent details */
  accent: string
  /** background base color (shows when no admin media is set, tints the media overlay) */
  bg: string
  /** background radial glow colour */
  glow: string
  chips: boolean
  phoneMock: boolean
  taglineRoam: boolean
  bigType: number
}

export const HERO_VARIANTS: HeroVariant[] = [
  { id: 'scan-taste', name: 'Scan it. Taste it.', note: 'Touch & Feel', align: 'center', font: 'montserrat', accent: '#ffb020', bg: '#120a24', glow: '#7c3aed', chips: false, phoneMock: false, taglineRoam: false, bigType: 1 },
  { id: 'menu-alive', name: 'Your menu, alive.', note: 'Touch & Feel + QR/Order/Pay chips', align: 'center', font: 'montserrat', accent: '#55b8ff', bg: '#071426', glow: '#247bdf', chips: true, phoneMock: false, taglineRoam: true, bigType: 1.05 },
  { id: 'type-less', name: 'Type less. Order more.', note: 'Touch & Feel + phone mock', align: 'center', font: 'montserrat', accent: '#ffffff', bg: '#0a0f1a', glow: '#3b4a6b', chips: false, phoneMock: true, taglineRoam: false, bigType: 0.95 },
  { id: 'dine-digital', name: 'Dine Digital.', note: 'Minimal Luxe — thin weight', align: 'center', font: 'inter', accent: '#ffb020', bg: '#17100a', glow: '#8a5a12', chips: false, phoneMock: false, taglineRoam: false, bigType: 0.9 },
  { id: 'appelaes', name: 'The menu that appelaes.', note: 'Minimal Luxe — amber gradient', align: 'center', font: 'montserrat', accent: '#ffb020', bg: '#26150a', glow: '#c96a0a', chips: true, phoneMock: false, taglineRoam: false, bigType: 1 },
  { id: 'on-plate', name: 'Digital is on your plate.', note: 'Minimal Luxe — hook', align: 'center', font: 'montserrat', accent: '#ff4d4d', bg: '#1c0606', glow: '#8f1d1d', chips: false, phoneMock: false, taglineRoam: false, bigType: 1 },
  { id: 'hot-fresh', name: 'Hot. Fresh. Yours.', note: 'Fun & Food — hot colors', align: 'center', font: 'montserrat', accent: '#3ddc84', bg: '#20020f', glow: '#a3134a', chips: false, phoneMock: false, taglineRoam: false, bigType: 1 },
  { id: 'boss', name: 'Eat like a boss.', note: 'Fun & Food — Scan/Order/Pay/Enjoy', align: 'center', font: 'montserrat', accent: '#ffb020', bg: '#10131f', glow: '#2e4a8f', chips: true, phoneMock: false, taglineRoam: false, bigType: 1 },
  { id: 'made-order', name: 'Made to order.', note: 'Fun & Food — drinks vibe', align: 'center', font: 'playfair', accent: '#ffffff', bg: '#03231a', glow: '#0f7a55', chips: false, phoneMock: false, taglineRoam: false, bigType: 1 },
  { id: 'award', name: 'Win an award for your menu.', note: 'Bento & Awards — highlight', align: 'center', font: 'montserrat', accent: '#ffb020', bg: '#231704', glow: '#8a6a12', chips: true, phoneMock: false, taglineRoam: false, bigType: 1 },
  { id: 'case-month', name: 'Case of the month?', note: 'Bento & Awards — ticket', align: 'center', font: 'montserrat', accent: '#55b8ff', bg: '#12102e', glow: '#4a3a8f', chips: true, phoneMock: false, taglineRoam: false, bigType: 1 },
  { id: 'urban', name: 'Open. Close. Digital.', note: 'Bento & Awards — city rhythm', align: 'left', font: 'montserrat', accent: '#ffffff', bg: '#101010', glow: '#f59e0b', chips: false, phoneMock: false, taglineRoam: true, bigType: 0.95 },
]

export function getHeroVariant(id?: string | null): HeroVariant {
  return HERO_VARIANTS.find((v) => v.id === id) || HERO_VARIANTS[0]
}
