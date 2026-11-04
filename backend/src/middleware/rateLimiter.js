const Redis = require('ioredis');
const crypto = require('crypto');

let redisClient = null;
const rateStore = {};
const consumedTokens = {};

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
  return n * (multipliers[unit] || 1);
}

function generateKey(request, identifier) {
  const ip = request.ip || 'unknown';
  let userId = 'anon';
  if (request.user && request.user.userId) {
    userId = `user:${request.user.userId}`;
  }

  let route = 'unknown';
  if (request.routeOptions && request.routeOptions.path) {
    route = request.routeOptions.path.replace(/:[\w]+/g, '[^/]+');
  } else if (request.routerPath) {
    route = request.routerPath;
  }

  switch (identifier) {
    case 'user':
      return `rate-limit:user:${userId}:${route}`;
    case 'ip':
      return `rate-limit:ip:${ip}:${route}`;
    case 'combined':
    default:
      return `rate-limit:combined:${ip}:${userId}:${route}`;
  }
}

function sha256Hash(input) {
  return crypto.createHash('sha256').update(String(input || '')).digest('hex');
}

function applyInMemoryLimit(key, now, durationMs) {
  const stored = rateStore[key];
  if (!stored || now >= stored.resetAt) {
    const resetAt = now + durationMs;
    rateStore[key] = { count: 1, resetAt };
    return { count: 1, resetAt };
  }
  stored.count += 1;
  return { count: stored.count, resetAt: stored.resetAt };
}

async function initRedis(options = {}) {
  const isProduction = process.env.NODE_ENV === 'production';

  const host = options.host || process.env.REDIS_HOST;
  const port = parseInt(options.port || process.env.REDIS_PORT, 10) || 6379;
  const password = options.password || process.env.REDIS_PASSWORD || undefined;
  const db = parseInt(options.db || process.env.REDIS_DB, 10) || 0;

  if (isProduction && !host) {
    console.error('REDIS_HOST is required in production - cannot start');
    process.exit(1);
  }

  if (isProduction && !password && process.env.REDIS_ALLOW_NO_AUTH !== 'true') {
    console.error('REDIS_PASSWORD is required in production - cannot start, or set REDIS_ALLOW_NO_AUTH=true if Redis is protected by private networking/firewall');
    process.exit(1);
  }

  const client = new Redis({
    host: host || '127.0.0.1',
    port,
    password,
    db,
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    connectTimeout: 2000,
    retryStrategy(times) {
      if (times > 2) return null;
      return Math.min(times * 200, 1000);
    }
  });

  client.on('error', (err) => {
    console.warn('Redis rate limiter error:', err.message);
  });

  try {
    await client.connect();
    await client.ping();
    redisClient = client;
    return true;
  } catch (err) {
    try {
      client.disconnect();
    } catch (_) {
      // ignore
    }

    if (isProduction) {
      console.error('Redis connection failed during init in production - cannot continue');
      process.exit(1);
    }

    console.warn('Redis connection failed during init; falling back to in-memory');
    redisClient = null;
    return false;
  }
}

async function closeRedis() {
  if (!redisClient) return;
  const client = redisClient;
  redisClient = null;
  try {
    await client.quit();
  } catch (_) {
    try {
      client.disconnect();
    } catch (__) {
      // ignore
    }
  }
}

function getRedisClient() {
  return redisClient;
}

module.exports = {
  initRedis,
  closeRedis,
  getRedisClient,
  parseDuration,
  generateKey,
  sha256Hash,

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
        if (redisClient && redisClient.status === 'ready') {
          count = await redisClient.incr(key);
          if (count === 1) {
            await redisClient.pexpire(key, config.durationMs);
          }
          const ttl = await redisClient.pttl(key);
          if (ttl > 0) resetAt = now + ttl;
        } else {
          const limited = applyInMemoryLimit(key, now, config.durationMs);
          count = limited.count;
          resetAt = limited.resetAt;
        }
      } catch (err) {
        console.error('Redis rate limit error, falling back to in-memory:', err.message);
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

  revokeRefreshToken: async function (refreshToken) {
    const tokenHash = sha256Hash(refreshToken);
    const key = `refresh_used:${tokenHash}`;
    const remainingTtl = 604800;
    const isProduction = process.env.NODE_ENV === 'production';

    try {
      if (redisClient && redisClient.status === 'ready') {
        const result = await redisClient.set(key, '1', 'NX', 'EX', remainingTtl);
        return result === 'OK';
      }
      if (consumedTokens[key]) return false;
      consumedTokens[key] = true;
      return true;
    } catch (err) {
      console.error('Redis revokeRefreshToken error:', err.message);
      if (isProduction) {
        return false;
      }
      if (consumedTokens[key]) return false;
      consumedTokens[key] = true;
      return true;
    }
  },

  isRefreshTokenConsumed: async function (refreshToken) {
    const tokenHash = sha256Hash(refreshToken);
    const key = `refresh_used:${tokenHash}`;
    const isProduction = process.env.NODE_ENV === 'production';

    try {
      if (redisClient && redisClient.status === 'ready') {
        const result = await redisClient.get(key);
        return result !== null;
      }
      return Boolean(consumedTokens[key]);
    } catch (err) {
      console.error('Redis isRefreshTokenConsumed error:', err.message);
      if (isProduction) {
        return true;
      }
      return Boolean(consumedTokens[key]);
    }
  }
};
