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

async function tableExists(pool, tableName) {
  try {
    const result = await pool.request().query(`
      SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = N'${tableName}' AND TABLE_TYPE = N'BASE TABLE'
    `);
    return result.recordset[0].cnt > 0;
  } catch (e) {
    return false;
  }
}

async function main() {
  try {
    const pool = await sql.connect(config);
    console.log('✅ Connected to SQL Server');
    
    // Switch to menucraft_docker
    await pool.request().query('USE menucraft_docker');
    
    // Check existing tables
    const existing = await tableExists(pool, 'Users') +
                     await tableExists(pool, 'Restaurants') +
                     await tableExists(pool, 'Subscriptions') +
                     await tableExists(pool, 'Plans') +
                     await tableExists(pool, 'Payments');
    console.log('ℹ️ Existing tables count: ', existing, '/5');
    
    // 1. Create Users table if not exists
    if (!(await tableExists(pool, 'Users'))) {
      await pool.request().query(`
        CREATE TABLE Users (
          id NVARCHAR(100) PRIMARY KEY,
          name NVARCHAR(100) NOT NULL,
          email NVARCHAR(100) UNIQUE NOT NULL,
          password_hash NVARCHAR(255) NOT NULL,
          role NVARCHAR(50),
          restaurant_id NVARCHAR(100),
          status NVARCHAR(50) DEFAULT 'active',
          created_at DATETIME DEFAULT GETDATE()
        )
      `);
      console.log('✅ Users table created');
    } else {
      console.log('ℹ️ Users table already exists');
    }
    
    // 2. Create Restaurants table
    if (!(await tableExists(pool, 'Restaurants'))) {
      await pool.request().query(`
        CREATE TABLE Restaurants (
          id NVARCHAR(100) PRIMARY KEY,
          name_en NVARCHAR(100) NOT NULL,
          slug NVARCHAR(100) UNIQUE NOT NULL,
          status NVARCHAR(50) DEFAULT 'draft',
          [plan] NVARCHAR(50) DEFAULT 'trial',
          site_lang NVARCHAR(10) DEFAULT 'ar',
          template_id NVARCHAR(50) DEFAULT 'bella-italia',
          created_at DATETIME DEFAULT GETDATE(),
          updated_at DATETIME DEFAULT GETDATE()
        )
      `);
      console.log('✅ Restaurants table created');
    } else {
      console.log('ℹ️ Restaurants table already exists');
    }
    
    // 3. Create Subscriptions table
    if (!(await tableExists(pool, 'Subscriptions'))) {
      await pool.request().query(`
        CREATE TABLE Subscriptions (
          id NVARCHAR(100) PRIMARY KEY,
          restaurant_id NVARCHAR(100) UNIQUE NOT NULL,
          [plan] NVARCHAR(50) NOT NULL,
          price DECIMAL(10,2) DEFAULT 0,
          status NVARCHAR(50) DEFAULT 'active',
          started_at DATETIME DEFAULT GETDATE(),
          renews_at DATETIME NOT NULL,
          auto_renew BIT DEFAULT 1,
          created_at DATETIME DEFAULT GETDATE()
        )
      `);
      console.log('✅ Subscriptions table created');
    } else {
      console.log('ℹ️ Subscriptions table already exists');
    }
    
    // 5. Create Orders table
    if (!(await tableExists(pool, 'Orders'))) {
      await pool.request().query(`
        CREATE TABLE Orders (
          id NVARCHAR(100) PRIMARY KEY,
          restaurant_id NVARCHAR(100) NOT NULL,
          customer_name NVARCHAR(100),
          customer_phone NVARCHAR(50),
          delivery_address NVARCHAR(255),
          total_amount DECIMAL(10,2) DEFAULT 0,
          status NVARCHAR(50) DEFAULT 'pending',
          payment_method NVARCHAR(50) DEFAULT 'cash',
          payment_status NVARCHAR(50) DEFAULT 'pending',
          notes NVARCHAR(MAX),
          created_at DATETIME DEFAULT GETDATE(),
          updated_at DATETIME DEFAULT GETDATE()
        )
      `);
      console.log('✅ Orders table created');
    } else {
      console.log('ℹ️ Orders table already exists');
    }

    // 6. Create OrderItems table
    if (!(await tableExists(pool, 'OrderItems'))) {
      await pool.request().query(`
        CREATE TABLE OrderItems (
          id NVARCHAR(100) PRIMARY KEY,
          order_id NVARCHAR(100) NOT NULL,
          item_name NVARCHAR(100) NOT NULL,
          item_price DECIMAL(10,2) NOT NULL,
          quantity INT DEFAULT 1,
          extras NVARCHAR(MAX),
          FOREIGN KEY (order_id) REFERENCES Orders(id) ON DELETE CASCADE
        )
      `);
      console.log('✅ OrderItems table created');
    } else {
      console.log('ℹ️ OrderItems table already exists');
    }

    // 4. Create Plans table
    if (!(await tableExists(pool, 'Plans'))) {
      await pool.request().query(`
        CREATE TABLE Plans (
          id NVARCHAR(100) PRIMARY KEY,
          name NVARCHAR(50) NOT NULL,
          price DECIMAL(10,2) NOT NULL,
          period NVARCHAR(20) NOT NULL DEFAULT 'month',
          max_menu_items INT DEFAULT -1,
          max_restaurants INT DEFAULT 1,
          features NVARCHAR(MAX),
          is_active BIT DEFAULT 1,
          created_at DATETIME DEFAULT GETDATE()
        )
      `);
      console.log('✅ Plans table created');
      
      // Insert default plans
      await pool.request().query("INSERT INTO Plans (id, name, price, period, max_menu_items, max_restaurants, features, is_active) VALUES ('starter', 'Starter', 0, 'forever', 15, 1, '1 restaurant website, Up to 15 menu items, QR code generator', 1)");
      await pool.request().query("INSERT INTO Plans (id, name, price, period, max_menu_items, max_restaurants, features, is_active) VALUES ('professional', 'Professional', 29, 'per month', -1, 1, 'Unlimited menu items, Full design studio, QR scan tracking', 1)");
      await pool.request().query("INSERT INTO Plans (id, name, price, period, max_menu_items, max_restaurants, features, is_active) VALUES ('business', 'Business', 79, 'per month', -1, 10, 'Everything in Professional, Up to 10 restaurant sites', 1)");
      console.log('✅ Plans table created and default plans inserted');
    } else {
      console.log('ℹ️ Plans table already exists');
    }
    
    // 5. Create Payments table
    if (!(await tableExists(pool, 'Payments'))) {
      await pool.request().query(`
        CREATE TABLE Payments (
          id NVARCHAR(100) PRIMARY KEY,
          restaurant_id NVARCHAR(100) NOT NULL,
          stripe_payment_id NVARCHAR(100),
          amount DECIMAL(10,2) NOT NULL,
          currency NVARCHAR(3) DEFAULT 'USD',
          status NVARCHAR(50) DEFAULT 'pending',
          payment_method NVARCHAR(50),
          created_at DATETIME DEFAULT GETDATE()
        )
      `);
      console.log('✅ Payments table created');
    } else {
      console.log('ℹ️ Payments table already exists');
    }
    
    // Verify all tables
    const tables = await pool.request().query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME");
    
    console.log('\n📋 Final tables in menucraft_docker:');
    tables.recordset.forEach(t => console.log('  -', t.TABLE_NAME));
    console.log('Total:', tables.recordset.length);
    
    sql.close();
    console.log('\n✅ Migration completed successfully!');
    console.log('Now you can signup as a client!');
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

main();