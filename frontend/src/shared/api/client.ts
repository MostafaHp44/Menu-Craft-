/* ------------------------------------------------------------------ *
 * Digital Menu — typed API client.
 *
 * Only endpoints that exist in backend/src/routes are declared here.
 * Anything the product needs but the backend does not expose yet is
 * documented in FRONTEND_COMPLETE_IMPLEMENTATION_REPORT.md instead of
 * being invented in this file.
 * ------------------------------------------------------------------ */

const API_BASE = import.meta.env.VITE_API_URL_ABSOLUTE || ''

export class ApiError extends Error {
  status: number
  code?: string

  constructor(status: number, message: string, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

type QueryValue = string | number | boolean | null | undefined

function query(params: Record<string, QueryValue>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    search.set(key, String(value))
  }
  const text = search.toString()
  return text ? `?${text}` : ''
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...init,
    headers,
  })

  const text = await response.text()
  let body: unknown = null
  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      body = text
    }
  }

  if (!response.ok) {
    const payload = (body ?? {}) as { message?: string; error?: string; code?: string }
    throw new ApiError(
      response.status,
      payload.message || payload.error || response.statusText || 'Request failed',
      payload.code
    )
  }

  return body as T
}

function body(payload: unknown): RequestInit {
  return { method: 'POST', body: JSON.stringify(payload) }
}

function patch(payload: unknown): RequestInit {
  return { method: 'PATCH', body: JSON.stringify(payload) }
}

/* --------------------------------- types --------------------------------- */

export type ApiRole = 'Owner' | 'Cashier' | 'Kitchen' | 'Waiter'

export interface ApiUser {
  id: string
  email: string
  role: ApiRole | string
  name?: string
  status?: string
  needsPasswordChange?: boolean
  restaurant_id?: string
  restaurant_name?: string | null
}

export interface LoginResponse {
  ok: boolean
  user: ApiUser
}

/** /api/auth/me subscription block (restaurant-scoped) — null حتى موافقة السوبر ادمن */
export interface SubscriptionSummary {
  id: string
  userId?: string
  restaurantId?: string | null
  status: 'active' | 'trialing' | 'past_due' | 'cancelled' | 'expired' | string
  rawStatus?: string
  price?: number
  startedAt?: string | null
  renewsAt?: string | null
  daysLeft?: number | null
  autoRenew?: boolean
  isActive?: boolean
  limits?: {
    planId?: string | null
    planName?: string | null
    price?: number
    maxRestaurants?: number
    maxSites?: number
    maxMenuItems?: number
    features?: string[]
  }
}

/** الطلب المعلق الحالي للحساب (إن وُجد) — يظهر في شاشة انتظار الموافقة */
export interface PendingRequestSummary {
  id: string
  type: 'paid' | 'free'
  planId?: string | null
  planName?: string | null
  price: number
  status: string
  createdAt?: string | null
}

export interface Branch {
  id: string
  restaurant_id?: string
  name: string
  address: string | null
  phone: string | null
  is_active: boolean | number
  accepting_orders: boolean | number
}

export interface Employee {
  id: string
  user_id: string
  name: string
  email: string
  role_name: string
  status: string
  branch_access_type: string
  branch_ids: string[]
}

export interface OrderItem {
  item_id: string
  item_name: string
  qty: number
  price: number
  line_total?: number
}

export interface Order {
  id: string
  number: number | null
  restaurantId: string
  branchId: string | null
  channel: string | null
  table: string | null
  customer: string | null
  customerName?: string | null
  customerPhone?: string | null
  customerEmail?: string | null
  deliveryAddress?: string | null
  note: string | null
  total: number | null
  subtotal: number | null
  deliveryFee: number | null
  discount: number | null
  currency: string | null
  paymentMethod: string | null
  paymentStatus: string | null
  status: string
  createdAt: string
  updatedAt: string
  fulfillment: string | null
  lines: Array<{ itemId: string; name: string; price: number; qty: number }>
}

export interface OwnerDashboard {
  restaurant_id: string
  period: { from: string; to: string }
  filters: { branch_id: string | null }
  metrics: {
    total_orders: number
    orders_by_status: Record<string, number>
    order_value: {
      note: string
      non_cancelled: number
      completed: number
      cancelled: number
      all_including_cancelled: number
      average_non_cancelled: number
    }
    employees: {
      active: number
      suspended: number
      pending: number
      removed: number
      total: number
    }
  }
  recent_orders: Array<{
    id: string
    branch_id: string | null
    status: string
    total: number | null
    created_at: string | null
    channel: string | null
    table_no: string | null
  }>
  branches: Array<{
    branch_id: string | null
    branch_name: string | null
    is_active: boolean | number | null
    accepting_orders: boolean | number | null
    total_orders: number
    by_status: Record<string, number>
    order_value: { non_cancelled: number; completed: number; cancelled: number }
  }>
  definitions: Record<string, string>
}

