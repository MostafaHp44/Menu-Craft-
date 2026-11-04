const mysql = require('mysql2/promise');

async function t() {
  const c = await mysql.createConnection({host:'127.0.0.1',port:3306,user:'root',password:'',database:'menucraft_mysql'});
  const [orders] = await c.execute("SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE FROM information_schema.columns WHERE TABLE_SCHEMA='menucraft_mysql' AND TABLE_NAME='Orders' ORDER BY ORDINAL_POSITION");
  console.log('=== Orders ===');
  orders.forEach(r => console.log(' ', r.COLUMN_NAME, '|', r.DATA_TYPE, '| nullable:', r.IS_NULLABLE));
  const [lines] = await c.execute("SELECT COLUMN_NAME, DATA_TYPE FROM information_schema.columns WHERE TABLE_SCHEMA='menucraft_mysql' AND TABLE_NAME='OrderLines' ORDER BY ORDINAL_POSITION");
  console.log('=== OrderLines ===');
  lines.forEach(r => console.log(' ', r.COLUMN_NAME, '|', r.DATA_TYPE));
  await c.end();
}
t().catch(e => console.log('ERR', e.message));
