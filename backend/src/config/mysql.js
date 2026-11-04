
const mysql = require('mysql2/promise');

let pool;

function getMySQLPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: '',
      database: 'menucraft_mysql',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: 'utf8mb4',
      timezone: 'Z'
    });
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

module.exports = { getMySQLPool, testMySQLConnection };
