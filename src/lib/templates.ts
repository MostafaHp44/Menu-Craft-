import type {
  ColorSet,
  DesignConfiguration,
  LayoutConfig,
  MenuCategory,
  MenuItem,
  OpeningHour,
  SectionId,
  SectionState,
  TemplateDefinition,
  TypographyConfig,
} from './types'
import { IMG } from './images'

/* ------------------------------------------------------------------ *
 * Design construction helpers — every template is assembled from the
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
  { day: 'Tuesday – Thursday', hours: '17:00 – 23:00' },
  { day: 'Friday – Saturday', hours: '17:00 – 00:00' },
  { day: 'Sunday', hours: '17:00 – 22:00' },
]

const CAFE_HOURS: OpeningHour[] = [
  { day: 'Monday – Friday', hours: '07:00 – 18:00' },
  { day: 'Saturday', hours: '08:00 – 18:00' },
  { day: 'Sunday', hours: '08:00 – 16:00' },
]

const BAKERY_HOURS: OpeningHour[] = [
  { day: 'Tuesday – Friday', hours: '07:00 – 19:00' },
  { day: 'Saturday – Sunday', hours: '08:00 – 18:00' },
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
    personality: 'Luxe · Dark · Editorial',
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
      socials: { instagram: '@theroyal', facebook: 'theroyal', website: 'theroyal.menucraft.com' },
    },
    sampleMenu: [
      category('Overture', 'First bites and cold openings', [
        item('Hand Dived Scallop', 'Brown butter, cauliflower, caviar', 26, IMG.fineDiningPlate, {
          featured: true,
        }),
        item('Heritage Beetroot', 'Chèvre, walnut, aged balsamic', 18, IMG.saladPlate),
        item('Velouté of Celeriac', 'Truffle, chive oil, crème fraîche', 16, IMG.soupBowl, {
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
        item('Salted Caramel Custard', 'Toasted honey, crème double', 14, IMG.platedDessert, {
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
      'A confident city-café template with a split hero, oversized sans headlines and a square menu grid that photographs beautifully on mobile.',
    personality: 'Modern · Bold · Graphic',
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
        'A corner café serving single-origin espresso, slow ferments and a short all-day kitchen menu. Dogs welcome, laptops until noon.',
      logoText: 'UC',
      logoStyle: 'monogram',
      phone: '+1 (212) 555-0177',
      email: 'hey@urbancafe.demo',
      address: '9 Bond Street, New York, NY',
      hours: CAFE_HOURS,
      socials: { instagram: '@urbancafe', facebook: 'urbancafe', website: 'urban.menucraft.com' },
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
    tagline: 'Butter, flour, patience — baked before sunrise.',
    description:
      'A romantic bakery template with editorial hero composition, portrait imagery and soft elevated cards. Perfect for pastry counters and pre-order collections.',
    personality: 'Romantic · Soft · Artisan',
    tags: ['Warm', 'Serif', 'Portrait imagery'],
    featured: true,
    chips: ['#A05C4B', '#C2703F', '#FBF4EF'],
    previewImage: IMG.chocolateCake,
    heroImage: IMG.cafeWindow,
    gallery: [IMG.chocolateCake, IMG.artisanBread, IMG.cupcakes, IMG.cafeWindow],
    sample: {
      name: 'Sweet Atelier',
      slug: 'atelier',
      tagline: 'Butter, flour, patience — baked before sunrise.',
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
        website: 'atelier.menucraft.com',
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
    personality: 'Punchy · Loud · Street',
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
        { day: 'Monday – Thursday', hours: '11:30 – 23:00' },
        { day: 'Friday – Saturday', hours: '11:30 – 01:00' },
        { day: 'Sunday', hours: '12:00 – 22:00' },
      ],
      socials: {
        instagram: '@burgerdistrict',
        facebook: 'burgerdistrict',
        website: 'district.menucraft.com',
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
        item('District Loaded Fries', 'Cheese sauce, brisket, jalapeño', 9.5, IMG.steakFrites),
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
    personality: 'Rustic · Warm · Generous',
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
        'A family kitchen serving the recipes Nonna brought from Emilia-Romagna — hand-rolled pasta, dough fermented for 48 hours and wine poured by the carafe.',
      logoText: 'BK',
      logoStyle: 'monogram',
      phone: '+1 (617) 555-0188',
      email: 'ciao@bellakitchen.demo',
      address: '12 Harbor Street, Boston, MA',
      hours: [
        { day: 'Monday', hours: 'Closed' },
        { day: 'Tuesday – Thursday', hours: '17:00 – 22:30' },
        { day: 'Friday – Saturday', hours: '17:00 – 23:30' },
        { day: 'Sunday', hours: '12:00 – 21:00' },
      ],
      socials: { instagram: '@bellaitalia', facebook: 'bellaitalia', website: 'bella.menucraft.com' },
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
        item('Penne all’Arrabbiata', 'Tomato, garlic, calabrian chilli', 16, IMG.penneArrabbiata),
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
        item('Costolette d’Agnello', 'Slow braised, tomato, olives', 29, IMG.ribs),
      ]),
      category('Dolci', 'Made by Marta', [
        item('Tiramisù Classico', 'Mascarpone, espresso, cocoa', 9, IMG.platedDessert, {
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
    personality: 'Calm · Minimal · Craft',
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
      socials: { instagram: '@beanbrew', facebook: 'beanbrew', website: 'brew.menucraft.com' },
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
    personality: 'Fresh · Bright · Airy',
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
        { day: 'Monday – Friday', hours: '11:00 – 21:00' },
        { day: 'Saturday', hours: '10:00 – 21:00' },
        { day: 'Sunday', hours: '10:00 – 20:00' },
      ],
      socials: { instagram: '@greentable', facebook: 'greentable', website: 'green.menucraft.com' },
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
        item('Carrot & Ginger Velouté', 'Coconut, chilli oil, seeds', 10, IMG.soupBowl),
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
    personality: 'Parisian · Refined · Golden',
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
        'A marble counter of entremets, petits gâteaux and viennoiserie, made in a small kitchen behind the shop. Tea served until five.',
      logoText: 'MP',
      logoStyle: 'monogram',
      phone: '+1 (415) 555-0190',
      email: 'bonjour@maisonpatisserie.demo',
      address: '18 Rue Verte, San Jose, CA',
      hours: BAKERY_HOURS,
      socials: {
        instagram: '@maisonpatisserie',
        facebook: 'maisonpatisserie',
        website: 'maison.menucraft.com',
      },
    },
    sampleMenu: [
      category('Entremets', 'Whole cakes · 48h notice', [
        item('Chocolat Grand Cru', '70% ganache, praline base', 48, IMG.chocolateCake, {
          featured: true,
          popular: true,
        }),
        item('Jardin d’Été', 'Vanilla, raspberry, pistachio', 52, IMG.rainbowCake, {
          featured: true,
        }),
        item('Tarte au Citron', 'Torched meringue, almond sablé', 38, IMG.platedDessert),
      ]),
      category('Petits Gâteaux', 'By the piece', [
        item('Vanilla Cupcake', 'Brown butter frosting', 4.5, IMG.cupcakes),
        item('Caramel Saint-Honoré', 'Choux, caramel, crème', 7.5, IMG.platedDessert, {
          popular: true,
        }),
        item('Sablé Breton', 'Salted caramel, dark chocolate', 4, IMG.cookies),
      ]),
      category('Viennoiserie', 'From the morning bake', [
        item('Pain au Chocolat', 'Two batons, 27% butter', 4.8, IMG.frenchToast),
        item('Brioche aux Pralines', 'Pink praline, almond', 5.2, IMG.pancakes),
        item('Baguette de Tradition', 'Stone milled flour', 4, IMG.artisanBread),
      ]),
      category('Boissons', 'Tea, coffee, cold', [
        item('Thé Maison', 'Bergamot, rose, white tea', 5, IMG.cappuccino),
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
]

function meatballs(): MenuItem {
  return item('Polpette della Nonna', 'Beef & pork meatballs, sugo, parmesan', 13, IMG.tableSpread)
}

export function getTemplate(id: string): TemplateDefinition {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0]
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
