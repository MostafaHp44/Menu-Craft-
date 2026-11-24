# API Inventory — MenuCraft Backend

> Generated for performance testing. Source of truth: code under `backend/src`.
> No API requests were executed and no secrets are recorded here.

## 1. Scope & registration chain

| Layer | File | Note |
|---|---|---|
| HTTP server | `backend/src/server.js` | Registers `healthRoutes` plugin. |
| App / plugin registration | `backend/src/app.js` | Registers central route collection with prefix `/api`; inline `GET /health`. |
| **Central collection** | `backend/src/routes/index.js` | Single entry that registers every API module. |
| Modules | `backend/src/routes/*.routes.js` | Individual route modules (each exports a Fastify plugin). |
| Inline handlers | `backend/src/controllers/payment.controller.js` | Registers billing/payment routes inside `paymentRoutes` plugin. |

- **API base path:** `/api`
- **Local base URL:** `http://localhost:3000`
- **Live base URL:** `https://api.vertex-electric.org`
- Final URL pattern: `{base}/api{routePath}`

## 2. Authentication & authorization model (as discovered)

- **Transport:** Bearer token header (`Authorization: Bearer <token>`) **or** HttpOnly cookie `access_token`.
- **Public paths** are whitelisted in `backend/src/middleware/auth.middleware.js` (`publicPaths`) with dynamic-segment support; `HARD_AUTH` set protects `/api/sites/summary` and `/api/sites/can-create`.
- Public endpoints include: health, auth (signup/signin/employee-login/refresh/logout), public reads (`/api/restaurants/:id`, `/api/restaurants/slug/:slug`, `/api/home-content`, `/api/platform/plans`, `/api/platform/plans/:id`, `/api/platform/templates`, `/api/platform/templates/overrides`, `/api/sites/:slug`, `/api/public/menu/:slug`, …), guest ordering (`POST /api/orders`, `GET /api/public/orders/:id/track`, `POST /api/public/orders/:id/pay`), `POST /api/payments/webhook` (signature-verified), `GET /api/sites/public/:slug` (no preHandler → fully public).
- **Optional auth:** `POST /api/orders` uses `optionalAuth` (guest vs authenticated counter order).
- **Subscription gate:** `PUT /api/restaurants/:id` exempted during onboarding; `PATCH /api/restaurants/:id/publish` uses `subscriptionMiddleware` (active/trialing required).
- **Roles:** `super_admin`, `admin`, `client`, `worker` (normalized in `backend/src/middleware/roles.js`). Super-admin only for platform management; platform staff (super_admin/admin) for content writes; owner/manager for restaurant-scoped writes.

## 3. Endpoint inventory by module

### 3.1 Health — `backend/src/routes/health.routes.js`, `backend/src/app.js` (3)

| Method | Path | Auth | Type | Source |
|---|---|---|---|---|
| GET | `/api/health` | public | read | `backend/src/app.js:117` |
| GET | `/api/health/live` | public | read | `backend/src/routes/health.routes.js:6` |
| GET | `/api/health/ready` | public | read | `backend/src/routes/health.routes.js:23` |

### 3.2 Auth — `backend/src/routes/auth.routes.js` (6)

| Method | Path | Auth | Type | Source | Flags |
|---|---|---|---|---|---|
| POST | `/api/auth/signup` | public | write | `backend/src/routes/auth.routes.js:18` | rateLimit combined 5/1h |
| POST | `/api/auth/employee-login` | public | write | `backend/src/routes/auth.routes.js:21` | rateLimit login 5/15m, login-ip 25/15m |
| POST | `/api/auth/signin` | public | write | `backend/src/routes/auth.routes.js:24` | rateLimit login 5/15m, login-ip 25/15m |
| POST | `/api/auth/refresh` | public | write | `backend/src/routes/auth.routes.js:27` | rateLimit user 10/15m |
| POST | `/api/auth/logout` | public (rate-limit only, no auth mw) | write | `backend/src/routes/auth.routes.js:32` | rateLimit ip 30/15m |
| GET | `/api/auth/me` | auth | read | `backend/src/routes/auth.routes.js:33` | — |

