/**
 * Role-based authorization guards.
 *
 * The access token already carries `{ userId, email, role, restaurantId }`
 * (`src/utils/token.js`), so role checks are pure and cheap — no DB hit.
 * Platform roles live in `Users.role`; restaurant staff roles are resolved
 * separately by `staff.service.js` (they come from `RestaurantEmployees`).
 *
 * Two shapes:
 *   - `requireRole('super_admin')`  → Fastify `preHandler` (run after `authMiddleware`)
 *   - `assertRole(request, reply, 'super_admin')` → boolean, for use *inside* a
 *     handler when the decision depends on request data (e.g. "owner OR admin").
 *
 * Never weaken these to `client`-allows-all: the whole point is that a normal
 * client/employee cannot reach platform administration.
 */

/** Platform roles as stored in `Users.role`. */
const PLATFORM_ROLES = Object.freeze({
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  CLIENT: 'client',
  WORKER: 'worker'
});

/**
 * `Users.role` is NVARCHAR free text — normalise the handful of spellings that
 * have historically appeared so a stray `SuperAdmin` never bypasses a guard.
 */
function normalizeRole(role) {
  if (typeof role !== 'string') return '';
  const value = role.trim().toLowerCase();
  if (value === 'superadmin' || value === 'super-admin') return PLATFORM_ROLES.SUPER_ADMIN;
  if (value === 'administrator' || value === 'superadmin ') return PLATFORM_ROLES.ADMIN;
  if (value === 'owner') return PLATFORM_ROLES.CLIENT;
  return value;
}

function currentRole(request) {
  return normalizeRole(request?.user?.role);
}

function roleError(reply, message, code) {
  reply.status(403).send({ ok: false, error: message, code });
  return false;
}

/**
 * @param {...string} roles allowed platform roles (normalised before compare)
 * @returns Fastify preHandler
 */
function requireRole(...roles) {
  const allowed = roles.map(normalizeRole);
  return async function roleGuard(request, reply) {
    const role = currentRole(request);
    if (!role || !allowed.includes(role)) {
      return roleError(
        reply,
        'هذه العملية غير مسموحة لحسابك',
        allowed.includes(PLATFORM_ROLES.SUPER_ADMIN) ? 'ADMIN_ONLY' : 'FORBIDDEN'
      );
    }
    return undefined;
  };
}

/**
 * In-handler variant: returns `true` when allowed, otherwise sends 403 and
 * returns `false` so the caller can `return` early.
 */
function assertRole(request, reply, ...roles) {
  const allowed = roles.map(normalizeRole);
  const role = currentRole(request);
  if (role && allowed.includes(role)) return true;
  return roleError(
    reply,
    'هذه العملية غير مسموحة لحسابك',
    allowed.includes(PLATFORM_ROLES.SUPER_ADMIN) ? 'ADMIN_ONLY' : 'FORBIDDEN'
  );
}

/** Super admin only — platform management (plans, clients, subscriptions, content). */
function requireSuperAdmin(...rest) {
  return requireRole(PLATFORM_ROLES.SUPER_ADMIN, ...rest);
}

/**
 * Platform staff: super admin or admin. Used for read-only platform listings
 * that a client must never see, while still allowing the `admin` role that the
 * seeded accounts use.
 */
function requirePlatformStaff(...rest) {
  return requireRole(PLATFORM_ROLES.SUPER_ADMIN, PLATFORM_ROLES.ADMIN, ...rest);
}

module.exports = {
  PLATFORM_ROLES,
  normalizeRole,
  currentRole,
  requireRole,
  assertRole,
  requireSuperAdmin,
  requirePlatformStaff
};
