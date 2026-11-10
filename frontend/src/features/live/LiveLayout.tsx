import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Icon, Wordmark } from '../../shared/ui/icons.tsx'
import { Badge, Button } from '../../shared/ui/ui.tsx'
import { LanguageSwitcher } from '../../shared/ui/LanguageSwitcher.tsx'
import { useI18n, type TKey } from '../../shared/i18n'
import { cx } from '../../shared/lib/utils.ts'
import { homePathFor, useSession } from '../../shared/store/useSession.ts'
import { useBackendAuth } from '../../shared/store/useBackendAuth.ts'
import { useAuthStore } from '../../shared/store/useAuth.ts'
import { branchesApi, type ApiRole, type Branch } from '../../shared/api/client.ts'
import { useAsync } from './useAsync.ts'
import OrderRingNode from './OrderRingNode.tsx'

interface NavItem {
  to: string
  label: TKey
  icon: string
}

const OWNER_NAV: NavItem[] = [
  { to: '/workspace/overview', label: 'live.nav.overview', icon: 'home' },
  { to: '/workspace/orders', label: 'live.nav.orders', icon: 'list' },
  { to: '/workspace/branches', label: 'live.nav.branches', icon: 'store' },
  { to: '/workspace/team', label: 'live.nav.team', icon: 'users' },
  { to: '/workspace/audit', label: 'live.nav.audit', icon: 'activity' },
  { to: '/workspace/kitchen', label: 'live.nav.kitchen', icon: 'utensils' },
  { to: '/workspace/waiter', label: 'live.nav.waiter', icon: 'book' },
  { to: '/workspace/sites', label: 'live.nav.sites', icon: 'globe' },
  { to: '/workspace/subscription', label: 'live.nav.subscription', icon: 'tag' },
  { to: '/workspace/account', label: 'live.nav.account', icon: 'settings' },
]

const CASHIER_NAV: NavItem[] = [
  { to: '/workspace/orders', label: 'live.nav.orders', icon: 'list' },
  { to: '/workspace/account', label: 'live.nav.account', icon: 'settings' },
]

const KITCHEN_NAV: NavItem[] = [
  { to: '/workspace/kitchen', label: 'live.nav.kitchen', icon: 'utensils' },
  { to: '/workspace/account', label: 'live.nav.account', icon: 'settings' },
]

const WAITER_NAV: NavItem[] = [
  { to: '/workspace/waiter', label: 'live.nav.waiter', icon: 'book' },
  { to: '/workspace/account', label: 'live.nav.account', icon: 'settings' },
]

export function navFor(role: string | undefined): NavItem[] {
  const r = (role || '').toLowerCase();
  switch (r) {
    case 'cashier': return CASHIER_NAV;
    case 'kitchen': return KITCHEN_NAV;
    case 'waiter': return WAITER_NAV;
    case 'owner': return OWNER_NAV;
    default: return CASHIER_NAV;
  }
}

