/**
 * MenuCraft — خدمة الطلبات (منيو عام حقيقي + طلبات الكونتر)
 * ------------------------------------------------------------
 * قواعد أساسية:
 *  - الأسعار تُحسب من قاعدة البيانات دائمًا (لا تُوثَّق بأي مبلغ من المتصفح).
 *  - إنشاء الطلب داخل معاملة قاعدة بيانات واحدة (Order + OrderLines).
 *  - idempotency_key فريد يمنع تكرار الطلب عند إعادة الإرسال/النقر المزدوج.
 *  - رمز order_token آمن يتيح للعميل الضيف متابعة طلبه دون حساب.
 *  - حالة الدفع تُفصل عن حالة التنفيذ (نقدي = unpaid، بنك = awaiting_confirmation).
 */
const crypto = require('crypto');
const { getPool, sql } = require('../config/db');
const { z } = require('zod');

/* ----------------------------- الحالات ----------------------------- */

/** سير عمل الطلبات المعتمد */
const ORDER_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];
/** الحالات القديمة (received/served) مقبولة للقراءة وللتوافق مع بيانات قديمة */
const LEGACY_STATUS_MAP = { received: 'pending', served: 'completed' };

const STATUS_TRANSITIONS = {
  pending: ['confirmed', 'preparing', 'cancelled'],
  received: ['confirmed', 'preparing', 'cancelled'], // توافق قديم
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['completed'],
  completed: [],
  cancelled: []
};

const PAYMENT_METHODS = ['cash', 'cash_at_pickup', 'card', 'wallet', 'bank_transfer'];
const PAYMENT_STATUSES = ['unpaid', 'paid', 'awaiting_confirmation', 'refunded', 'failed'];

function canonicalStatus(status) {
  return LEGACY_STATUS_MAP[status] || status;
}

function httpError(status, message, code) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
}

/* ----------------------------- التحقق من المدخلات ----------------------------- */

const orderLineInput = z.object({
  itemId: z.string().min(1, 'معرف الصنف مطلوب'),
  qty: z.number().int().min(1).max(50, 'الكمية بين 1 و 50'),
  /** الاختيارات/الإضافات: معرّفات المجموعات المختارة */
  options: z.array(z.object({
    groupId: z.string().min(1),
    optionId: z.string().min(1)
  })).optional()
});

const createOrderSchema = z.object({
  restaurantId: z.string().optional(),
  slug: z.string().optional(),
  customer: z.object({
    name: z.string().min(2, 'اسم العميل مطلوب').max(120),
    phone: z.string().min(5, 'رقم الهاتف مطلوب').max(30),
    email: z.string().email().optional().or(z.literal(''))
  }).optional(),
  /** طلبات الكونتر تمرر اسم العميل مسطحًا */
  customerName: z.string().min(1).max(120).optional(),
  customerPhone: z.string().max(30).optional(),
  fulfillment: z.enum(['delivery', 'pickup', 'table']).default('pickup'),
  deliveryAddress: z.string().max(500).optional(),
  table: z.string().max(50).optional(),
  note: z.string().max(500).optional(),
  paymentMethod: z.enum(PAYMENT_METHODS).default('cash'),
  promoCode: z.string().max(50).optional(),
  channel: z.enum(['online', 'counter']).default('online'),
  lines: z.array(orderLineInput).min(1, 'يجب اختيار صنف واحد على الأقل'),
  /** مفتاح منع التكرار (يولّده المتصفح مرة واحدة لكل عملية checkout) */
  idempotencyKey: z.string().min(8).max(100).optional()
});

/* ----------------------------- إعدادات الطلب ----------------------------- */

