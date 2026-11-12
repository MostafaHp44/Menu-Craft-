/** MenuCraft — Home Content Service (MariaDB) */
const { getMySQLPool } = require('../config/mysql');

async function getDefaultContent(lang = 'en') {
  return { hero: {}, templates: {}, editorShowcase: {}, workflow: {}, highlights: {}, showcase: {}, pricing: {}, finalCta: {} };
}

function parseCell(v) {
  if (v == null || v === '') return {};
  if (typeof v === 'string') {
    const t = v.trim();
    return t ? JSON.parse(t) : {};
  }
  if (Buffer.isBuffer(v)) {
    const t = v.toString('utf8').trim();
    return t ? JSON.parse(t) : {};
  }
  return v; // driver parsed the JSON column already — reuse it
}

function parseRow(r) {
  return {
    hero: parseCell(r.hero),
    templates: parseCell(r.templates),
    editorShowcase: parseCell(r.editorShowcase),
    workflow: parseCell(r.workflow),
    highlights: parseCell(r.highlights),
    showcase: parseCell(r.showcase),
    pricing: parseCell(r.pricing),
    finalCta: parseCell(r.finalCta)
  };
}

async function getHomeContent(lang = 'en') {
  const pool = await getMySQLPool();
  const c = await pool.getConnection();
  try {
    const [rows] = await c.execute('SELECT hero, templates, editor_showcase AS editorShowcase, workflow, highlights, showcase, pricing, final_cta AS finalCta FROM HomeContent WHERE lang = ?', [lang]);
    if (!rows.length) return getDefaultContent(lang);
    return parseRow(rows[0]);
  } finally { c.release(); }
}

async function updateHomeContent(lang, content) {
  const pool = await getMySQLPool();
  const c = await pool.getConnection();
  try {
    await c.beginTransaction();
    const [existing] = await c.execute('SELECT id FROM HomeContent WHERE lang = ?', [lang]);
    const hero = JSON.stringify(content.hero ?? {});
    const templates = JSON.stringify(content.templates ?? {});
    const editorShowcase = JSON.stringify(content.editorShowcase ?? {});
    const workflow = JSON.stringify(content.workflow ?? {});
    const highlights = JSON.stringify(content.highlights ?? {});
    const showcase = JSON.stringify(content.showcase ?? {});
    const pricing = JSON.stringify(content.pricing ?? {});
    const finalCta = JSON.stringify(content.finalCta ?? {});
    if (existing.length > 0) {
      await c.execute('UPDATE HomeContent SET hero = ?, templates = ?, editor_showcase = ?, workflow = ?, highlights = ?, showcase = ?, pricing = ?, final_cta = ?, updated_at = NOW() WHERE lang = ?',
        [hero, templates, editorShowcase, workflow, highlights, showcase, pricing, finalCta, lang]);
    } else {
      await c.execute('INSERT INTO HomeContent (id, lang, hero, templates, editor_showcase, workflow, highlights, showcase, pricing, final_cta, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
        [`hc-${lang}`, lang, hero, templates, editorShowcase, workflow, highlights, showcase, pricing, finalCta]);
    }
    await c.commit();
    return { updated: true };
  } catch (e) {
    try { await c.rollback(); } catch (_) {}
    throw e;
  } finally { c.release(); }
}

module.exports = { getHomeContent, updateHomeContent, getDefaultContent };
