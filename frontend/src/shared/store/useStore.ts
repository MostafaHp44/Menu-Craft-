import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DemoPlanId, Restaurant } from '../lib/types.ts'
import { ACTIVE_RESTAURANT_ID, createSeedRestaurants } from '../lib/demoData.ts'
import { getTemplate } from '../../templates/data/templates.ts'
import { useBackendAuth } from './useBackendAuth.ts'

/** Fetch a full restaurant snapshot from the backend into the working draft. */
async function loadBackendDraft(restaurantId: string): Promise<Partial<Restaurant> | null> {
  try {
    const res = await fetch(`/api/restaurants/${encodeURIComponent(restaurantId)}`, {
      credentials: 'include',
    })
    if (!res.ok) return null
    const json = await (await res.json()).catch(() => null)
    if (!json || !json.ok) return null
    const r = json?.data ?? null
    if (!r || !r.id) return null
    // أعمدة JSON string (draft_menu/published_menu/design) — نحلّلها إلى كائنات
    const parse = (v: unknown): unknown => {
      if (typeof v !== 'string' || !v.trim()) return v
      try { return JSON.parse(v) } catch { return v }
    }
    const draftMenu = parse(r.draft_menu) ?? parse(r.published_menu)
    const publishMenu = parse(r.published_menu)
    return {
      id: r.id,
      name: typeof r.name === 'object' ? (r.name ?? {}) : String(r.name ?? ''),
      slug: typeof r.slug === 'string' ? r.slug : '',
      templateId: typeof r.templateId === 'string' ? r.templateId : undefined,
      design: (r.design && typeof r.design !== 'string' ? r.design : parse(r.design)) as any,
      menu: (Array.isArray(draftMenu) ? draftMenu : Array.isArray(publishMenu) ? publishMenu : []) as any,
      status: typeof r.status === 'string' ? (r.status as 'draft' | 'published') : undefined,
      plan: typeof r.plan === 'string' ? (r.plan as DemoPlanId) : undefined,
    } as Partial<Restaurant>
  } catch {
    return null
  }
}

/**
 * ينسخ الإعدادات الكاملة (config + منيو) إلى قاعدة البيانات تحت نفس الـ slug.
 * يُستدعى من الحفظ والنشر — النسخة المنشورة دائمًا في الـ DB (لا localStorage)
 * ولا تظهر أي نافذة تسجيل للمستخدم الموثّق.
 *
 * `includeMenu = false` للحفظ التلقائي: حتى لا يُرسل منيو غير مكتمل (قبل انتهاء
 * التحميل من السيرفر) ويحلّ محل المنيو الحقيقية في جدول العرض.
 */
/**
 * يجلب الـ slug الحالي للموقع الحقيقي في السيرفر (حسب restaurant_id الجلسة).
 * الـ slug المحلي بعد التبنّي قد يخص موقعاً آخر (تصادم أسماء، الباك إند يضيف
 * -ts)، فيسبب 403 عند الكتابة على slug الغير — ومن هنا المصدر الحقيقي الوحيد
 * هو السيرفر. يُعيد null لو تعذّر (ضيف/منقطع) فيرجع للـ slug المحلي.
 */
async function findBackendSiteSlug(backendRid: string | null | undefined): Promise<string | null> {
  if (!backendRid) return null
  try {
    const res = await fetch('/api/sites', { credentials: 'include' })
    const json = await res.json().catch(() => null)
    const site = (json?.data || []).find((site: any) => String(site.id) === String(backendRid))
    return site?.slug ? String(site.slug) : null
  } catch {
    return null
  }
}

