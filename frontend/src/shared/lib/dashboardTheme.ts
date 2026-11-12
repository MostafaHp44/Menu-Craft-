import { useEffect } from 'react'
import { apiUrl } from '../api/url.ts'
import { create } from 'zustand'
import { useBackendAuth } from '../store/useBackendAuth'

/**
 * Dashboard-only visual identity (text / background / border colors).
 * Stored in DashboardThemes and completely independent from the restaurant
 * template colours that live in the restaurant design object.
 */
export interface DashboardTheme {
  text?: string
  background?: string
  border?: string
}

type ThemeStatus = 'idle' | 'loading' | 'ready' | 'saving'

interface DashboardThemeState {
  theme: DashboardTheme
  status: ThemeStatus
  load: (restaurantId: string) => Promise<void>
  save: (restaurantId: string, theme: DashboardTheme) => Promise<void>
  reset: () => void
}

const DEFAULT_THEME: DashboardTheme = {}

function applyTheme(theme: DashboardTheme) {
  const root = document.documentElement
  if (theme.text) root.style.setProperty('--dash-text', theme.text)
  else root.style.removeProperty('--dash-text')
  if (theme.background) root.style.setProperty('--dash-bg', theme.background)
  else root.style.removeProperty('--dash-bg')
  if (theme.border) root.style.setProperty('--dash-border', theme.border)
  else root.style.removeProperty('--dash-border')
}

export const useDashboardThemeStore = create<DashboardThemeState>()((set) => ({
  theme: DEFAULT_THEME,
  status: 'idle',

  load: async (restaurantId) => {
    if (!restaurantId) return
    set({ status: 'loading' })
    try {
      const res = await fetch(apiUrl('/api/dashboard-theme?restaurantId=') + encodeURIComponent(restaurantId), {
        credentials: 'include',
      })
      if (!res.ok) {
        set({ status: 'ready' })
        return
      }
      const payload = await res.json().catch(() => null)
      const theme = (payload?.data || {}) as DashboardTheme
      applyTheme(theme)
      set({ theme, status: 'ready' })
    } catch {
      set({ status: 'ready' })
    }
  },

  save: async (restaurantId, theme) => {
    if (!restaurantId) return
    set({ status: 'saving', theme })
    applyTheme(theme)
    try {
      const res = await fetch(apiUrl('/api/dashboard-theme'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId, theme }),
      })
      if (!res.ok) throw new Error('save failed')
      set({ status: 'ready' })
    } catch {
      set({ status: 'ready' })
      throw new Error('save failed')
    }
  },

  reset: () => {
    applyTheme(DEFAULT_THEME)
    set({ theme: DEFAULT_THEME, status: 'ready' })
  },
}))

/** Loads the signed-in restaurant's dashboard theme once per session. */
export function useDashboardTheme(): DashboardTheme {
  const user = useBackendAuth((s) => s.user)
  const backendStatus = useBackendAuth((s) => s.status)
  const restaurantId = user?.restaurant_id || user?.restaurantId || ''
  const load = useDashboardThemeStore((s) => s.load)
  const theme = useDashboardThemeStore((s) => s.theme)

  useEffect(() => {
    if (backendStatus !== 'ready' || !restaurantId) return
    void load(restaurantId)
  }, [backendStatus, restaurantId, load])

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  return theme
}
