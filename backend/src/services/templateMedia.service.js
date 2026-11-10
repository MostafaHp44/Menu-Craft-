/**
 * Template media overrides (platform templates in /templates gallery).
 *
 * DB-backed per-template overrides merged on top of the stock definitions in
 * `frontend/src/templates/data/templates.ts`. Keys are base_template_id values
 * (stock ids like `glazed-kreme` or custom template row ids).
 *
 * - hero_title / hero_subtitle: texts on the hero section
 * - hero_image / hero_image_mobile: background images (desktop 16:9, mobile 9:16)
 * - hero_video_desktop / hero_video_mobile: background videos (desktop 16:9, mobile 9:16)
 * - preview_image: cards in the /templates gallery
 * - gallery: array of gallery image URLs
 * - design: partial DesignConfiguration (colors/typography/layout) merged into defaultDesign
 */
const { getMySQLPool } = require('../config/mysql');
const { z } = require('zod');

const overrideSchema = z.object({
  hero_title: z.string().max(500).optional().nullable(),
  hero_subtitle: z.string().max(1000).optional().nullable(),
  hero_image: z.string().url().max(2048).optional().nullable().or(z.string().max(2048).optional().nullable()),
  hero_image_mobile: z.string().max(2048).optional().nullable(),
  hero_video_desktop: z.string().max(2048).optional().nullable(),
  hero_video_mobile: z.string().max(2048).optional().nullable(),
  preview_image: z.string().max(2048).optional().nullable(),
  gallery: z.array(z.string().max(2048)).max(24).optional().nullable(),
  design: z.object({
    colors: z.record(z.string()).optional(),
    typography: z.record(z.string()).optional(),
    layout: z.object({
      header: z.enum(['split', 'centered', 'minimal']).optional(),
      hero: z.enum(['fullscreen', 'split', 'editorial']).optional(),
      menuLayout: z.enum(['grid', 'list', 'board', 'deck', 'compact']).optional(),
      menuDisplay: z.enum(['tabs', 'scroll-sticky']).optional(),
      card: z.enum(['bordered', 'elevated', 'flat']).optional(),
      radius: z.number().min(0).max(48).optional(),
      spacing: z.union([z.literal(0), z.literal(1), z.literal(2)]).optional(),
      aspect: z.enum(['square', 'portrait', 'landscape', 'wide']).optional(),
      theme: z.enum(['light', 'dark', 'warm', 'custom']).optional(),
      variant: z.enum(['classic', 'krispy']).optional(),
    }).optional(),
  }).optional().nullable(),
}).passthrough();

