/**
 * MenuCraft — مزامنة منيو JSON مع جدولي العرض (MenuCategories + MenuItems)
 * -----------------------------------------------------------------------
 * الموقع العام (getPublicMenuBySlug) يقرأ من الجدولين MenuCategories/MenuItems
 * أولاً، لذلك يجب أن يظلوا متطابقين مع ما يراه المالك في المحرر بعد الحفظ.
 * بدون هذه المزامنة تُكتب التعديلات في أعمدة JSON فقط ولا تظهر على الموقع
 * (وهو سبب "كل حاجة بتتعدل إلا المنيو").
 *
 * لا توجد مراجع خارجية للجدولين (OrderLines تحفظ نسخة من الاسم/السعر)،
 * وحذف الفئة يحذف أصنافها تلقائياً عبر FK ON DELETE CASCADE.
 */
const { getMySQLPool } = require('../config/mysql');
const { ensureMenuFitColumns, stringifyFit } = require('./imageFit.service');

function parseJson(value, fallback) {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

/** يقبل نصاً أو كائناً متعدد اللغات { en, ar, ku } — مع حدود أعمدة الجدول */
function lang(value, max = 200) {
  if (value && typeof value === 'object') {
    return {
      en: String(value.en || '').slice(0, max),
      ar: String(value.ar || '').slice(0, max),
      ku: String(value.ku || '').slice(0, max),
    };
  }
  const s = typeof value === 'string' ? value : '';
  return { en: s.slice(0, max), ar: '', ku: '' };
}

/** options → نص JSON صالح للعمود (CHECK json_valid) */
function optionsToJson(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'string') {
    try {
      JSON.parse(value);
      return value;
    } catch {
      return null;
    }
  }
  try {
    // المحرر يحفظها أحياناً كمصفوفة — الموقع يعيد قراءتها كـ { groups: [...] }
    return JSON.stringify(Array.isArray(value) ? { groups: value } : value);
  } catch {
    return null;
  }
}

/**
 * يستبدل محتوى الجدولين بمحتوى منيو JSON المُرسى.
 * @param {string} restaurantId
 * @param {any} jsonMenu مصفوفة الفئات أو نص JSON
 */