### 3.3 Translate — `backend/src/routes/translate.routes.js` (1)

| Method | Path | Auth | Type | Source | Flags |
|---|---|---|---|---|---|
| POST | `/api/translate` | auth | write | `backend/src/routes/translate.routes.js:10` | external translation service |

### 3.4 Menu / guest ordering — `backend/src/routes/menu.routes.js`, `backend/src/routes/order.routes.js` (8)

| Method | Path | Auth | Type | Source | Flags |
|---|---|---|---|---|---|
| GET | `/api/public/menu/:slug` | public | read | `backend/src/routes/menu.routes.js:79` | query `lang` |
| GET | `/api/public/menu/:slug/branches` | public | read | `backend/src/routes/menu.routes.js:92` | — |
| POST | `/api/orders` | public (optionalAuth) | write | `backend/src/routes/order.routes.js:17` | guest order creation |
| GET | `/api/public/orders/:id/track` | public | read | `backend/src/routes/order.routes.js:19` | — |
| POST | `/api/public/orders/:id/pay` | public | write | `backend/src/controllers/payment.controller.js:70` | Stripe PaymentIntent |
| POST | `/api/payments/webhook` | public (sig-verified) | write | `backend/src/controllers/payment.controller.js:40` | Stripe webhook |
| GET | `/api/orders` | auth | read | `backend/src/routes/order.routes.js:22` | — |
| GET | `/api/orders/sales-series/:restaurantId` | auth | read | `backend/src/routes/order.routes.js:23` | — |
| GET | `/api/orders/:id` | auth | read | `backend/src/routes/order.routes.js:37` | — |
| PATCH | `/api/orders/:id/status` | auth | write | `backend/src/routes/order.routes.js:38` | — |
| DELETE | `/api/orders/:id` | auth | write | `backend/src/routes/order.routes.js:39` | — |
| GET | `/api/admin/orders/pending-count` | auth (super_admin/admin) | read | `backend/src/routes/order.routes.js:42` | — |

### 3.5 Restaurants — `backend/src/routes/restaurant.routes.js` (12)

| Method | Path | Auth | Type | Source | Flags |
|---|---|---|---|---|---|
| GET | `/api/restaurants` | auth | read | `backend/src/routes/restaurant.routes.js:24` | — |
| POST | `/api/restaurants` | auth | write | `backend/src/routes/restaurant.routes.js:25` | — |
| GET | `/api/restaurants/:id` | public (optional user) | read | `backend/src/routes/restaurant.routes.js:21` | — |
| GET | `/api/restaurants/slug/:slug` | public (optional user) | read | `backend/src/routes/restaurant.routes.js:20` | — |
| PUT | `/api/restaurants/:id` | auth | write | `backend/src/routes/restaurant.routes.js:26` | subGate bypass (onboarding) |
| POST | `/api/restaurants/:id/import-template` | auth | write | `backend/src/routes/restaurant.routes.js:28` | — |
| GET | `/api/restaurants/:id/templates` | auth | read | `backend/src/routes/restaurant.routes.js:31` | — |
| POST | `/api/restaurants/:id/templates` | auth | write | `backend/src/routes/restaurant.routes.js:32` | — |
| DELETE | `/api/restaurants/:id/templates/:templateId` | auth | write | `backend/src/routes/restaurant.routes.js:33` | — |
| PATCH | `/api/restaurants/:id/publish` | auth | write | `backend/src/routes/restaurant.routes.js:36` | subGate (active/trialing) |
| PATCH | `/api/restaurants/:id/unpublish` | auth | write | `backend/src/routes/restaurant.routes.js:42` | — |
| DELETE | `/api/restaurants/:id` | auth | write | `backend/src/routes/restaurant.routes.js:46` | — |

### 3.6 Sites (user-owned site config) — `backend/src/routes/sites.routes.js` (6)

