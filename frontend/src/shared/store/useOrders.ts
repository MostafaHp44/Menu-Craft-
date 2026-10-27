import { useMemo } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Order, OrderStatus, Restaurant } from '../lib/types.ts'
import {
  createSeedOrders,
  createSeedRestaurants,
  rollOrdersToToday,
} from '../lib/demoData.ts'

export interface NewOrderInput {
  restaurantId: string
  channel: Order['channel']
  table: string
  customer: string
  lines: Order['lines']
  note?: string
}

interface OrdersState {
  orders: Order[]
  addOrder: (input: NewOrderInput) => Order
  setStatus: (id: string, status: OrderStatus) => void
  /** received -> preparing -> served */
  advance: (id: string) => void
  removeOrder: (id: string) => void
  resetOrders: () => void
}

function seed(): Order[] {
  return rollOrdersToToday(createSeedOrders(createSeedRestaurants()))
}

function orderTotal(lines: Order['lines']): number {
  return lines.reduce((sum, line) => sum + line.price * line.qty, 0)
}

export const useOrdersStore = create<OrdersState>()(
  persist(
    (set) => ({
      orders: seed(),

      addOrder: (input) => {
        const order: Order = {
          id: `ord-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
          number: 0,
          restaurantId: input.restaurantId,
          channel: input.channel,
          table: input.table || '—',
          customer: input.customer.trim() || 'Walk-in',
          lines: input.lines,
          note: input.note?.trim() ?? '',
          total: orderTotal(input.lines),
          status: 'received',
          createdAt: new Date().toISOString(),
        }
        set((s) => {
          const next = s.orders.map((o) => o)
          const mine = next.filter((o) => o.restaurantId === order.restaurantId)
          order.number = mine.reduce((max, o) => Math.max(max, o.number), 0) + 1
          return { orders: [order, ...next] }
        })
        return order
      },

      setStatus: (id, status) =>
        set((s) => ({
          orders: s.orders.map((o) => (o.id === id ? { ...o, status } : o)),
        })),

      advance: (id) =>
        set((s) => ({
          orders: s.orders.map((o) => {
            if (o.id !== id) return o
            const next: OrderStatus =
              o.status === 'received' ? 'preparing' : o.status === 'preparing' ? 'served' : 'served'
            return { ...o, status: next }
          }),
        })),

      removeOrder: (id) => set((s) => ({ orders: s.orders.filter((o) => o.id !== id) })),

      resetOrders: () => set({ orders: seed() }),
    }),
    {
      name: 'menucraft-orders-v1',
      version: 1,
      partialize: (s) => ({ orders: s.orders }),
      merge: (persisted, current) => {
        const stored = (persisted ?? {}) as Partial<OrdersState>
        const orders = Array.isArray(stored.orders) && stored.orders.length > 0 ? stored.orders : current.orders
        return { ...current, ...stored, orders: rollOrdersToToday(orders) }
      },
    }
  )
)

/* ------------------------------- selectors ------------------------------- */

export function useRestaurantOrders(restaurantId: string): Order[] {
  const orders = useOrdersStore((s) => s.orders)
  return useMemo(
    () => orders.filter((o) => o.restaurantId === restaurantId),
    [orders, restaurantId]
  )
}

export function useOrdersForRestaurant(
  restaurant: Restaurant | undefined
): Order[] {
  return useRestaurantOrders(restaurant?.id ?? '')
}

/** Sorted newest first — the order every board expects. */
export function useOrderedOrders(restaurantId: string): Order[] {
  const orders = useRestaurantOrders(restaurantId)
  return useMemo(
    () => [...orders].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [orders]
  )
}
