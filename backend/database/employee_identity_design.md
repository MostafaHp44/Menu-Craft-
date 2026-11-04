# Employee Identity Design — ARCHITECTURE REVISION (DOCUMENTED ONLY)

Status: DOCUMENTED ONLY. No SQL executed. No table altered. No migration applied. No application code changed. No users, employees, invitations, or test data created.

## Verified identity relationships (from schema + FK + data)

- `Users.id` (PK varchar) — platform account. Has `email` (unique), `password_hash`, `role`, `restaurant_id` (FK → Restaurants). Required for authentication.
- `RestaurantEmployees.id` (PK nvarchar) — restaurant authorization identity. Required: `restaurant_id` (FK Restaurants), `user_id` (FK Users, NOT NULL), `role_id` (FK Roles), `branch_access_type`, `status`, `temporary_password_hash` (nullable), `invited_by`, `invited_at`, `activated_at`, `removed_at`. Existing data: zero rows (verified by SELECT).
- `Employees.id` (PK varchar) — profile-only table. No FK to Users. Has `restaurant_id`, `name`, `email`, `username`, `password_hash`, `role`, `branch_access_type`, `is_active`. Existing service (rewritten earlier) writes here, not to RestaurantEmployees.
- `EmployeeBranchAccess.id` (PK nvarchar) — branch authorization. FK `restaurant_employee_id` → `RestaurantEmployees.id` (strict, verified `FK_EBA_Employee`). FK `branch_id` → `Branches.id`. `allowed` bit. Unique on (restaurant_employee_id, branch_id).
- `Roles.id` (PK nvarchar) — Cashier / Kitchen / Waiter / Owner / Custom Staff.

## Authoritative authorization identity = RestaurantEmployees.id

`BranchAccessResolver.resolveAccess()` uses `EmployeeBranchAccess.restaurant_employee_id`. It expects an existing `RestaurantEmployees` row with a real `Users.id`. It never references `Employees.id`.

## Existing authorization queries (verified sources)

- `backend/src/services/branchAccess.service.js`: queries `EmployeeBranchAccess` by `restaurant_employee_id`; requires `user` with `employeeId`; requires `allowed=1`.
- `backend/src/services/employee.service.js` (rewritten): writes/reads `Employees` profile only. Does not interact with authorization FK.
- `backend/src/middleware/roles.js`: notes staff roles come from `RestaurantEmployees` via `staff.service.js` (not fully implemented in current backend).

Conclusion: any employee creation that needs branch authorization MUST result in a real `RestaurantEmployees.id` linked to a real `Users.id`.

## Critical contradiction in previous proposal

Previous design proposed inserting `RestaurantEmployees` with `user_id = NULL` (pending invitation). Schema verifies `user_id` IS NOT NULL with FK to `Users.id`. That proposal cannot work.

## Option comparison

### Option A: Separate `EmployeeInvitations` + `InvitationBranchAccess` tables (RECOMMENDED)

**Schema impact**: purely additive. Creates `EmployeeInvitations` + `InvitationBranchAccess` (child). Existing `RestaurantEmployees`, `Employees`, `Users`, `EmployeeBranchAccess` unchanged. FK integrity preserved.

**Invitation lifecycle**:
1. Manager creates invitation → writes `EmployeeInvitations` (restaurant_id, invited_email, role_id, branch_access_type, inviter_user_id, token_hash, expires_at, status='pending', created_at).
2. If assigned: writes `InvitationBranchAccess` (invitation_id, branch_id) — pre-stores intended branches safely without touching authorization.
3. Employee opens secure link with token → verifies token hash (constant-time compare), verifies not expired, verifies not already accepted/consumed, verifies email match to invited_email (or claim with existing user verification), verifies restaurant match.
4. In atomic transaction (BEGIN / COMMIT / ROLLBACK):
   - Update invitation: status='accepted', accepted_user_id=<real Users.id>, accepted_at=GETDATE(), consume token (delete or mark consumed).
   - INSERT `RestaurantEmployees` (restaurant_id, user_id=<real>, role_id, branch_access_type, status='active', invited_by=<inviter>, invited_at=<original>, activated_at=GETDATE(), temporary_password_hash=NULL).
   - INSERT `EmployeeBranchAccess` rows for intended branches using the new `RestaurantEmployees.id`.
   - Associate/create `Employees` profile if needed (separate safe step, or part of same transaction if profile is required for UI). Since `Employees` has no authorization FK, it is safe to create/update after authorization is established.
   - If any operation fails: ROLLBACK; invitation stays pending or canceled; no partial authorization created.

