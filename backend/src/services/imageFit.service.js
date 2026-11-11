/**
 * Image fit (object-position + width/height) persistence.
 *
 * - Restaurants.hero_image_fit (LONGTEXT JSON): client choice for the hero photo
 *   (top / center / bottom variants), stored as { position, width, height }.
 * - MenuItems.image_fit (LONGTEXT JSON): same per menu-item photo, synced from
 *   the draft menu JSON on every save.
 */
const { getMySQLPool } = require('../config/mysql');

let ensured = false;

async function columnExists(conn, table, column) {
  const [rows] = await conn.execute(
    `SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return Number(rows[0].c) > 0;
}

async function ensureRestaurantFitColumns() {
  if (ensured) return;
  try {
    const pool = await getMySQLPool();
    const conn = await pool.getConnection();
    try {
      const [exists] = await conn.execute(
        `SELECT COUNT(*) AS c FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Restaurants'`
      );
      if (Number(exists[0].c) > 0) {
        if (!(await columnExists(conn, 'Restaurants', 'hero_image_fit'))) {
          await conn.execute('ALTER TABLE Restaurants ADD COLUMN hero_image_fit LONGTEXT NULL');
        }
        if (!(await columnExists(conn, 'Restaurants', 'gallery_fits'))) {
          await conn.execute('ALTER TABLE Restaurants ADD COLUMN gallery_fits LONGTEXT NULL');
        }
      }
    } finally {
      conn.release();
    }
    ensured = true;
  } catch (_) {
    // best-effort: queries will surface a clear error if the column self-creation fails
  }
}

/**
 * Restaurants.mode — the two product modes (per UPGRADE_FLOW_SPEC §1):
 *   - 'live'  → Live Digital Menu (ordering + branches + team + payments)
 *   - 'static'→ Digital Menu (design/template editing only, no ordering)
 * Created lazily at runtime exactly like the fit columns (best effort).
 */
let modeEnsured = false;
async function ensureRestaurantModeColumn() {
  if (modeEnsured) return;
  try {
    const pool = await getMySQLPool();
    const conn = await pool.getConnection();
    try {
      const [exists] = await conn.execute(
        `SELECT COUNT(*) AS c FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Restaurants'`
      );
      if (Number(exists[0].c) > 0) {
        if (!(await columnExists(conn, 'Restaurants', 'mode'))) {
          await conn.execute("ALTER TABLE Restaurants ADD COLUMN mode VARCHAR(20) DEFAULT 'live' NOT NULL");
        }
      }
    } finally {
      conn.release();
    }
    modeEnsured = true;
  } catch (_) {
    // best-effort: queries surface a clear error if the column self-creation fails
  }
}

let menuEnsured = false;
async function ensureMenuFitColumns(conn) {
  if (menuEnsured) return;
  try {
    if (!(await columnExists(conn, 'MenuItems', 'image_fit'))) {
      await conn.execute('ALTER TABLE MenuItems ADD COLUMN image_fit LONGTEXT NULL');
    }
    menuEnsured = true;
  } catch (_) {}
}

function stringifyFit(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'string') {
    try {
      JSON.parse(value);
      return value;
    } catch {
      return null;
    }
  }
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

function parseFit(value) {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

module.exports = { ensureRestaurantFitColumns, ensureRestaurantModeColumn, ensureMenuFitColumns, stringifyFit, parseFit };
