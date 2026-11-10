/**
 * MenuCraft — خدمة الطلبات (محوّلة لـ MariaDB / mysql2)
 * ------------------------------------------------------------
 * قواعد أساسية:
 *  - الأسعار تُحسب من قاعدة البيانات دائمًا.
 *  - إنشاء الطلب داخل معاملة قاعدة بيانات واحدة.
 *  - idempotency_key يمنع تكرار الطلب.
 *  - رمز order_token يتيح للضيف متابعة طلبه.
 */
const crypto = require('crypto');
const { getMySQLPool } = require('../config/mysql');
const { z } = require('zod');
const { normalizeRole } = require('../middleware/roles');
const { userOwnsSite } = require('./site.service');

/* ----------------------------- الحالات ----------------------------- */
const ORDER_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];
const LEGACY_STATUS_MAP = { received: 'pending', served: 'completed' };

const STATUS_TRANSITIONS = {
  pending: ['confirmed', 'preparing', 'cancelled'],
  received: ['confirmed', 'preparing', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['completed'],
  completed: [],
  cancelled: []
};

/**
 * صلاحيات الدور على الانتقالات (P0 C-3): كل دور يحرّك الحالة التي تخصّه فقط.
 * الحالة الحالية تبقى مربوطة بـ STATUS_TRANSITIONS أعلاه (state machine) —
 * هذا الجدول يضيف طبقة الدور فوقها:
 *   - cashier: يقبل الطلب (confirmed) ويلغيه (cancelled) — واجهة الكونتر/الكاشير.
 *   - kitchen: يبدأ التحضير ويجعله جاهزًا — لا يلغي الطلبات.
 *   - waiter: يُسلّم الطلب المكتمل (completed) فقط.
 *   - المالك/إدارة المنصة (client/super_admin/admin): كل الانتقالات.
 */
const ALL_TRANSITIONS = ['confirmed', 'preparing', 'ready', 'completed', 'cancelled'];
const ROLE_ALLOWED_STATUSES = Object.freeze({
  super_admin: ALL_TRANSITIONS,
  admin: ALL_TRANSITIONS,
  client: ALL_TRANSITIONS,
  cashier: ['confirmed', 'cancelled'],
  kitchen: ['preparing', 'ready'],
  waiter: ['completed']
});

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
    // الهاتف: يُقبل الفارغ لطلبات الكونتر (POS) — الفحص الفعلي في createPublicOrder
    // (رقم الهاتف مطلوب للطلب الإلكتروني فقط، ومحظور للكونتر) — إصلاح P0 C-4.
    phone: z.string().max(30).refine((v) => v.length === 0 || v.length >= 5, 'رقم الهاتف مطلوب').optional(),
    email: z.string().email().optional().or(z.literal(''))
  }).optional(),
  customerName: z.string().min(1).max(120).optional(),
  customerPhone: z.string().max(30).optional(),
  fulfillment: z.enum(['delivery', 'pickup', 'table']).default('pickup'),
  deliveryAddress: z.string().max(500).optional(),
  table: z.string().max(50).optional(),
  note: z.string().max(500).optional(),
  paymentMethod: z.enum(PAYMENT_METHODS).default('cash'),
  promoCode: z.string().max(50).optional(),
  channel: z.enum(['online', 'counter']).default('online'),
  branchId: z.string().optional(),
  lines: z.array(orderLineInput).min(1, 'يجب اختيار صنف واحد على الأقل'),
  idempotencyKey: z.string().min(8).max(100).optional()
});