| Method | Path | Auth | Type | Source | Flags |
|---|---|---|---|---|---|
| GET | `/api/sites/summary` | auth (hard) | read | `backend/src/routes/sites.routes.js:110` | hard-auth |
| GET | `/api/sites` | auth (hard) | read | `backend/src/routes/sites.routes.js:111` | hard-auth |
| GET | `/api/sites/can-create` | auth (hard) | read | `backend/src/routes/sites.routes.js:112` | hard-auth |
| PUT | `/api/sites/:slug` | auth | write | `backend/src/routes/sites.routes.js:125` | ownership asserted |
| GET | `/api/sites/public/:slug` | public | read | `backend/src/routes/sites.routes.js:148` | no preHandler |
| GET | `/api/sites/:slug` | public (optional user) | read | `backend/src/routes/sites.routes.js:115` | publicPaths |

### 3.7 Platform core — `backend/src/routes/platform.routes.js` (18)

| Method | Path | Auth | Type | Source | Flags |
|---|---|---|---|---|---|
| GET | `/api/platform/clients` | auth (super) | read | `backend/src/routes/platform.routes.js:19` | — |
| GET | `/api/platform/subscriptions` | auth (super) | read | `backend/src/routes/platform.routes.js:20` | — |
| GET | `/api/platform/subscriptions/:restaurantId` | auth (tenant) | read | `backend/src/routes/platform.routes.js:21` | — |
| POST | `/api/platform/subscriptions` | auth (super) | write | `backend/src/routes/platform.routes.js:22` | — |
| PATCH | `/api/platform/subscriptions/:restaurantId` | auth (super) | write | `backend/src/routes/platform.routes.js:23` | — |
| GET | `/api/platform/stats` | auth (super) | read | `backend/src/routes/platform.routes.js:24` | — |
| GET | `/api/platform/admin/sales` | auth (super) | read | `backend/src/routes/platform.routes.js:27` | query period/restaurantId |
| GET | `/api/platform/admin/financial` | auth (super) | read | `backend/src/routes/platform.routes.js:35` | query period |
| GET | `/api/platform/admin/clients` | auth (super) | read | `backend/src/routes/platform.routes.js:43` | — |
| GET | `/api/platform/admin/clients/:restaurantId/details` | auth (super) | read | `backend/src/routes/platform.routes.js:46` | query period |
| DELETE | `/api/platform/admin/clients/:restaurantId` | auth (super) | write | `backend/src/routes/platform.routes.js:57` | cascade delete |
| GET | `/api/platform/admin/users` | auth (super) | read | `backend/src/routes/platform.routes.js:65` | — |
| GET | `/api/platform/admin/stats` | auth (super) | read | `backend/src/routes/platform.routes.js:74` | — |
| GET | `/api/platform/admin/payments` | auth (super) | read | `backend/src/routes/platform.routes.js:83` | query limit |
| GET | `/api/platform/admin/payments-summary` | auth (super) | read | `backend/src/routes/platform.routes.js:91` | — |
| GET | `/api/platform/admin/templates` | auth (super) | read | `backend/src/routes/platform.routes.js:100` | — |
| POST | `/api/platform/admins` | auth (super) | write | `backend/src/routes/platform.routes.js:109` | — |
| DELETE | `/api/platform/admin/users/:userId` | auth (super) | write | `backend/src/routes/platform.routes.js:117` | — |

### 3.8 Home content — `backend/src/routes/home-content.routes.js` (2)

| Method | Path | Auth | Type | Source | Flags |
|---|---|---|---|---|---|
| GET | `/api/home-content` | public | read | `backend/src/routes/home-content.routes.js:5` | — |
| PATCH | `/api/home-content/:lang` | auth (super_admin/admin) | write | `backend/src/routes/home-content.routes.js:6` | — |

### 3.9 Plans — `backend/src/routes/plan.routes.js` (5)

