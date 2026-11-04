import { create } from 'zustand'

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
}

/** Non-sensitive hint that a backend cookie probably exists (the cookie itself is HttpOnly). */
const AUTH_HINT_KEY = 'menucraft.backend.authed'

function hasAuthHint(): boolean {
  try {
    return localStorage.getItem(AUTH_HINT_KEY) === '1'
  } catch {
    return false
  }
}

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

export const useBackendAuth = create<BackendAuthState>()((set) => ({
  user: null,
  status: 'idle',

  refresh: async () => {
    // Guests never hit /api/auth/me, so the console stays clean.
    if (!hasAuthHint()) {
      set({ user: null, status: 'ready' })
      return null
    }
    set({ status: 'loading' })

    const readUser = async (): Promise<{ ok: boolean; user: BackendUser | null }> => {
      const res = await fetch('/api/auth/me', { credentials: 'include' })
      if (!res.ok) return { ok: false, user: null }
      const payload = await readJson(res)
      return { ok: true, user: payload?.data?.user ?? payload?.user ?? null }
    }

    try {
      let result = await readUser()

      // access_token only lives 15 minutes — renew it from the refresh cookie
      // instead of dropping the session.
      if (!result.ok) {
        const refresh = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        })
        if (refresh.ok) result = await readUser()
      }

      if (!result.ok) {
        setAuthHint(false)
        set({ user: null, status: 'ready' })
        return null
      }

      set({ user: result.user, status: 'ready' })
      return result.user
    } catch {
      set({ user: null, status: 'ready' })
      return null
    }
  },

  signin: async (email, password) => {
    set({ status: 'loading' })
    const res = await fetch('/api/auth/signin', {
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
    const res = await fetch('/api/auth/signup', {
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
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
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
