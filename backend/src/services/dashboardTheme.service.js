/** Dashboard theme service — saves interface colors independently from restaurant templates */
const { getPool, sql } = require('../config/db');

async function saveTheme(restaurantId, theme) {
  const pool = await getPool();
  await pool.request()
    .input('rid', sql.NVarChar, restaurantId)
    .input('theme', sql.NVarChar, JSON.stringify(theme || {}))
    .query(`MERGE DashboardThemes AS target USING (SELECT @rid AS restaurant_id) AS source ON target.restaurant_id = source.restaurant_id WHEN MATCHED THEN UPDATE SET theme_json = @theme, updated_at = GETDATE() WHEN NOT MATCHED THEN INSERT (restaurant_id, theme_json, created_at, updated_at) VALUES (@rid, @theme, GETDATE(), GETDATE());`);
}

async function getTheme(restaurantId) {
  const pool = await getPool();
  const r = await pool.request().input('rid', sql.NVarChar, restaurantId).query('SELECT theme_json FROM DashboardThemes WHERE restaurant_id = @rid');
  return r.recordset[0] ? JSON.parse(r.recordset[0].theme_json || '{}') : {};
}

module.exports = { saveTheme, getTheme };
