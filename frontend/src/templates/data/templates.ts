import type {
  ColorSet,
  DesignConfiguration,
  LayoutConfig,
  MenuCategory,
  MenuItem,
  OpeningHour,
  SectionId,
  SectionState,
  TemplateCategory,
  TemplateDefinition,
  TypographyConfig,
} from '../../shared/lib/types.ts'
import { IMG } from '../../shared/lib/images.ts'

/* ------------------------------------------------------------------ *
 * Design construction helpers â€” every template is assembled from the
 * same building blocks so the renderer stays generic.
 * ------------------------------------------------------------------ */

const BASE: DesignConfiguration = {
  colors: {
    primary: '#1B1714',
    secondary: '#7D7263',
    accent: '#E8571F',
    background: '#FAF7F1',
    text: '#1B1714',
    card: '#FFFFFF',
    button: '#1B1714',
  },
  typography: {
    heading: 'playfair',
    body: 'inter',
    menu: 'inter',
    headingScale: 1,
    bodyScale: 1,
    headingWeight: 600,
    lineHeight: 1.65,
  },
  layout: {
    header: 'split',
    hero: 'editorial',
    menuLayout: 'grid',
    card: 'bordered',
    radius: 14,
    spacing: 1,
    aspect: 'landscape',
    theme: 'light',
  },
  sections: [],
}

const SECTION_ORDER: SectionId[] = ['featured', 'menu', 'about', 'gallery', 'hours', 'contact']

function makeSections(): SectionState[] {
  return SECTION_ORDER.map((id) => ({ id, enabled: true }))
}

function makeDesign(over: {
  colors?: Partial<ColorSet>
  typography?: Partial<TypographyConfig>
  layout?: Partial<LayoutConfig>
}): DesignConfiguration {
  // keep variant aligned with layout override
  return {
    colors: { ...BASE.colors, ...over.colors },
    typography: { ...BASE.typography, ...over.typography },
    layout: { ...BASE.layout, ...over.layout },
    sections: makeSections(),
  }
}

