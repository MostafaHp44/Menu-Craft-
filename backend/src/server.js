require('dotenv').config();
const fastify = require('./app');
const { initStore, closeStore } = require('./middleware/rateLimiter');
const healthRoutes = require('./routes/health.routes');
const PORT = parseInt(process.env.PORT) || 3000;

async function startServer() {
  // Initialize the MariaDB-backed rate-limit/denylist store (idempotent DDL).
  // In production a failed init exits inside initStore (fail fast); in
  // development the limiter falls back to in-memory maps.
  try {
    await initStore();
  } catch (err) {
    fastify.log.error({ err }, 'Rate-limit store initialization failed');
    process.exit(1);
  }

  // Register health check routes (after store init, before listening)
  fastify.register(healthRoutes);

  fastify.listen({ port: PORT, host: '0.0.0.0' }, (err, address) => {
    if (err) {
      fastify.log.error(err);
      process.exit(1);
    }
    console.log(`Digital Menu Backend running at ${address}`);
  });
}

startServer();

// Graceful shutdown configuration
const SHUTDOWN_TIMEOUT = 30000; // 30 seconds

let shuttingDown = false;

// Graceful shutdown handler for SIGTERM and SIGINT
async function gracefulShutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;

  fastify.log.info(`Received ${signal}. Initiating graceful shutdown...`);

  try {
    // 1. Stop accepting new HTTP requests (wait for ongoing requests to finish)
    fastify.log.info('Closing Fastify server...');
    await fastify.close().catch(() => {});

    try {
      await closeStore();
      fastify.log.info('Rate-limit store closed');
    } catch (err) {
      fastify.log.warn({ err }, 'Rate-limit store close warning (non-fatal)');
    }

    // 3. Close MariaDB connection pool — drain pending operations
    try {
      const { getMySQLPool } = require('./config/mysql');
      const pool = await getMySQLPool();
      if (pool) await pool.end();
      fastify.log.info('MariaDB pool closed');
    } catch (err) {
      fastify.log.warn('MariaDB close warning (non-fatal):', err.message);
    }

    fastify.log.info('Graceful shutdown complete');
  } catch (err) {
    fastify.log.error('Error during graceful shutdown:', err);
  } finally {
    // Wait for shutdown timeout, then force exit
    setTimeout(() => {
      fastify.log.info('Forcing process exit after shutdown timeout');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT);
    process.exit(0);
  }
}

// SIGTERM and SIGINT trigger graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Unhandled promise rejection handling
process.on('unhandledRejection', (reason) => {
  fastify.log.error({ err: reason }, 'Unhandled promise rejection');
  if (!shuttingDown) {
    gracefulShutdown('UNHANDLED_REJECTION').then(() => {
      process.exit(1);
    });
  }
});

process.on('uncaughtException', (err) => {
  fastify.log.error({ err }, 'Uncaught exception');
  if (!shuttingDown) {
    gracefulShutdown('UNCAUGHT_EXCEPTION').then(() => {
      process.exit(1);
    });
  }
});