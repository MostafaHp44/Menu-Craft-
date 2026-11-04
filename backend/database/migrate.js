/**
 * MenuCraft — Database migrations (non-destructive, idempotent)
 * ------------------------------------------------------------
 * يطوّر قاعدة البيانات live (menucraft_docker أو أي اسم في DB_NAME) إلى الـ schema
 * الذي تتطلبه خدمات الـ Backend، دون حذف أي بيانات موجودة.
 *
 * الاستخدام:  npm run migrate      (من مجلد backend)
 * أو:         node database/migrate.js
 *
 * القواعد:
 *  - كل خطوة تفحص وجود العمود/الجدول أولاً (COL_LENGTH / OBJECT_ID) فلا تُنفَّذ مرتين.
 *  - لا حذف أعمدة ولا جداول ولا بيانات حقيقية.
 *  - كل عمود جديد قابل للقيمة الافتراضية ويقبل القيمة NULL لحماية الصفوف القديمة.
 */
const sql = require('mssql');

require('dotenv').config();

const config = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'YourStrong@Passw0rd',
  database: process.env.DB_NAME || 'menucraft_docker',
  server: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  options: { encrypt: false, trustServerCertificate: true }
};

const applied = [];
const skipped = [];

async function columnExists(pool, table, column) {
  const r = await pool.request()
    .input('table', sql.NVarChar, table)
    .input('column', sql.NVarChar, column)
    .query(`SELECT COL_LENGTH(@table, @column) AS len`);
  return r.recordset[0].len !== null;
}

/** هل العمود من نوع NVARCHAR؟ (يُستخدم لمطابقة أنواع الأعمدة قبل القيود الخارجية) */
async function columnIsNvarchar(pool, table, column) {
  const r = await pool.request()
    .input('table', sql.NVarChar, table)
    .input('column', sql.NVarChar, column)
    .query(`
      SELECT CASE WHEN ty.name = 'nvarchar' THEN 1 ELSE 0 END AS isN
      FROM sys.columns c
      JOIN sys.tables t ON c.object_id = t.object_id
      JOIN sys.types ty ON c.user_type_id = ty.user_type_id
      WHERE t.name = @table AND c.name = @column
    `);
  return Boolean(r.recordset[0]?.isN);
}

async function tableExists(pool, table) {
  const r = await pool.request()
    .input('table', sql.NVarChar, table)
    .query(`SELECT OBJECT_ID(@table, 'U') AS oid`);
  return r.recordset[0].oid !== null;
}

async function indexExists(pool, indexName) {
  const r = await pool.request()
    .input('name', sql.NVarChar, indexName)
    .query(`SELECT OBJECT_ID(@name, 'IX') AS oid`);
  return r.recordset[0].oid !== null;
}

/** إضافة عمود إن لم يوجد */
async function addColumn(pool, table, column, definition, logName) {
  if (await columnExists(pool, table, column)) {
    skipped.push(logName || `${table}.${column}`);
    return false;
  }
  // نضع اسم العمود بين أقواس — أعمدة مثل `plan` أسماء محجوزة في T-SQL
  await pool.request().query(`ALTER TABLE [${table}] ADD [${column}] ${definition}`);
  applied.push(logName || `${table}.${column} (+${column})`);
  return true;
}

/** إنشاء جدول إن لم يوجد */
async function createTable(pool, table, tsql, logName) {
  if (await tableExists(pool, table)) {
    skipped.push(logName || table);
    return false;
  }
  await pool.request().query(tsql);
  applied.push(logName || `${table} (created)`);
  return true;
}

/**
 * إنشاء فهرس مشروطاً بوجود العمود/الأعمدة أولاً.
 * على قاعدة تم إنشاؤها بـ init.sql قد لا tồnصف بعض الأعمدة التي ينشئها هذا
 * الملف داخل كتل CREATE TABLE الخاصة به — الفهرسة عليها كانت تُفشل Migration.
 */
