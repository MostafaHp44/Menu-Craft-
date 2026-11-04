import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.ts'
import { createSalesSeries } from './demoData.ts'
import type { DemoPlanId, SalesSeries } from './types.ts'

/**
 * Applies a template's design to the active restaurant (keeping its content)
 * and opens the visual editor — the flow used by every "Customize" button.
 */
export function useCustomize() {
  const beginEdit = useStore((s) => s.beginEdit)
  const navigate = useNavigate()

  return (templateId: string) => {
    beginEdit(templateId)
    navigate('/dashboard/editor')
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
 * Deterministic demo reporting series for a restaurant (daily / monthly / yearly
 * sales points). Memoised, so charts can re-render without recomputing.
 */
export function useSalesSeries(
  restaurant: { id: string; plan: DemoPlanId } | undefined | null
): SalesSeries | null {
  const id = restaurant?.id
  const plan = restaurant?.plan
  return useMemo(() => (id && plan ? createSalesSeries(id, plan) : null), [id, plan])
}