| Method | Path | Auth | Type | Source | Flags |
|---|---|---|---|---|---|
| GET | `/api/platform/plans` | public | read | `backend/src/routes/plan.routes.js:6` | — |
| GET | `/api/platform/plans/:id` | public | read | `backend/src/routes/plan.routes.js:7` | — |
| POST | `/api/platform/plans` | auth (super) | write | `backend/src/routes/plan.routes.js:8` | — |
| PUT | `/api/platform/plans/:id` | auth (super) | write | `backend/src/routes/plan.routes.js:9` | — |
| DELETE | `/api/platform/plans/:id` | auth (super) | write | `backend/src/routes/plan.routes.js:10` | — |

### 3.10 Payments & billing — `backend/src/controllers/payment.controller.js` (5)

| Method | Path | Auth | Type | Source | Flags |
|---|---|---|---|---|---|
| POST | `/api/billing/checkout` | auth | write | `backend/src/controllers/payment.controller.js:15` | Stripe checkout |
| GET | `/api/billing/status` | auth | read | `backend/src/controllers/payment.controller.js:27` | Stripe mode + payments |
| POST | `/api/payments/webhook` | public (sig) | write | `backend/src/controllers/payment.controller.js:40` | Stripe webhook |
| POST | `/api/public/orders/:id/pay` | public | write | `backend/src/controllers/payment.controller.js:70` | Stripe PaymentIntent |
| GET | `/api/payments/restaurant/:restaurantId` | auth | read | `backend/src/controllers/payment.controller.js:80` | owner check |

### 3.11 Free plan requests — `backend/src/routes/freePlanRequest.routes.js` (4)

| Method | Path | Auth | Type | Source | Flags |
|---|---|---|---|---|---|
| POST | `/api/free-plan-requests` | auth | write | `backend/src/routes/freePlanRequest.routes.js:11` | — |
| GET | `/api/admin/free-plan-requests` | auth (super) | read | `backend/src/routes/freePlanRequest.routes.js:14` | — |
| PATCH | `/api/admin/free-plan-requests/:requestId/approve` | auth (super) | write | `backend/src/routes/freePlanRequest.routes.js:17` | — |
| PATCH | `/api/admin/free-plan-requests/:requestId/reject` | auth (super) | write | `backend/src/routes/freePlanRequest.routes.js:20` | — |

### 3.12 Paid subscription requests — `backend/src/routes/paidSubscriptionRequest.routes.js` (5)

| Method | Path | Auth | Type | Source | Flags |
|---|---|---|---|---|---|
| POST | `/api/paid-subscription-requests` | auth | write | `backend/src/routes/paidSubscriptionRequest.routes.js:12` | — |
| GET | `/api/paid-subscription-requests` | auth | read | `backend/src/routes/paidSubscriptionRequest.routes.js:15` | — |
| GET | `/api/admin/paid-subscription-requests` | auth (super) | read | `backend/src/routes/paidSubscriptionRequest.routes.js:18` | — |
| PATCH | `/api/admin/paid-subscription-requests/:requestId/approve` | auth (super) | write | `backend/src/routes/paidSubscriptionRequest.routes.js:21` | — |
| PATCH | `/api/admin/paid-subscription-requests/:requestId/reject` | auth (super) | write | `backend/src/routes/paidSubscriptionRequest.routes.js:24` | — |

### 3.13 Templates — `backend/src/routes/template.routes.js` (12)

| Method | Path | Auth | Type | Source | Flags |
|---|---|---|---|---|---|
| GET | `/api/platform/templates` | public | read | `backend/src/routes/template.routes.js:20` | — |
| GET | `/api/platform/templates/overrides` | public | read | `backend/src/routes/template.routes.js:21` | — |
| GET | `/api/platform/templates/all` | auth (super) | read | `backend/src/routes/template.routes.js:24` | — |
| POST | `/api/platform/templates` | auth (super) | write | `backend/src/routes/template.routes.js:25` | — |
| PATCH | `/api/platform/templates/:id` | auth (super) | write | `backend/src/routes/template.routes.js:26` | — |
| DELETE | `/api/platform/templates/:id` | auth (super) | write | `backend/src/routes/template.routes.js:27` | — |
| POST | `/api/platform/templates/upload` | auth (super) | write | `backend/src/routes/template.routes.js:30` | multipart |
| GET | `/api/platform/templates/media` | auth (super) | read | `backend/src/routes/template.routes.js:31` | — |
| GET | `/api/platform/templates/overrides-admin` | auth (super) | read | `backend/src/routes/template.routes.js:32` | — |
| GET | `/api/platform/templates/overrides/:baseId` | auth (super) | read | `backend/src/routes/template.routes.js:33` | — |
| PUT | `/api/platform/templates/overrides/:baseId` | auth (super) | write | `backend/src/routes/template.routes.js:34` | — |
| DELETE | `/api/platform/templates/overrides/:baseId` | auth (super) | write | `backend/src/routes/template.routes.js:35` | — |

