import { useEffect, useState } from 'react'
import { apiUrl } from '../api/url.ts'
import { useStore } from '../store/useStore.ts'
import { useBackendRestaurantId } from '../store/useBackendAuth.ts'
import { getTemplate } from '../../templates/data/templates.ts'
import type { DemoPlanId, SalesSeries } from './types.ts'

/**
 * Applies a template's design to the active restaurant (keeping its content)
 * and opens the visual editor — the flow used by every "Customize" button.
 * التطبيق يستهدف الموقع النشط في التبويب (useStore.activeId) إن وُجد،
 * وإلا فالمطعم الأساسي القادم من جلسة الـ JWT — فيعمل صحيحاً لكل مواقع المالك.
 */
export function useCustomize() {
  const beginEdit = useStore((s) => s.beginEdit)
  const activeLocalId = useStore((s) => s.activeId)
  const sessionId = useBackendRestaurantId()

  return async (templateId: string) => {
    /*
     * استيراد منيو التمبلت إلى قاعدة البيانات — يُستورد فقط عند "أول مرة"
     * (موقع بلا منيو بعد) حسب منطق الباك إند، وبعدها يبقى منيو المالك كما هو
     * وتُطبَّق ألوان التمبلت فقط. نجرّب معرّف الجلسة ثم معرّف الموقع النشط
     * لأن أحدهما قد يكون معرّفاً تجريبياً غير موجود في قاعدة البيانات.
     */
    const ids = Array.from(new Set([sessionId, activeLocalId].filter(Boolean)))
    const design = getTemplate(templateId).defaultDesign

    // فتح المحرر — الجيست يقدر يجرّب التعديل عادي كتجربة.
    // التسجيل بيظهر فقط عند الـ Publish (داخل Editor عبر AuthModal)،
    // وهنا منتحققش من الجلسة خالص.
    const target = `/dashboard/editor?templateId=${encodeURIComponent(templateId)}&apply=1`

    // الاستيراد + beginEdit + فتح المحرر (الجيست: الطلبات هتفشل صامتاً بدون توكن،
    // والـ draft المحلي لسه هيتحدث ويتفتح المحرر كتجربة)
    for (const rid of ids) {
      try {
        const res = await fetch(apiUrl(`/api/restaurants/${encodeURIComponent(rid)}/import-template`), {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ templateId, design }),
        })
        if (res.ok) break // نجح الاستيراد — لا نجرّب بقية المعرّفات
      } catch {
        // Non-fatal — backend import may be unavailable; draft will still update
      }
    }
    // تسجيل الاختيار في قاعدة البيانات ليظهر في تبويب "قوالبي" — غير حرج عند الفشل
    try {
      const payload = JSON.stringify({ templateId })
      const headers = { 'Content-Type': 'application/json' }
      for (const rid of ids) {
        const res = await fetch(apiUrl(`/api/restaurants/${encodeURIComponent(rid)}/templates`), {
          method: 'POST',
          credentials: 'include',
          headers,
          body: payload,
        })
        if (res.ok) break
      }
    } catch {
      // Non-fatal — selection list simply won't include this template
    }
    beginEdit(templateId)
    // فتح المحرر في تاب جديد (طلب المستخدم) — التحرير happens على الموقع نفسه
    window.open(target, '_blank')
  }
}

/**
 * Public site URL for a restaurant slug — configured domain resolution.
 * Domain comes from the application configuration (`VITE_PUBLIC_SITE_DOMAIN`);
 * when unset, the current deployment host is used so QR codes and links keep
 * resolving in this deployment. No hard-coded platform domain.
 */
export function publicUrl(slug: string): string {
  const rawEnv = String(import.meta.env.VITE_PUBLIC_SITE_DOMAIN ?? '').trim()
  const host = rawEnv.replace(/^https?:\/\//i, '').replace(/\/+$/, '')
    || (typeof window !== 'undefined' && window.location.host ? window.location.host : '')
    || 'localhost'
  return `${host}/site/${slug}`
}

/** Absolute public site link (adds the scheme consistently) */
export function publicSiteLink(slug: string): string {
  return `https://${publicUrl(slug)}`
}

/**
 * Live sales series for a restaurant — computed on the backend from real Orders
 * rows (daily / monthly / yearly buckets; cancelled orders excluded).
 * Returns `null` while loading or when the restaurant has no sales data yet.
 */
export function useSalesSeries(
  restaurant: { id: string; plan: DemoPlanId } | undefined | null
): SalesSeries | null {
  const backendId = useBackendRestaurantId()
  const restaurantId = backendId || restaurant?.id || ''
  const [series, setSeries] = useState<SalesSeries | null>(null)

  useEffect(() => {
    if (!restaurantId) {
      setSeries(null)
      return
    }
    let cancelled = false
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('menucraft-token') || '' : ''
    fetch(apiUrl(`/api/orders/sales-series/${encodeURIComponent(restaurantId)}`), {
      credentials: 'include',
      headers: token ? { Authorization: 'Bearer ' + token } : undefined,
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('sales-series failed'))))
      .then((d) => {
        if (!cancelled) setSeries(d?.data ?? null)
      })
      .catch(() => {
        if (!cancelled) setSeries(null)
      })
    return () => {
      cancelled = true
    }
  }, [restaurantId])

  return series
}
