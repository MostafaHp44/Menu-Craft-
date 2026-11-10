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
  // Checks MariaDB connectivity (business data + rate-limit store) using the
  // existing connection pool. Returns 200 if healthy, 503 otherwise.
  fastify.get('/health/ready', async (request, reply) => {
    try {
      let ready = true;
      const checks = [];

      // Check SQL Server connectivity using existing pool promise
      const { getMySQLPool } = require('../config/mysql');
      const poolPromise = getMySQLPool();

      // MariaDB check - short timeout
      let sqlHealthy = false;
      try {
        const timeout = setTimeout(() => { sqlHealthy = false; }, 3000);
        const pool = await poolPromise;
        if (pool) {
          const connection = await pool.getConnection();
          try {
            const [rows] = await connection.execute('SELECT 1 AS healthy');
            sqlHealthy = rows.length > 0;
          } finally { connection.release(); }
        }
        clearTimeout(timeout);
      } catch (err) { sqlHealthy = false; }

      checks.sql = sqlHealthy;

      // Rate-limit/denylist store lives in the same MariaDB — probe the table.
      let storeHealthy = false;
      try {
        const { pingStore } = require('../middleware/rateLimiter');
        storeHealthy = await pingStore();
      } catch (err) {
        storeHealthy = false;
      }

      checks.store = storeHealthy;

      const allHealthy = checks.sql && checks.store;

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