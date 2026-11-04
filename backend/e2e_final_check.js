const sql = require('mssql');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const DB = { user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } };
const JWT_SECRET = 'access_secret_change_me';

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, opts);
  const text = await res.text();
  try { return { status: res.status, body: JSON.parse(text) }; }
  catch { return { status: res.status, body: text }; }
}

(async () => {
  const p = await sql.connect(DB);
  const restId = 'rest-1793437631499-27bf0';
  const owner = (await p.request().input('rid', sql.NVarChar, restId).query("SELECT TOP 1 id, email FROM Users WHERE restaurant_id=@rid AND role='client'")).recordset[0];
  const token = jwt.sign({ userId: owner.id, role: 'client', restaurant_id: restId }, JWT_SECRET, { expiresIn: '15m' });
  const base = 'http://127.0.0.1:3003';

  // Use a fresh branch (re-use temp if exists; else create)
  const existingBranch = (await p.request().input('rid', sql.NVarChar, restId).query("SELECT TOP 1 id FROM Branches WHERE restaurant_id=@rid")).recordset[0];
  const branchId = existingBranch ? existingBranch.id : crypto.randomUUID();
  if (!existingBranch) {
    await p.request().input('id', sql.NVarChar, branchId).input('rid', sql.NVarChar, restId).input('n', sql.NVarChar, 'E2E').query("INSERT INTO Branches (id, restaurant_id, name_en, is_active, created_at) VALUES (@id,@rid,@n,1,GETDATE())");
  }

  const email = `e2e-final-${Date.now()}@test.invalid`;

  // A. Create
  const createRes = await fetchJson(`${base}/api/employees`, {
    method: 'POST', credentials: 'include',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ restaurantId: restId, name: 'E2E Final', email, password: 'Pass123', role: 'waiter', branchAccessType: 'assigned', branchIds: [branchId] })
  });
  console.log('A CREATE', createRes.status);

  let emp = null, userId = null, reId = null;
  if (createRes.status === 201 && createRes.body?.data) {
    emp = createRes.body.data;
    const userRow = await p.request().input('e', sql.NVarChar, email).query("SELECT id FROM Users WHERE email=@e");
    userId = userRow.recordset[0]?.id;
    const reRow = await p.request().input('uid', sql.NVarChar, userId).query("SELECT id FROM RestaurantEmployees WHERE user_id=@uid");
    reId = reRow.recordset[0]?.id;
    const prof = await p.request().input('id', sql.NVarChar, emp.id).query("SELECT * FROM Employees WHERE id=@id");
    const eba = await p.request().input('re', sql.NVarChar, reId).query("SELECT * FROM EmployeeBranchAccess WHERE restaurant_employee_id=@re");
    console.log('C DB CHECK user=', !!userId, 'RE=', !!reId, 'prof=', !!prof.recordset[0], 'EBA=', eba.recordset.length, 'branch=', eba.recordset[0]?.branch_id === branchId ? 'PASS' : 'FAIL');

    // D. Login
    const loginRes = await fetchJson(`${base}/api/auth/login`, {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'Pass123' })
    });
    console.log('D LOGIN', loginRes.status, loginRes.body?.ok ? 'PASS' : 'FAIL');
  } else {
    console.log('A FAILED:', createRes.body?.error?.slice(0, 200));
  }

  // B. List
  const listRes = await fetchJson(`${base}/api/employees`, { credentials: 'include', headers: { Authorization: 'Bearer ' + token } });
  const found = Array.isArray(listRes.body?.data) && !!listRes.body.data.find(x => x.name === 'E2E Final');
  console.log('B LIST', listRes.status, 'found=', found ? 'PASS' : 'FAIL');

  // F. Branch authorization (DB direct)
  if (reId) {
    const allowed = await p.request().input('re', sql.NVarChar, reId).input('bid', sql.NVarChar, branchId).query('SELECT 1 FROM EmployeeBranchAccess WHERE restaurant_employee_id=@re AND branch_id=@bid AND allowed=1');
    console.log('F BRANCH ALLOWED', allowed.recordset.length === 1 ? 'PASS' : 'FAIL');
  }

  // G. Duplicate username
  const dupRes = await fetchJson(`${base}/api/employees`, {
    method: 'POST', credentials: 'include', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ restaurantId: restId, name: 'Dup', email, password: 'Pass123', role: 'waiter', branchAccessType: 'none', branchIds: [] })
  });
  console.log('G DUPLICATE', dupRes.status >= 400 ? 'PASS (rejected)' : 'FAIL');

  // H. Deactivate
  if (emp?.id) {
    const del = await fetchJson(`${base}/api/employees/${emp.id}`, { method: 'DELETE', credentials: 'include', headers: { Authorization: 'Bearer ' + token } });
    console.log('H DEACTIVATE', del.status);
    const after = await p.request().input('id', sql.NVarChar, emp.id).query("SELECT is_active FROM Employees WHERE id=@id");
    console.log('H AFTER', after.recordset[0]?.is_active === 0 ? 'PASS' : 'FAIL');
  }

  // Cleanup
  if (userId) await p.request().input('uid', sql.NVarChar, userId).query('DELETE FROM Users WHERE id=@uid');
  if (reId) { await p.request().input('re', sql.NVarChar, reId).query('DELETE FROM EmployeeBranchAccess WHERE restaurant_employee_id=@re'); await p.request().input('re', sql.NVarChar, reId).query('DELETE FROM RestaurantEmployees WHERE id=@re'); }
  if (emp?.id) await p.request().input('id', sql.NVarChar, emp.id).query('DELETE FROM Employees WHERE id=@id');
  if (!existingBranch) await p.request().input('bid', sql.NVarChar, branchId).query('DELETE FROM Branches WHERE id=@bid');
  console.log('CLEANUP OK');
  await p.close();
})();