/* ----------------------------- إعدادات الطلب ----------------------------- */
const DEFAULT_ORDERING = {
  enabled: true,
  fulfillment: { delivery: true, pickup: true },
  deliveryFee: 0,
  minOrder: 0,
  currency: 'USD',
  promo: null,
  paymentMethods: {
    cash: { enabled: true },
    cash_at_pickup: { enabled: true },
    card: { enabled: false },
    wallet: { enabled: false },
    bank_transfer: { enabled: false, instructions: '' }
  }
};

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
    extra += Number(option.price || 0);
    chosen.push({ groupId: group.id, groupName: group.name, optionId: option.id, optionName: option.name, price: Number(option.price || 0) });
  }
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
async function createPublicOrder(input) {
  const parsed = createOrderSchema.parse(input);
  const pool = await getMySQLPool();

  if (!parsed.restaurantId && !parsed.slug) {
    throw httpError(400, 'المطعم مطلوب', 'RESTAURANT_REQUIRED');
  }
  const customerName = parsed.customer?.name || parsed.customerName || '';
  const customerPhone = parsed.customer?.phone || parsed.customerPhone || '';
  if (!customerName) {
    throw httpError(400, 'اسم العميل مطلوب', 'CUSTOMER_REQUIRED');
  }
  if (!customerPhone && parsed.channel !== 'counter') {
    throw httpError(400, 'رقم الهاتف مطلوب للطلب الإلكتروني', 'CUSTOMER_REQUIRED');
  }

  /* 1) جلب المطعم */
  const connection = await pool.getConnection();
  let restaurant;
  if (parsed.restaurantId) {
    const [rows] = await connection.execute('SELECT * FROM Restaurants WHERE id = ?', [parsed.restaurantId]);
    restaurant = rows[0];
  } else {
    const [rows] = await connection.execute('SELECT * FROM Restaurants WHERE slug = ?', [parsed.slug]);
    restaurant = rows[0];
  }
  if (!restaurant) throw httpError(404, 'المطعم غير موجود', 'RESTAURANT_NOT_FOUND');

  if (restaurant.status !== 'published') {
    throw httpError(403, 'منيو هذا المطعم غير منشور حاليًا', 'MENU_NOT_PUBLISHED');
  }
  const settings = orderingSettingsFromRow(restaurant);
  if (!settings.enabled) {
    throw httpError(403, 'الطلب الإلكتروني غير مفعّل لهذا المطعم', 'ORDERING_DISABLED');
  }

  /* 2) التحقق من وسيلة الدفع */
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

  /* 2b) التوصيل يتطلب دفع إلكتروني */
  if (parsed.fulfillment === 'delivery' && !['card', 'wallet'].includes(parsed.paymentMethod)) {
    throw httpError(400, 'التوصيل يتطلب الدفع الإلكتروني فقط', 'ONLINE_PAYMENT_REQUIRED');
  }

  /* 3) التحقق من الاستلام */
  if (parsed.fulfillment === 'delivery') {
    if (!settings.fulfillment.delivery) throw httpError(400, 'التوصيل غير متاح لهذا المطعم', 'FULFILLMENT_UNAVAILABLE');
    if (!parsed.deliveryAddress || parsed.deliveryAddress.trim().length < 5) {
      throw httpError(400, 'عنوان التوصيل مطلوب', 'DELIVERY_ADDRESS_REQUIRED');
    }
  } else if (parsed.fulfillment === 'pickup') {
    if (!settings.fulfillment.pickup) throw httpError(400, 'الاستلام من المطعم غير متاح', 'FULFILLMENT_UNAVAILABLE');
  }

  /* 4) تسعير الأصناف */
  const itemIds = [...new Set(parsed.lines.map((l) => l.itemId))];
  const { resolveItemsForOrder } = require('./menu.service');
  const itemMap = await resolveItemsForOrder(restaurant, itemIds);

  const pricedLines = [];
  let subtotal = 0;
  for (const line of parsed.lines) {
    const item = itemMap.get(line.itemId);
    if (!item) throw httpError(400, 'صنف غير موجود في منيو المطعم', 'ITEM_NOT_FOUND');
    if (!item.available) throw httpError(400, `الصنف غير متاح حاليًا: ${item.name?.en || ''}`, 'ITEM_UNAVAILABLE');
    const { unitPrice, optionLines } = priceItem(item, line.options);
    const lineTotal = unitPrice * line.qty;
    subtotal += lineTotal;
    pricedLines.push({
      itemId: item.id,
      name: item.displayName || item.name?.en || item.name?.ar || '',
      nameAr: item.name?.ar || '',
      unitPrice,
      price: unitPrice,
      qty: line.qty,
      options: optionLines
    });
  }

  /* 5) الحد الأدنى */
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

  /* 7) حالة الدفع */
  const paymentStatus = (parsed.paymentMethod === 'bank_transfer') ? 'awaiting_confirmation' : 'unpaid';

  /* 8) إنشاء الطلب داخل معاملة */
  const orderToken = crypto.randomBytes(24).toString('hex');
  const orderId = `ord-${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}`;

  try {
    await connection.beginTransaction();

    // رقم الطلب التالي
    const channelFilterValue = parsed.channel === 'online' ? 'online' : null;
    const [maxRow] = await connection.execute(
      'SELECT MAX(order_number) AS maxNum FROM Orders WHERE restaurant_id = ?' + (channelFilterValue ? ' AND channel = ?' : ''),
      [restaurant.id, ...(channelFilterValue ? [channelFilterValue] : [])]
    );
    const maxNumRow = maxRow[0] || maxRow[0] ? maxRow : { maxNum: null }; // handle different mysql2 versions
    const maxNumObj = maxRow[0] ? maxRow[0] : maxRow;
    const maxNum = maxNumObj.maxNum || maxNumObj.MAX_NUM || 0;
    const orderNumber = (maxNum ? Number(maxNum) : 0) + 1;
    // temp debug - remove after

    await connection.execute(
        `INSERT INTO Orders (id, restaurant_id, order_number, channel, table_no, customer_name, customer_phone,
          customer_email, fulfillment, delivery_address, note, subtotal, delivery_fee, discount, total, currency,
          payment_method, payment_status, status, order_token, idempotency_key, branch_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId, restaurant.id, orderNumber, parsed.channel, parsed.table || null,
          customerName, customerPhone, parsed.customer?.email || null,
          parsed.fulfillment, parsed.deliveryAddress || null, parsed.note || '',
          subtotal, deliveryFee, discount, total, settings.currency || 'USD',
          parsed.paymentMethod, paymentStatus, 'pending', orderToken,
          parsed.idempotencyKey || null,
          parsed.branchId || null
        ]
      );

    for (const line of pricedLines) {
      await connection.execute(
        `INSERT INTO OrderLines (id, order_id, item_id, item_name, price, qty, options)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          crypto.randomUUID(), orderId, line.itemId, line.name, line.unitPrice, line.qty,
          line.options && line.options.length ? JSON.stringify(line.options) : null
        ]
      );
    }

    await connection.commit();

    return {
      id: orderId,
      number: orderNumber,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name_en || '',
      status: canonicalStatus('pending'),
      paymentMethod: parsed.paymentMethod,
      paymentStatus,
      fulfillment: parsed.fulfillment,
      subtotal, deliveryFee, discount, total,
      currency: settings.currency || 'USD',
      customer: { name: customerName, phone: customerPhone },
      lines: pricedLines,
      note: parsed.note || '',
      createdAt: new Date(),
      orderToken
    };
  } catch (err) {
    try { await connection.rollback(); } catch (e) { /* ignore */ }
    // تكرار مفتاح الطلب
    const isDuplicate = err.errno === 1062 || err.code === 'ER_DUP_ENTRY' || (err.message || '').includes('Duplicate');
    if (isDuplicate && parsed.idempotencyKey) {
      const existing = await findByIdempotencyKey(parsed.idempotencyKey, restaurant.id);
      if (existing) {
        if (!samePayload(parsed, existing)) {
          throw httpError(409, 'سجل الطلب متعارض (مفتاح مكرر مع بيانات مختلفة)', 'IDEMPOTENCY_CONFLICT');
        }
        return { ...existing, duplicate: true };
      }
    }
    if (err.status) throw err;
    throw httpError(500, `تعذر إنشاء الطلب: ${err.message}`, 'ORDER_CREATE_FAILED');
  } finally {
    connection.release();
  }
}

