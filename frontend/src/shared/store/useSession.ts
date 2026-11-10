import { create } from 'zustand'
import { authApi, errorMessage, type ApiRole, type ApiUser } from '../api/client.ts'

export type LoginMode = 'owner' | 'employee'

/**
 * `/api/auth/me` returns id/email/role only. The login response also carries
 * name, status and the temporary-password flag, so keep them for this tab.
 */
const PROFILE_KEY = 'menucraft.live.profile'

function readProfile(): ApiUser | null {
  try {
    const raw = sessionStorage.getItem(PROFILE_KEY)
    return raw ? (JSON.parse(raw) as ApiUser) : null
  } catch {
    return null
  }
}

function writeProfile(user: ApiUser | null) {
  try {
    if (user) sessionStorage.setItem(PROFILE_KEY, JSON.stringify(user))
    else sessionStorage.removeItem(PROFILE_KEY)
  } catch {
    /* private mode — the session still works, only the extras are lost */
  }
}

function withProfile(user: ApiUser): ApiUser {
  const stored = readProfile()
  if (!stored || stored.id !== user.id) return user
  return {
    ...user,
    name: user.name ?? stored.name,
    status: user.status ?? stored.status,
    needsPasswordChange: stored.needsPasswordChange ?? false,
    restaurant_id: user.restaurant_id ?? stored.restaurant_id,
  }
}

interface SessionState {
  user: ApiUser | null
  /** idle = never checked this page load */
  status: 'idle' | 'loading' | 'ready'
  error: string | null
  refresh: () => Promise<ApiUser | null>
  login: (mode: LoginMode, email: string, password: string) => Promise<ApiUser>
  logout: () => Promise<void>
  setUser: (user: ApiUser | null) => void
  clearError: () => void
}

/**
 * Single-flight guard for refresh().
 *
 * The access token lives 15 minutes and the refresh cookie is single-use
 * (rotated on every use). React StrictMode mounts effects twice in dev and
 * several components call refresh() on the same screen — without sharing one
 * in-flight promise, concurrent calls race the cookie jar, the loser gets
 * 401 and wipes a valid session — the "page keeps restarting" flicker.
 * (Mirrors the same guard in useBackendAuth.)
 */
let refreshInFlight: Promise<ApiUser | null> | null = null

export const useSession = create<SessionState>()((set) => ({
  user: null,
  status: 'idle',
  error: null,

  refresh: async () => {
    if (refreshInFlight) return refreshInFlight
    const run = (async () => {
      set({ status: 'loading', error: null })
      try {
        const user = withProfile(await authApi.me())
        writeProfile(user)
        set({ user, status: 'ready' })
        return user
      } catch {
        set({ user: null, status: 'ready' })
        return null
      }
    })()
    refreshInFlight = run
    try {
      return await run
    } finally {
      if (refreshInFlight === run) refreshInFlight = null
    }
  },

  login: async (mode, email, password) => {
    set({ status: 'loading', error: null })
    try {
      const result = mode === 'owner' ? await authApi.login(email, password) : await authApi.employeeLogin(email, password)
      writeProfile(result.user)
      set({ user: result.user, status: 'ready', error: null })
      return result.user
    } catch (error) {
      const message = errorMessage(error)
      set({ status: 'ready', error: message })
      throw error
    }
  },

  logout: async () => {
    try {
      await authApi.logout()
    } finally {
      writeProfile(null)
      // idle (مش ready): الـ PanelGate التالي يجب أن يتحقق من الكوكي من جديد
      // بدل أن يردّ فوراً بدون تحقق فيدخل في loop بعد التسجيل
      set({ user: null, status: 'idle', error: null })
    }
  },

  setUser: (user) => {
    writeProfile(user)
    set({ user, status: user ? 'ready' : 'idle' })
  },
  clearError: () => set({ error: null }),
}))

export const STAFF_ROLES: ApiRole[] = ['Owner', 'Cashier', 'Kitchen', 'Waiter']

export function isRole(user: ApiUser | null, ...roles: ApiRole[]): boolean {
  if (!user) return false
  return roles.includes(user.role as ApiRole)
}

function normalizeRole(role: string | undefined): string | undefined {
  if (!role) return role;
  const r = role.toLowerCase();
  if (r === 'owner' || r === 'client') return 'Owner'
  if (r === 'cashier') return 'Cashier'
  if (r === 'kitchen') return 'Kitchen'
  if (r === 'waiter') return 'Waiter'
  if (r === 'super_admin' || r === 'admin') return r // keep as is
  return role
}

export function homePathFor(user: ApiUser | null): string {
  if (!user) return '/workspace/login'
  const role = normalizeRole(user.role as string | undefined)
  switch (role) {
    case 'Cashier':
      return '/workspace/orders'
    case 'Kitchen':
      return '/workspace/kitchen'
    case 'Waiter':
      return '/workspace/waiter'
    // فصل تام: صاحب المطعم يذهب إلى لوحته مباشرة
    case 'Owner':
      return '/dashboard'
    case 'super_admin':
    case 'admin':
      return '/admin'
    default:
      // دور غير معروف — لا يفتح أي لوحة
      return '/'
  }
}

export function roleLabelKey(role: string | undefined): string {
  switch (role) {
    case 'Owner':
      return 'live.roles.owner'
    case 'Cashier':
      return 'live.roles.cashier'
    case 'Kitchen':
      return 'live.roles.kitchen'
    case 'Waiter':
      return 'live.roles.waiter'
    default:
      return 'live.common.unknown'
  }
}
