/**
 * التمبليتات التي اختارها صاحب المطعم لكل موقع — تبويب "قوالبي" في الواجهة.
 *
 * الجدول يُنشأ تلقائياً عند أول استخدام (CREATE TABLE IF NOT EXISTS) فلا يحتاج
 * migration منفصل. لا يوجد FK على Restaurants لأن بعض المطاعم تُنشأ محلياً
 * في المتصفح قبل ربطها بالحساب.
 */
const { getMySQLPool } = require('../config/mysql');

let tableReady = false;

async function ensureTable() {
  if (tableReady) return;
  const pool = await getMySQLPool();
  const connection = await pool.getConnection();
  try {
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS RestaurantTemplates (
        restaurant_id VARCHAR(100) NOT NULL,
        template_id VARCHAR(100) NOT NULL,
        selected_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (restaurant_id, template_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    tableReady = true;
  } finally {
    connection.release();
  }
}

/** كل التمبليتات المختارة لمطعم — الأحدث أولاً */
async function listSelectedTemplates(restaurantId) {
  await ensureTable();
  const pool = await getMySQLPool();
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT template_id, selected_at FROM RestaurantTemplates WHERE restaurant_id = ? ORDER BY selected_at DESC',
      [restaurantId]
    );
    return rows.map((row) => ({ templateId: row.template_id, selectedAt: row.selected_at }));
  } finally {
    connection.release();
  }
}

/** تسجيل اختيار تمبليت (idempotent — الاختيار مرة أخرى يحدّث الوقت فقط) */
async function selectTemplate(restaurantId, templateId) {
  await ensureTable();
  const pool = await getMySQLPool();
  const connection = await pool.getConnection();
  try {
    await connection.execute(
      `INSERT INTO RestaurantTemplates (restaurant_id, template_id, selected_at)
       VALUES (?, ?, NOW())
       ON DUPLICATE KEY UPDATE selected_at = NOW()`,
      [restaurantId, templateId]
    );
    return true;
  } finally {
    connection.release();
  }
}

/** إزالة تمبليت من "قوالبي" */
async function unselectTemplate(restaurantId, templateId) {
  await ensureTable();
  const pool = await getMySQLPool();
  const connection = await pool.getConnection();
  try {
    await connection.execute(
      'DELETE FROM RestaurantTemplates WHERE restaurant_id = ? AND template_id = ?',
      [restaurantId, templateId]
    );
    return true;
  } finally {
    connection.release();
  }
}

module.exports = { listSelectedTemplates, selectTemplate, unselectTemplate };