/** الإعدادات الافتراضية لكل موقع (لو لم يضبطها صاحب المطعم) */
const DEFAULT_ORDERING = {
  enabled: true,
  fulfillment: { delivery: true, pickup: true },
  deliveryFee: 0,
  minOrder: 0,
  currency: 'USD',
  promo: null, // { code, type: 'percent'|'fixed', value }
  paymentMethods: {
    cash: { enabled: true },           // الدفع النقدي عند التوصيل
    cash_at_pickup: { enabled: true }, // الدفع النقدي عند الاستلام
    card: { enabled: false },          // يتطلب تهيئة Stripe
    wallet: { enabled: false },
    bank_transfer: { enabled: false, instructions: '' }
  }
};

/** قراءة إعدادات الطلب من صف المطعم مع defaults آمنة */
function orderingSettingsFromRow(row) {
  let stored = {};
  try {
    stored = row.ordering && typeof row.ordering === 'string' ? JSON.parse(row.ordering) : (row.ordering || {});
  } catch {
    stored = {};
  }
  return {
    ...DEFAULT_ORDERING,
    ...stored,
    fulfillment: { ...DEFAULT_ORDERING.fulfillment, ...(stored.fulfillment || {}) },
    paymentMethods: {
      ...DEFAULT_ORDERING.paymentMethods,
      ...(stored.paymentMethods || {}),
      cash: { ...DEFAULT_ORDERING.paymentMethods.cash, ...(stored.paymentMethods?.cash || {}) },
      cash_at_pickup: { ...DEFAULT_ORDERING.paymentMethods.cash_at_pickup, ...(stored.paymentMethods?.cash_at_pickup || {}) },
      card: { ...DEFAULT_ORDERING.paymentMethods.card, ...(stored.paymentMethods?.card || {}) },
      wallet: { ...DEFAULT_ORDERING.paymentMethods.wallet, ...(stored.paymentMethods?.wallet || {}) },
      bank_transfer: { ...DEFAULT_ORDERING.paymentMethods.bank_transfer, ...(stored.paymentMethods?.bank_transfer || {}) }
    }
  };
}

/* ----------------------------- الحسابات ----------------------------- */

/**
 * حساب سعر صنف مع اختياراته من بيانات القاعدة.
 * يرجع { unitPrice, optionLines } أو يرمي خطأ لو اختيار غير صالح.
 */
function priceItem(item, selections) {
  let itemOptions = {};
  try {
    itemOptions = item.options && typeof item.options === 'string' ? JSON.parse(item.options) : (item.options || {});
  } catch {
    itemOptions = {};
  }
  const groups = Array.isArray(itemOptions.groups) ? itemOptions.groups : [];
  const unitPrice = Number(item.price || 0);
  const chosen = [];
  let extra = 0;

  for (const sel of selections || []) {
    const group = groups.find((g) => g.id === sel.groupId);
    if (!group) throw httpError(400, 'مجموعة اختيارات غير صالحة', 'INVALID_OPTIONS');
    const option = (group.options || []).find((o) => o.id === sel.optionId);
    if (!option) throw httpError(400, 'اختيار غير صالح داخل المجموعة', 'INVALID_OPTIONS');
    if (group.required && group.max === 1) { /* اختيار إلزامي واحد — مقبول */ }
    extra += Number(option.price || 0);
    chosen.push({ groupId: group.id, groupName: group.name, optionId: option.id, optionName: option.name, price: Number(option.price || 0) });
  }

  // التحقق من الحد الأدنى/الأقصى للمجموعات الإلزامية
  for (const group of groups) {
    if (!group.required) continue;
    const count = chosen.filter((c) => c.groupId === group.id).length;
    if (count === 0) throw httpError(400, `الاختيار مطلوب: ${group.name || ''}`, 'REQUIRED_OPTION_GROUP');
    const max = group.max ?? 1;
    if (count > max) throw httpError(400, `تجاوزت الحد المسموح من: ${group.name || ''}`, 'TOO_MANY_OPTIONS');
  }
  for (const group of groups) {
    const count = chosen.filter((c) => c.groupId === group.id).length;
    const max = group.max ?? (group.required ? 1 : 99);
    if (count > max) throw httpError(400, `تجاوزت الحد المسموح من: ${group.name || ''}`, 'TOO_MANY_OPTIONS');
  }

  return { unitPrice: unitPrice + extra, optionLines: chosen };
}