async function syncMenuItemsFromJson(restaurantId, jsonMenu) {
  if (!restaurantId) return;
  const menu = Array.isArray(jsonMenu) ? jsonMenu : parseJson(jsonMenu, null);
  if (!Array.isArray(menu)) return; // لا منيو للمزامنة — لا نلمس الجدولين

  const pool = await getMySQLPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await ensureMenuFitColumns(conn);

    // نقرأ الترجمات الحالية (ar/ku) قبل الحذف — المحرر يحفظ الاسم بالإنجليزية
    // فقط، فلا نريد فقدان الترجمات ما دام الاسم الإنجليزي نفسه لم يتغير.
    const [existingRows] = await conn.execute(
      `SELECT id, name_en, name_ar, name_ku, description_en, description_ar, description_ku, source_lang
         FROM MenuItems WHERE restaurant_id = ?`,
      [restaurantId]
    );
    const prev = new Map(existingRows.map((r) => [r.id, r]));

    const [existingCats] = await conn.execute(
      `SELECT id, name_en, name_ar, name_ku, note_en, note_ar, note_ku, source_lang
         FROM MenuCategories WHERE restaurant_id = ?`,
      [restaurantId]
    );
    const prevCats = new Map(existingCats.map((r) => [r.id, r]));

    await conn.execute('DELETE FROM MenuCategories WHERE restaurant_id = ?', [restaurantId]);

    /**
     * IDs الفئات/الأصناف هي PRIMARY KEY عالمية (مش لكل مطعم).
     * لو منيو فيها IDs بتاعة demo/seed موجودة أصلاً لمطعم تاني (مثلاً seed-cat-17)
     * الـ INSERT بيرمي Duplicate entry. هنا بنكشف الـ IDs اللي متسوّفة عالمياً
     * ونولّد لها لاحقة فريدة ثابتة (base-1, base-2..) حتى لا نضرب مفاتيح مطعم آخر.
     */
    const idBelongsToOther = async (table, id) => {
      const [rows] = await conn.execute(
        `SELECT 1 FROM ${table} WHERE id = ? AND restaurant_id <> ? LIMIT 1`,
        [id, restaurantId]
      );
      return rows.length > 0;
    };

    // حماية من تكرار المعرّفات داخل المنيو الواحد + عبر المطاعم الأخرى
    const usedCatIds = new Set();
    const usedItemIds = new Set();
    const uniq = async (base, set, table) => {
      let id = base;
      let n = 1;
      while (set.has(id) || (await idBelongsToOther(table, id))) {
        id = `${base}-${n++}`;
      }
      set.add(id);
      return id;
    };

    for (let ci = 0; ci < menu.length; ci++) {
      const cat = menu[ci] || {};
      const catName = lang(cat.name, 200);
      const catNote = lang(cat.note, 500);
      const catId = await uniq(
        String(cat.id || `cat-${ci}`).slice(0, 90),
        usedCatIds,
        'MenuCategories'
      );

      // حفظ ملاحظات وترجمات الفئة ما دام النص الإنجليزي نفسه
      const prevCat = prevCats.get(catId);
      const catNameUnchanged = Boolean(prevCat) && String(prevCat.name_en || '') === catName.en;
      const noteUnchanged = Boolean(prevCat) && String(prevCat.note_en || '') === catNote.en;
      const nameAr = catName.ar || (prevCat && catNameUnchanged ? prevCat.name_ar : null);
      const nameKu = catName.ku || (prevCat && catNameUnchanged ? prevCat.name_ku : null);
      const noteAr = catNote.ar || (prevCat && noteUnchanged ? prevCat.note_ar : null);
      const noteKu = catNote.ku || (prevCat && noteUnchanged ? prevCat.note_ku : null);
      const catSourceLang =
        cat.sourceLang ||
        cat.source_lang ||
        (prevCat && catNameUnchanged && noteUnchanged ? prevCat.source_lang : null);

      await conn.execute(
        `INSERT INTO MenuCategories
           (id, restaurant_id, name_en, name_ar, name_ku, note_en, note_ar, note_ku, source_lang, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          catId,
          restaurantId,
          catName.en,
          nameAr,
          nameKu,
          catNote.en,
          noteAr,
          noteKu,
          catSourceLang,
          ci,
        ]
      );

      const items = Array.isArray(cat.items) ? cat.items : [];
      for (let ii = 0; ii < items.length; ii++) {
        const it = items[ii] || {};
        const name = lang(it.name, 200);
        const desc = lang(it.description, 15000);
        const itemId = await uniq(
          String(it.id || `${catId}-item-${ii}`).slice(0, 90),
          usedItemIds,
          'MenuItems'
        );
        const compareAt =
          it.compareAt === null || it.compareAt === undefined || it.compareAt === ''
            ? null
            : Number(it.compareAt);
        // صور مرفوعة = data: URLs قد تتجاوز 100KB — لا يُقصّع بطول 500
        // (العمود LONGTEXT بعد ترحيل migrate_menuitem_image)
        const image = String(it.image || '').slice(0, 2_000_000);

        // حفظ الترجمات ما دام النص الإنجليزي نفسه لم يتغيّر
        const before = prev.get(itemId);
        const nameUnchanged = Boolean(before) && String(before.name_en || '') === name.en;
        const descUnchanged = Boolean(before) && String(before.description_en || '') === desc.en;
        const nameAr = name.ar || (before && nameUnchanged ? before.name_ar : null);
        const nameKu = name.ku || (before && nameUnchanged ? before.name_ku : null);
        const descAr = desc.ar || (before && descUnchanged ? before.description_ar : null);
        const descKu = desc.ku || (before && descUnchanged ? before.description_ku : null);
        const sourceLang =
          it.sourceLang || it.source_lang || cat.sourceLang || (before && nameUnchanged ? before.source_lang : null);

        await conn.execute(
          `INSERT INTO MenuItems
             (id, category_id, restaurant_id, name_en, name_ar, name_ku,
              description_en, description_ar, description_ku, source_lang,
              price, compare_at, image, featured, popular, available, sort_order, options, image_fit)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            itemId,
            catId,
            restaurantId,
            name.en,
            nameAr,
            nameKu,
            desc.en,
            descAr,
            descKu,
            sourceLang,
            Number(it.price || 0),
            Number.isFinite(compareAt) ? compareAt : null,
            image,
            it.featured ? 1 : 0,
            it.popular ? 1 : 0,
            it.available === undefined ? true : it.available ? 1 : 0,
            ii,
            optionsToJson(it.options),
            stringifyFit(it.imageFit),
          ]
        );
      }
    }

    await conn.commit();
  } catch (err) {
    try {
      await conn.rollback();
    } catch {
      /* تجاهل خطأ التراجع الثانوي */
    }
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { syncMenuItemsFromJson };
