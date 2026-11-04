/**
 * Smoke test للـ Backend الجديد — يُشغل الخادم أولًا (npm run dev).
 * يختبر: الحسابات، حدود المواقع، المنيو العام، الطلبات، وسائل الدفع، والملكية.
 * الاستخدام: node smoke-test.js   (من مجلد backend)
 */
const BASE = process.env.BASE_URL || 'http://127.0.0.1:3000';

let cookie = '';
let adminCookie = '';

async function req(path, { method = 'GET', body, useAdmin = false, cookieJar } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const c = cookieJar ?? (useAdmin ? adminCookie : cookie);
  if (c) headers.Cookie = c;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const setCookie = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  const jar = [...(c ? c.split('; ').filter(Boolean) : []), ...setCookie.map((s) => s.split(';')[0])];
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  return { status: res.status, body: json, cookie: jar.join('; ') };
}

const results = [];
function check(name, cond, detail) {
  results.push({ name, pass: Boolean(cond), detail });
  console.log(`${cond ? '✅' : '❌'} ${name}${detail ? ` — ${detail}` : ''}`);
}

async function main() {
  /* 1. الخدمة والباقات */
  const health = await req('/health');
  check('GET /health', health.status === 200);

  const plans = await req('/api/platform/plans');
  const planList = plans.body?.data || [];
  check('GET /api/platform/plans — 3 باقات نشطة', plans.status === 200 && planList.filter((p) => p.is_active).length >= 3,
    planList.map((p) => `${p.name}(${p.price}) max:${p.max_restaurants}`).join(' | '));

  /* 2. تسجيل مستخدم جديد = تجربة 3 أيام + موقع واحد */
  const email = `smoke-${Date.now()}@menucraft.test`;
  const signup = await req('/api/auth/signup', {
    method: 'POST',
    body: { name: 'Smoke Tester', email, password: 'secret123', restaurantName: `Smoke Site ${Date.now()}` }
  });
  cookie = signup.cookie;
  check('POST /api/auth/signup — ينشئ حسابًا', signup.status === 200 && signup.body?.ok === true, `status=${signup.status}`);

  const me = await req('/api/auth/me', { cookieJar: cookie });
  const sub = me.body?.data?.subscription;
  check('GET /api/auth/me — اشتراك تجربة trialing', sub?.status === 'trialing' && sub?.limits?.planId === 'trial',
    `status=${sub?.status} plan=${sub?.limits?.planId} daysLeft=${sub?.daysLeft}`);

  /* 3. ملخص المواقع */
  const summary = await req('/api/sites/summary', { cookieJar: cookie });
  const s = summary.body?.data;
  check('GET /api/sites/summary — 1/1 ومتبقٍ 0', s?.used === 1 && s?.maxSites === 1 && s?.remaining === 0,
    `used=${s?.used} max=${s?.maxSites} remaining=${s?.remaining} canCreate=${s?.canCreate}`);

  /* 4. محاولة إنشاء موقع ثانٍ = مرفوض (الحد من الخادم) */
  const create2 = await req('/api/restaurants', {
    method: 'POST', cookieJar: cookie,
    body: { name: 'Second Site', slug: `smoke-second-${Date.now()}` }
  });
  check('POST /api/restaurants (الثاني في التجربة) — 403 PLAN_LIMIT_REACHED',
    create2.status === 403 && create2.body?.code === 'PLAN_LIMIT_REACHED', `status=${create2.status} code=${create2.body?.code}`);

  /* 5. رفع الباقة إلى Professional يدويًا (مسار الإدارة) ثم إنشاء موقعين إضافيين */
  // 5a. محاولة رفع من العميل نفسه = مرفوض (403 ADMIN_ONLY)
  const selfUpgrade = await req('/api/platform/subscriptions', {
    method: 'POST', cookieJar: cookie,
    body: { restaurantId: 'x', planId: 'professional', price: 29, status: 'active', renewsAt: new Date(Date.now() + 30 * 864e5).toISOString() }
  });
  check('POST /api/platform/subscriptions من العميل — 403 ADMIN_ONLY',
    selfUpgrade.status === 403 && selfUpgrade.body?.code === 'ADMIN_ONLY', `status=${selfUpgrade.status}`);

  /* 6. تفعيل Professional عبر مسار موثوق داخليًا (محاكاة Webhook) — يحاكي تأكيد Stripe */
  const { activateSubscriptionForUser } = require('./src/services/payment.service');
  const meData = me.body?.data;
  const userId = meData?.user?.id;
  const activated = await activateSubscriptionForUser(userId, 'professional', 'pi_smoke_test_only', 29);
  check('تفعيل Professional (مسار تأكيد الدفع الموثوق)', activated?.plan === 'Professional', JSON.stringify(activated));

  const summary2 = await req('/api/sites/summary', { cookieJar: cookie });
  const s2 = summary2.body?.data;
  check('ملخص بعد Professional — 1/3 ومتبقٍ 2', s2?.used === 1 && s2?.maxSites === 3 && s2?.remaining === 2,
    `used=${s2?.used} max=${s2?.maxSites} remaining=${s2?.remaining}`);

  /* 7. ملء الحصة (3 مواقع إجماليًا: 1 من التجربة + موقعان) ثم رفض الخامس */
  const create3 = await req('/api/restaurants', { method: 'POST', cookieJar: cookie, body: { name: 'Third Site', slug: `smoke-third-${Date.now()}` } });
  const create4 = await req('/api/restaurants', { method: 'POST', cookieJar: cookie, body: { name: 'Fourth Site', slug: `smoke-fourth-${Date.now()}` } });
  const create5blocked = await req('/api/restaurants', { method: 'POST', cookieJar: cookie, body: { name: 'Fifth Blocked', slug: `smoke-fifth-${Date.now()}` } });
  check('POST /api/restaurants (الموقع الثاني بعد الترقية) — 201', create3.status === 201, `status=${create3.status}`);
  check('POST /api/restaurants (ملء الحصة 3/3) — 201', create4.status === 201, `status=${create4.status}`);
  check('POST /api/restaurants (محاولة تجاوز الحد 4/3) — 403 PLAN_LIMIT_REACHED',
    create5blocked.status === 403 && create5blocked.body?.code === 'PLAN_LIMIT_REACHED',
    `status=${create5blocked.status} code=${create5blocked.body?.code}`);

  /* 8. Business = بلا حد */
  await activateSubscriptionForUser(userId, 'business', 'pi_smoke_business', 79);
  const create5 = await req('/api/restaurants', { method: 'POST', cookieJar: cookie, body: { name: 'Fifth Site', slug: `smoke-sixth-${Date.now()}` } });
  const summary3 = await req('/api/sites/summary', { cookieJar: cookie });
  const s3 = summary3.body?.data;
  check('Business — إنشاء موقع رابع/خامس مسموح وUnlimited في الملخص',
    create5.status === 201 && s3?.maxSites === -1 && s3?.unlimited === true && s3?.remaining === null,
    `status=${create5.status} max=${s3?.maxSites} unlimited=${s3?.unlimited}`);

  /* 9. تجهيز المنيو والموقع ثم نشره (كما تفعل الواجهة) */
  const mySites = (await req('/api/sites', { cookieJar: cookie })).body?.data || [];
  const site = mySites[0];
  check('GET /api/sites — يعيد مواقع المستخدم', mySites.length >= 1, `count=${mySites.length}`);

  const demoMenu = [
    {
      id: 'cat-burgers', name: 'Burgers', note: 'Fresh daily',
      items: [
        { id: 'item-classic', name: 'Classic Burger', description: 'Beef, cheddar, brioche', price: 12.5, image: '', featured: true, popular: true, available: true,
          options: [{ id: 'size', name: 'Size', required: true, max: 1, options: [{ id: 'reg', name: 'Regular', price: 0 }, { id: 'large', name: 'Large', price: 2.5 }] }] },
        { id: 'item-soldout', name: 'Sold Out Burger', description: 'Unavailable today', price: 10, available: false }
      ]
    },
    { id: 'cat-drinks', name: 'Drinks', note: '', items: [{ id: 'item-cola', name: 'Cola', description: '', price: 3, available: true }] }
  ];
  const saveSite = await req(`/api/restaurants/${site.id}`, {
    method: 'PUT', cookieJar: cookie,
    body: {
      phone: '+1 555 0100',
      menu: demoMenu,
      ordering: {
        enabled: true,
        fulfillment: { delivery: true, pickup: true },
        deliveryFee: 2.5,
        minOrder: 0,
        currency: 'USD',
        promo: null,
        paymentMethods: { cash: { enabled: true }, cash_at_pickup: { enabled: true }, card: { enabled: false }, wallet: { enabled: false }, bank_transfer: { enabled: false, instructions: '' } }
      }
    }
  });
  check('PUT /api/restaurants/:id — حفظ منيو + إعدادات الطلب', saveSite.status === 200, `status=${saveSite.status}`);

  const publish = await req(`/api/restaurants/${site.id}/publish`, { method: 'PATCH', cookieJar: cookie });
  check('PATCH publish — 200 (اشتراك فعّال)', publish.status === 200, `status=${publish.status} ${publish.body?.error || ''}`);

  /* 10. المنيو العام */
  const menu = await req(`/api/public/menu/${site.slug}`);
  const pubMethods = (menu.body?.data?.ordering?.paymentMethods || []).map((m) => m.key);
  check('GET /api/public/menu/:slug — منشور + وسائل دفع جاهزة',
    menu.status === 200 && menu.body?.data?.restaurant?.status === 'published' && pubMethods.includes('cash'),
    `methods=${JSON.stringify(pubMethods)} items=${menu.body?.data?.menu?.[0]?.items?.length}`);

  check('وسيلة دفع غير مهيأة (card) غير معروضة', !pubMethods.includes('card'));

  const menuMissing = await req('/api/public/menu/does-not-exist-xyz');
  check('GET /api/public/menu/غير موجود — 404', menuMissing.status === 404);

  /* 11. إنشاء طلب كضيف (أسعار من الخادم) */
  const mySiteId = site.id;
  const catItems = menu.body?.data?.menu?.[0]?.items || [];
  const orderRes = await req('/api/orders', {
    method: 'POST',
    body: {
      restaurantId: mySiteId,
      customer: { name: 'Guest Customer', phone: '+15551234567' },
      fulfillment: 'pickup',
      paymentMethod: 'cash',
      lines: [{ itemId: 'item-classic', qty: 2, options: [{ groupId: 'size', optionId: 'large' }] }],
      idempotencyKey: `smoke-${Date.now()}-A`
    }
  });
  // متوقع: (12.5 + 2.5) × 2 = 30
  check('POST /api/orders (ضيف، نقدي، مع خيار Large) — 201 + unpaid + سعر الإضافات',
    orderRes.status === 201 && orderRes.body?.data?.paymentStatus === 'unpaid' && Number(orderRes.body?.data?.total) === 30,
    `status=${orderRes.status} total=${orderRes.body?.data?.total} paymentStatus=${orderRes.body?.data?.paymentStatus}`);

  /* 12. صنف غير متاح لا يمكن طلبه */
  const soldOut = await req('/api/orders', {
    method: 'POST',
    body: { restaurantId: mySiteId, customer: { name: 'Sold Out Guest', phone: '+15551110000' }, fulfillment: 'pickup', paymentMethod: 'cash', lines: [{ itemId: 'item-soldout', qty: 1 }] }
  });
  check('صنف غير متاح — 400 ITEM_UNAVAILABLE', soldOut.status === 400 && soldOut.body?.code === 'ITEM_UNAVAILABLE',
    `status=${soldOut.status} code=${soldOut.body?.code}`);

  /* 13. تسعير خاطئ من المتصفح يُتجاهَل (السعر من القاعدة) */
  const orderWrongPrice = await req('/api/orders', {
    method: 'POST',
    body: {
      restaurantId: mySiteId,
      customer: { name: 'Sneaky Guest', phone: '+15559999999' },
      fulfillment: 'pickup',
      paymentMethod: 'cash',
      // مجموعة Size إلزامية: نختار Regular (0) مع تسعير متصفح مخادع 0.01
      lines: [{ itemId: 'item-classic', qty: 1, price: 0.01, options: [{ groupId: 'size', optionId: 'reg' }] }],
      idempotencyKey: `smoke-${Date.now()}-B`
    }
  });
  check('تجاهل سعر المتصفح — الإجمالي = سعر القاعدة (12.5)',
    orderWrongPrice.status === 201 && Number(orderWrongPrice.body?.data?.total) === 12.5,
    `clientPrice=0.01 serverTotal=${orderWrongPrice.body?.data?.total}`);

  /* 14. منع تكرار الطلب بنفس المفتاح */
  const dupKey = `smoke-${Date.now()}-DUP`;
  const dupBody = { restaurantId: mySiteId, customer: { name: 'Dup', phone: '+15550000001' }, fulfillment: 'pickup', paymentMethod: 'cash', lines: [{ itemId: 'item-cola', qty: 1 }], idempotencyKey: dupKey };
  const o1 = await req('/api/orders', { method: 'POST', body: dupBody });
  const o2 = await req('/api/orders', { method: 'POST', body: dupBody });
  check('نفس idempotencyKey مرتين — طلب واحد فقط',
    o1.body?.data?.id && o1.body?.data?.id === o2.body?.data?.id, `o1=${o1.body?.data?.id} o2=${o2.body?.data?.id}`);

  /* 15. وسيلة دفع غير مفعّلة تُرفض */
  const badPay = await req('/api/orders', {
    method: 'POST',
    body: { restaurantId: mySiteId, customer: { name: 'Bank Guest', phone: '+15551112222' }, fulfillment: 'pickup', paymentMethod: 'bank_transfer', lines: [{ itemId: 'item-cola', qty: 1 }] }
  });
  check('وسيلة دفع غير مفعّلة (bank_transfer) — 400 PAYMENT_METHOD_UNAVAILABLE',
    badPay.status === 400 && badPay.body?.code === 'PAYMENT_METHOD_UNAVAILABLE', `status=${badPay.status} code=${badPay.body?.code}`);

  /* 16. دفع بطاقة بدون تهيئة Stripe — لا نجاح وهمي */
  const cardPay = await req('/api/orders', {
    method: 'POST',
    body: { restaurantId: mySiteId, customer: { name: 'Card Guest', phone: '+15553334444' }, fulfillment: 'pickup', paymentMethod: 'card', lines: [{ itemId: 'item-cola', qty: 1 }] }
  });
  const cardIntent = await req(`/api/public/orders/${orderRes.body?.data?.id}/pay`, { method: 'POST' });
  const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);
  check('الدفع بالبطاقة: مرفوض بوضوح إن لم يُهيَّأ (503) أو نيّة حقيقية (201) — لا خيار وهمي',
    stripeConfigured ? [201, 400, 403].includes(cardIntent.status) : cardIntent.status === 503,
    `payStatus=${cardIntent.status} code=${cardIntent.body?.code || ''} orderCreate=${cardPay.status}`);

  /* 17. التوصيل يتطلب عنوانًا */
  const noAddress = await req('/api/orders', {
    method: 'POST',
    body: { restaurantId: mySiteId, customer: { name: 'Delivery Guest', phone: '+15556667777' }, fulfillment: 'delivery', paymentMethod: 'cash', lines: [{ itemId: 'item-cola', qty: 1 }] }
  });
  check('توصيل بدون عنوان — 400 DELIVERY_ADDRESS_REQUIRED', noAddress.status === 400 && noAddress.body?.code === 'DELIVERY_ADDRESS_REQUIRED',
    `code=${noAddress.body?.code}`);
  const withAddress = await req('/api/orders', {
    method: 'POST',
    body: { restaurantId: mySiteId, customer: { name: 'Delivery Guest', phone: '+15556667777' }, fulfillment: 'delivery', deliveryAddress: '12 Test Street', paymentMethod: 'cash', lines: [{ itemId: 'item-cola', qty: 2 }], idempotencyKey: `smoke-${Date.now()}-C` }
  });
  check('توصيل بعنوان — 201 مع رسوم توصيل 2.5',
    withAddress.status === 201 && Number(withAddress.body?.data?.deliveryFee) === 2.5 && Number(withAddress.body?.data?.total) === 8.5,
    `total=${withAddress.body?.data?.total} fee=${withAddress.body?.data?.deliveryFee}`);

  /* 18. متابعة الطلب بالرمز */
  const orderId = orderRes.body?.data?.id;
  const track = await req(`/api/public/orders/${orderId}/track?token=${orderRes.body?.data?.orderToken}`);
  check('متابعة الطلب برمز صحيح — 200', track.status === 200 && track.body?.data?.id === orderId);
  const trackBad = await req(`/api/public/orders/${orderId}/track?token=wrongtoken`);
  check('متابعة برمز خاطئ — 404', trackBad.status === 404);

  /* 19. الملكية: مستخدم آخر لا يرى طلبات المطعم */
  const email2 = `smoke-other-${Date.now()}@menucraft.test`;
  // كوكي نظيف تمامًا (بدون جلسة المستخدم الأول) حتى يُختبر فلتر الملكية فعليًا
  const signup2 = await req('/api/auth/signup', { method: 'POST', cookieJar: '', body: { name: 'Other User', email: email2, password: 'secret123', restaurantName: `Other Site ${Date.now()}` } });
  const listOther = await req(`/api/orders?restaurantId=${mySiteId}`, { cookieJar: signup2.cookie });
  check('مستخدم آخر يطلب طلبات موقعي — 403 NOT_SITE_OWNER',
    listOther.status === 403 && listOther.body?.code === 'NOT_SITE_OWNER', `status=${listOther.status}`);

  /* 20. تحديث حالة الطلب — سير العمل */
  const st1 = await req(`/api/orders/${orderId}/status`, { method: 'PATCH', cookieJar: cookie, body: { status: 'confirmed' } });
  check('pending → confirmed', st1.status === 200, `status=${st1.status} ${st1.body?.error || ''}`);
  const stBad = await req(`/api/orders/${orderId}/status`, { method: 'PATCH', cookieJar: cookie, body: { status: 'completed' } });
  check('confirmed → completed مرفوض (انتقال غير صالح)', stBad.status === 409, `status=${stBad.status}`);

  /* 21. فلاتر الطلبات */
  const listOwn = await req(`/api/orders?restaurantId=${mySiteId}&paymentMethod=cash`, { cookieJar: cookie });
  const listFiltered = await req(`/api/orders?restaurantId=${mySiteId}&paymentMethod=card`, { cookieJar: cookie });
  check('فلترة حسب طريقة الدفع تعمل', listOwn.status === 200 && (listOwn.body?.data?.length > 0) && (listFiltered.body?.data?.length === 0),
    `cash=${listOwn.body?.data?.length} card=${listFiltered.body?.data?.length}`);

  /* 22. Webhook بدون توقيع مرفوض */
  const webhookNoSig = await req('/api/payments/webhook', { method: 'POST', body: { type: 'payment_intent.succeeded', data: { object: {} } } });
  check('Webhook بدون توقيع/تهيئة — 400/503 (لا تفعيل وهمي)', [400, 503].includes(webhookNoSig.status), `status=${webhookNoSig.status} code=${webhookNoSig.body?.code || ''}`);

  /* 23. فاتورة الاشتراك */
  const billing = await req('/api/billing/status', { cookieJar: cookie });
  check('GET /api/billing/status — يعرض حالة Stripe دون ادعاء وهمي',
    billing.status === 200 && typeof billing.body?.data?.provider?.configured === 'boolean',
    `configured=${billing.body?.data?.provider?.configured} mode=${billing.body?.data?.provider?.mode}`);

  /* 24. حفظ الموقع لا يتجاوز حد الباقة (إنشاء فقط محدود) */
  const updateOk = await req(`/api/restaurants/${mySiteId}`, { method: 'PUT', cookieJar: cookie, body: { tagline_en: 'Smoke updated tagline' } });
  check('تعديل موقع قائم مسموح بعد تجاوز/خفض الحد', updateOk.status === 200, `status=${updateOk.status}`);

  /* ------------------------------ الملخص ------------------------------ */
  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass);
  console.log(`\n${'='.repeat(60)}\nالنتيجة: ${passed}/${results.length} نجحت`);
  if (failed.length) {
    console.log('الفاشلة:');
    failed.forEach((f) => console.log(`  ❌ ${f.name} — ${f.detail || ''}`));
    process.exitCode = 1;
  }
  console.log(`إعادة الاختبار بعد إصلاح: node smoke-test.js\nالحساب: ${email} / secret123`);
  // إغلاق نظيف (الاتصال المفتوح بالـ pool يمنع انتهاء العملية تلقائيًا)
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