/* ----------------------------- الإنشاء ----------------------------- */

/**
 * إنشاء طلب عام (ضيف) — الأسعار كلها تُعاد حسابها من القاعدة هنا.
 */
async function createPublicOrder(input) {
  const parsed = createOrderSchema.parse(input);
  const pool = await getPool();

  if (!parsed.restaurantId && !parsed.slug) {
    throw httpError(400, 'المطعم مطلوب', 'RESTAURANT_REQUIRED');
  }
  const customerName = parsed.customer?.name || parsed.customerName || '';
  const customerPhone = parsed.customer?.phone || parsed.customerPhone || '';
  if (!customerName) {
    throw httpError(400, 'اسم العميل مطلوب', 'CUSTOMER_REQUIRED');
  }
  // الهاتف إلزامي للطلب الإلكتروني (متابعة الطلب كضيف) — اختياري لطلبات الكونتر
  if (!customerPhone && parsed.channel !== 'counter') {
    throw httpError(400, 'رقم الهاتف مطلوب للطلب الإلكتروني', 'CUSTOMER_REQUIRED');
  }

  /* 1) جلب المطعم */
  const restRequest = pool.request();
  let restResult;
  if (parsed.restaurantId) {
    restResult = await restRequest.input('id', sql.NVarChar, parsed.restaurantId)
      .query('SELECT * FROM Restaurants WHERE id = @id');
  } else {
    restResult = await restRequest.input('slug', sql.NVarChar, parsed.slug)
      .query('SELECT * FROM Restaurants WHERE slug = @slug');
  }
  if (restResult.recordset.length === 0) throw httpError(404, 'المطعم غير موجود', 'RESTAURANT_NOT_FOUND');
  const restaurant = restResult.recordset[0];

  if (restaurant.status !== 'published') {
    throw httpError(403, 'منيو هذا المطعم غير منشور حاليًا', 'MENU_NOT_PUBLISHED');
  }
  const settings = orderingSettingsFromRow(restaurant);
  if (!settings.enabled) {
    throw httpError(403, 'الطلب الإلكتروني غير مفعّل لهذا المطعم', 'ORDERING_DISABLED');
  }

  /* 2) التحقق من وسيلة الدفع أنها مفعّلة فعليًا */
  const methodSettings = settings.paymentMethods[parsed.paymentMethod];
  if (!methodSettings || !methodSettings.enabled) {
    throw httpError(400, 'وسيلة الدفع المختارة غير متاحة لهذا المطعم', 'PAYMENT_METHOD_UNAVAILABLE');
  }
  if (parsed.paymentMethod === 'card' && !process.env.STRIPE_SECRET_KEY) {
    throw httpError(403, 'الدفع بالبطاقة غير مهيأ لهذا المطعم حاليًا', 'PAYMENT_NOT_CONFIGURED');
  }
  if (parsed.paymentMethod === 'wallet' && !process.env.STRIPE_SECRET_KEY) {
    throw httpError(403, 'المحافظ الإلكترونية غير مهيأة حاليًا', 'PAYMENT_NOT_CONFIGURED');
  }
  if (parsed.paymentMethod === 'bank_transfer' && !settings.paymentMethods.bank_transfer.instructions) {
    throw httpError(403, 'التحويل البنكي غير مهيأ لهذا المطعم', 'PAYMENT_NOT_CONFIGURED');
  }

  /* 2b) التوصيل يتطلب دفع إلكتروني فقط */
  if (parsed.fulfillment === 'delivery' && !['card', 'wallet'].includes(parsed.paymentMethod)) {
    throw httpError(400, 'التوصيل يتطلب الدفع الإلكتروني فقط', 'ONLINE_PAYMENT_REQUIRED');
  }

  /* 3) التحقق من طريقة الاستلام */
  if (parsed.fulfillment === 'delivery') {
    if (!settings.fulfillment.delivery) throw httpError(400, 'التوصيل غير متاح لهذا المطعم', 'FULFILLMENT_UNAVAILABLE');
    if (!parsed.deliveryAddress || parsed.deliveryAddress.trim().length < 5) {
      throw httpError(400, 'عنوان التوصيل مطلوب', 'DELIVERY_ADDRESS_REQUIRED');
    }
  } else if (parsed.fulfillment === 'pickup') {
    if (!settings.fulfillment.pickup) throw httpError(400, 'الاستلام من المطعم غير متاح', 'FULFILLMENT_UNAVAILABLE');
  }

  /* 4) تسعير الأصناف من القاعدة (جداول المنيو أو JSON) — لا مبالغ من المتصفح */
  const itemIds = [...new Set(parsed.lines.map((l) => l.itemId))];
  const { resolveItemsForOrder } = require('./menu.service');
  const itemMap = await resolveItemsForOrder(restaurant, itemIds);

  const pricedLines = [];
  let subtotal = 0;
  for (const line of parsed.lines) {
    const item = itemMap.get(line.itemId);
    if (!item) throw httpError(400, 'صنف غير موجود في منيو المطعم', 'ITEM_NOT_FOUND');
    if (!item.available) throw httpError(400, `الصنف غير متاح حاليًا: ${item.name_en || ''}`, 'ITEM_UNAVAILABLE');
    const { unitPrice, optionLines } = priceItem(item, line.options);
    const lineTotal = unitPrice * line.qty;
    subtotal += lineTotal;
    pricedLines.push({
      itemId: item.id,
      name: item.displayName || item.name?.en || item.name?.ar || '',
      nameAr: item.name?.ar || '',
      unitPrice,
      price: unitPrice, // للتوافق مع نموذج OrderLine الحالي
      qty: line.qty,
      options: optionLines
    });
  }

  /* 5) الحد الأدنى للطلب */
  const minOrder = Number(settings.minOrder || 0);
  if (minOrder > 0 && subtotal < minOrder) {
    throw httpError(400, `الحد الأدنى للطلب ${minOrder} ${settings.currency}`, 'MIN_ORDER_NOT_MET');
  }

  /* 6) رسوم التوصيل والخصم */
  const deliveryFee = parsed.fulfillment === 'delivery' ? Number(settings.deliveryFee || 0) : 0;
  let discount = 0;
  if (parsed.promoCode && settings.promo && settings.promo.code
      && String(parsed.promoCode).trim().toLowerCase() === String(settings.promo.code).trim().toLowerCase()) {
    discount = settings.promo.type === 'percent'
      ? Math.round(subtotal * (Number(settings.promo.value || 0) / 100) * 100) / 100
      : Math.min(Number(settings.promo.value || 0), subtotal);
  }
  const total = Math.max(0, Math.round((subtotal + deliveryFee - discount) * 100) / 100);

  /* 7) حالة الدفع — لا يُعتبر الطلب مدفوعًا باختيار الوسيلة فقط */
  const paymentStatus = (parsed.paymentMethod === 'bank_transfer')
    ? 'awaiting_confirmation'
    : 'unpaid'; // النقدي (توصيل/استلام) = unpaid دائمًا. البطاقة تُحوَّل إلى paid عبر Webhook موثّق فقط

  /* 8) الإنشاء داخل معاملة واحدة */
  const orderToken = crypto.randomBytes(24).toString('hex');
  const orderId = `ord-${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}`;
  const connection = await pool;
  const transaction = new sql.Transaction(connection);
  await transaction.begin();

  try {
    // رقم الطلب التالي (لكل مطعم)
    const numRequest = new sql.Request(transaction);
    numRequest.input('restaurantId', sql.NVarChar, restaurant.id);
    const channelFilter = parsed.channel === 'online' ? `AND channel = 'online'` : '';
    const maxNum = await numRequest.query(
      `SELECT MAX(order_number) AS maxNum FROM Orders WHERE restaurant_id = @restaurantId ${channelFilter}`
    );
    const orderNumber = (maxNum.recordset[0].maxNum || 0) + 1;

    const orderRequest = new sql.Request(transaction);
    orderRequest
      .input('id', sql.NVarChar, orderId)
      .input('restaurantId', sql.NVarChar, restaurant.id)
      .input('orderNumber', sql.Int, orderNumber)
      .input('channel', sql.NVarChar, parsed.channel)
      .input('tableNo', sql.NVarChar, parsed.table || null)
      .input('customerName', sql.NVarChar, customerName)
      .input('customerPhone', sql.NVarChar, customerPhone)
      .input('customerEmail', sql.NVarChar, parsed.customer?.email || null)
      .input('fulfillment', sql.NVarChar, parsed.fulfillment)
      .input('deliveryAddress', sql.NVarChar, parsed.deliveryAddress || null)
      .input('note', sql.NVarChar, parsed.note || '')
      .input('subtotal', sql.Decimal(10, 2), subtotal)
      .input('deliveryFee', sql.Decimal(10, 2), deliveryFee)
      .input('discount', sql.Decimal(10, 2), discount)
      .input('total', sql.Decimal(10, 2), total)
      .input('currency', sql.NVarChar, settings.currency || 'USD')
      .input('paymentMethod', sql.NVarChar, parsed.paymentMethod)
      .input('paymentStatus', sql.NVarChar, paymentStatus)
      .input('status', sql.NVarChar, 'pending')
      .input('orderToken', sql.NVarChar, orderToken)
      .input('idempotencyKey', sql.NVarChar, parsed.idempotencyKey || null);

    const inserted = await orderRequest.query(`
      INSERT INTO Orders (id, restaurant_id, order_number, channel, table_no, customer_name, customer_phone,
        customer_email, fulfillment, delivery_address, note, subtotal, delivery_fee, discount, total, currency,
        payment_method, payment_status, status, order_token, idempotency_key)
      OUTPUT INSERTED.id, INSERTED.order_number, INSERTED.status, INSERTED.payment_status, INSERTED.total, INSERTED.created_at
      VALUES (@id, @restaurantId, @orderNumber, @channel, @tableNo, @customerName, @customerPhone,
        @customerEmail, @fulfillment, @deliveryAddress, @note, @subtotal, @deliveryFee, @discount, @total, @currency,
        @paymentMethod, @paymentStatus, 'pending', @orderToken, @idempotencyKey)
    `);

    // إضافة الأسطر داخل المعاملة — يجب انتظار كل إدراج قبل الـ commit
    // (إدراج بدون await يسابق transaction.commit() ويسبب EINVALIDSTATE وسقوط الخادم)
    for (const line of pricedLines) {
      const lineRequest = new sql.Request(transaction);
      await lineRequest
        .input('orderId', sql.NVarChar, orderId)
        .input('itemId', sql.NVarChar, line.itemId)
        .input('itemName', sql.NVarChar, line.name)
        .input('price', sql.Decimal(10, 2), line.unitPrice)
        .input('qty', sql.Int, line.qty)
        .input('options', sql.NVarChar, line.options.length ? JSON.stringify(line.options) : null)
        .query(`
          INSERT INTO OrderLines (order_id, item_id, item_name, price, qty, options)
          VALUES (@orderId, @itemId, @itemName, @price, @qty, @options)
        `);
    }

    await transaction.commit();
    const order = inserted.recordset[0];
    return {
      id: order.id,
      number: order.order_number,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name_en || '',
      status: canonicalStatus(order.status),
      paymentMethod: parsed.paymentMethod,
      paymentStatus: order.payment_status,
      fulfillment: parsed.fulfillment,
      subtotal, deliveryFee, discount, total,
      currency: settings.currency || 'USD',
      customer: { name: customerName, phone: customerPhone },
      lines: pricedLines,
      note: parsed.note || '',
      createdAt: order.created_at,
      orderToken
    };
  } catch (err) {
    await transaction.rollback().catch(() => {});
    // تكرار نفس مفتاح الطلب (نقر مزدوج / إعادة إرسال) → إرجاع الطلب الموجود
    if (err.number === 2601 || err.number === 2627) {
      const existing = await findByIdempotencyKey(parsed.idempotencyKey, restaurant.id);
      if (existing) {
        const payloadFingerprintNew = `${(parsed.lines || []).map((l) => `${l.itemId}:${l.qty}`).sort().join('|')}|${parsed.fulfillment || 'pickup'}|${parsed.paymentMethod || 'cash'}`;
        const existingFingerprintNew = `${(existing.lines ? existing.lines.map((l) => `${l.item_id || l.itemId}:${l.qty}`).sort().join('|') : '')}|${existing.fulfillment || 'pickup'}|${existing.paymentMethod || 'cash'}`;
        // Note: existing.lines not loaded by mapOrderRow; compare using subtotal as proxy for item/qty change when lines unavailable
        const existingSubtotal = existing.subtotal ?? 0;
        const parsedSubtotalApprox = (parsed.lines || []).reduce((s, l) => s + (l.qty || 1) * 12, 0); // approximate using typical price; if different, likely conflict
        // For reliable conflict: compare item/qty fingerprint from parsed against DB OrderLines directly via separate query would be best; simplified: if subtotal differs significantly, flag conflict; else same
        if (!samePayload(parsed, existing)) {
          throw httpError(409, 'سجل الطلب متعارض (مفتاح مكرر مع بيانات مختلفة)', 'IDEMPOTENCY_CONFLICT');
        }
        return { ...existing, duplicate: true };
      }
    }
    if (err.status) throw err;
    throw httpError(500, `تعذر إنشاء الطلب: ${err.message}`, 'ORDER_CREATE_FAILED');
  }
}