export interface AuditItem {
  id: number
  action: string
  actor_name: string | null
  actor_role: string | null
  actor_snapshot_at: string | null
  user_id: string | null
  branch_id: string | null
  details: unknown
  created_at: string | null
}

export interface AuditResponse {
  total: number
  limit: number
  offset: number
  items: AuditItem[]
}

export interface SiteCard {
  id: string
  name?: string | null
  name_en?: string | null
  name_ar?: string | null
  name_ku?: string | null
  slug: string
  status: string
  templateId?: string | null
  updated_at?: string | null
  itemCount: number
  categoryCount: number
  isOwner?: boolean | number
  subscriptionStatus?: string | null
  subscriptionPlan?: string | null
  subscriptionRenewsAt?: string | null
}

export interface SitePlanSummary {
  maxSites: number // -1 means unlimited
  used: number
  remaining: number | null
  unlimited: boolean
  canCreate?: boolean
  plan?: { id?: string; name?: string; price?: number } | null
  subscription?: {
    status: 'trialing' | 'active' | 'past_due' | 'cancelled' | 'expired';
    renewsAt: string | null;
    daysLeft: number | null;
    isTrial: boolean;
  } | null;
}

/* --------------------------------- auth ---------------------------------- */

export const authApi = {
  login: (email: string, password: string) =>
    request<LoginResponse>('/api/auth/signin', body({ email, password })),
  employeeLogin: (email: string, password: string) =>
    request<LoginResponse>('/api/auth/employee-login', body({ email, password })),
  logout: () => request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),
  me: () =>
    request<{ ok: boolean; data: { user: ApiUser; sites: any[]; subscription: any } }>('/api/auth/me').then(
      (r) => r?.data?.user
    ),
  /** النسخة الكاملة — تتضمن حالة الاشتراك والطلب المعلق (للبوابة الجدارية للداشبورد) */
  meFull: () =>
    request<{ ok: boolean; data: { user: ApiUser; sites: any[]; subscription: SubscriptionSummary | null; pendingRequest: PendingRequestSummary | null } }>(
      '/api/auth/me'
    ).then((r) => r?.data ?? null),
}

/* -------------------------------- branches ------------------------------- */

export const branchesApi = {
  list: () =>
    request<{ ok: boolean; data: Branch[] }>('/api/branches').then(
      (r) => r?.data ?? []
    ),
  create: (payload: { name: string; address?: string; phone?: string }) =>
    request<Branch>('/api/branches', body(payload)),
  update: (
    id: string,
    payload: Partial<{
      name: string
      address: string | null
      phone: string | null
      is_active: boolean
      accepting_orders: boolean
    }>
  ) => request<Branch>(`/api/branches/${encodeURIComponent(id)}`, patch(payload)),
}

/* -------------------------------- employees ------------------------------ */

export const employeesApi = {
  list: () =>
    request<{ ok: boolean; data: Employee[] }>('/api/employees').then(
      (r) => r?.data ?? []
    ),
  create: (payload: {
    name: string
    email: string
    role: string
    password: string
    branchAccessType?: string
    branchIds?: string[]
  }) =>
    request<{ ok: boolean; data: { id: string; userId: string; name: string; email: string; role: string } }>(
      '/api/employees',
      body(payload)
    ).then((r) => r?.data!),
  update: (id: string, payload: { name?: string; email?: string }) =>
    request<{ ok: boolean }>(`/api/employees/${encodeURIComponent(id)}`, patch(payload)),
  setRole: (id: string, role: string) =>
    request<{ ok: boolean; role: string }>(`/api/employees/${encodeURIComponent(id)}/role`, patch({ role })),
  setBranches: (id: string, branchAccessType: string, branchIds: string[]) =>
    request<{ ok: boolean }>(`/api/employees/${encodeURIComponent(id)}/branches`, patch({ branchAccessType, branchIds })),
  changePassword: (userId: string, payload: { currentPassword?: string; newPassword: string }) =>
    request<{ ok: boolean; needsPasswordChange: boolean; status: string }>(
      `/api/employees/${encodeURIComponent(userId)}/password`,
      patch(payload)
    ),
  suspend: (id: string) =>
    request<{ ok: boolean; status: string }>(`/api/employees/${encodeURIComponent(id)}/suspend`, { method: 'POST' }),
  reactivate: (id: string) =>
    request<{ ok: boolean; status: string }>(`/api/employees/${encodeURIComponent(id)}/reactivate`, { method: 'POST' }),
}

/* --------------------------------- orders -------------------------------- */

export interface PublicOrderPayload {
  restaurantId: string
  channel: string
  customerName?: string
  table?: string
  note?: string
  lines: Array<{ itemId: string; qty: number }>
}

