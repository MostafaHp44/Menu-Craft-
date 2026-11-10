/** Dashboard theme service — MariaDB / mysql2 */
const { getMySQLPool } = require('../config/mysql');

async function saveTheme(restaurantId, theme) {
  const pool = await getMySQLPool();
  const connection = await pool.getConnection();
  try {
    await connection.execute(`INSERT INTO DashboardThemes (restaurant_id, theme_json, created_at, updated_at) VALUES (?, ?, NOW(), NOW()) ON DUPLICATE KEY UPDATE theme_json = ?, updated_at = NOW()`,
      [restaurantId, JSON.stringify(theme || {}), JSON.stringify(theme || {})]);
  } finally { connection.release(); }
}

async function getTheme(restaurantId) {
  const pool = await getMySQLPool();
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute('SELECT theme_json FROM DashboardThemes WHERE restaurant_id = ?', [restaurantId]);
    return rows[0] ? JSON.parse(rows[0].theme_json || '{}') : {};
  } finally { connection.release(); }
}

module.exports = { saveTheme, getTheme };
