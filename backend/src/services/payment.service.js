const { getMySQLPool } = require('../config/mysql');
const crypto = require('crypto');

async function recordPayment({ restaurantId, subscriptionId, orderId, userId, amount, currency, status, method, stripePaymentId }) {
  const pool = await getMySQLPool(); const c = await pool.getConnection();
  try {
    const id = `pay-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;
    await c.execute('INSERT INTO Payments (id, restaurant_id, subscription_id, order_id, user_id, amount, currency, status, payment_method, stripe_payment_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, restaurantId || null, subscriptionId || null, orderId || null, userId || null, amount, currency || 'USD', status, method, stripePaymentId || null]);
    return id;
  } finally { c.release(); }
}

async function setPaymentStatus(stripePaymentId, status) {
  const pool = await getMySQLPool(); const c = await pool.getConnection();
  try { const [r] = await c.execute('UPDATE Payments SET status = ?, updated_at = NOW() WHERE stripe_payment_id = ?', [status, stripePaymentId]); return r.affectedRows > 0; } finally { c.release(); }
}

module.exports = { recordPayment, setPaymentStatus };