async function findByIdempotencyKey(key, restaurantId) {
  if (!key || !restaurantId) return null;
  const pool = await getPool();
  const result = await pool.request()
    .input('key', sql.NVarChar, key)
    .input('restaurantId', sql.NVarChar, restaurantId)
    .query('SELECT * FROM Orders WHERE restaurant_id = @restaurantId AND idempotency_key = @key');
  if (result.recordset.length === 0) return null;
  const order = mapOrderRow(result.recordset[0]);
  const linesRes = await pool.request()
    .input('oid', sql.NVarChar, result.recordset[0].id)
    .query('SELECT item_id, qty FROM OrderLines WHERE order_id = @oid');
  order.lines = linesRes.recordset.map((l) => ({ item_id: l.item_id, itemId: l.item_id, qty: l.qty }));
  return order;
}

/** مقارنة بيانات الطلب (رهان فريد يمنع تكرار المفتاح مع payload مختلف) */
function samePayload(parsed, existing) {
  const pl = (parsed.lines || []).map((l) => `${l.itemId}:${l.qty}`).sort().join('|');
  const el = (existing.lines || []).map((l) => `${l.item_id || l.itemId}:${l.qty}`).sort().join('|');
  return pl === el &&
    (parsed.fulfillment || '') === (existing.fulfillment || '') &&
    (parsed.paymentMethod || 'cash') === (existing.paymentMethod || 'cash') &&
    (parsed.note || '') === (existing.note || '');
}

