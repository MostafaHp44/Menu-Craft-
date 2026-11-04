-- ====================================================================
-- MenuCraft Backend — MSSQL Complete Seed Schema
-- جميع الجداول + جميع بيانات البداية (Seed Data)
-- شغّل هذا الملف مرة واحدة على قاعدة البيانات menucraft
-- ====================================================================

/* ---------------------------------------------------------------- *
 * 1. جدول الباقات (Plans)
 * ---------------------------------------------------------------- */
IF OBJECT_ID('Plans', 'U') IS NULL
BEGIN
  CREATE TABLE Plans (
    id VARCHAR(100) PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    currency NVARCHAR(10) DEFAULT 'USD',
    interval_type NVARCHAR(20) DEFAULT 'month',
    max_restaurants INT DEFAULT 1,
    max_menu_items INT DEFAULT 15,
    features NVARCHAR(MAX),
    is_active BIT DEFAULT 1,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
  );
END

/* ---------------------------------------------------------------- *
 * 2. جدول المطاعم (Restaurants)
 * ---------------------------------------------------------------- */
IF OBJECT_ID('Restaurants', 'U') IS NULL
BEGIN
  CREATE TABLE Restaurants (
    id VARCHAR(100) PRIMARY KEY DEFAULT NEWID(),
    name_en NVARCHAR(200),
    name_ar NVARCHAR(200),
    name_ku NVARCHAR(200),
    slug NVARCHAR(200) NOT NULL UNIQUE,
    tagline_en NVARCHAR(500),
    tagline_ar NVARCHAR(500),
    tagline_ku NVARCHAR(500),
    description_en NVARCHAR(MAX),
    description_ar NVARCHAR(MAX),
    description_ku NVARCHAR(MAX),
    logoText_en NVARCHAR(200),
    logoText_ar NVARCHAR(200),
    logoText_ku NVARCHAR(200),
    logoStyle NVARCHAR(50) DEFAULT 'monogram',
    heroImage NVARCHAR(500),
    heroVideo NVARCHAR(500),
    gallery NVARCHAR(MAX),
    phone NVARCHAR(50),
    email NVARCHAR(255),
    address NVARCHAR(500),
    hours NVARCHAR(MAX),
    socials NVARCHAR(MAX),
    templateId NVARCHAR(100),
    design NVARCHAR(MAX),
    menu NVARCHAR(MAX),
    language NVARCHAR(10) DEFAULT 'en',
    status NVARCHAR(50) DEFAULT 'draft',
    [plan] NVARCHAR(50) DEFAULT 'trial',
    stats NVARCHAR(MAX),
    updated_at DATETIME DEFAULT GETDATE(),
    created_at DATETIME DEFAULT GETDATE()
  );
END

/* ---------------------------------------------------------------- *
 * 3. جدول المستخدمين (Users)
 * ---------------------------------------------------------------- */
IF OBJECT_ID('Users', 'U') IS NULL
BEGIN
  CREATE TABLE Users (
    id VARCHAR(100) PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(200) NOT NULL,
    email NVARCHAR(255) NOT NULL UNIQUE,
    password_hash NVARCHAR(500) NOT NULL,
    role NVARCHAR(50) DEFAULT 'client',
    restaurant_id VARCHAR(100) NULL,
    status NVARCHAR(50) DEFAULT 'active',
    created_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Users_Restaurants FOREIGN KEY (restaurant_id) REFERENCES Restaurants(id)
  );
END

/* ---------------------------------------------------------------- *
 * 4. جدول التصنيفات (MenuCategories)
 * ---------------------------------------------------------------- */
IF OBJECT_ID('MenuCategories', 'U') IS NULL
BEGIN
  CREATE TABLE MenuCategories (
    id VARCHAR(100) PRIMARY KEY DEFAULT NEWID(),
    restaurant_id VARCHAR(100) NOT NULL,
    name_en NVARCHAR(200),
    name_ar NVARCHAR(200),
    name_ku NVARCHAR(200),
    note_en NVARCHAR(500),
    note_ar NVARCHAR(500),
    note_ku NVARCHAR(500),
    sort_order INT DEFAULT 0,
    CONSTRAINT FK_MenuCategories_Restaurants FOREIGN KEY (restaurant_id) REFERENCES Restaurants(id) ON DELETE CASCADE
  );
END

/* ---------------------------------------------------------------- *
 * 5. جدول الأصناف (MenuItems)
 * ---------------------------------------------------------------- */
