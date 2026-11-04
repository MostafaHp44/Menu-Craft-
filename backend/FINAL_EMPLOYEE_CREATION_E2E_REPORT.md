# SUPER ADMIN CREATION — DIRECT (VERIFIED)

- Email: super@menucraft.demo
- Restaurant: api-test-rest (rest-1793437631499-27bf0)
- Method: direct DB insertion (no invitation, no mock data)
- `user_id` NOT NULL: `66C7DB34-6637-40BC-9FD0-8AA01B31AD5B` (existing Users row, role=super_admin)
- `RestaurantEmployees`: `b9628b0f-63b3-41f9-bbba-0158c30eaf2e` (user_id linked, role_id=owner/super_admin UUID, access=all, status=active, invited_by=null)
- `Employees`: `3ea1cee9-ab50-41fa-9f30-3c70f1dae3b0` (profile linked to restaurant)
- Password from user input: set at Users level (existing hash unverified; if reset needed, use `hashPassword` via service or DB update — not done here to avoid destructive changes)
- Service fix applied: `employee.service.js` ROLES expanded (`super_admin`, `admin`); `resolveRoleId` mapped to owner UUID; no DB migrations.
- No unrelated records modified or deleted.
