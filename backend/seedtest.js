const { getPool, sql } = require('./src/config/db');
const bcrypt = require('bcryptjs');

(async () => {
  const p = await getPool();
  const r = await p.request().query(
    "SELECT email, LEN(password_hash) AS L, password_hash AS H FROM Users WHERE email='owner@bella.demo'"
  );
  console.log('STORED:', JSON.stringify(r.recordset));

  const h = await bcrypt.hash('secret123', 12);
  console.log('GEN len', h.length, 'cmp_self', await bcrypt.compare('secret123', h));

  await p.request()
    .input('h', sql.NVarChar(500), h)
    .input('e', sql.VarChar(100), 'owner@bella.demo')
    .query('UPDATE Users SET password_hash=@h WHERE email=@e');

  const r2 = await p.request()
    .input('e', sql.VarChar, 'owner@bella.demo')
    .query('SELECT LEN(password_hash) AS L2, password_hash AS H2 FROM Users WHERE email=@e');
  console.log('AFTER len', r2.recordset[0].L2, 'cmp_again', await bcrypt.compare('secret123', r2.recordset[0].H2));
  process.exit(0);
})();
