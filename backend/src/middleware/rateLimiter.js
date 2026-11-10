const crypto = require('crypto');
const { getMySQLPool } = require('../config/mysql');

/**
 * MariaDB-backed rate limiter + token denylist (Redis removed 2026-11-10).
 *
 * Two small tables in the existing database (no extra service on the host):
 *   • rate_limits     — sliding-window counters for the auth rate limiters.
 *   • token_denylist  — single-use refresh tokens + logged-out access tokens.
 *
 * Semantics are identical to the previous Redis implementation:
 *   • counters survive restarts and are shared across workers;
 *   • production fails CLOSED if the store is unavailable (a token that
 *     cannot be checked is treated as revoked/consumed);
 *   • development falls back to in-memory maps so local work never blocks.
 */

let storeReady = false;

/** In-memory fallbacks (development / store unavailable). Entries carry an expiry (epoch ms). */
const rateStore = new Map();
const consumedTokens = new Map();
const revokedAccessTokens = new Map();

const REFRESH_TOKEN_MAX_TTL = 604800; // 7 days — upper bound for a refresh token
const SWEEP_INTERVAL_MS = 5 * 60 * 1000; // opportunistic cleanup of expired rows
let lastSweepAt = 0;

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

function nowSec() {
  return Math.floor(Date.now() / 1000);
}

