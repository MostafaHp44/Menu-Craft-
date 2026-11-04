# Phase 6 — Task 4.1: Database Security & Backup/Restore Audit

**Read-only audit** — no files modified, no database operations performed.

---

## 1. Database Configuration

### Environment Variables (`src/.env`)

| Variable | Value | Notes |
|---|---|---|
| `DB_HOST` | `localhost` | Defaults to localhost; no production host configured |
| `DB_PORT` | `1433` | MSSQL default port |
| `DB_USER` | `sa` | **CRITICAL** — uses `sa` (system administrator) account |
| `DB_PASSWORD` | `YourStrong@Passw0rd` | Placeholder password; gitignored but still a concern if committed |
| `DB_NAME` | `menucraft_docker` | Database name |
| `REDIS_HOST` | `127.0.0.1` | |
| `REDIS_PORT` | `6379` | |
| `REDIS_PASSWORD` | *(empty)* | Redis bound to localhost only |
| `JWT_ACCESS_SECRET` | `change_this_access_secret_to_something_long_and_random` | Placeholder — validated in app.js |
| `JWT_REFRESH_SECRET` | `change_this_refresh_secret_to_something_long_and_random` | Placeholder — validated in app.js |
| `CORS_ORIGIN` | `http://localhost:5173` | |

### Database Connection Configuration (`src/config/db.js`)

```javascript
const config = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'YourStrong@Passw0rd',
  database: process.env.DB_NAME || 'menucraft',
  server: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 1433,
  pool: {
    max: 10,
    min: 2,
    idleTimeoutMillis: 30000,
    acquireTimeoutMillis: 30000
  },
  options: {
    encrypt: false,                 // No SSL/TLS
    trustServerCertificate: true    // No certificate validation
  }
};
```

**Critical Configuration Issues:**

| Issue | Severity | Details |
|---|---|---|
| **`sa` account usage** | 🔴 **High** | `DB_USER=sa` grants `sysadmin` role — full database control, security risk |
| **Hardcoded placeholder credentials** | 🟠 **Medium** | `.env` has placeholder passwords; if committed to repo, critical exposure |
| **No production DB config separation** | 🟠 **Medium** | Same `.env` file used for development; no production-specific vars |
| **No SSL/encryption** | 🟠 **Medium** | `encrypt: false`, `trustServerCertificate: true` — no TLS in development |
| **Empty Redis password** | 🟢 **Low** | `REDIS_PASSWORD=` empty; Redis bound to localhost only |

---

## 2. Database Permissions

The application connects to MSSQL using the `sa` (system administrator) account via `DB_USER=sa`.

**Permissions granted by `sa`:**
- `db_owner` — full access to all databases
- `dbcreator` — create new databases
- `bulkadmin` — bulk copy operations
- `admin::` — almost all server-level permissions

**Principle of least privilege** — **NOT** followed.

**Recommendation:** Use a dedicated non-admin database user with only the specific permissions needed (e.g., `SELECT`, `INSERT`, `UPDATE`, `DELETE` on specific tables, `EXECUTE` on stored procedures).

---

## 3. SQL Injection Audit

**Method:** Inspected all `.js` files in `src/` for raw SQL queries, string concatenation, dynamic SQL, and unparameterized queries.

### Findings: All `.query()` calls use parameterized `@param` syntax

Every database query in the codebase uses the `mssql` package's parameterized query interface with `@variableName` placeholders. **No** raw SQL string concatenation with user input was found.

