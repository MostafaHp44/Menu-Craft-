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
  if (!owner) { console.error('NO OWNER'); await p.close(); return; }

  // Insert temporary test branch
  const branchId = crypto.randomUUID();
  await p.request().input('id', sql.NVarChar, branchId).input('rid', sql.NVarChar, restId).input('name', sql.NVarChar, 'E2E Branch').query("INSERT INTO Branches (id, restaurant_id, name_en, is_active, created_at) VALUES (@id,@rid,@name,1,GETDATE())");
  console.log('TEMP BRANCH', branchId, 'for restaurant', restId);

  const token = jwt.sign({ userId: owner.id, role: 'client', restaurant_id: restId }, JWT_SECRET, { expiresIn: '15m' });
  const base = 'http://127.0.0.1:3003';

  // A. Create employee (assigned, 1 branch)
  const email = `e2e-emp-${Date.now()}@test.invalid`;
  const createRes = await fetchJson(`${base}/api/employees`, {
    method: 'POST', credentials: 'include',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ restaurantId: restId, name: 'E2E Tester', email, password: 'Pass123', role: 'waiter', branchAccessType: 'assigned', branchIds: [branchId] })
  });
  console.log('A CREATE', createRes.status, JSON.stringify(createRes.body).slice(0, 300));

  let empProfile = null, userId = null, reId = null;
  if (createRes.status === 201 && createRes.body?.data) {
    empProfile = createRes.body.data;
    // Verify DB relationships
    const userRow = await p.request().input('e', sql.NVarChar, email).query("SELECT id FROM Users WHERE email=@e");
    userId = userRow.recordset[0]?.id;
    const reRow = await p.request().input('uid', sql.NVarChar, userId).query("SELECT id FROM RestaurantEmployees WHERE user_id=@uid");
    reId = reRow.recordset[0]?.id;
    const profRow = await p.request().input('id', sql.NVarChar, empProfile.id).query("SELECT * FROM Employees WHERE id=@id");
    const ebaRow = await p.request().input('re', sql.NVarChar, reId).query("SELECT * FROM EmployeeBranchAccess WHERE restaurant_employee_id=@re");
    console.log('C DB VERIFY user=', !!userId, 'RE=', !!reId, 'prof=', !!profRow.recordset[0], 'EBA=', ebaRow.recordset.length, 'branch=', ebaRow.recordset[0]?.branch_id === branchId);

    // D. Login as new employee
    const loginRes = await fetchJson(`${base}/api/auth/login`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'Pass123' })
    });
    console.log('D LOGIN', loginRes.status, loginRes.body?.ok ? 'OK' : JSON.stringify(loginRes.body).slice(0, 100));
  } else {
    console.log('CREATE FAILED — aborting positive E2E');
  }

  // B/C. List employees (should show created)
  const listRes = await fetchJson(`${base}/api/employees`, { credentials: 'include', headers: { Authorization: 'Bearer ' + token } });
  console.log('B LIST', listRes.status, 'count=', Array.isArray(listRes.body?.data) ? listRes.body.data.length : 'N/A', 'found=', !!listRes.body?.data?.find?.(x => x.name === 'E2E Tester'));

  // F. Authorization tests (branch)
  if (reId) {
    // Check BranchAccessResolver behavior by querying DB directly (simulating middleware)
    const allowedBranch = await p.request().input('re', sql.NVarChar, reId).input('bid', sql.NVarChar, branchId).query('SELECT 1 FROM EmployeeBranchAccess WHERE restaurant_employee_id=@re AND branch_id=@bid AND allowed=1');
    console.log('F ASSIGNED ALLOWED', allowedBranch.recordset.length === 1 ? 'PASS' : 'FAIL');
  }

  // G. Duplicate username / rollback verification
  const dupRes = await fetchJson(`${base}/api/employees`, {
    method: 'POST', credentials: 'include',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ restaurantId: restId, name: 'Dup', email, password: 'Pass123', role: 'waiter', branchAccessType: 'none', branchIds: [] })
  });
  console.log('G DUPLICATE USERNAME', dupRes.status, dupRes.status >= 400 ? 'PASS (rejected)' : 'FAIL');

  // H. Deactivate (delete endpoint) and verify removed
  if (empProfile?.id) {
    const delRes = await fetchJson(`${base}/api/employees/${empProfile.id}`, { method: 'DELETE', credentials: 'include', headers: { Authorization: 'Bearer ' + token } });
    console.log('H DEACTIVATE', delRes.status);
    const after = await p.request().input('id', sql.NVarChar, empProfile.id).query("SELECT is_active FROM Employees WHERE id=@id");
    console.log('H AFTER DEACTIVATE', after.recordset[0]?.is_active);
  }

  // Cleanup DB test artifacts (users, restaurantemployees, employees, branches)
  if (userId) {
    await p.request().input('uid', sql.NVarChar, userId).query('DELETE FROM Users WHERE id=@uid');
  }
  if (reId) {
    await p.request().input('re', sql.NVarChar, reId).query('DELETE FROM EmployeeBranchAccess WHERE restaurant_employee_id=@re');
    await p.request().input('re', sql.NVarChar, reId).query('DELETE FROM RestaurantEmployees WHERE id=@re');
  }
  if (empProfile?.id) {
    await p.request().input('id', sql.NVarChar, empProfile.id).query('DELETE FROM Employees WHERE id=@id');
  }
  await p.request().input('bid', sql.NVarChar, branchId).query('DELETE FROM Branches WHERE id=@bid');
  console.log('CLEANUP DONE');

  await p.close();
})();
