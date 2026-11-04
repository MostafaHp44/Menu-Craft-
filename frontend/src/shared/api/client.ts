/* ------------------------------------------------------------------ *
 * Digital Menu — typed API client.
 *
 * Only endpoints that exist in backend/src/routes are declared here.
 * Anything the product needs but the backend does not expose yet is
 * documented in FRONTEND_COMPLETE_IMPLEMENTATION_REPORT.md instead of
 * being invented in this file.
 * ------------------------------------------------------------------ */

const API_BASE = import.meta.env.VITE_API_URL ?? ''

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
}

export interface LoginResponse {
  ok: boolean
  user: ApiUser
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
  restaurant_id: string
  branch_id: string | null
  order_number: number | null
  status: string
  customer_name?: string | null
  phone?: string | null
  delivery_address?: string | null
  table_no: string | null
  note: string | null
  total: number | null
  created_at: string | null
  channel: string | null
  items: OrderItem[]
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
  name: { en?: string | null; ar?: string | null; ku?: string | null } | string
  slug: string
  status: string
  templateId: string | null
  updatedAt: string | null
  itemCount: number
  orderCount: number
  categoryCount: number
}

export interface SiteSummary {
  maxSites: number
  used: number
  remaining: number | null
  unlimited: boolean
  subscription: {
    planCode: string
    status: string
    currentPeriodEnd: string | null
  }
}

/* --------------------------------- auth ---------------------------------- */

export const authApi = {
  login: (email: string, password: string) =>
    request<LoginResponse>('/api/auth/login', body({ email, password })),
  employeeLogin: (email: string, password: string) =>
    request<LoginResponse>('/api/auth/employee-login', body({ email, password })),
  logout: () => request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),
  me: () => request<ApiUser>('/api/auth/me'),
}

/* -------------------------------- branches ------------------------------- */

export const branchesApi = {
  list: () => request<Branch[]>('/api/branches'),
  get: (id: string) => request<Branch>(`/api/branches/${encodeURIComponent(id)}`),
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
  list: () => request<Employee[]>('/api/employees'),
  create: (payload: {
    name: string
    email: string
    role: string
    temporaryPassword: string
    branch_access_type?: string
  }) => request<{ ok: boolean; employeeId: string }>('/api/employees', body(payload)),
  update: (id: string, payload: { name?: string; email?: string }) =>
    request<{ ok: boolean }>(`/api/employees/${encodeURIComponent(id)}`, patch(payload)),
  setRole: (id: string, role: string) =>
    request<{ ok: boolean; role: string }>(`/api/employees/${encodeURIComponent(id)}/role`, patch({ role })),
  setBranches: (id: string, branch_access_type: string, branch_ids: string[]) =>
    request<{ ok: boolean }>(`/api/employees/${encodeURIComponent(id)}/branches`, patch({ branch_access_type, branch_ids })),
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
  restaurant_id: string
  branch_id: string
  items: Array<{ item_id: string; qty: number }>
  customer_name?: string
  phone?: string
  delivery_address?: string
  table_no?: string
  note?: string
  channel?: string
}

export const ordersApi = {
  create: (payload: PublicOrderPayload) =>
    request<{ ok: boolean; order: Order }>('/api/orders', body(payload)),
  list: (params: { status: string; branch_id?: string }) =>
    request<Order[]>(`/api/orders${query({ status: params.status, branch_id: params.branch_id })}`),
  get: (id: string) => request<Order>(`/api/orders/${encodeURIComponent(id)}`),
  confirm: (id: string) =>
    request<{ ok: boolean; order: { id: string; status: string } }>(
      `/api/orders/${encodeURIComponent(id)}/confirm`,
      { method: 'PATCH' }
    ),
  reject: (id: string, reason: string) =>
    request<{ ok: boolean; order: { id: string; status: string; reason: string } }>(
      `/api/orders/${encodeURIComponent(id)}/reject`,
      patch({ reason })
    ),
}

/* --------------------------------- kitchen ------------------------------- */

export const kitchenApi = {
  list: (params: { status: string; branch_id?: string }) =>
    request<Order[]>(`/api/kitchen/orders${query({ status: params.status, branch_id: params.branch_id })}`),
  start: (id: string) =>
    request<{ ok: boolean }>(`/api/kitchen/orders/${encodeURIComponent(id)}/start`, { method: 'PATCH' }),
  ready: (id: string) =>
    request<{ ok: boolean }>(`/api/kitchen/orders/${encodeURIComponent(id)}/ready`, { method: 'PATCH' }),
  reject: (id: string, reason: string) =>
    request<{ ok: boolean }>(`/api/kitchen/orders/${encodeURIComponent(id)}/reject`, patch({ reason })),
}

/* --------------------------------- waiter -------------------------------- */

export const waiterApi = {
  list: (params: { status: string; branch_id?: string }) =>
    request<Order[]>(`/api/waiter/orders${query({ status: params.status, branch_id: params.branch_id })}`),
  get: (id: string) => request<Order>(`/api/waiter/orders/${encodeURIComponent(id)}`),
  complete: (id: string) =>
    request<{ ok: boolean }>(`/api/waiter/orders/${encodeURIComponent(id)}/complete`, { method: 'PATCH' }),
  returnToKitchen: (id: string, reason: string) =>
    request<{ ok: boolean }>(`/api/waiter/orders/${encodeURIComponent(id)}/return`, patch({ reason })),
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
  list: () => request<{ sites: SiteCard[] }>('/api/sites'),
  summary: () => request<SiteSummary>('/api/sites/summary'),
  canCreate: () => request<{ canCreate: boolean }>('/api/sites/can-create'),
  create: (payload: { name: string; slug: string; templateId?: string | null }) =>
    request<{ ok: boolean; site: { id: string; name: string; slug: string; status: string; templateId: string | null } }>(
      '/api/sites',
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

export function orderNumber(order: Pick<Order, 'order_number' | 'id'>): string {
  return order.order_number === null || order.order_number === undefined
    ? `#${order.id.slice(-6)}`
    : `#${order.order_number}`
}