IF OBJECT_ID('MenuItems', 'U') IS NULL
BEGIN
  CREATE TABLE MenuItems (
    id VARCHAR(100) PRIMARY KEY DEFAULT NEWID(),
    category_id VARCHAR(100) NOT NULL,
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
    CONSTRAINT FK_MenuItems_Categories FOREIGN KEY (category_id) REFERENCES MenuCategories(id) ON DELETE CASCADE
  );
END

/* ---------------------------------------------------------------- *
 * 6. جدول الطلبات (Orders)
 * ---------------------------------------------------------------- */
IF OBJECT_ID('Orders', 'U') IS NULL
BEGIN
  CREATE TABLE Orders (
    id VARCHAR(100) PRIMARY KEY DEFAULT NEWID(),
    restaurant_id VARCHAR(100) NOT NULL,
    channel NVARCHAR(50) DEFAULT 'online',
    table_no NVARCHAR(50),
    customer_name NVARCHAR(200),
    note NVARCHAR(500),
    total DECIMAL(10, 2) DEFAULT 0,
    order_number INT,
    status NVARCHAR(50) DEFAULT 'received',
    created_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Orders_Restaurants FOREIGN KEY (restaurant_id) REFERENCES Restaurants(id)
  );
END

/* ---------------------------------------------------------------- *
 * 7. جدول أصناف الطلب (OrderLines)
 * ---------------------------------------------------------------- */
IF OBJECT_ID('OrderLines', 'U') IS NULL
BEGIN
  CREATE TABLE OrderLines (
    id VARCHAR(100) PRIMARY KEY DEFAULT NEWID(),
    order_id VARCHAR(100) NOT NULL,
    item_id VARCHAR(100),
    item_name NVARCHAR(200),
    price DECIMAL(10, 2),
    qty INT DEFAULT 1,
    CONSTRAINT FK_OrderLines_Orders FOREIGN KEY (order_id) REFERENCES Orders(id) ON DELETE CASCADE
  );
END

/* ---------------------------------------------------------------- *
 * 8. جدول الاشتراكات (Subscriptions)
 * ---------------------------------------------------------------- */
IF OBJECT_ID('Subscriptions', 'U') IS NULL
BEGIN
  CREATE TABLE Subscriptions (
    id VARCHAR(100) PRIMARY KEY DEFAULT NEWID(),
    restaurant_id VARCHAR(100) NOT NULL,
    plan_id VARCHAR(100) NULL,
    plan_name NVARCHAR(100),
    price DECIMAL(10, 2) DEFAULT 0,
    status NVARCHAR(50) DEFAULT 'trialing',
    started_at DATETIME DEFAULT GETDATE(),
    renews_at DATETIME,
    auto_renew BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Subscriptions_Restaurants FOREIGN KEY (restaurant_id) REFERENCES Restaurants(id),
    CONSTRAINT FK_Subscriptions_Plans FOREIGN KEY (plan_id) REFERENCES Plans(id)
  );
END

/* ---------------------------------------------------------------- *
 * 9. جدول المدفوعات (Payments)
 * ---------------------------------------------------------------- */
IF OBJECT_ID('Payments', 'U') IS NULL
BEGIN
  CREATE TABLE Payments (
    id VARCHAR(100) PRIMARY KEY DEFAULT NEWID(),
    restaurant_id VARCHAR(100) NOT NULL,
    subscription_id VARCHAR(100) NULL,
    stripe_payment_id NVARCHAR(200),
    amount DECIMAL(10, 2) NOT NULL,
    currency NVARCHAR(10) DEFAULT 'USD',
    status NVARCHAR(50) DEFAULT 'pending',
    payment_method NVARCHAR(50),
    created_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Payments_Restaurants FOREIGN KEY (restaurant_id) REFERENCES Restaurants(id),
    CONSTRAINT FK_Payments_Subscriptions FOREIGN KEY (subscription_id) REFERENCES Subscriptions(id)
  );
END

/* ---------------------------------------------------------------- *
 * 10. جدول الفواتير (Invoices)
 * ---------------------------------------------------------------- */
IF OBJECT_ID('Invoices', 'U') IS NULL
BEGIN
  CREATE TABLE Invoices (
    id VARCHAR(100) PRIMARY KEY DEFAULT NEWID(),
    restaurant_id VARCHAR(100) NOT NULL,
    subscription_id VARCHAR(100) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status NVARCHAR(50) DEFAULT 'open',
    due_at DATETIME,
    paid_at DATETIME NULL,
    stripe_invoice_id NVARCHAR(200),
    created_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Invoices_Restaurants FOREIGN KEY (restaurant_id) REFERENCES Restaurants(id),
    CONSTRAINT FK_Invoices_Subscriptions FOREIGN KEY (subscription_id) REFERENCES Subscriptions(id)
  );