/** تحويل صف الطلب إلى شكل API موحد */
function mapOrderRow(o) {
  return {
    id: o.id,
    number: o.order_number,
    restaurantId: o.restaurant_id,
    channel: o.channel,
    table: o.table_no,
    customer: o.customer_name,
    customerPhone: o.customer_phone,
    customerEmail: o.customer_email,
    fulfillment: o.fulfillment || 'pickup',
    deliveryAddress: o.delivery_address,
    note: o.note,
    subtotal: Number(o.subtotal ?? o.total ?? 0),
    deliveryFee: Number(o.delivery_fee ?? 0),
    discount: Number(o.discount ?? 0),
    total: Number(o.total ?? 0),
    currency: o.currency || 'USD',
    paymentMethod: o.payment_method || 'cash',
    paymentStatus: o.payment_status || 'unpaid',
    status: canonicalStatus(o.status),
    rawStatus: o.status,
    createdAt: o.created_at,
    updatedAt: o.updated_at
  };
}

/* ----------------------------- القراءة ----------------------------- */

async function getOrdersByRestaurant(restaurantId, filters = {}) {
  const pool = await getPool();
  let query = `
    SELECT o.* FROM Orders o
    WHERE o.restaurant_id = @restaurantId
  `;
  const request = pool.request();
  request.input('restaurantId', sql.NVarChar, restaurantId);

  if (filters.status) {
    const canonical = canonicalStatus(filters.status);
    const legacy = Object.keys(LEGACY_STATUS_MAP).find((k) => LEGACY_STATUS_MAP[k] === canonical);
    query += ` AND o.status IN (${legacy ? `@status, @legacyStatus` : `@status`})`;
    request.input('status', sql.NVarChar, canonical);
    if (legacy) request.input('legacyStatus', sql.NVarChar, legacy);
  }
  if (filters.paymentMethod) {
    query += ' AND o.payment_method = @paymentMethod';
    request.input('paymentMethod', sql.NVarChar, filters.paymentMethod);
  }
  if (filters.paymentStatus) {
    query += ' AND o.payment_status = @paymentStatus';
    request.input('paymentStatus', sql.NVarChar, filters.paymentStatus);
  }
  if (filters.from) {
    query += ' AND o.created_at >= @fromDate';
    request.input('fromDate', sql.DateTime, filters.from);
  }
  if (filters.to) {
    query += ' AND o.created_at <= @toDate';
    request.input('toDate', sql.DateTime, filters.to);
  }

  query += ' ORDER BY o.created_at DESC';
  const result = await request.query(query);

  // إرفاق الأسطر
  const orders = result.recordset;
  if (orders.length === 0) return [];
  const ids = orders.map((o) => o.id);
  const lineRequest = pool.request();
  const inList = ids.map((id, i) => {
    lineRequest.input(`l${i}`, sql.NVarChar, id);
    return `@l${i}`;
  }).join(', ');
  const lines = await lineRequest.query(`
    SELECT order_id, item_id AS itemId, item_name AS name, price, qty, options
    FROM OrderLines WHERE order_id IN (${inList})
  `);
  const grouped = new Map();
  for (const line of lines.recordset) {
    let options = null;
    try { options = line.options ? JSON.parse(line.options) : null; } catch { options = null; }
    const shaped = { ...line, options };
    delete shaped.order_id;
    if (!grouped.has(line.order_id)) grouped.set(line.order_id, []);
    grouped.get(line.order_id).push(shaped);
  }
  return orders.map((o) => ({ ...mapOrderRow(o), lines: grouped.get(o.id) || [] }));
}

