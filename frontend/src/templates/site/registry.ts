/**
 * Site renderer registry — variant → component mapping.
 *
 * Every variant with a dedicated renderer lives under `templates/designs/<name>/`
 * (same shape: index.tsx + data.ts + styles). Shared logic stays in
 * `templates/site/RestaurantSite.tsx`; variants without an entry here keep
 * the classic shared renderer. `RestaurantSite` dispatches to the registered
 * component at the top of its render — before any general rendering.
 */
import type { FC } from 'react'

import type { InlineTextStyle, Restaurant } from '../../shared/lib/types.ts'
import type { ActiveField } from '../editor/inlineEdit.tsx'
import { AurumSite } from '../designs/aurum/index.tsx'
import { CaffeBrewSite } from '../designs/caffe-brew/index.tsx'
import { BastaSite } from '../designs/basta/index.tsx'
import { DabbaSite } from '../designs/dabba/index.tsx'
import { NoirBistroSite } from '../designs/noir-bistro/index.tsx'
import { FastFoodMenuSite } from '../designs/fast-food-menu/index.tsx'
import { DessertsMenuSite } from '../designs/desserts-menu/index.tsx'
import { TavernSite } from '../designs/tavern/index.tsx'

export interface SiteComponentProps {
  restaurant: Restaurant
  interactive?: boolean
  mode?: string
  currency?: string
  editable?: boolean
  onActiveChange?: (field: ActiveField | null) => void
  onCommit?: (path: string, value: string) => void
  onStyle?: (path: string, patch: InlineTextStyle | null) => void
  onMenuEdit?: (recipe: (draft: Restaurant) => void) => void
}

export type SiteComponent = FC<SiteComponentProps>

/**
 * Variant → dedicated renderer.
 * A variant without an entry keeps RestaurantSite (classic); 'aurum'
 * renders the dedicated dark/gold Aurum Lounge renderer.
 */
export const SITE_COMPONENT_BY_VARIANT: Partial<Record<string, SiteComponent>> = {
  aurum: AurumSite,
  'caffe-brew': CaffeBrewSite,
  basta: BastaSite,
  dabba: DabbaSite,
  'noir-bistro': NoirBistroSite,
  'fast-food-menu': FastFoodMenuSite,
  'desserts-menu': DessertsMenuSite,
  tavern: TavernSite,
}

export function getSiteComponent(variant: string | undefined): SiteComponent | null {
  if (!variant) return null
  return SITE_COMPONENT_BY_VARIANT[variant] ?? null
}
