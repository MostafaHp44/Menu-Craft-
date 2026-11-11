/**
 * MenuCraft — DB seed helper (additive only, no deletes/updates of existing rows)
 * 1) Roles (needed for restaurantemployees.role_id + FK)
 * 2) Plans (shown on the subscription tab — replaces the fake local demo plans)
 * 3) Super admin account (for متابعة سير العمليات)
 *
 * Safe to re-run: uses INSERT ... WHERE NOT EXISTS / INSERT IGNORE semantics.
 */
const { getMySQLPool } = require('./src/config/mysql');
const { hashPassword } = require('./src/utils/hash');

(async () => {
  const pool = await getMySQLPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // ---------- 1) Roles (the fixed GUIDs referenced by employee.service) ----------
    console.log('--- roles ---');
    const roles = [
      ['0C12105B-209A-485D-B8EB-0C0067BDFA4F', 'owner'],
      ['04F15493-332D-4BF0-9E3D-2B3CE757E7E3', 'cashier'],
      ['12BC9C57-A6E5-4424-9A99-6A46A6DB291F', 'kitchen'],
      ['489BBCFF-AC73-4163-85EB-57D7108C3F5F', 'waiter'],
    ];
    for (const [id, name] of roles) {
      await conn.execute(
        'INSERT INTO roles (id, name, is_active, created_at) SELECT ?, ?, 1, NOW() FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM roles WHERE id = ? OR name = ?)',
        [id, name, id, name]
      );
    }
    const [roleRows] = await conn.execute('SELECT id, name FROM roles');
    console.log('roles now:', JSON.stringify(roleRows));

    // ---------- 2) Plans (6 باقات: 3 live + 3 static) ----------
    console.log('--- plans ---');
    const plans = [
      {
        id: 'plan-starter',
        name: 'Starter',
        price: 0,
        currency: 'USD',
        interval_type: 'forever',
        mode: 'static',
        max_restaurants: 5,
        max_menu_items: 15,
        features: [
          'Up to 5 restaurant websites',
          'Up to 15 menu items',
          'All 8 templates included',
          'QR code generator',
        ],
        is_active: 1,
      },
      {
        id: 'plan-static-plus',
        name: 'Static Plus',
        price: 12,
        currency: 'USD',
        interval_type: 'month',
        mode: 'static',
        max_restaurants: 10,
        max_menu_items: -1,
        features: [
          'Up to 10 restaurant websites',
          'Unlimited menu items',
          'All 8 templates included',
          'Remove Digital Menu badge',
          'Photo gallery & featured dishes',
          'QR code generator',
        ],
        is_active: 1,
      },
      {
        id: 'plan-static-studio',
        name: 'Static Studio',
        price: 24,
        currency: 'USD',
        interval_type: 'month',
        mode: 'static',
        max_restaurants: -1,
        max_menu_items: -1,
        features: [
          'Everything in Static Plus',
          'Unlimited restaurant websites',
          'Shared brand kit across locations',
          'Priority template releases',
          'Priority support',
        ],
        is_active: 1,
      },
      {
        id: 'plan-live-basic',
        name: 'Live Basic',
        price: 19,
        currency: 'USD',
        interval_type: 'month',
        mode: 'live',
        max_restaurants: 1,
        max_menu_items: -1,
        features: [
          '1 restaurant website with live ordering',
          'Unlimited menu items',
          'QR ordering at the table',
          'Cash & card payment methods',
          'Order tracking page',
          'Email support',
        ],
        is_active: 1,
      },
      {
        id: 'plan-professional',
        name: 'Professional',
        price: 29,
        currency: 'USD',
        interval_type: 'month',
        mode: 'live',
        max_restaurants: 3,
        max_menu_items: -1,
        features: [
          'Up to 3 restaurant websites',
          'Unlimited menu items',
          'Full design studio: fonts, colors, layout',
          'Remove Digital Menu badge',
          'Photo gallery & featured dishes',
          'Priority template releases',
        ],
        is_active: 1,
      },
      {
        id: 'plan-business',
        name: 'Business',
        price: 79,
        currency: 'USD',
        interval_type: 'month',
        mode: 'live',
        max_restaurants: -1,
        max_menu_items: -1,
        features: [
          'Everything in Professional',
          'Unlimited restaurant sites',
          'Custom subdomain (simulated)',
          'Shared brand kit across locations',
          'Team seats (demo)',
          'Priority support',
        ],
        is_active: 1,
      },
    ];
    // عمود mode (live/static) — يُضاف إن لم يكن موجوداً (استضافة جديدة)
    const [planCols] = await conn.execute("SHOW COLUMNS FROM plans LIKE 'mode'");
    if (!planCols.length) {
      await conn.execute("ALTER TABLE plans ADD COLUMN mode VARCHAR(10) NOT NULL DEFAULT 'live' AFTER name");
    }
    for (const p of plans) {
      await conn.execute(
        'INSERT INTO plans (id, name, mode, price, currency, interval_type, max_restaurants, max_menu_items, features, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW()) ON DUPLICATE KEY UPDATE name=VALUES(name), mode=VALUES(mode), price=VALUES(price), interval_type=VALUES(interval_type), max_restaurants=VALUES(max_restaurants), max_menu_items=VALUES(max_menu_items), features=VALUES(features), is_active=VALUES(is_active)',
        [p.id, p.name, p.mode, p.price, p.currency, p.interval_type, p.max_restaurants, p.max_menu_items, JSON.stringify(p.features), p.is_active]
      );
    }
    const [planRows] = await conn.execute('SELECT id, name, mode, price, interval_type, is_active FROM plans ORDER BY price ASC');
    console.log('plans now:', JSON.stringify(planRows));

    // ---------- 3) Super admin ----------
    console.log('--- super admin ---');
    const email = 'superadmin@menucraft.com';
    const password = 'MenuSuper#2026';
    const [existingUsers] = await conn.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length === 0) {
      const pw = await hashPassword(password);
      await conn.execute(
        "INSERT INTO users (id, name, email, password_hash, role, restaurant_id, status, created_at) VALUES (?, ?, ?, ?, 'super_admin', NULL, 'active', NOW())",
        ['usr-super-admin-001', 'Super Admin', email, pw]
      );
      console.log('super admin created:', email);
    } else {
      console.log('super admin already exists:', email);
    }

    await conn.commit();
    console.log('SEED_DONE');
  } catch (e) {
    try { await conn.rollback(); } catch (_) {}
    console.error('SEED_FAILED', e);
    process.exitCode = 1;
  } finally {
    conn.release();
  }
  process.exit(process.exitCode ?? 0);
})();