function parseDuration(duration) {
  if (typeof duration === 'number' && Number.isFinite(duration)) {
    return duration;
  }
  if (typeof duration !== 'string') {
    return 60000;
  }
  const match = duration.trim().match(/^(\d+)\s*(ms|s|m|h|d)?$/i);
  if (!match) {
    return 60000;
  }
  const n = parseInt(match[1], 10);
  const unit = (match[2] || 'ms').toLowerCase();
  const multipliers = { ms: 1, s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return n * (multipliers[unit] || 60000);
}

function sha256Hash(input) {
  return crypto.createHash('sha256').update(String(input || '')).digest('hex');
}

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function getRoutePath(request) {
  if (request.routeOptions && request.routeOptions.path) {
    return request.routeOptions.path.replace(/:[\w]+/g, '[^/]+');
  }
  if (request.routerPath) return request.routerPath;
  return 'unknown';
}

function generateKey(request, identifier) {
  const ip = request.ip || 'unknown';
  const userId = request.user && request.user.userId ? request.user.userId : null;
  const route = getRoutePath(request);

  switch (identifier) {
    case 'user':
      // Authenticated users get a per-user bucket. Anonymous callers must NEVER
      // share one global bucket (that let a single attacker exhaust refresh for
      // everyone) — they fall back to a per-IP bucket.
      return userId
        ? `rate-limit:user:${userId}:${route}`
        : `rate-limit:ip:${ip}:${route}`;
    case 'ip':
      return `rate-limit:ip:${ip}:${route}`;
    case 'login': {
      // Shared across every login alias (/auth/signin and /auth/employee-login).
      // Route is deliberately excluded so an alias cannot open a second budget.
      const email = normalizeEmail(request.body && request.body.email);
      const account = email ? sha256Hash(email).slice(0, 24) : 'no-email';
      return `rate-limit:login:${ip}:${account}`;
    }
    case 'login-ip':
      // Second, coarser guard: stops an attacker from rotating emails to bypass
      // the per-account bucket above.
      return `rate-limit:login-ip:${ip}`;
    case 'combined':
    default:
      return `rate-limit:combined:${ip}:${userId || 'anon'}:${route}`;
  }
}

/* ------------------------------- schema ------------------------------- */

const DDL_RATE_LIMITS = `
  CREATE TABLE IF NOT EXISTS rate_limits (
    bucket_key VARCHAR(191) NOT NULL PRIMARY KEY,
    hits       INT UNSIGNED NOT NULL DEFAULT 1,
    reset_at   INT UNSIGNED NOT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`;

const DDL_TOKEN_DENYLIST = `
  CREATE TABLE IF NOT EXISTS token_denylist (
    token_key  VARCHAR(191) NOT NULL PRIMARY KEY,
    expires_at INT UNSIGNED NOT NULL,
    KEY idx_token_denylist_expires (expires_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`;

/**
 * Creates the store tables (idempotent) and marks the store ready.
 * Production refuses to start without a working store — the same fail-fast
 * behaviour Redis used to have. Development falls back to in-memory maps.
 */
async function initStore() {
  try {
    const pool = getMySQLPool();
    await pool.query(DDL_RATE_LIMITS);
    await pool.query(DDL_TOKEN_DENYLIST);
    storeReady = true;
    lastSweepAt = Date.now();
    await sweepExpired().catch(() => {});
    console.log('Rate-limit store: MariaDB (rate_limits, token_denylist)');
    return true;
  } catch (err) {
    storeReady = false;
    if (isProduction()) {
      console.error('Rate-limit store initialization failed in production:', err.message);
      process.exit(1);
    }
    console.warn('Rate-limit store initialization failed; using in-memory fallback:', err.message);
    return false;
  }
}

/** No-op kept for shutdown symmetry — the MariaDB pool is closed by server.js. */
async function closeStore() {
  storeReady = false;
}

/** Health probe: DB reachable AND the store tables exist. */
async function pingStore() {
  if (!storeReady) return !isProduction();
  try {
    const [rows] = await getMySQLPool().query(
      `SELECT EXISTS(
         SELECT 1 FROM information_schema.tables
         WHERE table_schema = DATABASE() AND table_name = 'rate_limits'
       ) AS ok`
    );
    return Boolean(rows[0] && Number(rows[0].ok) === 1);
  } catch (_) {
    return false;
  }
}

/** Deletes expired rows at most once per SWEEP_INTERVAL_MS (fire-and-forget). */
function maybeSweep() {
  if (!storeReady) return;
  const now = Date.now();
  if (now - lastSweepAt < SWEEP_INTERVAL_MS) return;
  lastSweepAt = now;
  sweepExpired().catch(() => {});
}

async function sweepExpired() {
  if (!storeReady) return;
  const now = nowSec();
  const pool = getMySQLPool();
  await pool.query('DELETE FROM rate_limits WHERE reset_at <= ?', [now]);
  await pool.query('DELETE FROM token_denylist WHERE expires_at <= ?', [now]);
}

/* --------------------------- in-memory fallback --------------------------- */

function pruneMap(map, now) {
  if (map.size < 1000) return;
  for (const [key, expiresAt] of map) {
    if (expiresAt <= now) map.delete(key);
  }
}

function applyInMemoryLimit(key, now, durationMs) {
  pruneMap(rateStore, now);
  const stored = rateStore.get(key);
  if (!stored || now >= stored.resetAt) {
    const resetAt = now + durationMs;
    rateStore.set(key, { count: 1, resetAt });
    return { count: 1, resetAt };
  }
  stored.count += 1;
  return { count: stored.count, resetAt: stored.resetAt };
}

/* ------------------------------ rate limits ------------------------------ */

/**
 * Atomically increments the bucket and returns the resulting count.
 * `ON DUPLICATE KEY UPDATE` with the expiry check makes the read-modify-write
 * safe under concurrency; the follow-up SELECT may over-count by a request
 * under a race, which is the safe direction for a limiter.
 */
async function bumpBucket(key, durationMs) {
  const now = nowSec();
  const windowSec = Math.max(1, Math.ceil(durationMs / 1000));
  const newResetAt = now + windowSec;
  const pool = getMySQLPool();
  await pool.query(
    `INSERT INTO rate_limits (bucket_key, hits, reset_at) VALUES (?, 1, ?)
     ON DUPLICATE KEY UPDATE
       hits     = IF(reset_at <= ?, 1, hits + 1),
       reset_at = IF(reset_at <= ?, ?, reset_at)`,
    [key, newResetAt, now, now, newResetAt]
  );
  const [rows] = await pool.query(
    'SELECT hits, reset_at FROM rate_limits WHERE bucket_key = ?',
    [key]
  );
  if (!rows.length) return { count: 1, resetAt: newResetAt * 1000 };
  return { count: Number(rows[0].hits), resetAt: Number(rows[0].reset_at) * 1000 };
}

/* ----------------------------- token denylist ----------------------------- */

/**
 * Marks a key as used exactly once. Returns true when this call was the first
 * to mark it (and false when a live entry already existed).
 */
async function markConsumed(key, ttlSeconds) {
  const ttl = Math.max(1, Math.min(Math.floor(ttlSeconds) || 1, REFRESH_TOKEN_MAX_TTL));
  maybeSweep();

  if (storeReady) {
    const now = nowSec();
    const pool = getMySQLPool();
    // Drop an expired stale row first so a dead entry can be renewed, then
    // INSERT IGNORE: the primary key makes "first use" atomic across workers.
    await pool.query(
      'DELETE FROM token_denylist WHERE token_key = ? AND expires_at <= ?',
      [key, now]
    );
    const [result] = await pool.query(
      'INSERT IGNORE INTO token_denylist (token_key, expires_at) VALUES (?, ?)',
      [key, now + ttl]
    );
    return Number(result.affectedRows) === 1;
  }

  const nowMs = Date.now();
  pruneMap(consumedTokens, nowMs);
  const existing = consumedTokens.get(key);
  if (existing && existing > nowMs) return false;
  consumedTokens.set(key, nowMs + ttl * 1000);
  return true;
}

async function isMarked(key) {
  if (storeReady) {
    const [rows] = await getMySQLPool().query(
      'SELECT expires_at FROM token_denylist WHERE token_key = ?',
      [key]
    );
    return rows.length > 0 && Number(rows[0].expires_at) > nowSec();
  }
  const expiresAt = consumedTokens.get(key);
  return Boolean(expiresAt && expiresAt > Date.now());
}

/** Seconds until a JWT `exp` (seconds since epoch), clamped to a sane range. */
function ttlFromExp(exp, fallbackSeconds) {
  if (!exp || !Number.isFinite(exp)) return fallbackSeconds;
  const seconds = Math.floor(exp - Date.now() / 1000);
  if (seconds <= 0) return 1;
  return Math.min(seconds, fallbackSeconds);
}

/**
 * Revokes a refresh token. Pass the JWT `exp` so the denylist entry expires
 * together with the token instead of lingering for a fixed week.
 */
async function revokeRefreshToken(refreshToken, ttlSeconds) {
  const tokenHash = sha256Hash(refreshToken);
  const key = `refresh_used:${tokenHash}`;
  const ttl = ttlSeconds || REFRESH_TOKEN_MAX_TTL;

  try {
    return await markConsumed(key, ttl);
  } catch (err) {
    console.error('revokeRefreshToken error:', err.message);
    if (isProduction()) return false;
    return markConsumed(key, ttl);
  }
}

async function isRefreshTokenConsumed(refreshToken) {
  const key = `refresh_used:${sha256Hash(refreshToken)}`;

  try {
    return await isMarked(key);
  } catch (err) {
    console.error('isRefreshTokenConsumed error:', err.message);
    // Fail closed in production: an unreachable store must not allow replay.
    return isProduction() ? true : isMarked(key);
  }
}

/**
 * Revokes an access token on logout. Without this, a signed-out access token
 * stayed usable for its full remaining lifetime (up to 15 minutes).
 */
async function revokeAccessToken(accessToken, ttlSeconds) {
  if (!accessToken) return false;
  const key = `access_revoked:${sha256Hash(accessToken)}`;
  const ttl = Math.max(1, Math.min(Math.floor(ttlSeconds) || 1, 900));

  try {
    if (storeReady) {
      const now = nowSec();
      const pool = getMySQLPool();
      await pool.query(
        'DELETE FROM token_denylist WHERE token_key = ? AND expires_at <= ?',
        [key, now]
      );
      // Idempotent: an existing live entry already means "revoked".
      await pool.query(
        'INSERT IGNORE INTO token_denylist (token_key, expires_at) VALUES (?, ?)',
        [key, now + ttl]
      );
      return true;
    }
    revokedAccessTokens.set(key, Date.now() + ttl * 1000);
    return true;
  } catch (err) {
    console.error('revokeAccessToken error:', err.message);
    if (isProduction()) return false;
    revokedAccessTokens.set(key, Date.now() + ttl * 1000);
    return true;
  }
}

async function isAccessTokenRevoked(accessToken) {
  if (!accessToken) return false;
  const key = `access_revoked:${sha256Hash(accessToken)}`;

  try {
    if (storeReady) {
      const [rows] = await getMySQLPool().query(
        'SELECT expires_at FROM token_denylist WHERE token_key = ?',
        [key]
      );
      return rows.length > 0 && Number(rows[0].expires_at) > nowSec();
    }
    const expiresAt = revokedAccessTokens.get(key);
    if (!expiresAt) return false;
    if (expiresAt <= Date.now()) {
      revokedAccessTokens.delete(key);
      return false;
    }
    return true;
  } catch (err) {
    console.error('isAccessTokenRevoked error:', err.message);
    // Fail closed in production: a store outage must not resurrect logged-out tokens.
    return isProduction();
  }
}

module.exports = {
  initStore,
  closeStore,
  pingStore,
  parseDuration,
  generateKey,
  sha256Hash,
  ttlFromExp,
  revokeAccessToken,
  isAccessTokenRevoked,

  middleware: function (options) {
    const config = {
      max: options.max || 10,
      durationMs: parseDuration(options.duration || '1m'),
      identifier: options.identifier || 'ip'
    };

    return async function rateLimitPreHandler(request, reply) {
      const key = generateKey(request, config.identifier);
      const now = Date.now();
      let count = 1;
      let resetAt = now + config.durationMs;

      try {
        if (storeReady) {
          const limited = await bumpBucket(key, config.durationMs);
          count = limited.count;
          resetAt = limited.resetAt;
        } else {
          const limited = applyInMemoryLimit(key, now, config.durationMs);
          count = limited.count;
          resetAt = limited.resetAt;
        }
      } catch (err) {
        console.error('Rate limit store error, falling back to in-memory:', err.message);
        const limited = applyInMemoryLimit(key, now, config.durationMs);
        count = limited.count;
        resetAt = limited.resetAt;
      }

      const remaining = Math.max(0, config.max - count);
      reply.header('X-RateLimit-Limit', config.max);
      reply.header('X-RateLimit-Remaining', remaining);
      reply.header('X-RateLimit-Reset', Math.ceil(resetAt / 1000));

      if (count > config.max) {
        return reply.code(429).send({ ok: false, error: 'Too many requests' });
      }
    };
  },

  revokeRefreshToken,
  isRefreshTokenConsumed
};