async function findByIdempotencyKey(key, restaurantId) {
  if (!key || !restaurantId) return null;
  const pool = await getMySQLPool();
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT * FROM Orders WHERE restaurant_id = ? AND idempotency_key = ?',
      [restaurantId, key]
    );
    if (rows.length === 0) {
      return null;
    }
    const order = mapOrderRow(rows[0]);
    const [lineRows] = await connection.execute(
      'SELECT item_id, qty FROM OrderLines WHERE order_id = ?',
      [rows[0].id]
    );
    order.lines = lineRows.map((l) => ({ item_id: l.item_id, itemId: l.item_id, qty: l.qty }));
    return order;
  } finally {
    connection.release();
  }
}

function samePayload(parsed, existing) {
  const pl = (parsed.lines || []).map((l) => `${l.itemId}:${l.qty}`).sort().join('|');
  const el = (existing.lines || []).map((l) => `${l.item_id || l.itemId}:${l.qty}`).sort().join('|');
  return pl === el &&
    (parsed.fulfillment || '') === (existing.fulfillment || '') &&
    (parsed.paymentMethod || 'cash') === (existing.paymentMethod || 'cash') &&
    (parsed.note || '') === (existing.note || '');
}

function mapOrderRow(o) {
  return {
    id: o.id,
    number: o.order_number,
    restaurantId: o.restaurant_id,
    branchId: o.branch_id || null,
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
  const pool = await getMySQLPool();
  const connection = await pool.getConnection();
  try {
    let query = 'SELECT o.* FROM Orders o WHERE o.restaurant_id = ?';
    const params = [restaurantId];

    if (filters.status) {
      const canonical = canonicalStatus(filters.status);
      const legacy = Object.keys(LEGACY_STATUS_MAP).find((k) => LEGACY_STATUS_MAP[k] === canonical);
      if (legacy) {
        query += ' AND o.status IN (?, ?)';
        params.push(canonical, legacy);
      } else {
        query += ' AND o.status = ?';
        params.push(canonical);
      }
    }
    if (filters.paymentMethod) {
      query += ' AND o.payment_method = ?';
      params.push(filters.paymentMethod);
    }
    if (filters.paymentStatus) {
      query += ' AND o.payment_status = ?';
      params.push(filters.paymentStatus);
    }
    if (filters.from) {
      query += ' AND o.created_at >= ?';
      params.push(filters.from);
    }
    if (filters.to) {
      query += ' AND o.created_at <= ?';
      params.push(filters.to);
    }
    query += ' ORDER BY o.created_at DESC';

    const [orders] = await connection.execute(query, params);
    if (orders.length === 0) return [];

    const ids = orders.map((o) => o.id);
    const placeholders = ids.map(() => '?').join(', ');
    const [lines] = await connection.execute(
      `SELECT order_id, item_id AS itemId, item_name AS name, price, qty, options FROM OrderLines WHERE order_id IN (${placeholders})`,
      ids
    );
    const grouped = new Map();
    for (const line of lines) {
      let options = null;
      try { options = line.options ? JSON.parse(line.options) : null; } catch { options = null; }
      const shaped = { ...line, options };
      delete shaped.order_id;
      if (!grouped.has(line.order_id)) grouped.set(line.order_id, []);
      grouped.get(line.order_id).push(shaped);
    }
    return orders.map((o) => ({ ...mapOrderRow(o), lines: grouped.get(o.id) || [] }));
  } finally {
    connection.release();
  }
}

async function getOrderById(orderId) {
  const pool = await getMySQLPool();
  const connection = await pool.getConnection();
  try {
    const [orderResult] = await connection.execute('SELECT * FROM Orders WHERE id = ?', [orderId]);
    if (orderResult.length === 0) throw httpError(404, 'الطلب غير موجود', 'ORDER_NOT_FOUND');

    const [linesResult] = await connection.execute(
      'SELECT item_id AS itemId, item_name AS name, price, qty, options FROM OrderLines WHERE order_id = ?',
      [orderId]
    );
    const lines = linesResult.map((l) => {
      let options = null;
      try { options = l.options ? JSON.parse(l.options) : null; } catch { options = null; }
      return { ...l, options };
    });
    return { ...mapOrderRow(orderResult[0]), lines };
  } finally {
    connection.release();
  }
}

async function trackOrder(orderId, token) {
  if (!token) throw httpError(400, 'رمز المتابعة مطلوب', 'TOKEN_REQUIRED');
  const pool = await getMySQLPool();
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute('SELECT * FROM Orders WHERE id = ? AND order_token = ?', [orderId, token]);
    if (rows.length === 0) throw httpError(404, 'الطلب غير موجود أو رمز المتابعة غير صحيح', 'ORDER_NOT_FOUND');
    const order = await getOrderById(orderId);
    const { orderToken, ...safe } = order;
    return safe;
  } finally {
    connection.release();
  }
}