### 3.14 Uploads — `backend/src/routes/uploads.routes.js` (2)

| Method | Path | Auth | Type | Source | Flags |
|---|---|---|---|---|---|
| POST | `/api/uploads` | auth | write | `backend/src/routes/uploads.routes.js:36` | multipart (5MB image / 40MB video) |
| GET | `/api/uploads` | auth | read | `backend/src/routes/uploads.routes.js:67` | — |

### 3.15 Branches — `backend/src/routes/branch.routes.js` (5)

| Method | Path | Auth | Type | Source | Flags |
|---|---|---|---|---|---|
| GET | `/api/branches` | auth | read | `backend/src/routes/branch.routes.js:54` | query restaurantId |
| GET | `/api/branches/:id` | auth | read | `backend/src/routes/branch.routes.js:66` | — |
| POST | `/api/branches` | auth (manager) | write | `backend/src/routes/branch.routes.js:80` | — |
| PUT | `/api/branches/:id` | auth (manager) | write | `backend/src/routes/branch.routes.js:115` | — |
| PATCH | `/api/branches/:id` | auth (manager) | write | `backend/src/routes/branch.routes.js:116` | — |

### 3.16 Employees — `backend/src/routes/employee.routes.js` (10)

| Method | Path | Auth | Type | Source | Flags |
|---|---|---|---|---|---|
| GET | `/api/employees` | auth (manager) | read | `backend/src/routes/employee.routes.js:111` | — |
| POST | `/api/employees` | auth (manager) | write | `backend/src/routes/employee.routes.js:116` | — |
| PUT | `/api/employees/:id` | auth (manager) | write | `backend/src/routes/employee.routes.js:138` | — |
| PATCH | `/api/employees/:id` | auth (manager) | write | `backend/src/routes/employee.routes.js:139` | — |
| PATCH | `/api/employees/:id/role` | auth (manager) | write | `backend/src/routes/employee.routes.js:141` | body {role} |
| PATCH | `/api/employees/:id/branches` | auth (manager) | write | `backend/src/routes/employee.routes.js:152` | body {branchAccessType, branchIds} |
| PATCH | `/api/employees/:id/password` | auth (self/manage) | write | `backend/src/routes/employee.routes.js:169` | body {newPassword, currentPassword} |
| POST | `/api/employees/:id/suspend` | auth (manager) | write | `backend/src/routes/employee.routes.js:200` | — |
| POST | `/api/employees/:id/reactivate` | auth (manager) | write | `backend/src/routes/employee.routes.js:210` | — |
| DELETE | `/api/employees/:id` | auth (manager) | write | `backend/src/routes/employee.routes.js:220` | — |

### 3.17 Owner — `backend/src/routes/owner.routes.js` (3)

| Method | Path | Auth | Type | Source | Flags |
|---|---|---|---|---|---|
| GET | `/api/owner/dashboard` | auth | read | `backend/src/routes/owner.routes.js:318` | query from/to/branch_id |
| GET | `/api/owner/audit` | auth | read | `backend/src/routes/owner.routes.js:319` | query filters |
| PATCH | `/api/owner/orders/:id/cancel` | auth | write | `backend/src/routes/owner.routes.js:320` | body {reason} |

### 3.18 Template drafts — `backend/src/routes/templateDraft.routes.js` (2)

