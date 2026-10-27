import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DemoPlanId, Restaurant } from '../lib/types'
import { ACTIVE_RESTAURANT_ID, createSeedRestaurants } from '../lib/demoData'
import { getTemplate } from '../lib/templates'

export type ToastTone = 'success' | 'info' | 'error'

export interface ToastMessage {
  id: number
  title: string
  message?: string
  tone: ToastTone
}

interface AppState {
  /** saved (published or draft) restaurant configurations */
  restaurants: Restaurant[]
  activeId: string
  /** working copy used by the visual editor */
  draft: Restaurant | null
  dirty: boolean
  past: Restaurant[]
  future: Restaurant[]
  lastHistoryPush: number
  toast: ToastMessage | null

  setActive: (id: string) => void
  beginEdit: (templateId?: string) => void
  updateDraft: (recipe: (draft: Restaurant) => void) => void
  replaceDraft: (next: Restaurant) => void
  undo: () => void
  redo: () => void
  saveDraft: () => void
  publishDemo: () => void
  discardDraft: () => void
  resetDesign: () => void
  updateSaved: (recipe: (restaurant: Restaurant) => void, id?: string) => void
  setPlan: (plan: DemoPlanId) => void
  resetDemo: () => void
  showToast: (toast: Omit<ToastMessage, 'id'>) => void
  hideToast: () => void
}

const HISTORY_LIMIT = 40
let toastCounter = 0

