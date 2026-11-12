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
    const j0 = rows[0] ? rows[0].theme_json : null;
    if (j0 == null || j0 === '') return {};
    if (typeof j0 === 'string') { const t = j0.trim(); return t ? JSON.parse(t) : {}; }
    if (Buffer.isBuffer(j0)) { const t = j0.toString('utf8').trim(); return t ? JSON.parse(t) : {}; }
    return j0;
  } finally { connection.release(); }
}

module.exports = { saveTheme, getTheme };
