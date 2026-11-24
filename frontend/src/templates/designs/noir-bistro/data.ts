/**
 * Noir Bistro — premium French-Bistro / European-Editorial / Dark-Luxury template.
 *
 * A fully independent design: asymmetric editorial composition, cinematic dark
 * palette, serif editorial typography, dramatic numbers, thin dividers and
 * large whitespace — while staying on the shared Digital Menu data model
 * (MenuCategory / MenuItem) and rendering through the shared editor/checkout
 * contracts.
 *
 * Structure: templates/designs/noir-bistro/data.ts
 */
import type {
  LogoStyle,
  MenuCategory,
  MenuItem,
  SectionState,
  TemplateDefinition,
} from '../../../shared/lib/types.ts'
import { IMG } from '../../../shared/lib/images.ts'

function mkItem(
  id: string,
  name: string,
  description: string,
  price: number,
  image: string,
  extra: Partial<MenuItem> = {},
): MenuItem {
  return {
    id,
    name,
    description,
    price,
    compareAt: null,
    image,
    featured: false,
    popular: false,
    available: true,
    ...extra,
  }
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

export const noirBistroDefinition: TemplateDefinition = {
  id: 'noir-bistro',
  name: 'Noir Bistro',
  category: 'Restaurant',
  tagline: 'Epicures transform experience on dark.',
  description:
    'Noir Bistro: a French-Bistro meets European editorial look — dark luxury, cinematic food photography, delicate serif typography and an asymmetric layout. Chef\'s cuts, mains, and sweets served with elegance and silence.',
  personality: 'French · Bistro · Dark · Editorial · Luxury · Metallic Accent',
  tags: ['Steaks', 'Bistro', 'Chef\'s Cuts', 'Silver', 'Desserts'],
  featured: true,
  chips: ['#0C0A08', '#C8A25C', '#16110C'],
  previewImage: IMG.chocolateCake,
  heroImage: IMG.healthyPlate,
  gallery: [IMG.healthyPlate, IMG.saladPlate, IMG.steakFrites, IMG.platedDessert, IMG.seafoodPasta, IMG.grilledMeat],
  sample: {
    name: 'Noir Bistro',
    slug: 'noir-bistro',
    tagline: 'Epicures transform experience on dark.',
    description: 'A dark bistro where every plate is a whisper of elegance.',
    logoText: 'NOIR',
    logoStyle: 'monogram' as LogoStyle,
    phone: '+33 1 40 41 42 43',
    email: 'table@noir-bistro.demo',
    address: '12 Rue de la Ville, Paris 75001',
    hours: [
      { day: 'Monday – Tuesday', hours: '16:00 – 23:00' },
      { day: 'Wednesday – Sunday', hours: '18:00 – 02:00' },
    ],
    socials: { instagram: '@noirbistro', facebook: 'noirbistro', website: 'noir-bistro.demo' },
  },
  sampleMenu: [
    mkCat('starters', 'Starters', 'Approche douce', [
      mkItem('nb-1', 'Beef Tartare', 'Hand-cut filet with truffle salt, coriander', 24, IMG.healthyPlate, {
        isSpicy: true,
        allergens: ['beef'],
      }),
      mkItem('nb-2', 'Salade Pommes de Terre', 'Seafood historia, fennel', 15, IMG.saladBowl, {
        isVeg: true,
        allergens: ['shellfish'],
      }),
    ]),
    mkCat('mains', 'Main Courses', 'Entrées principales', [
      mkItem('nb-3', 'Wagyu Rôti', 'Aged Wagyu, garlic butter, wines', 42, IMG.steakFrites, {
        featured: true,
        allergens: ['beef', 'dairy'],
      }),
      mkItem('nb-4', 'Linguine aux Champignons', 'Hand-made, forest mushrooms, truffle', 34, IMG.seafoodPasta, {
        allergens: ['gluten', 'dairy'],
      }),
    ]),
    mkCat('desserts', 'Desserts', 'Succès bien clos', [
      mkItem('nb-5', 'Sorbet aux Pistaches', 'Light and refreshing', 12, IMG.platedDessert, {
        allergens: ['dairy'],
      }),
      mkItem('nb-6', 'Chocolate Mousse', 'Dark chocolate truffle', 10, IMG.chocolateCake, {
        allergens: ['dairy', 'gluten'],
      }),
    ]),
  ],
  defaultDesign: {
    colors: {
      primary: '#0C0A08',
      secondary: '#7A6E5D',
      accent: '#C8A25C',
      background: '#0C0A08',
      text: '#F7EFE4',
      card: '#16110C',
      button: '#C8A25C',
      border: '#3C3328',
    },
    typography: {
      heading: 'playfair',
      body: 'inter',
      menu: 'inter',
      headingScale: 1.08,
      bodyScale: 1.02,
      headingWeight: 600,
      lineHeight: 1.65,
    },
    layout: {
      header: 'minimal',
      hero: 'editorial',
      menuLayout: 'grid',
      card: 'bordered',
      radius: 14,
      spacing: 1,
      aspect: 'square',
      theme: 'dark',
      variant: 'noir-bistro',
    },
    sections: SECTIONS,
  },
  usageCount: 0,
}
