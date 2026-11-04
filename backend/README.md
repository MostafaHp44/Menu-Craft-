# MenuCraft Backend (Node.js + Fastify + MSSQL)

الباك إند لمشروع MenuCraft. يدعم حاليًا **المصادقة (Auth)** وسينتسع ليشمل المطاعم والطلبات والمنصة لاحقًا.

## هيكل المجلدات

```
backend/
├── src/
│   ├── config/db.js          # اتصال MSSQL مع Connection Pooling
│   ├── controllers/          # التحكم في الاستجابات (Auth)
│   ├── middleware/           # CORS ، معالج الأخطاء
│   ├── routes/               # مسارات API (/api/auth/*)
│   ├── services/             # منطق الأعمال (Auth Service)
│   ├── utils/                # تشفير كلمات المرور، رموز JWT
│   ├── app.js                # إعداد تطبيق Fastify
│   └── server.js             # تشغيل السيرفر
├── database/
│   └── init.sql              # إنشاء جداول MSSQL الأولية
├── .env.example              # مثال لمتغيرات البيئة
├── package.json
└── README.md
```

## تشغيل محليًا (تطوير)

### 1. ثبت التبعيات
```bash
cd backend
npm install
```

### 2. أعد إعداد متغيرات البيئة
```bash
cp .env.example .env
# حرّر ملف .env وضع كلمات المرور الحقيقية الخاصة بك
```

### 3. شغّل MSSQL (باستخدام Docker)
```bash
docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=YourStrong@Passw0rd" \
  -p 1433:1433 --name mssql-local -d mcr.microsoft.com/mssql/server:2022-latest
```

### 4. أنشئ الجداول في قاعدة البيانات
شغّل محتوى ملف `database/init.sql` على قاعدة البيانات `menucraft` باستخدام Azure Data Studio أو SQL Server Management Studio أو `sqlcmd`.

### 5. شغّل السيرفر
```bash
npm run dev
# السيرفر يشتغل على http://localhost:3000
```

## المسارات المتاحة حاليًا (Auth)

| الطريقة | المسار | الوصف |
|--------|--------|-------|
| `POST` | `/api/auth/signup` | إنشاء حساب جديد + مطعم + إرجاع توكنات |
| `POST` | `/api/auth/signin` | تسجيل دخول باستخدام البريد وكلمة المرور |
| `GET` | `/health` | فحص حالة السيرفر |

### مثال على طلب التسجيل
```json
POST /api/auth/signup
Content-Type: application/json

{
  "name": "Marco Ferrante",
  "email": "marco@restaurant.com",
  "password": "123456",
  "restaurantName": "Bella Italian Kitchen"
}
```

### مثال على رد 성공
```json
{
  "ok": true,
  "user": {
    "id": "xxx",
    "name": "Marco Ferrante",
    "email": "marco@restaurant.com",
    "role": "client",
    "restaurant_id": "yyy",
    "status": "active"
  },
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG..."
}
```

## الربط مع الفرونت (Vercel)

1. شغّل الباك إند محليًا أو على VPS.
2. أحصل على الرابط العام (مثلاً عبر Cloudflare Tunnel أو ngrok).
3. في مشروع الفرونت على Vercel، أضف متغير بيئة:
   ```
   VITE_API_URL=https://your-tunnel-url.com
   ```
4. في كود الفرونت، استخدم `fetch(`${VITE_API_URL}/api/auth/signin`, ...)`.

## ملاحظات الأمان

- كلمات المرور تُخزّن بعد تشفيرها بـ **bcryptjs** (12 salt rounds).
- `accessToken` مدته 15 دقيقة، `refreshToken` مدته 7 أيام.
- في الإنتاج، يفضل إرجاع `refreshToken` في **HttpOnly Cookie** وليس في جسم الرد.
- `CORS` مضبوط لدومين الفرونت فقط عبر متغير `CORS_ORIGIN`.

## ما سيأتي لاحقًا

- APIs للمطاعم (CRUD، النشر، التصميم)
- APIs للطلبات ولوحة المطبخ
- APIs للاشتراكات والمدفوعات (لوحة المشرف)
- وسائط تحقق من JWT على المسارات المحمية
