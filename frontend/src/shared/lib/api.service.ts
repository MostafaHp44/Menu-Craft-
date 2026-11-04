// frontend/src/shared/lib/api.service.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000';

function getToken(): string | null {
  return null; // Token lifecycle handled exclusively via httpOnly cookie
}

function setToken(_token: string): void {
  // No-op: backend sets cookie via Set-Cookie; frontend never touches token
}

function getRefreshToken(): string | null {
  return null;
}

function setRefreshToken(_token: string): void {
  // No-op
}

function removeToken(): void {
  // No-op; backend clears cookie on logout / via clear endpoint
}

/* توكن الوصول ينتهي بعد 15 دقيقة — نجدّده مرة واحدة تلقائياً ثم نعيد المحاولة */

let refreshing: Promise<boolean> | null = null;

/**
 * true فقط لو رفض الـ refresh endpoint التوكن فعلياً (400/401).
 * أخطاء مؤقتة (429 / 5xx / انقطاع الشبكة) لا تعني أن الجلسة انتهت.
 * يُعاد ضبطه مع كل محاولة refresh حتى لا يورّث قراراً قديماً.
 */
let refreshRejected = false;

/**
 * يسجّله متجر المصادقة: يُستدعى فقط عندما تتأكد الجلسة ميتة فعلاً
 * (refresh مرفوض + `/api/auth/me` يرجع 401) — عندها نمسح الجلسة
 * المحفوظة فيترك `RequireAuth` إعادة التوجيه إلى /signin.
 */
let unauthorizedHandler: (() => void) | null = null;

export function setOnUnauthorized(fn: (() => void) | null): void {
  unauthorizedHandler = fn;
}

function handleUnauthorized(): void {
  try {
    unauthorizedHandler?.();
  } catch {
    /* لا نكسر مسار الطلب بسبب فشل الجلسة */
  }
}

