import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Marketing copy for the public home page (`/`).
 *
 * The super admin edits it from the admin console → "Home page" tab; every
 * value is free-form ENGLISH marketing copy (not an i18n key — the copy is
 * product content, not UI chrome). All data is simulated and persisted to
 * localStorage only.
 *
 * Conventions understood by `Home.tsx`:
 * - `*text*` inside a title marks the accent span (e.g. "…look *finished*").
 * - `\n` inside the hero title becomes a line break.
 * - an empty string falls back to the seed value, so the page never breaks.
 */

export interface HomeSection {
  enabled: boolean
  eyebrow?: string
  title: string
  sub?: string
}

export interface HomeContent {
  hero: {
    enabled: boolean
    eyebrow: string
    title: string
    sub: string
    cta: string
    secondaryCta: string
    image: string
    note: string
  }
  templates: HomeSection
  editorShowcase: { enabled: boolean; eyebrow: string; title: string; sub: string; bullets: string[] }
  workflow: {
    enabled: boolean
    eyebrow: string
    title: string
    sub: string
    steps: { title: string; body: string }[]
  }
  highlights: { enabled: boolean; items: { title: string; body: string }[] }
  showcase: HomeSection
  pricing: HomeSection & { note: string }
  finalCta: { enabled: boolean; title: string; sub: string; cta: string }
  updatedAt: string
}

export type HomeSectionKey = keyof Omit<HomeContent, 'updatedAt'>

/**
 * The original MenuCraft home-page copy, verbatim.
 * This is the first-load content and the fallback for anything left empty.
 */
export const HOME_SEED: HomeContent = {
  hero: {
    enabled: true,
    eyebrow: 'The digital menu builder for food businesses',
    title: 'Your Restaurant Menu.\nYour Brand. *Your Rules.*',
    sub: 'Create a beautiful digital menu for your restaurant, cafe, or bakery. Choose your design, customize every detail, and share your menu with the world — no coding required.',
    cta: 'Explore Templates',
    secondaryCta: 'Explore the Editor',
    // the hero uses the live restaurant preview as its visual — no photo today
    image: '',
    note: 'A real MenuCraft preview — the same renderer that powers the editor and the published site.',
  },
  templates: {
    enabled: true,
    eyebrow: 'Template marketplace',
    title: 'Designs that already look *finished*',
    sub: 'Every template is a complete restaurant website: its own typography, palette, header, hero and menu style. Start from one, then change anything.',
  },
  editorShowcase: {
    enabled: true,
    eyebrow: 'The visual editor',
    title: 'Change it and watch it happen.',
    sub: 'Colors, fonts, layout, menu content — every control in the MenuCraft editor writes to the live preview as you type. No preview button, no page reload, no guessing.',
    bullets: [],
  },
  workflow: {
    enabled: true,
    eyebrow: 'How it works',
    title: 'Three steps from idea to live menu',
    sub: 'The whole journey is designed to take minutes — and it is fully interactive in this demo.',
    steps: [
      {
        title: 'Choose',
        body: 'Browse eight complete restaurant designs and preview each one as a real, scrollable website.',
      },
      {
        title: 'Customize',
        body: 'Rename the restaurant, recolor, switch fonts, rework the menu — everything updates live.',
      },
      {
        title: 'Publish',
        body: 'Save your demo, open the mobile-friendly site and generate the QR code for your tables.',
      },
    ],
  },
  highlights: {
    enabled: true,
    items: [
      {
        title: 'Branding',
        body: 'Name, logo, tagline, hero photography, contact details and opening hours — all editable, all live.',
      },
      {
        title: 'Typography',
        body: 'Six curated families for headings, body and menu items, with size, weight and leading controls.',
      },
      {
        title: 'Menu management',
        body: 'Categories, items, prices, promotional pricing, availability, featured dishes and drag-free reordering.',
      },
      {
        title: 'QR codes',
        body: 'A real, scannable QR code for every menu — downloadable and print-ready for tables and windows.',
      },
      {
        title: 'Mobile-friendly',
        body: 'Every template is built responsive-first, so the menu reads perfectly on a phone at the table.',
      },
    ],
  },
  showcase: {
    enabled: true,
    eyebrow: 'Responsive by default',
    title: 'One menu. Every screen.',
    sub: 'Guests open your menu on the phone in their hand. MenuCraft templates reflow for desktop, tablet and mobile without a single extra setting — preview both sizes side by side before you publish.',
  },
  pricing: {
    enabled: true,
    eyebrow: 'Pricing',
    title: 'Simple plans, *demo pricing*',
    sub: 'These prices are illustrative only. This prototype processes no payments and provisions no real hosting.',
    note: 'Every button in this prototype leads somewhere — plans simply open the demo editor.',
  },
  finalCta: {
    enabled: true,
    title: 'Your menu deserves better than a PDF.',
    sub: 'Pick a template, change the restaurant name, edit a price, swap the font — in under two minutes you will have a menu worth sharing.',
    cta: 'Explore Templates',
  },
  updatedAt: '',
}

interface HomeContentState {
  content: HomeContent
  /** draft-style immutable update — bumps `updatedAt` */
  update: (recipe: (content: HomeContent) => void) => void
  /** restores the whole page to `HOME_SEED` */
  resetHome: () => void
}

/** guards against older/partial payloads sitting in localStorage */
function mergeWithSeed(stored: Partial<HomeContent>): HomeContent {
  return {
    ...HOME_SEED,
    ...stored,
    hero: { ...HOME_SEED.hero, ...stored.hero },
    templates: { ...HOME_SEED.templates, ...stored.templates },
    editorShowcase: { ...HOME_SEED.editorShowcase, ...stored.editorShowcase },
    workflow: { ...HOME_SEED.workflow, ...stored.workflow },
    highlights: { ...HOME_SEED.highlights, ...stored.highlights },
    showcase: { ...HOME_SEED.showcase, ...stored.showcase },
    pricing: { ...HOME_SEED.pricing, ...stored.pricing },
    finalCta: { ...HOME_SEED.finalCta, ...stored.finalCta },
    updatedAt: stored.updatedAt ?? HOME_SEED.updatedAt,
  }
}

export const useHomeContentStore = create<HomeContentState>()(
  persist(
    (set) => ({
      content: structuredClone(HOME_SEED),

      update: (recipe) =>
        set((state) => {
          const next = structuredClone(state.content)
          recipe(next)
          next.updatedAt = new Date().toISOString()
          return { content: next }
        }),

      resetHome: () => set({ content: structuredClone(HOME_SEED) }),
    }),
    {
      name: 'menucraft-home-v1',
      version: 1,
      partialize: (state) => ({ content: state.content }),
      merge: (persisted, current) => {
        const stored = (persisted ?? {}) as Partial<HomeContentState>
        return {
          ...current,
          ...stored,
          content: stored.content ? mergeWithSeed(stored.content) : current.content,
        }
      },
    }
  )
)

/** selector hook — the home page re-renders whenever the copy changes */
export function useHomeContent(): HomeContent {
  return useHomeContentStore((state) => state.content)
}
