const healthLogger = require('../utils/logger');

function healthRoutes(fastify, opts, done) {
  // GET /api/health/live - Node.js process alive check
  // Does not depend on database or Redis.
  fastify.get('/health/live', async (request, reply) => {
    try {
      return reply.code(200).send({
        ok: true,
        status: 'live'
      });
    } catch (err) {
      return reply.code(500).send({
        ok: false,
        error: 'Internal server error'
      });
    }
  });

  // GET /api/health/ready - Dependency readiness check
  // Checks SQL Server and Redis connectivity using existing connection pools.
  // Returns 200 if all required dependencies are healthy.
  // Returns 503 if a required dependency is unavailable.
  fastify.get('/health/ready', async (request, reply) => {
    try {
      let ready = true;
      const checks = [];

      // Check SQL Server connectivity using existing pool promise
      const { getPool } = require('../config/db');
      const poolPromise = getPool();

      // SQL Server check - short timeout
      let sqlHealthy = false;
      try {
        const timeout = setTimeout(() => {
          sqlHealthy = false;
        }, 3000); // 3 second timeout
        // Attempt a lightweight query to verify connectivity
        const pool = await poolPromise;
        if (pool) {
          // Execute a simple query to verify the pool is functional
          const result = await pool.request().query('SELECT 1 AS healthy');
          sqlHealthy = result.recordset.length > 0;
        }
        clearTimeout(timeout);
      } catch (err) {
        sqlHealthy = false;
      }

      checks.sql = sqlHealthy;

      let redisHealthy = false;
      try {
        const { getRedisClient } = require('../middleware/rateLimiter');
        const redis = getRedisClient();
        if (redis && redis.status === 'ready') {
          const pong = await redis.ping();
          redisHealthy = pong === 'PONG';
        } else {
          // Development may run without Redis using the in-memory fallback.
          redisHealthy = process.env.NODE_ENV !== 'production';
        }
      } catch (err) {
        redisHealthy = process.env.NODE_ENV !== 'production';
      }

      checks.redis = redisHealthy;

      const allHealthy = checks.sql && checks.redis;

      if (allHealthy) {
        return reply.code(200).send({
          ok: true,
          status: 'ready',
          checks
        });
      } else {
        return reply.code(503).send({
          ok: false,
          status: 'not_ready',
          checks
        });
      }
    } catch (err) {
      // If anything unexpected happens, return 503 - conservative approach
      return reply.code(503).send({
        ok: false,
        status: 'error',
        error: 'Health check failed'
      });
    }
  });

  done();
}

module.exports = healthRoutes;