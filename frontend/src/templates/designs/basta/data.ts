/**
 * Basta — template definition + sample data.
 * Foody-inspired: warm light editorial layout, red accent, circular pasta plates.
 */
import type {
  LogoStyle,
  MenuCategory,
  MenuItem,
  SectionState,
  TemplateDefinition,
} from '../../../shared/lib/types.ts'
import { IMG } from '../../../shared/lib/images.ts'

function mkItem(id: string, name: string, description: string, price: number, image: string, extra: Partial<MenuItem> = {}): MenuItem {
  return { id, name, description, price, compareAt: null, image, featured: false, popular: false, available: true, ...extra }
}
function mkCat(id: string, name: string, note: string, items: MenuItem[]): MenuCategory {
  return { id, name, note, items }
}

const SECTIONS: SectionState[] = [
  { id: 'featured', enabled: true },
  { id: 'menu', enabled: true },
  { id: 'about', enabled: true },
  { id: 'gallery', enabled: true },
  { id: 'hours', enabled: true },
  { id: 'contact', enabled: true },
]

export const bastaDefinition: TemplateDefinition = {
  id: 'basta',
  name: 'Basta',
  category: 'Restaurant',
  tagline: 'Fresh pasta, made with love.',
  description:
    'A warm, light editorial restaurant template: oversized black headline, circular pasta plates, floating offer cards and a swipeable row of dish cards with a confident red accent.',
  personality: 'Warm · Editorial · Pasta',
  tags: ['Pasta', 'Italian', 'Modern', 'Red'],
  featured: true,
  chips: ['#EAE4E3', '#E11D33', '#0B0B0B'],
  previewImage: IMG.pastaWineTable,
  heroImage: IMG.pastaWineTable,
  gallery: [IMG.mushroomPasta, IMG.seafoodPasta, IMG.penneArrabbiata, IMG.zucchiniPasta],
  sample: {
    name: 'Basta',
    slug: 'basta',
    tagline: 'Fresh pasta, made with love.',
    description: "it's not just Food, It's an Experience.",
    logoText: 'B',
    logoStyle: 'wordmark' as LogoStyle,
    phone: '+1 (212) 555-0148',
    email: 'ciao@basta.demo',
    address: '42 Pasta Lane, New York, NY 10012',
    hours: [
      { day: 'Monday – Thursday', hours: '11:30 – 22:00' },
      { day: 'Friday – Sunday', hours: '12:00 – 23:30' },
    ],
    socials: { instagram: '@basta.demo', facebook: 'basta.demo', website: 'basta.example.com' },
  },
  sampleMenu: [
    mkCat('bs-pasta', 'Pasta', 'Fresh every morning', [
      mkItem('bs-1', 'Pappardelle', 'With Vegetable', 35, IMG.mushroomPasta, { featured: true, popular: true }),
      mkItem('bs-2', 'Ravioli Stuffed', 'With Pesto Sauce', 35, IMG.pastaSalad, { featured: true }),
      mkItem('bs-3', 'Spaghetti Pomodoro', 'Slow tomato & basil', 32, IMG.penneArrabbiata),
      mkItem('bs-4', 'Creamy Fusilli', 'Parmesan, black pepper, parsley', 34, IMG.seafoodPasta, { popular: true }),
    ]),
    mkCat('bs-sides', 'Sides', 'To share', [
      mkItem('bs-5', 'Garlic Bread', 'Toasted sourdough, garlic butter', 12, IMG.artisanBread),
      mkItem('bs-6', 'Garden Salad', 'Soft herbs, shaved fennel, dressing', 14, IMG.saladPlate),
    ]),
  ],
  defaultDesign: {
    colors: {
      primary: '#0B0B0B',
      secondary: '#E11D33',
      accent: '#E11D33',
      background: '#EAE4E3',
      text: '#0B0B0B',
      card: '#F3EFEF',
      button: '#E11D33',
      border: '#D9D0D0',
    },
    typography: {
      heading: 'playfair',
      body: 'inter',
      menu: 'inter',
      headingScale: 1.05,
      bodyScale: 1,
      headingWeight: 600,
      lineHeight: 1.6,
    },
    layout: {
      header: 'split',
      hero: 'fullscreen',
      menuLayout: 'grid',
      card: 'elevated',
      radius: 22,
      spacing: 1,
      aspect: 'square',
      theme: 'light',
      variant: 'basta',
    },
    sections: SECTIONS,
  },
  usageCount: 0,
}
