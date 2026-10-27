/**
 * Curated food & hospitality photography, bundled with the project under
 * /public/images so the demo renders identically offline.
 */

export const img = (n: number): string =>
  `/images/food/food-${String(n).padStart(2, '0')}.jpg`

export const IMG = {
  /* rooms & atmosphere */
  diningRoomDark: img(1),
  diningRoomWarm: img(2),
  fineDiningPlate: img(3),
  sharingTable: img(4),
  terraceSunset: img(5),
  cafeBright: img(6),
  cafeWindow: img(7),
  cafeInterior: img(26),
  classicDiningRoom: img(39),
  cafeTerrace: img(44),
  tableSpread: img(50),

  /* pizza & pasta */
  pizzaBoard: img(8),
  pastaSalad: img(9),
  penneArrabbiata: img(10),
  margherita: img(11),
  pizzaSlice: img(12),
  mushroomPasta: img(37),
  seafoodPasta: img(38),
  zucchiniPasta: img(43),
  pastaWineTable: img(45),

  /* mains */
  steakFrites: img(13),
  slicedSteak: img(17),
  grilledMeat: img(35),
  ribs: img(36),
  porkPlate: img(49),

  /* burgers & sandwiches */
  classicBurger: img(18),
  doubleBurger: img(19),
  burgersBoard: img(20),
  deliSandwich: img(42),
  dramaticBurger: img(47),

  /* coffee & drinks */
  latteHands: img(21),
  cappuccino: img(22),
  coffeeBeans: img(23),
  pourOver: img(24),
  icedCoffee: img(25),

  /* bakery & sweets */
  artisanBread: img(27),
  chocolateCake: img(28),
  rainbowCake: img(29),
  platedDessert: img(30),
  cupcakes: img(40),
  cookies: img(41),

  /* breakfast & brunch */
  pancakes: img(31),
  frenchToast: img(32),
  avocadoToast: img(33),
  breakfastEgg: img(46),

  /* healthy */
  tofuBowl: img(14),
  saladBowl: img(15),
  saladPlate: img(16),
  healthyPlate: img(34),
  soupBowl: img(48),
} as const

export interface LibraryImage {
  src: string
  label: string
  tags: string[]
}

