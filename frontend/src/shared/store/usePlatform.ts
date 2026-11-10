import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  DemoPlanId,
  PaymentMethod,
  PaymentProviderId,
  PlatformProvider,
  SubscriptionRecord,
  TemplateOverride,
} from '../lib/types.ts'
import { isSubscriptionActive } from '../lib/types.ts'
import {
  PLATFORM_PROVIDERS,
  PLANS,
  createSeedPayments,
  createSeedSubscriptions,
} from '../lib/demoData.ts'
import { registerCustomTemplates, registerTemplateOverrides } from '../../templates/data/templates.ts'
import { platformAPI, planAPI, templateAPI, restaurantAPI } from '../lib/api.service.ts'

/**
 * يدفع حالة وسائل الدفع المحلية إلى قاعدة البيانات (عمود ordering الكائني)
 * بحيث تُطبَّق فعليًا على الـ Checkout العام — الخادم يتحقق من `enabled`
 * عند كل طلب، فالإيقاف هنا يمنع ظهور الوسيلة فورًا ودون عمل إضافي.
 */
async function syncPaymentOrdering(restaurantId: string, methods: PaymentMethod[]) {
  const family = (...providers: PaymentProviderId[]) =>
    methods.filter((m) => providers.includes(m.provider) && m.enabled)
  const cashOn = family('cash')
  const cardOn = family('card')
  const walletOn = family('wallet')
  const bankOn = family('bank')
  try {
    await restaurantAPI.update(restaurantId, {
      ordering: {
        paymentMethods: {
          cash: { enabled: cashOn.length > 0 },
          cash_at_pickup: { enabled: cashOn.length > 0 },
          card: { enabled: cardOn.length > 0 },
          wallet: { enabled: walletOn.length > 0 },
          bank_transfer: {
            enabled: bankOn.length > 0,
            instructions: bankOn[0]?.account || '',
          },
        },
      },
    })
  } catch (err) {
    // الموقع محلي (لم يُنشأ على السيرفر بعد) أو خطأ شبكة — الحالة المحلية تبقى فعالة بعد الحفظ/النشر
    console.error('syncPaymentOrdering error', err)
  }
}

export interface NewTemplateInput {
  /** server id — absent until the record is persisted */
  id?: string
  /** template the super admin duplicates */
  baseTemplateId: string
  name: string
  category?: string
}

export interface PlanInput {
  name: string
  price: number
  currency?: string
  interval_type: 'month' | 'year' | 'forever'
  max_restaurants: number
  max_menu_items: number
  features?: string[]
  is_active?: boolean
}

interface PlatformState {
  subscriptions: SubscriptionRecord[]
  payments: Record<string, PaymentMethod[]>
  providers: PlatformProvider[]
  /** active plans managed by the super admin */
  plans: { id: string; name: string; price: number; currency: string; interval_type: string; max_restaurants: number; max_menu_items: number; features: string[]; is_active: boolean }[]
  /** ids of templates the super admin created in this demo */
  customTemplates: NewTemplateInput[]
  /** per-template media overrides from DB, keyed by baseTemplateId */
  templateOverrides: Record<string, TemplateOverride>

  fetchSubscriptions: () => Promise<void>
  fetchSubscription: (restaurantId: string) => Promise<void>
  fetchClients: () => Promise<void>
  fetchStats: () => Promise<{ restaurants: number; subscriptions: number; mrr: number } | null>
  subscribe: (restaurantId: string, plan: DemoPlanId) => Promise<void>
  setPlan: (restaurantId: string, plan: DemoPlanId) => Promise<void>
  setAutoRenew: (restaurantId: string, on: boolean) => Promise<void>
  renew: (restaurantId: string) => Promise<void>
  expire: (restaurantId: string) => Promise<void>
  cancelSubscription: (restaurantId: string) => Promise<void>

  addPayment: (restaurantId: string, input: { provider: PaymentProviderId; label: string; account: string }) => void
  togglePayment: (restaurantId: string, id: string) => void
  removePayment: (restaurantId: string, id: string) => void

  setProviderEnabled: (id: PaymentProviderId, enabled: boolean) => void

  addTemplate: (input: NewTemplateInput) => Promise<void>
  removeTemplate: (name: string) => Promise<void>
  refreshTemplates: () => Promise<void>
  refreshOverrides: () => Promise<void>
  saveOverride: (baseId: string, body: Partial<TemplateOverride>) => Promise<TemplateOverride>
  deleteOverride: (baseId: string) => Promise<void>

