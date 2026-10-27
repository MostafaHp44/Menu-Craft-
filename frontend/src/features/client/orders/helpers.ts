import type { Lang, TKey } from '../../../shared/i18n'
import type { OrderStatus } from '../../../shared/lib/types.ts'

/** status pill colours — `Badge` tones (static strings, never built dynamically) */
export const STATUS_TONE: Record<OrderStatus, 'gold' | 'flame' | 'moss'> = {
  received: 'gold',
  preparing: 'flame',
  served: 'moss',
}

export const STATUS_ICON: Record<OrderStatus, string> = {
  received: 'clock',
  preparing: 'activity',
  served: 'check',
}

/** matching dot colours for compact counters */
export const STATUS_DOT: Record<OrderStatus, string> = {
  received: 'bg-gold',
  preparing: 'bg-flame',
  served: 'bg-moss',
}

/**
 * `orders.received` reads correctly in ar/ku, while the English board uses the
 * `*En` twins baked into every locale file.
 */
export function statusKey(status: OrderStatus, lang: Lang): TKey {
  if (lang !== 'en') return `orders.${status}`
  if (status === 'received') return 'orders.receivedEn'
  if (status === 'preparing') return 'orders.preparingEn'
  return 'orders.servedEn'
}

/** same local calendar day as "now" (used by every client tab) */
export function isToday(iso: string): boolean {
  const value = new Date(iso)
  const now = new Date()
  return (
    value.getFullYear() === now.getFullYear() &&
    value.getMonth() === now.getMonth() &&
    value.getDate() === now.getDate()
  )
}
