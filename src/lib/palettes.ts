import type { ColorSet, ThemeMode } from './types'

export interface PalettePreset {
  id: string
  name: string
  note: string
  colors: ColorSet
}

/** Professionally balanced palettes offered in the editor's color panel. */
export const PALETTE_PRESETS: PalettePreset[] = [
  {
    id: 'ivory-flame',
    name: 'Ivory & Flame',
    note: 'Editorial warmth with a confident accent',
    colors: {
      primary: '#1B1714',
      secondary: '#7D7263',
      accent: '#E8571F',
      background: '#FAF7F1',
      text: '#1B1714',
      card: '#FFFFFF',
      button: '#1B1714',
    },
  },
  {
    id: 'midnight-gold',
    name: 'Midnight & Gold',
    note: 'Dark, luxurious, built for evening service',
    colors: {
      primary: '#C6A15B',
      secondary: '#8A7A5E',
      accent: '#C6A15B',
      background: '#14110F',
      text: '#F3ECE1',
      card: '#1E1A16',
      button: '#C6A15B',
    },
  },
  {
    id: 'terracotta',
    name: 'Terracotta',
    note: 'Sun-baked, handcrafted, Mediterranean',
    colors: {
      primary: '#C2703F',
      secondary: '#8C6A4F',
      accent: '#C1442E',
      background: '#FBF4EC',
      text: '#2E2118',
      card: '#FFFDF8',
      button: '#B4572A',
    },
  },
  {
    id: 'olive-garden',
    name: 'Olive Garden',
    note: 'Herbal greens with a golden finish',
    colors: {
      primary: '#3F5D45',
      secondary: '#6B7F63',
      accent: '#C08A2E',
      background: '#F7F6EF',
      text: '#1F2A21',
      card: '#FFFFFF',
      button: '#3F5D45',
    },
  },
  {
    id: 'espresso-cream',
    name: 'Espresso & Cream',
    note: 'Roasted browns, soft and inviting',
    colors: {
      primary: '#4A3428',
      secondary: '#8A7361',
      accent: '#A9673A',
      background: '#F4EDE4',
      text: '#2C211A',
      card: '#FFFCF7',
      button: '#4A3428',
    },
  },
  {
    id: 'atlantic',
    name: 'Atlantic',
    note: 'Cool, clean, coastal confidence',
    colors: {
      primary: '#1F4E5F',
      secondary: '#5C7B85',
      accent: '#D9822B',
      background: '#F6F8F8',
      text: '#14262C',
      card: '#FFFFFF',
      button: '#1F4E5F',
    },
  },
  {
    id: 'graphite-pop',
    name: 'Graphite Pop',
    note: 'Swiss minimalism with one loud accent',
    colors: {
      primary: '#121212',
      secondary: '#6E6A64',
      accent: '#E8571F',
      background: '#FFFFFF',
      text: '#121212',
      card: '#F6F5F3',
      button: '#121212',
    },
  },
  {
    id: 'rose-cream',
    name: 'Rose Cream',
    note: 'Soft patisserie tones, quietly feminine',
    colors: {
      primary: '#A5544E',
      secondary: '#C08D82',
      accent: '#8E423D',
      background: '#FCF4F1',
      text: '#33211F',
      card: '#FFFFFF',
      button: '#8E423D',
    },
  },
]

type SurfaceTriplet = Pick<ColorSet, 'background' | 'text' | 'card'>

/** Surface colors applied by the light / dark / warm theme switch. */
export const THEME_SURFACES: Record<Exclude<ThemeMode, 'custom'>, SurfaceTriplet> = {
  light: { background: '#FAF7F1', text: '#1B1714', card: '#FFFFFF' },
  dark: { background: '#14110F', text: '#F3ECE1', card: '#1E1A16' },
  warm: { background: '#FBF3E6', text: '#3B2A1E', card: '#FFFDF8' },
}

export const THEME_OPTIONS: Array<{ id: Exclude<ThemeMode, 'custom'>; name: string; note: string }> = [
  { id: 'light', name: 'Light', note: 'Ivory & airy' },
  { id: 'dark', name: 'Dark', note: 'Evening service' },
  { id: 'warm', name: 'Warm', note: 'Golden hour' },
]