/* ----------------------------- التحديث ----------------------------- */
/**
 * تحديث حالة الطلب مع تحقق ثلاثي (P0 C-3):
 *  1) الطلب يعود لمطعم يملكه الفاعل (tenant check).
 *  2) الانتقال مسموح في state machine الحالية.
 *  3) الدور المُرسِل مسموح له بهذا الانتقال (role matrix).
 *
 * @param {string} orderId
 * @param {string} nextStatus
 * @param {{ userId?: string, role?: string }} actor الفاعل من التوكن المُتحقَّق منه
 */
async function updateOrderStatus(orderId, nextStatus, actor = {}) {
  const canonical = canonicalStatus(nextStatus);
  if (!ORDER_STATUSES.includes(canonical)) {
    throw httpError(400, 'حالة الطلب غير صحيحة', 'INVALID_STATUS');
  }
  const role = normalizeRole(actor.role);
  const pool = await getMySQLPool();
  const connection = await pool.getConnection();
  try {
    const [currentRows] = await connection.execute('SELECT status, restaurant_id FROM Orders WHERE id = ?', [orderId]);
    if (currentRows.length === 0) throw httpError(404, 'الطلب غير موجود', 'ORDER_NOT_FOUND');

    const currentStatus = currentRows[0].status;

    // 1) العائد للطلب: ملكية المطعم تُفحص دائمًا في الخادم بغضّ النظر عن الطلب
    const owns = await userOwnsSite(actor.userId, currentRows[0].restaurant_id, role);
    if (!owns) {
      throw httpError(403, 'الطلب لا يعود إلى مطعمك', 'NOT_SITE_OWNER');
    }

    const allowed = STATUS_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(canonical)) {
      throw httpError(409, `لا يمكن الانتقال من ${currentStatus} إلى ${canonical}`, 'INVALID_TRANSITION');
    }

    // 3) صلاحية الدور على هذا الانتقال بالذات
    const allowedForRole = ROLE_ALLOWED_STATUSES[role];
    if (!allowedForRole || !allowedForRole.includes(canonical)) {
      throw httpError(403, 'هذه الحالة غير مسموحة لدورك', 'ROLE_FORBIDDEN');
    }

    await connection.execute(
      'UPDATE Orders SET status = ?, updated_at = NOW() WHERE id = ?',
      [canonical, orderId]
    );
    const [updated] = await connection.execute('SELECT id, status FROM Orders WHERE id = ?', [orderId]);

    // سجل النشاط (P1) — نشاط حقيقي يُقرأ من /api/owner/audit
    try {
      const { logActivity } = require('./audit.service');
      await logActivity({
        restaurantId: currentRows[0].restaurant_id,
        userId: actor.userId,
        actorRole: actor.role,
        action: 'order.status_changed',
        details: { order_id: orderId, from: currentStatus, to: canonical },
        ip: actor.ip,
        userAgent: actor.userAgent,
      });
    } catch (_) { /* السجل مساند — لا يُفشل تحديث الحالة */ }

    return updated[0];
  } finally {
    connection.release();
  }
}

