# API Coverage Report — MenuCraft Backend

> Generated 2026-11-12 from static code inspection (no requests executed).
> Source of truth: `backend/src`. Machine-readable copy: `performance-testing/routes.json`.

## 1. Headline numbers

| Metric | Value |
|---|---|
| Route modules containing route registrations (discovered) | **22** |
| HTTP endpoints discovered | **116** |
| Endpoints by HTTP method | GET **57** + POST **28** + PUT **6** + PATCH **16** + DELETE **9** |
| Public endpoints | **23** |
| Authenticated endpoints | **93** |
| Read-only endpoints | **57** |
| Write endpoints | **59** |
| Endpoints with dynamic path params | **54** |
| Endpoints rate-limited | **5** |
| Endpoints behind subscription gate | **2** |
| Endpoints with external dependencies | **7** |
| Endpoints touching the database | **112** |
| Endpoints with recorded request body schema | **10** |
| Endpoints with recorded response body | **110** |
| Endpoints with recorded query params | **11** |

## 2. Public vs authenticated split

- **Public (23):** health (3), auth entry points (5), public restaurant/site/menu reads, guest ordering + payment-intent + Stripe webhook, home content/plans/templates lists.
- **Authenticated (93):** all owner/manager/employee/restaurant-scoped writes & reads, platform management (super admin), billing status/checkout, content updates, etc.

## 3. Super admin / platform staff surface

- Endpoints flagged for `super_admin` (requiring auth): **53**.
- Platform staff (`super_admin` / `admin`) content-write surface: home-content patch, home-video write, template admin operations.

## 4. Read vs write

- Read-only: 57 endpoints.
- Write: 59 endpoints (including public writes: signup, signin, refresh, logout, guest order, order pay, Stripe webhook).

## 5. Dynamic routes

- **54 endpoints** use path parameters.
- Param names observed: `:slug`, `:id`, `:restaurantId`, `:templateId`, `:baseId`, `:requestId`, `:userId`, `:lang`.

## 6. Reliability / external dependencies

- External dependency endpoints: **7** — translation service, orders (external payment intents), order pay, Stripe webhook, billing checkout, billing status, home video.
- DB-touching: **112** of 116 endpoints.

## 7. Gaps & notes for k6 generation

- Machine-readable endpoint metadata (method, path, fullUrl, auth, roles, query, pathParams, body, response, dbOperations, externalDependencies, readOnly, rateLimit, subscriptionGate) is in `performance-testing/routes.json` — ready to drive k6 scripts.
- Static serving (`/uploads/*`) excluded from dynamic route count.
- Coverage is backend-only; frontend route coverage is tracked separately via browser tests (see `k6/scripts/frontend-home-browser-test.js`).
- Endpoints not fully schema-annotated (body/response) should be refined before generating load tests for write paths.

## 8. Next step

- Generate backend all-routes k6 smoke test from `routes.json` and execute (pending user direction).