let ensured = false;
async function ensureTable() {
  if (ensured) return;
  const pool = await getMySQLPool();
  const c = await pool.getConnection();
  try {
    await c.execute(`CREATE TABLE IF NOT EXISTS TemplateOverrides (
      base_template_id VARCHAR(100) PRIMARY KEY,
      hero_title VARCHAR(500) NULL,
      hero_subtitle TEXT NULL,
      hero_image TEXT NULL,
      hero_image_mobile TEXT NULL,
      hero_video_desktop TEXT NULL,
      hero_video_mobile TEXT NULL,
      preview_image TEXT NULL,
      gallery LONGTEXT NULL,
      design LONGTEXT NULL,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      updated_by VARCHAR(100) NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    ensured = true;
  } finally {
    c.release();
  }
}

function parseGallery(value) {
  if (!value) return null;
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : null;
  } catch (_) {
    return null;
  }
}

function parseDesign(value) {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch (_) {
    return null;
  }
}

function toApi(row) {
  return {
    baseTemplateId: row.base_template_id,
    heroTitle: row.hero_title || null,
    heroSubtitle: row.hero_subtitle || null,
    heroImage: row.hero_image || null,
    heroImageMobile: row.hero_image_mobile || null,
    heroVideoDesktop: row.hero_video_desktop || null,
    heroVideoMobile: row.hero_video_mobile || null,
    previewImage: row.preview_image || null,
    gallery: parseGallery(row.gallery),
    design: parseDesign(row.design),
    updatedAt: row.updated_at,
    updatedBy: row.updated_by || null,
  };
}

async function listOverrides() {
  await ensureTable();
  const pool = await getMySQLPool();
  const c = await pool.getConnection();
  try {
    const [rows] = await c.execute('SELECT * FROM TemplateOverrides ORDER BY updated_at DESC');
    return rows.map(toApi);
  } finally {
    c.release();
  }
}

async function getOverride(baseId) {
  await ensureTable();
  const pool = await getMySQLPool();
  const c = await pool.getConnection();
  try {
    const [rows] = await c.execute('SELECT * FROM TemplateOverrides WHERE base_template_id = ?', [baseId]);
    return rows.length ? toApi(rows[0]) : null;
  } finally {
    c.release();
  }
}

async function upsertOverride(baseId, input) {
  await ensureTable();
  const parsed = overrideSchema.parse(input || {});
  const galleryJson = parsed.gallery !== undefined && parsed.gallery !== null ? JSON.stringify(parsed.gallery) : null;
  const designJson = parsed.design !== undefined && parsed.design !== null ? JSON.stringify(parsed.design) : null;

  const pool = await getMySQLPool();
  const c = await pool.getConnection();
  try {
    const [existing] = await c.execute('SELECT * FROM TemplateOverrides WHERE base_template_id = ?', [baseId]);
    const cur = existing[0] || {};

    const next = {
      hero_title: parsed.hero_title !== undefined ? parsed.hero_title || null : (cur.hero_title ?? null),
      hero_subtitle: parsed.hero_subtitle !== undefined ? parsed.hero_subtitle || null : (cur.hero_subtitle ?? null),
      hero_image: parsed.hero_image !== undefined ? parsed.hero_image || null : (cur.hero_image ?? null),
      hero_image_mobile: parsed.hero_image_mobile !== undefined ? parsed.hero_image_mobile || null : (cur.hero_image_mobile ?? null),
      hero_video_desktop: parsed.hero_video_desktop !== undefined ? parsed.hero_video_desktop || null : (cur.hero_video_desktop ?? null),
      hero_video_mobile: parsed.hero_video_mobile !== undefined ? parsed.hero_video_mobile || null : (cur.hero_video_mobile ?? null),
      preview_image: parsed.preview_image !== undefined ? parsed.preview_image || null : (cur.preview_image ?? null),
      gallery: parsed.gallery !== undefined ? galleryJson : (cur.gallery ?? null),
      design: parsed.design !== undefined ? designJson : (cur.design ?? null),
    };

    if (existing.length) {
      await c.execute(
        'UPDATE TemplateOverrides SET hero_title = ?, hero_subtitle = ?, hero_image = ?, hero_image_mobile = ?, hero_video_desktop = ?, hero_video_mobile = ?, preview_image = ?, gallery = ?, design = ?, updated_by = ? WHERE base_template_id = ?',
        [next.hero_title, next.hero_subtitle, next.hero_image, next.hero_image_mobile, next.hero_video_desktop, next.hero_video_mobile, next.preview_image, next.gallery, next.design, input.updated_by ?? null, baseId]
      );
    } else {
      await c.execute(
        'INSERT INTO TemplateOverrides (base_template_id, hero_title, hero_subtitle, hero_image, hero_image_mobile, hero_video_desktop, hero_video_mobile, preview_image, gallery, design, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [baseId, next.hero_title, next.hero_subtitle, next.hero_image, next.hero_image_mobile, next.hero_video_desktop, next.hero_video_mobile, next.preview_image, next.gallery, next.design, input.updated_by ?? null]
      );
    }
    const [rows] = await c.execute('SELECT * FROM TemplateOverrides WHERE base_template_id = ?', [baseId]);
    return toApi(rows[0]);
  } finally {
    c.release();
  }
}

async function deleteOverride(baseId) {
  await ensureTable();
  const pool = await getMySQLPool();
  const c = await pool.getConnection();
  try {
    const [r] = await c.execute('DELETE FROM TemplateOverrides WHERE base_template_id = ?', [baseId]);
    return { deleted: r.affectedRows > 0 };
  } finally {
    c.release();
  }
}

module.exports = { listOverrides, getOverride, upsertOverride, deleteOverride, ensureTable };
