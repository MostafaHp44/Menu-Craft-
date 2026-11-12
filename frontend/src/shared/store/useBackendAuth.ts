import { create } from 'zustand'
import { apiUrl } from '../api/url.ts'

/**
 * Real backend session (HttpOnly cookies).
 *
 * The marketing/dashboard stores are still prototype-local. This store is the
 * single source of truth for anything that talks to the real API, because the
 * backend authenticates with HttpOnly cookies and returns the tenant id in the
 * JWT payload — never from localStorage.
 */
export interface BackendUser {
  id: string
  name?: string | null
  email: string
  role?: string | null
  restaurant_id?: string | null
  restaurantId?: string | null
  /** أول onboarding: وضع المطعم — static (تصميم فقط) / live (طلبات كاملة) */
  mode?: 'static' | 'live' | null
}

/** Non-sensitive hint that a backend cookie probably exists (the cookie itself is HttpOnly). */
const AUTH_HINT_KEY = 'menucraft.backend.authed'

function setAuthHint(on: boolean) {
  try {
    if (on) localStorage.setItem(AUTH_HINT_KEY, '1')
    else localStorage.removeItem(AUTH_HINT_KEY)
  } catch {
    /* private mode — refresh simply stays a no-op */
  }
}

interface BackendAuthState {
  user: BackendUser | null
  /** idle = never checked this page load */
  status: 'idle' | 'loading' | 'ready'
  refresh: () => Promise<BackendUser | null>
  signin: (email: string, password: string) => Promise<BackendUser>
  signup: (input: {
    email: string
    password: string
    name: string
    restaurantName: string
    templateId?: string
    language?: 'ar' | 'en' | 'ku'
    /** أول onboarding: النوع (Live Digital Menu / Static) */
    mode?: 'static' | 'live'
    /** أول onboarding: معرّف الباقة المختارة */
    planId?: string
  }) => Promise<BackendUser>
  logout: () => Promise<void>
  setUser: (user: BackendUser | null) => void
}

async function readJson(res: Response): Promise<any> {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function messageOf(payload: any, fallback: string): string {
  return payload?.error || payload?.message || fallback
}

/** Re-read the session, renewing the 15-minute access token when needed. */
async function doRefresh(
  set: (partial: Partial<BackendAuthState>) => void
): Promise<BackendUser | null> {
  // Guests never hit /api/auth/me, so the console stays clean.
  set({ status: 'loading' })

  const readUser = async (): Promise<{ ok: boolean; user: BackendUser | null }> => {
    const res = await fetch(apiUrl('/api/auth/me'), { credentials: 'include' })
    if (!res.ok) return { ok: false, user: null }
    const payload = await readJson(res)
    return { ok: true, user: payload?.data?.user ?? payload?.user ?? null }
  }

  try {
    let result = await readUser()

    // access_token only lives 15 minutes — renew it from the refresh cookie
    // instead of dropping the session.
    if (!result.ok) {
      const refresh = await fetch(apiUrl('/api/auth/refresh'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })
      if (refresh.ok) {
        result = await readUser()
      } else {
        // The refresh token is single-use: another tab may have rotated the
        // shared cookies a moment ago. Re-read before declaring the session
        // dead — the new cookies are already in the jar.
        result = await readUser()
      }
    }

    if (!result.ok) {
      setAuthHint(false)
      set({ user: null, status: 'ready' })
      return null
    }

    setAuthHint(true)
    set({ user: result.user, status: 'ready' })
    return result.user
  } catch {
    // Transient network failure — keep the hint so the next load can recover.
    setAuthHint(false)
    set({ user: null, status: 'ready' })
    return null
  }
}

/**
 * Single-flight guard for refresh().
 *
 * The refresh token is single-use (revoked by the backend on use), while the
 * cookie jar is shared: React StrictMode mounts effects twice in dev and every
 * open tab bootstraps on load. Concurrent refreshes therefore race — the loser
 * gets 401 and would otherwise wipe a perfectly valid session.
 */
let refreshInFlight: Promise<BackendUser | null> | null = null

export const useBackendAuth = create<BackendAuthState>()((set) => ({
  user: null,
  status: 'idle',

  refresh: async () => {
    if (refreshInFlight) return refreshInFlight
    const run = doRefresh(set)
    refreshInFlight = run
    try {
      return await run
    } finally {
      if (refreshInFlight === run) refreshInFlight = null
    }
  },

  signin: async (email, password) => {
    set({ status: 'loading' })
    const res = await fetch(apiUrl('/api/auth/signin'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const payload = await readJson(res)
    if (!res.ok) {
      set({ status: 'ready' })
      throw new Error(messageOf(payload, 'Sign in failed'))
    }
    const user: BackendUser | null = payload?.user ?? payload?.data?.user ?? null
    setAuthHint(true)
    set({ user, status: 'ready' })
    return user as BackendUser
  },

  signup: async (input) => {
    set({ status: 'loading' })
    const res = await fetch(apiUrl('/api/auth/signup'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    const payload = await readJson(res)
    if (!res.ok) {
      set({ status: 'ready' })
      throw new Error(messageOf(payload, 'Sign up failed'))
    }
    const user: BackendUser | null = payload?.user ?? payload?.data?.user ?? null
    setAuthHint(true)
    set({ user, status: 'ready' })
    return user as BackendUser
  },

  logout: async () => {
    try {
      await fetch(apiUrl('/api/auth/logout'), { method: 'POST', credentials: 'include' })
    } finally {
      setAuthHint(false)
      set({ user: null, status: 'ready' })
    }
  },

  setUser: (user) => set({ user }),
}))

/** Tenant id for API calls: backend JWT first, then an explicit fallback. */
export function useBackendRestaurantId(fallback?: string): string {
  return useBackendAuth((s) => s.user?.restaurant_id || s.user?.restaurantId || fallback || '')
}