async function getOrderById(orderId) {
  const pool = await getPool();
  const orderResult = await pool.request()
    .input('id', sql.NVarChar, orderId)
    .query('SELECT * FROM Orders WHERE id = @id');
  if (orderResult.recordset.length === 0) throw httpError(404, 'الطلب غير موجود', 'ORDER_NOT_FOUND');

  const linesResult = await pool.request()
    .input('id', sql.NVarChar, orderId)
    .query('SELECT item_id AS itemId, item_name AS name, price, qty, options FROM OrderLines WHERE order_id = @id');
  const lines = linesResult.recordset.map((l) => {
    let options = null;
    try { options = l.options ? JSON.parse(l.options) : null; } catch { options = null; }
    return { ...l, options };
  });
  return { ...mapOrderRow(orderResult.recordset[0]), lines };
}

/**
 * متابعة الطلب للعميل الضيف — تتطلب الرمز الآمن (order_token).
 */
async function trackOrder(orderId, token) {
  if (!token) throw httpError(400, 'رمز المتابعة مطلوب', 'TOKEN_REQUIRED');
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.NVarChar, orderId)
    .input('token', sql.NVarChar, token)
    .query('SELECT * FROM Orders WHERE id = @id AND order_token = @token');
  if (result.recordset.length === 0) throw httpError(404, 'الطلب غير موجود أو رمز المتابعة غير صحيح', 'ORDER_NOT_FOUND');
  const order = await getOrderById(orderId);
  // لا نعيد رمز التتبع في الاستجابة
  const { orderToken, ...safe } = order;
  return safe;
}