let seedCounter = 0
function item(
  name: string,
  description: string,
  price: number,
  image: string,
  extra: Partial<MenuItem> = {}
): MenuItem {
  seedCounter += 1
  return {
    id: `seed-item-${seedCounter}`,
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

let catCounter = 0
function category(name: string, note: string, items: MenuItem[]): MenuCategory {
  catCounter += 1
  return { id: `seed-cat-${catCounter}`, name, note, items }
}

const DEFAULT_HOURS: OpeningHour[] = [
  { day: 'Monday', hours: 'Closed' },
  { day: 'Tuesday â€“ Thursday', hours: '17:00 â€“ 23:00' },
  { day: 'Friday â€“ Saturday', hours: '17:00 â€“ 00:00' },
  { day: 'Sunday', hours: '17:00 â€“ 22:00' },
]

const CAFE_HOURS: OpeningHour[] = [
  { day: 'Monday â€“ Friday', hours: '07:00 â€“ 18:00' },
  { day: 'Saturday', hours: '08:00 â€“ 18:00' },
  { day: 'Sunday', hours: '08:00 â€“ 16:00' },
]

const BAKERY_HOURS: OpeningHour[] = [
  { day: 'Tuesday â€“ Friday', hours: '07:00 â€“ 19:00' },
  { day: 'Saturday â€“ Sunday', hours: '08:00 â€“ 18:00' },
  { day: 'Monday', hours: 'Closed' },
]

/* ------------------------------------------------------------------ *
 * The eight template definitions
 * ------------------------------------------------------------------ */

export const TEMPLATES: TemplateDefinition[] = [
  /* ---------------------------------------------------------- 1 ---- */
  {
    id: 'the-royal',
    name: 'The Royal',
    category: 'Fine Dining',
    tagline: 'A tasting menu in seven quiet movements.',
    description:
      'A dark, cinematic template for restaurants that sell an evening rather than a meal. Editorial serif headlines, gold detail work and a menu list built for wine-paired storytelling.',
    personality: 'Luxe Â· Dark Â· Editorial',
    tags: ['Dark', 'Serif', 'Tasting menu'],
    featured: true,
    chips: ['#14110F', '#C6A15B', '#F3ECE1'],
    previewImage: IMG.fineDiningPlate,
    heroImage: IMG.diningRoomDark,
    gallery: [IMG.fineDiningPlate, IMG.slicedSteak, IMG.platedDessert, IMG.classicDiningRoom],
    sample: {
      name: 'The Royal',
      slug: 'royal',
      tagline: 'A tasting menu in seven quiet movements.',
      description:
        'Since 1998, The Royal has served a single seasonal menu in a room built for conversation. Seven courses, one long evening, no rush.',
      logoText: 'R',
      logoStyle: 'monogram',
      phone: '+1 (415) 555-0142',
      email: 'reserve@theroyal.demo',
      address: '44 Grand Avenue, San Francisco, CA',
      hours: DEFAULT_HOURS,
      socials: { instagram: '@theroyal', facebook: 'theroyal', website: 'theroyal.example.com' },
    },
    sampleMenu: [
      category('Overture', 'First bites and cold openings', [
        item('Hand Dived Scallop', 'Brown butter, cauliflower, caviar', 26, IMG.fineDiningPlate, {
          featured: true,
        }),
        item('Heritage Beetroot', 'ChÃ¨vre, walnut, aged balsamic', 18, IMG.saladPlate),
        item('VeloutÃ© of Celeriac', 'Truffle, chive oil, crÃ¨me fraÃ®che', 16, IMG.soupBowl, {
          popular: true,
        }),
      ]),
      category('Principal', 'From the fire, carved to order', [
        item('45-Day Aged Ribeye', 'Bone marrow, watercress, triple cooked chips', 62, IMG.slicedSteak, {
          featured: true,
          popular: true,
        }),
        item('Slow Cooked Lamb Shoulder', 'White bean, rosemary jus, salsa verde', 44, IMG.ribs),
        item('Herb Crusted Pork', 'Apple, mustard seed, fondant potato', 40, IMG.porkPlate),
      ]),
      category('Garden', 'Vegetable plates from our growers', [
        item('Charred Hispi Cabbage', 'Anchovy butter, breadcrumb, lemon', 22, IMG.saladBowl),
        item('Garden Leaf Salad', 'Herbs, shallot, champagne dressing', 15, IMG.saladPlate),
        item('Heirloom Tomato', 'Stracciatella, basil oil, sea salt', 21, IMG.healthyPlate),
      ]),
      category('Finale', 'Desserts and petit fours', [
        item('Salted Caramel Custard', 'Toasted honey, crÃ¨me double', 14, IMG.platedDessert, {
          popular: true,
        }),
        item('Dark Chocolate Marquise', 'Malt, sour cherry, vanilla cream', 15, IMG.chocolateCake, {
          featured: true,
        }),
        item('Petits Fours', 'Two of each, with coffee', 11, IMG.cookies),
      ]),
    ],
    defaultDesign: makeDesign({
      colors: {
        primary: '#C6A15B',
        secondary: '#8A7A5E',
        accent: '#C6A15B',
        background: '#14110F',
        text: '#F3ECE1',
        card: '#1E1A16',
        button: '#C6A15B',
      },
      typography: {
        heading: 'playfair',
        body: 'inter',
        menu: 'lora',
        headingScale: 1.08,
        bodyScale: 1,
        headingWeight: 500,
        lineHeight: 1.75,
      },
      layout: {
        header: 'centered',
        hero: 'fullscreen',
        menuLayout: 'list',
        card: 'flat',
        radius: 4,
        spacing: 2,
        aspect: 'landscape',
        theme: 'dark',
      },
    }),
    usageCount: 312,
  },

  /* ---------------------------------------------------------- 2 ---- */
  {
    id: 'urban-cafe',
    name: 'Urban Cafe',
    category: 'Cafe',
    tagline: 'All-day coffee, loud type, easy mornings.',
    description:
      'A confident city-cafÃ© template with a split hero, oversized sans headlines and a square menu grid that photographs beautifully on mobile.',
    personality: 'Modern Â· Bold Â· Graphic',
    tags: ['Bold', 'Sans serif', 'Day menu'],
    featured: true,
    chips: ['#17150F', '#E8571F', '#F7F5F2'],
    previewImage: IMG.cafeBright,
    heroImage: IMG.cafeBright,
    gallery: [IMG.cafeBright, IMG.latteHands, IMG.avocadoToast, IMG.cafeInterior],
    sample: {
      name: 'Urban Cafe',
      slug: 'urbancafe',
      tagline: 'All-day coffee, loud type, easy mornings.',
      description:
        'A corner cafÃ© serving single-origin espresso, slow ferments and a short all-day kitchen menu. Dogs welcome, laptops until noon.',
      logoText: 'UC',
      logoStyle: 'monogram',
      phone: '+1 (212) 555-0177',
      email: 'hey@urbancafe.demo',
      address: '9 Bond Street, New York, NY',
      hours: CAFE_HOURS,
      socials: { instagram: '@urbancafe', facebook: 'urbancafe', website: 'urban.example.com' },
    },
    sampleMenu: [
      category('Coffee', 'Espresso, filter, cold', [
        item('Flat White', 'Double ristretto, silk milk', 4.5, IMG.cappuccino, { popular: true }),
        item('House Latte', '12h cold steep, no bitterness', 5, IMG.latteHands, { featured: true }),
        item('Nitro Cold Brew', 'Cascading, on tap', 5.5, IMG.icedCoffee),
      ]),
      category('Brunch', 'Served until 15:00', [
        item('Smashed Avo', 'Sourdough, chilli, poached egg', 13.5, IMG.avocadoToast, {
          featured: true,
          popular: true,
        }),
        item('Banana Brioche French Toast', 'Maple, mascarpone, berries', 12, IMG.frenchToast),
        item('Buttermilk Stack', 'Berry compote, whipped honey butter', 11.5, IMG.pancakes),
      ]),
      category('Lunch', 'Kitchen closes 16:00', [
        item('The Bond Sandwich', 'Roast chicken, aioli, pickles', 12.5, IMG.deliSandwich),
        item('Green Goddess Bowl', 'Grains, avocado, seeds, herbs', 14, IMG.saladBowl),
        item('Pesto Penne', 'Basil, pine nut, pecorino', 13, IMG.pastaSalad),
      ]),
      category('Sweet', 'Baked here each morning', [
        item('Brown Butter Cookie', 'Sea salt, dark chocolate', 3.8, IMG.cookies, { popular: true }),
        item('Vanilla Cupcake', 'Vanilla bean buttercream', 4.2, IMG.cupcakes),
        item('Fudge Slice', 'Single origin, 70%', 5.5, IMG.chocolateCake),
      ]),
    ],
    defaultDesign: makeDesign({
      colors: {
        primary: '#17150F',
        secondary: '#6B665C',
        accent: '#E8571F',
        background: '#F7F5F2',
        text: '#17150F',
        card: '#FFFFFF',
        button: '#E8571F',
      },
      typography: {
        heading: 'montserrat',
        body: 'inter',
        menu: 'inter',
        headingScale: 1.04,
        bodyScale: 1.02,
        headingWeight: 700,
        lineHeight: 1.55,
      },
      layout: {
        header: 'split',
        hero: 'split',
        menuLayout: 'grid',
        card: 'bordered',
        radius: 8,
        spacing: 1,
        aspect: 'square',
        theme: 'light',
      },
    }),
    usageCount: 486,
  },

  /* ---------------------------------------------------------- 3 ---- */
  {
    id: 'sweet-atelier',
    name: 'Sweet Atelier',
    category: 'Bakery',
    tagline: 'Butter, flour, patience â€” baked before sunrise.',
    description:
      'A romantic bakery template with editorial hero composition, portrait imagery and soft elevated cards. Perfect for pastry counters and pre-order collections.',
    personality: 'Romantic Â· Soft Â· Artisan',
    tags: ['Warm', 'Serif', 'Portrait imagery'],
    featured: true,
    chips: ['#A05C4B', '#C2703F', '#FBF4EF'],
    previewImage: IMG.chocolateCake,
    heroImage: IMG.cafeWindow,
    gallery: [IMG.chocolateCake, IMG.artisanBread, IMG.cupcakes, IMG.cafeWindow],
    sample: {
      name: 'Sweet Atelier',
      slug: 'atelier',
      tagline: 'Butter, flour, patience â€” baked before sunrise.',
      description:
        'A small atelier baking laminated pastries, layer cakes and naturally leavened bread every morning. Pre-orders close at 18:00 the day before.',
      logoText: 'SA',
      logoStyle: 'badge',
      phone: '+1 (503) 555-0119',
      email: 'bonjour@sweetatelier.demo',
      address: '210 Alder Lane, Portland, OR',
      hours: BAKERY_HOURS,
      socials: {
        instagram: '@sweetatelier',
        facebook: 'sweetatelier',
        website: 'atelier.example.com',
      },
    },
    sampleMenu: [
      category('Viennoiserie', 'Laminated at 4am, baked at 6am', [
        item('Croissant au Beurre', '72-hour lamination, Isigny butter', 4.5, IMG.frenchToast, {
          popular: true,
        }),
        item('Morning Bun', 'Cardamom sugar, orange zest', 5, IMG.pancakes),
        item('Seeded Sourdough', 'Sunflower, flax, sea salt', 8, IMG.artisanBread, {
          featured: true,
        }),
      ]),
      category('Cakes', 'Whole cakes need 48 hours notice', [
        item('Chocolate Fudge Gateau', 'Dark ganache, sea salt caramel', 42, IMG.chocolateCake, {
          featured: true,
          popular: true,
        }),
        item('Celebration Layer', 'Six layers, vanilla bean', 46, IMG.rainbowCake),
        item('Atelier Cupcakes', 'Box of six, seasonal frosting', 21, IMG.cupcakes),
      ]),
      category('Counter', 'By the piece, while they last', [
        item('Salted Caramel Choux', 'Craquelin, burnt caramel', 6.5, IMG.platedDessert),
        item('Brown Butter Cookie', 'Dark chocolate, Maldon salt', 3.8, IMG.cookies),
        item('Fudge Brownie', 'Walnut, single origin', 4.5, IMG.cookies),
      ]),
      category('To Drink', 'From the counter bar', [
        item('Flat White', 'Silk milk, house blend', 4.5, IMG.cappuccino),
        item('Iced Latte', 'Slow steep, 12 hours', 5, IMG.icedCoffee),
        item('Filter of the Day', 'Rotating single origin', 4, IMG.pourOver),
      ]),
    ],
    defaultDesign: makeDesign({
      colors: {
        primary: '#A05C4B',
        secondary: '#8A6A5C',
        accent: '#C2703F',
        background: '#FBF4EF',
        text: '#2B1D18',
        card: '#FFFFFF',
        button: '#A05C4B',
      },
      typography: {
        heading: 'playfair',
        body: 'dm-sans',
        menu: 'lora',
        headingScale: 1.06,
        bodyScale: 1.04,
        headingWeight: 500,
        lineHeight: 1.7,
      },
      layout: {
        header: 'centered',
        hero: 'editorial',
        menuLayout: 'grid',
        card: 'elevated',
        radius: 18,
        spacing: 2,
        aspect: 'portrait',
        theme: 'warm',
      },
    }),
    usageCount: 374,
  },

  /* ---------------------------------------------------------- 4 ---- */
  {
    id: 'burger-district',
    name: 'Burger District',
    category: 'Restaurant',
    tagline: 'Smashed daily. Stack it high. Napkins included.',
    description:
      'Street-food energy: near-black surfaces, electric yellow accents, condensed headlines and a hero that fills the screen before anyone reads a word.',
    personality: 'Punchy Â· Loud Â· Street',
    tags: ['Dark', 'Condensed', 'Fast service'],
    featured: false,
    chips: ['#0F0F0F', '#F2C230', '#F5F2EC'],
    previewImage: IMG.doubleBurger,
    heroImage: IMG.burgersBoard,
    gallery: [IMG.doubleBurger, IMG.classicBurger, IMG.dramaticBurger, IMG.deliSandwich],
    sample: {
      name: 'Burger District',
      slug: 'district',
      tagline: 'Smashed daily. Stack it high. Napkins included.',
      description:
        'Grass-fed patties smashed to order on a flat-top, potato buns baked down the street and shakes thick enough to need a spoon.',
      logoText: 'BD',
      logoStyle: 'wordmark',
      phone: '+1 (312) 555-0166',
      email: 'yo@burgerdistrict.demo',
      address: '78 Market Row, Chicago, IL',
      hours: [
        { day: 'Monday â€“ Thursday', hours: '11:30 â€“ 23:00' },
        { day: 'Friday â€“ Saturday', hours: '11:30 â€“ 01:00' },
        { day: 'Sunday', hours: '12:00 â€“ 22:00' },
      ],
      socials: {
        instagram: '@burgerdistrict',
        facebook: 'burgerdistrict',
        website: 'district.example.com',
      },
    },
    sampleMenu: [
      category('Burgers', 'Smashed to order, no substitutions', [
        item('The District', 'Double patty, american cheese, house sauce', 13.5, IMG.doubleBurger, {
          featured: true,
          popular: true,
        }),
        item('Classic Smash', 'Single, pickles, onion, ketchup', 10.5, IMG.classicBurger),
        item('Tower Stack', 'Triple patty, bacon jam, cheddar', 17, IMG.dramaticBurger, {
          featured: true,
        }),
      ]),
      category('Loaded', 'Fries engineered for gravity', [
        item('District Loaded Fries', 'Cheese sauce, brisket, jalapeÃ±o', 9.5, IMG.steakFrites),
        item('The Works Dog', 'Smoked sausage, kraut, mustard', 8.5, IMG.deliSandwich),
        item('Buttermilk Chicken', 'Slaw, hot honey, pickles', 14, IMG.burgersBoard),
      ]),
      category('Shakes', 'Thick. Cold. Worth it.', [
        item('Salted Malt Shake', 'Vanilla malt, sea salt', 6.5, IMG.icedCoffee, { popular: true }),
        item('Espresso Shake', 'Cold brew, chocolate cream', 7, IMG.latteHands),
        item('Filter Coffee', 'Bottomless, diner style', 3.5, IMG.cappuccino),
      ]),
      category('Sweet Finish', 'Because you said you had room', [
        item('Warm Cookie Skillet', 'Chocolate chunk, soft serve', 7.5, IMG.cookies),
        item('Stack of Hotcakes', 'Maple, banana, butter', 8, IMG.pancakes),
      ]),
    ],
    defaultDesign: makeDesign({
      colors: {
        primary: '#F2C230',
        secondary: '#9A9A9A',
        accent: '#F2C230',
        background: '#0F0F0F',
        text: '#F5F2EC',
        card: '#1A1A1A',
        button: '#F2C230',
      },
      typography: {
        heading: 'montserrat',
        body: 'dm-sans',
        menu: 'montserrat',
        headingScale: 1.1,
        bodyScale: 1.02,
        headingWeight: 800,
        lineHeight: 1.5,
      },
      layout: {
        header: 'minimal',
        hero: 'fullscreen',
        menuLayout: 'grid',
        card: 'flat',
        radius: 6,
        spacing: 1,
        aspect: 'landscape',
        theme: 'dark',
      },
    }),
    usageCount: 298,
  },

  /* ---------------------------------------------------------- 5 ---- */
  {
    id: 'bella-italia',
    name: 'Bella Italia',
    category: 'Restaurant',
    tagline: 'Slow food, loud tables, extra parmesan.',
    description:
      'A warm trattoria template pairing olive greens with tomato reds. Editorial hero, classic list menu and generous food photography.',
    personality: 'Rustic Â· Warm Â· Generous',
    tags: ['Warm', 'Serif', 'List menu'],
    featured: true,
    chips: ['#3F5D45', '#C1442E', '#FBF6EE'],
    previewImage: IMG.pizzaBoard,
    heroImage: IMG.classicDiningRoom,
    gallery: [IMG.pizzaBoard, IMG.mushroomPasta, IMG.pastaWineTable, IMG.slicedSteak],
    sample: {
      name: 'Bella Italian Kitchen',
      slug: 'bella',
      tagline: 'Slow food, loud tables, extra parmesan.',
      description:
        'A family kitchen serving the recipes Nonna brought from Emilia-Romagna â€” hand-rolled pasta, dough fermented for 48 hours and wine poured by the carafe.',
      logoText: 'BK',
      logoStyle: 'monogram',
      phone: '+1 (617) 555-0188',
      email: 'ciao@bellakitchen.demo',
      address: '12 Harbor Street, Boston, MA',
      hours: [
        { day: 'Monday', hours: 'Closed' },
        { day: 'Tuesday â€“ Thursday', hours: '17:00 â€“ 22:30' },
        { day: 'Friday â€“ Saturday', hours: '17:00 â€“ 23:30' },
        { day: 'Sunday', hours: '12:00 â€“ 21:00' },
      ],
      socials: { instagram: '@bellaitalia', facebook: 'bellaitalia', website: 'bella.example.com' },
    },
    sampleMenu: [
      category('Antipasti', 'To share, or not', [
        item('Bruschetta al Pomodoro', 'Sourdough, garlic, basil, olive oil', 9, IMG.avocadoToast, {
          popular: true,
        }),
        item('Insalata della Casa', 'Leaves, shaved parmigiano, lemon', 11, IMG.saladBowl),
        meatballs(),
      ]),
      category('Pasta', 'Rolled fresh every morning', [
        item('Tagliatelle ai Funghi', 'Wild mushroom, thyme, cream', 19, IMG.mushroomPasta, {
          featured: true,
          popular: true,
        }),
        item('Spaghetti ai Frutti di Mare', 'Clams, mussels, chilli, white wine', 23, IMG.seafoodPasta, {
          featured: true,
        }),
        item('Penne allâ€™Arrabbiata', 'Tomato, garlic, calabrian chilli', 16, IMG.penneArrabbiata),
        item('Pasta alla Zucchina', 'Courgette ribbons, mint, pecorino', 18, IMG.zucchiniPasta),
      ]),
      category('Pizza', '48-hour dough, wood fired', [
        item('Margherita D.O.P.', 'San marzano, fior di latte, basil', 16, IMG.margherita, {
          popular: true,
        }),
        item('Quattro Formaggi', 'Gorgonzola, taleggio, provolone, mozzarella', 19, IMG.pizzaBoard),
        item('Diavola', 'Spicy salami, chilli honey', 18, IMG.pizzaSlice),
      ]),
      category('Secondi', 'From the grill', [
        item('Tagliata di Manzo', 'Sliced ribeye, rocket, balsamic', 32, IMG.steakFrites, {
          featured: true,
        }),
        item('Bistecca alla Fiorentina', 'For two, 600g, rosemary potatoes', 68, IMG.slicedSteak),
        item('Costolette dâ€™Agnello', 'Slow braised, tomato, olives', 29, IMG.ribs),
      ]),
      category('Dolci', 'Made by Marta', [
        item('TiramisÃ¹ Classico', 'Mascarpone, espresso, cocoa', 9, IMG.platedDessert, {
          featured: true,
        }),
        item('Torta al Cioccolato', 'Warm dark chocolate centre', 10, IMG.chocolateCake),
        item('Biscotti della Casa', 'Almond, cantuccini, vin santo', 7, IMG.cookies),
      ]),
    ],
    defaultDesign: makeDesign({
      colors: {
        primary: '#3F5D45',
        secondary: '#7A7461',
        accent: '#C1442E',
        background: '#FBF6EE',
        text: '#221B14',
        card: '#FFFFFF',
        button: '#C1442E',
      },
      typography: {
        heading: 'playfair',
        body: 'inter',
        menu: 'lora',
        headingScale: 1.05,
        bodyScale: 1.02,
        headingWeight: 600,
        lineHeight: 1.65,
      },
      layout: {
        header: 'split',
        hero: 'editorial',
        menuLayout: 'list',
        card: 'bordered',
        radius: 12,
        spacing: 1,
        aspect: 'landscape',
        theme: 'light',
      },
    }),
    usageCount: 521,
  },

  /* ---------------------------------------------------------- 6 ---- */
  {
    id: 'bean-brew',
    name: 'Bean & Brew',
    category: 'Coffee',
    tagline: 'Roasted upstairs. Brewed exactly to spec.',
    description:
      'A calm specialty-coffee template: split hero, square imagery and a restrained palette that lets origin notes and brew methods do the talking.',
    personality: 'Calm Â· Minimal Â· Craft',
    tags: ['Neutral', 'Modern', 'Brew guide'],
    featured: false,
    chips: ['#4A3428', '#A9673A', '#F4EDE4'],
    previewImage: IMG.pourOver,
    heroImage: IMG.cafeWindow,
    gallery: [IMG.pourOver, IMG.coffeeBeans, IMG.cappuccino, IMG.cafeInterior],
    sample: {
      name: 'Bean & Brew',
      slug: 'beanbrew',
      tagline: 'Roasted upstairs. Brewed exactly to spec.',
      description:
        'A micro-roastery and brew bar. We roast on Tuesdays, cup on Wednesdays and publish every origin note on the bag.',
      logoText: 'B&B',
      logoStyle: 'wordmark',
      phone: '+1 (206) 555-0133',
      email: 'hello@beanbrew.demo',
      address: '5 Pike Lane, Seattle, WA',
      hours: CAFE_HOURS,
      socials: { instagram: '@beanbrew', facebook: 'beanbrew', website: 'brew.example.com' },
    },
    sampleMenu: [
      category('Espresso', 'House blend + rotating guest', [
        item('Espresso', '18g in, 36g out, 27 seconds', 3.2, IMG.coffeeBeans, { popular: true }),
        item('Cappuccino', 'Wet, 5oz, silky microfoam', 4.4, IMG.cappuccino, { featured: true }),
        item('Honey Oat Latte', 'Local wildflower honey', 5.2, IMG.latteHands),
      ]),
      category('Brew Bar', 'V60, batch, immersion', [
        item('Single Origin Filter', 'Rotating, notes on the board', 5.5, IMG.pourOver, {
          featured: true,
        }),
        item('Cold Brew', '18 hour steep, on tap', 5, IMG.icedCoffee),
        item('Flight of Three', 'Compare any three origins', 12, IMG.coffeeBeans),
      ]),
      category('Kitchen', 'All day, until we run out', [
        item('Avocado & Feta Toast', 'Sourdough, dukkah, lemon', 12, IMG.avocadoToast, {
          popular: true,
        }),
        item('Morning Pastry', 'Croissant or cinnamon bun', 4.8, IMG.frenchToast),
        item('Granola Bowl', 'Yoghurt, seasonal compote', 9.5, IMG.healthyPlate),
      ]),
      category('Retail', 'Beans by the bag, 250g', [
        item('Ethiopia Guji', 'Peach, jasmine, bergamot', 19, IMG.coffeeBeans),
        item('Colombia Huila', 'Cocoa, red apple, caramel', 17, IMG.coffeeBeans),
        item('Decaf Sugarcane', 'Chocolate, walnut', 17, IMG.coffeeBeans),
      ]),
    ],
    defaultDesign: makeDesign({
      colors: {
        primary: '#4A3428',
        secondary: '#8A7361',
        accent: '#A9673A',
        background: '#F4EDE4',
        text: '#2C211A',
        card: '#FFFCF7',
        button: '#4A3428',
      },
      typography: {
        heading: 'dm-sans',
        body: 'inter',
        menu: 'dm-sans',
        headingScale: 1,
        bodyScale: 1,
        headingWeight: 600,
        lineHeight: 1.6,
      },
      layout: {
        header: 'minimal',
        hero: 'split',
        menuLayout: 'grid',
        card: 'bordered',
        radius: 10,
        spacing: 1,
        aspect: 'square',
        theme: 'light',
      },
    }),
    usageCount: 267,
  },

  /* ---------------------------------------------------------- 7 ---- */
  {
    id: 'green-table',
    name: 'Green Table',
    category: 'Healthy',
    tagline: 'Plants first, portions generous, zero lecture.',
    description:
      'Fresh, bright and optimistic. A centered header, airy spacing and elevated cards give bowls and juices the room they deserve.',
    personality: 'Fresh Â· Bright Â· Airy',
    tags: ['Light', 'Rounded', 'Plant forward'],
    featured: false,
    chips: ['#2F7A57', '#E1B94B', '#FAFCF6'],
    previewImage: IMG.tofuBowl,
    heroImage: IMG.cafeBright,
    gallery: [IMG.tofuBowl, IMG.saladBowl, IMG.soupBowl, IMG.healthyPlate],
    sample: {
      name: 'Green Table',
      slug: 'greentable',
      tagline: 'Plants first, portions generous, zero lecture.',
      description:
        'A neighbourhood kitchen cooking vegetable-forward plates from farms within 100 miles. Everything is made from scratch, every day.',
      logoText: 'GT',
      logoStyle: 'badge',
      phone: '+1 (512) 555-0155',
      email: 'eat@greentable.demo',
      address: '300 Cedar Road, Austin, TX',
      hours: [
        { day: 'Monday â€“ Friday', hours: '11:00 â€“ 21:00' },
        { day: 'Saturday', hours: '10:00 â€“ 21:00' },
        { day: 'Sunday', hours: '10:00 â€“ 20:00' },
      ],
      socials: { instagram: '@greentable', facebook: 'greentable', website: 'green.example.com' },
    },
    sampleMenu: [
      category('Bowls', 'Built on brown rice or greens', [
        item('Sunshine Grain Bowl', 'Roast pumpkin, tofu, tahini, seeds', 15, IMG.tofuBowl, {
          featured: true,
          popular: true,
        }),
        item('Market Harvest Bowl', 'Seasonal veg, grains, herbs', 14, IMG.healthyPlate),
        item('Pesto Penne Bowl', 'Basil, cashew cream, pine nut', 16, IMG.pastaSalad),
      ]),
      category('Salads', 'Dressed to order', [
        item('Green Goddess', 'Little gem, avocado, herbs', 13, IMG.saladBowl, { popular: true }),
        item('Garden Leaf & Citrus', 'Fennel, orange, olives', 12, IMG.saladPlate),
        item('Smashed Avo Plate', 'Sourdough, chilli, lime', 12.5, IMG.avocadoToast, {
          featured: true,
        }),
      ]),
      category('Warm', 'Small plates, big flavour', [
        item('Carrot & Ginger VeloutÃ©', 'Coconut, chilli oil, seeds', 10, IMG.soupBowl),
        item('Herb Marinated Chicken', 'Charred greens, lemon', 19, IMG.grilledMeat),
        item('Market Catch of the Day', 'Beurre blanc, seasonal garnish', 24, IMG.porkPlate),
      ]),
      category('Refreshers', 'Cold pressed & house brewed', [
        item('Cold Brew Tonic', 'House brew, citrus, tonic', 5.5, IMG.icedCoffee),
        item('Golden Turmeric Latte', 'Oat milk, ginger, honey', 5, IMG.latteHands),
        item('Filter of the Day', 'Single origin, no sugar', 4, IMG.pourOver),
      ]),
    ],
    defaultDesign: makeDesign({
      colors: {
        primary: '#2F7A57',
        secondary: '#7FA98C',
        accent: '#E1B94B',
        background: '#FAFCF6',
        text: '#16241B',
        card: '#FFFFFF',
        button: '#2F7A57',
      },
      typography: {
        heading: 'poppins',
        body: 'inter',
        menu: 'inter',
        headingScale: 1.04,
        bodyScale: 1.04,
        headingWeight: 600,
        lineHeight: 1.7,
      },
      layout: {
        header: 'centered',
        hero: 'split',
        menuLayout: 'grid',
        card: 'elevated',
        radius: 16,
        spacing: 2,
        aspect: 'square',
        theme: 'light',
      },
    }),
    usageCount: 341,
  },

  /* ---------------------------------------------------------- 8 ---- */
  {
    id: 'maison-patisserie',
    name: 'Maison Patisserie',
    category: 'Dessert',
    tagline: 'Small cakes, long afternoons.',
    description:
      'Parisian restraint with burgundy and gold. Portrait imagery, elegant serif headlines and elevated cards that make each dessert feel like an object.',
    personality: 'Parisian Â· Refined Â· Golden',
    tags: ['Elegant', 'Serif', 'Portrait imagery'],
    featured: false,
    chips: ['#7A2E3B', '#C9A227', '#FFF9F0'],
    previewImage: IMG.rainbowCake,
    heroImage: IMG.cafeTerrace,
    gallery: [IMG.rainbowCake, IMG.cupcakes, IMG.platedDessert, IMG.cafeTerrace],
    sample: {
      name: 'Maison Patisserie',
      slug: 'maison',
      tagline: 'Small cakes, long afternoons.',
      description:
        'A marble counter of entremets, petits gÃ¢teaux and viennoiserie, made in a small kitchen behind the shop. Tea served until five.',
      logoText: 'MP',
      logoStyle: 'monogram',
      phone: '+1 (415) 555-0190',
      email: 'bonjour@maisonpatisserie.demo',
      address: '18 Rue Verte, San Jose, CA',
      hours: BAKERY_HOURS,
      socials: {
        instagram: '@maisonpatisserie',
        facebook: 'maisonpatisserie',
        website: 'maison.example.com',
      },
    },
    sampleMenu: [
      category('Entremets', 'Whole cakes Â· 48h notice', [
        item('Chocolat Grand Cru', '70% ganache, praline base', 48, IMG.chocolateCake, {
          featured: true,
          popular: true,
        }),
        item('Jardin dâ€™Ã‰tÃ©', 'Vanilla, raspberry, pistachio', 52, IMG.rainbowCake, {
          featured: true,
        }),
        item('Tarte au Citron', 'Torched meringue, almond sablÃ©', 38, IMG.platedDessert),
      ]),
      category('Petits GÃ¢teaux', 'By the piece', [
        item('Vanilla Cupcake', 'Brown butter frosting', 4.5, IMG.cupcakes),
        item('Caramel Saint-HonorÃ©', 'Choux, caramel, crÃ¨me', 7.5, IMG.platedDessert, {
          popular: true,
        }),
        item('SablÃ© Breton', 'Salted caramel, dark chocolate', 4, IMG.cookies),
      ]),
      category('Viennoiserie', 'From the morning bake', [
        item('Pain au Chocolat', 'Two batons, 27% butter', 4.8, IMG.frenchToast),
        item('Brioche aux Pralines', 'Pink praline, almond', 5.2, IMG.pancakes),
        item('Baguette de Tradition', 'Stone milled flour', 4, IMG.artisanBread),
      ]),
      category('Boissons', 'Tea, coffee, cold', [
        item('ThÃ© Maison', 'Bergamot, rose, white tea', 5, IMG.cappuccino),
        item('Iced Coffee Latte', 'Double shot, milk of choice', 5.5, IMG.icedCoffee),
        item('Chocolat Chaud', 'Dark, whipped cream', 6, IMG.latteHands),
      ]),
    ],
    defaultDesign: makeDesign({
      colors: {
        primary: '#7A2E3B',
        secondary: '#9E7B74',
        accent: '#C9A227',
        background: '#FFF9F0',
        text: '#241A1B',
        card: '#FFFFFF',
        button: '#7A2E3B',
      },
      typography: {
        heading: 'lora',
        body: 'montserrat',
        menu: 'lora',
        headingScale: 1.06,
        bodyScale: 0.98,
        headingWeight: 500,
        lineHeight: 1.7,
      },
      layout: {
        header: 'centered',
        hero: 'editorial',
        menuLayout: 'grid',
        card: 'elevated',
        radius: 20,
        spacing: 2,
        aspect: 'portrait',
        theme: 'warm',
      },
    }),
    usageCount: 233,
  },

  /* ---------------------------------------------------------- 9 ---- */
  {
    id: 'coastal-catch',
    name: 'Coastal Catch',
    category: 'Restaurant',
    tagline: 'Fresh catch, grilled simply, served with lemon.',
    description:
      'A seaside grill template built around deep ocean blues and sandy neutrals. Wide hero photography, portrait dish cards and a relaxed maritime rhythm.',
    personality: 'Oceanic · Briny · Relaxed',
    tags: ['Seafood', 'Grill', 'Coastal'],
    featured: false,
    chips: ['#0F4C5C', '#1B998B', '#E8F1F2'],
    previewImage: IMG.seafoodPasta,
    heroImage: IMG.terraceSunset,
    gallery: [IMG.seafoodPasta, IMG.grilledMeat, IMG.slicedSteak, IMG.terraceSunset],
    sample: {
      name: 'Coastal Catch',
      slug: 'coastalcatch',
      tagline: 'Fresh catch, grilled simply, served with lemon.',
      description:
        'A wharf-side grill where the menu changes with the tide. Line-caught fish, prawns and calamari cooked over charcoal and finished with sea salt and lemon.',
      logoText: 'CC',
      logoStyle: 'monogram',
      phone: '+1 (415) 555-0122',
      email: 'hello@coastalcatch.demo',
      address: 'Pier 33, San Francisco, CA',
      hours: [
        { day: 'Monday – Thursday', hours: '11:30 – 21:00' },
        { day: 'Friday – Saturday', hours: '11:30 – 22:30' },
        { day: 'Sunday', hours: '12:00 – 20:00' },
      ],
      socials: { instagram: '@coastalcatch', facebook: 'coastalcatch', website: 'coastalcatch.example.com' },
    },
    sampleMenu: [
      category('Raw Bar', 'Oysters, crudo and ceviche', [
        item('East Coast Oysters', 'Mignonette, lemon, horseradish', 18, IMG.seafoodPasta, { featured: true }),
        item('Tuna Crudo', 'Yuzu, chilli, micro herb', 16, IMG.saladPlate, { popular: true }),
      ]),
      category('From the Grill', 'Whole fish and shellfish', [
        item('Whole Branzino', 'Rosemary, lemon, olive oil', 34, IMG.grilledMeat, { featured: true, popular: true }),
        item('Garlic Butter Prawns', 'Parsley, charred bread', 26, IMG.slicedSteak),
        item('Seafood Paella', 'Mussels, clams, saffron rice', 32, IMG.pastaWineTable),
      ]),
      category('Sides', 'Fresh and simple', [
        item('Charred Broccolini', 'Almond, chilli flake', 9, IMG.healthyPlate),
        item('Thick Cut Fries', 'Sea salt, aioli', 7, IMG.frenchToast),
      ]),
    ],
    defaultDesign: makeDesign({
      colors: {
        primary: '#0F4C5C',
        secondary: '#1B998B',
        accent: '#E8571F',
        background: '#E8F1F2',
        text: '#0A2A32',
        card: '#FFFFFF',
        button: '#0F4C5C',
      },
      typography: {
        heading: 'playfair',
        body: 'inter',
        menu: 'lora',
        headingScale: 1.05,
        bodyScale: 1.02,
        headingWeight: 600,
        lineHeight: 1.65,
      },
      layout: {
        header: 'centered',
        hero: 'fullscreen',
        menuLayout: 'grid',
        card: 'bordered',
        radius: 12,
        spacing: 1,
        aspect: 'landscape',
        theme: 'light',
      },
    }),
    usageCount: 0,
  },

  /* ---------------------------------------------------------- 10 ---- */
  {
    id: 'fiesta-tacos',
    name: 'Fiesta Tacos',
    category: 'Cafe',
    tagline: 'Hand-pressed tortillas, bold salsas, loud colours.',
    description:
      'A street-taqueria template with saturated magentas, electric yellows and a split hero that feels like a market stall at noon.',
    personality: 'Vivid · Spicy · Street',
    tags: ['Mexican', 'Tacos', 'Street food'],
    featured: false,
    chips: ['#C1272D', '#F2C230', '#1B1714'],
    previewImage: IMG.deliSandwich,
    heroImage: IMG.burgersBoard,
    gallery: [IMG.deliSandwich, IMG.avocadoToast, IMG.burgersBoard, IMG.tableSpread],
    sample: {
      name: 'Fiesta Tacos',
      slug: 'fiestatacos',
      tagline: 'Hand-pressed tortillas, bold salsas, loud colours.',
      description:
        'A corner taquería serving al pastor, carnitas and barbacoa on blue corn tortillas. Order at the counter, eat at a plastic stool.',
      logoText: 'FT',
      logoStyle: 'wordmark',
      phone: '+1 (312) 555-0144',
      email: 'hola@fiestatacos.demo',
      address: '19 Division Street, Chicago, IL',
      hours: [
        { day: 'Monday – Thursday', hours: '11:00 – 22:00' },
        { day: 'Friday – Saturday', hours: '11:00 – 00:00' },
        { day: 'Sunday', hours: '12:00 – 21:00' },
      ],
      socials: { instagram: '@fiestatacos', facebook: 'fiestatacos', website: 'fiestatacos.example.com' },
    },
    sampleMenu: [
      category('Tacos', 'Two per order, on blue corn', [
        item('Al Pastor', 'Pineapple, onion, cilantro', 5.5, IMG.deliSandwich, { featured: true, popular: true }),
        item('Carnitas', 'Orange mojo, pickled onion', 5.5, IMG.avocadoToast),
        item('Barbacoa', 'Slow braised, consommé', 6, IMG.burgersBoard),
      ]),
      category('Salsas', 'Made fresh every morning', [
        item('Salsa Verde', 'Tomatillo, serrano, lime', 3, IMG.saladBowl),
        item('Salsa Roja', 'Chile de árbol, garlic', 3, IMG.healthyPlate),
        item('Guacamole', 'Hass avocado, lime, salt', 5, IMG.avocadoToast),
      ]),
      category('Drinks', 'Aguas frescas and cerveza', [
        item('Horchata', 'Rice, cinnamon, vanilla', 4, IMG.latteHands),
        item('Jamaica', 'Hibiscus, cane sugar', 3.5, IMG.icedCoffee),
        item('Mexican Lager', 'Ice cold, salted rim', 5, IMG.coffeeBeans),
      ]),
    ],
    defaultDesign: makeDesign({
      colors: {
        primary: '#C1272D',
        secondary: '#E8571F',
        accent: '#F2C230',
        background: '#FFF4E0',
        text: '#1B1714',
        card: '#FFFFFF',
        button: '#C1272D',
      },
      typography: {
        heading: 'montserrat',
        body: 'dm-sans',
        menu: 'montserrat',
        headingScale: 1.12,
        bodyScale: 1,
        headingWeight: 800,
        lineHeight: 1.5,
      },
      layout: {
        header: 'minimal',
        hero: 'split',
        menuLayout: 'grid',
        card: 'flat',
        radius: 6,
        spacing: 1,
        aspect: 'square',
        theme: 'light',
      },
    }),
    usageCount: 0,
  },

  /* ---------------------------------------------------------- 11 ---- */
  {
    id: 'leaf-tea',
    name: 'Leaf Tea House',
    category: 'Cafe',
    tagline: 'Slow steeps, quiet mornings, soft light.',
    description:
      'A tea-house template in sage and cream. Centered header, airy spacing and rounded cards that make a cup of tea feel like a ritual.',
    personality: 'Calm · Earthy · Minimal',
    tags: ['Tea', 'Healthy', 'Quiet'],
    featured: false,
    chips: ['#2F7A57', '#D4C9A8', '#FAFCF6'],
    previewImage: IMG.tofuBowl,
    heroImage: IMG.cafeWindow,
    gallery: [IMG.tofuBowl, IMG.saladBowl, IMG.latteHands, IMG.cafeWindow],
    sample: {
      name: 'Leaf Tea House',
      slug: 'leaftea',
      tagline: 'Slow steeps, quiet mornings, soft light.',
      description:
        'A neighbourhood tea room serving loose-leaf infusions, scones and light plates. No rush, no wifi pressure — just a place to sit.',
      logoText: 'LT',
      logoStyle: 'badge',
      phone: '+1 (512) 555-0166',
      email: 'steep@leaftea.demo',
      address: '1202 South Congress, Austin, TX',
      hours: [
        { day: 'Monday – Friday', hours: '07:00 – 18:00' },
        { day: 'Saturday', hours: '08:00 – 18:00' },
        { day: 'Sunday', hours: '09:00 – 17:00' },
      ],
      socials: { instagram: '@leaftea', facebook: 'leaftea', website: 'leaftea.example.com' },
    },
    sampleMenu: [
      category('Tea', 'Loose leaf by the pot', [
        item('Earl Grey', 'Bergamot, black leaf', 5, IMG.latteHands, { featured: true }),
        item('Jasmine Silver Needle', 'White leaf, floral', 6, IMG.pourOver),
        item('Moroccan Mint', 'Fresh mint, gunpowder green', 5, IMG.cappuccino),
      ]),
      category('Light Plates', 'Scones and small bites', [
        item('Plain Scone', 'Clotted cream, strawberry jam', 6, IMG.frenchToast, { popular: true }),
        item('Cucumber Sandwiches', 'Dill cream cheese, crustless', 8, IMG.saladPlate),
        item('Avocado Toast', 'Sourdough, chilli, lemon', 11, IMG.avocadoToast),
      ]),
      category('Sweets', 'Baked in-house', [
        item('Honey Cake', 'Walnuts, cream cheese frosting', 7, IMG.chocolateCake),
        item('Madeleines', 'Lemon glaze, brown butter', 4, IMG.cupcakes),
      ]),
    ],
    defaultDesign: makeDesign({
      colors: {
        primary: '#2F7A57',
        secondary: '#7FA98C',
        accent: '#D4C9A8',
        background: '#FAFCF6',
        text: '#16241B',
        card: '#FFFFFF',
        button: '#2F7A57',
      },
      typography: {
        heading: 'poppins',
        body: 'inter',
        menu: 'inter',
        headingScale: 1,
        bodyScale: 1.04,
        headingWeight: 600,
        lineHeight: 1.7,
      },
      layout: {
        header: 'centered',
        hero: 'split',
        menuLayout: 'grid',
        card: 'elevated',
        radius: 20,
        spacing: 2,
        aspect: 'square',
        theme: 'light',
      },
    }),
    usageCount: 0,
  },

  /* ---------------------------------------------------------- 12 ---- */
  {
    id: 'aurum-lounge',
    name: 'Aurum Lounge',
    category: 'Fine Dining',
    tagline: 'Luxury mobile menu — dark gold, fullscreen hero, slide-up cart.',
    description:
      'A black-and-gold fine-dining template built like a mobile app. Fullscreen cover hero, sticky category pills, dietary filter chips, image-left dish cards, fixed bottom navigation and a slide-up checkout drawer that sends orders via WhatsApp.',
    personality: 'Luxe · Dark · Mobile-first',
    tags: ['Dark', 'Gold', 'Fine Dining', 'App-like'],
    featured: false,
    chips: ['#0a0a0c', '#e5c158', '#10b981'],
    previewImage: IMG.fineDiningPlate,
    heroImage: IMG.diningRoomDark,
    gallery: [IMG.fineDiningPlate, IMG.slicedSteak, IMG.platedDessert, IMG.classicDiningRoom],
    sample: {
      name: 'Aurum Restaurant & Lounge',
      slug: 'aurum',
      tagline: 'Luxury mobile menu.',
      description: 'Fine dining and artisanal cuisine. Black-and-gold mobile menu with slide-up cart and WhatsApp checkout.',
      logoText: 'AURUM',
      logoStyle: 'monogram',
      phone: '+44 20 7946 0912',
      email: 'hello@aurum.demo',
      address: 'Mayfair, London',
      hours: [
        { day: 'Daily', hours: '12:00 PM – 11:30 PM' },
      ],
      socials: { instagram: '@aurum', facebook: 'aurum', website: 'aurum.example.com' },
    },
    sampleMenu: [
      category('Prime Steaks', 'Grade A5 & dry-aged cuts', [
        item('Wagyu Beef Ribeye 10 oz', 'Japanese A5 Wagyu, bone marrow garlic butter, black truffle jus', 38, IMG.slicedSteak, { featured: true, isGf: true }),
        item('Artisanal Lamb Chops', 'Charcoal grilled, rosemary, mint pesto, pomegranate reduction', 29, IMG.grilledMeat, { isSpecial: true, isSpicy: true, isGf: true }),
        item('Signature Gold Gourmet Burger', 'Dry-aged Aberdeen Angus, smoked bacon jam, aged cheddar, truffle mayo', 19.5, IMG.doubleBurger, { isSpecial: true }),
      ]),
      category('Mains & Pasta', 'Handmade and grilled', [
        item('Truffle & Wild Mushroom Pasta', 'Handmade tagliatelle, wild mushrooms, black truffle, 24-month Parmesan cream', 22, IMG.mushroomPasta, { isVeg: true }),
        item('Grilled Atlantic Salmon Fillet', 'Pan-seared wild salmon, saffron fondant potato, lemon beurre blanc', 26.5, IMG.seafoodPasta, { isGf: true }),
      ]),
      category('Pizza', 'Wood-fired', [
        item('Wood-fired Truffle Margherita', 'San Marzano, Fior di Latte, basil, truffle drizzle', 14.5, IMG.pizzaBoard, { isVeg: true }),
      ]),
      category('Starters', 'Cold and hot openings', [
        item('Seared King Scallops', 'Cauliflower puree, crispy pancetta, herb oil', 16.5, IMG.seafoodPasta, { isGf: true }),
      ]),
      category('Desserts', 'Pastry classics', [
        item('Classic Venetian Tiramisu', 'Espresso-soaked Savoiardi, whipped mascarpone', 8.5, IMG.platedDessert, { isVeg: true }),
      ]),
      category('Beverages', 'Cold pressed & signature', [
        item('Sparkling Elderflower & Gold Mocktail', 'English apple juice, elderflower syrup, soda, 24k gold leaf', 6.5, IMG.icedCoffee, { isSpecial: true, isVeg: true, isGf: true }),
      ]),
    ],
    defaultDesign: makeDesign({
      colors: {
        primary: '#e5c158',
        secondary: '#b8922c',
        accent: '#e5c158',
        background: '#0a0a0c',
        text: '#f3f4f6',
        card: '#141419',
        button: '#e5c158',
        border: '#2a2a35',
      },
      typography: {
        heading: 'montserrat',
        body: 'inter',
        menu: 'inter',
        headingScale: 1.05,
        bodyScale: 1,
        headingWeight: 800,
        lineHeight: 1.5,
      },
      layout: {
        header: 'minimal',
        hero: 'fullscreen',
        menuLayout: 'grid',
        card: 'elevated',
        radius: 14,
        spacing: 1,
        aspect: 'portrait',
        theme: 'custom',
      },
    }),
    usageCount: 0,
  },

  /* ---------------------------------------------------------- 13 ---- */
  {
    id: 'saffron-square',
    name: 'Saffron Square',
    category: 'Restaurant',
    tagline: 'Sharp edges, bold type, grilled fast.',
    description:
      'A neo-brutalist template: sharp corners, compact spacing, massive condensed headlines and a list-style menu that reads like a train timetable.',
    personality: 'Brutalist · Bold · Fast',
    tags: ['Brutalist', 'List menu', 'Sharp'],
    featured: false,
    chips: ['#111827', '#F59E0B', '#FFFFFF'],
    previewImage: IMG.dramaticBurger,
    heroImage: IMG.burgersBoard,
    gallery: [IMG.dramaticBurger, IMG.doubleBurger, IMG.burgersBoard, IMG.deliSandwich],
    sample: {
      name: 'Saffron Square',
      slug: 'saffronsquare',
      tagline: 'Sharp edges, bold type, grilled fast.',
      description: 'Counter-service grill with strict grids and honest prices. Order, sit, eat, go.',
      logoText: 'SS',
      logoStyle: 'wordmark',
      phone: '+1 (415) 555-0100',
      email: 'hello@saffron.demo',
      address: '100 Square Street, San Francisco, CA',
      hours: [
        { day: 'Daily', hours: '11:00 – 23:00' },
      ],
      socials: { instagram: '@saffronsquare', facebook: 'saffronsquare', website: 'saffron.example.com' },
    },
    sampleMenu: [
      category('Burgers', 'Smashed on the flat-top', [
        item('Square Smash', 'Double patty, cheddar, house sauce', 12.5, IMG.doubleBurger, { featured: true, popular: true }),
        item('Classic Square', 'Single patty, pickles, onion', 9.5, IMG.classicBurger),
        item('Tower Square', 'Triple patty, bacon jam', 16, IMG.dramaticBurger, { featured: true }),
      ]),
      category('Loaded', 'Built for sharing', [
        item('Loaded Fries', 'Cheese sauce, jalapeño, brisket', 8.5, IMG.steakFrites, { popular: true }),
        item('Square Dog', 'Smoked sausage, kraut, mustard', 7.5, IMG.deliSandwich),
      ]),
      category('Shakes', 'Thick and cold', [
        item('Malt Shake', 'Vanilla, sea salt', 6, IMG.icedCoffee),
        item('Cold Brew', 'House blend, on ice', 4.5, IMG.cappuccino),
      ]),
    ],
    defaultDesign: makeDesign({
      colors: {
        primary: '#111827',
        secondary: '#6B7280',
        accent: '#F59E0B',
        background: '#FFFFFF',
        text: '#111827',
        card: '#FFFFFF',
        button: '#111827',
        border: '#111827',
      },
      typography: {
        heading: 'montserrat',
        body: 'dm-sans',
        menu: 'montserrat',
        headingScale: 1.2,
        bodyScale: 1,
        headingWeight: 800,
        lineHeight: 1.35,
      },
      layout: {
        header: 'minimal',
        hero: 'split',
        menuLayout: 'list',
        card: 'flat',
        radius: 2,
        spacing: 0,
        aspect: 'wide',
        theme: 'custom',
      },
    }),
    usageCount: 0,
  },

  /* ---------------------------------------------------------- 14 ---- */
  {
    id: 'sultan-table',
    name: "Sultan's Table",
    category: 'Fine Dining',
    tagline: 'An evening built around fire, silk and spice.',
    description:
      'Dark editorial fine dining: centered header, centered hero title, wide cinema figure below, and a slow list menu. No grid, no noise — just ceremony.',
    personality: 'Regal · Dark · Editorial',
    tags: ['Dark', 'Editorial', 'Tasting'],
    featured: false,
    chips: ['#0B0F0F', '#C6A15B', '#F3ECE1'],
    previewImage: IMG.fineDiningPlate,
    heroImage: IMG.classicDiningRoom,
    gallery: [IMG.fineDiningPlate, IMG.slicedSteak, IMG.platedDessert, IMG.classicDiningRoom],
    sample: {
      name: "Sultan's Table",
      slug: 'sultanstable',
      tagline: 'An evening built around fire, silk and spice.',
      description: 'A tasting room serving slow grills and spiced small plates under low light.',
      logoText: 'ST',
      logoStyle: 'badge',
      phone: '+44 20 7946 0000',
      email: 'reserve@sultan.demo',
      address: '1 Palace Row, Mayfair, London',
      hours: [
        { day: 'Wednesday – Sunday', hours: '18:00 – 23:30' },
        { day: 'Monday – Tuesday', hours: 'Closed' },
      ],
      socials: { instagram: '@sultanstable', facebook: 'sultanstable', website: 'sultan.example.com' },
    },
    sampleMenu: [
      category('Overture', 'Cold and spiced openings', [
        item('Ember Octopus', 'Charred octopus, smoked paprika oil', 19, IMG.seafoodPasta, { featured: true }),
        item('Beet & Whipped Feta', 'Whipped feta, honey, thyme', 15, IMG.saladBowl),
      ]),
      category('Fire', 'Slow-grilled mains', [
        item('Sultan Ribeye', 'Dry-aged ribeye, bone marrow jus', 58, IMG.slicedSteak, { featured: true, popular: true }),
        item('Spice Lamb Shank', '12-hour lamb, saffron rice', 42, IMG.ribs),
      ]),
      category('Suite', 'Desserts', [
        item('Goldleaf Baklava', 'Pistachio, orange blossom, goldleaf', 12, IMG.platedDessert, { featured: true }),
        item('Cardamom Panna Cotta', 'Cardamom cream, rose petals', 11, IMG.chocolateCake),
      ]),
    ],
    defaultDesign: makeDesign({
      colors: {
        primary: '#C6A15B',
        secondary: '#8A7A5E',
        accent: '#C6A15B',
        background: '#0B0F0F',
        text: '#F3ECE1',
        card: '#141A19',
        button: '#C6A15B',
        border: '#2A2E2C',
      },
      typography: {
        heading: 'playfair',
        body: 'inter',
        menu: 'lora',
        headingScale: 1.15,
        bodyScale: 1,
        headingWeight: 500,
        lineHeight: 1.8,
      },
      layout: {
        header: 'centered',
        hero: 'editorial',
        menuLayout: 'list',
        card: 'flat',
        radius: 4,
        spacing: 2,
        aspect: 'landscape',
        theme: 'dark',
      },
    }),
    usageCount: 0,
  },

  /* ---------------------------------------------------------- 15 ---- */
  {
    id: 'cloud-coffee',
    name: 'Cloud Coffee',
    category: 'Coffee',
    tagline: 'Soft light, tall heroes, quiet mornings.',
    description:
      'A minimal mobile-first coffee template: fullscreen photo hero, vertical portrait dish cards, huge radius and airy spacing. Feels like an Instagram story.',
    personality: 'Soft · Airy · Minimal',
    tags: ['Minimal', 'Portrait', 'Mobile'],
    featured: false,
    chips: ['#F8F5F0', '#4A3428', '#D9C7B5'],
    previewImage: IMG.latteHands,
    heroImage: IMG.cafeBright,
    gallery: [IMG.latteHands, IMG.cappuccino, IMG.pourOver, IMG.cafeWindow],
    sample: {
      name: 'Cloud Coffee',
      slug: 'cloudcoffee',
      tagline: 'Soft light, tall heroes, quiet mornings.',
      description: 'A small light-filled coffee bar brewing slowly and serving everything in portrait.',
      logoText: 'CC',
      logoStyle: 'badge',
      phone: '+1 (206) 555-0111',
      email: 'hello@cloudcoffee.demo',
      address: '4 Fern Street, Portland, OR',
      hours: [
        { day: 'Monday – Friday', hours: '07:00 – 18:00' },
        { day: 'Weekends', hours: '08:00 – 17:00' },
      ],
      socials: { instagram: '@cloudcoffee', facebook: 'cloudcoffee', website: 'cloud.example.com' },
    },
    sampleMenu: [
      category('Coffee', 'Short and tall', [
        item('Flat White', 'Silk milk, double ristretto', 4.5, IMG.cappuccino, { featured: true }),
        item('Pour Over', 'Rotating single origin', 5.5, IMG.pourOver, { popular: true }),
        item('Cold Brew', '18-hour steep', 5, IMG.icedCoffee),
      ]),
      category('Bakery', 'Baked at dawn', [
        item('Butter Croissant', '72-hour lamination', 4.5, IMG.frenchToast, { featured: true }),
        item('Seasonal Tart', 'Fruit and custard', 5.5, IMG.platedDessert),
      ]),
      category('Brunch', 'Until noon', [
        item('Avocado Toast', 'Sourdough, lemon, seeds', 12, IMG.avocadoToast, { popular: true }),
        item('Ricotta Pancakes', 'Honey butter, berries', 11.5, IMG.pancakes),
      ]),
    ],
    defaultDesign: makeDesign({
      colors: {
        primary: '#4A3428',
        secondary: '#8A7361',
        accent: '#A98468',
        background: '#FFFFFF',
        text: '#2B211C',
        card: '#FFFFFF',
        button: '#4A3428',
        border: '#E8E0D6',
      },
      typography: {
        heading: 'poppins',
        body: 'inter',
        menu: 'inter',
        headingScale: 1,
        bodyScale: 1.05,
        headingWeight: 600,
        lineHeight: 1.6,
      },
      layout: {
        header: 'minimal',
        hero: 'fullscreen',
        menuLayout: 'grid',
        card: 'elevated',
        radius: 24,
        spacing: 2,
        aspect: 'portrait',
        theme: 'light',
      },
    }),
    usageCount: 0,
  },

  /* ---------------------------------------------------------- 16 ---- */
  {
    id: 'terra-bistro',
    name: 'Terra Bistro',
    category: 'Cafe',
    tagline: 'Terracotta walls, wide plates, warm light.',
    description:
      'Warm Mediterranean bistro with a centered editorial hero, wide 16:9 dish imagery and a bordered grid menu. Feels like a late-afternoon trattoria.',
    personality: 'Warm · Rustic · Wide',
    tags: ['Warm', 'Wide', 'Grid'],
    featured: false,
    chips: ['#B45309', '#FDF6EC', '#7C2D12'],
    previewImage: IMG.pizzaBoard,
    heroImage: IMG.tableSpread,
    gallery: [IMG.pizzaBoard, IMG.mushroomPasta, IMG.pastaWineTable, IMG.tableSpread],
    sample: {
      name: 'Terra Bistro',
      slug: 'terrabistro',
      tagline: 'Terracotta walls, wide plates, warm light.',
      description: 'A warm neighbourhood bistro serving wood-fired plates and handmade pasta.',
      logoText: 'TB',
      logoStyle: 'monogram',
      phone: '+1 (415) 555-0123',
      email: 'ciao@terra.demo',
      address: '88 Harbor Street, San Francisco, CA',
      hours: [
        { day: 'Daily', hours: '11:00 – 22:00' },
      ],
      socials: { instagram: '@terrabistro', facebook: 'terrabistro', website: 'terra.example.com' },
    },
    sampleMenu: [
      category('Antipasti', 'To share', [
        item('Bruschetta', 'Tomato, garlic, basil', 9, IMG.avocadoToast, { popular: true }),
        item('Burrata & Tomatoes', 'Basil oil, grilled bread', 13, IMG.saladBowl),
      ]),
      category('Pasta & Pizza', 'Handmade daily', [
        item('Tagliatelle ai Funghi', 'Wild mushroom, thyme', 19, IMG.mushroomPasta, { featured: true }),
        item('Margherita D.O.P.', 'San Marzano, fior di latte', 16, IMG.pizzaBoard, { popular: true }),
        item('Spaghetti ai Frutti di Mare', 'Clams and mussels', 23, IMG.pastaWineTable),
      ]),
      category('Grill', 'From the wood fire', [
        item('Tagliata di Manzo', 'Sliced ribeye, rocket', 32, IMG.slicedSteak, { featured: true }),
        item('Herb Lamb Chops', 'Rosemary, roasted potatoes', 29, IMG.ribs),
      ]),
    ],
    defaultDesign: makeDesign({
      colors: {
        primary: '#B45309',
        secondary: '#9A3412',
        accent: '#B45309',
        background: '#FDF6EC',
        text: '#451A03',
        card: '#FFFFFF',
        button: '#B45309',
        border: '#FED7AA',
      },
      typography: {
        heading: 'playfair',
        body: 'dm-sans',
        menu: 'lora',
        headingScale: 1.05,
        bodyScale: 1.02,
        headingWeight: 600,
        lineHeight: 1.65,
      },
      layout: {
        header: 'split',
        hero: 'editorial',
        menuLayout: 'grid',
        card: 'bordered',
        radius: 6,
        spacing: 1,
        aspect: 'wide',
        theme: 'warm',
      },
    }),
    usageCount: 0,
  },

  /* ---------------------------------------------------------- 17 ---- */
  {
    id: 'glazed-kreme',
    name: 'Glazed Kreme',
    category: 'Dessert',
    tagline: 'Made fresh daily. Glazed while you watch.',
    description:
      'A donut-shop template inspired by green-and-red menu boards: banner headings, price-first list rows, and a playful bistro heart on white.',
    personality: 'Playful · Fresh · Bold',
    tags: ['Donuts', 'List menu', 'Banner'],
    featured: true,
    chips: ['#006241', '#C8102E', '#FFFFFF'],
    previewImage: IMG.chocolateCake,
    heroImage: IMG.tableSpread,
    gallery: [IMG.chocolateCake, IMG.cupcakes, IMG.cookies, IMG.tableSpread],
    sample: {
      name: 'Glazed Kreme',
      slug: 'glazedkreme',
      tagline: 'Made fresh daily. Glazed while you watch.',
      description: 'Original glazed donuts and fresh brews. Hot dough, cold drinks, better together.',
      logoText: 'GK',
      logoStyle: 'monogram',
      phone: '+20 2 555 0100',
      email: 'hello@glazedkreme.demo',
      address: 'Fresh Avenue, Cairo',
      hours: [
        { day: 'Daily', hours: '08:00 – 23:00' },
      ],
      socials: { instagram: '@glazedkreme', facebook: 'glazedkreme', website: 'glazed.example.com' },
    },
    sampleMenu: [
      category('Single Doughnuts', 'Fresh, glazed & filled', [
        item('Original Glazed', 'Classic glazed ring', 44, IMG.chocolateCake, { featured: true }),
        item('Choco Iced Glazed', 'Chocolate icing', 54, IMG.cookies, { popular: true }),
        item('Choco Iced With Sprinkles', 'Chocolate icing with sprinkles', 54, IMG.cupcakes),
        item('Sugar', 'Sugar dusted', 54, IMG.cookies),
        item('Cinnamon Ring', 'Cinnamon sugar ring', 54, IMG.pancakes),
        item('Chocolate Dream Cake', 'Dream cake donut', 64, IMG.chocolateCake, { featured: true }),
        item('Hazelnut Dream Cake', 'Hazelnut dream cake donut', 64, IMG.chocolateCake),
        item('Lotus Kreme', 'Lotus kreme filled', 80, IMG.cupcakes, { popular: true }),
        item('Nutty Cocoa', 'Cocoa coated', 80, IMG.chocolateCake),
        item('Pistachio Kreme', 'Pistachio kreme filled', 80, IMG.cupcakes),
      ]),
      category('Minis', 'Bite-sized rings', [
        item('OG 4 Minis', 'Four original minis', 107, IMG.pancakes),
        item('Assorted 4 Minis', 'Four assorted minis', 125, IMG.cupcakes, { popular: true }),
        item('OG 16 Minis', 'Sixteen original minis', 325, IMG.chocolateCake, { featured: true }),
        item('Assorted 16 Minis', 'Sixteen assorted minis', 370, IMG.cupcakes),
      ]),
      category('Hot & Iced Coffee', 'R = Regular · L = Large', [
        item('Espresso', '', 45, IMG.cappuccino),
        item('Americano', '', 75, IMG.pourOver),
        item('Cafe Latte', '', 85, IMG.latteHands, { popular: true }),
        item('Cappuccino', '', 85, IMG.cappuccino),
        item('Mocha', '', 100, IMG.chocolateCake),
        item('White Mocha', '', 110, IMG.latteHands),
        item('Salted Caramel Latte', '', 105, IMG.icedCoffee, { featured: true }),
      ]),
      category('Frappes & Cold', 'Blended & iced', [
        item('Coffee Frappe', '', 110, IMG.icedCoffee),
        item('Vanilla Frappe', '', 105, IMG.cappuccino),
        item('Hot Chocolate', '', 85, IMG.chocolateCake),
        item('Tea', '', 45, IMG.pourOver),
      ]),
    ],
    defaultDesign: makeDesign({
      colors: {
        primary: '#006241',
        secondary: '#007A4D',
        accent: '#C8102E',
        background: '#FFFFFF',
        text: '#006241',
        card: '#FFFFFF',
        button: '#006241',
        border: '#E6E6E6',
      },
      typography: {
        heading: 'poppins',
        body: 'inter',
        menu: 'poppins',
        headingScale: 1.1,
        bodyScale: 1.02,
        headingWeight: 800,
        lineHeight: 1.5,
      },
      layout: {
        header: 'centered',
        hero: 'editorial',
        menuLayout: 'list',
        card: 'flat',
        radius: 8,
        spacing: 1,
        aspect: 'landscape',
        theme: 'custom',
        variant: 'krispy',
      },
    }),
    usageCount: 0,
  },

  /* ---------------------------------------------------------- 18 ---- */
  {
    id: 'sugar-coat',
    name: 'Sugar-Coat',
    category: 'Dessert',
    tagline: 'Cloud-soft rings, candy colors, all day.',
    description:
      'A pastel donut-shop template: split hero, wide grid cards and sweet signage. Same donut-shop family, completely different mood from Glazed Kreme.',
    personality: 'Sweet · Pastel · Wide',
    tags: ['Pastel', 'Grid', 'Donuts'],
    featured: false,
    chips: ['#FF8FAB', '#006241', '#FFF3E0'],
    previewImage: IMG.cupcakes,
    heroImage: IMG.cafeBright,
    gallery: [IMG.cupcakes, IMG.cookies, IMG.chocolateCake, IMG.cafeWindow],
    sample: {
      name: 'Sugar-Coat',
      slug: 'sugarcoat',
      tagline: 'Cloud-soft rings, candy colors, all day.',
      description: 'Tiny donuts with big flavor. Frosted in pink, green and gold.',
      logoText: 'SC',
      logoStyle: 'badge',
      phone: '+20 2 555 0144',
      email: 'hi@sugarcoat.demo',
      address: 'Pastel Lane, Cairo',
      hours: [
        { day: 'Daily', hours: '09:00 – 22:00' },
      ],
      socials: { instagram: '@sugarcoat', facebook: 'sugarcoat', website: 'sugar.example.com' },
    },
    sampleMenu: [
      category('Single Doughnuts', 'Soft rings, bold icing', [
        item('Original Glazed', 'Classic glazed ring', 44, IMG.cupcakes, { featured: true }),
        item('Choco Iced With Sprinkles', 'Chocolate and sprinkles', 54, IMG.cookies, { popular: true }),
        item('Lotus Kreme', 'Lotus kreme filled', 80, IMG.chocolateCake),
      ]),
      category('Minis', 'Shareable boxes', [
        item('OG 4 Minis', 'Four original minis', 107, IMG.pancakes),
        item('Assorted 16 Minis', 'Sixteen assorted minis', 370, IMG.cupcakes, { featured: true }),
      ]),
      category('Drinks', 'Sweet sips', [
        item('Strawberry Frappe', '', 110, IMG.icedCoffee),
        item('Caramel Latte', '', 90, IMG.latteHands),
      ]),
    ],
    defaultDesign: makeDesign({
      colors: {
        primary: '#FF8FAB',
        secondary: '#006241',
        accent: '#FF8FAB',
        background: '#FFF8F0',
        text: '#3D1F2B',
        card: '#FFFFFF',
        button: '#FF8FAB',
        border: '#FFE5EC',
      },
      typography: {
        heading: 'dm-sans',
        body: 'inter',
        menu: 'dm-sans',
        headingScale: 1.05,
        bodyScale: 1.02,
        headingWeight: 700,
        lineHeight: 1.55,
      },
      layout: {
        header: 'minimal',
        hero: 'split',
        menuLayout: 'grid',
        card: 'bordered',
        radius: 16,
        spacing: 2,
        aspect: 'square',
        theme: 'light',
        variant: 'krispy',
      },
    }),
    usageCount: 0,
  },

  /* ---------------------------------------------------------- 19 ---- */
  {
    id: 'kreme-deals',
    name: 'Kreme Deals',
    category: 'Dessert',
    tagline: 'Better together — dozen, minis and combos.',
    description:
      'A deal-first donut template: fullscreen hero, red banner chips and list rows that look like a promo board. Perfect for bundle offers.',
    personality: 'Deal · Bold · Promo',
    tags: ['Deals', 'Combos', 'Dozen'],
    featured: false,
    chips: ['#006241', '#C8102E', '#F5F5F5'],
    previewImage: IMG.tableSpread,
    heroImage: IMG.tableSpread,
    gallery: [IMG.tableSpread, IMG.chocolateCake, IMG.cupcakes, IMG.cookies],
    sample: {
      name: 'Kreme Deals',
      slug: 'kremedeals',
      tagline: 'Better together — dozen, minis and combos.',
      description: 'Dozen deals, minis by the box and better-together combos.',
      logoText: 'KD',
      logoStyle: 'wordmark',
      phone: '+20 2 555 0188',
      email: 'deals@kremedeals.demo',
      address: 'Deal Street, Cairo',
      hours: [
        { day: 'Daily', hours: '08:00 – 23:00' },
      ],
      socials: { instagram: '@kremedeals', facebook: 'kremedeals', website: 'deals.example.com' },
    },
    sampleMenu: [
      category('Doughnuts — Best Deal', 'Dozen deals', [
        item('Dozen — 35% OFF', 'Twelve donuts, assorted', 299, IMG.chocolateCake, { featured: true }),
        item('Half Dozen — 25% OFF', 'Six donuts, assorted', 179, IMG.cupcakes, { popular: true }),
        item('Better Together — 99 EGP', 'Coffee + donut', 99, IMG.icedCoffee, { featured: true }),
        item('Better Together — 119 EGP', 'Cold drink + chocolate donut', 119, IMG.cappuccino),
      ]),
      category('Minis', 'Boxes', [
        item('Assorted 4 Minis', '', 125, IMG.cupcakes),
        item('Assorted 16 Minis', '', 370, IMG.chocolateCake, { popular: true }),
      ]),
    ],
    defaultDesign: makeDesign({
      colors: {
        primary: '#006241',
        secondary: '#004D32',
        accent: '#C8102E',
        background: '#FFFFFF',
        text: '#006241',
        card: '#FFFFFF',
        button: '#C8102E',
        border: '#E6E6E6',
      },
      typography: {
        heading: 'montserrat',
        body: 'inter',
        menu: 'montserrat',
        headingScale: 1.15,
        bodyScale: 1,
        headingWeight: 800,
        lineHeight: 1.45,
      },
      layout: {
        header: 'split',
        hero: 'fullscreen',
        menuLayout: 'list',
        card: 'elevated',
        radius: 10,
        spacing: 1,
        aspect: 'wide',
        theme: 'custom',
        variant: 'krispy',
      },
    }),
    usageCount: 0,
  },

  /* ---------------------------------------------------------- 20 ---- */
  {
    id: 'latte-lab',
    name: 'Latte Lab',
    category: 'Coffee',
    tagline: 'Measured shots, honest extraction.',
    description:
      'A coffee-lab template: minimal header, split hero with a cup on the right, and a price-board list for every brew. Scroll the tabs — the sticky bar follows you.',
    personality: 'Lab · Minimal · Precise',
    tags: ['Coffee', 'Board', 'Minimal'],
    featured: false,
    chips: ['#4A3428', '#A98468', '#FFFFFF'],
    previewImage: IMG.latteHands,
    heroImage: IMG.cappuccino,
    gallery: [IMG.latteHands, IMG.cappuccino, IMG.pourOver, IMG.coffeeBeans],
    sample: {
      name: 'Latte Lab',
      slug: 'lattelab',
      tagline: 'Measured shots, honest extraction.',
      description: 'A small lab brewing single-origin espresso and filter. Every cup measured.',
      logoText: 'LL',
      logoStyle: 'wordmark',
      phone: '+1 (415) 555-0111',
      email: 'lab@lattelab.demo',
      address: '7 Brew Street, Portland, OR',
      hours: [{ day: 'Daily', hours: '07:00 – 18:00' }],
      socials: { instagram: '@lattelab', facebook: 'lattelab', website: 'lab.example.com' },
    },
    sampleMenu: [
      category('Espresso', '18g in, 36g out', [
        item('Espresso', 'Double ristretto', 3.5, IMG.cappuccino),
        item('Americano', 'Long black, single origin', 4, IMG.pourOver),
        item('Flat White', 'Silk milk, 6oz', 4.5, IMG.latteHands, { featured: true }),
        item('Cortado', 'Equal parts', 4.5, IMG.coffeeBeans),
      ]),
      category('Filter Bar', 'V60, Chemex, Batch', [
        item('Single Origin Filter', 'Rotating, notes on board', 5.5, IMG.pourOver, { featured: true }),
        item('Cold Brew', '18-hour steep, on tap', 5, IMG.icedCoffee),
        item('Batch Brew', 'House blend', 3.5, IMG.cappuccino, { popular: true }),
      ]),
      category('Milk Drinks', 'Oat, almond, dairy', [
        item('Honey Oat Latte', 'Local honey', 5.2, IMG.latteHands),
        item('Spanish Latte', 'Condensed milk', 5.5, IMG.cappuccino),
        item('White Mocha', 'White chocolate', 5.5, IMG.icedCoffee),
      ]),
    ],
    defaultDesign: makeDesign({
      colors: {
        primary: '#4A3428',
        secondary: '#8A7361',
        accent: '#A98468',
        background: '#FFFFFF',
        text: '#2B211C',
        card: '#FFFFFF',
        button: '#4A3428',
        border: '#E8E0D6',
      },
      typography: {
        heading: 'montserrat',
        body: 'inter',
        menu: 'montserrat',
        headingScale: 1.1,
        bodyScale: 1,
        headingWeight: 800,
        lineHeight: 1.4,
      },
      layout: {
        header: 'minimal',
        hero: 'split',
        menuLayout: 'board',
        card: 'flat',
        radius: 6,
        spacing: 0,
        aspect: 'landscape',
        theme: 'custom',
        menuDisplay: 'scroll-sticky',
      },
    }),
    usageCount: 0,
  },

  /* ---------------------------------------------------------- 21 ---- */
  {
    id: 'matcha-cloud',
    name: 'Matcha Cloud',
    category: 'Cafe',
    tagline: 'Soft greens, tall glasses, quiet mornings.',
    description:
      'A pastel cafe template with a fullscreen photo hero and portrait dish cards. Scroll the sticky tabs to drift from matcha to cereal.',
    personality: 'Pastel · Airy · Portrait',
    tags: ['Matcha', 'Portrait', 'Grid'],
    featured: false,
    chips: ['#2F7A57', '#FAFCF6', '#D9EAD3'],
    previewImage: IMG.pourOver,
    heroImage: IMG.cafeBright,
    gallery: [IMG.pourOver, IMG.latteHands, IMG.saladBowl, IMG.cafeWindow],
    sample: {
      name: 'Matcha Cloud',
      slug: 'matchacloud',
      tagline: 'Soft greens, tall glasses, quiet mornings.',
      description: 'Matcha, teas and light cereal served in a bright, plant-filled room.',
      logoText: 'MC',
      logoStyle: 'badge',
      phone: '+1 (206) 555-0122',
      email: 'hi@matchacloud.demo',
      address: '22 Leaf Street, Austin, TX',
      hours: [{ day: 'Daily', hours: '08:00 – 18:00' }],
      socials: { instagram: '@matchacloud', facebook: 'matchacloud', website: 'matcha.example.com' },
    },
    sampleMenu: [
      category('Matcha', 'Whisked to order', [
        item('Classic Matcha Latte', 'Ceremonial grade, oat milk', 6, IMG.latteHands, { featured: true }),
        item('Strawberry Matcha', 'Strawberry, oat, ceremonial matcha', 6.5, IMG.icedCoffee, { popular: true }),
        item('Matcha Tonic', 'Tonic, matcha, lime', 6, IMG.pourOver),
      ]),
      category('Teas', 'Loose leaf', [
        item('Jasmine Silver Needle', 'White leaf, floral', 5, IMG.pourOver),
        item('Moroccan Mint', 'Gunpowder green, spearmint', 5, IMG.cappuccino),
      ]),
      category('Cereal & Bowls', 'Light mornings', [
        item('Granola Bowl', 'Yoghurt, seasonal compote', 9.5, IMG.tofuBowl, { featured: true }),
        item('Avocado & Feta Toast', 'Sourdough, dukkah', 12, IMG.avocadoToast),
      ]),
    ],
    defaultDesign: makeDesign({
      colors: {
        primary: '#2F7A57',
        secondary: '#7FA98C',
        accent: '#E1B94B',
        background: '#FFFFFF',
        text: '#16241B',
        card: '#FFFFFF',
        button: '#2F7A57',
        border: '#D9EAD3',
      },
      typography: {
        heading: 'poppins',
        body: 'inter',
        menu: 'inter',
        headingScale: 1,
        bodyScale: 1.05,
        headingWeight: 600,
        lineHeight: 1.6,
      },
      layout: {
        header: 'minimal',
        hero: 'fullscreen',
        menuLayout: 'grid',
        card: 'elevated',
        radius: 24,
        spacing: 2,
        aspect: 'portrait',
        theme: 'light',
        menuDisplay: 'scroll-sticky',
      },
    }),
    usageCount: 0,
  },

  /* ---------------------------------------------------------- 22 ---- */
  {
    id: 'fizz-bar',
    name: 'Fizz Bar',
    category: 'Cafe',
    tagline: 'Fizz, fruit and cold snaps.',
    description:
      'A fizzy juice-bar template: centered header, fullscreen hero and a square grid of colourful drinks. Sticky tabs keep the flavours in reach.',
    personality: 'Fizzy · Colorful · Square',
    tags: ['Juice', 'Square', 'Grid'],
    featured: false,
    chips: ['#C8102E', '#006241', '#FFFFFF'],
    previewImage: IMG.icedCoffee,
    heroImage: IMG.cafeWindow,
    gallery: [IMG.icedCoffee, IMG.latteHands, IMG.pourOver, IMG.saladBowl],
    sample: {
      name: 'Fizz Bar',
      slug: 'fizzbar',
      tagline: 'Fizz, fruit and cold snaps.',
      description: 'Juices, lemonades and iced spritzes blended fresh every morning.',
      logoText: 'FB',
      logoStyle: 'wordmark',
      phone: '+1 (415) 555-0133',
      email: 'fizz@fizzbar.demo',
      address: '9 Spark Street, Los Angeles, CA',
      hours: [{ day: 'Daily', hours: '09:00 – 21:00' }],
      socials: { instagram: '@fizzbar', facebook: 'fizzbar', website: 'fizz.example.com' },
    },
    sampleMenu: [
      category('Lemonades', 'Sparkling & still', [
        item('Yuzu Lemonade', 'Yuzu, sparkling, mint', 5, IMG.icedCoffee, { featured: true }),
        item('Hibiscus Cooler', 'Hibiscus, lime', 5, IMG.latteHands),
      ]),
      category('Juices', 'Pressed at dawn', [
        item('Green Juice', 'Apple, kale, ginger', 6.5, IMG.saladBowl, { popular: true }),
        item('Berry Blast', 'Mixed berries, orange', 6.5, IMG.pancakes),
      ]),
      category('Iced Coffee', 'Cold cups', [
        item('Cold Brew', 'On tap', 5, IMG.icedCoffee),
        item('Caramel Iced Latte', 'Double shot', 5.5, IMG.cappuccino, { featured: true }),
      ]),
    ],
    defaultDesign: makeDesign({
      colors: {
        primary: '#C8102E',
        secondary: '#006241',
        accent: '#F2C230',
        background: '#FFFFFF',
        text: '#1B1714',
        card: '#FFFFFF',
        button: '#C8102E',
        border: '#F2C230',
      },
      typography: {
        heading: 'montserrat',
        body: 'inter',
        menu: 'inter',
        headingScale: 1.05,
        bodyScale: 1,
        headingWeight: 800,
        lineHeight: 1.5,
      },
      layout: {
        header: 'centered',
        hero: 'fullscreen',
        menuLayout: 'grid',
        card: 'bordered',
        radius: 14,
        spacing: 1,
        aspect: 'square',
        theme: 'custom',
        menuDisplay: 'scroll-sticky',
      },
    }),
    usageCount: 0,
  },

  /* ---------------------------------------------------------- 23 ---- */
  {
    id: 'cacao-house',
    name: 'Cacao House',
    category: 'Cafe',
    tagline: 'Dark cocoa, hot and cold.',
    description:
      'A dark cocoa-house template: centered header, editorial hero and a slow list. Sticky tabs make the hot/cold flip one thumb away.',
    personality: 'Dark · Cocoa · Slow',
    tags: ['Cocoa', 'List', 'Warm'],
    featured: false,
    chips: ['#3B1F0E', '#FFF4E0', '#6F4E37'],
    previewImage: IMG.chocolateCake,
    heroImage: IMG.cafeTerrace,
    gallery: [IMG.chocolateCake, IMG.icedCoffee, IMG.cappuccino, IMG.platedDessert],
    sample: {
      name: 'Cacao House',
      slug: 'cacaohouse',
      tagline: 'Dark cocoa, hot and cold.',
      description: 'Hot chocolates, cocoa drinks and iced brews under warm light.',
      logoText: 'CH',
      logoStyle: 'monogram',
      phone: '+1 (415) 555-0144',
      email: 'hello@cacao.demo',
      address: '31 Cocoa Lane, San Francisco, CA',
      hours: [{ day: 'Daily', hours: '08:00 – 20:00' }],
      socials: { instagram: '@cacaohouse', facebook: 'cacaohouse', website: 'cacao.example.com' },
    },
    sampleMenu: [
      category('Hot Cocoa', 'Whipped & salted', [
        item('Classic Hot Cocoa', 'Single origin, whipped cream', 5.5, IMG.chocolateCake, { featured: true }),
        item('Mexican Hot Cocoa', 'Cinnamon, nutmeg', 6, IMG.cappuccino),
      ]),
      category('Iced Cocoa', 'Cold & creamy', [
        item('Iced Cocoa', 'Double strength', 5.5, IMG.icedCoffee, { popular: true }),
        item('Choco Creme', 'Espresso, cocoa foam', 6, IMG.latteHands),
      ]),
      category('Pairings', 'Made to dunk', [
        item('Choco Chip Cookie', 'Warm, sea salt', 4, IMG.cookies, { featured: true }),
        item('Brownie Bite', 'Fudge center', 4.5, IMG.chocolateCake),
      ]),
    ],
    defaultDesign: makeDesign({
      colors: {
        primary: '#8A5A3B',
        secondary: '#6F4E37',
        accent: '#D4A373',
        background: '#FFF4E0',
        text: '#2B1D18',
        card: '#FFFFFF',
        button: '#8A5A3B',
        border: '#E8D5C4',
      },
      typography: {
        heading: 'playfair',
        body: 'inter',
        menu: 'lora',
        headingScale: 1.05,
        bodyScale: 1,
        headingWeight: 600,
        lineHeight: 1.6,
      },
      layout: {
        header: 'centered',
        hero: 'editorial',
        menuLayout: 'list',
        card: 'flat',
        radius: 4,
        spacing: 2,
        aspect: 'landscape',
        theme: 'warm',
        menuDisplay: 'scroll-sticky',
      },
    }),
    usageCount: 0,
  },

  /* ---------------------------------------------------------- 24 ---- */
  {
    id: 'golden-oven',
    name: 'Golden Oven',
    category: 'Bakery',
    tagline: 'Comedy of butter, flour and fire.',
    description:
      'A classic French bakery template: split header, editorial hero and a wide grid. Scroll the sticky tabs from croissants to gateaux.',
    personality: 'French · Warm · Wide',
    tags: ['Bakery', 'Grid', 'French'],
    featured: false,
    chips: ['#D4A373', '#FFF8F0', '#8B4513'],
    previewImage: IMG.chocolateCake,
    heroImage: IMG.cafeTerrace,
    gallery: [IMG.chocolateCake, IMG.artisanBread, IMG.cupcakes, IMG.cafeWindow],
    sample: {
      name: 'Golden Oven',
      slug: 'goldenoven',
      tagline: 'Comedy of butter, flour and fire.',
      description: 'Laminated pastries and naturally leavened loaves from a wood-fired corner oven.',
      logoText: 'GO',
      logoStyle: 'badge',
      phone: '+1 (415) 555-0155',
      email: 'bonjour@goldenoven.demo',
      address: '14 Oven Street, San Francisco, CA',
      hours: [{ day: 'Daily', hours: '07:00 – 19:00' }],
      socials: { instagram: '@goldenoven', facebook: 'goldenoven', website: 'golden.example.com' },
    },
    sampleMenu: [
      category('Viennoiserie', 'Laminated at 4am', [
        item('Croissant au Beurre', '72-hour lamination', 4.5, IMG.frenchToast, { featured: true, popular: true }),
        item('Pain au Chocolat', 'Two batons, 27% butter', 4.8, IMG.pancakes),
        item('Moroccan Twist', 'Orange blossom sugar', 5, IMG.artisanBread),
      ]),
      category('Loaves', 'Natural levain', [
        item('Seeded Sourdough', 'Sunflower, flax', 8, IMG.artisanBread, { featured: true }),
        item('Baguette de Tradition', 'Stone milled flour', 4, IMG.artisanBread),
      ]),
      category('Gateaux', 'Whole cakes', [
        item('Chocolate Fudge Gateau', 'Dark ganache', 42, IMG.chocolateCake, { featured: true }),
        item('Celebration Layer', 'Six layers, vanilla', 46, IMG.rainbowCake),
      ]),
    ],
    defaultDesign: makeDesign({
      colors: {
        primary: '#8B4513',
        secondary: '#A98468',
        accent: '#D4A373',
        background: '#FFF8F0',
        text: '#3A2614',
        card: '#FFFFFF',
        button: '#8B4513',
        border: '#E8D5C4',
      },
      typography: {
        heading: 'playfair',
        body: 'inter',
        menu: 'lora',
        headingScale: 1.05,
        bodyScale: 1,
        headingWeight: 600,
        lineHeight: 1.6,
      },
      layout: {
        header: 'split',
        hero: 'editorial',
        menuLayout: 'grid',
        card: 'bordered',
        radius: 10,
        spacing: 1,
        aspect: 'wide',
        theme: 'warm',
        menuDisplay: 'scroll-sticky',
      },
    }),
    usageCount: 0,
  },

  /* ---------------------------------------------------------- 25 ---- */
  {
    id: 'frosted-atelier',
    name: 'Frosted Atelier',
    category: 'Bakery',
    tagline: 'Tall cakes, soft frosting, Parisian light.',
    description:
      'A pastel pâtisserie template: centered header, split hero and portrait cards with cloud frosting. Sticky tabs drift from entremets to petit gateaux.',
    personality: 'Pastel · Parisian · Portrait',
    tags: ['Patisserie', 'Portrait', 'Pastel'],
    featured: false,
    chips: ['#F9E8E8', '#6F4E37', '#FFFFFF'],
    previewImage: IMG.cupcakes,
    heroImage: IMG.cafeWindow,
    gallery: [IMG.cupcakes, IMG.rainbowCake, IMG.platedDessert, IMG.cafeTerrace],
    sample: {
      name: 'Frosted Atelier',
      slug: 'frostedatelier',
      tagline: 'Tall cakes, soft frosting, Parisian light.',
      description: 'Entremets and petit gateaux in a quiet, marble-lit atelier.',
      logoText: 'FA',
      logoStyle: 'monogram',
      phone: '+1 (415) 555-0166',
      email: 'atelier@frosted.demo',
      address: '18 Marble Lane, San Jose, CA',
      hours: [{ day: 'Daily', hours: '09:00 – 18:00' }],
      socials: { instagram: '@frostedatelier', facebook: 'frostedatelier', website: 'atelier2.example.com' },
    },
    sampleMenu: [
      category('Entremets', 'Whole cakes · 48h notice', [
        item('Jardin d\u2019Été', 'Vanilla, raspberry, pistachio', 52, IMG.rainbowCake, { featured: true }),
        item('Chocolat Grand Cru', '70% ganache, praline', 48, IMG.chocolateCake, { popular: true }),
      ]),
      category('Petit Gâteaux', 'By the piece', [
        item('Vanilla Cupcake', 'Brown butter frosting', 4.5, IMG.cupcakes, { featured: true }),
        item('Tarte au Citron', 'Torched meringue', 38, IMG.platedDessert, { featured: true }),
      ]),
      category('Tea & Coffee', 'From the counter', [
        item('Thé Maison', 'Bergamot, rose', 5, IMG.cappuccino),
        item('Iced Latte', 'Double shot', 5.5, IMG.icedCoffee),
      ]),
    ],
    defaultDesign: makeDesign({
      colors: {
        primary: '#6F4E37',
        secondary: '#B08968',
        accent: '#FF8FAB',
        background: '#FFFFFF',
        text: '#3A2A20',
        card: '#FFFFFF',
        button: '#6F4E37',
        border: '#F9E8E8',
      },
      typography: {
        heading: 'playfair',
        body: 'inter',
        menu: 'lora',
        headingScale: 1.06,
        bodyScale: 1,
        headingWeight: 500,
        lineHeight: 1.6,
      },
      layout: {
        header: 'centered',
        hero: 'split',
        menuLayout: 'grid',
        card: 'elevated',
        radius: 18,
        spacing: 2,
        aspect: 'portrait',
        theme: 'light',
        menuDisplay: 'scroll-sticky',
      },
    }),
    usageCount: 0,
  },

  /* ---------------------------------------------------------- 26 ---- */
  {
    id: 'sourdough-social',
    name: 'Sourdough Social',
    category: 'Bakery',
    tagline: 'Slow fermentation, honest loaves.',
    description:
      'A rustic sourdough template: minimal header, editorial hero and a price-board for loaves. Sticky tabs keep the daily bake in sight.',
    personality: 'Rustic · Board · Minimal',
    tags: ['Sourdough', 'Board', 'Minimal'],
    featured: false,
    chips: ['#5C6B57', '#E8DCC3', '#FFFFFF'],
    previewImage: IMG.artisanBread,
    heroImage: IMG.cafeInterior,
    gallery: [IMG.artisanBread, IMG.frenchToast, IMG.pancakes, IMG.cafeBright],
    sample: {
      name: 'Sourdough Social',
      slug: 'sourdoughsocial',
      tagline: 'Slow fermentation, honest loaves.',
      description: 'Naturally leavened squares and loaves from overnight fermentation.',
      logoText: 'SS',
      logoStyle: 'wordmark',
      phone: '+1 (512) 555-0177',
      email: 'loaves@sourdough.demo',
      address: '12 Ferment Ave, Austin, TX',
      hours: [{ day: 'Daily', hours: '08:00 – 17:00' }],
      socials: { instagram: '@sourdoughsocial', facebook: 'sourdoughsocial', website: 'social.example.com' },
    },
    sampleMenu: [
      category('Loaves', '48-hour ferment', [
        item('Rustic Sourdough', 'Sea salt, cracked wheat', 8, IMG.artisanBread, { featured: true }),
        item('Seeded Sourdough', 'Sunflower, flax', 9, IMG.artisanBread, { popular: true }),
        item('Olive & Herb', 'Castelvetrano, rosemary', 10, IMG.frenchToast),
      ]),
      category('Bakes', 'Morning counter', [
        item('Morning Bun', 'Cardamom sugar', 5, IMG.pancakes, { featured: true }),
        item('Brioche', 'Brown butter', 6, IMG.frenchToast),
      ]),
    ],
    defaultDesign: makeDesign({
      colors: {
        primary: '#5C6B57',
        secondary: '#9A8B6F',
        accent: '#D4A373',
        background: '#FFFFFF',
        text: '#1F2E1F',
        card: '#FFFFFF',
        button: '#5C6B57',
        border: '#E8DCC3',
      },
      typography: {
        heading: 'poppins',
        body: 'inter',
        menu: 'inter',
        headingScale: 1,
        bodyScale: 1,
        headingWeight: 700,
        lineHeight: 1.5,
      },
      layout: {
        header: 'minimal',
        hero: 'editorial',
        menuLayout: 'board',
        card: 'flat',
        radius: 4,
        spacing: 0,
        aspect: 'landscape',
        theme: 'light',
        menuDisplay: 'scroll-sticky',
      },
    }),
    usageCount: 0,
  },

  /* ---------------------------------------------------------- 27 ---- */
  {
    id: 'fork-cup',
    name: 'Fork & Cup',
    category: 'Restaurant',
    tagline: 'Eatery meets coffee house.',
    description:
      'A full bistro template: split header, split hero and compact rows (thumb + price). Scroll the sticky tabs across eatery, coffee and dessert.',
    personality: 'Bistro · Compact · Split',
    tags: ['Bistro', 'Compact', 'Split'],
    featured: false,
    chips: ['#C1442E', '#3F5D45', '#FBF6EE'],
    previewImage: IMG.pizzaBoard,
    heroImage: IMG.classicDiningRoom,
    gallery: [IMG.pizzaBoard, IMG.mushroomPasta, IMG.cappuccino, IMG.classicDiningRoom],
    sample: {
      name: 'Fork & Cup',
      slug: 'forkcup',
      tagline: 'Eatery meets coffee house.',
      description: 'All-day bistro: handmade pasta, grilled plates and proper coffee.',
      logoText: 'FC',
      logoStyle: 'monogram',
      phone: '+1 (415) 555-0188',
      email: 'hello@forkcup.demo',
      address: '42 Fork Street, San Francisco, CA',
      hours: [{ day: 'Daily', hours: '08:00 – 22:00' }],
      socials: { instagram: '@forkcup', facebook: 'forkcup', website: 'fork.example.com' },
    },
    sampleMenu: [
      category('Eatery', 'Handmade daily', [
        item('Tagliatelle ai Funghi', 'Mushroom, thyme', 19, IMG.mushroomPasta, { featured: true }),
        item('Margherita D.O.P.', 'San Marzano, fior di latte', 16, IMG.pizzaBoard, { popular: true }),
        item('Tagliata di Manzo', 'Ribeye, rocket', 32, IMG.slicedSteak),
      ]),
      category('Coffee', 'Short and tall', [
        item('Flat White', 'Silk milk', 4.5, IMG.cappuccino, { featured: true }),
        item('Cold Brew', 'On tap', 5, IMG.icedCoffee),
      ]),
      category('Dessert', 'Sweet finish', [
        item('Tiramisù Classico', 'Mascarpone, espresso', 9, IMG.platedDessert, { featured: true }),
        item('Torta al Cioccolato', 'Warm chocolate center', 10, IMG.chocolateCake),
      ]),
    ],
    defaultDesign: makeDesign({
      colors: {
        primary: '#3F5D45',
        secondary: '#7A7461',
        accent: '#C1442E',
        background: '#FBF6EE',
        text: '#221B14',
        card: '#FFFFFF',
        button: '#C1442E',
        border: '#E8DCC3',
      },
      typography: {
        heading: 'playfair',
        body: 'inter',
        menu: 'lora',
        headingScale: 1.05,
        bodyScale: 1,
        headingWeight: 600,
        lineHeight: 1.6,
      },
      layout: {
        header: 'split',
        hero: 'split',
        menuLayout: 'compact',
        card: 'bordered',
        radius: 12,
        spacing: 1,
        aspect: 'landscape',
        theme: 'light',
        menuDisplay: 'scroll-sticky',
      },
    }),
    usageCount: 0,
  },

  /* ---------------------------------------------------------- 28 ---- */
  {
    id: 'smash-house',
    name: 'Smash House',
    category: 'Restaurant',
    tagline: 'Smashed fast, stacked loud.',
    description:
      'A street-food template: minimal header, fullscreen hero and a price-board for burgers, shakes and sides. Sticky tabs keep the stack coming.',
    personality: 'Street · Loud · Board',
    tags: ['Street', 'Board', 'Fast'],
    featured: false,
    chips: ['#0F0F0F', '#F2C230', '#FFFFFF'],
    previewImage: IMG.dramaticBurger,
    heroImage: IMG.burgersBoard,
    gallery: [IMG.dramaticBurger, IMG.doubleBurger, IMG.burgersBoard, IMG.deliSandwich],
    sample: {
      name: 'Smash House',
      slug: 'smashhouse',
      tagline: 'Smashed fast, stacked loud.',
      description: 'Flat-top smashed patties, loaded fries and thick shakes.',
      logoText: 'SH',
      logoStyle: 'wordmark',
      phone: '+1 (312) 555-0166',
      email: 'yo@smashhouse.demo',
      address: '78 Market Row, Chicago, IL',
      hours: [{ day: 'Daily', hours: '11:30 – 23:00' }],
      socials: { instagram: '@smashhouse', facebook: 'smashhouse', website: 'smash.example.com' },
    },
    sampleMenu: [
      category('Burgers', 'Smashed to order', [
        item('The House Smash', 'Double patty, cheddar, house sauce', 13.5, IMG.doubleBurger, { featured: true, popular: true }),
        item('Classic Smash', 'Single, pickles, onion', 10.5, IMG.classicBurger),
        item('Tower Stack', 'Triple patty, bacon jam', 17, IMG.dramaticBurger, { featured: true }),
      ]),
      category('Loaded & Shakes', 'Fries and shakes', [
        item('Loaded Fries', 'Cheese sauce, brisket', 9.5, IMG.steakFrites, { popular: true }),
        item('Salted Malt Shake', 'Vanilla malt', 6.5, IMG.icedCoffee),
        item('Espresso Shake', 'Cold brew, chocolate', 7, IMG.latteHands),
      ]),
    ],
    defaultDesign: makeDesign({
      colors: {
        primary: '#0F0F0F',
        secondary: '#9A9A9A',
        accent: '#F2C230',
        background: '#FFFFFF',
        text: '#0F0F0F',
        card: '#FFFFFF',
        button: '#0F0F0F',
        border: '#111111',
      },
      typography: {
        heading: 'montserrat',
        body: 'inter',
        menu: 'montserrat',
        headingScale: 1.15,
        bodyScale: 1,
        headingWeight: 800,
        lineHeight: 1.4,
      },
      layout: {
        header: 'minimal',
        hero: 'fullscreen',
        menuLayout: 'board',
        card: 'flat',
        radius: 2,
        spacing: 0,
        aspect: 'wide',
        theme: 'custom',
        menuDisplay: 'scroll-sticky',
      },
    }),
    usageCount: 0,
  },

  /* ---------------------------------------------------------- 29 ---- */
  {
    id: 'wood-fired-co',
    name: 'Wood-Fired Co.',
    category: 'Restaurant',
    tagline: 'Wood fire, hand-rolled dough, cold pours.',
    description:
      'A wood-fired template with a horizontal deck for dishes — swipe the pizzas. Sticky tabs keep the oven categories aligned.',
    personality: 'Wood-fired · Deck · Wide',
    tags: ['Pizza', 'Deck', 'Swipe'],
    featured: false,
    chips: ['#B45309', '#FDF6EC', '#1B1714'],
    previewImage: IMG.pizzaBoard,
    heroImage: IMG.classicDiningRoom,
    gallery: [IMG.pizzaBoard, IMG.margherita, IMG.pizzaSlice, IMG.pastaWineTable],
    sample: {
      name: 'Wood-Fired Co.',
      slug: 'woodfiredco',
      tagline: 'Wood fire, hand-rolled dough, cold pours.',
      description: '48-hour dough, wood-fired pizzas and grilled plates.',
      logoText: 'WF',
      logoStyle: 'monogram',
      phone: '+1 (415) 555-0144',
      email: 'ciao@woodfired.demo',
      address: '90 Fire Lane, San Francisco, CA',
      hours: [{ day: 'Daily', hours: '12:00 – 22:00' }],
      socials: { instagram: '@woodfiredco', facebook: 'woodfiredco', website: 'wood.example.com' },
    },
    sampleMenu: [
      category('Pizzas', '48-hour dough', [
        item('Margherita D.O.P.', 'San Marzano, fior di latte', 16, IMG.margherita, { featured: true, popular: true }),
        item('Quattro Formaggi', 'Four cheeses', 19, IMG.pizzaBoard),
        item('Diavola', 'Spicy salami, honey', 18, IMG.pizzaSlice, { featured: true }),
      ]),
      category('Pasta & Grill', 'From the fire', [
        item('Spaghetti ai Frutti di Mare', 'Clams and mussels', 23, IMG.pastaWineTable, { featured: true }),
        item('Tagliatelle ai Funghi', 'Wild mushroom', 19, IMG.mushroomPasta),
        item('Tagliata di Manzo', 'Ribeye, rocket', 32, IMG.slicedSteak),
      ]),
      category('Pours', 'Cold & hot', [
        item('Cold Brew', 'On tap', 5, IMG.icedCoffee),
        item('House Sgroppino', 'Prosecco, lemon', 8, IMG.cappuccino),
      ]),
    ],
    defaultDesign: makeDesign({
      colors: {
        primary: '#B45309',
        secondary: '#9A3412',
        accent: '#B45309',
        background: '#FDF6EC',
        text: '#451A03',
        card: '#FFFFFF',
        button: '#B45309',
        border: '#FED7AA',
      },
      typography: {
        heading: 'playfair',
        body: 'inter',
        menu: 'lora',
        headingScale: 1.05,
        bodyScale: 1,
        headingWeight: 700,
        lineHeight: 1.6,
      },
      layout: {
        header: 'centered',
        hero: 'editorial',
        menuLayout: 'deck',
        card: 'bordered',
        radius: 8,
        spacing: 1,
        aspect: 'wide',
        theme: 'warm',
        menuDisplay: 'scroll-sticky',
      },
    }),
    usageCount: 0,
  },

  /* ---------------------------------------------------------- 30 ---- */
  {
    id: 'garden-plate',
    name: 'Garden Plate',
    category: 'Healthy',
    tagline: 'Plants first, portions generous.',
    description:
      'A fresh garden template: minimal header, split hero and compact square meals. Scroll from bowls to juice through the sticky tabs.',
    personality: 'Fresh · Compact · Square',
    tags: ['Healthy', 'Compact', 'Jucile'],
    featured: false,
    chips: ['#2F7A57', '#E1B94B', '#FAFCF6'],
    previewImage: IMG.tofuBowl,
    heroImage: IMG.cafeBright,
    gallery: [IMG.tofuBowl, IMG.saladBowl, IMG.healthyPlate, IMG.saladPlate],
    sample: {
      name: 'Garden Plate',
      slug: 'gardenplate',
      tagline: 'Plants first, portions generous.',
      description: 'Vegetable-forward plates from farms within 100 miles.',
      logoText: 'GP',
      logoStyle: 'badge',
      phone: '+1 (512) 555-0155',
      email: 'eat@gardenplate.demo',
      address: '300 Cedar Road, Austin, TX',
      hours: [{ day: 'Daily', hours: '11:00 – 21:00' }],
      socials: { instagram: '@gardenplate', facebook: 'gardenplate', website: 'garden.example.com' },
    },
    sampleMenu: [
      category('Bowls', 'Brown rice or greens', [
        item('Sunshine Grain Bowl', 'Pumpkin, tofu, tahini', 15, IMG.tofuBowl, { featured: true, popular: true }),
        item('Market Harvest Bowl', 'Seasonal veg, herbs', 14, IMG.healthyPlate),
      ]),
      category('Salads & Toasts', 'Dressed to order', [
        item('Green Goddess', 'Little gem, avocado', 13, IMG.saladBowl, { popular: true }),
        item('Avocado Toast', 'Sourdough, chilli', 12.5, IMG.avocadoToast, { featured: true }),
      ]),
      category('Cold Pressed', 'Juices & tonic', [
        item('Cold Brew Tonic', 'Citrus, tonic', 5.5, IMG.icedCoffee),
        item('Golden Latte', 'Turmeric, oat milk', 5, IMG.latteHands),
      ]),
    ],
    defaultDesign: makeDesign({
      colors: {
        primary: '#2F7A57',
        secondary: '#7FA98C',
        accent: '#E1B94B',
        background: '#FFFFFF',
        text: '#16241B',
        card: '#FFFFFF',
        button: '#2F7A57',
        border: '#D9EAD3',
      },
      typography: {
        heading: 'poppins',
        body: 'inter',
        menu: 'inter',
        headingScale: 1.04,
        bodyScale: 1.04,
        headingWeight: 700,
        lineHeight: 1.5,
      },
      layout: {
        header: 'minimal',
        hero: 'split',
        menuLayout: 'compact',
        card: 'elevated',
        radius: 16,
        spacing: 2,
        aspect: 'square',
        theme: 'light',
        menuDisplay: 'scroll-sticky',
      },
    }),
    usageCount: 0,
  },
]

function meatballs(): MenuItem {
  return item('Polpette della Nonna', 'Beef & pork meatballs, sugo, parmesan', 13, IMG.tableSpread)
}

/* ------------------------------------------------------------------ *
 * Super-admin duplicated designs live in the platform store (they are
 * user data, not stock data), so this module never imports the store.
 * The store injects a read-only provider instead â€” see usePlatform.ts.
 * ------------------------------------------------------------------ */

export interface CustomTemplateSeed {
  /** stock template the super admin duplicated */
  baseTemplateId: string
  name: string
  category?: string
}

let customTemplatesProvider: (() => CustomTemplateSeed[]) | null = null
let templateOverridesProvider: (() => Record<string, import('../../shared/lib/types.ts').TemplateOverride>) | null = null

/** Called once at startup with a reader for the platform store's duplicates. */
export function registerCustomTemplates(provider: () => CustomTemplateSeed[]): void {
  customTemplatesProvider = provider
}

/** Overrides from DB (TemplateOverrides) keyed by base_template_id — images, hero texts, videos, design. */
export function registerTemplateOverrides(
  provider: () => Record<string, import('../../shared/lib/types.ts').TemplateOverride>
): void {
  templateOverridesProvider = provider
}

function getOverrideFor(baseId: string) {
  const map = templateOverridesProvider?.() || {}
  return map[baseId] || null
}

function applyTemplateOverride(tpl: TemplateDefinition): TemplateDefinition {
  const override = getOverrideFor(tpl.id)
  if (!override) return tpl
  const merged: TemplateDefinition = { ...tpl }
  if (override.previewImage) merged.previewImage = override.previewImage
  if (override.heroImage) merged.heroImage = override.heroImage
  if (override.heroImageMobile) merged.heroImageMobile = override.heroImageMobile
  if (override.heroVideoDesktop) merged.heroVideoDesktop = override.heroVideoDesktop
  if (override.heroVideoMobile) merged.heroVideoMobile = override.heroVideoMobile
  // legacy single video field for renderers that still read heroVideo
  if (override.heroVideoDesktop && !merged.heroVideo) merged.heroVideo = override.heroVideoDesktop
  if (Array.isArray(override.gallery) && override.gallery.length) merged.gallery = [...override.gallery]
  if (override.heroTitle || override.heroSubtitle) {
    merged.sample = {
      ...merged.sample,
      tagline: override.heroSubtitle || merged.sample.tagline,
      description: override.heroTitle ? override.heroSubtitle || merged.sample.description : merged.sample.description,
    }
    if (override.heroTitle) merged.tagline = override.heroTitle
    if (override.heroSubtitle) merged.description = override.heroSubtitle
  }
  if (override.design) {
    const d = override.design as Partial<DesignConfiguration>
    merged.defaultDesign = {
      ...merged.defaultDesign,
      ...(d.colors ? { colors: { ...merged.defaultDesign.colors, ...d.colors } } : {}),
      ...(d.typography ? { typography: { ...merged.defaultDesign.typography, ...d.typography } } : {}),
      ...(d.layout ? { layout: { ...merged.defaultDesign.layout, ...d.layout } } : {}),
    }
  }
  return merged
}

/** Stable public id for a duplicated design ("My CafÃ©" â†’ "custom-my-cafÃ©"). */
export function customTemplateId(name: string): string {
  const slug =
    name
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '') || 'template'
  return `custom-${slug}`
}

function resolveCategory(value: string | undefined, fallback: TemplateCategory): TemplateCategory {
  const match = TEMPLATE_CATEGORIES.find(
    (c) => c !== 'All' && c.toLowerCase() === value?.toLowerCase()
  )
  return (match as TemplateCategory) ?? fallback
}

/** Duplicated designs rendered as full template definitions (design of the base). */
function customTemplateDefinitions(): TemplateDefinition[] {
  if (!customTemplatesProvider) return []
  return customTemplatesProvider().map((custom) => {
    const base = TEMPLATES.find((t) => t.id === custom.baseTemplateId) ?? TEMPLATES[0]
    const merged = applyTemplateOverride(base)
    return {
      ...merged,
      id: customTemplateId(custom.name),
      name: custom.name,
      category: resolveCategory(custom.category, base.category),
      featured: false,
      usageCount: 0,
      custom: true,
    }
  })
}

/** Every design a visitor can pick — super-admin duplicates first, then stock (with overrides merged). */
export function allTemplates(): TemplateDefinition[] {
  const customs = customTemplateDefinitions()
  const stock = TEMPLATES.map(applyTemplateOverride)
  return customs.length ? [...customs, ...stock] : stock
}

export function hasTemplate(id: string): boolean {
  return allTemplates().some((t) => t.id === id)
}

export function getTemplate(id: string): TemplateDefinition {
  return allTemplates().find((t) => t.id === id) ?? TEMPLATES[0]
}

export const TEMPLATE_CATEGORIES = [
  'All',
  'Fine Dining',
  'Restaurant',
  'Cafe',
  'Coffee',
  'Bakery',
  'Dessert',
  'Healthy',
] as const

/** Deep-cloned sample restaurant used by the template preview experience. */
export function buildTemplatePreviewRestaurant(templateId: string) {
  const t = getTemplate(templateId)
  const now = new Date().toISOString()
  return {
    id: `preview-${t.id}`,
    name: t.sample.name,
    slug: t.sample.slug,
    tagline: t.sample.tagline,
    description: t.sample.description,
    logoText: t.sample.logoText,
    logoStyle: t.sample.logoStyle,
    heroImage: t.heroImage,
    heroImageMobile: t.heroImageMobile || t.heroImage,
    heroVideo: t.heroVideo || t.heroVideoDesktop || '',
    heroVideoDesktop: t.heroVideoDesktop || t.heroVideo || '',
    heroVideoMobile: t.heroVideoMobile || '',
    gallery: [...t.gallery],
    phone: t.sample.phone,
    email: t.sample.email,
    address: t.sample.address,
    hours: structuredClone(t.sample.hours),
    socials: { ...t.sample.socials },
    templateId: t.id,
    design: structuredClone(t.defaultDesign),
    menu: structuredClone(t.sampleMenu),
    status: 'published' as const,
    plan: 'professional' as const,
    stats: { views: 0, qrScans: 0, trend: [0, 0, 0, 0, 0, 0, 0] },
    updatedAt: now,
  }
}
