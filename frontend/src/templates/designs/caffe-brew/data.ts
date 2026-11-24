/**
 * BREWNI — template definition + sample data, matched to the reference image:
 * deep green, paper white, amber, coral CTA; product grid + order cards.
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

export const caffeBrewDefinition: TemplateDefinition = {
  id: 'caffe-brew',
  name: 'BREWNI Coffee Shop',
  category: 'Coffee',
  tagline: 'Coffee Shop Template',
  description: 'Stylish coffee-shop template: deep green hero with polaroid photos, paper-white product grid, and a green order menu with add-to-cart cards.',
  personality: 'Stylish · Craft · Coffee',
  tags: ['Coffee', 'Cafe', 'Pastry', 'Amber'],
  featured: true,
  chips: ['#031106', '#D18B34', '#F3F3F3'],
  previewImage: IMG.cafeInterior,
  heroImage: IMG.cafeInterior,
  gallery: [IMG.cafeInterior, IMG.cappuccino, IMG.latteHands, IMG.icedCoffee],
  sample: {
    name: 'BREWNI',
    slug: 'brewni',
    tagline: 'Coffee Shop Template',
    description: 'Start your day right with freshly brewed coffee. Small-batch beans, careful hands, and a corner table with your name on it.',
    logoText: 'B',
    logoStyle: 'wordmark' as LogoStyle,
    phone: '+44 20 7946 1212',
    email: 'hello@brewni.demo',
    address: '18 Bean Street, London EC1A 1AA',
    hours: [
      { day: 'Monday – Friday', hours: '07:00 – 19:00' },
      { day: 'Saturday – Sunday', hours: '08:00 – 20:00' },
    ],
    socials: { instagram: '@brewni.demo', facebook: 'brewni.demo', website: 'brewni.example.com' },
  },
  sampleMenu: [
    mkCat('cb-espresso', 'Espresso', 'Coffee Category', [
      mkItem('cb-1', 'Espresso', 'Rich, bold and freshly extracted. Pure intensity in every concentrated shot.', 35, IMG.coffeeBeans, { featured: true, popular: true }),
      mkItem('cb-2', 'Americano', 'Espresso softened with hot water — long, clean and honest.', 30, IMG.pourOver),
    ]),
    mkCat('cb-italian', 'Italian', 'Your Menu', [
      mkItem('cb-3', 'Caramel Latte', 'Silky steamed milk with caramel sweetness. A creamy delight in every moment.', 40, IMG.latteHands, { featured: true }),
      mkItem('cb-4', 'Macchiato', 'Espresso marked with a spoon of milk foam — sharp and elegant.', 38, IMG.cappuccino),
      mkItem('cb-5', 'Cappuccino', 'Espresso, steamed milk and a cloud of velvet foam.', 35, IMG.cappuccino),
    ]),
    mkCat('cb-drinks', 'Drinks', 'Coffee Category', [
      mkItem('cb-6', 'Mocha Bliss', 'Chocolate and espresso in perfect harmony. Smooth, sweet and deeply satisfying.', 30, IMG.icedCoffee, { featured: true }),
      mkItem('cb-7', 'Iced Coffee', 'Cold brew over ice — bright, refreshing and slow-steeped.', 32, IMG.icedCoffee),
      mkItem('cb-8', 'Flat White', 'Ristretto with silky microfoam, finished by hand.', 36, IMG.cappuccino),
    ]),
  ],
  defaultDesign: {
    colors: {
      primary: '#031106',
      secondary: '#0B5D43',
      accent: '#D18B34',
      background: '#031106',
      text: '#F3F3F3',
      card: '#F3F3F3',
      button: '#D18B34',
      border: '#565943',
    },
    typography: {
      heading: 'montserrat',
      body: 'inter',
      menu: 'montserrat',
      headingScale: 1.05,
      bodyScale: 1,
      headingWeight: 700,
      lineHeight: 1.6,
    },
    layout: {
      header: 'split',
      hero: 'fullscreen',
      menuLayout: 'grid',
      card: 'bordered',
      radius: 12,
      spacing: 1,
      aspect: 'square',
      theme: 'dark',
      variant: 'caffe-brew',
    },
    sections: SECTIONS,
  },
  usageCount: 0,
}
