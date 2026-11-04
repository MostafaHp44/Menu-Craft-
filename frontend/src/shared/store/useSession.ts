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

export const useSession = create<SessionState>()((set) => ({
  user: null,
  status: 'idle',
  error: null,

  refresh: async () => {
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
      set({ user: null, status: 'ready', error: null })
    }
  },

  setUser: (user) => {
    writeProfile(user)
    set({ user })
  },
  clearError: () => set({ error: null }),
}))

export const STAFF_ROLES: ApiRole[] = ['Owner', 'Cashier', 'Kitchen', 'Waiter']

export function isRole(user: ApiUser | null, ...roles: ApiRole[]): boolean {
  if (!user) return false
  return roles.includes(user.role as ApiRole)
}

export function homePathFor(user: ApiUser | null): string {
  if (!user) return '/workspace/login'
  switch (user.role) {
    case 'Cashier':
      return '/workspace/orders'
    case 'Kitchen':
      return '/workspace/kitchen'
    case 'Waiter':
      return '/workspace/waiter'
    default:
      return '/workspace/overview'
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