| File | Query Pattern | Safe |
|------|--------------|------|
| `src/services/auth.service.js` | `.query('SELECT id FROM Users WHERE email = @email')` | ✅ |
| `src/services/auth.service.js` | `.query('SELECT id FROM Restaurants WHERE slug = @slug')` | ✅ |
| `src/services/site.service.js` | `.query('SELECT TOP 1 id FROM Users WHERE id = @userId AND restaurant_id = @restaurantId')` | ✅ |
| `src/services/order.service.js` | `.query('SELECT * FROM Orders WHERE idempotency_key = @key')` | ✅ |
| `src/services/payment.service.js` | `.query('UPDATE Payments SET status = @status WHERE stripe_payment_id = @stripePaymentId')` | ✅ |
| `src/services/platfrom.service.js` | `.query('SELECT id, plan_name, price, status, renews_at, auto_renew FROM Subscriptions WHERE restaurant_id = @restaurantId')` | ✅ |
| `src/services/restaurant.service.js` | `.query('SELECT * FROM Restaurants WHERE id = @id')` | ✅ |
| `src/services/template.service.js` | `.query('SELECT id FROM Templates WHERE name = @name')` | ✅ |

### Controlled Dynamic SQL (SAFE)

One dynamic `UPDATE` statement was found:

```javascript
// src/services/platform.service.js
const sets = [];
const add = (column, type, value) => {
  sets.push(`${column} = @${column}`);  // column name is controlled
  req.input(column, type, value);        // value is parameterized
};
// populating sets from patch object properties only
if (patch.plan !== undefined) add('plan_name', sql.NVarChar, patch.plan);
// ... more conditional adds
await req.query(`UPDATE Subscriptions SET ${sets.join(', ')} WHERE restaurant_id = @restaurantId`);
```

**Verdict:** **SAFE** — Column names are from a controlled set (`plan_name`, `price`, `status`, `renews_at`, `auto_renew`, `updated_at`), and all values are properly parameterized via `req.input()`.

### SQL Injection Risk Classification

| Pattern | Status |
|---|---|
| Raw SQL queries (no params) | ❌ Not found |
| String concatenation in SQL with user input | ❌ Not found |
| Dynamic SQL with user-controlled table/column names | ❌ Not found |
| Unparameterized queries | ❌ Not found |
| User-controlled table/column names in queries | ❌ Not found |
| **Overall SQL Injection Risk** | **LOW** |

**Note:** The `sa` account means any future SQL injection would have catastrophic full-database compromise, but no unsafe patterns currently exist in the codebase.

---

## 4. Database Integrity

### Verified Relationships from Code Inspection

| Relationship | File/Line | Description |
|---|---|---|
| `Users ↔ UserRestaurants` (1:N) | `src/services/site.service.js:37` | `JOIN UserRestaurants ur ON ur.restaurant_id = r.id AND ur.user_id = @userId` |
| `Restaurants ↔ UserRestaurants` (1:N) | `src/services/site.service.js:37` | Junction table for many-to-many user-site relationships |
| `Users ↔ Restaurants` (optional 1:1) | `src/services/restaurant.service.js:162` | `UPDATE Users SET restaurant_id = COALESCE(restaurant_id, @restaurantId) WHERE id = @userId` |
| `Subscriptions ↔ Restaurants` (1:1) | `src/services/platform.service.js:168` | `SELECT id, plan_name, price, status, renews_at, auto_renew FROM Subscriptions WHERE restaurant_id = @restaurantId` |
| `Orders ↔ OrderLines` (1:N) | `src/services/order.service.js:493` | `SELECT item_id AS itemId, item_name AS name, price, qty, options FROM OrderLines WHERE order_id = @id` |
| `Payments ↔ Orders` (1:N) | `src/services/payment.service.js:242` | `SELECT id, restaurant_id, total, currency, payment_status FROM Orders WHERE id = @id` |

### Integrity Risks

| Risk | Severity | Description |
|---|---|---|
| **`sa` account** | 🔴 **High** | Any integrity violation has full database impact |
| **No foreign key verification in code** | 🟡 **Medium** | Code uses parameterized queries but foreign key constraints not verified in application logic |
| **No tenant isolation** | 🟡 **Medium** | No `tenant_id` column observed; all data shared in single database `menucraft_docker` |
| **Cascade delete behavior** | 🟢 **Low** | Cannot verify without running DB queries; depends on DB schema |