async function deleteOrder(orderId) {
  const pool = await getMySQLPool();
  const connection = await pool.getConnection();
  try {
    await connection.execute('DELETE FROM OrderLines WHERE order_id = ?', [orderId]);
    const [deleted] = await connection.execute('DELETE FROM Orders WHERE id = ?', [orderId]);
    if (deleted.affectedRows === 0) throw httpError(404, 'الطلب غير موجود', 'ORDER_NOT_FOUND');
    return { deleted: true, id: orderId };
  } finally {
    connection.release();
  }
}

async function markOrderPaid(orderId, method, stripePaymentId) {
  const pool = await getMySQLPool();
  const connection = await pool.getConnection();
  try {
    await connection.execute(
      `UPDATE Orders SET payment_status = ?,
         payment_method = COALESCE(?, payment_method),
         updated_at = NOW()
       WHERE id = ?`,
      ['paid', method || null, orderId]
    );
    const [rows] = await connection.execute('SELECT id, payment_status FROM Orders WHERE id = ?', [orderId]);
    if (rows.length === 0) throw httpError(404, 'الطلب غير موجود', 'ORDER_NOT_FOUND');
    return rows[0];
  } finally {
    connection.release();
  }
}

async function createCounterOrder(input) {
  return createPublicOrder({
    ...input,
    channel: 'counter',
    fulfillment: input.fulfillment || (input.table ? 'table' : 'pickup')
  });
}

