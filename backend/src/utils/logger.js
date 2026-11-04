const pino = require('pino');

const isDevelopment = process.env.NODE_ENV !== 'production';

/**
 * Generate a simple trace ID (6-character random hex).
 * In production, would use a proper distributed tracing system.
 */
function generateTraceId() {
  return Math.random().toString(16).substr(2, 6);
}

/**
 * Create a pino logger instance with structured logs.
 * - Includes trace ID for request correlation
 * - Masks sensitive data in production
 * - Different format for development vs production
 * 
 * @param {object} options - Optional configuration
 * @param {string} options.service - Service name (defaults to 'menucraft')
 * @returns {object} Pino logger instance
 */
function createLogger(options = {}) {
  const service = options.service || 'menucraft';
  const level = isDevelopment ? 'debug' : 'info';

  // pino mixin expects a function, provide a no-op mixin function
  const mixinFn = (obj) => { obj.service = service; return obj; };

  // pino uses { mixin: function } syntax, not object
  const logger = pino({ level, mixin: mixinFn });

  /**
   * Log an API request with structured data.
   * Never logs passwords, tokens, or sensitive customer data.
   * Includes trace ID for request correlation.
   * 
   * @param {object} request - Fastify request
   * @param {object} response - Fastify response (optional)
   * @param {string} operation - Description of the operation
   */
  logger.logRequest = function (request, response, operation) {
    const traceId = generateTraceId();
    const data = {
      traceId,
      service,
      operation,
      method: request.method,
      url: request.url,
      ip: request.ip,
      userAgent: request.headers['user-agent'] || '',
      status: response ? response.statusCode : null,
      duration: request.duration || null
    };

    if (isDevelopment) {
      data.params = request.params || {};
      data.query = request.query || {};
      if (request.body && Object.keys(request.body).length > 0) {
        data.body = this.sanitizeBody(request.body);
      }
    }

    this.info({ request: data }, `${operation} request completed`);
  };

  /**
   * Sanitize request body - remove sensitive fields.
   * Only includes safe fields for development debugging.
   * 
   * @param {object} body - Request body
   * @returns {object} Sanitized body
   */
  logger.sanitizeBody = function (body) {
    const safe = { ...body };
    const sensitiveFields = ['password', 'password_hash', 'token', 'refresh_token', 
      'ssn', 'credit_card', 'cvv', 'api_key', 'secret'];
    for (const field of sensitiveFields) {
      if (safe[field]) {
        safe[field] = '[REDACTED]';
      }
    }
    return safe;
  };

  /**
   * Log an error with full context but mask sensitive data.
   * 
   * @param {object} err - Error object
   * @param {object} request - Fastify request (optional)
   * @param {object} response - Fastify response (optional)
   * @param {string} operation - Description of the operation
   */
  logger.logError = function (err, request, response, operation) {
    const traceId = generateTraceId();
    const data = {
      traceId,
      service,
      operation,
      message: err.message,
      status: response ? response.statusCode : null,
      ip: request ? request.ip : null,
      method: request ? request.method : null,
      url: request ? request.url : null
    };

    if (isDevelopment) {
      data.stack = err.stack;
      this.error({ error: data }, `${operation} error occurred`);
    } else {
      this.error({ error: data }, `${operation} error occurred`);
    }
  };

  return logger;
}

module.exports = { createLogger, isDevelopment, generateTraceId };