import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AdminPermission, Restaurant, Role, UserAccount } from '../lib/types.ts'
import { createSeedAccounts, createRestaurantFromTemplate } from '../lib/demoData.ts'
import { useStore } from './useStore.ts'
import { usePlatformStore } from './usePlatform.ts'

export interface SignUpInput {
  name: string
  email: string
  restaurantName: string
  /** template the visitor was editing before signing up */
  templateId: string
}

interface AuthState {
  session: UserAccount | null
  accounts: UserAccount[]

  signIn: (email: string) => { ok: boolean; reason?: string; account?: UserAccount }
  signInAs: (role: Role) => UserAccount
  signUp: (input: SignUpInput) => { ok: boolean; account: UserAccount }
  signOut: () => void

  addAccount: (input: { name: string; email: string; role: Role; restaurantId?: string }) => UserAccount
  updateAccount: (id: string, recipe: (account: UserAccount) => void) => void
  removeAccount: (id: string) => void
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 32) || 'my-restaurant'
}

let accountCounter = 0

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: null,
      accounts: createSeedAccounts(),

      signIn: (email) => {
        const normalized = email.trim().toLowerCase()
        if (!normalized) return { ok: false, reason: 'empty' }

        const found = get().accounts.find((a) => a.email.toLowerCase() === normalized)
        if (found && found.status === 'suspended') return { ok: false, reason: 'suspended' }
        if (found) {
          set({ session: found })
          return { ok: true, account: found }
        }

        // brand-new email -> the product treats every signup as a client
        const account: UserAccount = {
          id: `u-${Date.now().toString(36)}-${accountCounter++}`,
          name: normalized.split('@')[0].replace(/[._-]+/g, ' '),
          email: normalized,
          role: 'client',
          restaurantId: useStore.getState().activeId,
          status: 'active',
          createdAt: new Date().toISOString(),
        }
        set((s) => ({ accounts: [...s.accounts, account], session: account }))
        return { ok: true, account }
      },

      signInAs: (role) => {
        const existing = get().accounts.find((a) => a.role === role && a.status === 'active')
        if (existing) {
          set({ session: existing })
          return existing
        }
        const account: UserAccount = {
          id: `u-${Date.now().toString(36)}-${accountCounter++}`,
          name: role === 'worker' ? 'Kitchen staff' : 'New account',
          email: `${role}@menucraft.demo`,
          role,
          restaurantId: role === 'client' || role === 'worker' ? useStore.getState().activeId : undefined,
          permissions: role === 'admin' ? ['clients', 'sales'] : undefined,
          status: 'active',
          createdAt: new Date().toISOString(),
        }
        set((s) => ({ accounts: [...s.accounts, account], session: account }))
        return account
      },

      signUp: (input) => {
        const name = input.name.trim() || 'Restaurant owner'
        const email = input.email.trim().toLowerCase() || `owner@${slugify(input.restaurantName)}.demo`
        const now = new Date().toISOString()

        const store = useStore.getState()
        const draft = store.draft

        let restaurantId: string
        if (draft) {
          /* the visitor was editing — their draft BECOMES the new client's restaurant */
          const displayName = input.restaurantName.trim() || draft.name
          restaurantId = `rst-${slugify(displayName)}-${Date.now().toString(36)}`
          const restaurant: Restaurant = {
            ...draft,
            id: restaurantId,
            name: displayName,
            slug: input.restaurantName.trim() ? slugify(input.restaurantName) : draft.slug,
            status: 'draft',
            plan: 'trial',
            updatedAt: now,
          }
          store.addRestaurant(restaurant)
          store.replaceDraft(restaurant)
          // ids now match, so setActive keeps the working copy
          store.setActive(restaurantId)
          usePlatformStore.getState().subscribe(restaurantId, 'trial')
        } else {
          /* no draft — fall back to a fresh restaurant built from the template */
          restaurantId = `rst-${slugify(input.restaurantName)}-${Date.now().toString(36)}`
          const restaurant = createRestaurantFromTemplate(input.templateId, {
            id: restaurantId,
            name: input.restaurantName.trim() || 'My restaurant',
            slug: slugify(input.restaurantName),
            status: 'draft',
            plan: 'trial',
            updatedAt: now,
          })
          store.addRestaurant(restaurant)
          store.setActive(restaurantId)
          usePlatformStore.getState().subscribe(restaurantId, 'trial')
        }

        const account: UserAccount = {
          id: `u-${Date.now().toString(36)}-${accountCounter++}`,
          name,
          email,
          role: 'client',
          restaurantId,
          status: 'active',
          createdAt: new Date().toISOString(),
        }

        set((s) => ({
          accounts: [...s.accounts.filter((a) => a.email.toLowerCase() !== email), account],
          session: account,
        }))

        return { ok: true, account }
      },

      signOut: () => set({ session: null }),

      addAccount: (input) => {
        const account: UserAccount = {
          id: `u-${Date.now().toString(36)}-${accountCounter++}`,
          name: input.name.trim() || 'Team member',
          email: input.email.trim().toLowerCase(),
          role: input.role,
          restaurantId: input.restaurantId,
          permissions: input.role === 'admin' ? ['clients'] : undefined,
          status: 'active',
          createdAt: new Date().toISOString(),
        }
        set((s) => ({ accounts: [...s.accounts, account] }))
        return account
      },

      updateAccount: (id, recipe) =>
        set((s) => ({
          accounts: s.accounts.map((a) => {
            if (a.id !== id) return a
            const next = { ...a }
            recipe(next)
            return next
          }),
          session: s.session?.id === id ? (() => {
            const next = { ...s.session }
            recipe(next)
            return next
          })() : s.session,
        })),

      removeAccount: (id) =>
        set((s) => ({
          accounts: s.accounts.filter((a) => a.id !== id),
          session: s.session?.id === id ? null : s.session,
        })),
    }),
    {
      name: 'menucraft-auth-v1',
      version: 1,
      partialize: (s) => ({ session: s.session, accounts: s.accounts }),
      merge: (persisted, current) => {
        const stored = (persisted ?? {}) as Partial<AuthState>
        const accounts =
          Array.isArray(stored.accounts) && stored.accounts.length > 0
            ? stored.accounts
            : current.accounts
        return {
          ...current,
          ...stored,
          accounts,
          session: stored.session ?? null,
        }
      },
    }
  )
)

/* ------------------------------- helpers --------------------------------- */

export function can(
  session: UserAccount | null | undefined,
  permission: AdminPermission
): boolean {
  if (!session || session.status !== 'active') return false
  if (session.role === 'super_admin') return true
  if (session.role === 'admin') return Boolean(session.permissions?.includes(permission))
  return false
}

export function isPlatformAdmin(session: UserAccount | null): boolean {
  return session?.role === 'super_admin' || session?.role === 'admin'
}
