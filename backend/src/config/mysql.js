const mysql = require('mysql2/promise');
// In development, `.env` must win over stale shell-level DB_* variables.
// In production, the real environment is authoritative and `.env` is ignored.
const isProduction = process.env.NODE_ENV === 'production';
require('dotenv').config({ override: !isProduction });

/**
 * MariaDB pool — credentials come only from the environment.
 * There are deliberately no `root` / empty-password fallbacks here:
 * the service must run as a least-privilege application user.
 */
const REQUIRED_ENV = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];

function readDbConfig() {
  const missing = REQUIRED_ENV.filter((name) => {
    const value = process.env[name];
    return value === undefined || String(value).trim() === '';
  });
  if (missing.length) {
    throw new Error(`Missing required database environment variables: ${missing.join(', ')}`);
  }

  const config = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_POOL_SIZE, 10) || 10,
    queueLimit: 0,
    charset: 'utf8mb4',
    timezone: 'Z'
  };

  if (['root', 'sa', 'admin'].includes(String(config.user).toLowerCase())) {
    if (isProduction) {
      throw new Error('DB_USER must be a least-privilege application user, not a database administrator');
    }
    console.warn(`WARNING: DB_USER "${config.user}" is a privileged account; use a least-privilege user instead.`);
  }

  return config;
}

let pool;

function getMySQLPool() {
  if (!pool) {
    pool = mysql.createPool(readDbConfig());
  }
  return pool;
}

async function testMySQLConnection() {
  const connection = await getMySQLPool().getConnection();

  try {
    const [rows] = await connection.query(
      'SELECT DATABASE() AS databaseName, VERSION() AS version'
    );

    console.log('✅ MySQL connected:', rows[0]);
    return rows[0];
  } finally {
    connection.release();
  }
}

module.exports = { getMySQLPool, testMySQLConnection, readDbConfig };