async function createIndexIfColumns(pool, indexName, table, columns, where) {
  for (const col of columns) {
    if (!(await columnExists(pool, table, col))) {
      skipped.push(`${indexName} (missing ${table}.${col})`);
      return false;
    }
  }
  const exists = await pool.request()
    .input('table', sql.NVarChar, table)
    .input('name', sql.NVarChar, indexName)
    .query(`SELECT OBJECT_ID(@table, 'U') AS oid FROM sys.indexes WHERE name = @name`);
  if (exists.recordset.length > 0) {
    skipped.push(indexName);
    return false;
  }
  const colList = columns.map((c) => `[${c}]`).join(', ');
  const whereClause = where ? ` WHERE ${where}` : '';
  await pool.request().query(
    `CREATE UNIQUE INDEX [${indexName}] ON [${table}](${colList})${whereClause}`
  );
  applied.push(`${indexName} (created)`);
  return true;
}

async function run() {
  const pool = await sql.connect(config);
  console.log(`\n🔧 MenuCraft migrations → ${config.database} @ ${config.server}:${config.port}\n`);

  /* ------------------------------------------------------------------ *
   * 1. Plans — توحيد الباقات: trial / professional / business
   * ------------------------------------------------------------------ */
  await addColumn(pool, 'Plans', 'currency', `NVARCHAR(10) DEFAULT 'USD'`);
  await addColumn(pool, 'Plans', 'interval_type', `NVARCHAR(20) DEFAULT 'month'`);
  await addColumn(pool, 'Plans', 'updated_at', `DATETIME DEFAULT GETDATE()`);
  // توحيد القيم القديمة من عمود period إلى interval_type (مرة واحدة فقط).
  // عمود period غير موجود في السكيما الافتراضية (init.sql) — نفحصه أولاً حتى
  // لا يُفشل Migration على قاعدة نظيفة.
  const hasPeriod = await columnExists(pool, 'Plans', 'period');
  if (hasPeriod) {
    await pool.request().query(`
      UPDATE Plans SET interval_type = CASE
        WHEN LOWER(ISNULL(period, '')) LIKE '%month%' THEN 'month'
        WHEN LOWER(ISNULL(period, '')) LIKE '%year%' THEN 'year'
        WHEN LOWER(ISNULL(period, '')) LIKE '%forever%' THEN 'forever'
        ELSE 'month' END
      WHERE interval_type IS NULL AND period IS NOT NULL
    `);
  }

  /* ------------------------------------------------------------------ *
   * 2. Restaurants — أعمدة الموقع الكاملة (تصميم/منيو/تواصل/إعدادات الطلب)
   * ------------------------------------------------------------------ */
  const restaurantCols = [
    ['name_ar', 'NVARCHAR(200)'],
    ['name_ku', 'NVARCHAR(200)'],
    ['tagline_en', 'NVARCHAR(500)'],
    ['tagline_ar', 'NVARCHAR(500)'],
    ['tagline_ku', 'NVARCHAR(500)'],
    ['description_en', 'NVARCHAR(MAX)'],
    ['description_ar', 'NVARCHAR(MAX)'],
    ['description_ku', 'NVARCHAR(MAX)'],
    ['logoText_en', 'NVARCHAR(200)'],
    ['logoText_ar', 'NVARCHAR(200)'],
    ['logoText_ku', 'NVARCHAR(200)'],
    ['logoStyle', "NVARCHAR(50) DEFAULT 'monogram'"],
    ['heroImage', 'NVARCHAR(500)'],
    ['heroVideo', 'NVARCHAR(500)'],
    ['gallery', 'NVARCHAR(MAX)'],
    ['phone', 'NVARCHAR(50)'],
    ['email', 'NVARCHAR(255)'],
    ['address', 'NVARCHAR(500)'],
    ['hours', 'NVARCHAR(MAX)'],
    ['socials', 'NVARCHAR(MAX)'],
    ['templateId', 'NVARCHAR(100)'],
    ['design', 'NVARCHAR(MAX)'],
    ['menu', 'NVARCHAR(MAX)'],
    ['language', "NVARCHAR(10) DEFAULT 'en'"],
    ['stats', 'NVARCHAR(MAX)'],
    // إعدادات الطلب والدفع لكل موقع (Payment Methods + Delivery/Pickup)
    ['ordering', 'NVARCHAR(MAX)']
  ];
  for (const [col, def] of restaurantCols) {
    await addColumn(pool, 'Restaurants', col, def);
  }
  // ترحيل template_id القديم إلى templateId
  if (await columnExists(pool, 'Restaurants', 'template_id')) {
    await pool.request().query(`
      UPDATE Restaurants SET templateId = template_id
      WHERE (templateId IS NULL OR templateId = '') AND template_id IS NOT NULL
    `);
  }

  /* ------------------------------------------------------------------ *
   * 3. Subscriptions — اشتراك على مستوى الحساب (user_id) + مرجع الباقة
   * ------------------------------------------------------------------ */
  await addColumn(pool, 'Subscriptions', 'plan_id', 'NVARCHAR(100)');
  await addColumn(pool, 'Subscriptions', 'plan_name', 'NVARCHAR(100)');
  await addColumn(pool, 'Subscriptions', 'user_id', 'NVARCHAR(100)');
  // عمود [plan] القديم تختاره خدمات Backend (site.service) كـ legacy_plan في استعلاماتها،
  // لذا نضيفه إن لم يوجد حتى لا تفشل بـ "Invalid column name 'plan'" على قاعدة نظيفة.
  await addColumn(pool, 'Subscriptions', 'plan', 'NVARCHAR(100)');
  // عمود [plan] القديم غير موجود في السكيما الافتراضية — نفحصه قبل الترحيل
  if (await columnExists(pool, 'Subscriptions', 'plan')) {
    await pool.request().query(`
      UPDATE Subscriptions SET plan_name = [plan] WHERE (plan_name IS NULL OR plan_name = '')
    `);
  }
  await pool.request().query(`
    UPDATE s SET plan_id = p.id
    FROM Subscriptions s
    JOIN Plans p ON LOWER(p.name) = LOWER(s.plan_name)
    WHERE s.plan_id IS NULL
  `);

  /* ------------------------------------------------------------------ *
   * 4. UserRestaurants — علاقة متعدد المواقع: كل مستخدم ↔ مواقعه
   * ------------------------------------------------------------------ */
  // أنواع الأعمدة يجب أن تطابق Users.id / Restaurants.id (VARCHAR(100) في السكيما
  // الافتراضية) وإلا رفض SQL Server إنشاء القيود الخارجية.
  const userIdCol = (await columnIsNvarchar(pool, 'Users', 'id')) ? 'NVARCHAR(100)' : 'VARCHAR(100)';
  const restIdCol = (await columnIsNvarchar(pool, 'Restaurants', 'id')) ? 'NVARCHAR(100)' : 'VARCHAR(100)';
  await createTable(pool, 'UserRestaurants', `
    CREATE TABLE UserRestaurants (
      id NVARCHAR(100) PRIMARY KEY DEFAULT NEWID(),
      user_id ${userIdCol} NOT NULL,
      restaurant_id ${restIdCol} NOT NULL,
      is_owner BIT DEFAULT 1,
      created_at DATETIME DEFAULT GETDATE(),
      CONSTRAINT FK_UserRestaurants_Users FOREIGN KEY (user_id) REFERENCES Users(id),
      CONSTRAINT FK_UserRestaurants_Restaurants FOREIGN KEY (restaurant_id) REFERENCES Restaurants(id) ON DELETE CASCADE
    )
  `);
  // ترحيل العلاقة القديمة (Users.restaurant_id)
  await pool.request().query(`
    INSERT INTO UserRestaurants (user_id, restaurant_id, is_owner)
    SELECT u.id, u.restaurant_id, 1
    FROM Users u
    WHERE u.restaurant_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM UserRestaurants ur WHERE ur.user_id = u.id AND ur.restaurant_id = u.restaurant_id
      )
  `);
  await createIndexIfColumns(pool, 'UX_UserRestaurants_pair', 'UserRestaurants', ['user_id', 'restaurant_id']);

  /* ------------------------------------------------------------------ *
   * 5. MenuCategories / MenuItems — المنيو مخزّن في جداول (لا JSON فقط)
   * ------------------------------------------------------------------ */
  await createTable(pool, 'MenuCategories', `
    CREATE TABLE MenuCategories (
      id NVARCHAR(100) PRIMARY KEY DEFAULT NEWID(),
      restaurant_id NVARCHAR(100) NOT NULL,
      name_en NVARCHAR(200),
      name_ar NVARCHAR(200),
      name_ku NVARCHAR(200),
      note_en NVARCHAR(500),
      note_ar NVARCHAR(500),
      note_ku NVARCHAR(500),
      sort_order INT DEFAULT 0,
      CONSTRAINT FK_MenuCategories_Restaurants FOREIGN KEY (restaurant_id) REFERENCES Restaurants(id) ON DELETE CASCADE
    )
  `);
  await createTable(pool, 'MenuItems', `
    CREATE TABLE MenuItems (
      id NVARCHAR(100) PRIMARY KEY DEFAULT NEWID(),
      category_id NVARCHAR(100) NOT NULL,
      restaurant_id NVARCHAR(100) NULL,
      name_en NVARCHAR(200),
      name_ar NVARCHAR(200),
      name_ku NVARCHAR(200),
      description_en NVARCHAR(MAX),
      description_ar NVARCHAR(MAX),
      description_ku NVARCHAR(MAX),
      price DECIMAL(10, 2) NOT NULL DEFAULT 0,
      compare_at DECIMAL(10, 2) NULL,
      image NVARCHAR(500),
      featured BIT DEFAULT 0,
      popular BIT DEFAULT 0,
      available BIT DEFAULT 1,
      sort_order INT DEFAULT 0,
      -- مجموعات الاختيارات/الإضافات (الحجم، الإضافات...) كـ JSON
      options NVARCHAR(MAX) NULL,
      CONSTRAINT FK_MenuItems_Categories FOREIGN KEY (category_id) REFERENCES MenuCategories(id) ON DELETE CASCADE
    )
  `);

  /* ------------------------------------------------------------------ *
   * 6. Orders — طلبات المنيو العام (ضيف) + طلبات الكونتر
   * ------------------------------------------------------------------ */
  await createTable(pool, 'Orders', `
    CREATE TABLE Orders (
      id NVARCHAR(100) PRIMARY KEY DEFAULT NEWID(),
      restaurant_id NVARCHAR(100) NOT NULL,
      order_number INT NULL,
      channel NVARCHAR(50) DEFAULT 'online',
      table_no NVARCHAR(50) NULL,
      customer_name NVARCHAR(200),
      customer_phone NVARCHAR(50),
      customer_email NVARCHAR(255),
      fulfillment NVARCHAR(50) DEFAULT 'pickup',
      delivery_address NVARCHAR(500),
      note NVARCHAR(500),
      subtotal DECIMAL(10, 2) DEFAULT 0,
      delivery_fee DECIMAL(10, 2) DEFAULT 0,
      discount DECIMAL(10, 2) DEFAULT 0,
      total DECIMAL(10, 2) DEFAULT 0,
      currency NVARCHAR(10) DEFAULT 'USD',
      payment_method NVARCHAR(50),
      payment_status NVARCHAR(50) DEFAULT 'unpaid',
      status NVARCHAR(50) DEFAULT 'pending',
      -- رمز تتبع آمن للعميل الضيف (صفحة متابعة الطلب)
      order_token VARCHAR(64) NULL,
      -- مفتاح منع تكرار الطلب عند إعادة الإرسال/النقر المزدوج
      idempotency_key NVARCHAR(100) NULL,
      created_at DATETIME DEFAULT GETDATE(),
      updated_at DATETIME DEFAULT GETDATE(),
      CONSTRAINT FK_Orders_Restaurants FOREIGN KEY (restaurant_id) REFERENCES Restaurants(id)
    )
  `);
  await createIndexIfColumns(pool, 'UX_Orders_idempotency', 'Orders', ['idempotency_key'], 'idempotency_key IS NOT NULL');
  await createIndexIfColumns(pool, 'UX_Orders_token', 'Orders', ['order_token'], 'order_token IS NOT NULL');

  await createTable(pool, 'OrderLines', `
    CREATE TABLE OrderLines (
      id NVARCHAR(100) PRIMARY KEY DEFAULT NEWID(),
      order_id NVARCHAR(100) NOT NULL,
      item_id NVARCHAR(100),
      item_name NVARCHAR(200),
      price DECIMAL(10, 2),
      qty INT DEFAULT 1,
      -- الاختيارات/الإضافات المختارة (JSON)
      options NVARCHAR(MAX) NULL,
      CONSTRAINT FK_OrderLines_Orders FOREIGN KEY (order_id) REFERENCES Orders(id) ON DELETE CASCADE
    )
  `);

  /* ------------------------------------------------------------------ *
   * 7. Payments — ربط الدفع بالاشتراك أو بطلب مطعم
   * ------------------------------------------------------------------ */
  await addColumn(pool, 'Payments', 'subscription_id', 'NVARCHAR(100)');
  await addColumn(pool, 'Payments', 'order_id', 'NVARCHAR(100)');
  await addColumn(pool, 'Payments', 'user_id', 'NVARCHAR(100)');
  await addColumn(pool, 'Payments', 'updated_at', `DATETIME DEFAULT GETDATE()`);
  await createIndexIfColumns(pool, 'UX_Payments_intent', 'Payments', ['stripe_payment_id'], 'stripe_payment_id IS NOT NULL');

  /* ------------------------------------------------------------------ *
   * 8. Templates / HomeContent — لازمة لواجهات المنصة
   * ------------------------------------------------------------------ */
  await createTable(pool, 'Templates', `
    CREATE TABLE Templates (
      id NVARCHAR(100) PRIMARY KEY DEFAULT NEWID(),
      name NVARCHAR(150) NOT NULL,
      base_template_id NVARCHAR(100) NOT NULL,
      category NVARCHAR(100),
      is_active BIT NOT NULL DEFAULT 1,
      created_by NVARCHAR(100),
      created_at DATETIME DEFAULT GETDATE(),
      updated_at DATETIME DEFAULT GETDATE()
    )
  `);
  await createTable(pool, 'HomeContent', `
    CREATE TABLE HomeContent (
      id NVARCHAR(100) PRIMARY KEY DEFAULT NEWID(),
      lang NVARCHAR(10) NOT NULL UNIQUE,
      hero NVARCHAR(MAX),
      templates NVARCHAR(MAX),
      editor_showcase NVARCHAR(MAX),
      workflow NVARCHAR(MAX),
      highlights NVARCHAR(MAX),
      showcase NVARCHAR(MAX),
      pricing NVARCHAR(MAX),
      final_cta NVARCHAR(MAX),
      created_at DATETIME DEFAULT GETDATE(),
      updated_at DATETIME DEFAULT GETDATE()
    )
  `);

  /* ------------------------------------------------------------------ *
   * 9. الباقات الابتدائية وفق المواصفات الجديدة
   *    Free Trial (3 أيام · موقع واحد) · Professional $29 (3 مواقع) · Business $79 (بلا حد)
   * ------------------------------------------------------------------ */
  const plans = [
    {
      id: 'trial', name: 'Free Trial', price: 0, interval: 'trial', maxSites: 1,
      features: { trialDays: 3, maxSites: 1, unlimitedMenuItems: true, qrCode: true, removeBranding: false, gallery: true, featuredItems: true, templatePriority: false, brandKit: false, teamAccounts: false, prioritySupport: false }
    },
    {
      id: 'professional', name: 'Professional', price: 29, interval: 'month', maxSites: 3,
      features: { maxSites: 3, unlimitedMenuItems: true, customization: true, qrCode: true, removeBranding: true, gallery: true, featuredItems: true, templatePriority: true, brandKit: false, teamAccounts: false, prioritySupport: false }
    },
    {
      id: 'business', name: 'Business', price: 79, interval: 'month', maxSites: -1,
      features: { maxSites: -1, unlimitedMenuItems: true, customization: true, qrCode: true, removeBranding: true, gallery: true, featuredItems: true, templatePriority: true, brandKit: true, teamAccounts: true, prioritySupport: true }
    }
  ];
  for (const p of plans) {
    // نُطابق بالاسم أو بالمعرّف: الصفوف القديمة تحمل GUID تحت نفس الاسم
    const exists = await pool.request()
      .input('id', sql.VarChar, p.id)
      .input('name', sql.NVarChar, p.name)
      .query('SELECT id FROM Plans WHERE id = @id OR LOWER(name) = LOWER(@name)')
      .catch(() => ({ recordset: [] }));
    const featuresJson = JSON.stringify(p.features);
    if (exists.recordset && exists.recordset.length > 0) {
      const rowId = exists.recordset[0].id;
      await pool.request()
        .input('id', sql.VarChar, rowId)
        .input('name', sql.NVarChar, p.name)
        .input('price', sql.Decimal(10, 2), p.price)
        .input('interval', sql.NVarChar, p.interval)
        .input('maxSites', sql.Int, p.maxSites)
        .input('features', sql.NVarChar, featuresJson)
        .query(`UPDATE Plans SET name = @name, price = @price, interval_type = @interval${hasPeriod ? ', period = @interval' : ''},
                max_restaurants = @maxSites, max_menu_items = -1, features = @features, currency = 'USD',
                is_active = 1, updated_at = GETDATE() WHERE id = @id`);
      applied.push(`Plans[${p.id}] updated`);
    } else {
      await pool.request()
        .input('id', sql.VarChar, p.id)
        .input('name', sql.NVarChar, p.name)
        .input('price', sql.Decimal(10, 2), p.price)
        .input('interval', sql.NVarChar, p.interval)
        .input('maxSites', sql.Int, p.maxSites)
        .input('features', sql.NVarChar, featuresJson)
        .query(`INSERT INTO Plans (id, name, price, currency, interval_type,${hasPeriod ? ' period,' : ''} max_restaurants, max_menu_items, features, is_active)
                VALUES (@id, @name, @price, 'USD', @interval,${hasPeriod ? ' @interval,' : ''} @maxSites, -1, @features, 1)`);
      applied.push(`Plans[${p.id}] inserted`);
    }
  }
  // أي باقة قديمة أخرى تبقى موجودة لكن غير فعّالة حتى لا تُعرض كخطة سارية.
  // نستثني القالب الثلاثة بأسمائهم أيضاً لأن صفوفهم القديمة قد تحمل معرّفات GUID.
  await pool.request().query(`
    UPDATE Plans SET is_active = 0, updated_at = GETDATE()
    WHERE id NOT IN ('trial', 'professional', 'business')
      AND LOWER(name) NOT IN ('free trial', 'professional', 'business')
      AND is_active = 1
  `);

  /* ------------------------------ summary ------------------------------ */
  console.log('✅ Applied steps:');
  applied.forEach((s) => console.log('   + ' + s));
  if (skipped.length) {
    console.log(`\nℹ️  Already up-to-date (${skipped.length}): ${skipped.slice(0, 12).join(', ')}${skipped.length > 12 ? ' …' : ''}`);
  }
  console.log('\n🎉 Migration finished — no data was dropped.\n');
  await sql.close();
}

run().catch((err) => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
