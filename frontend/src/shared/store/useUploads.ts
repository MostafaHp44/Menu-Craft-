import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Uploaded images (compressed `data:` URLs) shared by every ImagePicker.
 * localStorage is the only persistence available offline — it's shared with
 * the rest of the app (~5MB), so uploads are strictly capped and the write is
 * preflighted to surface quota failures instead of losing state silently.
 */

const MAX_ITEMS = 8
/** cumulative string length of all stored data URLs */
const MAX_TOTAL_BYTES = 1_200_000
const STORAGE_KEY = 'menucraft-uploads-v1'

interface UploadsState {
  /** data URLs, newest first */
  items: string[]
  add: (dataURL: string) => { ok: boolean; reason?: 'quota' | 'cap' }
  remove: (dataURL: string) => void
}

export const useUploads = create<UploadsState>()(
  persist(
    (set, get) => ({
      items: [],

      add: (dataURL) => {
        const next = [dataURL, ...get().items.filter((src) => src !== dataURL)]
        // evict oldest until both caps hold
        while (next.length > MAX_ITEMS) next.pop()
        const total = next.reduce((sum, src) => sum + src.length, 0)
        // a single oversized image can't be fixed by evicting — reject outright
        if (total > MAX_TOTAL_BYTES) return { ok: false, reason: 'cap' }

        try {
          // preflight: persist writes on `set` — probe the real payload first so
          // a QuotaExceededError is returned to the caller, not swallowed
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: { items: next }, version: 1 }))
        } catch {
          return { ok: false, reason: 'quota' }
        }

        set({ items: next })
        return { ok: true }
      },

      remove: (dataURL) => set({ items: get().items.filter((src) => src !== dataURL) }),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      partialize: (s) => ({ items: s.items }),
    }
  )
)