END

/* ---------------------------------------------------------------- *
 * 11. جدول محتوى الصفحة الرئيسية (HomeContent)
 * ---------------------------------------------------------------- */
IF OBJECT_ID('HomeContent', 'U') IS NULL
BEGIN
  CREATE TABLE HomeContent (
    id VARCHAR(100) PRIMARY KEY DEFAULT NEWID(),
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
  );
END

/* ---------------------------------------------------------------- *
 * 12. جدول القوالب المضافة من السوبر أدمن (Templates)
 *     القالب = نسخة مخصصة من قالب أساسي موجود، باسم وتصنيف جديدين.
 *     بدون هذا الجدول تختفي النسخ المضافة من متصفح الزائر.
 * ---------------------------------------------------------------- */
IF OBJECT_ID('Templates', 'U') IS NULL
BEGIN
  CREATE TABLE Templates (
    id VARCHAR(100) PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(150) NOT NULL,
    base_template_id NVARCHAR(100) NOT NULL,
    category NVARCHAR(100),
    is_active BIT NOT NULL DEFAULT 1,
    created_by VARCHAR(100),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
  );
END

/* ==================================================================== *
 * زرع البيانات الابتدائية (Seed Data)
 * ==================================================================== */

/* -------------------- الباقات -------------------- */
INSERT INTO Plans (name, price, currency, interval_type, max_restaurants, max_menu_items, features, is_active)
VALUES 
('Starter', 0, 'USD', 'forever', 1, 15, N'{"qr_code":true,"branding":false}', 1),
('Professional', 29, 'USD', 'month', 1, -1, N'{"qr_code":true,"branding":false,"analytics":true}', 1),
('Business', 79, 'USD', 'month', 10, -1, N'{"qr_code":true,"branding":false,"analytics":true,"team_seats":true}', 1);

/* -------------------- المطاعم -------------------- */
DECLARE @rst_bella VARCHAR(100) = NEWID();
DECLARE @rst_copper VARCHAR(100) = NEWID();
DECLARE @rst_hearth VARCHAR(100) = NEWID();