function tryRefresh(): Promise<boolean> {
  if (!refreshing) {
    refreshing = (async () => {
      refreshRejected = false;
      try {
        const res = await fetch(`${API_URL}/api/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        // 400 = لا يوجد توكن تحديث، 401 = توكن مرفوض/مستهلك/منتهي
        if (res.status === 400 || res.status === 401) refreshRejected = true;
        return res.ok;
      } catch {
        return false;
      } finally {
        refreshing = null;
      }
    })();
  }

  return refreshing;
}

/**
 * بعد فشل refresh نتأكد بطلب `/api/auth/me` بكوكيز المتصفح الحالية:
 * - 200 = توكن جديد وصل من تبويب آخر (سباق refresh) → الجلسة سليمة.
 * - 401/403 = الجلسة ميتة فعلاً (سرّ خادم تغيّر / توكن مستهلك / منتهي).
 * - خطأ شبكة = لا نعتبر الجلسة ميتة.
 */
async function confirmSessionDead(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/auth/me`, { credentials: 'include' });
    return res.status === 401 || res.status === 403;
  } catch {
    return false;
  }
}
async function request<T>(
  path: string,
  options: RequestInit = {},
  retried = false
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Authorization header removed — backend uses httpOnly cookie via credentials: 'include'
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (res.status === 401) {
    // أخطاء الدخول (401 على /api/auth/*) تعني بيانات خاطئة — لا تُجدَّد ولا تُنهي الجلسة
    if (!path.startsWith('/api/auth/')) {
      if (!retried) {
        if (await tryRefresh()) {
          return request<T>(path, options, true);
        }
        if (refreshRejected) {
          if (await confirmSessionDead()) {
            // refresh مرفوض والجلسة ميتة فعلاً → نمسح الجلسة المحفوظة
            // حتى لا يبقى المستخدم «داخل» لوحة ميتة ترمي 401 للأبد
            removeToken();
            handleUnauthorized();
            console.error('[AUTH DEBUG] session expired, refresh rejected:', path);
            throw new Error('Unauthorized');
          }
          // توكن آخر تبويب وصل للتو — نعيد المحاولة بالكوكيز الحالية مرة واحدة
          return request<T>(path, options, true);
        }
        // refresh فشل مؤقتاً (429/5xx/شبكة) — لا ننهي الجلسة
      } else if (await confirmSessionDead()) {
        removeToken();
        handleUnauthorized();
        console.error('[AUTH DEBUG] session expired after refresh:', path);
        throw new Error('Unauthorized');
      }
    }
    removeToken();
    console.error('[AUTH DEBUG] API returned 401:', path);
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const error: Error & { status?: number } = new Error(
      errorData.error || `Request failed: ${res.status}`
    );
    error.status = res.status;
    throw error;
  }

  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

/* ---------- Auth ---------- */
export const authAPI = {
  signup: (body: { name: string; email: string; password: string; restaurantName: string }) =>
    request<{ ok: boolean; user: any; accessToken: string; refreshToken: string }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  signin: (body: { email: string; password: string }) =>
    request<{ ok: boolean; user: any; accessToken: string; refreshToken: string }>('/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};

/* ---------- Restaurants ---------- */
export const restaurantAPI = {
  getAll: () =>
    request<{ ok: boolean; data: any[] }>('/api/restaurants'),
  getById: (id: string) =>
    request<{ ok: boolean; data: any }>(`/api/restaurants/${id}`),
  getBySlug: (slug: string) =>
    request<{ ok: boolean; data: any }>(`/api/restaurants/slug/${slug}`),
  create: (body: any) =>
    request<{ ok: boolean; data: any }>('/api/restaurants', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  update: (id: string, body: any) =>
    request<{ ok: boolean; data: any }>(`/api/restaurants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  publish: (id: string) =>
    request<{ ok: boolean; data: any }>(`/api/restaurants/${id}/publish`, {
      method: 'PATCH',
    }),
  unpublish: (id: string) =>
    request<{ ok: boolean; data: any }>(`/api/restaurants/${id}/unpublish`, {
      method: 'PATCH',
    }),
  delete: (id: string) =>
    request<{ ok: boolean }>(`/api/restaurants/${id}`, {
      method: 'DELETE',
    }),
};

/* ---------- Orders ---------- */
export const orderAPI = {
  create: (body: any) =>
    request<{ ok: boolean; data: any }>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getByRestaurant: (restaurantId: string, status?: string) =>
    request<{ ok: boolean; data: any[] }>(
      `/api/orders?restaurantId=${restaurantId}${status ? `&status=${status}` : ''}`
    ),
  getById: (id: string) =>
    request<{ ok: boolean; data: any }>(`/api/orders/${id}`),
  /** طلبات كل مواقع الحساب الحالي (لوكحة التحكم) */
  list: (params?: { status?: string; restaurantId?: string; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.restaurantId) q.set('restaurantId', params.restaurantId);
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString();
    return request<{ ok: boolean; data: any[] }>(`/api/orders${qs ? `?${qs}` : ''}`);
  },
  updateStatus: (id: string, status: import('../types/public').RemoteOrderStatus | 'received' | 'preparing' | 'served') =>
    request<{ ok: boolean; data: any }>(`/api/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  delete: (id: string) =>
    request<{ ok: boolean }>(`/api/orders/${id}`, { method: 'DELETE' }),
};

/* ---------- Platform ---------- */
export const platformAPI = {
  getClients: () =>
    request<{ ok: boolean; data: any[] }>('/api/platform/clients'),
  getSubscriptions: () =>
    request<{ ok: boolean; data: any[] }>('/api/platform/subscriptions'),
  getSubscription: (restaurantId: string) =>
    request<{ ok: boolean; data: any }>(`/api/platform/subscriptions/${restaurantId}`),
  createSubscription: (body: {
    restaurantId: string
    planId: string
    price: number
    status: 'active' | 'trialing' | 'past_due' | 'expired'
    renewsAt: string
    autoRenew?: boolean
    paymentIntentId?: string
  }) =>
    request<{ ok: boolean; data: any }>('/api/platform/subscriptions', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateSubscription: (restaurantId: string, body: any) =>
    request<{ ok: boolean }>(`/api/platform/subscriptions/${restaurantId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  getStats: () =>
    request<{ ok: boolean; data: any }>('/api/platform/stats'),
};

/* ---------- Templates (server-backed custom copies) ---------- */
export const templateAPI = {
  /** الزائر: القوالب الفعّالة فقط */
  getPublic: () =>
    request<{ ok: boolean; data: any[] }>('/api/platform/templates'),
  /** الإدارة: كل القوالب (بما فيها المعطّلة) */
  getAll: () =>
    request<{ ok: boolean; data: any[] }>('/api/platform/templates/all'),
  create: (body: { name: string; base_template_id: string; category?: string }) =>
    request<{ ok: boolean; data: any }>('/api/platform/templates', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  remove: (id: string) =>
    request<{ ok: boolean; deactivated?: boolean }>(`/api/platform/templates/${id}`, {
      method: 'DELETE',
    }),
};

/* ---------- Home Content ---------- */
export const homeContentAPI = {
  get: (lang: string = 'en') =>
    request<{ ok: boolean; data: any }>(`/api/home-content?lang=${lang}`),
  update: (lang: string, body: any) =>
    request<{ ok: boolean }>(`/api/home-content/${lang}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
};

/* ---------- Sites (حدّ المواقع + بطاقات المواقع) ---------- */
export const sitesAPI = {
  /** ملخص الحدود: maxSites/used/remaining/subscription */
  summary: () => request<import('../types/public').SiteSummary>('/api/sites/summary'),
  /** مواقع الحساب الحالي (بطاقات) */
  list: () => request<{ ok: boolean; data: import('../types/public').SiteCard[] }>('/api/sites'),
  /** هل يمكن إنشاء موقع جديد الآن؟ */
  canCreate: () => request<{ ok: boolean; canCreate: boolean; reason?: string; remaining?: number | null }>('/api/sites/can-create'),
  /** إنشاء موقع — يرمي 403 PLAN_LIMIT_REACHED عند تجاوز الحد */
  create: (body: { name: string; slug: string; templateId?: string }) =>
    request<{ ok: boolean; data: any }>('/api/sites', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};

/* ---------- المنيو العام (الموقع للزوار) ---------- */
export const menuAPI = {
  getPublicMenu: (slug: string) =>
    request<{ ok: boolean; data: import('../types/public').PublicMenuResponse }>(`/api/public/menu/${encodeURIComponent(slug)}`).then(
      (r) => r.data
    ),
  /** فروع المطعم المنشور (قراءة عامة آمنة) — مع علم قبول الطلبات */
  getPublicBranches: (slug: string) =>
    request<{ ok: boolean; data: import('../types/public').PublicBranch[] }>(`/api/public/menu/${encodeURIComponent(slug)}/branches`).then(
      (r) => r.data
    ),
};

/* ---------- طلب الضيف النهائي → POST /api/orders (قناة online) ---------- */
export const guestOrderAPI = {
  /**
   * إنشاء طلب ضيف عبر نقطة النهاية الحقيقية POST /api/orders.
   * الجسم مطابق لعملية createOrderSchema في الخادم — لا تحقق يُتجاحَل.
   */
  create: (body: import('../types/public').GuestOrderPayload) =>
    request<{ ok: boolean; data: { id: string; number: number; orderToken: string; total: number; currency: string; status: string; paymentStatus: string } }>(
      '/api/orders',
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    ),
  /** تتبع آمن برمز التتبع (رجع الخادم orderToken عند الإنشاء) */
  track: (id: string, token: string) =>
    request<{ ok: boolean; data: import('../types/public').TrackOrderResponse }>(
      `/api/public/orders/${encodeURIComponent(id)}/track?token=${encodeURIComponent(token)}`
    ),
};

/* ---------- الطلبات أونلاين (العميل النهائي) ---------- */
export const publicOrderAPI = {
  /** إنشاء طلب من الموقع العام — يعيد رقم الطلب + توكن التتبع */
  create: (slug: string, body: import('../types/public').OnlineOrderPayload) =>
    request<import('../types/public').OnlineOrderResponse>(`/api/public/menu/${encodeURIComponent(slug)}/orders`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  /** تتبع آمن بالتوكن */
  track: (id: string, token: string) =>
    request<{ ok: boolean; data: import('../types/public').TrackOrderResponse }>(
      `/api/public/orders/${encodeURIComponent(id)}/track?token=${encodeURIComponent(token)}`
    ),
  /** دفع طلب (بطاقة عبر Stripe) */
  pay: (id: string, token: string, body: { method: string; amount: number }) =>
    request<{ ok: boolean; data?: any; url?: string | null }>(
      `/api/public/orders/${encodeURIComponent(id)}/pay`,
      {
        method: 'POST',
        body: JSON.stringify({ ...body, token }),
      }
    ),
};

/* ---------- طرق الدفع المتاحة في الموقع ---------- */
export const paymentsAPI = {
  /** طرق الدفع المهيأة فعليًا لهذا الموقع (عامة) */
  publicMethods: (slug: string) =>
    request<{ ok: boolean; data: import('../types/public').PublicPaymentMethod[] }>(
      `/api/public/menu/${encodeURIComponent(slug)}/payment-methods`
    ),
};

/* ---------- Billing (اشتراك MenuCraft نفسه — Stripe) ---------- */
export const billingAPI = {
  /** حالة Stripe: configured + mode + سجل المدفوعات */
  status: () =>
    request<{
      ok: boolean;
      data: {
        provider: { name: string; configured: boolean; mode: string; webhookConfigured: boolean };
        payments: any[];
      };
    }>('/api/billing/status'),
  /** إنشاء جلسة Checkout لترقية/تجديد الاشتراك — يعيد رابط redirect داخل data.url.
   *  الخادم يقرأ `planId` (معرّف الباقة) ويرفض الباقة المجانية/غير المدفوعة (INVALID_PLAN). */
  checkout: (planId: string) =>
    request<{ ok: boolean; data: { url: string; sessionId: string; amount: number; currency: string; mode: string } }>(
      '/api/billing/checkout',
      {
        method: 'POST',
        body: JSON.stringify({ planId }),
      }
    ),
  /** الباقات المتاحة من الخادم (جدول Plans) — تُستخدم لعرض بطاقات الاشتراك */
  listPlans: () =>
    request<{ ok: boolean; data: any[] }>('/api/platform/plans'),
  /** ملخص حدود المواقع + الاشتراك الحالي للمستخدم (من الكوكي) */
  getSummary: () =>
    request<any>('/api/sites/summary'),
};

/* ---------- Plans ---------- */
export const planAPI = {
  getAll: () =>
    request<{ ok: boolean; data: any[] }>('/api/platform/plans'),
  getById: (id: string) =>
    request<{ ok: boolean; data: any }>(`/api/platform/plans/${id}`),
  create: (body: any) =>
    request<{ ok: boolean; data: any }>('/api/platform/plans', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  update: (id: string, body: any) =>
    request<{ ok: boolean; data: any }>(`/api/platform/plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  delete: (id: string) =>
    request<{ ok: boolean }>(`/api/platform/plans/${id}`, { method: 'DELETE' }),
};

export { setToken, setRefreshToken, removeToken, getToken, getRefreshToken };
