const http = require('http');

function req(method, path, { token, body } = {}) {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (data) headers['Content-Length'] = Buffer.byteLength(data);
    const opts = { hostname: '127.0.0.1', port: 3000, path, method, headers };
    const r = http.request(opts, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => resolve({ status: res.statusCode, body: d, cookies: res.headers['set-cookie'] }));
    });
    r.on('error', (e) => resolve({ error: e.message }));
    if (data) r.write(data);
    r.end();
  });
}

function getAccessToken(cookies) {
  if (!cookies) return null;
  for (const c of cookies) if (c.startsWith('access_token=')) return c.split(';')[0].split('=')[1];
  return null;
}

(async () => {
  let pass = 0;
  let fail = 0;
  const check = (name, ok, detail) => {
    if (ok) { pass++; console.log(`PASS ${name}`, detail ?? ''); }
    else { fail++; console.log(`FAIL ${name}`, detail ?? ''); }
  };

  const email = `theme${Date.now()}@menucraft.test`;
  const s = await req('POST', '/api/auth/signup', {
    body: { email, password: 'TestPass123!', name: 'Theme Tester', restaurantName: 'Theme Restaurant', templateId: 'bella' },
  });
  const token = getAccessToken(s.cookies);
  const rid = JSON.parse(s.body).user?.restaurant_id;
  check('signup + token', s.status === 200 && !!token, `status=${s.status} rid=${rid}`);
  if (!token || !rid) { process.exit(1); }

  console.log('=== THEME GET (fresh) ===');
  const g0 = await req('GET', `/api/dashboard-theme?restaurantId=${rid}`, { token });
  check('theme GET 200', g0.status === 200, `status=${g0.status} body=${g0.body}`);

  console.log('=== THEME SAVE ===');
  const theme = { text: '#0A2540', background: '#FFF8EE', border: '#E0D6C2' };
  const sv = await req('POST', '/api/dashboard-theme', { token, body: { restaurantId: rid, theme } });
  check('theme SAVE 200', sv.status === 200, `status=${sv.status} body=${sv.body}`);

  console.log('=== THEME GET after save (persistence) ===');
  const g1 = await req('GET', `/api/dashboard-theme?restaurantId=${rid}`, { token });
  let saved = null;
  try { saved = JSON.parse(g1.body).data; } catch {}
  check('theme persisted text', saved?.text === '#0A2540', `text=${saved?.text}`);
  check('theme persisted background', saved?.background === '#FFF8EE', `background=${saved?.background}`);
  check('theme persisted border', saved?.border === '#E0D6C2', `border=${saved?.border}`);

  console.log('=== THEME cross-tenant blocked ===');
  const other = await req('GET', '/api/dashboard-theme?restaurantId=rst-tecnoworld-mw03uupl', { token });
  check('cross-tenant theme GET 403', other.status === 403, `status=${other.status}`);

  console.log('=== THEME no token ===');
  const noAuth = await req('GET', `/api/dashboard-theme?restaurantId=${rid}`);
  check('no token -> 401', noAuth.status === 401, `status=${noAuth.status}`);

  console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