INSERT INTO Restaurants (id, name_en, name_ar, name_ku, slug, tagline_en, tagline_ar, tagline_ku, description_en, description_ar, description_ku, logoText_en, logoStyle, heroImage, gallery, phone, email, address, hours, socials, templateId, language, status, [plan], stats, updated_at, created_at)
VALUES 
(@rst_bella, 'Bella Italian Kitchen', 'مطعم بيتا الإيطالي', 'چایخانەی بێلا伊طالیایی', 'bella', 'Authentic Italian flavors in the heart of the city.', 'نكهات إيطالية أصيلة في قلب المدينة.', 'سەborneی ئیتاڵی ڕاستی لە ناو شاری.', 'A corner trattoria serving house-made pasta, wood-fired pizza and seasonal antipasti.', 'م trattoria في الزاوية تقدم معكرونة محلية الصنع، بيتزا على حطب، ومقبلات موسمية.', 'يەکێک لە کۆنتێڕەکانی لە کۆنه، مارگاریتایی خۆی، پیتزا ئۆتنی ئاشر، و سوپەرەكانی ئۆتووم.', 'BK', 'monogram', '', N'["https://example.com/bella-1.jpg","https://example.com/bella-2.jpg"]', '+1 (720) 555-0100', 'hello@bella.demo', '123 Bella Street, Rome, Italy', N'[{"day":"Monday","hours":"08:00 - 22:00"},{"day":"Tuesday","hours":"08:00 - 22:00"}]', N'{"instagram":"@bella","facebook":"bella","website":"bella.demo"}', 'bella-italia', 'en', 'published', 'professional', N'{"views":12480,"qrScans":1284,"trend":[1420,1680,1510,1990,2240,2010,1630]}', GETDATE(), GETDATE()),
(@rst_copper, 'The Copper Kettle', 'الغلاية النحاسية', 'ئاگرەی مىنێ', 'copperkettle', 'Slow mornings, properly poured coffee.', 'صباح بطيء، قهوة مصبوبة بشكل صحيح.', 'ئەوە شەوەکانی سRewt، قهوهی دروست دەديارێت.', 'A corner café on Cedar Road serving house-roasted espresso, laminated pastries and a short brunch menu until three.', 'مقهى في زاوية على طريق سيودار يقدم إسبرسو محلي التحميص، معجنات مفتوحة وقائمة إفطار قصيرة حتى الثالثة.', 'كەفێک لە ناوەڕاستیڕاستی سێدار ڕاست، אספרسو، وڵەمبۆستي، و ليستێکی بەڕوون.', 'CK', 'wordmark', '', N'["https://example.com/copper-1.jpg"]', '+1 (720) 555-0122', 'hello@copperkettle.demo', '64 Cedar Road, Denver, CO', N'[{"day":"Monday","hours":"07:00 - 15:00"}]', N'{"instagram":"@copper","facebook":"copper","website":"copper.demo"}', 'urban-cafe', 'en', 'published', 'starter', N'{"views":4120,"qrScans":612,"trend":[520,610,580,640,720,690,560]}', GETDATE(), GETDATE()),
(@rst_hearth, 'Hearth & Crumb', 'المدفأة والفتات', 'ئاگر و نات', 'hearthcrumb', 'Bread with a long memory.', 'خبز بذاكرة طويلة.', 'نان با یادت هەرئەم.', 'A small bakery fermenting for 36 hours and baking twice a day. Pre-orders close at six the evening before collection.', 'مخبز صغير يتخمر لمدة 36 ساعة ويخبز مرتين يوميًا. تُغلق الطلبات المسبقة في الساعة السادسة مساء قبل الاستلام.', 'نانی یەکەمی، ٣٦ژێر لە خهڵكردن و دو جار چاوەكر.', 'HC', 'badge', '', N'["https://example.com/hearth-1.jpg"]', '+1 (804) 555-0104', 'bake@hearthcrumb.demo', '2 Mill Court, Richmond, VA', N'[{"day":"Wednesday","hours":"07:00 - 18:00"}]', N'{"instagram":"@hearth","facebook":"hearth","website":"hearth.demo"}', 'sweet-atelier', 'en', 'draft', 'trial', N'{"views":860,"qrScans":96,"trend":[90,120,140,130,160,110,110]}', GETDATE(), GETDATE());

/* -------------------- المستخدمين -------------------- */
DECLARE @u_super VARCHAR(100) = NEWID();
DECLARE @u_admin VARCHAR(100) = NEWID();
DECLARE @u_client VARCHAR(100) = NEWID();
DECLARE @u_client2 VARCHAR(100) = NEWID();
DECLARE @u_worker VARCHAR(100) = NEWID();

INSERT INTO Users (id, name, email, password_hash, role, restaurant_id, status, created_at)
VALUES 
(@u_super, 'Mostafa Adel', 'super@menucraft.demo', '$2a$12$K3xY7L8M9N0P1Q2R3S4T5U6V7W8X9Y0Z1A2B3C4D5E6F7G8H9I0', 'super_admin', NULL, 'active', GETDATE()),
(@u_admin, 'Nora Haddad', 'admin@menucraft.demo', '$2a$12$K3xY7L8M9N0P1Q2R3S4T5U6V7W8X9Y0Z1A2B3C4D5E6F7G8H9I0', 'admin', NULL, 'active', GETDATE()),
(@u_client, 'Marco Ferrante', 'owner@bella.demo', '$2a$12$K3xY7L8M9N0P1Q2R3S4T5U6V7W8X9Y0Z1A2B3C4D5E6F7G8H9I0', 'client', @rst_bella, 'active', GETDATE()),
(@u_client2, 'Dana Whitfield', 'owner@copper.demo', '$2a$12$K3xY7L8M9N0P1Q2R3S4T5U6V7W8X9Y0Z1A2B3C4D5E6F7G8H9I0', 'client', @rst_copper, 'active', GETDATE()),
(@u_worker, 'Samir Kaddour', 'worker@bella.demo', '$2a$12$K3xY7L8M9N0P1Q2R3S4T5U6V7W8X9Y0Z1A2B3C4D5E6F7G8H9I0', 'worker', @rst_bella, 'active', GETDATE());

/* -------------------- التصنيفات والأصناف لمطعم Bella -------------------- */
DECLARE @cat_bella_pasta VARCHAR(100) = NEWID();
DECLARE @cat_bella_pizza VARCHAR(100) = NEWID();
DECLARE @item_bella_carbonara VARCHAR(100) = NEWID();
DECLARE @item_bella_margherita VARCHAR(100) = NEWID();

