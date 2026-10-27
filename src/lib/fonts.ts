import type { FontId } from './types'

export interface FontOption {
  id: FontId
  name: string
  stack: string
  category: 'Sans serif' | 'Serif'
  note: string
}

/** Every font below is loaded through the Google Fonts link in index.html. */
export const FONTS: FontOption[] = [
  {
    id: 'inter',
    name: 'Inter',
    stack: '"Inter", system-ui, sans-serif',
    category: 'Sans serif',
    note: 'Neutral, precise, screen-first',
  },
  {
    id: 'poppins',
    name: 'Poppins',
    stack: '"Poppins", system-ui, sans-serif',
    category: 'Sans serif',
    note: 'Geometric, friendly, rounded',
  },
  {
    id: 'dm-sans',
    name: 'DM Sans',
    stack: '"DM Sans", system-ui, sans-serif',
    category: 'Sans serif',
    note: 'Low contrast, quietly modern',
  },
  {
    id: 'playfair',
    name: 'Playfair Display',
    stack: '"Playfair Display", Georgia, serif',
    category: 'Serif',
    note: 'Editorial, elegant, high contrast',
  },
  {
    id: 'lora',
    name: 'Lora',
    stack: 'Lora, Georgia, serif',
    category: 'Serif',
    note: 'Warm, literary, hospitable',
  },
  {
    id: 'montserrat',
    name: 'Montserrat',
    stack: 'Montserrat, system-ui, sans-serif',
    category: 'Sans serif',
    note: 'Bold, structural, confident',
  },
]

export function fontStack(id: FontId): string {
  return FONTS.find((f) => f.id === id)?.stack ?? FONTS[0].stack
}

export function fontName(id: FontId): string {
  return FONTS.find((f) => f.id === id)?.name ?? FONTS[0].name
}