### Tenant Relationships

The codebase uses `restaurant_id` as the primary tenancy identifier. Each user can have multiple restaurants via the `UserRestaurants` junction table. No `tenant_id` column observed in any table — tenancy is enforced via `restaurant_id` filtering in queries.

---

## 5. Backup & Restore

### Inspection Results

| Component | Status |
|---|---|
| **Backup scripts** | ❌ Not found in codebase |
| **Docker volumes** | ❌ Not found; no `docker-compose.yml` or `Dockerfile` in backend |
| **Backup documentation** | ❌ Not found |
| **Backup schedules** | ❌ Not documented |
| **Restore procedures** | ❌ Not documented |
| **Real backup/restore test** | ❌ Never verified |

### Docker Configuration

No Docker configuration files found in the backend directory. The `.env` file references `menucraft_docker` as the database name, and a Redis container was observed running (`menucraft-redis`), but no `docker-compose.yml` or `Dockerfile` exists in the backend source tree.

### Backup/Restore Evidence

- **Zero evidence** of verified backup and restore operations
- No backup scripts, cron jobs, or scheduled tasks found
- No restore test records or procedures
- **CRITICAL RISK:** No verified backup existence — data loss would be irreversible

---

## 6. Final Classification

| Finding | Classification | Evidence |
|---|---|---|
| **SQL Injection Risk** | **PASS** | All queries use parameterized `@param` syntax; no unsafe patterns found |
| **Database Integrity (code-level)** | **PASS** | Parameterized queries; no raw SQL; relationships verified in code |
| **Database Permissions — `sa` account** | **FAIL** | `DB_USER=sa` uses `sysadmin` role — violates principle of least privilege |
| **Production DB config separation** | **NEEDS IMPROVEMENT** | Same `.env` used for dev/prod; no production-specific variables |
| **SSL/TLS for MSSQL** | **NEEDS IMPROVEMENT** | `encrypt: false`, `trustServerCertificate: true` — no encryption |
| **Backup/Restore verification** | **FAIL** | No backup scripts, no documented procedures, no verified restore tests |
| **Redis production validation** | **PASS** | `REDIS_HOST` required in production; no silent localhost default |

### Critical Risks (Ordered by Priority)

| Priority | Risk | Recommendation |
|---|---|---|
| **1** | **`sa` account usage** | Create a dedicated database user with minimum required permissions (`db_datareader`, `db_datawriter`, `EXECUTE` on stored procedures only). Do not use `sa` in production. |
| **2** | **No backup/restore verification** | Implement automated backup schedule, test restore procedures, and document retention policies. This is the highest operational risk. |
| **3** | **No SSL/TLS for MSSQL** | Set `encrypt: true` and `trustServerCertificate: false` for production; use valid TLS certificates. |
| **4** | **No production DB config separation** | Create production-specific `.env` or configuration with separate `DB_HOST`, `DB_USER`, `DB_PASSWORD` for production environment. |
| **5** | **Empty Redis password** | Set `REDIS_PASSWORD` for production Redis; do not rely on `REDIS_ALLOW_NO_AUTH=true` unless Redis is behind private networking/firewall. |

### Recommendations Summary

1. **Immediate:** Replace `sa` account with dedicated database user having minimal permissions
2. **High Priority:** Implement automated database backups and test restore procedures
3. **Medium Priority:** Enable SSL/TLS for MSSQL connection
4. **Medium Priority:** Separate production database configuration from development
5. **Low Priority:** Set Redis password for production deployments

### Final Status

- **SQL Injection Risk:** **LOW** — code is secure against injection
- **Database Permissions:** **FAIL** — critical `sa` account usage
- **Backup/Restore:** **FAIL** — no verified backup procedures
- **Overall Database Security:** **NEEDS SIGNIFICANT IMPROVEMENT**