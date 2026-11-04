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
  const email = `e2e${Date.now()}@menucraft.test`;
  let pass = 0;
  let fail = 0;
  const check = (name, ok, detail) => {
    if (ok) { pass++; console.log(`PASS ${name}`, detail ?? ''); }
    else { fail++; console.log(`FAIL ${name}`, detail ?? ''); }
  };

  console.log('=== 1. SIGNUP ===', email);
  const s = await req('POST', '/api/auth/signup', {
    body: { email, password: 'TestPass123!', name: 'E2E User', restaurantName: 'E2E Restaurant', templateId: 'bella' },
  });
  const accessToken = getAccessToken(s.cookies);
  let rid = null;
  try { rid = JSON.parse(s.body).user?.restaurant_id; } catch {}
  check('signup 200', s.status === 200, `status=${s.status}`);
  check('access token from Set-Cookie', !!accessToken);
  check('restaurant id returned', !!rid, `rid=${rid}`);
  if (!accessToken || !rid) { console.log('ABORT'); process.exit(1); }

  console.log('=== 2. ME ===');
  const me = await req('GET', '/api/auth/me', { token: accessToken });
  check('me 200', me.status === 200, `status=${me.status}`);

  console.log('=== 3. LIST branches (empty) ===');
  const br0 = await req('GET', `/api/branches?restaurantId=${rid}`, { token: accessToken });
  check('list 200', br0.status === 200, `status=${br0.status} body=${br0.body.slice(0, 120)}`);

  console.log('=== 4. CREATE branch ===');
  const cr = await req('POST', '/api/branches', {
    token: accessToken,
    body: { restaurantId: rid, name: 'Branch A', address: 'Test St 1', phone: '+9647000000001', openingHours: '09:00-23:00' },
  });
  check('create 200', cr.status === 200, `status=${cr.status} body=${cr.body.slice(0, 160)}`);

  console.log('=== 5. LIST after create ===');
  const br1 = await req('GET', `/api/branches?restaurantId=${rid}`, { token: accessToken });
  let created = null;
  try { created = JSON.parse(br1.body).data?.[0] || null; } catch {}
  check('list after create 200', br1.status === 200, `status=${br1.status}`);
  check('created branch persisted', !!created && created.name_en === 'Branch A', JSON.stringify(created));
  check('opening_hours persisted', created?.opening_hours === '09:00-23:00', `opening_hours=${created?.opening_hours}`);

  console.log('=== 6. UPDATE branch ===');
  const ur = await req('PUT', `/api/branches/${created?.id}`, {
    token: accessToken,
    body: { restaurantId: rid, name: 'Branch A Updated', address: 'Updated St 2', phone: '+9647000000002' },
  });
  check('update 200', ur.status === 200, `status=${ur.status} body=${ur.body.slice(0, 160)}`);

  console.log('=== 7. LIST after update (proves DB write) ===');
  const br2 = await req('GET', `/api/branches?restaurantId=${rid}`, { token: accessToken });
  let updated = null;
  try { updated = JSON.parse(br2.body).data?.[0] || null; } catch {}
  check('updated name persisted', updated?.name_en === 'Branch A Updated', `name_en=${updated?.name_en}`);
  check('updated address persisted', updated?.address === 'Updated St 2', `address=${updated?.address}`);

  console.log('=== 8. TENANT ISOLATION (other restaurant id) ===');
  const other = await req('GET', '/api/branches?restaurantId=rst-tecnoworld-mw03uupl', { token: accessToken });
  check('cross-tenant list blocked 403', other.status === 403, `status=${other.status} body=${other.body.slice(0, 120)}`);

  console.log('=== 9. SITES ===');
  const sites = await req('GET', '/api/sites', { token: accessToken });
  check('sites 200', sites.status === 200, `status=${sites.status}`);

  console.log('=== 10. SITES SUMMARY ===');
  const sum = await req('GET', '/api/sites/summary', { token: accessToken });
  check('sites summary 200', sum.status === 200, `status=${sum.status}`);

  console.log('=== 11. SUBSCRIPTION (own restaurant) ===');
  const sub = await req('GET', `/api/platform/subscriptions/${rid}`, { token: accessToken });
  check('subscription 200', sub.status === 200, `status=${sub.status} body=${sub.body.slice(0, 160)}`);

  console.log('=== 12. UNAUTHENTICATED branches ===');
  const noAuth = await req('GET', `/api/branches?restaurantId=${rid}`);
  check('no token -> 401', noAuth.status === 401, `status=${noAuth.status}`);

  console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
  console.log(`TEST_RID=${rid}`);
  console.log(`TEST_BRANCH_ID=${created?.id}`);
  process.exit(fail ? 1 : 0);
})();
