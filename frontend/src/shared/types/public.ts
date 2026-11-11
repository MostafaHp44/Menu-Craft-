/**
 * أنواع بيانات الـ API الحقيقي (الخادم Fastify/MSSQL) — تختلف عن أنواع الـ
 * local-store demo القديمة في `src/shared/types/index.ts`، لذا نفصلها هنا
 * حتى لا نكسر أي كود قائم يعتمد الأنواع القديمة.
 */

/* ------------------------------------------------------------------ */
/* تلخيص حدود المواقع / الاشتراك  →  GET /api/sites/summary           */
/* ------------------------------------------------------------------ */
export type PlanCode = 'trial' | 'professional' | 'business';

export interface SubscriptionSummary {
  planCode: PlanCode;
  status: 'trialing' | 'active' | 'past_due' | 'cancelled' | 'expired';
  currentPeriodEnd: string | null;
}

export interface SiteSummary {
  maxSites: number; // -1 = بلا حد
  used: number;
  remaining: number | null;
  unlimited: boolean;
  canCreate?: boolean;
  plan?: { id?: string; name?: string; price?: number } | null;
  subscription?: {
    status: 'trialing' | 'active' | 'past_due' | 'cancelled' | 'expired';
    renewsAt: string | null;
    daysLeft: number | null;
    isTrial: boolean;
  } | null;
}

export interface SiteCard {
  id: string;
  name?: string | null;
  name_en?: string | null;
  name_ar?: string | null;
  name_ku?: string | null;
  slug: string;
  status: string;
  templateId: string | null;
  updated_at?: string | null;
  itemCount: number;
  categoryCount: number;
  isOwner?: boolean | number;
}

/* ------------------------------------------------------------------ */
/* المنيو العام  →  GET /api/public/menu/:slug                         */
/* ------------------------------------------------------------------ */
export interface PublicMenuItemOptionGroup {
  id: string;
  name: string | { en: string; ar: string; ku: string };
  min: number;
  max: number;
  required: boolean;
  options: Array<{ id?: string; name: string | { en: string; ar: string; ku: string }; price?: number }>;
}

export interface PublicMenuItem {
  id: string;
  name: string | { en: string; ar: string; ku: string };
  description?: string | { en: string; ar: string; ku: string };
  price: number;
  compareAt?: number | null;
  image?: string;
  featured?: boolean;
  popular?: boolean;
  available?: boolean;
  options?: { groups: PublicMenuItemOptionGroup[] } | null;
}

export interface PublicMenuCategory {
  id: string;
  name: string | { en: string; ar: string; ku: string };
  note?: string | { en: string; ar: string; ku: string } | null;
  items: PublicMenuItem[];
}

export interface PublicRestaurant {
  id: string;
  name: string | { en: string; ar: string; ku: string };
  slug: string;
  tagline?: string | { en: string; ar: string; ku: string } | null;
  description?: string | { en: string; ar: string; ku: string } | null;
  logoText?: string | { en: string; ar: string; ku: string } | null;
  logoStyle?: string;
  heroImage?: string;
  heroVideo?: string;
  gallery?: string[];
  phone?: string;
  email?: string;
  address?: string;
  hours?: unknown[];
  socials?: Record<string, string>;
  templateId?: string;
  design?: unknown;
  language?: string;
  status?: string;
  /** Two product modes (UPGRADE_FLOW_SPEC §1): live = ordering-enabled, static = design-only */
  mode?: string;
  updatedAt?: string;
  copy?: unknown;
  inline?: unknown;
}

export interface PublicPaymentMethod {
  code: string;
  label: string;
  kind: 'online' | 'offline';
  requiresConfirmation?: boolean;
}

export interface PublicOrdering {
  enabled: boolean;
  currency: string;
  /** توافق الخادم: كائن أعلام {delivery, pickup} من إعدادات الطلب */
  fulfillment: { delivery: boolean; pickup: boolean };
  deliveryFee: number;
  minOrder: number;
  promo: { code: string; announce: boolean } | null;
  paymentMethods: PublicPaymentMethod[];
}

export interface PublicMenuResponse {
  restaurant: PublicRestaurant;
  menu: PublicMenuCategory[];
  ordering: PublicOrdering;
}

/* ------------------------------------------------------------------ */
/* فروع المطعم العامّة → GET /api/public/menu/:slug/branches            */
/* ------------------------------------------------------------------ */
export interface PublicBranch {
  id: string;
  name: string | { en?: string; ar?: string; ku?: string };
  address: string;
  /** هل الفرع يقبل الطلبات الآن (عمود Branches.accepting_orders) */
  acceptingOrders: boolean;
}

/* ------------------------------------------------------------------ */
/* طلب الضيف النهائي → POST /api/orders (قناة online)                   */
/* مطابق لعملية createOrderSchema في الخادم (order.service.js)    */
/* ------------------------------------------------------------------ */
export type GuestFulfillment = 'delivery' | 'pickup' | 'table';

export interface GuestOrderLine {
  itemId: string;
  qty: number;
  /** الاختيارات كمعرِّفات صالحة أمامه الخادم — أسعار الإضافات غير مطبقة بعد (قرار معتمد) */
  options?: Array<{ groupId: string; optionId: string }>;
}

export interface GuestOrderPayload {
  restaurantId?: string;
  slug: string;
  customer: { name: string; phone: string; email?: string };
  fulfillment: GuestFulfillment;
  deliveryAddress?: string;
  table?: string;
  note?: string;
  paymentMethod: string;
  lines: GuestOrderLine[];
  idempotencyKey?: string;
}

/* ------------------------------------------------------------------ */
/* الطلب أونلاين                                                       */
/* ------------------------------------------------------------------ */
export type RemoteOrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled';

export interface OnlineOrderItemInput {
  itemId: string;
  name?: string;
  quantity: number;
  unitPrice?: number;
  note?: string;
  options?: Array<{ name: string; price?: number }>;
}

export interface OnlineOrderPayload {
  customerName: string;
  customerPhone: string;
  type: 'delivery' | 'pickup';
  address?: string | null;
  notes?: string | null;
  paymentMethod: string;
  items: OnlineOrderItemInput[];
}

export interface OnlineOrderResponse {
  id: string;
  number: number;
  token: string;
  total: number;
  status: RemoteOrderStatus;
  paymentStatus: string;
  requiresConfirmation?: boolean;
}

export interface TrackOrderResponse {
  id: string;
  number: number;
  status: RemoteOrderStatus;
  paymentStatus: string;
  paymentMethod?: string | null;
  total: number;
  type: 'delivery' | 'pickup';
  createdAt: string;
  estimatedAt?: string | null;
  restaurant?: { name: string | { en: string; ar: string; ku: string }; slug: string; phone?: string | null } | null;
}

/* ------------------------------------------------------------------ */
/* الطلب من لوحة التحكم  →  GET /api/orders                            */
/* ------------------------------------------------------------------ */
export interface OrderLine {
  name: string;
  quantity: number;
  unitPrice: number;
  options?: Array<{ name: string; price: number }> | null;
}

export interface DashboardOrder {
  id: string;
  number: number;
  type: 'delivery' | 'pickup' | 'dine_in' | 'takeaway';
  status: RemoteOrderStatus | string;
  paymentMethod: string | null;
  paymentStatus: string | null;
  total: number;
  customer: {
    name: string | null;
    phone: string | null;
    address: string | null;
    notes: string | null;
  } | null;
  lines: OrderLine[];
  createdAt: string;
  token?: string | null;
}
