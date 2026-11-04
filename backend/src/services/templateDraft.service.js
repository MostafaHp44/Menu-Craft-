const { getPool, sql } = require('../config/db');

async function saveDraft(token, data) {
  const pool = await getPool();
  await pool.request()
    .input('t', sql.NVarChar, token)
    .input('j', sql.NVarChar, JSON.stringify(data || {}))
    .input('n', sql.NVarChar, data?.restaurantName || null)
    .query(`MERGE TemplateDrafts AS target USING (SELECT @t AS draft_token) AS source ON target.draft_token = source.draft_token WHEN MATCHED THEN UPDATE SET design_json = @j, restaurant_name = @n, updated_at = GETDATE() WHEN NOT MATCHED THEN INSERT (id, draft_token, design_json, restaurant_name, created_at, updated_at) VALUES (NEWID(), @t, @j, @n, GETDATE(), GETDATE());`);
}

async function getDraft(token) {
  const pool = await getPool();
  const r = await pool.request().input('t', sql.NVarChar, token).query('SELECT design_json, restaurant_name FROM TemplateDrafts WHERE draft_token = @t');
  return r.recordset[0] || null;
}

module.exports = { saveDraft, getDraft };
