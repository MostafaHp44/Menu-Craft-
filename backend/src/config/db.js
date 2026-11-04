const sql = require('mssql');
require('dotenv').config();

const config = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'YourStrong@Passw0rd',
  database: process.env.DB_NAME || 'menucraft',
  server: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 1433,
  pool: {
    max: 10,      // أكبر عدد اتصالات مفتوحة في نفس الوقت
    min: 2,       // أقل عدد اتصالات جاهزة
    idleTimeoutMillis: 30000,
    acquireTimeoutMillis: 30000
  },
  options: {
    encrypt: false,                 // اجعل true لو قاعدة البيانات على Azure/SQL Server مع SSL
    trustServerCertificate: true
  }
};

let poolPromise = null;

function getPool() {
  if (!poolPromise) {
    poolPromise = sql.connect(config)
      .then(pool => {
        console.log('✅ MSSQL connected (pool ready)');
        return pool;
      })
      .catch(err => {
        console.error('❌ MSSQL connection error:', err.message);
        poolPromise = null; // إعادة المحاولة لاحقًا لو فشل الاتصال
        throw err;
      });
  }
  return poolPromise;
}

module.exports = { sql, getPool };