/**
 * Builds a sales series (daily / monthly / yearly) from real Orders rows for a
 * restaurant — grouping by date, summing `total` per bucket. Cancelled excluded.
 */
async function getSalesSeries(restaurantId) {
  const pool = await getMySQLPool();
  const connection = await pool.getConnection();
  try {
    const [orders] = await connection.execute(
      `SELECT id, created_at, total FROM Orders
       WHERE restaurant_id = ? AND status != 'cancelled' AND total IS NOT NULL
       ORDER BY created_at ASC`,
      [restaurantId]
    );

    const dayMap = new Map();
    const monthMap = new Map();
    const yearMap = new Map();

    for (const o of orders) {
      const d = new Date(o.created_at);
      const dayKey = d.toISOString().slice(0, 10);
      if (!dayMap.has(dayKey)) dayMap.set(dayKey, { date: dayKey, orders: 0, revenue: 0 });
      const db = dayMap.get(dayKey);
      db.orders += 1;
      db.revenue += Number(o.total || 0);

      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap.has(monthKey)) monthMap.set(monthKey, { date: monthKey, orders: 0, revenue: 0 });
      const mb = monthMap.get(monthKey);
      mb.orders += 1;
      mb.revenue += Number(o.total || 0);

      const yearKey = String(d.getFullYear());
      if (!yearMap.has(yearKey)) yearMap.set(yearKey, { date: yearKey, orders: 0, revenue: 0 });
      const yb = yearMap.get(yearKey);
      yb.orders += 1;
      yb.revenue += Number(o.total || 0);
    }

    const daily = [...dayMap.values()].sort((a, b) => (a.date < b.date ? -1 : 1)).slice(-30);
    const monthly = [...monthMap.values()].sort((a, b) => (a.date < b.date ? -1 : 1)).slice(-12);
    const yearly = [...yearMap.values()].sort((a, b) => Number(b.date) - Number(a.date)).slice(0, 5);

    return { daily, monthly, yearly };
  } finally { connection.release(); }
}

async function getPendingOrdersCount() {
  const pool = await getMySQLPool();
  const c = await pool.getConnection();
  try {
    const [rows] = await c.execute('SELECT COUNT(*) as count FROM Orders WHERE status = "pending"');
    return rows[0]?.count || 0;
  } finally { c.release(); }
}

module.exports = {
  ORDER_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  DEFAULT_ORDERING,
  getPendingOrdersCount,
  canonicalStatus,
  orderingSettingsFromRow,
  createPublicOrder,
  createCounterOrder,
  getOrdersByRestaurant,
  getOrderById,
  trackOrder,
  updateOrderStatus,
  deleteOrder,
  markOrderPaid,
  getSalesSeries
};