/* ----------------------------- التحديث ----------------------------- */

/**
 * تحديث حالة الطلب مع التحقق من سير العمل المسموح.
 */
async function updateOrderStatus(orderId, nextStatus, actorRole) {
  const canonical = canonicalStatus(nextStatus);
  if (!ORDER_STATUSES.includes(canonical)) {
    throw httpError(400, 'حالة الطلب غير صحيحة', 'INVALID_STATUS');
  }
  const pool = await getPool();
  const current = await pool.request()
    .input('id', sql.NVarChar, orderId)
    .query('SELECT status FROM Orders WHERE id = @id');
  if (current.recordset.length === 0) throw httpError(404, 'الطلب غير موجود', 'ORDER_NOT_FOUND');

  const currentStatus = current.recordset[0].status;
  const allowed = STATUS_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(canonical)) {
    throw httpError(409, `لا يمكن الانتقال من ${currentStatus} إلى ${canonical}`, 'INVALID_TRANSITION');
  }

  const result = await pool.request()
    .input('id', sql.NVarChar, orderId)
    .input('status', sql.NVarChar, canonical)
    .query(`
      UPDATE Orders SET status = @status, updated_at = GETDATE()
      OUTPUT INSERTED.id, INSERTED.status
      WHERE id = @id
    `);
  return result.recordset[0];
}

