/**
 * Aurum Lounge — template definition + sample data for the dedicated
 * 'aurum' variant renderer (templates/designs/aurum/index.tsx).
 *
 * Structure for every stock template: a TemplateDefinition with a
 * dark-and-gold restaurant palette (primary/background #0B0B0D, card
 * #151518, text #F4F1EA, secondary #A8A397, accent #E6C25A) and a
 * self-contained sample menu with categories + items carrying real
 * price, image, timing and dietary data.
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

export const aurumLoungeDefinition: TemplateDefinition = {
  id: 'aurum-lounge',
  name: 'Aurum Lounge',
  category: 'Fine Dining',
  tagline: 'Dark Knights, Gold, Calm Moments',
  description:
    'Aurum Lounge: dark forces, gold, and quiet moments. Chef\'s cuts, seafood, steak, and dessert menus with real price and kcal data on artwork.',
  personality: 'Dark · Gold · Elegant · Fine Dining',
  tags: ['Steak', 'Seafood', 'Pasta', 'Gold'],
  featured: true,
  chips: ['#0B0B0D', '#E6C25A', '#151518'],
  previewImage: IMG.diningRoomDark,
  heroImage: IMG.diningRoomDark,
  gallery: [IMG.diningRoomDark, IMG.steakFrites, IMG.slicedSteak, IMG.platedDessert],
  sample: {
    name: 'Aurum Lounge',
    slug: 'aurum-lounge',
    tagline: 'Fine dining & artisanal cuisine, Mayfair, London',
    description:
      'A lounge in the dark. Gold, minimalism, and candlelight. Chef\'s cuts, seafood, and a dessert menu with prices.',
    logoText: 'A',
    logoStyle: 'badge' as LogoStyle,
    phone: '+44 20 7946 0000',
    email: 'reservations@aurum.demo',
    address: '12 Mayfair Street, London W1J 8QN',
    hours: [
      { day: 'Monday – Thursday', hours: '12:00 – 23:30' },
      { day: 'Friday – Saturday', hours: '12:00 – 01:00' },
      { day: 'Sunday', hours: '13:00 – 22:00' },
    ],
    socials: { instagram: '@aurum.demo', facebook: 'aurum.demo', website: 'aurum.example.com' },
  },
  sampleMenu: [
    mkCat('starters', 'Starters', 'Let the taste settle', [
      mkItem(
        'a-1',
        'Seared Scallops',
        'Hand-dived scallops, pea puree, pancetta crisps, lemon butter',
        17,
        IMG.saladBowl,
        { allergens: ['shellfish'] },
      ),
      mkItem(
        'a-2',
        'Burrata & Heirloom Tomato',
        'Creamy burrata, heirloom tomatoes, basil oil, aged balsamic',
        14,
        IMG.saladPlate,
        { featured: true, isVeg: true, isGf: true, allergens: ['dairy'] },
      ),
      mkItem(
        'a-3',
        'Beef Tartare',
        'Hand-cut fillet, capers, cornichons, egg yolk, toasted sourdough',
        16,
        IMG.healthyPlate,
        { isSpicy: true, allergens: ['dairy', 'egg'] },
      ),
    ]),
    mkCat('prime-steaks', 'Prime Steaks', 'Dry-aged, slow, taste of gold', [
      mkItem(
        'a-4',
        'Wagyu Beef Ribeye 10 oz',
        'Grade A5 Wagyu, bone marrow, garlic butter, black truffle jus',
        38,
        IMG.steakFrites,
        { featured: true, allergens: ['beef', 'gluten', 'dairy'] },
      ),
      mkItem(
        'a-5',
        'Fillet Mignon 8 oz',
        'Aged Scottish fillet, peppercorn sauce, triple-cooked chips, charred shallots',
        34,
        IMG.slicedSteak,
        { allergens: ['beef', 'gluten', 'dairy'] },
      ),
      mkItem(
        'a-6',
        'Ribs & Grilled Meat',
        'Slow-roasted ribs with rusty glaze, charred marrow, cucumber broth',
        29,
        IMG.grilledMeat,
        { allergens: ['beef'] },
      ),
    ]),
    mkCat('mains', 'Mains & Pasta', 'Simple as it gets, whenever we make it', [
      mkItem(
        'a-7',
        'Truffle & Wild Mushroom Pasta',
        'Handmade tagliatelle, forest mushrooms, shaved black truffle, aged Parmesan cream',
        22,
        IMG.mushroomPasta,
        { isVeg: true, allergens: ['gluten', 'dairy'] },
      ),
      mkItem(
        'a-8',
        'Lobster Linguine',
        'Half Cornish lobster, cherry tomato, chilli, white wine, fresh basil',
        29,
        IMG.seafoodPasta,
        { allergens: ['shellfish', 'gluten', 'dairy', 'egg'] },
      ),
    ]),
    mkCat('desserts', 'Desserts', 'A sweet close to a perfect night', [
      mkItem(
        'a-9',
        'Dark Chocolate Fondant',
        '70% dark chocolate, molten centre, raspberry sorbet',
        10,
        IMG.platedDessert,
        { allergens: ['dairy', 'egg', 'gluten'] },
      ),
      mkItem(
        'a-10',
        'Sticky Toffee Pudding',
        'Warm date sponge, salted toffee sauce, Madagascan vanilla ice cream',
        9,
        IMG.chocolateCake,
        { allergens: ['dairy', 'egg', 'gluten'] },
      ),
    ]),
  ],
  defaultDesign: {
    colors: {
      primary: '#0B0B0D',
      secondary: '#A8A397',
      accent: '#E6C25A',
      background: '#0B0B0D',
      text: '#F4F1EA',
      card: '#151518',
      button: '#E6C25A',
      border: '#26262B',
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
      hero: 'magazine',
      menuLayout: 'grid',
      card: 'bordered',
      radius: 16,
      spacing: 2,
      aspect: 'square',
      theme: 'dark',
      variant: 'aurum',
    },
    sections: SECTIONS,
  },
  usageCount: 0,
}
