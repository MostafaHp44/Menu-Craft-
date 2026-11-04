const { getPool, sql } = require('../config/db');

async function getHomeContent(lang = 'en') {
  const pool = await getPool();
  const result = await pool.request()
    .input('lang', sql.NVarChar, lang)
    .query(`
      SELECT hero, templates, editor_showcase AS editorShowcase, workflow, highlights, showcase, pricing, final_cta AS finalCta
      FROM HomeContent
      WHERE lang = @lang
    `);

  if (result.recordset.length === 0) {
    return getDefaultContent(lang);
  }

  const row = result.recordset[0];
  return {
    hero: JSON.parse(row.hero || '{}'),
    templates: JSON.parse(row.templates || '{}'),
    editorShowcase: JSON.parse(row.editorShowcase || '{}'),
    workflow: JSON.parse(row.workflow || '{}'),
    highlights: JSON.parse(row.highlights || '{}'),
    showcase: JSON.parse(row.showcase || '{}'),
    pricing: JSON.parse(row.pricing || '{}'),
    finalCta: JSON.parse(row.finalCta || '{}')
  };
}

async function updateHomeContent(lang, content) {
  const pool = await getPool();
  const now = new Date().toISOString();

  const existing = await pool.request()
    .input('lang', sql.NVarChar, lang)
    .query('SELECT id FROM HomeContent WHERE lang = @lang');

  const hero = JSON.stringify(content.hero ?? {});
  const templates = JSON.stringify(content.templates ?? {});
  const editorShowcase = JSON.stringify(content.editorShowcase ?? {});
  const workflow = JSON.stringify(content.workflow ?? {});
  const highlights = JSON.stringify(content.highlights ?? {});
  const showcase = JSON.stringify(content.showcase ?? {});
  const pricing = JSON.stringify(content.pricing ?? {});
  const finalCta = JSON.stringify(content.finalCta ?? {});

  if (existing.recordset.length > 0) {
    await pool.request()
      .input('lang', sql.NVarChar, lang)
      .input('hero', sql.NVarChar, hero)
      .input('templates', sql.NVarChar, templates)
      .input('editorShowcase', sql.NVarChar, editorShowcase)
      .input('workflow', sql.NVarChar, workflow)
      .input('highlights', sql.NVarChar, highlights)
      .input('showcase', sql.NVarChar, showcase)
      .input('pricing', sql.NVarChar, pricing)
      .input('finalCta', sql.NVarChar, finalCta)
      .input('updatedAt', sql.DateTime, now)
      .query(`
        UPDATE HomeContent
        SET hero = @hero, templates = @templates, editor_showcase = @editorShowcase,
            workflow = @workflow, highlights = @highlights, showcase = @showcase,
            pricing = @pricing, final_cta = @finalCta, updated_at = @updatedAt
        WHERE lang = @lang
      `);
  } else {
    await pool.request()
      .input('lang', sql.NVarChar, lang)
      .input('hero', sql.NVarChar, hero)
      .input('templates', sql.NVarChar, templates)
      .input('editorShowcase', sql.NVarChar, editorShowcase)
      .input('workflow', sql.NVarChar, workflow)
      .input('highlights', sql.NVarChar, highlights)
      .input('showcase', sql.NVarChar, showcase)
      .input('pricing', sql.NVarChar, pricing)
      .input('finalCta', sql.NVarChar, finalCta)
      .input('created_at', sql.DateTime, now)
      .input('updated_at', sql.DateTime, now)
      .query(`
        INSERT INTO HomeContent (lang, hero, templates, editor_showcase, workflow, highlights, showcase, pricing, final_cta, created_at, updated_at)
        VALUES (@lang, @hero, @templates, @editorShowcase, @workflow, @highlights, @showcase, @pricing, @finalCta, @created_at, @updated_at)
      `);
  }

  return { ok: true };
}

function getDefaultContent(lang) {
  return {
    hero: { enabled: true, title: 'Your Restaurant Menu', sub: 'Create a beautiful digital menu' },
    templates: { enabled: true, title: 'Templates' },
    editorShowcase: { enabled: true, title: 'Editor' },
    workflow: { enabled: true, title: 'How it works', steps: [] },
    highlights: { enabled: true, items: [] },
    showcase: { enabled: true, title: 'Responsive' },
    pricing: { enabled: true, title: 'Pricing' },
    finalCta: { enabled: true, title: 'Get started' }
  };
}

module.exports = {
  getHomeContent,
  updateHomeContent
};
