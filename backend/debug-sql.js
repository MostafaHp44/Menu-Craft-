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
    
    // Try inserting a test user
    try {
      const result = await pool.request().query(`
        BEGIN TRY
          INSERT INTO Users (id, name, email, password_hash, role, restaurant_id, status, created_at) VALUES 
            (NEWID(), 'Test Client', 'test@client.com', 'hashed_password', 'client', NULL, 'active', GETDATE());
          SELECT 'SUCCESS' AS Result;
        END TRY
        BEGIN CATCH
          SELECT 
            ERROR_NUMBER() AS ErrorNumber,
            ERROR_MESSAGE() AS ErrorMessage;
        END CATCH
      `);
      console.log('\\n📋 نتيجة查询:');
      result.recordset.forEach(r => console.log('  -', r));
    } catch (err) {
      console.error('\\n❌ خطأ:', err.message);
    }
    
    sql.close();
  } catch (err) {
    console.error('❌ اتصالfailed:', err.message);
  }
}

main();