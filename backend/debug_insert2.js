const { createPublicOrder } = require('./src/services/order.service');
const mysql = require('mysql2/promise');

async function t() {
  const c = await mysql.createConnection({ host: '127.0.0.1', port: 3306, user: 'root', password: '', database: 'menucraft_mysql' });
  // Test raw MySQL 1-on-1 INSERT pattern
  try {
    await c.execute(
      `INSERT INTO Orders (id, restaurant_id, order_number, channel, customer_name, customer_phone, customer_email, fulfillment, delivery_address, note, subtotal, delivery_fee, discount, total, currency, payment_method, payment_status, status, order_token, idempotency_key)
       VALUES ('dbg-raw-1', 'test-restaurant', 5, 'online', 'C', '3', NULL, 'pickup', NULL, '', 50, 5, 0, 55, 'USD', 'cash', 'unpaid', 'pending', 'tok-raw', ?)`,
      [undefined] // should become NULL
    );
    console.log('RAW INSERT with undefined -> OK');
    await c.execute("DELETE FROM Orders WHERE id = 'dbg-raw-1'");
  } catch (e) {
    console.log('RAW INSERT FAILED:', e.message, '| code:', e.code || e.errno);
  }
  await c.end();

  // Now try via the service without idempotency key
  try {
    const r = await createPublicOrder({
      restaurantId: 'test-restaurant',
      channel: 'online',
      fulfillment: 'pickup',
      paymentMethod: 'cash',
      customerName: 'D',
      customerPhone: '4',
      lines: [{ itemId: 'test-item-carbonara', qty: 1, options: [] }]
    });
    console.log('SERVICE CALL OK:', r.id);
  } catch (e) {
    console.log('SERVICE CALL FAILED:', e.message, '| code:', e.code || e.errno);
  }
}
t().catch(e => console.log('FATAL', e.message));
