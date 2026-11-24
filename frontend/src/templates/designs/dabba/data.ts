/**
 * Dabba — template definition + sample data.
 * Light monochrome fast-food design: stats hero, food-type tiles, dish cards.
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

export const dabbaDefinition: TemplateDefinition = {
  id: 'dabba',
  name: 'Dabba',
  category: 'Restaurant',
  tagline: 'Real food, made to crave.',
  description:
    'A clean, modern fast-food template: bold black-and-white hero with delivery stats, food-type tiles, and dish cards with ratings and quick add.',
  personality: 'Modern · Fast · Monochrome',
  tags: ['Burgers', 'Fast Food', 'Black', 'Delivery'],
  featured: true,
  chips: ['#F1EFEA', '#0B0B0B', '#FFFFFF'],
  previewImage: IMG.dramaticBurger,
  heroImage: IMG.tableSpread,
  gallery: [IMG.classicBurger, IMG.burgersBoard, IMG.steakFrites, IMG.doubleBurger],
  sample: {
    name: 'Dabba',
    slug: 'dabba',
    tagline: 'Real food, made to crave.',
    description:
      'No dull meals, no waiting too long — just fresh, delicious food made for every craving. Fresh ingredients, bold flavours, satisfying bites delivered straight to your door.',
    logoText: 'D',
    logoStyle: 'badge' as LogoStyle,
    phone: '+1 (212) 555-0199',
    email: 'hello@dabba.demo',
    address: '18 Market Street, New York, NY 10012',
    hours: [
      { day: 'Monday – Sunday', hours: '11:00 – 23:00' },
    ],
    socials: { instagram: '@dabba.demo', facebook: 'dabba.demo', website: 'dabba.example.com' },
  },
  sampleMenu: [
    mkCat('db-burgers', 'Burgers', 'Juicy & fresh', [
      mkItem('db-1', 'Classic Crispy Burger', 'Crispy chicken, lettuce, tomato, house sauce', 6.5, IMG.classicBurger, { featured: true, popular: true }),
      mkItem('db-2', 'Cheese Burger', 'Double cheese, beef patty, pickles', 8, IMG.doubleBurger, { featured: true }),
    ]),
    mkCat('db-fresh', 'Juicy & Fresh', 'Made with care', [
      mkItem('db-3', 'Garden Crunch', 'Fresh greens, tomato, cucumber, light dressing', 7, IMG.saladBowl),
    ]),
    mkCat('db-cheesy', 'Hot & Cheesy', 'Straight from the grill', [
      mkItem('db-4', 'Grilled Cheese Melt', 'Three cheeses, toasted sourdough', 7.5, IMG.dramaticBurger),
    ]),
    mkCat('db-fries', 'Chicken Fries', 'Crispy bites', [
      mkItem('db-5', 'Loaded Fries', 'Fries, cheese sauce, herbs, spicy mayo', 5, IMG.steakFrites, { popular: true }),
    ]),
    mkCat('db-pizza', 'Pizza', 'Available', [
      mkItem('db-6', 'Margherita', 'Tomato, mozzarella, fresh basil', 9, IMG.margherita),
    ]),
    mkCat('db-french', 'French Fries', 'Golden & crisp', [
      mkItem('db-7', 'Classic Fries', 'Sea salt, crispy edges', 4.5, IMG.steakFrites),
    ]),
  ],
  defaultDesign: {
    colors: {
      primary: '#0B0B0B',
      secondary: '#F1EFEA',
      accent: '#0B0B0B',
      background: '#F1EFEA',
      text: '#0B0B0B',
      card: '#FFFFFF',
      button: '#0B0B0B',
      border: '#E4E0DA',
    },
    typography: {
      heading: 'montserrat',
      body: 'inter',
      menu: 'inter',
      headingScale: 1.05,
      bodyScale: 1,
      headingWeight: 700,
      lineHeight: 1.6,
    },
    layout: {
      header: 'split',
      hero: 'split',
      menuLayout: 'grid',
      card: 'elevated',
      radius: 20,
      spacing: 1,
      aspect: 'square',
      theme: 'light',
      variant: 'dabba',
    },
    sections: SECTIONS,
  },
  usageCount: 0,
}
