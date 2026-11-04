const sql = require('mssql');

const config = {
  user: 'sa',
  password: 'YourStrong@Passw0rd',
  server: 'localhost',
  port: 1433,
  options: {
    trustServerCertificate: true
  }
};

async function main() {
  try {
    const pool = await sql.connect(config);
    console.log('✅ Connected to SQL Server');
    
    // Switch to menucraft_docker
    await pool.request().query('USE menucraft_docker');
    
    // Create Users table
    await pool.request().query(
      'CREATE TABLE IF NOT EXISTS Users (' +
      'id NVARCHAR(100) PRIMARY KEY,' +
      'name NVARCHAR(100) NOT NULL,' +
      'email NVARCHAR(100) UNIQUE NOT NULL,' +
      'password_hash NVARCHAR(255) NOT NULL,' +
      'role NVARCHAR(50),' +
      'restaurant_id NVARCHAR(100),' +
      'status NVARCHAR(50) DEFAULT CHAR(97),' + // 'a' = active char, but let's use string
      'created_at DATETIME DEFAULT GETDATE())'
    );
    
    console.log('✅ Users table created/verified');
    
    // Create Restaurants table
    await pool.request().query(
      'CREATE TABLE IF NOT EXISTS Restaurants (' +
      'id NVARCHAR(100) PRIMARY KEY,' +
      'name_en NVARCHAR(100) NOT NULL,' +
      'slug NVARCHAR(100) UNIQUE NOT NULL,' +
      'status NVARCHAR(50) DEFAULT CHAR(100),' + // 'd' = draft
      'plan NVARCHAR(50) DEFAULT CHAR(116),' + // 't' = trial
      'template_id NVARCHAR(50) DEFAULT CHAR(98),' + // 'b' = bella-italia
      'created_at DATETIME DEFAULT GETDATE(),' +
      'updated_at DATETIME DEFAULT GETDATE())'
    );
    
    console.log('✅ Restaurants table created/verified');
    
    // Verify tables
    const result = await pool.request().query(
      'SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = CHAR(66) + CHAR(65) + CHAR(83) + CHAR(84) + CHAR(32) + TABLE_TYPE ORDER BY TABLE_NAME)'
    );
    
    console.log('📋 Tables:');
    result.recordset.forEach(t => console.log('  -', t.TABLE_NAME));
    
    sql.close();
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

main();