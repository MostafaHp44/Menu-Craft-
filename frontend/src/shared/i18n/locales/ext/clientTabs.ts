/**
 * i18n extension owned by the **client tabs** agent (orders / earnings / reports).
 * Merged into the main dictionaries by `src/shared/i18n/index.tsx` — do not import elsewhere.
 *
 * Rules: keep `ar` and `ku` typed as `Deep<typeof en>` so every key exists in all
 * three languages, and only add keys under your own top-level group `clientMore`.
 */
type Deep<T> = { [K in keyof T]: T[K] extends string ? string : Deep<T[K]> }

const en = {
  clientMore: {
    /* ------------------------------- orders ------------------------------- */
    searchPh: 'Search order #, table or guest',
    channel: 'Channel',
    statusUpdated: 'Order status updated',
    removeOrder: 'Remove order',
    confirmRemove: 'Remove this order?',
    confirmRemoveMsg: 'It disappears from the board and from today’s numbers. This cannot be undone.',
    manualHint: 'Counter orders land on the board instantly — simulated demo data.',
    tablePh: 'Table number, e.g. 4',
    customerPh: 'Guest name',
    orderItems: 'Order items',
    addItemsHint: 'Tap + next to a dish to add it to the order.',
    noItemsYet: 'No items yet — an order needs at least one dish.',
    menuEmpty: 'This menu has no dishes to add yet.',
    qtyUp: 'Increase quantity',
    qtyDown: 'Decrease quantity',
    lineCount: '{n} items',
    /* ------------------------------ earnings ------------------------------ */
    biggestOrders: 'Biggest orders today',
    /* ------------------------------- reports ------------------------------ */
    period: 'Report period',
    growth: 'Growth vs. previous period',
    qtySold: '{n} sold',
    csvExported: 'Report exported',
  },
}

const ar: Deep<typeof en> = {
  clientMore: {
    searchPh: 'ابحث برقم الأوردر أو الطاولة أو اسم الضيف',
    channel: 'القناة',
    statusUpdated: 'تم تحديث حالة الأوردر',
    removeOrder: 'حذف الأوردر',
    confirmRemove: 'هل تريد حذف هذا الأوردر؟',
    confirmRemoveMsg: 'سيختفي من الشاشة ومن أرقام اليوم. لا يمكن التراجع عن هذا الإجراء.',
    manualHint: 'أوردات الكاشير تظهر على الشاشة فوراً — بيانات تجريبية.',
    tablePh: 'رقم الطاولة، مثال: 4',
    customerPh: 'اسم الضيف',
    orderItems: 'أصناف الأوردر',
    addItemsHint: 'اضغط + بجانب أي طبق لإضافته إلى الأوردر.',
    noItemsYet: 'لا توجد أصناف بعد — أضف طبقاً واحداً على الأقل.',
    menuEmpty: 'هذا المنيو لا يحتوي على أي طبق بعد.',
    qtyUp: 'زيادة الكمية',
    qtyDown: 'تقليل الكمية',
    lineCount: '{n} أصناف',
    biggestOrders: 'أكبر أوردات اليوم',
    period: 'فترة التقرير',
    growth: 'النمو مقارنة بالفترة السابقة',
    qtySold: '{n} مبيعاً',
    csvExported: 'تم تصدير التقرير',
  },
}

const ku: Deep<typeof en> = {
  clientMore: {
    searchPh: 'بەژێربگەرە بە ژمارەی داواکاری، مێز یان ناوی کڕیوار',
    channel: 'ڕێگا',
    statusUpdated: 'دۆخی داواکاری نوێکرایەوە',
    removeOrder: 'سڕینەوەی داواکاری',
    confirmRemove: 'ئەم داواکارییە بسڕدرێتەوە؟',
    confirmRemoveMsg: 'لە تەبلە و ژمارەکانی ئەمڕۆ دەبەرێت. نەتوانرێت بگەڕێنرێتەوە.',
    manualHint: 'داواکارییەکانی کاشێر ڕاستەوخۆ لە تەبلە دەردەکەون — داتای نموونە.',
    tablePh: 'ژمارەی مێز، لێ: 4',
    customerPh: 'ناوی میوان',
    orderItems: 'دانەکانی داواکاری',
    addItemsHint: 'لە دەری هەر خواردنێک + دابگرە بۆ زیادکردنی بۆ ئەم داواکارییە.',
    noItemsYet: 'هیچ دانەیە نییە — لانیکەم خواردنێک زیاد بکە.',
    menuEmpty: 'ئەم لیستە هێشتا هیچ خواردنێکی نییە.',
    qtyUp: 'زیادکردنی ژمارە',
    qtyDown: 'کەمکردنەوەی ژمارە',
    lineCount: '{n} دانە',
    biggestOrders: 'گەورەترین داواکارییەکانی ئەمڕۆ',
    period: 'دەرەی ڕاپۆرت',
    growth: 'گەشە بەراوەی دەرەی پێش',
    qtySold: '{n} فرۆشراوە',
    csvExported: 'ڕاپۆرتەکە دەرهێنرا',
  },
}

export const clientTabs = { en, ar, ku }
