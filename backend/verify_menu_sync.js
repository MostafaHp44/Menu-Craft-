/**
 * اختبار نهاية-لنهاية: تسجيل دخول (كوكيز) → قراءة المنيو → حفظ تعديل →
 * التأكد من وصول التعديل إلى جدول MenuItems (مصدر عرض الموقع العام).
 */
const BASE = 'http://127.0.0.1:3000';

function cookiesFrom(res) {
  const raw = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  const jar = [];
  for (const c of raw) {
    const pair = c.split(';')[0];
    jar.push(pair);
  }
  return jar.join('; ');
}

async function req(path, { method = 'GET', cookie, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    redirect: 'manual',
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const setCookie = cookiesFrom(res);
  const json = await res.json().catch(() => null);
  return { status: res.status, json, setCookie };
}

(async () => {
  const login = await req('/api/auth/signin', {
    method: 'POST',
    body: { email: 'owner@bella.test', password: 'Owner1234' },
  });
  console.log('LOGIN:', login.status, JSON.stringify(login.json).slice(0, 200));
  const cookie = login.setCookie;
  if (!cookie || !cookie.includes('access_token')) {
    console.log('STOP: no access_token cookie');
    return;
  }

  const id = 'rest-bella-mw1xq4wc-8pa9o';

  const before = await req(`/api/restaurants/${id}`, { cookie });
  const beforeMenu =
    typeof before.json?.data?.draft_menu === 'string'
      ? JSON.parse(before.json.data.draft_menu)
      : before.json?.data?.draft_menu;
  console.log(
    'BEFORE draft → categories:',
    JSON.stringify(beforeMenu?.map((c) => c.name)),
    '| items:',
    beforeMenu?.[0]?.items?.length
  );
  if (!Array.isArray(beforeMenu) || beforeMenu.length === 0) {
    console.log('STOP: draft menu empty');
    return;
  }

  // تعديل تجريبي: رفع سعر أول صنف 1.5 ثم إرجاعه
  const testMenu = JSON.parse(JSON.stringify(beforeMenu));
  const originalPrice = testMenu[0].items[0].price;
  testMenu[0].items[0].price = Number(originalPrice) + 1.5;

  const save = await req(`/api/restaurants/${id}`, {
    method: 'PUT',
    cookie,
    body: { draft_menu: testMenu },
  });
  console.log('SAVE:', save.status, JSON.stringify(save.json).slice(0, 200));

  const mysql = require('mysql2/promise');
  const c = await mysql.createConnection({ host: 'localhost', port: 3306, user: 'root', password: '', database: 'menucraft_mysql' });
  const [rows] = await c.query('SELECT id, name_en, price, name_ar, name_ku FROM menuitems WHERE restaurant_id = ? ORDER BY sort_order', [id]);
  console.log('MENUITEMS AFTER SAVE:', JSON.stringify(rows, null, 2));

  // إرجاع القيمة الأصلية
  testMenu[0].items[0].price = originalPrice;
  const restore = await req(`/api/restaurants/${id}`, { method: 'PUT', cookie, body: { draft_menu: testMenu } });
  console.log('RESTORE:', restore.status);
  const [after] = await c.query('SELECT id, price, name_ar, name_ku FROM menuitems WHERE restaurant_id = ? ORDER BY sort_order', [id]);
  console.log('MENUITEMS AFTER RESTORE:', JSON.stringify(after, null, 2));
  c.end();
})().catch((e) => console.log('FATAL:', e.message));
