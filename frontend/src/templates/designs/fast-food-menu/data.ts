/**
 * Fast Food Menu — "Foodie Khan" style: dark near-black canvas, bold yellow
 * accents, app-like delivery UI (search, category chips, popular rail,
 * offer banner, find-us rail).
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

export const fastFoodMenuDefinition: TemplateDefinition = {
  id: 'fast-food-menu',
  name: 'Fast Food Menu',
  category: 'Restaurant',
  tagline: 'Good Food, Good Mood',
  description:
    'Fast Food Menu — a bold dark-and-yellow delivery experience: live search, category chips, a popular rail, a special-offer banner and an app-like checkout flow. Burgers, pizza, pasta, fries, drinks and desserts served fast on your Digital Menu.',
  personality: 'Bold · Appetizing · App-like · Street · Dark & yellow',
  tags: ['burgers', 'pizza', 'fries', 'delivery', 'fast'],
  featured: true,
  chips: ['#FFC627', '#0B0B0C', '#161618'],
  previewImage: IMG.dramaticBurger,
  heroImage: IMG.burgersBoard,
  gallery: [IMG.dramaticBurger, IMG.margherita, IMG.mushroomPasta, IMG.steakFrites, IMG.icedCoffee, IMG.chocolateCake],
  sample: {
    name: 'Foodie Khan',
    slug: 'fast-food-menu',
    tagline: 'Good Food, Good Mood',
    description: 'Hot, fresh and on time — street favourites prepared under our flames.',
    logoText: 'FK',
    logoStyle: 'wordmark' as LogoStyle,
    phone: '+33 1 41 42 43 44',
    email: 'hello@foodiekhan.demo',
    address: '12 Rue de la Fontaine – Paris',
    hours: [
      { day: 'Lundi – Vendredi', hours: '10:00 – 20:00' },
      { day: 'Samedi', hours: '10:00 – 23:00' },
      { day: 'Dimanche', hours: '11:00 – 22:00' },
    ],
    socials: { instagram: '@foodiekhan', facebook: 'foodiekhan', website: 'foodiekhan.demo' },
  },
  sampleMenu: [
    mkCat('burgers', 'Burgers', 'Flame-grilled', [
      mkItem('b1', 'Classic Burger', 'Beef, cheddar, lettuce, tomato, house sauce', 250, IMG.classicBurger, { popular: true }),
      mkItem('b2', 'Double Stack', 'Two patties, double cheddar, crispy onions', 450, IMG.doubleBurger, { featured: true, popular: true }),
    ]),
    mkCat('pizza', 'Pizza', 'Stone-baked', [
      mkItem('p1', 'Chicken Tikka Pizza', 'Tikka chicken, mozzarella, red onion', 650, IMG.margherita, { popular: true }),
      mkItem('p2', 'Pepperoni Passion', 'Pepperoni, extra cheese, oregano', 600, IMG.pizzaSlice),
    ]),
    mkCat('pasta', 'Pasta', 'Fresh & creamy', [
      mkItem('pa1', 'Creamy Mushroom Pasta', 'Penne, wild mushrooms, parmesan cream', 520, IMG.mushroomPasta, { featured: true }),
      mkItem('pa2', 'Seafood Pasta', 'Prawns, mussels, garlic butter', 720, IMG.seafoodPasta),
    ]),
    mkCat('fries', 'Fries', 'Crispy sides', [
      mkItem('f1', 'Masala Fries', 'Crispy fries, masala spice, cheese dip', 180, IMG.steakFrites, { popular: true }),
      mkItem('f2', 'Loaded Cheese Fries', 'Fries, melted cheese, jalapenos', 240, IMG.steakFrites),
    ]),
    mkCat('drinks', 'Drinks', 'Ice cold', [
      mkItem('d1', 'Iced Coffee', 'Double shot, cold milk, ice', 210, IMG.icedCoffee, { popular: true }),
      mkItem('d2', 'Cappuccino', 'Espresso, steamed milk, foam', 190, IMG.cappuccino),
    ]),
    mkCat('desserts', 'Desserts', 'Sweet endings', [
      mkItem('ds1', 'Chocolate Lava Cake', 'Warm molten centre, vanilla scoop', 280, IMG.chocolateCake, { popular: true, featured: true }),
      mkItem('ds2', 'Rainbow Cupcakes', 'Vanilla sponge, buttercream swirl', 150, IMG.cupcakes),
    ]),
  ],
  defaultDesign: {
    colors: {
      primary: '#FFC627',
      secondary: '#FFC627',
      accent: '#FFC627',
      background: '#0B0B0C',
      text: '#FFFFFF',
      card: '#161618',
      button: '#FFC627',
      border: '#262629',
    },
    typography: {
      heading: 'montserrat',
      body: 'poppins',
      menu: 'poppins',
      headingScale: 1.05,
      bodyScale: 1,
      headingWeight: 800,
      lineHeight: 1.45,
    },
    layout: {
      header: 'minimal',
      hero: 'fullscreen',
      menuLayout: 'list',
      card: 'elevated',
      radius: 18,
      spacing: 1,
      aspect: 'landscape',
      theme: 'dark',
      variant: 'fast-food-menu',
    },
    sections: SECTIONS,
  },
  usageCount: 0,
}