/** Image picker library used by the editor (branding + menu items). */
export const IMAGE_LIBRARY: LibraryImage[] = [
  { src: IMG.diningRoomDark, label: 'Moody dining room', tags: ['interior', 'dark'] },
  { src: IMG.diningRoomWarm, label: 'Warm bistro interior', tags: ['interior', 'warm'] },
  { src: IMG.fineDiningPlate, label: 'Tasting plate', tags: ['fine dining', 'plate'] },
  { src: IMG.classicDiningRoom, label: 'White linen dining', tags: ['interior', 'classic'] },
  { src: IMG.terraceSunset, label: 'Sunset terrace', tags: ['interior', 'outdoor'] },
  { src: IMG.cafeTerrace, label: 'Street café terrace', tags: ['interior', 'cafe'] },
  { src: IMG.cafeBright, label: 'Bright plant café', tags: ['interior', 'cafe'] },
  { src: IMG.cafeWindow, label: 'Window table', tags: ['cafe', 'lifestyle'] },
  { src: IMG.cafeInterior, label: 'Industrial café', tags: ['interior', 'cafe'] },
  { src: IMG.sharingTable, label: 'Sharing brunch', tags: ['brunch', 'lifestyle'] },
  { src: IMG.tableSpread, label: 'Table spread', tags: ['lifestyle', 'sharing'] },
  { src: IMG.pizzaBoard, label: 'Pizza on board', tags: ['pizza', 'italian'] },
  { src: IMG.margherita, label: 'Margherita pizza', tags: ['pizza', 'italian'] },
  { src: IMG.pizzaSlice, label: 'Pizza slice', tags: ['pizza', 'italian'] },
  { src: IMG.mushroomPasta, label: 'Creamy pasta', tags: ['pasta', 'italian'] },
  { src: IMG.seafoodPasta, label: 'Seafood pasta', tags: ['pasta', 'italian'] },
  { src: IMG.penneArrabbiata, label: 'Penne arrabbiata', tags: ['pasta', 'italian'] },
  { src: IMG.zucchiniPasta, label: 'Zucchini pasta', tags: ['pasta', 'italian'] },
  { src: IMG.pastaSalad, label: 'Pasta salad', tags: ['pasta', 'light'] },
  { src: IMG.pastaWineTable, label: 'Pasta & wine', tags: ['pasta', 'lifestyle'] },
  { src: IMG.steakFrites, label: 'Steak frites', tags: ['meat', 'main'] },
  { src: IMG.slicedSteak, label: 'Sliced steak', tags: ['meat', 'main'] },
  { src: IMG.grilledMeat, label: 'Grilled plate', tags: ['meat', 'main'] },
  { src: IMG.ribs, label: 'Slow ribs', tags: ['meat', 'main'] },
  { src: IMG.porkPlate, label: 'Herb crusted chop', tags: ['meat', 'main'] },
  { src: IMG.classicBurger, label: 'Classic burger', tags: ['burger', 'fast'] },
  { src: IMG.doubleBurger, label: 'Double burger', tags: ['burger', 'fast'] },
  { src: IMG.burgersBoard, label: 'Burgers board', tags: ['burger', 'fast'] },
  { src: IMG.deliSandwich, label: 'Deli sandwich', tags: ['sandwich', 'fast'] },
  { src: IMG.dramaticBurger, label: 'Stacked burger', tags: ['burger', 'fast'] },
  { src: IMG.latteHands, label: 'Two lattes', tags: ['coffee', 'drink'] },
  { src: IMG.cappuccino, label: 'Cappuccino', tags: ['coffee', 'drink'] },
  { src: IMG.coffeeBeans, label: 'Roasted beans', tags: ['coffee', 'texture'] },
  { src: IMG.pourOver, label: 'Pour over', tags: ['coffee', 'drink'] },
  { src: IMG.icedCoffee, label: 'Iced coffee', tags: ['coffee', 'drink'] },
  { src: IMG.artisanBread, label: 'Sourdough loaves', tags: ['bakery', 'bread'] },
  { src: IMG.chocolateCake, label: 'Chocolate cake', tags: ['dessert', 'cake'] },
  { src: IMG.rainbowCake, label: 'Layer cake', tags: ['dessert', 'cake'] },
  { src: IMG.platedDessert, label: 'Plated dessert', tags: ['dessert', 'fine dining'] },
  { src: IMG.cupcakes, label: 'Cupcakes', tags: ['dessert', 'bakery'] },
  { src: IMG.cookies, label: 'Brown butter cookies', tags: ['dessert', 'bakery'] },
  { src: IMG.pancakes, label: 'Berry pancakes', tags: ['breakfast', 'brunch'] },
  { src: IMG.frenchToast, label: 'French toast', tags: ['breakfast', 'brunch'] },
  { src: IMG.avocadoToast, label: 'Avocado toast', tags: ['breakfast', 'brunch'] },
  { src: IMG.breakfastEgg, label: 'Full breakfast', tags: ['breakfast', 'brunch'] },
  { src: IMG.tofuBowl, label: 'Tofu grain bowl', tags: ['healthy', 'bowl'] },
  { src: IMG.saladBowl, label: 'Garden bowl', tags: ['healthy', 'salad'] },
  { src: IMG.saladPlate, label: 'Leaf salad', tags: ['healthy', 'salad'] },
  { src: IMG.healthyPlate, label: 'Balanced plate', tags: ['healthy', 'plate'] },
  { src: IMG.soupBowl, label: 'Velouté soup', tags: ['healthy', 'starter'] },
]

/** Fallback swatch used whenever an image fails to load. */
export const IMAGE_FALLBACK =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#E9E1D4"/>
          <stop offset="100%" stop-color="#D9D0C1"/>
        </linearGradient>
      </defs>
      <rect width="600" height="400" fill="url(#g)"/>
      <g fill="none" stroke="#B3A794" stroke-width="6" stroke-linecap="round">
        <circle cx="300" cy="185" r="52"/>
        <path d="M258 262h84M272 292h56"/>
      </g>
    </svg>`
  )
