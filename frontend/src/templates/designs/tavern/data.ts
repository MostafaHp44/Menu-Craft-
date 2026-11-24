/**
 * Tavern — Neo-Brutalist Deli / Diner template.
 *
 * The menu as a bold printed price board: bone canvas, cobalt + tomato +
 * mustard blocks, heavy ink borders, hard offset shadows, condensed uppercase
 * grotesque headlines and monospaced prices. No hero photograph: typography
 * leads, photography supports in hard frames.
 *
 * Structure: TemplateDefinition (id, name, category, tagline, description,
 * personality, tags, chips, previewImage, heroImage, gallery, sample,
 * sampleMenu, defaultDesign).
 */
import type { LogoStyle, MenuCategory, MenuItem, SectionState, TemplateDefinition } from '../../../shared/lib/types.ts'
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

export const tavernDefinition: TemplateDefinition = {
  id: 'tavern',
  name: 'Tavern',
  category: 'Restaurant',
  tagline: 'Good food. No fuss.',
  description:
    'Tavern is a neo-brutalist deli and diner: bone-white paper, cobalt and tomato colour blocks, heavy ink rules, hard shadows and monospaced prices. Smash burgers, stacked sandwiches, loaded sides and cold shakes — built for a menu that reads like a printed price board.',
  personality: 'Neo-brutalist · Deli · Diner · Bold · Playful',
  tags: ['burgers', 'sandwiches', 'deli', 'fries', 'shakes'],
  featured: true,
  chips: ['#F4F1EA', '#1B3AFF', '#FF4D2E'],
  previewImage: IMG.dramaticBurger,
  heroImage: IMG.doubleBurger,
  gallery: [IMG.doubleBurger, IMG.deliSandwich, IMG.burgersBoard, IMG.ribs, IMG.icedCoffee, IMG.chocolateCake],
  sample: {
    name: 'Tavern',
    slug: 'tavern',
    tagline: 'Good food. No fuss.',
    description: 'A neighbourhood deli & diner. Smash burgers, stacked sandwiches and cold shakes — made fresh, served fast.',
    logoText: 'T',
    logoStyle: 'monogram' as LogoStyle,
    phone: '+1 718 555 0142',
    email: 'hello@tavern.demo',
    address: '48 Market Row, Brooklyn, NY',
    hours: [
      { day: 'Mon – Thu', hours: '11:00 – 23:00' },
      { day: 'Fri – Sat', hours: '11:00 – 01:00' },
      { day: 'Sunday', hours: '12:00 – 22:00' },
    ],
    socials: { instagram: '@tavern.deli', facebook: 'tavern.deli', website: 'tavern.demo' },
  },
  sampleMenu: [
    mkCat('smash', 'Smash & Stack', 'Griddled to order', [
      mkItem('tv-1', 'Double Stack', 'Two smashed patties, American cheese, pickles, house sauce.', 12, IMG.doubleBurger, { featured: true, popular: true }),
      mkItem('tv-2', 'Classic Smash', 'Single patty, onion, cheese, mustard, soft bun.', 9, IMG.classicBurger),
      mkItem('tv-3', 'Bacon Blue', 'Double patty, blue cheese, crispy bacon, black pepper.', 13.5, IMG.dramaticBurger, { popular: true, isSpicy: true }),
      mkItem('tv-4', 'Veggie Smash', 'Charred veg patty, avocado, tomato, herb mayo.', 10, IMG.healthyPlate, { isVeg: true }),
    ]),
    mkCat('sandwiches', 'Sandwiches', 'On house sourdough', [
      mkItem('tv-5', 'Pastrami on Rye', 'Slow-cooked pastrami, mustard, pickles, rye bread.', 11, IMG.deliSandwich, { featured: true }),
      mkItem('tv-6', 'Chicken Club', 'Grilled chicken, bacon, lettuce, tomato, aioli.', 10.5, IMG.deliSandwich),
      mkItem('tv-7', 'Grilled Cheese', 'Three cheeses, buttered sourdough, tomato jam.', 8, IMG.artisanBread, { isVeg: true }),
    ]),
    mkCat('sides', 'Sides', 'Share, or don’t', [
      mkItem('tv-8', 'Loaded Fries', 'Skin-on fries, cheese sauce, jalapeño, spring onion.', 7, IMG.burgersBoard, { popular: true, isSpicy: true }),
      mkItem('tv-9', 'Mac & Cheese', 'Three-cheese mac, toasted crumb, chives.', 6.5, IMG.mushroomPasta, { isVeg: true }),
      mkItem('tv-10', 'Chili Bowl', 'Slow beef chili, sour cream, cheddar, coriander.', 8, IMG.soupBowl),
      mkItem('tv-11', 'House Slaw', 'Cabbage, carrot, apple, buttermilk dressing.', 5, IMG.saladBowl, { isVeg: true }),
    ]),
    mkCat('drinks', 'Shakes & Soda', 'Cold and loud', [
      mkItem('tv-12', 'Vanilla Shake', 'Thick vanilla shake, whipped cream, cherry.', 6, IMG.icedCoffee, { popular: true }),
      mkItem('tv-13', 'Iced Latte', 'Double espresso, cold milk, over ice.', 4.5, IMG.cappuccino),
      mkItem('tv-14', 'House Lemonade', 'Pressed lemons, mint, cane sugar.', 4, IMG.pourOver, { isVeg: true }),
    ]),
    mkCat('sweet', 'Sweet', 'One more bite', [
      mkItem('tv-15', 'Apple Pie', 'Warm spiced apple, flaky crust, vanilla cream.', 5, IMG.cookies, { isVeg: true }),
      mkItem('tv-16', 'Chocolate Brownie', 'Fudgy centre, sea salt, toasted walnut.', 5.5, IMG.chocolateCake, { featured: true, isVeg: true }),
      mkItem('tv-17', 'Soft Serve', 'Vanilla soft serve, chocolate dip.', 4, IMG.cupcakes, { isVeg: true }),
    ]),
  ],
  defaultDesign: {
    colors: {
      primary: '#1B3AFF',
      secondary: '#FF4D2E',
      accent: '#FFD23F',
      background: '#F4F1EA',
      text: '#0D0D0D',
      card: '#FFFFFF',
      button: '#0D0D0D',
      border: '#0D0D0D',
    },
    typography: {
      heading: 'montserrat',
      body: 'inter',
      menu: 'montserrat',
      headingScale: 1.04,
      bodyScale: 1,
      headingWeight: 800,
      lineHeight: 1.5,
    },
    layout: {
      header: 'split',
      hero: 'editorial',
      menuLayout: 'list',
      card: 'bordered',
      radius: 4,
      spacing: 1,
      aspect: 'square',
      theme: 'light',
      variant: 'tavern',
    },
    sections: SECTIONS,
  },
  usageCount: 0,
}