INSERT INTO MenuCategories (id, restaurant_id, name_en, name_ar, name_ku, note_en, note_ar, note_ku, sort_order)
VALUES 
(@cat_bella_pasta, @rst_bella, 'Pasta', 'المعكرونة', 'ماكرونة', 'Fresh homemade pasta', 'معكرونة طازجة محلية', 'ناوەڕۆکی تازه خۆی', 1),
(@cat_bella_pizza, @rst_bella, 'Pizza', 'البيتزا', 'پیتزا', 'Wood-fired Neapolitan pizza', 'بيتزا ناپولي على الحطب', 'پیتزای ناپۆلتی لە ئاگر', 2);

INSERT INTO MenuItems (id, category_id, name_en, name_ar, name_ku, description_en, description_ar, description_ku, price, compare_at, image, featured, popular, available, sort_order)
VALUES 
(@item_bella_carbonara, @cat_bella_pasta, 'Spaghetti Carbonara', 'سباغيتي كاربونارا', 'سپاگیتی کاربونارا', 'Eggs, pecorino, guanciale and black pepper.', 'بيض، بيكورينو، غوانشالي وفلفل أسود.', 'هەReviews، بێكورينو، Гуанچيالە و سبي.', 24, 28, 'https://example.com/carbonara.jpg', 1, 1, 1, 1),
(@item_bella_margherita, @cat_bella_pizza, 'Margherita', 'مارgherita', 'مارgherита', 'Tomato, mozzarella, basil.', 'طماطم، موزاريلا، ريحان.', 'لاتماتم، موزاريلا، باسيل.', 18, NULL, 'https://example.com/margherita.jpg', 1, 1, 1, 1);

/* -------------------- التصنيفات والأصناف لمطعم Copper -------------------- */
DECLARE @cat_copper_coffee VARCHAR(100) = NEWID();
DECLARE @item_copper_espresso VARCHAR(100) = NEWID();

INSERT INTO MenuCategories (id, restaurant_id, name_en, name_ar, name_ku, note_en, note_ar, note_ku, sort_order)
VALUES 
(@cat_copper_coffee, @rst_copper, 'Coffee', 'القهوة', 'قهوه', 'House-roasted espresso and filter.', 'إسبرسو وفلتر محلي التحميص.', 'ئاسپريسو و فیلتەر خۆی', 1);

INSERT INTO MenuItems (id, category_id, name_en, name_ar, name_ku, description_en, description_ar, description_ku, price, compare_at, image, featured, popular, available, sort_order)
VALUES 
(@item_copper_espresso, @cat_copper_coffee, 'Espresso', 'إسبرسو', 'ئاسپريسو', 'Double shot house blend.', 'جرعة مزدوجة من المزيج المنزلي.', 'دو جۆرە لە مێژووی خۆی', 4, NULL, 'https://example.com/espresso.jpg', 0, 1, 1, 1);

/* -------------------- الاشتراكات -------------------- */
INSERT INTO Subscriptions (restaurant_id, plan_id, plan_name, price, status, started_at, renews_at, auto_renew, created_at, updated_at)
VALUES 
(@rst_bella, (SELECT id FROM Plans WHERE name = 'Professional'), 'Professional', 29, 'active', DATEADD(day, -28, GETDATE()), DATEADD(day, 30, GETDATE()), 1, GETDATE(), GETDATE()),
(@rst_copper, (SELECT id FROM Plans WHERE name = 'Starter'), 'Starter', 0, 'active', DATEADD(day, -120, GETDATE()), DATEADD(day, 240, GETDATE()), 0, GETDATE(), GETDATE()),
(@rst_hearth, (SELECT id FROM Plans WHERE name = 'Professional'), 'Trial', 0, 'trialing', DATEADD(day, -8, GETDATE()), DATEADD(day, 6, GETDATE()), 0, GETDATE(), GETDATE());

/* -------------------- المدفوعات التجريبية -------------------- */
INSERT INTO Payments (restaurant_id, stripe_payment_id, amount, currency, status, payment_method, created_at)
VALUES 
(@rst_bella, 'pi_demo_bella_1', 29, 'USD', 'succeeded', 'stripe', DATEADD(day, -5, GETDATE())),
(@rst_copper, 'pi_demo_copper_1', 0, 'USD', 'succeeded', 'stripe', DATEADD(day, -10, GETDATE()));

