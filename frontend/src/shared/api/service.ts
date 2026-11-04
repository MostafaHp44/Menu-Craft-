/* ------------------------------------------------------------------ *
 * MenuCraft — centralized API client
 * All requests go through `fetch` with `credentials: 'include'` so the
 * HttpOnly JWT cookie is sent to the backend on every request.
 * ------------------------------------------------------------------ */

const API_BASE = import.meta.env.VITE_API_URL ?? '';

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
  login: (email: string, password: string) =>
    json<{ ok: boolean; user: { id: string; name: string; email: string; role: string } }>(
      apiUrl('/api/auth/login'),
      { method: 'POST', body: { email, password } }
    ),
  logout: () => json<{ ok: boolean }>(apiUrl('/api/auth/logout'), { method: 'POST' }),
  me: () => json<{ id: string; email: string; role: string }>(apiUrl('/api/auth/me'), { method: 'GET' }),
};

export const sitesAPI = {
  list: () => json<{ sites: Array<{
    id: string;
    name: { en?: string | null; ar?: string | null; ku?: string | null };
    slug: string;
    status: string;
    templateId: string | null;
    updatedAt: string | null;
    itemCount: number;
    orderCount: number;
    categoryCount: number;
  }> }>(apiUrl('/api/sites'), { method: 'GET' }),
  summary: () => json<{ maxSites: number; used: number; remaining: number | null; unlimited: boolean; subscription: { planCode: string; status: string; currentPeriodEnd: string | null } }>(
    apiUrl('/api/sites/summary'),
    { method: 'GET' }
  ),
  canCreate: () => json<{ canCreate: boolean }>(apiUrl('/api/sites/can-create'), { method: 'GET' }),
  create: (payload: { name: string; slug: string; templateId?: string | null }) =>
    json<{ ok: boolean; site: { id: string; name: string; slug: string; status: string; templateId: string | null } }>(
      apiUrl('/api/sites'),
      { method: 'POST', body: payload }
    ),
};

export { ApiError };
