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

export function publicUrl(slug: string): string {
  return `${slug}.menucraft.com`
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
