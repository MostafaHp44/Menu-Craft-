/**
 * i18n extension owned by the **Aurum Premium** template build pass.
 * Merged into the main dictionaries by `src/shared/i18n/index.tsx` — do not import elsewhere.
 *
 * Rules: keep `ar` and `ku` typed as `Deep<typeof en>` so every key exists in all
 * three languages, and only add keys under your own top-level group `aurum`.
 */
type Deep<T> = { [K in keyof T]: T[K] extends string ? string : Deep<T[K]> }

const en = {
  aurum: {
    /* ------------------------------- nav (mobile + desktop) ------------------------ */
    nav: {
      menu: 'Menu',
      search: 'Search',
      saved: 'Saved',
      call: 'Call',
      cart: 'Cart',
    },

    /* ---------------------------------- hero ---------------------------------------- */
    openNow: 'OPEN NOW',
    closed: 'CLOSED',
    minOrder: 'Min. order',

    /* --------------------------------- search bar ------------------------------------ */
    searchPlaceholder: 'Search steaks, pasta, cocktails or desserts…',
    searchAria: 'Search dishes',

    /* -------------------------------- filter chips ------------------------------------ */
    filters: {
      allItems: 'All Items',
      chefSpecial: "Chef's Special",
      spicy: 'Spicy',
      vegetarian: 'Vegetarian',
      glutenFree: 'Gluten Free',
    },

    /* ------------------------------ product details modal ---------------------------- */
    product: {
      ingredients: 'Ingredients',
      allergens: 'Allergens',
      noteLabel: 'Add a note',
      notePh: 'Optional — anything you want to mention',
      qty: 'Quantity',
      addToCart: 'Add to Cart',
      soldOut: 'Sold out',
      noDescription: 'No description',
      close: 'Close',
    },

    /* --------------------------------- cart & misc ----------------------------------- */
    cart: {
      empty: 'Your cart is empty',
      addedToast: 'Added to cart',
      total: 'Total',
      minOrderNote: 'Add more to reach the minimum order',
    },
  },
}

const ar: Deep<typeof en> = {
  aurum: {
    nav: {
      menu: 'القائمة',
      search: 'بحث',
      saved: 'المفضلة',
      call: 'اتصال',
      cart: 'سلة',
    },
    openNow: 'مفتوح الآن',
    closed: 'مغلق',
    minOrder: 'الحد الأدنى للطلب',
    searchPlaceholder: 'ابحث عن بشاور، باستا، صلصات أو حلويات…',
    searchAria: 'ابحث عن الأطباق',
    filters: {
      allItems: 'كل المنتجات',
      chefSpecial: 'صفة الطاهي',
      spicy: 'حار',
      vegetarian: 'نباتي',
      glutenFree: 'بدون جلوتين',
    },
    product: {
      ingredients: 'المكونات',
      allergens: 'مسكنات الحساسية',
      noteLabel: 'ملاحظة',
      notePh: 'اختياري — اكتب أي شيء تريد إضافته',
      qty: 'الكمية',
      addToCart: 'إضافة للسلة',
      soldOut: 'إنتهى منه',
      noDescription: 'لا يوجد وصف',
      close: 'إغلاق',
    },
    cart: {
      empty: 'سلتك فارغة',
      addedToast: 'تمت الإضافة للسلة',
      total: 'الإجمالي',
      minOrderNote: 'أضف المزيد للوصول للحد الأدنى',
    },
  },
}

const ku: Deep<typeof en> = {
  aurum: {
    nav: {
      menu: 'مێنو',
      search: 'گەڕان',
      saved: 'تۆمارکراوە',
      call: 'گەوتە',
      cart: 'شەڕگە',
    },
    openNow: 'ئێستا تێ بەخێ',
    closed: 'بە کاتی',
    minOrder: 'کەمترین سیندویچ',
    searchPlaceholder: 'لێرەدا بگەڕێ لە ئیقتاواتاش، پاستا، سەلیڤ یان دیسرێوەل…',
    searchAria: 'بگەڕێ لە سەنتەکەکان',
    filters: {
      allItems: 'کامێک',
      chefSpecial: 'خۆڵەکانی آشپچاو',
      spicy: 'تەند',
      vegetarian: 'نێوی',
      glutenFree: 'بێ گڵۆتین',
    },
    product: {
      ingredients: 'مەتزوزات',
      allergens: 'ئاستما',
      noteLabel: 'نێ',
      notePh: 'ئاخ نووسە چییە کە کۆیە خۆت',
      qty: 'کەوتە',
      addToCart: 'زیاد بۆ شەڕگە',
      soldOut: 'تێ تەکا',
      noDescription: 'وێراوێک نییە',
      close: 'داخستن',
    },
    cart: {
      empty: 'شەڕگەکەت بەتاڵە',
      addedToast: 'زیاد کرا بە شەڕگە',
      total: 'کۆکردنەوە',
      minOrderNote: 'زیاد بکە بۆ گەیاندنی کەمترین',
    },
  },
}

export const aurum = { en, ar, ku }
