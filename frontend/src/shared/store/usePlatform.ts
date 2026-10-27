import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  DemoPlanId,
  PaymentMethod,
  PaymentProviderId,
  PlatformProvider,
  SubscriptionRecord,
} from '../lib/types.ts'
import {
  PLATFORM_PROVIDERS,
  PLANS,
  createSeedPayments,
  createSeedSubscriptions,
} from '../lib/demoData.ts'
import { registerCustomTemplates } from '../../templates/data/templates.ts'

export interface NewTemplateInput {
  /** template the super admin duplicates */
  baseTemplateId: string
  name: string
  category?: string
}

interface PlatformState {
  subscriptions: SubscriptionRecord[]
  payments: Record<string, PaymentMethod[]>
  providers: PlatformProvider[]
  /** ids of templates the super admin created in this demo */
  customTemplates: NewTemplateInput[]

  subscribe: (restaurantId: string, plan: DemoPlanId) => void
  setPlan: (restaurantId: string, plan: DemoPlanId) => void
  setAutoRenew: (restaurantId: string, on: boolean) => void
  renew: (restaurantId: string) => void
  expire: (restaurantId: string) => void
  cancelSubscription: (restaurantId: string) => void

  addPayment: (restaurantId: string, input: { provider: PaymentProviderId; label: string; account: string }) => void
  togglePayment: (restaurantId: string, id: string) => void
  removePayment: (restaurantId: string, id: string) => void

  setProviderEnabled: (id: PaymentProviderId, enabled: boolean) => void

  addTemplate: (input: NewTemplateInput) => void
  removeTemplate: (name: string) => void
}

function planPrice(plan: DemoPlanId): number {
  return PLANS.find((p) => p.id === plan)?.price ?? 0
}

function plusMonths(months: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() + months)
  return d.toISOString().slice(0, 10)
}

function plusDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

let payCounter = 0

export const usePlatformStore = create<PlatformState>()(
  persist(
    (set) => ({
      subscriptions: createSeedSubscriptions(),
      payments: createSeedPayments(),
      providers: PLATFORM_PROVIDERS,
      customTemplates: [],

      subscribe: (restaurantId, plan) =>
        set((s) => {
          const record: SubscriptionRecord = {
            restaurantId,
            plan,
            price: planPrice(plan),
            status: plan === 'trial' ? 'trialing' : 'active',
            startedAt: new Date().toISOString().slice(0, 10),
            renewsAt: plan === 'trial' ? plusDays(14) : plusMonths(1),
            autoRenew: plan !== 'trial',
          }
          const rest = s.subscriptions.filter((r) => r.restaurantId !== restaurantId)
          return { subscriptions: [...rest, record] }
        }),

      setPlan: (restaurantId, plan) =>
        set((s) => ({
          subscriptions: s.subscriptions.map((r) =>
            r.restaurantId === restaurantId
              ? {
                  ...r,
                  plan,
                  price: planPrice(plan),
                  status: plan === 'trial' ? 'trialing' : 'active',
                  renewsAt: plan === 'trial' ? plusDays(14) : plusMonths(1),
                }
              : r
          ),
        })),

      setAutoRenew: (restaurantId, on) =>
        set((s) => ({
          subscriptions: s.subscriptions.map((r) =>
            r.restaurantId === restaurantId ? { ...r, autoRenew: on } : r
          ),
        })),

      renew: (restaurantId) =>
        set((s) => ({
          subscriptions: s.subscriptions.map((r) => {
            if (r.restaurantId !== restaurantId) return r
            const months = r.plan === 'trial' ? 0 : 1
            return {
              ...r,
              status: r.plan === 'trial' ? 'trialing' : 'active',
              renewsAt: r.plan === 'trial' ? plusDays(14) : plusMonths(months),
            }
          }),
        })),

      expire: (restaurantId) =>
        set((s) => ({
          subscriptions: s.subscriptions.map((r) =>
            r.restaurantId === restaurantId ? { ...r, status: 'expired' as const } : r
          ),
        })),

      cancelSubscription: (restaurantId) =>
        set((s) => ({
          subscriptions: s.subscriptions.map((r) =>
            r.restaurantId === restaurantId
              ? { ...r, autoRenew: false, status: 'expired' as const }
              : r
          ),
        })),

      addPayment: (restaurantId, input) =>
        set((s) => {
          const current = s.payments[restaurantId] ?? []
          const method: PaymentMethod = {
            id: `pay-${Date.now().toString(36)}-${payCounter++}`,
            provider: input.provider,
            label: input.label,
            account: input.account,
            enabled: true,
          }
          return { payments: { ...s.payments, [restaurantId]: [...current, method] } }
        }),

      togglePayment: (restaurantId, id) =>
        set((s) => ({
          payments: {
            ...s.payments,
            [restaurantId]: (s.payments[restaurantId] ?? []).map((m) =>
              m.id === id ? { ...m, enabled: !m.enabled } : m
            ),
          },
        })),

      removePayment: (restaurantId, id) =>
        set((s) => ({
          payments: {
            ...s.payments,
            [restaurantId]: (s.payments[restaurantId] ?? []).filter((m) => m.id !== id),
          },
        })),

      setProviderEnabled: (id, enabled) =>
        set((s) => ({
          providers: s.providers.map((p) => (p.id === id ? { ...p, enabled } : p)),
        })),

      addTemplate: (input) =>
        set((s) => ({
          customTemplates: [
            ...s.customTemplates.filter((t) => t.name !== input.name),
            input,
          ],
        })),

      removeTemplate: (name) =>
        set((s) => ({ customTemplates: s.customTemplates.filter((t) => t.name !== name) })),
    }),
    {
      name: 'menucraft-platform-v1',
      version: 1,
      partialize: (s) => ({
        subscriptions: s.subscriptions,
        payments: s.payments,
        providers: s.providers,
        customTemplates: s.customTemplates,
      }),
      merge: (persisted, current) => {
        const stored = (persisted ?? {}) as Partial<PlatformState>
        return {
          ...current,
          ...stored,
          subscriptions: stored.subscriptions ?? current.subscriptions,
          payments: stored.payments ?? current.payments,
          providers: stored.providers ?? current.providers,
          customTemplates: stored.customTemplates ?? current.customTemplates,
        }
      },
    }
  )
)

/* The template data module stays store-free: it exposes a provider hook and
   this store feeds it, so `getTemplate()` resolves super-admin duplicates
   everywhere (gallery, previews, editor, published menu). */
registerCustomTemplates(() => usePlatformStore.getState().customTemplates)

/* ------------------------------- selectors ------------------------------- */

export function useSubscription(restaurantId: string): SubscriptionRecord | undefined {
  return usePlatformStore((s) => s.subscriptions.find((r) => r.restaurantId === restaurantId))
}

/** true while the restaurant has a subscription record that has not expired */
export function isSubscriptionLive(id: string | undefined): boolean {
  const record = usePlatformStore
    .getState()
    .subscriptions.find((r) => r.restaurantId === id)
  return Boolean(record && record.status !== 'expired')
}

/** reactive version of `isSubscriptionLive` for components */
export function useIsSubscribed(restaurantId: string | undefined): boolean {
  const record = useSubscription(restaurantId ?? '')
  return Boolean(record && record.status !== 'expired')
}

export function usePayments(restaurantId: string): PaymentMethod[] {
  const payments = usePlatformStore((s) => s.payments)
  return payments[restaurantId] ?? EMPTY
}

const EMPTY: PaymentMethod[] = []