export const ordersApi = {
  create: (payload: PublicOrderPayload) =>
    request<{ ok: boolean; data: Order }>('/api/orders', body(payload)),
  list: (params: { status: string; branch_id?: string; restaurantId?: string }) =>
    request<{ ok: boolean; data: Order[] }>(`/api/orders${query({ status: params.status, branch_id: params.branch_id, restaurantId: params.restaurantId })}`).then(
      (r) => r?.data ?? []
    ),
  get: (id: string) =>
    request<{ ok: boolean; data: Order }>(`/api/orders/${encodeURIComponent(id)}`).then(
      (r) => r?.data!
    ),
  confirm: (id: string) =>
    request<{ ok: boolean; data: any }>(
      `/api/orders/${encodeURIComponent(id)}/status`,
      patch({ status: 'confirmed' })
    ),
  setStatus: (id: string, status: string) =>
    request<{ ok: boolean; data: any }>(
      `/api/orders/${encodeURIComponent(id)}/status`,
      patch({ status })
    ),
  reject: (id: string) =>
    request<{ ok: boolean; data: any }>(
      `/api/orders/${encodeURIComponent(id)}/status`,
      patch({ status: 'cancelled' })
    ),
}

/* --------------------------------- kitchen ------------------------------- */

export const kitchenApi = {
  list: (params: { status: string; branch_id?: string; restaurantId?: string }) =>
    request<{ ok: boolean; data: Order[] }>(`/api/orders${query({ status: params.status, branch_id: params.branch_id, restaurantId: params.restaurantId })}`).then(
      (r) => r?.data ?? []
    ),
  start: (id: string) =>
    request<{ ok: boolean; data: any }>(
      `/api/orders/${encodeURIComponent(id)}/status`,
      patch({ status: 'preparing' })
    ),
  ready: (id: string) =>
    request<{ ok: boolean; data: any }>(
      `/api/orders/${encodeURIComponent(id)}/status`,
      patch({ status: 'ready' })
    ),
  reject: (id: string) =>
    request<{ ok: boolean; data: any }>(
      `/api/orders/${encodeURIComponent(id)}/status`,
      patch({ status: 'cancelled' })
    ),
}

/* --------------------------------- waiter -------------------------------- */

export const waiterApi = {
  list: (params: { status: string; branch_id?: string; restaurantId?: string }) =>
    request<{ ok: boolean; data: Order[] }>(`/api/orders${query({ status: params.status, branch_id: params.branch_id, restaurantId: params.restaurantId })}`).then(
      (r) => r?.data ?? []
    ),
  get: (id: string) =>
    request<{ ok: boolean; data: Order }>(`/api/orders/${encodeURIComponent(id)}`).then(
      (r) => r?.data!
    ),
  complete: (id: string) =>
    request<{ ok: boolean; data: any }>(
      `/api/orders/${encodeURIComponent(id)}/status`,
      patch({ status: 'completed' })
    ),
  returnToKitchen: (id: string, _reason: string) =>
    request<{ ok: boolean; data: any }>(
      `/api/orders/${encodeURIComponent(id)}/status`,
      patch({ status: 'preparing' })
    ),
}

/* ---------------------------------- owner -------------------------------- */

export const ownerApi = {
  dashboard: (params: { from?: string; to?: string; branch_id?: string }) =>
    request<OwnerDashboard>(`/api/owner/dashboard${query(params)}`),
  audit: (params: {
    from?: string
    to?: string
    branch_id?: string
    category?: string
    action?: string
    limit?: number
    offset?: number
  }) => request<AuditResponse>(`/api/owner/audit${query(params)}`),
  cancelOrder: (id: string, reason: string) =>
    request<{ ok: boolean; order: { id: string; status: string; previous_status: string; reason: string } }>(
      `/api/owner/orders/${encodeURIComponent(id)}/cancel`,
      patch({ reason })
    ),
}

/* ---------------------------------- sites -------------------------------- */

export const sitesApi = {
  list: () => request<{ ok: boolean; data: SiteCard[] }>('/api/sites'),
  summary: () => request<{ ok: boolean; data: SitePlanSummary }>('/api/sites/summary'),
  canCreate: () => request<{ ok: boolean; canCreate: boolean }>('/api/sites/can-create'),
  create: (payload: { name: string; slug: string; templateId?: string | null }) =>
    request<{ ok: boolean; data: { id: string; slug: string; name_en?: string } }>(
      '/api/restaurants',
      body(payload)
    ),
}

/* -------------------------------- helpers -------------------------------- */

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return 'Something went wrong'
}

export function isOn(value: boolean | number | null | undefined): boolean {
  return value === true || value === 1
}

export function orderNumber(order: Pick<Order, 'number' | 'id'>): string {
  return order.number === null || order.number === undefined
    ? `#${order.id.slice(-6)}`
    : `#${order.number}`
}
