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
  /** optional demo password — persisted in the store's `passwords` map, never on UserAccount */
  password?: string
}

/** simulated social sign-in providers */
export type SocialProvider = 'google' | 'facebook'

/** deterministic demo identities for the simulated social flows */
const SOCIAL_PROVIDERS: Record<SocialProvider, { email: string; name: string }> = {
  google: { email: 'google.demo@menucraft.com', name: 'Google Demo Owner' },
  facebook: { email: 'facebook.demo@menucraft.com', name: 'Facebook Demo Owner' },
}

/**
 * DEMO ONLY — base64 is an encoding, not security. A real product must never
 * keep passwords client-side: it would send them over TLS to a server that
 * stores a salted hash (bcrypt/argon2). Everything here stays in localStorage.
 */
function encodePassword(value: string): string {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

interface AuthState {
  session: UserAccount | null
  accounts: UserAccount[]
  /** demo password vault keyed by lowercased email — deliberately kept off UserAccount */
  passwords: Record<string, string>

  signIn: (email: string) => { ok: boolean; reason?: string; account?: UserAccount }
  signInAs: (role: Role) => UserAccount
  signInWithPassword: (
    email: string,
    password: string
  ) => { ok: boolean; reason?: 'empty' | 'noPassword' | 'wrongPassword' | 'suspended'; account?: UserAccount }
  signInWithProvider: (
    provider: SocialProvider,
    options?: { adoptDraft?: boolean; restaurantName?: string; templateId?: string }
  ) => { ok: boolean; reason?: string; account?: UserAccount; created?: boolean }
  signUp: (input: SignUpInput) => { ok: boolean; account: UserAccount }
  resetPassword: (
    email: string,
    password: string
  ) => { ok: boolean; reason?: 'empty' | 'noAccount' | 'suspended'; account?: UserAccount }
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
      passwords: {},

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

      signInWithPassword: (email, password) => {
        const normalized = email.trim().toLowerCase()
        if (!normalized || !password) return { ok: false, reason: 'empty' }

        const found = get().accounts.find((a) => a.email.toLowerCase() === normalized)
        if (found?.status === 'suspended') return { ok: false, reason: 'suspended' }

        const stored = get().passwords[normalized]
        // legacy magic-link seeds and social accounts have no password yet —
        // they keep working through the magic-link path instead
        if (!found || !stored) return { ok: false, reason: 'noPassword' }
        if (stored !== encodePassword(password)) return { ok: false, reason: 'wrongPassword' }

        set({ session: found })
        return { ok: true, account: found }
      },

      signInWithProvider: (provider, options) => {
        const email = SOCIAL_PROVIDERS[provider].email
        const found = get().accounts.find((a) => a.email.toLowerCase() === email)
        if (found) {
          if (found.status === 'suspended') return { ok: false, reason: 'suspended' }
          set({ session: found })
          return { ok: true, account: found }
        }

        if (options?.adoptDraft) {
          /* social registration behaves exactly like signUp — the draft becomes the site */
          const result = get().signUp({
            name: SOCIAL_PROVIDERS[provider].name,
            email,
            restaurantName: options.restaurantName ?? '',
            templateId: options.templateId ?? '',
          })
          return { ok: true, account: result.account, created: true }
        }

        // mirrors the magic-link flow: an unknown provider email becomes a plain client
        const account: UserAccount = {
          id: `u-${Date.now().toString(36)}-${accountCounter++}`,
          name: SOCIAL_PROVIDERS[provider].name,
          email,
          role: 'client',
          restaurantId: useStore.getState().activeId,
          status: 'active',
          createdAt: new Date().toISOString(),
        }
        set((s) => ({ accounts: [...s.accounts, account], session: account }))
        return { ok: true, account, created: true }
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
          // password is optional so legacy callers (AuthModal/SubscribeModal) stay untouched
          passwords: input.password
            ? { ...s.passwords, [email]: encodePassword(input.password) }
            : s.passwords,
        }))

        return { ok: true, account }
      },

      resetPassword: (email, password) => {
        const normalized = email.trim().toLowerCase()
        if (!normalized || !password) return { ok: false, reason: 'empty' }

        const found = get().accounts.find((a) => a.email.toLowerCase() === normalized)
        if (!found) return { ok: false, reason: 'noAccount' }
        if (found.status === 'suspended') return { ok: false, reason: 'suspended' }

        set((s) => ({ passwords: { ...s.passwords, [normalized]: encodePassword(password) } }))
        return { ok: true, account: found }
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
      partialize: (s) => ({ session: s.session, accounts: s.accounts, passwords: s.passwords }),
      merge: (persisted, current) => {
        const stored = (persisted ?? {}) as Partial<AuthState>
        const accounts =
          Array.isArray(stored.accounts) && stored.accounts.length > 0
            ? stored.accounts
            : current.accounts
        // older persisted payloads predate the password vault — default it to empty
        const passwords =
          stored.passwords && typeof stored.passwords === 'object' && !Array.isArray(stored.passwords)
            ? stored.passwords
            : {}
        return {
          ...current,
          ...stored,
          accounts,
          passwords,
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
