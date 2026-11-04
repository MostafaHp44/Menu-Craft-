require('dotenv').config();
const fastify = require('./app');
const { initRedis, closeRedis } = require('./middleware/rateLimiter');
const healthRoutes = require('./routes/health.routes');
const PORT = parseInt(process.env.PORT) || 3000;

async function startServer() {
  // Initialize Redis â€” this will fail startup in production if config is missing
  // or if Redis cannot connect. In development, it may fall back to in-memory.
  try {
    await initRedis({});
  } catch (err) {
    // Initialization failure in production already calls process.exit(1) inside initRedis
    // If we get here, it's a non-fatal error; retry or exit
    fastify.log.error({ err }, 'Redis initialization failed');
    process.exit(1);
  }

  // Register health check routes (after Redis init, before listening)
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
      await closeRedis();
      fastify.log.info('Redis connection closed');
    } catch (err) {
      fastify.log.warn({ err }, 'Redis close warning (non-fatal)');
    }

    // 3. Close SQL Server connection pool
    // Clear the pool promise to allow garbage collection and prevent new connections
    try {
      const { getPool } = require('./config/db');
      await getPool().then(() => {}).catch(() => {}); // drain pending operations
      fastify.log.info('SQL Server pool cleared');
    } catch (err) {
      fastify.log.warn('SQL Server close warning (non-fatal):', err.message);
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