  /** Plans management */
  addPlan: (input: PlanInput) => Promise<void>
  updatePlan: (id: string, input: Partial<PlanInput>) => Promise<void>
  deletePlan: (id: string) => Promise<void>
  refreshPlans: () => Promise<void>
}

function planPrice(plan: DemoPlanId): number {
  return PLANS.find((p) => p.id === plan)?.price ?? 0
}

/** معرّفات الباقات في السيرفر هي GUIDs — المعرّفات القصيرة تعني بيانات ديمو محلية */
function isServerPlanId(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id))
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

/** API rows arrive as snake_case (list) or camelCase (single record) */
function toRecord(s: any): SubscriptionRecord {
  // السيرفر يعيد اسم الباقة (Starter) — الواجهة تستخدم المعرّف الصغير (starter)
  const planRaw = s.plan ?? s.plan_name ?? 'trial'
  return {
    restaurantId: s.restaurantId ?? s.restaurant_id,
    plan: String(planRaw).toLowerCase() as DemoPlanId,
    price: Number(s.price ?? 0),
    status: s.status,
    startedAt: (s.startedAt ?? s.started_at ?? new Date().toISOString()).slice(0, 10),
    renewsAt: (s.renewsAt ?? s.renews_at ?? new Date().toISOString()).slice(0, 10),
    autoRenew: Boolean(s.autoRenew ?? s.auto_renew),
  }
}

let payCounter = 0