async function pushSiteConfig(draft: Restaurant, publish: boolean, includeMenu = true): Promise<void> {
  if (!draft.slug) return
  const fail = (message: string) => {
    useStore.getState().showToast({
      title: publish ? 'Publish failed' : 'Server save failed',
      message,
      tone: 'error',
    })
  }
  // الـ slug الحقيقي من السيرفر أولاً ( draft.slug قد يكون slug الديمو المتصادم )
  const backendRid = (useBackendAuth.getState().user as any)?.restaurant_id
  const backendSlug = await findBackendSiteSlug(backendRid)
  const targetSlug = backendSlug || draft.slug
  const url = `/api/sites/${encodeURIComponent(targetSlug)}`
  const init: RequestInit = {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      publish,
      config: {
        name: draft.name,
        tagline: draft.tagline,
        description: draft.description,
        logoText: draft.logoText,
        logoStyle: draft.logoStyle,
        heroImage: draft.heroImage,
        heroImageFit: (draft as any).heroImageFit,
        galleryFits: (draft as any).galleryFits,
        heroVideo: draft.heroVideo ?? '',
        gallery: draft.gallery,
        phone: draft.phone,
        email: draft.email,
        address: draft.address,
        hours: draft.hours,
        socials: draft.socials,
        templateId: draft.templateId,
        design: draft.design,
        copy: draft.copy ?? {},
        inline: draft.inline ?? {},
        // تغيير الرابط يُدار من Settings فقط — هنا نرسل slug السيرفر الحالي
        // حتى لا نضرب SLUG_TAKEN بأسماء الديمو القديمة
        slug: targetSlug,
      },
      // الحفظ التلقائي لا يرسل المنيو — التعديل على المنيو يتم حفظه صراحة
      menu: includeMenu ? draft.menu : undefined,
    }),
  }
  try {
    let res = await fetch(url, init)
    // التوكن ينتهي بعد 15 دقيقة — نجدّد الجلسة (single-flight) ثم نعيد المحاولة
    if (res.status === 401 && (await useBackendAuth.getState().refresh())) {
      res = await fetch(url, init)
    }
    const json = await res.json().catch(() => null)
    if (!res.ok || json?.ok === false) {
      fail(
        res.status === 401
          ? 'Session expired — sign in again to save your site'
          : json?.error || `HTTP ${res.status}`
      )
    } else if (targetSlug !== draft.slug) {
      // نصحّح الـ slug المتقادم في الـ draft حتى تبقى النسخة مطابقة للسيرفر
      // (setState جراحي — بدون history/dirty عشان ما يزعج المستخدم)
      useStore.setState((s) => (s.draft && s.draft.slug !== targetSlug ? { draft: { ...s.draft, slug: targetSlug } } : s))
    }
  } catch (err) {
    fail(err instanceof Error ? err.message : String(err))
  }
}

export type ToastTone = 'success' | 'info' | 'error'

export interface ToastMessage {
  id: number
  title: string
  message?: string
  tone: ToastTone
}

/** payload الكونفج المتزامن مع السيرفر (Settings + Editor) */
function siteConfigOf(r: Restaurant) {
  return {
    name: r.name,
    tagline: r.tagline,
    description: r.description,
    logoText: r.logoText,
    logoStyle: r.logoStyle,
    heroImage: r.heroImage,
    heroImageFit: (r as any).heroImageFit,
    galleryFits: (r as any).galleryFits,
    heroVideo: r.heroVideo ?? '',
    gallery: r.gallery,
    phone: r.phone,
    email: r.email,
    address: r.address,
    hours: r.hours,
    socials: r.socials,
    templateId: r.templateId,
    design: r.design,
    copy: r.copy ?? {},
    inline: r.inline ?? {},
    slug: r.slug,
  }
}

/**
 * يدفع محتوى Settings (الاسم/الرابط/السوشيال/المواعيد/الإعدادات) إلى السيرفر
 * من غير المنيو. `urlSlug` يسمح بإعادة تسمية الـ slug: يُطلب على الـ slug
 * الحالي (القديم) ويحمل الـ slug الجديد داخل الجسم.
 * يُعيد true عند النجاح، ويرمي toast الخطأ ويُعيد false عند الفشل.
 */
