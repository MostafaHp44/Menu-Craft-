import { useEffect, useRef, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useSession } from '../store/useSession.ts'
import { useBackendAuth } from '../store/useBackendAuth.ts'

/**
 * فصل تام بين اللوحات الثلاث — كل دور يدخل لوحته فقط:
 *
 *   1) السوبر أدمن  → /admin                 (super_admin, admin)
 *   2) الكلاينت     → /dashboard             (owner, client)  — أصحاب المطاعم
 *   3) الموظفين     → /workspace             (cashier, kitchen, waiter)
 *
 * أي دور غير معروف لا يفتح أي لوحة ويُعاد إلى الصفحة العامة.
 */

export type Panel = 'admin' | 'client' | 'staff'

const ADMIN_ROLES = new Set(['super_admin', 'admin'])
const CLIENT_ROLES = new Set(['owner', 'client'])
const STAFF_ROLES = new Set(['cashier', 'kitchen', 'waiter'])

/** الدور → اللوحة المخصصة له. `null` = لا يفتح أي لوحة. */
export function panelForRole(role?: string | null): Panel | null {
  const r = String(role || '')
    .trim()
    .toLowerCase()
  if (ADMIN_ROLES.has(r)) return 'admin'
  if (CLIENT_ROLES.has(r)) return 'client'
  if (STAFF_ROLES.has(r)) return 'staff'
  return null
}

/** وجهة الدور عند محاولته دخول لوحة ليست له. */
export function homeForRole(role?: string | null): string {
  switch (panelForRole(role)) {
    case 'admin':
      return '/admin'
    case 'client':
      return '/dashboard'
    case 'staff':
      return '/workspace'
    default:
      return '/'
  }
}

/**
 * شاشة الدخول لكل لوحة — كل لوحة بابها الخاص:
 *   1) السوبر أدمن → `/admin/login`
 *   2) الكلاينت (أصحاب المطاعم) → `/signin`
 *   3) الموظفين → `/workspace/login`
 */
export function loginForPanel(panel: Panel): string {
  if (panel === 'admin') return '/admin/login'
  if (panel === 'client') return '/signin'
  return '/workspace/login'
}

function PanelSpinner({ label }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory">
      <div className="flex flex-col items-center gap-3 text-umber">
        <span className="h-7 w-7 animate-spin rounded-full border-2 border-flame border-t-transparent" />
        {label ? <span className="text-[13px]">{label}</span> : null}
      </div>
    </div>
  )
}

/**
 * بوابة لوحة الكلاينت/الموظفين.
 * تقرأ من جلسة الموظفين (`useSession`) لأنها نفس الجلسة التي يفتح بها
 * المالك والموظف — فلا يحدث تعارض بين مصدرين مختلفين للجلسة.
 */
export function PanelGate({ panel, children }: { panel: Panel; children: ReactNode }) {
  const user = useSession((s) => s.user)
  const status = useSession((s) => s.status)
  const refresh = useSession((s) => s.refresh)

  /**
   * تحقق من الكوكي مرة واحدة لكل mount.
   * السبب: بعد تسجيل الدخول في /signin (كوكي حقيقية عبر useBackendAuth)،
   * ينتقل المستخدم إلى /dashboard لكن useSession قد يكون ready/null من
   * زيارة سابقة — بدون تحقق، PanelGate يرد بـ Navigate إلى /signin،
   * وصفحة التسجيل تراه كمسجّل فترجّعنا إلى /dashboard — loop لا نهائي
   * (الشاشة "ترجع استرستر" كما يصفها العملاء). الـ ref يضمن استدعاء
   * واحد فقط، وعند الفشل يفكّ الـ PanelGate وينقل مرة واحدة — لا تكرار.
   */
  const didVerify = useRef(false)
  useEffect(() => {
    if (didVerify.current || user) return
    didVerify.current = true
    void refresh()
  }, [user, refresh])

  if (status === 'idle' || status === 'loading') return <PanelSpinner />
  if (!user) return <Navigate to={loginForPanel(panel)} replace />
  if (panelForRole(user.role) !== panel) return <Navigate to={homeForRole(user.role)} replace />
  return <>{children}</>
}

/**
 * بوابة لوحة السوبر أدمن — جلسة الباك إند فقط (P1).
 * لا تعتمد على أي جلسة محلية في localStorage: الدخول يتم عبر تسجيل دخول
 * حقيقي في /admin/login يصدر كوكي JWT من الخادم، والدور يُقرأ من
 * `GET /api/auth/me` — ولا يُفتح /admin بدون ذلك.
 */
export function AdminGate({ children }: { children: ReactNode }) {
  const backendUser = useBackendAuth((s) => s.user)
  const backendStatus = useBackendAuth((s) => s.status)

  const backendIsAdmin = backendUser?.role === 'super_admin' || backendUser?.role === 'admin'

  if (backendStatus === 'idle' || backendStatus === 'loading') return <PanelSpinner />
  if (backendIsAdmin) return <>{children}</>
  return <Navigate to="/admin/login" replace />
}
