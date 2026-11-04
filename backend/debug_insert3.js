const mysql = require('mysql2/promise');
const { getMySQLPool } = require('./src/config/mysql');

async function t() {
  const pool = await getMySQLPool();
  const c = await pool.getConnection();
  try {
    await c.beginTransaction();
    // Minimal insert mimicking service — no idempotency key (so null)
    await c.execute(
      `INSERT INTO Orders (id, restaurant_id, order_number, channel, customer_name, fulfillment) VALUES (?, ?, ?, ?, ?, ?)`,
      ['new-id-001', 'test-restaurant', 10, 'online', 'X', 'pickup']
    );
    await c.commit();
    console.log('Direct insert OK');
    await c.execute('DELETE FROM Orders WHERE id = ?', ['new-id-001']);
  } catch (e) {
    console.log('Direct insert FAIL:', e.message, '| code:', e.code || e.errno || 'N/A');
    try { await c.rollback(); } catch (_) {}
  } finally {
    c.release();
  }
}
t();