export const usePlatformStore = create<PlatformState>()(
  persist(
    (set, get) => ({
      subscriptions: createSeedSubscriptions(),
      payments: createSeedPayments(),
      providers: PLATFORM_PROVIDERS,
      plans: PLANS.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        currency: 'USD',
        interval_type: p.period === 'forever' ? 'forever' : p.period === 'per month' ? 'month' : 'year',
        max_restaurants: 1,
        max_menu_items: p.id === 'starter' ? 15 : -1,
        features: p.features,
        is_active: true,
      })),
      customTemplates: [],
      templateOverrides: {},

      fetchSubscriptions: async () => {
        try {
          const res = await platformAPI.getSubscriptions()
          if (res.ok && res.data) {
            const subs: SubscriptionRecord[] = res.data.map((s: any) => toRecord(s))
            set({ subscriptions: subs })
          }
        } catch (err) {
          console.error('fetchSubscriptions error', err)
        }
      },

      fetchSubscription: async (restaurantId) => {
        if (!restaurantId) return
        try {
          const res = await platformAPI.getSubscription(restaurantId)
          if (res.ok) {
            if (res.data) {
              const record = toRecord(res.data)
              set((s) => ({
                subscriptions: [...s.subscriptions.filter((r) => r.restaurantId !== restaurantId), record],
              }))
            } else {
              // data: null = ما فيش اشتراك على السيرفر — نحذف أي سجل محلي حتى لا يوهم بالاشتراك
              set((s) => ({
                subscriptions: s.subscriptions.filter((r) => r.restaurantId !== restaurantId),
              }))
            }
          }
        } catch (err: any) {
          // احتياط قديم: لو السيرفر كان يرجع 404 للاشتراك غير الموجود
          if (err?.status === 404 || String(err?.message).includes('404')) {
            set((s) => ({
              subscriptions: s.subscriptions.filter((r) => r.restaurantId !== restaurantId),
            }))
          } else {
            console.error('fetchSubscription error', err)
          }
        }
      },

      fetchClients: async () => {
        try {
          const res = await platformAPI.getClients()
          if (res.ok && res.data) {
            // clients data handled in Admin tabs via platformAPI directly
          }
        } catch (err) {
          console.error('fetchClients error', err)
        }
      },

      fetchStats: async () => {
        try {
          const res = await platformAPI.getStats()
          if (res.ok && res.data) {
            return res.data
          }
        } catch (err) {
          console.error('fetchStats error', err)
        }
        return null
      },

      subscribe: async (restaurantId, plan) => {
        const record: SubscriptionRecord = {
          restaurantId,
          plan,
          price: planPrice(plan),
          status: plan === 'trial' ? 'trialing' : 'active',
          startedAt: new Date().toISOString().slice(0, 10),
          renewsAt: plan === 'trial' ? plusDays(14) : plusMonths(1),
          autoRenew: plan !== 'trial',
        }

        // التجربة ما عندهاش باقة في السيرفر — اشتراك محلي فقط
        if (plan === 'trial') {
          set((s) => {
            const rest = s.subscriptions.filter((r) => r.restaurantId !== restaurantId)
            return { subscriptions: [...rest, record] }
          })
          return
        }

        // الباقات المبدئية محلية (معرّفات غير حقيقية) — نجلبها من السيرفر قبل الاشتراك
        if (!get().plans.some((p) => isServerPlanId(p.id))) {
          await get().refreshPlans()
        }

        const serverPlan =
          get().plans.find((p) => String(p.name).toLowerCase() === plan) ??
          get().plans.find((p) => p.id === plan)

        if (!serverPlan || !isServerPlanId(serverPlan.id)) {
          // ما قدرناش نحدد الباقة على السيرفر — نرفض بدل إظهار اشتراك وهمي
          console.error('subscribe: no matching server plan for', plan, get().plans)
          throw new Error('NO_SERVER_PLAN')
        }

        try {
          // createSubscription هو upsert: ينشئ أو يحدّث الاشتراك الموجود
          await platformAPI.createSubscription({
            restaurantId,
            planId: serverPlan.id,
            price: Number(serverPlan.price),
            status: record.status,
            renewsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            autoRenew: record.autoRenew,
          })
        } catch (err) {
          console.error('subscribe API error', err)
          throw err
        }

        // حدّث الحالة من السيرفر حتى تتطابق مع publish/subscription middleware
        await get().fetchSubscription(restaurantId)

        set((s) => {
          const rest = s.subscriptions.filter((r) => r.restaurantId !== restaurantId)
          return { subscriptions: [...rest, { ...record, price: Number(serverPlan.price) }] }
        })
      },

      setPlan: async (restaurantId, plan) => {
        // نفس منطق الاشتراك (upsert على السيرفر) — يفشل برمي خطأ يظهر للمستخدم
        await get().subscribe(restaurantId, plan)
      },

      setAutoRenew: async (restaurantId, on) => {
        // حفظ على السيرفر أولاً — الزر لا يعمل إذا اكتفينا بالتحديث المحلي
        try {
          await platformAPI.updateSubscription(restaurantId, { autoRenew: on })
        } catch (err) {
          console.error('setAutoRenew API error', err)
        }
        set((s) => ({
          subscriptions: s.subscriptions.map((r) =>
            r.restaurantId === restaurantId ? { ...r, autoRenew: on } : r
          ),
        }))
      },

      renew: async (restaurantId) => {
        const current = get().subscriptions.find((r) => r.restaurantId === restaurantId)
        // التجديد يمدّد سنة/شهر من تاريخ آخر تجديد (أو من اليوم إن انتهت الصلاحية)
        const base = new Date(Math.max(
          new Date(current?.renewsAt ?? 0).getTime(),
          Date.now()
        ))
        base.setMonth(base.getMonth() + (current?.plan === 'trial' ? 0 : 1))
        const renewsAt = base.toISOString().slice(0, 10)
        const status = current?.plan === 'trial' ? ('trialing' as const) : ('active' as const)

        try {
          await platformAPI.updateSubscription(restaurantId, { renewsAt, status })
        } catch (err) {
          console.error('renew API error', err)
        }

        set((s) => ({
          subscriptions: s.subscriptions.map((r) =>
            r.restaurantId === restaurantId ? { ...r, renewsAt, status } : r
          ),
        }))
      },

      expire: async (restaurantId) => {
        try {
          await platformAPI.updateSubscription(restaurantId, {
            status: 'expired',
            autoRenew: false,
          })
        } catch (err) {
          console.error('expire API error', err)
        }
        set((s) => ({
          subscriptions: s.subscriptions.map((r) =>
            r.restaurantId === restaurantId
              ? { ...r, status: 'expired' as const, autoRenew: false }
              : r
          ),
        }))
      },

      cancelSubscription: async (restaurantId) => {
        try {
          await platformAPI.updateSubscription(restaurantId, {
            status: 'cancelled',
            autoRenew: false,
          })
        } catch (err) {
          console.error('cancelSubscription API error', err)
        }
        set((s) => ({
          subscriptions: s.subscriptions.map((r) =>
            r.restaurantId === restaurantId
              ? { ...r, autoRenew: false, status: 'cancelled' as const }
              : r
          ),
        }))
      },

      /* ---------- Plans management ---------- */
      refreshPlans: async () => {
        try {
          const res = await planAPI.getAll()
          if (res.ok && res.data) {
            const plans = res.data.map((p: any) => ({
              id: p.id,
              name: p.name,
              price: Number(p.price),
              currency: p.currency ?? 'USD',
              interval_type: p.interval_type,
              max_restaurants: p.max_restaurants,
              max_menu_items: p.max_menu_items,
              features: p.features ? (typeof p.features === 'string' ? JSON.parse(p.features) : p.features) : [],
              is_active: p.is_active,
            }))
            set({ plans })
          }
        } catch (err) {
          console.error('refreshPlans error', err)
        }
      },

      addPlan: async (input) => {
        try {
          const res = await planAPI.create({
            name: input.name,
            price: input.price,
            currency: input.currency ?? 'USD',
            interval_type: input.interval_type,
            max_restaurants: input.max_restaurants,
            max_menu_items: input.max_menu_items,
            features: input.features ?? [],
            is_active: input.is_active ?? true,
          })
          if (res.ok && res.data) {
            const p = res.data
            const next = {
              id: p.id,
              name: p.name,
              price: Number(p.price),
              currency: p.currency ?? 'USD',
              interval_type: p.interval_type,
              max_restaurants: p.max_restaurants,
              max_menu_items: p.max_menu_items,
              features: p.features ? (typeof p.features === 'string' ? JSON.parse(p.features) : p.features) : [],
              is_active: p.is_active,
            }
            set((s) => ({ plans: [...s.plans, next] }))
          }
        } catch (err) {
          console.error('addPlan error', err)
          // Fallback: add locally even if API fails (demo mode)
          const next: PlatformState['plans'][number] = {
            id: `plan-${Date.now().toString(36)}`,
            name: input.name,
            price: input.price,
            currency: input.currency ?? 'USD',
            interval_type: input.interval_type,
            max_restaurants: input.max_restaurants,
            max_menu_items: input.max_menu_items,
            features: input.features ?? [],
            is_active: input.is_active ?? true,
          }
          set((s) => ({ plans: [...s.plans, next] }))
        }
      },

      updatePlan: async (id, input) => {
        try {
          const res = await planAPI.update(id, {
            name: input.name,
            price: input.price,
            currency: input.currency,
            interval_type: input.interval_type,
            max_restaurants: input.max_restaurants,
            max_menu_items: input.max_menu_items,
            features: input.features,
            is_active: input.is_active,
          })
          if (res.ok) {
            set((s) => ({
              plans: s.plans.map((p) => (p.id === id ? { ...p, ...input } : p)),
            }))
          }
        } catch (err) {
          console.error('updatePlan error', err)
          set((s) => ({
            plans: s.plans.map((p) => (p.id === id ? { ...p, ...input } : p)),
          }))
        }
      },

      deletePlan: async (id) => {
        try {
          await planAPI.delete(id)
        } catch (err) {
          console.error('deletePlan error', err)
        }
        set((s) => ({ plans: s.plans.filter((p) => p.id !== id) }))
      },

      addPayment: (restaurantId, input) => {
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
        })
        void syncPaymentOrdering(restaurantId, get().payments[restaurantId] ?? [])
      },

      togglePayment: (restaurantId, id) => {
        set((s) => ({
          payments: {
            ...s.payments,
            [restaurantId]: (s.payments[restaurantId] ?? []).map((m) =>
              m.id === id ? { ...m, enabled: !m.enabled } : m
            ),
          },
        }))
        void syncPaymentOrdering(restaurantId, get().payments[restaurantId] ?? [])
      },

      removePayment: (restaurantId, id) => {
        set((s) => ({
          payments: {
            ...s.payments,
            [restaurantId]: (s.payments[restaurantId] ?? []).filter(
              (m) => m.id !== id
            ),
          },
        }))
        void syncPaymentOrdering(restaurantId, get().payments[restaurantId] ?? [])
      },

      setProviderEnabled: (id, enabled) =>
        set((s) => ({
          providers: s.providers.map((p) =>
            p.id === id ? { ...p, enabled } : p
          ),
        })),

      addTemplate: async (input) => {
        // حفظ على السيرفر أولاً — النسخة المحلية تنعكس من استجابة السيرفر
        const res = await templateAPI.create({
          name: input.name,
          base_template_id: input.baseTemplateId,
          category: input.category,
        })
        const saved = res.data
        set((s) => ({
          customTemplates: [
            ...s.customTemplates.filter((t) => t.name !== saved.name),
            {
              id: saved.id,
              baseTemplateId: saved.baseTemplateId,
              name: saved.name,
              category: saved.category ?? undefined,
            },
          ],
        }))
      },

      removeTemplate: async (name) => {
        const target = get().customTemplates.find((t) => t.name === name)
        // حذف من السيرفر إن كان له معرّف (نسخ لم تُحفظ بعد تُحذف محلياً فقط)
        if (target?.id) {
          await templateAPI.remove(target.id)
        }
        set((s) => ({
          customTemplates: s.customTemplates.filter((t) => t.name !== name),
        }))
      },

      refreshTemplates: async () => {
        try {
          const res = await templateAPI.getPublic()
          if (res.ok && Array.isArray(res.data)) {
            const overrides = Array.isArray(res.overrides) ? res.overrides : []
            const map: Record<string, TemplateOverride> = {}
            for (const o of overrides) map[o.baseTemplateId] = o
            set({
              customTemplates: res.data.map((t: any) => ({
                id: t.id,
                baseTemplateId: t.baseTemplateId,
                name: t.name,
                category: t.category ?? undefined,
              })),
              templateOverrides: map,
            })
          }
        } catch (err) {
          // عرض القوالب الأساسية يكمل حتى لو فشل جلب النسخ المخصصة
          console.error('refreshTemplates error', err)
        }
      },

      refreshOverrides: async () => {
        try {
          // Public list ships overrides too — reuse it (no auth needed) so guests merge them
          const res = await templateAPI.getPublic()
          if (res.ok) {
            const list = (res.overrides || []) as TemplateOverride[]
            const map: Record<string, TemplateOverride> = {}
            for (const o of list) map[o.baseTemplateId] = o
            set({ templateOverrides: map })
          }
        } catch (err) {
          console.error('refreshOverrides error', err)
        }
      },

      saveOverride: async (baseId, body) => {
        const res = await templateAPI.saveOverride(baseId, {
          hero_title: body.heroTitle,
          hero_subtitle: body.heroSubtitle,
          hero_image: body.heroImage,
          hero_image_mobile: body.heroImageMobile,
          hero_video_desktop: body.heroVideoDesktop,
          hero_video_mobile: body.heroVideoMobile,
          preview_image: body.previewImage,
          gallery: body.gallery,
          design: body.design,
        })
        const saved = res.data as TemplateOverride
        set((s) => ({ templateOverrides: { ...s.templateOverrides, [baseId]: saved } }))
        return saved
      },

      deleteOverride: async (baseId) => {
        await templateAPI.deleteOverride(baseId)
        set((s) => {
          const next = { ...s.templateOverrides }
          delete next[baseId]
          return { templateOverrides: next }
        })
      },
    }),
    {
      name: 'menucraft-platform-v1',
      partialize: (s) => ({
        subscriptions: s.subscriptions,
        payments: s.payments,
        providers: s.providers,
        plans: s.plans,
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
          plans: stored.plans ?? current.plans,
          customTemplates: stored.customTemplates ?? current.customTemplates,
          // templateOverrides are runtime-only (from server) — never wipe a fetched map on rehydrate
          templateOverrides: current.templateOverrides,
        }
      },
    }
  )
)