async function deleteOrder(orderId) {
  const pool = await getPool();
  await pool.request().input('id', sql.NVarChar, orderId)
    .query('DELETE FROM OrderLines WHERE order_id = @id');
  const result = await pool.request().input('id', sql.NVarChar, orderId)
    .query('DELETE FROM Orders OUTPUT DELETED.id WHERE id = @id');
  if (result.recordset.length === 0) throw httpError(404, 'الطلب غير موجود', 'ORDER_NOT_FOUND');
  return { deleted: true, id: orderId };
}

/**
 * تسجيل دفع نقدي مستلم (يدوي من لوحة المطعم) — نقدي لا يصبح "مدفوع" إلكترونيًا.
 */
async function markOrderPaid(orderId, method, stripePaymentId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.NVarChar, orderId)
    .input('paymentStatus', sql.NVarChar, 'paid')
    .input('paymentMethod', sql.NVarChar, method || null)
    .query(`
      UPDATE Orders SET payment_status = @paymentStatus,
             payment_method = COALESCE(@paymentMethod, payment_method),
             updated_at = GETDATE()
      OUTPUT INSERTED.id, INSERTED.payment_status
      WHERE id = @id
    `);
  if (result.recordset.length === 0) throw httpError(404, 'الطلب غير موجود', 'ORDER_NOT_FOUND');
  return result.recordset[0];
}

/** إنشاء طلب كونتر (موظف المطعم) — بنفس محرّك التسعير */
async function createCounterOrder(input) {
  return createPublicOrder({
    ...input,
    channel: 'counter',
    fulfillment: input.fulfillment || (input.table ? 'table' : 'pickup')
  });
}

module.exports = {
  ORDER_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  DEFAULT_ORDERING,
  canonicalStatus,
  orderingSettingsFromRow,
  createPublicOrder,
  createCounterOrder,
  getOrdersByRestaurant,
  getOrderById,
  trackOrder,
  updateOrderStatus,
  deleteOrder,
  markOrderPaid
};
