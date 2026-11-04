# Phase — Super Admin Auth Diagnosis (READ-ONLY)

Path: D:\MBN Group\Test Menu
Status: Investigation only; zero code/DB changes.

---

## 1. Root Cause Confirmed

- `RequireAuth.tsx`: `adminOnly` allows `['super_admin','admin']` (line 17). NOT rejecting `super_admin`.
- `isPlatformAdmin()` (`useAuth.ts:367`): `session?.role === 'super_admin' || session?.role === 'admin'` — correct.
- `Admin.tsx`: `authorized = isPlatformAdmin(session) && session?.status === 'active'` — correct.
- `AdminLogin.tsx`: uses `signInWithPassword`; after success checks `isPlatformAdmin(session)`; navigates `/admin`.
- `App.tsx`: `/admin` wrapped in `<RequireAuth adminOnly>` (line 115); `/admin/login` public.
- `auth.service.js` `signin`: selects `role` from `Users` table directly (line 149 `role: user.role`); passes through JWT correctly.
- `useAuth.ts` `signInWithPassword`: maps `res.user.role` to `UserAccount.role` (line 162); preserves `super_admin`.
- `types.ts`: `Role = 'super_admin' | 'admin' | 'worker' | 'client'`.

So the frontend authorization chain is structurally correct.

---

## 2. Why login fails / redirects

Most likely cause: **No Super Admin session exists in frontend store or DB** (or user doesn't know the existing DB seed credentials), and the backend `signin` requires a real `Users` record with a valid password hash.

DB seed (`init.sql` line 299): `super_admin` account exists (`Mostafa Adel`, `super@menucraft.demo`, hash `$2a$12$...`, status `active`, `role='super_admin'`). The hash is a placeholder; it may not match a real password, so `comparePassword` would fail with any typed password.

The `AdminLogin.tsx` calls `signInWithPassword` (real backend auth); if the DB record exists but hash is wrong or account was never created, login fails and stays on `/admin/login` with error message.

---

## 3. Secure Bootstrap Procedure (Requires Approval Before DB Change)

Option A — Use existing DB seed if password is known: try `super@menucraft.demo` with the corresponding password (unknown; hash is placeholder). Not reliable.

Option B — Secure controlled bootstrap (recommended):

1. Confirm DB connection to `menucraft_docker`.
2. Set a real bcrypt hash for `Mostafa Adel` (`super@menucraft.demo`) using secure hash utility (`hashPassword` from `backend/src/utils/hash.js`).
3. Update only that user row: `UPDATE Users SET password_hash = @newHash WHERE email = 'super@menucraft.demo'`.
4. Log in via `AdminLogin.tsx` with that email + set password.
5. Verify `/admin` loads with `isPlatformAdmin` true.

This requires: (a) approval from user, (b) a temporary secure password, (c) no public registration endpoint created.

---

## 4. What Is NOT Broken

- No redirect loop: `/admin/login` is public; `/admin` is protected; `Admin` returns `<AdminLogin />` if not authorized.
- `super_admin` is not converted to `admin` anywhere.
- No hardcoded passwords in source.
- `isPlatformAdmin` correctly includes `super_admin`.

---

## 5. Recommendation Before Any DB Edit

Ask the user explicitly:
- Confirm they want to bootstrap the Super Admin account using the existing DB seed (`Mostafa Adel` / `super@menucraft.demo`).
- Provide a temporary secure password for the bootstrap (or approve a one-time generation).
- Confirm they do not want a separate public registration endpoint (per rules).

Then execute only the `UPDATE` for password hash, test login, and report.

---

## 6. Files Inspected (No Changes)

- `frontend/src/shared/components/RequireAuth.tsx`
- `frontend/src/features/admin/AdminLogin.tsx`
- `frontend/src/features/admin/Admin.tsx`
- `frontend/src/App.tsx`
- `frontend/src/shared/store/useAuth.ts`
- `frontend/src/shared/lib/types.ts`
- `backend/src/services/auth.service.js`
- `backend/src/controllers/auth.controller.js`
- `backend/src/routes/auth.routes.js`
- `backend/database/init.sql` (seed line 299)

---

No modifications made.