registerCustomTemplates(() => usePlatformStore.getState().customTemplates)
registerTemplateOverrides(() => usePlatformStore.getState().templateOverrides)

export function useSubscription(restaurantId: string): SubscriptionRecord | undefined {
  return usePlatformStore((s) => s.subscriptions.find((r) => r.restaurantId === restaurantId))
}

export function isSubscriptionLive(id: string | undefined): boolean {
  const record = usePlatformStore
    .getState()
    .subscriptions.find((r) => r.restaurantId === id)
  return isSubscriptionActive(record?.status)
}

export function useIsSubscribed(restaurantId: string | undefined): boolean {
  const record = useSubscription(restaurantId ?? '')
  return isSubscriptionActive(record?.status)
}

/** للاستخدام في المكونات - يعيد true إذا كان الاشتراك نشطاً */
export function useSubscriptionStatus(restaurantId: string | undefined): { 
  isActive: boolean; 
  isSuspended: boolean; 
  status: string | undefined;
  record: SubscriptionRecord | undefined;
} {
  const record = useSubscription(restaurantId ?? '')
  const status = record?.status
  return {
    isActive: isSubscriptionActive(status),
    isSuspended: !isSubscriptionActive(status) && Boolean(status),
    status,
    record
  }
}

export function usePayments(restaurantId: string): PaymentMethod[] {
  const payments = usePlatformStore((s) => s.payments)
  return payments[restaurantId] ?? []
}
