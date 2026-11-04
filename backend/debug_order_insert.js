const mysql = require('mysql2/promise');
const { getMySQLPool } = require('./src/config/mysql');
const { createPublicOrder } = require('./src/services/order.service');

async function run() {
  // Check current state of Orders table
  const c = await mysql.createConnection({host:'127.0.0.1',port:3306,user:'root',password:'',database:'menucraft_mysql'});
  try {
    await c.execute("SELECT id FROM Orders WHERE id = ''");
    console.log('Found rows with empty id');
  } catch (e) {
    console.log('No rows with empty id - err:', e.code);
  }
  try {
    const [all] = await c.execute("SELECT COUNT(*) AS c FROM Orders");
    console.log('Total Orders:', all[0].c);
  } catch (e) { console.log('Count err:', e.message); }
  await c.end();

  // Try the actual function call
  try {
    const r = await createPublicOrder({
      restaurantId: 'test-restaurant',
      channel: 'online',
      fulfillment: 'pickup',
      paymentMethod: 'cash',
      customerName: 'Debug User',
      customerPhone: '9998887777',
      lines: [{ itemId: 'test-item-carbonara', qty: 1, options: [] }],
      idempotencyKey: 'debug-unique-key-abc'
    });
    console.log('SUCCESS:', r.id, '#', r.number);
  } catch (e) {
    console.log('FAILED:', e.message, '| code:', e.code || 'ERR_'+ (e.errno));
    // Try direct insert via pool for debugging
    const pool = await getMySQLPool();
    const conn = await pool.getConnection();
    try {
      const [insertRow] = await conn.execute(
        `INSERT INTO Orders (id, restaurant_id, order_number, channel, customer_name, customer_phone, customer_email, fulfillment, delivery_address, note, subtotal, delivery_fee, discount, total, currency, payment_method, payment_status, status, order_token, idempotency_key)
         VALUES (?, ?, 1, 'online', 'dbg', 'dbg', NULL, 'pickup', NULL, '', 10, 0, 0, 10, 'USD', 'cash', 'unpaid', 'pending', 'tok', ?)`,
        ['dbg-id-1', 'test-restaurant', 'dbg-key-abc']
      );
      console.log('Direct INSERT succeeded via pool');
      await conn.commit();
    } catch (e2) {
      console.log('Direct INSERT via pool FAILED:', e2.message, '| code:', e2.code || 'ERR_'+ (e2.errno));
    } finally {
      conn.release();
    }
  }
}
run().catch(e => console.log('FATAL', e.message));