**Security**:
- Token stored as cryptographic hash (e.g., SHA-256 of random token). Never expose raw token in DB queries except during verification.
- Token single-use: after acceptance, either delete row or set status='consumed' + consistent-time check prevents replay.
- Expiration enforced at verification time; no expiration = not accepted.
- Email verification: must match invited_email or verified via existing account claim, not via error exposure.
- Cross-restaurant denial: invitation `restaurant_id` must match user’s restaurant claim; no cross-tenant access.
- Cancellation/expiration: only affects invitation; does not activate employee (no RestaurantEmployees created).
- No fixed password created via invitation (temporary_password_hash stays NULL unless separate secure flow is approved later).

**Auditability**:
- `EmployeeInvitations` records entire lifecycle (pending → accepted / canceled / expired).
- `invited_by`, `invited_at`, `accepted_at`, and `RestaurantEmployees` creation timestamp provide full trace.
- Existing `EmployeeBranchAccess` remains untouched until transaction completes.

**Transaction complexity**: one explicit transaction with multiple INSERTs and updates; rollback supported by SQL Server transactions.

**Compatibility with existing authorization**:
- `BranchAccessResolver` reads `RestaurantEmployees.id` from the DB after transaction commits — fully compatible.
- No change to existing `EmployeeBranchAccess` FK.
- Existing `Users` authentication unchanged.

### Option B: Make `RestaurantEmployees.user_id` nullable + store pending invitations directly

**Schema impact**: requires ALTER TABLE on `RestaurantEmployees`; changes NOT NULL to NULL; may affect index/query assumptions; requires justification for allowing authorization identity without a user.

**Problems**:
- A `RestaurantEmployees` row with `user_id = NULL` and `status = 'pending'` could accidentally be matched by authorization queries if `resolveAccess` or staff checks do not filter strictly by `status='active'`. The current `BranchAccessResolver` does not filter on `RestaurantEmployees.status`; it relies on `EmployeeBranchAccess` and `user.employeeId`. If a pending `RestaurantEmployees` ID were inserted into `EmployeeBranchAccess` prematurely, it would grant unauthorized access.
- To prevent this, every authorization query would need to add `JOIN RestaurantEmployees ... WHERE status = 'active'`. That is a broader code change than Option A.
- If an invitation expires, the `RestaurantEmployees` row with NULL user_id must be either deleted (loses audit) or left as orphan (pollutes authorization identity pool).
- Changing a NOT NULL FK column is a structural change with wider impact than creating new tables.

**Verdict**: Option B is less safe, requires structural change, and still requires either a new table for branch intentions or risky generation of `RestaurantEmployees.id` before user acceptance.

## Recommended design — Option A (separate tables)

### Exact proposed additive migration (NOT EXECUTED; requires approval)

```sql
-- 1. Invitation lifecycle (additive, reversible by DROP if needed; no existing row affected)
CREATE TABLE EmployeeInvitations (
    id NVARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
    restaurant_id VARCHAR(36) NOT NULL
        REFERENCES Restaurants(id) ON DELETE CASCADE,
    invited_email NVARCHAR(255) NOT NULL,
    role_id NVARCHAR(36) NOT NULL
        REFERENCES Roles(id),
    branch_access_type NVARCHAR(20) NOT NULL, -- all / assigned / none
    inviter_user_id VARCHAR(36) NOT NULL
        REFERENCES Users(id),
    invitation_token_hash NVARCHAR(64) NOT NULL, -- SHA-256 of secure token, never raw
    token_expires_at DATETIME NOT NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','canceled','expired')),
    accepted_user_id VARCHAR(36) NULL REFERENCES Users(id),
    accepted_at DATETIME NULL,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);

-- 2. Pre-selected branches for a pending invitation (additive; safe before authorization exists)
CREATE TABLE InvitationBranchAccess (
    id NVARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
    invitation_id NVARCHAR(36) NOT NULL
        REFERENCES EmployeeInvitations(id) ON DELETE CASCADE,
    branch_id VARCHAR(36) NOT NULL
        REFERENCES Branches(id),
    allowed BIT NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT GETDATE(),
    UNIQUE (invitation_id, branch_id) -- prevents duplicate intended assignments
);

-- 3. Optional index for lookup by token during verification (read-only; does not change authorization)
CREATE NONCLUSTERED INDEX IX_EmployeeInvitations_Token
    ON EmployeeInvitations(invitation_token_hash, status)
    WHERE status = 'pending';
```

No existing table modified. No foreign key altered. No `RestaurantEmployees.user_id` changed. No `Employees` changed.

### Invitation acceptance transaction (design only)

