/**
 * Desserts Menu — "ДОЛЬЧЕ" style: organic editorial dessert menu.
 * Cream canvas + olive organic blob, elegant serif typography, dark round
 * plates, line pictograms and soft botanical details.
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

export const dessertsMenuDefinition: TemplateDefinition = {
  id: 'desserts-menu',
  name: 'Desserts Menu',
  category: 'Dessert',
  tagline: 'Desserts made with soul',
  description:
    'Desserts Menu — an organic editorial dessert experience: warm cream canvas, olive organic shapes, elegant serif typography and dark round plates. Cheesecakes, fondants, tiramisu, gelato and macarons on your Digital Menu.',
  personality: 'Organic · Elegant · Warm · Editorial · Cream & olive',
  tags: ['desserts', 'cake', 'tiramisu', 'macarons', 'ice cream'],
  featured: false,
  chips: ['#5E6B43', '#F1ECDF', '#2B2B26'],
  previewImage: IMG.platedDessert,
  heroImage: IMG.chocolateCake,
  gallery: [IMG.platedDessert, IMG.chocolateCake, IMG.cookies, IMG.cupcakes, IMG.rainbowCake, IMG.pancakes],
  sample: {
    name: 'Dolce',
    slug: 'desserts-menu',
    tagline: 'Desserts made with soul',
    description: 'Small-batch desserts, baked fresh every morning with natural ingredients.',
    logoText: 'D',
    logoStyle: 'wordmark' as LogoStyle,
    phone: '+33 1 42 43 44 55',
    email: 'hello@dolce.demo',
    address: '7 Rue des Gourmands – Paris',
    hours: [
      { day: 'Monday – Friday', hours: '9:00 – 19:00' },
      { day: 'Saturday', hours: '9:00 – 20:00' },
      { day: 'Sunday', hours: '10:00 – 18:00' },
    ],
    socials: { instagram: '@dolce.desserts', facebook: 'dolce.desserts', website: 'dolce.demo' },
  },
  sampleMenu: [
    mkCat('signature', 'Signature desserts', 'Baked daily', [
      mkItem('d1', 'Berry Cheesecake', 'Silky cream cheese on a shortbread base with berry compote.', 390, IMG.platedDessert, { featured: true, popular: true }),
      mkItem('d2', 'Chocolate Fondant', 'Warm dark chocolate cake with a molten centre, served with berries.', 350, IMG.chocolateCake, { popular: true }),
      mkItem('d3', 'Tiramisu', 'Classic Italian dessert with mascarpone and aromatic coffee.', 360, IMG.cookies),
      mkItem('d4', 'Panna Cotta', 'Delicate cream with vanilla and berry sauce.', 320, IMG.cupcakes),
    ]),
    mkCat('gelato', 'Ice cream', 'House-churned', [
      mkItem('d5', 'Gelato Trio', 'Three scoops of your choice: vanilla, strawberry, pistachio or chocolate.', 280, IMG.rainbowCake),
    ]),
    mkCat('macarons', 'Macarons', 'Airy & delicate', [
      mkItem('d6', 'Macaron Assortment', 'Airy almond macarons with a delicate filling. Assorted flavours.', 250, IMG.cupcakes),
    ]),
    mkCat('extras', 'Add to your dessert', 'Little extras', [
      mkItem('e1', 'Chocolate sauce', '', 50, ''),
      mkItem('e2', 'Caramel sauce', '', 50, ''),
      mkItem('e3', 'Whipped cream', '', 50, ''),
      mkItem('e4', 'Fresh berries', '', 80, ''),
    ]),
  ],
  defaultDesign: {
    colors: {
      primary: '#5E6B43',
      secondary: '#8A9468',
      accent: '#5E6B43',
      background: '#F1ECDF',
      text: '#2B2B26',
      card: '#F9F5EA',
      button: '#5E6B43',
      border: '#D9D2BE',
    },
    typography: {
      heading: 'playfair',
      body: 'dm-sans',
      menu: 'playfair',
      headingScale: 1.06,
      bodyScale: 1,
      headingWeight: 600,
      lineHeight: 1.5,
    },
    layout: {
      header: 'minimal',
      hero: 'editorial',
      menuLayout: 'list',
      card: 'flat',
      radius: 20,
      spacing: 2,
      aspect: 'square',
      theme: 'light',
      variant: 'desserts-menu',
    },
    sections: SECTIONS,
  },
  usageCount: 0,
}
