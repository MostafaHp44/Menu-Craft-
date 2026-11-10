/* ------------------------------------------------------------------ *
 * MenuCraft — centralized API client
 * All requests go through `fetch` with `credentials: 'include'` so the
 * HttpOnly JWT cookie is sent to the backend on every request.
 * ------------------------------------------------------------------ */

const API_BASE = import.meta.env.VITE_API_URL_ABSOLUTE || '';

function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

/** Normalised JSON error body returned by the backend. */
interface BackendError {
  error?: string;
  message?: string;
}

class ApiError extends Error {
  status: number;
  backend?: BackendError;

  constructor(status: number, message: string, backend?: BackendError) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.backend = backend;
  }
}

async function json<T>(
  input: RequestInfo | URL,
  init: any
): Promise<T> {
  const response = await fetch(input, {
    credentials: 'include',
    headers: { ...init.headers, 'Content-Type': 'application/json' },
    ...init,
    body: init.body ? JSON.stringify(init.body) : undefined,
  } as RequestInit);

  let body: BackendError | null = null;
  try {
    body = (await response.json()) as BackendError;
  } catch {
    // non-JSON error body — ignore
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      (body?.message || response.statusText) ?? 'Unknown error',
      body ?? undefined
    );
  }

  return (body ?? {}) as T;
}

export const authAPI = {
  logout: () => json<{ ok: boolean }>(apiUrl('/api/auth/logout'), { method: 'POST' }),
  me: () => json<{ id: string; email: string; role: string }>(apiUrl('/api/auth/me'), { method: 'GET' }),
};

export const sitesAPI = {
  list: () => json<{ ok: boolean; data: Array<{
    id: string;
    name_en?: string | null;
    name_ar?: string | null;
    name_ku?: string | null;
    slug: string;
    status: string;
    templateId?: string | null;
    plan?: string | null;
    updated_at?: string | null;
    itemCount: number;
    categoryCount: number;
    isOwner?: boolean | number;
    subscriptionStatus?: string | null;
    subscriptionPlan?: string | null;
    subscriptionRenewsAt?: string | null;
  }> }>(apiUrl('/api/sites'), { method: 'GET' }),
  summary: () => json<{ ok: boolean; data: { maxSites: number; used: number; unlimited: boolean; remaining: number | null; canCreate?: boolean; plan?: { id?: string; name?: string; price?: number } | null; subscription: { status: string; renewsAt: string | null; daysLeft: number | null; isTrial: boolean } | null } }>(
    apiUrl('/api/sites/summary'),
    { method: 'GET' }
  ),
  canCreate: () => json<{ ok: boolean; canCreate: boolean }>(apiUrl('/api/sites/can-create'), { method: 'GET' }),
  // POST /api/restaurants هو مسار الإنشاء الحقيقي (يفرض حد الباقة على السيرفر)
  create: (payload: { name: string; slug: string; templateId?: string | null }) =>
    json<{ ok: boolean; data: { id: string; slug: string; name_en?: string } }>(
      apiUrl('/api/restaurants'),
      { method: 'POST', body: payload }
    ),
};

/**
 * التمبليتات المختارة من صاحب المطعم (تبويب "قوالبي") — مخزّنة في قاعدة البيانات
 * تحت معرّف الموقع، فتظهر من أي جهاز يسجّل الدخول بنفس الحساب.
 */
export const templatesAPI = {
  list: (restaurantId: string) =>
    json<{ ok: boolean; data: Array<{ templateId: string; selectedAt: string }> }>(
      apiUrl(`/api/restaurants/${encodeURIComponent(restaurantId)}/templates`),
      { method: 'GET' }
    ),
  select: (restaurantId: string, templateId: string) =>
    json<{ ok: boolean }>(
      apiUrl(`/api/restaurants/${encodeURIComponent(restaurantId)}/templates`),
      { method: 'POST', body: { templateId } }
    ),
  remove: (restaurantId: string, templateId: string) =>
    json<{ ok: boolean }>(
      apiUrl(
        `/api/restaurants/${encodeURIComponent(restaurantId)}/templates/${encodeURIComponent(templateId)}`
      ),
      { method: 'DELETE' }
    ),
};

export { ApiError };