| Method | Path | Auth | Type | Source | Flags |
|---|---|---|---|---|---|
| POST | `/api/draft` | auth | write | `backend/src/routes/templateDraft.routes.js:13` | body {token, data} |
| GET | `/api/draft/:token` | auth | read | `backend/src/routes/templateDraft.routes.js:20` | — |

### 3.19 Admin revenue — `backend/src/routes/admin.revenue.routes.js` (1)

| Method | Path | Auth | Type | Source | Flags |
|---|---|---|---|---|---|
| GET | `/api/revenue` | auth (super) | read | `backend/src/routes/admin.revenue.routes.js:12` | query restaurantId (required) |

### 3.20 Dashboard theme — `backend/src/routes/dashboardTheme.routes.js` (2)

| Method | Path | Auth | Type | Source | Flags |
|---|---|---|---|---|---|
| GET | `/api/dashboard-theme` | auth | read | `backend/src/routes/dashboardTheme.routes.js:26` | query restaurantId |
| POST | `/api/dashboard-theme` | auth | write | `backend/src/routes/dashboardTheme.routes.js:38` | body theme |

### 3.21 Home video — `backend/src/routes/homeVideo.routes.js` (2)

| Method | Path | Auth | Type | Source | Flags |
|---|---|---|---|---|---|
| GET | `/api/home-video/:lang` | auth (super/admin) | read | `backend/src/routes/homeVideo.routes.js:25` | — |
| POST | `/api/home-video` | auth (super/admin) | write | `backend/src/routes/homeVideo.routes.js:51` | body {lang,url,videoDesktop,videoMobile} |

## 4. Dynamic routes & path parameters

54 endpoints contain dynamic segments. Parameter taxonomy:

| Param | Used by | Meaning |
|---|---|---|
| `:slug` | `/api/public/menu/:slug`, `/api/public/menu/:slug/branches`, `/api/restaurants/slug/:slug`, `/api/restaurants/:id`?, `/api/sites/:slug`, `/api/sites/public/:slug` | Restaurant/site slug or id-like value |
| `:id` | orders, restaurants, sites, branches, employees, owner orders, plans, templates | Entity id |
| `:restaurantId` | orders sales-series, platform subscriptions, platform admin clients details/delete, payments, branches | Restaurant id |
| `:templateId` | `/api/restaurants/:id/templates/:templateId` | Template id |
| `:baseId` | `/api/platform/templates/overrides/:baseId` | Template base id |
| `:requestId` | admin free-plan/paid-subscription approve-reject | Request id |
| `:userId` | `/api/platform/admin/users/:userId` | User id |
| `:lang` | `/api/home-content/:lang`, `/api/home-video/:lang` | Language code (ar/en/ku) |

## 5. Conflicts / duplicate routes / priority notes

- Fastify (find-my-way) prefers static segments over parametric ones, so sibling routes coexist safely:
  - `GET /api/restaurants/slug/:slug` vs `GET /api/restaurants/:id` — static wins for `/slug/...`.
  - `GET /api/orders/sales-series/:restaurantId` vs `GET /api/orders/:id` — static wins for `/sales-series/...`.
  - `GET /api/sites/summary`, `/api/sites`, `/api/sites/can-create` vs `GET /api/sites/:slug` — static wins.
- No exact duplicate (method + path) registrations were found.
- `/api/platform/subscriptions/:restaurantId` (auth, tenant) is intentionally distinct from `/api/platform/subscriptions` (super admin collection).

## 6. Out of scope for this inventory (intentionally not treated as API routes)

- Static file serving: `GET /uploads/*` via `@fastify/static` (prefix `/uploads/`), and frontend static hosting (Hostinger `public_html`).
- Frontend application routes (React SPA) — backend inventory only.

## 7. Known uncertainties / not fully analyzed

- Full request body schemas were recorded only where explicitly visible in route code; several handlers read from `req.body` with partial shapes.
- Response bodies recorded only where directly returned in route code; aggregated responses delegated to services.
- Rate-limit values recorded only for auth-related endpoints in route files.
- Auth behaviour of endpoints delegating auth to `preHandler: fastify.authMiddleware` is enforced centrally.