export default function LiveLayout() {
  const { user, status, refresh, logout } = useSession()
  const { t } = useI18n()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [ringEnabled, setRingEnabled] = useState(() => localStorage.getItem('ringEnabled') !== 'false')

  // الفروع تخصم المطعم المرتبط بالمستخدم (ال’endpoint يُفلتر حسب الدور/المطعم من الخلفية)
  const branches = useAsync<Branch[]>(() => branchesApi.list(), [user?.restaurant_id])
  const branchList = branches.data ?? []
  const branchLabel =
    branchList.length === 1 ? branchList[0]?.name : branchList.length > 1 ? `${branchList[0]?.name} +${branchList.length - 1}` : null

  useEffect(() => {
    if (status === 'idle') void refresh()
  }, [status, refresh])

  if (status === 'idle' || status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ivory">
        <div className="flex flex-col items-center gap-3 text-umber">
          <span className="h-7 w-7 animate-spin rounded-full border-2 border-flame border-t-transparent" />
          <span className="text-[13px]">{t('live.common.loading')}</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/workspace/login" replace state={{ from: pathname }} />
  }

  if (user.needsPasswordChange && pathname !== '/workspace/account') {
    return <Navigate to="/workspace/account" replace />
  }

  const nav = navFor(user.role)
  const initials = (user.name || user.email || '?')
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  const signOut = async () => {
    await logout()
    // تصفير باقي الجلسات لئلا يرتد المستخدم في نفس الجلسة (SignIn bounce)
    useAuthStore.getState().signOut()
    void useBackendAuth.getState().logout()
    navigate('/workspace/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-ivory">
      <div className="flex">
        <aside className="sticky top-0 hidden h-screen w-[252px] shrink-0 flex-col bg-ink text-ivory lg:flex">
          <div className="flex h-[68px] items-center justify-between border-b border-white/8 px-5">
            <button type="button" onClick={() => navigate('/')} className="text-start">
              <Wordmark tone="light" />
            </button>
            <LanguageSwitcher tone="dark" />
          </div>

          <div className="border-b border-white/8 px-5 py-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-moss/20 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-moss">
              <span className="h-1.5 w-1.5 rounded-full bg-moss" />
              {t('live.nav.liveData')}
            </span>
            <p className="mt-2 line-clamp-1 text-[13.5px] font-semibold">{user.name || user.email}</p>
            <p className="line-clamp-1 text-[11.5px] text-ivory/45">{user.email}</p>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4 thin-scroll" aria-label={t('live.nav.workspace')}>
            <ul className="space-y-0.5">
              {nav.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      cx(
                        'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition',
                        isActive
                          ? 'bg-flame text-white'
                          : 'text-ivory/62 hover:bg-white/6 hover:text-ivory'
                      )
                    }
                  >
                    <Icon name={item.icon} size={17} />
                    <span className="flex-1">{t(item.label)}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="border-t border-white/8 p-4">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-[12px] font-semibold">
                {initials || '?'}
              </span>
              <span className="min-w-0 flex-1">
                <span className="line-clamp-1 block text-[12.5px] font-medium">{user.name || user.email}</span>
                <span className="block text-[11px] text-ivory/45">{user.role ? t(`live.roles.${user.role.toLowerCase()}` as TKey) : ''}</span>
              </span>
            </div>
            <Button variant="light" size="sm" icon="logout" full onClick={signOut}>
              {t('live.nav.signOut')}
            </Button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-sand bg-ivory/92 backdrop-blur-xl">
            <div className="flex h-[64px] items-center gap-3 px-4 lg:px-8">
              <button type="button" onClick={() => navigate('/')} className="lg:hidden" aria-label="Digital Menu">
                <Wordmark />
              </button>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-[15px] font-semibold text-charcoal">
                  {user.restaurant_name || t('live.nav.workspace')}
                </p>
                <div className="flex items-center gap-2 text-[11.5px] text-umber">
                  {user.email}
                  {branchLabel && (
                    <>
                      <span className="w-[1px] h-3.5 bg-sand/40 mx-1.5" />
                      <span className="flex items-center gap-1">
                        <Icon name="store" size={11} className="shrink-0" />
                        {branchLabel}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <Badge tone="moss" className="hidden sm:inline-flex">
                {user.role ? t(`live.roles.${user.role.toLowerCase()}` as TKey) : ''}
              </Badge>
              <button
                type="button"
                onClick={() => {
                  const next = !ringEnabled
                  setRingEnabled(next)
                  localStorage.setItem('ringEnabled', String(next))
                }}
                aria-pressed={ringEnabled}
                title={ringEnabled ? 'Mute ring' : 'Enable ring'}
                className={cx(
                  'hidden h-9 w-9 items-center justify-center rounded-full border transition sm:flex',
                  ringEnabled ? 'border-moss bg-moss/15 text-moss' : 'border-amber bg-amber/15 text-amber-dark'
                )}
              >
                <Icon name="info" size={16} />
              </button>
              <LanguageSwitcher className="hidden md:inline-flex" />
              <Button variant="outline" size="sm" icon="logout" className="hidden sm:inline-flex" onClick={signOut}>
                {t('live.nav.signOut')}
              </Button>
              <Button variant="ghost" size="sm" icon="logout" className="sm:hidden !px-2" onClick={signOut} aria-label={t('live.nav.signOut')}>
                {''}
              </Button>
            </div>

            <nav className="flex gap-1 overflow-x-auto px-3 pb-2 thin-scroll lg:hidden" aria-label={t('live.nav.workspace')}>
              {nav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cx(
                      'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition',
                      isActive
                        ? 'border-charcoal bg-charcoal text-ivory'
                        : 'border-sand bg-paper text-espresso'
                    )
                  }
                >
                  <Icon name={item.icon} size={14} />
                  {t(item.label)}
                </NavLink>
              ))}
            </nav>
          </header>

          <main className="min-w-0 flex-1 px-4 pb-16 pt-6 lg:px-8 lg:pt-8">
            <div className="mx-auto w-full max-w-[1180px]">
              {user.needsPasswordChange ? (
                <div className="mb-5 rounded-2xl border border-gold/35 bg-gold/10 px-4 py-3 text-[13px] text-charcoal">
                  {t('live.account.firstLogin')}
                </div>
              ) : null}
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      <OrderRingNode scope="staff" />
    </div>
  )
}

export function WorkspaceHome() {
  const user = useSession((state) => state.user)
  return <Navigate to={homePathFor(user)} replace />
}

/** Route-level role guard. The layout already redirects anonymous users. */
export function RoleGate({ roles, children }: { roles: ApiRole[]; children: ReactNode }) {
  const user = useSession((state) => state.user)
  if (!user) return null
  const role = (user.role || '').toLowerCase()
  const allowed = roles.some((r) => r.toLowerCase() === role)
  if (!allowed) {
    return <Navigate to={homePathFor(user)} replace />
  }
  return <>{children}</>
}
