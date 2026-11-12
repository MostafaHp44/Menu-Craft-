/**
 * مصدر واحد لاسم الـ API.
 *
 * محليًا (تطوير): VITE_API_URL_ABSOLUTE فاضي و PROD=false → الطلبات على نفس
 * الأوريجين (/api/...) وتمرّت عبر الـ Vite proxy (انظر vite.config.ts).
 *
 * للايف (vertex-electric.org + api.vertex-electric.org):
 *   - VITE_API_URL_ABSOLUTE=https://api.vertex-electric.org ، أو
 *   - أي build إنتاج (import.meta.env.PROD) بدون المتغير → https://api.vertex-electric.org افتراضيًا.
 * لا مسافة ولا سلاش آخر في القيمة.
 */
const API_BASE = String(import.meta.env.VITE_API_URL_ABSOLUTE || (import.meta.env.PROD ? 'https://api.vertex-electric.org' : '')).trim().replace(/\/+$/, '')

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`
}
