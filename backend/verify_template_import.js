/**
 * اختبار منطق استيراد منيو التمبلت:
 *  - موقع له منيو أصلاً → يتغيّر التصميم فقط ولا يُستبدل المنيو.
 *  - يُعاد الحفظ بالقيم الأصلية (templateId + design) في النهاية.
 */
const BASE = 'http://127.0.0.1:3000';
const ID = 'rest-bella-mw1xq4wc-8pa9o';

function cookiesFrom(res) {
  const raw = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  return raw.map((c) => c.split(';')[0]).join('; ');
}

async function req(path, { method = 'GET', cookie, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    redirect: 'manual',
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, json: await res.json().catch(() => null), setCookie: cookiesFrom(res) };
}

const menuOf = (r) => {
  const raw = r?.json?.data?.draft_menu;
  const m = typeof raw === 'string' ? JSON.parse(raw) : raw;
  return Array.isArray(m) ? m : [];
};

(async () => {
  const login = await req('/api/auth/signin', {
    method: 'POST',
    body: { email: 'owner@bella.test', password: 'Owner1234' },
  });
  const cookie = login.setCookie;
  if (!cookie.includes('access_token')) return console.log('STOP: login failed', login.status);

  const before = await req(`/api/restaurants/${ID}`, { cookie });
  const beforeMenu = menuOf(before);
  const beforeTpl = before.json?.data?.templateId;
  const beforeDesign = before.json?.data?.design;
  console.log('BEFORE → templateId:', beforeTpl, '| categories:', beforeMenu.map((c) => c.name), '| items:', beforeMenu[0]?.items?.length);

  // محاولة استيراد منيو تمبلت آخر (بدون force)
  const imp = await req(`/api/restaurants/${ID}/import-template`, {
    method: 'POST',
    cookie,
    body: { templateId: 'burger-district' },
  });
  console.log('IMPORT:', imp.status, JSON.stringify(imp.json).slice(0, 160));

  const after = await req(`/api/restaurants/${ID}`, { cookie });
  const afterMenu = menuOf(after);
  console.log('AFTER → templateId:', after.json?.data?.templateId, '| categories:', afterMenu.map((c) => c.name), '| items:', afterMenu[0]?.items?.length);

  const menuKept = JSON.stringify(afterMenu) === JSON.stringify(beforeMenu);
  const tplChanged = after.json?.data?.templateId !== beforeTpl;
  console.log('RESULT → المنيو محفوظ كما كان:', menuKept, '| تم تغيير التصميم:', tplChanged);

  // إعادة الحالة الأصلية (templateId + design)
  const mysql = require('mysql2/promise');
  const c = await mysql.createConnection({ host: 'localhost', port: 3306, user: 'root', password: '', database: 'menucraft_mysql' });
  await c.execute('UPDATE restaurants SET templateId = ?, design = ? WHERE id = ?', [
    beforeTpl,
    typeof beforeDesign === 'string' ? beforeDesign : JSON.stringify(beforeDesign),
    ID,
  ]);
  const [check] = await c.query('SELECT templateId FROM restaurants WHERE id = ?', [ID]);
  console.log('RESTORED templateId:', check[0].templateId);
  c.end();
})().catch((e) => console.log('FATAL:', e.message));