function clone<T>(value: T): T {
  return structuredClone(value)
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      restaurants: createSeedRestaurants(),
      activeId: ACTIVE_RESTAURANT_ID,
      draft: null,
      dirty: false,
      past: [],
      future: [],
      lastHistoryPush: 0,
      toast: null,

      setActive: (id) =>
        set((s) => {
          if (s.activeId === id) return s
          const restaurant = s.restaurants.find((r) => r.id === id)
          if (!restaurant) return s
          return {
            activeId: id,
            draft: s.draft && s.dirty ? s.draft : null,
            past: [],
            future: [],
          }
        }),

      beginEdit: (templateId) =>
        set((s) => {
          const base = s.draft ?? s.restaurants.find((r) => r.id === s.activeId) ?? null
          if (!base) return s
          let next = clone(base)
          let dirty = s.dirty
          if (templateId && templateId !== next.templateId) {
            const template = getTemplate(templateId)
            next = {
              ...next,
              templateId: template.id,
              design: clone(template.defaultDesign),
            }
            dirty = true
          }
          return {
            draft: next,
            dirty,
            past: [],
            future: [],
            lastHistoryPush: 0,
          }
        }),

      updateDraft: (recipe) =>
        set((s) => {
          if (!s.draft) return s
          const previous = s.draft
          const next = clone(previous)
          recipe(next)
          const now = Date.now()
          const pushHistory = now - s.lastHistoryPush > 700
          return {
            draft: next,
            dirty: true,
            past: pushHistory ? [...s.past.slice(-HISTORY_LIMIT + 1), previous] : s.past,
            future: [],
            lastHistoryPush: pushHistory ? now : s.lastHistoryPush,
          }
        }),

      replaceDraft: (next) =>
        set((s) => ({
          draft: next,
          dirty: true,
          past: [...s.past.slice(-HISTORY_LIMIT + 1), ...(s.draft ? [s.draft] : [])],
          future: [],
          lastHistoryPush: Date.now(),
        })),

      undo: () =>
        set((s) => {
          if (!s.draft || s.past.length === 0) return s
          const past = [...s.past]
          const previous = past.pop() as Restaurant
          return {
            draft: previous,
            past,
            future: [s.draft, ...s.future].slice(0, HISTORY_LIMIT),
            dirty: true,
          }
        }),

      redo: () =>
        set((s) => {
          if (!s.draft || s.future.length === 0) return s
          const [next, ...rest] = s.future
          return {
            draft: next,
            future: rest,
            past: [...s.past, s.draft].slice(-HISTORY_LIMIT),
            dirty: true,
          }
        }),

      saveDraft: () =>
        set((s) => {
          if (!s.draft) return s
          const saved: Restaurant = { ...s.draft, updatedAt: new Date().toISOString() }
          return {
            restaurants: s.restaurants.map((r) => (r.id === saved.id ? saved : r)),
            draft: saved,
            dirty: false,
            past: [],
            future: [],
            toast: {
              id: ++toastCounter,
              title: 'Draft saved',
              message: `${saved.name} is up to date in your dashboard.`,
              tone: 'success',
            },
          }
        }),

      publishDemo: () =>
        set((s) => {
          if (!s.draft) return s
          const saved: Restaurant = {
            ...s.draft,
            status: 'published',
            updatedAt: new Date().toISOString(),
          }
          return {
            restaurants: s.restaurants.map((r) => (r.id === saved.id ? saved : r)),
            draft: saved,
            dirty: false,
            past: [],
            future: [],
            toast: {
              id: ++toastCounter,
              title: 'Demo published',
              message: `${saved.slug}.menucraft.com is showing your latest changes.`,
              tone: 'success',
            },
          }
        }),

      discardDraft: () => set({ draft: null, dirty: false, past: [], future: [] }),

      resetDesign: () =>
        set((s) => {
          if (!s.draft) return s
          const template = getTemplate(s.draft.templateId)
          const next = clone(s.draft)
          next.design = clone(template.defaultDesign)
          return {
            draft: next,
            dirty: true,
            past: [...s.past.slice(-HISTORY_LIMIT + 1), s.draft],
            future: [],
            toast: {
              id: ++toastCounter,
              title: 'Design reset',
              message: `${template.name} defaults restored.`,
              tone: 'info',
            },
          }
        }),

      updateSaved: (recipe, id) =>
        set((s) => {
          const targetId = id ?? s.activeId
          const restaurants = s.restaurants.map((r) => {
            if (r.id !== targetId) return r
            const next = clone(r)
            recipe(next)
            return { ...next, updatedAt: new Date().toISOString() }
          })
          const draft =
            s.draft && s.draft.id === targetId && !s.dirty
              ? (restaurants.find((r) => r.id === targetId) ?? s.draft)
              : s.draft
          return { restaurants, draft }
        }),

      setPlan: (plan) =>
        set((s) => ({
          restaurants: s.restaurants.map((r) =>
            r.id === s.activeId ? { ...r, plan } : r
          ),
          toast: {
            id: ++toastCounter,
            title: 'Plan updated',
            message: 'Demo only — no payment was processed.',
            tone: 'success',
          },
        })),

      resetDemo: () =>
        set(() => ({
          restaurants: createSeedRestaurants(),
          activeId: ACTIVE_RESTAURANT_ID,
          draft: null,
          dirty: false,
          past: [],
          future: [],
          toast: {
            id: ++toastCounter,
            title: 'Demo data restored',
            message: 'All restaurants are back to their original state.',
            tone: 'info',
          },
        })),

      showToast: (toast) => set({ toast: { ...toast, id: ++toastCounter } }),
      hideToast: () => set({ toast: null }),
    }),
    {
      name: 'menucraft-demo-v1',
      version: 1,
      partialize: (s) => ({
        restaurants: s.restaurants,
        activeId: s.activeId,
        draft: s.draft,
        dirty: s.dirty,
      }),
      merge: (persisted, current) => {
        const stored = (persisted ?? {}) as Partial<AppState>
        const restaurants =
          Array.isArray(stored.restaurants) && stored.restaurants.length > 0
            ? stored.restaurants
            : current.restaurants
        const activeId = restaurants.some((r: Restaurant) => r.id === stored.activeId)
          ? (stored.activeId as string)
          : ACTIVE_RESTAURANT_ID
        return {
          ...current,
          ...stored,
          restaurants,
          activeId,
          draft: stored.draft ?? null,
          dirty: Boolean(stored.dirty),
          past: [],
          future: [],
          toast: null,
          lastHistoryPush: 0,
        }
      },
    }
  )
)

/* ------------------------------- selectors ------------------------------- */

export function useActiveRestaurant(): Restaurant {
  return useStore((s) => s.restaurants.find((r) => r.id === s.activeId) ?? s.restaurants[0])
}

export function useRestaurantById(id: string): Restaurant | undefined {
  return useStore((s) => s.restaurants.find((r) => r.id === id))
}