async function pushRestaurantConfig(r: Restaurant, urlSlug?: string): Promise<boolean> {
  const target = urlSlug || r.slug
  if (!target) return false
  const init: RequestInit = {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      // ملحوظة: publish لا يُرسل من هنا — النشر/إلغاؤه مسؤولية
      // الـ endpoint المخصص /restaurants/:id/(un)publish لحفظ فحص الاشتراك
      config: siteConfigOf(r),
    }),
  }
  try {
    let res = await fetch(`/api/sites/${encodeURIComponent(target)}`, init)
    if (res.status === 401 && (await useBackendAuth.getState().refresh())) {
      res = await fetch(`/api/sites/${encodeURIComponent(target)}`, init)
    }
    const json = await res.json().catch(() => null)
    if (!res.ok || json?.ok === false) {
      useStore.getState().showToast({
        title: 'Server save failed',
        message:
          res.status === 401
            ? 'Session expired — sign in again to save your site'
            : json?.error || `HTTP ${res.status}`,
        tone: 'error',
      })
      return false
    }
    return true
  } catch (err) {
    useStore.getState().showToast({
      title: 'Server save failed',
      message: err instanceof Error ? err.message : String(err),
      tone: 'error',
    })
    return false
  }
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
  addRestaurant: (restaurant: Restaurant) => void
  beginEdit: (templateId?: string) => void
  updateDraft: (recipe: (draft: Restaurant) => void) => void
  replaceDraft: (next: Restaurant) => void
  undo: () => void
  redo: () => void
  saveDraft: () => void
  publishDemo: () => void
  discardDraft: () => void
  resetDesign: () => void
  loadDraftFromBackend: () => Promise<void>
  updateSaved: (recipe: (restaurant: Restaurant) => void, id?: string, opts?: { skipSync?: boolean }) => void
  syncSavedConfig: (id?: string, urlSlug?: string) => Promise<boolean>
  setPlan: (plan: DemoPlanId) => void
  resetDemo: () => void
  showToast: (toast: Omit<ToastMessage, 'id'>) => void
  hideToast: () => void
}

const HISTORY_LIMIT = 40
let autoSaveTimer: ReturnType<typeof setTimeout> | null = null
function scheduleAutoSave() {
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  autoSaveTimer = setTimeout(() => {
    const d = useStore.getState().draft
    /* الحفظ التلقائي يشتغل فقط للمستخدم الموثّق — بدون جلسة يخطئ الطلب ويسبب توستات خطأ متكررة */
    const auth = useBackendAuth.getState()
    const signedIn = auth.status === 'ready' && Boolean(auth.user)
    if (d && d.slug && signedIn) {
      void pushSiteConfig(d, false, false)
    }
  }, 1500)
}

// cancel auto-save on save/publish/discard
function cancelAutoSave() {
  if (autoSaveTimer) { clearTimeout(autoSaveTimer); autoSaveTimer = null }
}

/* مزامنة Settings إلى السيرفر (debounced) — نفس منطق المحرر، لكن بدون منيو */
let savedSyncTimer: ReturnType<typeof setTimeout> | null = null
function scheduleSavedSync(restaurantId?: string) {
  if (savedSyncTimer) clearTimeout(savedSyncTimer)
  savedSyncTimer = setTimeout(() => {
    savedSyncTimer = null
    const s = useStore.getState()
    const auth = useBackendAuth.getState()
    const signedIn = auth.status === 'ready' && Boolean(auth.user)
    if (!signedIn) return
    const targetId = restaurantId ?? s.activeId
    const restaurant = s.restaurants.find((r) => r.id === targetId)
    if (restaurant?.slug) {
      void s.syncSavedConfig(targetId)
    }
  }, 1500)
}
let toastCounter = 0