/* -------------------- محتوى الصفحة الرئيسية (اللغات الثلاث) -------------------- */
INSERT INTO HomeContent (lang, hero, templates, editor_showcase, workflow, highlights, showcase, pricing, final_cta, created_at, updated_at)
VALUES 
('en', N'{"enabled":true,"eyebrow":"The digital menu builder for food businesses","title":"Your Restaurant Menu.\\nYour Brand. *Your Rules.*","sub":"Create a beautiful digital menu for your restaurant, cafe, or bakery. Choose your design, customize every detail, and share your menu with the world — no coding required.","cta":"Explore Templates","secondaryCta":"Explore the Editor","image":"","note":"A real MenuCraft preview"}', N'{"enabled":true,"eyebrow":"Template marketplace","title":"Designs that already look *finished*","sub":"Every template is a complete restaurant website: its own typography, palette, header, hero and menu style. Start from one, then change anything."}', N'{"enabled":true,"eyebrow":"The visual editor","title":"Change it and watch it happen.","sub":"Colors, fonts, layout, menu content — every control in the MenuCraft editor writes to the live preview as you type."}', N'{"enabled":true,"eyebrow":"How it works","title":"Three steps from idea to live menu","sub":"The whole journey is designed to take minutes — and it is fully interactive in this demo.","steps":[{"title":"Choose","body":"Browse eight complete restaurant designs and preview each one as a real, scrollable website."},{"title":"Customize","body":"Rename the restaurant, recolor, switch fonts, rework the menu — everything updates live."},{"title":"Publish","body":"Save your demo, open the mobile-friendly site and generate the QR code for your tables."}]}', N'{"enabled":true,"items":[{"title":"Branding","body":"Name, logo, tagline, hero photography, contact details and opening hours — all editable, all live."},{"title":"Typography","body":"Six curated families for headings, body and menu items, with size, weight and leading controls."},{"title":"Menu management","body":"Categories, items, prices, promotional pricing, availability, featured dishes and drag-free reordering."},{"title":"QR codes","body":"A real, scannable QR code for every menu — downloadable and print-ready for tables and windows."},{"title":"Mobile-friendly","body":"Every template is built responsive-first, so the menu reads perfectly on a phone at the table."}]}', N'{"enabled":true,"eyebrow":"Responsive by default","title":"One menu. Every screen.","sub":"Guests open your menu on the phone in their hand. MenuCraft templates reflow for desktop, tablet and mobile without a single extra setting."}', N'{"enabled":true,"eyebrow":"Pricing","title":"Simple plans, *demo pricing*","sub":"These prices are illustrative only. This prototype processes no payments and provisions no real hosting.","note":"Every button in this prototype leads somewhere — plans simply open the demo editor."}', N'{"enabled":true,"title":"Your menu deserves better than a PDF.","sub":"Pick a template, change the restaurant name, edit a price, swap the font — in under two minutes you will have a menu worth sharing.","cta":"Explore Templates"}', GETDATE(), GETDATE()),
('ar', N'{"enabled":true,"eyebrow":"منشئ القوائم الرقمية لأعمال المطاعم","title":"قائمة مطعمك.\\nعلامتك التجارية. *شروطك أنت.*","sub":"أنشئ قائمة رقمية جميلة لمطعمك أو مقهاك أو مخبزك. اختر تصميمك، وخصّص كل تفصيلة، وشارك قائمتك مع العالم — دون أي برمجة.","cta":"تصفّح القوالب","secondaryCta":"تصفّح المحرّر","image":"","note":"معاينة حقيقية من MenuCraft"}', N'{"enabled":true,"eyebrow":"سوق القوالب","title":"تصاميم تبدو *مهيّأة* بالفعل","sub":"كل قالب موقع مطعم كامل: خطّه الطباعي ولوحاته اللونيّة وترويسته وواجهته ونمط قائمته. ابدأ من قالب واحد، ثم غيّر ما تشاء."}', N'{"enabled":true,"eyebrow":"المحرّر المرئي","title":"غيّرها وشاهد ما يحدث مباشرة.","sub":"الألوان والخطوط والتخطيط ومحتوى القائمة — كل عنصر تحكّم في محرّر MenuCraft يُطبَّق على المعاينة الحيّة أثناء الكتابة. لا زرّ معاينة، ولا إعادة تحميل، ولا تخمين."}', N'{"enabled":true,"eyebrow":"كيف يعمل","title":"ثلاث خطوات من الفكرة إلى القائمة الحيّة","sub":"رحلة كاملة صُمِّمت لتأخذ دقائق — وهي تفاعلية بالكامل في هذا العرض.","steps":[{"title":"اختر","body":"تصفّح ثمانية تصاميم مطاعم كاملة، وعاين كل واحد منها كموقع حقيقي يمكنك التصفّح فيه."},{"title":"خصّص","body":"غيّر اسم المطعم، وأعد التلوين، وبدّل الخطوط، وأعد تنسيق القائمة — كل شيء يتحدّث مباشرة."},{"title":"انشر","body":"احفظ عرضك التجريبي، وافتح الموقع المتوافق مع الجوال، وأنشئ رمز QR لطاولاتك."}]}', N'{"enabled":true,"items":[{"title":"الهوية","body":"الاسم والشعار والشعار النصي وصور الواجهة وبيانات التواصل وساعات العمل — كلها قابلة للتعديل، وكلها مباشر."},{"title":"الخطوط","body":"ست عائلات خطّية منتقاة للعناوين والنصوص وأصناف القائمة، مع تحكّم بالحجم والوزن وتباعد الأسطر."},{"title":"إدارة القائمة","body":"التصنيفات والأصناف والأسعار والتسعير الترويجي وحالة التوفّر والأطباق المميزة وإعادة الترتيب بلا سحب."},{"title":"رموز QR","body":"رمز QR حقيقي قابل للمسح لكل قائمة — قابل للتنزيل وجاهز للطباعة للطاولات والواجهات."},{"title":"متوافق مع الجوال","body":"كل قالب مبنيّ بالتوافق الجوال أولاً، لتُقرأ القائمة بإتقان على الهاتف فوق الطاولة."}]}', N'{"enabled":true,"eyebrow":"متجاوب افتراضياً","title":"قائمة واحدة. كل شاشة.","sub":"يفتح ضيوفك قائمتهم على الهاتف الذي في أيديهم. قوالب MenuCraft تتموضع مجدداً للحاسوب واللوح والجوال دون أي إعداد إضافي."}', N'{"enabled":true,"eyebrow":"الأسعار","title":"خطط بسيطة، *أسعار تجريبية*","sub":"هذه الأسعار توضيحية فقط. لا تعالج هذه النسخة أي مدفوعات ولا توفّر أي استضافة حقيقية.","note":"كل زرّ في هذه النسخة يقود إلى وجهة — والخطط ببساطة تفتح المحرّر التجريبي."}', N'{"enabled":true,"title":"قائمتك تستحق أكثر من ملف PDF.","sub":"اختر قالباً، وغيّر اسم المطعم، وعدّل سعراً، وبدّل الخط — في أقل من دقيقتين ستحصل على قائمة تستحق المشاركة.","cta":"تصفّح القوالب"}', GETDATE(), GETDATE()),
('ku', N'{"enabled":true,"eyebrow":"دروستکەری لیستی دیجیتاڵی بۆ کارەکانی خواردن","title":"لیستی چایەخانەکەت.\\nناونیشانەکەت. *ڕێکەکانی تۆ.*","sub":"لیستێکی دیجیتاڵی جوان دروست بکە بۆ چایەخانەکەت، قاوەخانەکەت یان نانکەکەت. دیزاینەکەت هەڵبژێر، هەموو وردەکارییەکان بگۆڕە، و لیستەکەت لەگەڵ جیهان هاوبەش بکە — بەبێ هیچ کۆDNووسینەوە.","cta":"قاڵبەکان بگەڕێ بەدوایدا","secondaryCta":"دەستکارکەرەکە بگەڕێ بەدوایدا","image":"","note":"پێشبینینێکی ڕاستەقینەی MenuCraft"}', N'{"enabled":true,"eyebrow":"بازاڕی قاڵبەکان","title":"دیزاینەکانی *تەواو* دیاری دەکەن","sub":"هەر قاڵبێک ماڵپەڕێکی تەواوی چایەخانەیە: ئەلفوبێی خۆی، ڕەنگەکانی، سەردێڕی، سەرەتا و شێوازی لیستەکە. لە قاڵبێکوو دەست پێ بکە، پاشان هەرچیت دەوێت بگۆڕە."}', N'{"enabled":true,"eyebrow":"دەستکارکەری بینینی","title":"بیگۆڕە و ببینە چۆن ڕاستەوخۆ دەکرێتەوە.","sub":"ڕەنگەکان، فۆنتەکان، شێوازی جێگیرکردن، ناوەڕۆکی لیستە — هەموو کۆنترۆلێک لە دەستکارکەری MenuCraft ڕاستەوخۆ لەسەر پێشبینینی ڕاستە دەنووسرێت کاتێک دەنووسیت. نییە دوگمەی پێشبینین، نییە بارکردنەوەی لاپەڕە، نییە خەمڵاندن."}', N'{"enabled":true,"eyebrow":"چۆن کار دەکات","title":"سێ هەنگاو لە بیرۆکەوە تا لیستی ڕاستە","sub":"گەشتەکەی تەواو بۆ چەند خولەکێک دروستکراوە — و لەم تاقیکردنەوەیە بە تەواوی تێکەڵەکارە.","steps":[{"title":"هەڵبژێر","body":"هەشتا دیزاینی تەواوی چایەخانە بگەڕێ بەدوایدا و هەر یەکەی وەک ماڵپەڕێکی ڕاستەقینە ببینە کە بتوانیت بە ئاسایی بگەڕێیت بەدوایدا."},{"title":"دەستکاری بکە","body":"ناوی چایەخانەکە بگۆڕە، ڕەنگەکان بگۆڕە، فۆنتەکان بگۆڕە، لیستەکە دەستکاری بکە — هەموو شتێک ڕاستەوخۆ نوێ دەکرێتەوە."},{"title":"بڵاو بکەرەوە","body":"تاقیکردنەوەکەت پاشەکەوت بکە، ماڵپەڕی مۆبایلپەسەند بکەرەوە، و کۆدی QR بۆ مێزەکان دروست بکە."}]}', N'{"enabled":true,"items":[{"title":"ناونیشان","body":"ناو، croise، شیعار، وێنەی سەرەتا، وردەکاری پەیوەستی و کاتی کردنەوە — هەموویان دەستکاری دەکرێن، هەموویان ڕاستەن."},{"title":"فۆنتەکان","body":"شەش خێزانی فۆنتی هەڵبژێردراو بۆ سەردێڕەکان، دەق و شتەکانی لیستە، لەگەڵ کۆنترۆلی قەبارە، قورسی و نێوان دەقەکان."},{"title":"بەڕێوەبردنی لیستە","body":"پۆلەکان، شتەکان، نرخەکان، نرخی ڕیکلامی، بەردەستبوون، خواردنە تایبەتەکان و ڕیزکردنەوە بەبێ ڕەشکاندن."},{"title":"کۆدەکانی QR","body":"کۆدی QRی ڕاستەقینە و سکانکردنی بۆ هەر لیستێک — دادەبەزێنرێت و ئامادەیە بۆ چاپکردن بۆ مێز و جیڵەکان."},{"title":"مۆبایلپەسەند","body":"هەر قاڵبێک لە سەرەوە بۆ مۆبایل دروستکراوە، بۆیە لیستەکە لەسەر مۆبایل، لەسەر مێز، بە تەواوی دەخوێنرێتەوە."}]}', N'{"enabled":true,"eyebrow":"بە شێوەی بنەڕەت وەشانکراوە","title":"لیستێکی یەک. هەموو شاشەیەک.","sub":"میوانەکان لیستەکەت لەسەر مۆبایلەکەیان کردنەوە. قاڵبەکانی MenuCraft بۆ کۆمپیوتەر، تابلێت و مۆبایل ڕێک دەخورن بەبێ هیچ ڕێکخستنێکی زیادە."}', N'{"enabled":true,"eyebrow":"نرخەکان","title":"پلانە سادەکان، *نرخی تاقیکراو*","sub":"ئەم نرخانی تەنها وەک نموونەن. ئەم پێشکەشکردنەیە هیچ پارەدانێک ناگرێتەوە و هیچ میزبانییەکی ڕاستەقینە دەست ناداتەوە.","note":"هەر دوگمەیەک لەم پێشکەشکردنەوە بۆ شتێک دەبات — پلانەکان تەنها دەستکارکەری تاقیکراو دەکردنەوە."}', N'{"enabled":true,"title":"لیستەکەت شایانی شتێکی باشترە لە فایلێکی PDF.","sub":"قاڵبێک هەڵبژێر، ناوی چایەخانەکە بگۆڕە، نرخێک دەستکاری بکە، فۆنتەکە بگۆڕە — لە خوارەوە دوو خولەکەکە لیستێکت هەیە کە شایانی هاوبەشکردنە.","cta":"قاڵبەکان بگەڕێ بەدوایدا"}', GETDATE(), GETDATE());

/* ==================================================================== *
 * نهاية الملف
 * ==================================================================== */
