import { useEffect, useMemo } from 'react'
import { create } from 'zustand'
import type { Order, OrderChannel, OrderStatus, Restaurant } from '../lib/types.ts'
import { ordersApi } from '../api/client.ts'

/**
 * الطلبات — مصدرها الخادم دائمًا (P1).
 *
 * لا localStorage ولا بيانات مزروعة: كل صف هنا جاء من `GET /api/orders`
 * بعد مصادقة حقيقية، والخادم يقيّد النتيجة بمطعم صاحب الجلسة (عزل مستأجرين).
 * كل تغيير حالة يمرّ بـ `PATCH /api/orders/:id/status` ويفرض الخادم عليه
 * صلاحيات الدور وآلة الحالة.
 */

/** حالة الباك إند → حالة الواجهة (received · preparing · served) */
export function mapApiStatus(status: string): OrderStatus {
  switch (status) {
    case 'pending':
      return 'received'
    case 'confirmed':
    case 'preparing':
      return 'preparing'
    case 'ready':
    case 'completed':
    case 'cancelled':
      return 'served'
    default:
      return 'received'
  }
}

/** سجل طلب من الخادم → شكل الواجهة */
export function mapApiOrder(raw: any): Order {
  return {
    id: String(raw.id),
    number: Number(raw.number ?? 0),
    restaurantId: String(raw.restaurantId ?? raw.restaurant_id ?? ''),
    channel: (raw.channel === 'counter' ? 'counter' : 'online') as OrderChannel,
    table: raw.table || raw.table_no || '—',
    customer: raw.customer || raw.customer_name || 'Walk-in',
    lines: (raw.lines || []).map((line: any) => ({
      itemId: line.itemId ?? line.item_id ?? line.id ?? '',
      name: line.name ?? line.item_name ?? '',
      price: Number(line.price ?? 0),
      qty: Number(line.qty ?? 1),
    })),
    note: raw.note ?? '',
    total: Number(raw.total ?? 0),
    status: mapApiStatus(raw.status),
    rawStatus: raw.status ?? 'pending',
    createdAt: raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
  }
}

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
  loading: boolean
  /** إعادة تحميل القائمة من الخادم (مقيّدة بمطعم الجلسة) */
  load: () => Promise<void>
  /** إنشاء طلب كونتر حقيقي عبر POST /api/orders */
  addOrder: (input: NewOrderInput) => Promise<Order>
  /** تغيير الحالة عبر الخادم ثم تحديث محلي متفائل */
  setStatus: (id: string, status: string) => Promise<void>
  /** received → preparing → ready … حسب آلة حالة الخادم */
  advance: (id: string) => Promise<void>
  reset: () => void
}

export const useOrdersStore = create<OrdersState>()((set, get) => ({
  orders: [],
  loading: false,

  load: async () => {
    set({ loading: true })
    try {
      const data = await ordersApi.list({ status: '' })
      set({ orders: (data || []).map(mapApiOrder), loading: false })
    } catch {
      set({ orders: [], loading: false })
    }
  },

  addOrder: async (input) => {
    const res = await ordersApi.create({
      restaurantId: input.restaurantId,
      channel: 'counter',
      customerName: input.customer.trim() || 'Walk-in',
      table: input.table.trim() || undefined,
      note: input.note?.trim() || undefined,
      lines: input.lines.map((line) => ({ itemId: line.itemId, qty: line.qty })),
    })
    const raw = res?.data
    if (!raw) throw new Error('order not created')
    // القائمة من الخادم دائمًا — نعيد التحميل بعد الإنشاء
    await get().load()
    return mapApiOrder(raw)
  },

  setStatus: async (id, status) => {
    await ordersApi.setStatus(id, status)
    set((s) => ({
      orders: s.orders.map((o) =>
        o.id === id ? { ...o, status: mapApiStatus(status), rawStatus: status } : o
      ),
    }))
  },

  advance: async (id) => {
    const order = get().orders.find((o) => o.id === id)
    if (!order) return
    const raw = order.rawStatus || 'pending'
    const next =
      raw === 'pending' || raw === 'received' || raw === 'confirmed'
        ? 'preparing'
        : raw === 'preparing'
          ? 'ready'
          : raw === 'ready'
            ? 'completed'
            : null
    if (!next) return
    await get().setStatus(id, next)
  },

  reset: () => set({ orders: [], loading: false }),
}))

/* ------------------------------- selectors ------------------------------- */

/**
 * قائمة طلبات المطعم النشط. `restaurantId` مُبقى للتوافق مع المستدعين،
 * لكن النطاق الحقيقي يأتي من توكن الجلسة في الخادم (لا يُثق بمعرّف الواجهة).
 */
export function useRestaurantOrders(_restaurantId?: string): Order[] {
  const orders = useOrdersStore((s) => s.orders)
  const load = useOrdersStore((s) => s.load)
  useEffect(() => {
    void load()
  }, [load])
  return orders
}

export function useOrdersForRestaurant(restaurant: Restaurant | undefined): Order[] {
  return useRestaurantOrders(restaurant?.id)
}

/** Sorted newest first — the order every board expects. */
export function useOrderedOrders(restaurantId?: string): Order[] {
  const orders = useRestaurantOrders(restaurantId)
  return useMemo(
    () => [...orders].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [orders]
  )
}