function clone<T>(value: T): T {
  return structuredClone(value)
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
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
          if (!restaurant) {
            // الموقع موجود على السيرفر فقط (مثلاً موقع جديد لم يُحمّل محلياً) —
            // نقبّله وتُحمّل نسخته من الباكند عبر loadDraftFromBackend
            void (useStore.getState().loadDraftFromBackend as (rid: string) => Promise<void>)(id)
            return { activeId: id, draft: null, dirty: false, past: [], future: [] }
          }
          // keep a working copy only when it already belongs to the target
          const keepDraft = Boolean(s.draft && s.draft.id === id)
          return {
            activeId: id,
            draft: keepDraft ? s.draft : null,
            dirty: keepDraft ? s.dirty : false,
            past: [],
            future: [],
          }
        }),

      addRestaurant: (restaurant) =>
        set((s) => ({
          restaurants: s.restaurants.some((r) => r.id === restaurant.id)
            ? s.restaurants
            : [...s.restaurants, restaurant],
        })),

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
          const result = {
            draft: next,
            dirty: true,
            past: pushHistory ? [...s.past.slice(-HISTORY_LIMIT + 1), previous] : s.past,
            future: [],
            lastHistoryPush: pushHistory ? now : s.lastHistoryPush,
          }
          // auto-save (debounced) — no manual Save button needed
          scheduleAutoSave()
          return result
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

      saveDraft: () => {
        cancelAutoSave()
        const current = useStore.getState().draft
        if (!current) return
        const saved: Restaurant = { ...current, updatedAt: new Date().toISOString() }
        set((s) => ({
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
        }))
        // نسخ الإعداد الكامل إلى قاعدة البيانات تحت نفس الـ slug (بدون نافذة تسجيل)
        void pushSiteConfig(saved, false)
      },

      publishDemo: () => {
        cancelAutoSave()
        const current = useStore.getState().draft
        if (!current) return
        const saved: Restaurant = {
          ...current,
          status: 'published',
          updatedAt: new Date().toISOString(),
        }
        set((s) => ({
          restaurants: s.restaurants.map((r) => (r.id === saved.id ? saved : r)),
          draft: saved,
          dirty: false,
          past: [],
          future: [],
          toast: {
            id: ++toastCounter,
            title: 'Site published',
            message: `${saved.slug} is showing your latest changes.`,
            tone: 'success',
          },
        }))
        // النشر يكتب المنيو والإعداد في النسخة المنشورة (published_menu) فورًا
        void pushSiteConfig(saved, true)
      },

      discardDraft: () => { cancelAutoSave(); return set({ draft: null, dirty: false, past: [], future: [] }) },

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

      updateSaved: (recipe, id, opts) => {
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
        })
        // تعديل Settings (اسم/سوشيال/مواعيد) كان محلياً فقط — الآن يُزامن
        // مع السيرفر حتى يظهر على الموقع العام
        if (!opts?.skipSync) {
          scheduleSavedSync(id ?? get().activeId)
        }
      },

      syncSavedConfig: async (id, urlSlug) => {
        const s = get()
        const targetId = id ?? s.activeId
        const restaurant = s.restaurants.find((r) => r.id === targetId)
        if (!restaurant?.slug) return false
        // حل الـ slug الحقيقي من السيرفر قبل الإرسال: الـ slug المحلي بعد التبنّي
        // قد يتصادم مع slug يملكه عميل آخر (الباك إند يُضيف له لاحقة -ts)،
        // فيضرب PUT على موقع الغير → 403 NOT_SITE_OWNER
        const backendRid = (useBackendAuth.getState().user as any)?.restaurant_id
        const backendSlug = await findBackendSiteSlug(backendRid)
        const target = backendSlug || urlSlug || restaurant.slug
        return pushRestaurantConfig(restaurant, target)
      },

      setPlan: (plan) =>
        set((s) => ({
          restaurants: s.restaurants.map((r) =>
            r.id === s.activeId ? { ...r, plan } : r
          ),
          toast: {
            id: ++toastCounter,
            title: 'Plan updated',
            message: 'Your plan was updated successfully.',
            tone: 'success',
          },
        })),

      loadDraftFromBackend: async () => {
        const activeId = useStore.getState().activeId
        if (!activeId) return
        const restaurantId = (useBackendAuth.getState().user as any)?.restaurant_id || activeId
        const id = restaurantId
        const partial = await loadBackendDraft(restaurantId)
        if (!partial) return
        set((s) => {
          const existing = s.restaurants.find((r) => r.id === id)
          const stub: Restaurant = { ...(partial as Restaurant), id }
          // إن لم يوجد الموقع محلياً نضيفه (موقع جديد من السيرفر) — وإلا نُحدّث الموجود
          const restaurants = existing
            ? s.restaurants.map((r) => (r.id === id ? { ...r, ...partial, menu: Array.isArray(partial.menu) ? partial.menu : r.menu } : r))
            : [...s.restaurants, stub]
          const updated = { ...stub, menu: Array.isArray(partial.menu) ? partial.menu : (existing?.menu as any) }
          const nextDraft = s.draft && s.draft.id === id ? { ...s.draft, ...updated, menu: Array.isArray(partial.menu) ? (partial.menu as any) : s.draft.menu } : (updated as any)
          return { restaurants, draft: nextDraft, dirty: s.dirty, activeId: id }
        })
      },

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
            title: 'Sample data restored',
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
      migrate: (persistedState: unknown) => {
        // Schema is compatible; no destructive migration needed
        return persistedState
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
