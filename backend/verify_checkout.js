const sql = require('mssql');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const DB = { user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } };

(async () => {
  const p = await sql.connect(DB);
  // find owner client + branches + menu items
  const o = (await p.request().input('rid', sql.NVarChar, 'rest-1793437631499-27bf0').query("SELECT id AS u, email FROM Users WHERE role='client'")).recordset[0];
  if (!o) { console.log('NO OWNER'); return; }
  console.log('owner', o.u, o.email);
  // find branches
  const b = await p.request().input('rid', sql.NVarChar, o.u).query("SELECT TOP 2 id AS br FROM Branches WHERE restaurant_id=@rid");
  console.log('branches', b.recordset.map(x => x.br));
  // find menu items via published menu / menus
  const m = await p.request().input('rid', sql.NVarChar, o.u).input('br', sql.NVarChar, b.recordset[0].br).query(`
    SELECT m.id AS mi FROM Menus m LEFT JOIN MenuItems mi ON mi.menu_id=m.id
    WHERE m.restaurant_id=@rid AND mi.is_active=1 LIMIT 5`).catch(e => { console.log('menu err', e.message); return null });
  if (!m) { console.log('NO MENU DATA — skipping, need menus table'); return; }
  console.log('menu items', m.recordset.length);

  // get token
  const token = jwt.sign({ userId: o.u, role: 'client', restaurant_id: o.u }, 'access_secret_change_me', { expiresIn: '15m' });
  const base = 'http://127.0.0.1:3003';

  // step 1: add a menu item to cart via store -> call cart add API if exists else raw
  // First try POST /api/cart if exists
  let createdCart = null;
  try {
    const res = await fetch(`${base}/api/cart`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ restaurant_id: o.u, item_ids: [m.recordset[0].mi], branch_id: b.recordset[0].br }) });
    createdCart = { status: res.status, body: await res.text() };
    console.log('CART ADD', createdCart.status, JSON.stringify(createdCart.body).slice(0, 300));
  } catch (e) { console.log('CART add failed:', e.message); }

  // Submit order directly to /api/orders
  const orderPayload = {
    restaurant_id: o.u,
    branch_id: b.recordset[0].br,
    items: [{ item_id: m.recordset[0].mi, qty: 2 }],
    customer_name: 'Verifier Tester',
    phone: '+966501234567',
    delivery_address: '123 Test St, Test City',
    note: 'backend calc',
    channel: 'delivery'
  };
  const res = await fetch(`${base}/api/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(orderPayload) });
  const data = await res.json();
  console.log('ORDER', res.status, JSON.stringify(data).slice(0, 400));

  // verify order in DB
  const ord = (await p.request().query("SELECT id, status, total_amount, restaurant_id FROM Orders ORDER BY created_at DESC LIMIT 1")).recordset[0];
  console.log('ORDERS ROW', ord ? JSON.stringify(ord) : 'none found in DB');

  await p.close();
})();