```sql
BEGIN TRANSACTION;

-- 1. Consume invitation (must be exact single-use check; use hash comparison + status check + expires check)
UPDATE EmployeeInvitations
SET status = 'accepted',
    accepted_user_id = @confirmedUserId,
    accepted_at = GETDATE(),
    updated_at = GETDATE()
WHERE id = @invitationId
  AND status = 'pending'
  AND invitation_token_hash = @tokenHash
  AND token_expires_at > GETDATE();

IF @@ROWCOUNT = 0
    THROW 50001, 'Invitation invalid, expired, or already consumed', 1;

-- 2. Verify email and restaurant (fail closed; do not reveal which condition failed separately)
IF @acceptedEmail NOT IN (SELECT invited_email FROM EmployeeInvitations WHERE id = @invitationId)
    OR @restaurantId <> (SELECT restaurant_id FROM EmployeeInvitations WHERE id = @invitationId)
    THROW 50002, 'Invitation does not match account', 1;

-- 3. Create authorization identity
INSERT INTO RestaurantEmployees (id, restaurant_id, user_id, role_id, branch_access_type, status, invited_by, invited_at, activated_at)
VALUES (@newREId, @restaurantId, @confirmedUserId, @roleId, @branchAccessType, 'active', @inviterId, @originalInvitedAt, GETDATE());

-- 4. Create intended branch assignments using the new authorization id
IF @branchAccessType = 'assigned'
    INSERT INTO EmployeeBranchAccess (id, restaurant_employee_id, branch_id, allowed)
    SELECT NEWID(), @newREId, b.branch_id, 1
    FROM InvitationBranchAccess iba JOIN Branches b ON b.id = iba.branch_id
    WHERE iba.invitation_id = @invitationId AND iba.allowed = 1;

-- 5. If profile table required for UI, create/update Employees (optional, after authorization is guaranteed)
-- Note: Employees.id is independent; if needed for UI only:
INSERT INTO Employees (id, restaurant_id, name, email, username, role, branch_access_type, is_active, created_at)
VALUES (@profileId, @restaurantId, @profileName, @email, @username, @profileRole, @branchAccessType, 1, GETDATE())
ON CONFLICT / MERGE as appropriate;

COMMIT;
```

If any step throws, ROLLBACK executes. `RestaurantEmployees` never exists without valid `Users.id`. `EmployeeBranchAccess` never references non-existent `RestaurantEmployees.id`. Invitation remains untouched until full transaction succeeds.

### Security controls

- Token verification: constant-time comparison (e.g., `crypto.timingSafeEqual` or SQL parameterized comparison). Never expose whether email or restaurant was wrong separately.
- Concurrent consumption: `UPDATE ... WHERE status='pending'` with `@@ROWCOUNT` prevents replay. If two requests arrive simultaneously with same token, only one updates to `accepted`; second gets `@@ROWCOUNT = 0`.
- Expired token: `token_expires_at > GETDATE()` prevents acceptance.
- Canceled invitation: `status='canceled'` prevents acceptance.
- Branch assignment denied if branch does not belong to `restaurant_id` (validated when creating `InvitationBranchAccess` and when inserting `EmployeeBranchAccess`).
- Cross-restaurant denied by `@restaurantId` verification against invitation.
- No authentication bypass: `BranchAccessResolver` continues to verify `Employees` via `RestaurantEmployees.id`; no new authorization path changes.

### Compatibility with BranchAccessResolver

Current `resolveAccess` expects `req.user.employeeId` (from auth middleware / JWT) and searches `EmployeeBranchAccess` by `restaurant_employee_id`. The invitation design keeps that intact because:
- After acceptance, `RestaurantEmployees` has a real `id`.
- `EmployeeBranchAccess` points to that `id`.
- Auth middleware / session can resolve the user's `employeeId` from `RestaurantEmployees.user_id` or from a session claim, unchanged.
- No authorization query changes needed for existing routes.

### Rollback / reversal plan

- To reverse the design: drop `EmployeeInvitations` and `InvitationBranchAccess`. Existing `Employees`, `RestaurantEmployees`, `EmployeeBranchAccess`, `Users` unchanged.
- If an invitation must be canceled after partial acceptance failure (should not happen due to transaction), the invitation remains `pending` or can be set to `canceled` manually; no authorization created.

### Explicit confirmation

- No SQL executed against any table.
- No `ALTER TABLE` applied.
- No migration file written to database folder.
- No `Users`, no `RestaurantEmployees`, no `EmployeeBranchAccess`, no `Employees` records created or deleted.
- No `.env`, no JWT secret, no authorization middleware, no `BranchAccessResolver` code modified.
- Only document created: `backend/database/employee_identity_design.md` (revision appended here).

## Conclusion (for approval decision)

- The smallest safe path is Option A (separate invitation tables) because `user_id` cannot be made nullable safely.
- The full employee lifecycle requires: invitation creation → secure delivery → user account linking/creation → atomic acceptance → authorization identity + branch assignments + profile.
- No execution of the migration or invitation endpoint is performed here because the design requires approval and because `Employees` / `RestaurantEmployees` identity separation must be explicitly confirmed by the project owner before an authorization-connected flow can be deployed.
