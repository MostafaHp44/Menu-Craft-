-- ====================================================================
-- MenuCraft — MySQL / MariaDB 10.4 Schema Draft (Migration Target)
-- ====================================================================
-- Source references (read-only, no DB execution performed):
--   - backend/database/init.sql (MSSQL original schema)
--   - backend/database/migrate.js (idempotent migrations)
--   - NEON_PIXEL_REPORTS/backend/migrations/*.sql (Phase A.1–A.2)
--   - backend/src/services/*.js + routes/*.js (query patterns)
--
-- Decisions locked per project agreement:
--   - UUID string PKs preserved (no AUTO_INCREMENT)
--   - InnoDB engine, utf8mb4 charset/collation
--   - No destructive changes; rollback to MSSQL remains possible
--   - No seed data with fake passwords in this file
-- ====================================================================

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET FOREIGN_KEY_CHECKS = 0;

-- ====================================================================
-- ENGINE / CHARSET (MariaDB 10.4)
-- ====================================================================
-- Note: DEFAULT CHARSET=InnoDB DEFAULT COLLATE=utf8mb4_unicode_ci
-- applied per-table below.

-- ====================================================================
-- 1. Plans (confirmed: init.sql + migrate.js + service/plan.service.js)
-- ====================================================================
CREATE TABLE IF NOT EXISTS Plans (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  mode VARCHAR(10) NOT NULL DEFAULT 'live',
  price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  currency VARCHAR(10) DEFAULT 'USD',
  interval_type VARCHAR(20) DEFAULT 'month',
  max_restaurants INT DEFAULT 1,
  max_menu_items INT DEFAULT 15,
  features JSON DEFAULT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_plans_active (is_active),
  INDEX idx_plans_mode (mode)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6 باقات: 3 للوضع Live + 3 للوضع Static (الأسعار مؤقتة حتى المراجعة).
-- تُزرع أيضاً تلقائياً من backend/src/services/plan.service.js (ensurePlansReady).
INSERT IGNORE INTO Plans (id, name, mode, price, currency, interval_type, max_restaurants, max_menu_items, features, is_active) VALUES
  ('plan-starter',        'Starter',       'static', 0.00,  'USD', 'forever',  5,   15,  '["Up to 5 restaurant websites","Up to 15 menu items","All 8 templates included","QR code generator"]', 1),
  ('plan-static-plus',    'Static Plus',   'static', 12.00, 'USD', 'month',    10,  -1,  '["Up to 10 restaurant websites","Unlimited menu items","All 8 templates included","Remove Digital Menu badge","Photo gallery & featured dishes","QR code generator"]', 1),
  ('plan-static-studio',  'Static Studio', 'static', 24.00, 'USD', 'month',    -1,  -1,  '["Everything in Static Plus","Unlimited restaurant websites","Shared brand kit across locations","Priority template releases","Priority support"]', 1),
  ('plan-live-basic',     'Live Basic',    'live',   19.00, 'USD', 'month',    1,   -1,  '["1 restaurant website with live ordering","Unlimited menu items","QR ordering at the table","Cash & card payment methods","Order tracking page","Email support"]', 1),
  ('plan-professional',   'Professional',  'live',   29.00, 'USD', 'month',    3,   -1,  '["Up to 3 restaurant websites","Unlimited menu items","Full design studio: fonts, colors, layout","Remove Digital Menu badge","Photo gallery & featured dishes","Priority template releases"]', 1),
  ('plan-business',       'Business',      'live',   79.00, 'USD', 'month',    -1,  -1,  '["Everything in Professional","Unlimited restaurant sites","Custom subdomain (simulated)","Shared brand kit across locations","Team seats (demo)","Priority support"]', 1);

-- ====================================================================
-- 2. Restaurants (confirmed: init.sql + migrate.js + all restaurant refs)
-- ====================================================================
CREATE TABLE IF NOT EXISTS Restaurants (
  id VARCHAR(100) PRIMARY KEY,
  name_en VARCHAR(200) DEFAULT NULL,
  name_ar VARCHAR(200) DEFAULT NULL,
  name_ku VARCHAR(200) DEFAULT NULL,
  slug VARCHAR(200) NOT NULL UNIQUE,
  tagline_en VARCHAR(500) DEFAULT NULL,
  tagline_ar VARCHAR(500) DEFAULT NULL,
  tagline_ku VARCHAR(500) DEFAULT NULL,
  description_en TEXT DEFAULT NULL,
  description_ar TEXT DEFAULT NULL,
  description_ku TEXT DEFAULT NULL,
  logoText_en VARCHAR(200) DEFAULT NULL,
  logoText_ar VARCHAR(200) DEFAULT NULL,
  logoText_ku VARCHAR(200) DEFAULT NULL,
  logoStyle VARCHAR(50) DEFAULT 'monogram',
  heroImage VARCHAR(500) DEFAULT NULL,
  heroVideo VARCHAR(500) DEFAULT NULL,
  gallery JSON DEFAULT NULL,
  phone VARCHAR(50) DEFAULT NULL,
  email VARCHAR(255) DEFAULT NULL,
  address VARCHAR(500) DEFAULT NULL,
  hours JSON DEFAULT NULL,
  socials JSON DEFAULT NULL,
  templateId VARCHAR(100) DEFAULT NULL,
  design JSON DEFAULT NULL,
  menu JSON DEFAULT NULL,
  language VARCHAR(10) DEFAULT 'en',
  status VARCHAR(50) DEFAULT 'draft',
  plan VARCHAR(50) DEFAULT 'trial',
  mode VARCHAR(20) DEFAULT 'live' NOT NULL,
  stats JSON DEFAULT NULL,
  ordering JSON DEFAULT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_restaurants_slug (slug),
  INDEX idx_restaurants_status (status),
  INDEX idx_restaurants_template (templateId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 3. Users (confirmed: init.sql + auth.service.js + employee.service.js)
-- Note: restaurant_id links to UserRestaurants (multi-site model)
-- ====================================================================
CREATE TABLE IF NOT EXISTS Users (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(500) NOT NULL,
  role VARCHAR(50) DEFAULT 'client',
  restaurant_id VARCHAR(100) DEFAULT NULL,
  status VARCHAR(50) DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_restaurant (restaurant_id),
  INDEX idx_users_role (role),
  CONSTRAINT FK_Users_Restaurants FOREIGN KEY (restaurant_id) REFERENCES Restaurants(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 4. MenuCategories (confirmed: init.sql + menu.service.js + migrations)
-- ====================================================================
CREATE TABLE IF NOT EXISTS MenuCategories (
  id VARCHAR(100) PRIMARY KEY,
  restaurant_id VARCHAR(100) NOT NULL,
  name_en VARCHAR(200) DEFAULT NULL,
  name_ar VARCHAR(200) DEFAULT NULL,
  name_ku VARCHAR(200) DEFAULT NULL,
  note_en VARCHAR(500) DEFAULT NULL,
  note_ar VARCHAR(500) DEFAULT NULL,
  note_ku VARCHAR(500) DEFAULT NULL,
  source_lang VARCHAR(10) DEFAULT NULL,
  sort_order INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_menu_cat_restaurant (restaurant_id),
  INDEX idx_menu_cat_sort (sort_order),
  CONSTRAINT FK_MenuCategories_Restaurants FOREIGN KEY (restaurant_id) REFERENCES Restaurants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 5. MenuItems (confirmed: init.sql + menu.service.js + migrations)
-- Note: restaurant_id column added in Phase A migrations for direct lookup.
-- ====================================================================
CREATE TABLE IF NOT EXISTS MenuItems (
  id VARCHAR(100) PRIMARY KEY,
  category_id VARCHAR(100) NOT NULL,
  restaurant_id VARCHAR(100) DEFAULT NULL,
  name_en VARCHAR(200) DEFAULT NULL,
  name_ar VARCHAR(200) DEFAULT NULL,
  name_ku VARCHAR(200) DEFAULT NULL,
  description_en TEXT DEFAULT NULL,
  description_ar TEXT DEFAULT NULL,
  description_ku TEXT DEFAULT NULL,
  source_lang VARCHAR(10) DEFAULT NULL,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  compare_at DECIMAL(10, 2) DEFAULT NULL,
  image VARCHAR(500) DEFAULT NULL,
  featured TINYINT(1) DEFAULT 0,
  popular TINYINT(1) DEFAULT 0,
  available TINYINT(1) DEFAULT 1,
  sort_order INT DEFAULT 0,
  options JSON DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_menu_items_category (category_id),
  INDEX idx_menu_items_restaurant (restaurant_id),
  INDEX idx_menu_items_available (available),
  CONSTRAINT FK_MenuItems_Categories FOREIGN KEY (category_id) REFERENCES MenuCategories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 6. Branches (confirmed: NEON_PIXEL_REPORTS 001 + route/menu.routes.js + branch.service.js)
-- Must be created before Orders due to FK dependency.
-- ====================================================================
CREATE TABLE IF NOT EXISTS Branches (
  id VARCHAR(100) PRIMARY KEY,
  restaurant_id VARCHAR(100) NOT NULL,
  name VARCHAR(200) DEFAULT NULL,
  slug VARCHAR(200) DEFAULT NULL,
  address VARCHAR(500) DEFAULT NULL,
  phone VARCHAR(30) DEFAULT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  accepting_orders TINYINT(1) DEFAULT 1,
  opening_hours JSON DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_branches_restaurant (restaurant_id),
  INDEX idx_branches_active (is_active),
  CONSTRAINT FK_Branches_Restaurants FOREIGN KEY (restaurant_id) REFERENCES Restaurants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 7. Orders (confirmed: init.sql + migrate.js + order.service.js + NEON_PIXEL)
CREATE TABLE IF NOT EXISTS Orders (
  id VARCHAR(100) PRIMARY KEY,
  restaurant_id VARCHAR(100) NOT NULL,
  branch_id VARCHAR(100) DEFAULT NULL,
  order_number INT DEFAULT NULL,
  channel VARCHAR(50) DEFAULT 'online',
  table_no VARCHAR(50) DEFAULT NULL,
  customer_name VARCHAR(200) DEFAULT NULL,
  customer_phone VARCHAR(50) DEFAULT NULL,
  customer_email VARCHAR(255) DEFAULT NULL,
  fulfillment VARCHAR(50) DEFAULT 'pickup',
  delivery_address VARCHAR(500) DEFAULT NULL,
  note VARCHAR(500) DEFAULT NULL,
  subtotal DECIMAL(10, 2) DEFAULT 0.00,
  delivery_fee DECIMAL(10, 2) DEFAULT 0.00,
  discount DECIMAL(10, 2) DEFAULT 0.00,
  total DECIMAL(10, 2) DEFAULT 0.00,
  currency VARCHAR(10) DEFAULT 'USD',
  payment_method VARCHAR(50) DEFAULT NULL,
  payment_status VARCHAR(50) DEFAULT 'unpaid',
  status VARCHAR(50) DEFAULT 'pending',
  order_token VARCHAR(64) DEFAULT NULL,
  idempotency_key VARCHAR(100) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_orders_restaurant (restaurant_id),
  INDEX idx_orders_status (status),
  INDEX idx_orders_token (order_token),
  INDEX idx_orders_idempotency (idempotency_key),
  INDEX idx_orders_branch (branch_id),
  CONSTRAINT FK_Orders_Restaurants FOREIGN KEY (restaurant_id) REFERENCES Restaurants(id),
  CONSTRAINT FK_Orders_Branch FOREIGN KEY (branch_id) REFERENCES Branches(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 7. OrderLines (confirmed: init.sql + migrate.js + order.service.js)
-- ====================================================================
CREATE TABLE IF NOT EXISTS OrderLines (
  id VARCHAR(100) PRIMARY KEY,
  order_id VARCHAR(100) NOT NULL,
  item_id VARCHAR(100) DEFAULT NULL,
  item_name VARCHAR(200) DEFAULT NULL,
  price DECIMAL(10, 2) DEFAULT NULL,
  qty INT DEFAULT 1,
  options JSON DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_orderlines_order (order_id),
  INDEX idx_orderlines_item (item_id),
  CONSTRAINT FK_OrderLines_Orders FOREIGN KEY (order_id) REFERENCES Orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 8. Subscriptions (confirmed: init.sql + migrate.js + payment.service.js)
-- ====================================================================
CREATE TABLE IF NOT EXISTS Subscriptions (
  id VARCHAR(100) PRIMARY KEY,
  restaurant_id VARCHAR(100) NOT NULL,
  user_id VARCHAR(100) DEFAULT NULL,
  plan_id VARCHAR(100) DEFAULT NULL,
  plan_name VARCHAR(100) DEFAULT NULL,
  price DECIMAL(10, 2) DEFAULT 0.00,
  status VARCHAR(50) DEFAULT 'trialing',
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  renews_at DATETIME DEFAULT NULL,
  auto_renew TINYINT(1) DEFAULT 0,
  plan VARCHAR(100) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_subscriptions_restaurant (restaurant_id),
  INDEX idx_subscriptions_plan (plan_id),
  INDEX idx_subscriptions_user (user_id),
  CONSTRAINT FK_Subscriptions_Restaurants FOREIGN KEY (restaurant_id) REFERENCES Restaurants(id),
  CONSTRAINT FK_Subscriptions_Plans FOREIGN KEY (plan_id) REFERENCES Plans(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 9. Payments (confirmed: init.sql + migrate.js + payment.service.js)
-- ====================================================================
CREATE TABLE IF NOT EXISTS Payments (
  id VARCHAR(100) PRIMARY KEY,
  restaurant_id VARCHAR(100) NOT NULL,
  subscription_id VARCHAR(100) DEFAULT NULL,
  order_id VARCHAR(100) DEFAULT NULL,
  user_id VARCHAR(100) DEFAULT NULL,
  stripe_payment_id VARCHAR(200) DEFAULT NULL,
  amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  currency VARCHAR(10) DEFAULT 'USD',
  status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(50) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_payments_stripe (stripe_payment_id),
  INDEX idx_payments_restaurant (restaurant_id),
  INDEX idx_payments_subscription (subscription_id),
  INDEX idx_payments_order (order_id),
  CONSTRAINT FK_Payments_Restaurants FOREIGN KEY (restaurant_id) REFERENCES Restaurants(id),
  CONSTRAINT FK_Payments_Subscriptions FOREIGN KEY (subscription_id) REFERENCES Subscriptions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 10. Invoices (confirmed: init.sql; used by billing logic — not in services directly)
-- ====================================================================
CREATE TABLE IF NOT EXISTS Invoices (
  id VARCHAR(100) PRIMARY KEY,
  restaurant_id VARCHAR(100) NOT NULL,
  subscription_id VARCHAR(100) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  status VARCHAR(50) DEFAULT 'open',
  due_at DATETIME DEFAULT NULL,
  paid_at DATETIME DEFAULT NULL,
  stripe_invoice_id VARCHAR(200) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_invoices_subscription (subscription_id),
  INDEX idx_invoices_restaurant (restaurant_id),
  CONSTRAINT FK_Invoices_Restaurants FOREIGN KEY (restaurant_id) REFERENCES Restaurants(id),
  CONSTRAINT FK_Invoices_Subscriptions FOREIGN KEY (subscription_id) REFERENCES Subscriptions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 11. HomeContent (confirmed: init.sql + migrate.js + routes/homeVideo)
-- ====================================================================
CREATE TABLE IF NOT EXISTS HomeContent (
  id VARCHAR(100) PRIMARY KEY,
  lang VARCHAR(10) NOT NULL UNIQUE,
  hero JSON DEFAULT NULL,
  templates JSON DEFAULT NULL,
  editor_showcase JSON DEFAULT NULL,
  workflow JSON DEFAULT NULL,
  highlights JSON DEFAULT NULL,
  showcase JSON DEFAULT NULL,
  pricing JSON DEFAULT NULL,
  final_cta JSON DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_homecontent_lang (lang)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 12. Templates (confirmed: init.sql + migrate.js + service/template.service.js)
-- ====================================================================
CREATE TABLE IF NOT EXISTS Templates (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  base_template_id VARCHAR(100) NOT NULL,
  category VARCHAR(100) DEFAULT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_by VARCHAR(100) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_templates_active (is_active),
  INDEX idx_templates_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 13. DashboardThemes (confirmed: migrate.js + service/dashboardTheme.service.js)
-- Note: Not in init.sql; added by code/migrations.
-- ====================================================================
CREATE TABLE IF NOT EXISTS DashboardThemes (
  id VARCHAR(100) PRIMARY KEY,
  restaurant_id VARCHAR(100) NOT NULL UNIQUE,
  theme_json JSON DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_dashboard_themes_restaurant (restaurant_id),
  CONSTRAINT FK_DashboardThemes_Restaurants FOREIGN KEY (restaurant_id) REFERENCES Restaurants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 14. TemplateDrafts (confirmed: service/templateDraft.service.js + code patterns)
-- Note: Not explicitly in init.sql or migrate.js file list; inferred from service usage.
-- ====================================================================
CREATE TABLE IF NOT EXISTS TemplateDrafts (
  id VARCHAR(100) PRIMARY KEY,
  draft_token VARCHAR(100) NOT NULL UNIQUE,
  design_json JSON DEFAULT NULL,
  restaurant_name VARCHAR(200) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_template_drafts_token (draft_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 15. UserRestaurants (confirmed: migrate.js Phase A.1 + auth.service.js)
-- Note: Multi-site relationship (user ↔ restaurant ownership).
-- ====================================================================
CREATE TABLE IF NOT EXISTS UserRestaurants (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  restaurant_id VARCHAR(100) NOT NULL,
  is_owner TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_restaurants_user (user_id),
  INDEX idx_user_restaurants_restaurant (restaurant_id),
  INDEX UX_UserRestaurants_pair (user_id, restaurant_id),
  CONSTRAINT FK_UserRestaurants_Users FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
  CONSTRAINT FK_UserRestaurants_Restaurants FOREIGN KEY (restaurant_id) REFERENCES Restaurants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 17. Roles (confirmed: NEON_PIXEL_REPORTS 001 + employee.service.js patterns)
-- ====================================================================
CREATE TABLE IF NOT EXISTS Roles (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_roles_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 18. Employees (confirmed: NEON_PIXEL_REPORTS 003 + employee.service.js)
-- Note: Distinct from Users table; operational staff members.
-- ====================================================================
CREATE TABLE IF NOT EXISTS Employees (
  id VARCHAR(100) PRIMARY KEY,
  restaurant_id VARCHAR(100) NOT NULL,
  name VARCHAR(200) DEFAULT NULL,
  email VARCHAR(255) DEFAULT NULL,
  username VARCHAR(200) DEFAULT NULL,
  role VARCHAR(50) DEFAULT NULL,
  branch_access_type VARCHAR(20) DEFAULT 'none',
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_employees_restaurant (restaurant_id),
  INDEX idx_employees_email (email),
  INDEX idx_employees_active (is_active),
  CONSTRAINT FK_Employees_Restaurants FOREIGN KEY (restaurant_id) REFERENCES Restaurants(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 19. RestaurantEmployees (confirmed: NEON_PIXEL_REPORTS 001 + 003 + employee.service.js)
-- ====================================================================
CREATE TABLE IF NOT EXISTS RestaurantEmployees (
  id VARCHAR(100) PRIMARY KEY,
  restaurant_id VARCHAR(100) NOT NULL,
  user_id VARCHAR(100) NOT NULL,
  role_id VARCHAR(100) NOT NULL,
  branch_access_type VARCHAR(20) NOT NULL DEFAULT 'none',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  temporary_password_hash VARCHAR(500) DEFAULT NULL,
  invited_by VARCHAR(100) DEFAULT NULL,
  invited_at DATETIME DEFAULT NULL,
  activated_at DATETIME DEFAULT NULL,
  removed_at DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_re_user (user_id),
  INDEX idx_re_restaurant (restaurant_id),
  INDEX idx_re_role (role_id),
  INDEX idx_re_status (status),
  CONSTRAINT FK_RE_Restaurant FOREIGN KEY (restaurant_id) REFERENCES Restaurants(id),
  CONSTRAINT FK_RE_User FOREIGN KEY (user_id) REFERENCES Users(id),
  CONSTRAINT FK_RE_Role FOREIGN KEY (role_id) REFERENCES Roles(id),
  CONSTRAINT UQ_RE_Employee UNIQUE (restaurant_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 20. EmployeeBranchAccess (confirmed: NEON_PIXEL_REPORTS 001 + employee.service.js)
-- ====================================================================
CREATE TABLE IF NOT EXISTS EmployeeBranchAccess (
  id VARCHAR(100) PRIMARY KEY,
  restaurant_employee_id VARCHAR(100) NOT NULL,
  branch_id VARCHAR(100) NOT NULL,
  allowed TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_eba_employee (restaurant_employee_id),
  INDEX idx_eba_branch (branch_id),
  CONSTRAINT FK_EBA_Employee FOREIGN KEY (restaurant_employee_id) REFERENCES RestaurantEmployees(id) ON DELETE CASCADE,
  CONSTRAINT FK_EBA_Branch FOREIGN KEY (branch_id) REFERENCES Branches(id) ON DELETE CASCADE,
  CONSTRAINT UQ_EBA_EmployeeBranch UNIQUE (restaurant_employee_id, branch_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 21. EmployeeActivityLog (confirmed: NEON_PIXEL_REPORTS 001)
-- Note: user_id allows NULL (ON DELETE SET NULL) to preserve historical identity.
-- ====================================================================
CREATE TABLE IF NOT EXISTS EmployeeActivityLog (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id VARCHAR(100) DEFAULT NULL,
  restaurant_id VARCHAR(100) NOT NULL,
  branch_id VARCHAR(100) DEFAULT NULL,
  actor_name VARCHAR(120) DEFAULT NULL,
  actor_role VARCHAR(50) DEFAULT NULL,
  actor_snapshot_at DATETIME DEFAULT NULL,
  action VARCHAR(200) NOT NULL,
  details TEXT DEFAULT NULL,
  ip_address VARCHAR(50) DEFAULT NULL,
  user_agent VARCHAR(500) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_eal_user (user_id),
  INDEX idx_eal_restaurant (restaurant_id),
  INDEX idx_eal_branch (branch_id),
  INDEX idx_eal_created (created_at),
  CONSTRAINT FK_EAL_Employee FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE SET NULL,
  CONSTRAINT FK_EAL_Restaurant FOREIGN KEY (restaurant_id) REFERENCES Restaurants(id),
  CONSTRAINT FK_EAL_Branch FOREIGN KEY (branch_id) REFERENCES Branches(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 22. FreePlanRequests (confirmed: service/freePlanRequest.service.js)
-- ====================================================================
CREATE TABLE IF NOT EXISTS free_plan_requests (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  restaurant_id VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  admin_id VARCHAR(100) DEFAULT NULL,
  approved_at DATETIME DEFAULT NULL,
  rejection_reason TEXT DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_fpr_user (user_id),
  INDEX idx_fpr_restaurant (restaurant_id),
  INDEX idx_fpr_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 23. PaidSubscriptionRequests (confirmed: service/paidSubscriptionRequest.service.js)
-- ====================================================================
CREATE TABLE IF NOT EXISTS paid_subscription_requests (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  restaurant_id VARCHAR(100) NOT NULL,
  plan_id VARCHAR(100) DEFAULT NULL,
  plan_name VARCHAR(100) DEFAULT NULL,
  price DECIMAL(10, 2) DEFAULT 0.00,
  status VARCHAR(50) DEFAULT 'pending_payment',
  admin_id VARCHAR(100) DEFAULT NULL,
  activated_at DATETIME DEFAULT NULL,
  rejection_reason TEXT DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_psr_user (user_id),
  INDEX idx_psr_restaurant (restaurant_id),
  INDEX idx_psr_plan (plan_id),
  INDEX idx_psr_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ====================================================================
-- UNCERTAINTY / REVIEW NOTES (do not invent — verify before go-live)
-- ====================================================================
/*
UNCONFIRMED / NEED REVIEW:
--------------------------
1. TemplateDrafts.id: uses UUID() in service (new sql.Request(tx) with randomUUID()
   injected), but table might not exist in original MSSQL schema. Confirmed via code only.
2. DashboardThemes: exists in service/dashboardTheme.service.js and migrate.js patterns;
   not in init.sql. Confirmed presence in code, exact columns confirmed.
3. Employees restaurant_id foreign key: in employee.service.js, Employees table uses
   restaurant_id directly; relationship confirmed.
4. Roles table: confirmed in NEON_PIXEL_REPORTS 001 + employee service patterns.
5. Branches.accepting_orders: confirmed in NEON_PIXEL 002 + branch.service.js.
6. Orders.branch_id: confirmed in NEON_PIXEL 001; orders without branch remain NULL.
7. Subscriptions.plan: legacy column from MSSQL; kept for backward compatibility.
   Confirmed by migrate.js (updates Subscriptions SET plan_name = [plan]).
8. UserRestaurants.is_owner: confirmed by auth.service.js (is_owner bit) and migrate A.1.
9. EmployeeBranchAccess.allowed / unique pair: confirmed by NEON_PIXEL 001 SQL.
10. Invoices: exists in init.sql; used implicitly by subscription/billing logic.
11. FreePlanRequests / PaidSubscriptionRequests: table names and core columns confirmed
    by service files; exact additional columns (e.g., admin_id, rejection_reason) should
    be verified against full service implementations.

NOT INVENTED / NOT ADDED:
--------------------------
- No fake seed data inserted.
- No AUTO_INCREMENT on UUID PK columns (preserves string GUID behavior).
- No MSSQL-specific syntax (GETDATE, NEWID, OUTPUT, STRING_AGG, sys.columns).
- No .env or Redis changes.
- No destructive ALTERs on existing MSSQL structures.

DECISIONS LOCKED:
----------------
- UUID() for all new string PKs (MariaDB 10.4 supports UUID() function).
- JSON columns for design, menu, stats, gallery, hours, socials, theme_json, draft_menu,
  options, ordering settings (matches init.sql NVARCHAR(MAX) JSON storage pattern).
- TINYINT(1) replaces MSSQL BIT.
- DATETIME DEFAULT CURRENT_TIMESTAMP (replaces GETDATE()).
- VARCHAR(100) for UUID string PKs (matches original NVARCHAR(100) / VARCHAR(100)).
- utf8mb4 for Arabic/Kurdish/English multilingual content.
- ON DELETE CASCADE preserved on restaurant→sub-entity relationships where original had it.
- ON DELETE SET NULL preserved for branch/user references where appropriate.
*/
