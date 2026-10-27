import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Icon, Wordmark } from '../../shared/ui/icons.tsx'
import { Badge, Button } from '../../shared/ui/ui.tsx'
import { LanguageSwitcher } from '../../shared/ui/LanguageSwitcher.tsx'
import { useI18n, type TKey } from '../../shared/i18n'
import { publicUrl } from '../../shared/lib/hooks.ts'
import { cx } from '../../shared/lib/utils.ts'
import { useActiveRestaurant, useStore } from '../../shared/store/useStore.ts'
import { isPlatformAdmin, useAuthStore } from '../../shared/store/useAuth.ts'

const NAV: Array<{ to: string; label: TKey; icon: string; end?: boolean }> = [
  { to: '/dashboard', label: 'dashboard.overview', icon: 'home', end: true },
  { to: '/dashboard/orders', label: 'dashboard.orders', icon: 'list' },
  { to: '/dashboard/earnings', label: 'dashboard.earnings', icon: 'chart' },
  { to: '/dashboard/reports', label: 'dashboard.reports', icon: 'activity' },
  { to: '/dashboard/menu', label: 'dashboard.myMenu', icon: 'utensils' },
  { to: '/dashboard/design', label: 'dashboard.design', icon: 'palette' },
  { to: '/dashboard/templates', label: 'dashboard.templates', icon: 'layers' },
  { to: '/dashboard/payments', label: 'dashboard.payments', icon: 'card' },
  { to: '/dashboard/qr-code', label: 'dashboard.qrCode', icon: 'qr' },
  { to: '/dashboard/subscription', label: 'dashboard.subscription', icon: 'tag' },
  { to: '/dashboard/settings', label: 'dashboard.settings', icon: 'settings' },
]

/** what the phone bottom bar shows before "More" */
const MOBILE_PRIMARY = ['/dashboard', '/dashboard/orders', '/dashboard/menu', '/dashboard/reports']

const TITLES: Record<string, { title: TKey; sub: TKey }> = {
  '/dashboard': { title: 'dashboard.overview', sub: 'dashboard.subOverview' },
  '/dashboard/orders': { title: 'orders.title', sub: 'dashboard.subOrders' },
  '/dashboard/earnings': { title: 'earnings.title', sub: 'dashboard.subEarnings' },
  '/dashboard/reports': { title: 'reports.title', sub: 'dashboard.subReports' },
  '/dashboard/menu': { title: 'menuTab.title', sub: 'dashboard.subMenu' },
  '/dashboard/design': { title: 'dashboard.design', sub: 'dashboard.subDesign' },
  '/dashboard/templates': { title: 'dashboard.templates', sub: 'dashboard.subTemplates' },
  '/dashboard/payments': { title: 'payments.title', sub: 'dashboard.subPayments' },
  '/dashboard/qr-code': { title: 'dashboard.qrCode', sub: 'dashboard.subQr' },
  '/dashboard/subscription': { title: 'subscription.title', sub: 'dashboard.subSubscription' },
  '/dashboard/settings': { title: 'dashboard.settings', sub: 'dashboard.subSettings' },
}

export default function DashboardLayout() {
  const restaurant = useActiveRestaurant()
  const restaurants = useStore((s) => s.restaurants)
  const activeId = useStore((s) => s.activeId)
  const setActive = useStore((s) => s.setActive)
  const dirty = useStore((s) => s.dirty)
  const session = useAuthStore((s) => s.session)
  const signOut = useAuthStore((s) => s.signOut)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { t } = useI18n()
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)

  const meta = TITLES[pathname] ?? TITLES['/dashboard']
  const initials = (session?.name ?? 'Marco Ferrante')
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  useEffect(() => {
    setSwitcherOpen(false)
    setMoreOpen(false)
  }, [pathname])

  const primary = NAV.filter((item) => MOBILE_PRIMARY.includes(item.to))
  const isPrimaryActive = (to: string) => pathname === to || pathname.startsWith(`${to}/`)
  const moreActive = NAV.some(
    (item) => !MOBILE_PRIMARY.includes(item.to) && (pathname === item.to || pathname.startsWith(`${item.to}/`))
  )

  return (
    <div className="flex min-h-screen bg-ivory">
      {/* ------------------------------ sidebar ------------------------------ */}
      <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 flex-col bg-ink text-ivory lg:flex">
        <div className="flex h-[70px] items-center justify-between border-b border-white/8 px-6">
          <button type="button" onClick={() => navigate('/')} className="text-start">
            <Wordmark tone="light" />
          </button>
          <LanguageSwitcher tone="dark" />
        </div>

        {/* restaurant switcher */}
        <div className="relative border-b border-white/8 p-4">
          <button
            type="button"
            onClick={() => setSwitcherOpen((v) => !v)}
            aria-expanded={switcherOpen}
            className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-start transition hover:border-white/20 hover:bg-white/8"
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[13px] font-semibold"
              style={{ backgroundColor: restaurant.design.colors.accent, color: '#fff' }}
            >
              {restaurant.logoText.slice(0, 2)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="line-clamp-1 text-[13.5px] font-semibold">{restaurant.name}</span>
              <span className="line-clamp-1 text-[11.5px] text-ivory/50">
                {publicUrl(restaurant.slug)}
              </span>
            </span>
            <Icon name="chevronDown" size={15} className="shrink-0 text-ivory/50" />
          </button>

          {switcherOpen ? (
            <div className="absolute start-4 end-4 top-[74px] z-30 overflow-hidden rounded-xl border border-white/12 bg-smoke p-1.5 shadow-[0_30px_60px_-25px_rgba(0,0,0,0.9)] anim-pop">
              {restaurants.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    setActive(r.id)
                    setSwitcherOpen(false)
                  }}
                  className={cx(
                    'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-start text-[13px] transition',
                    r.id === activeId ? 'bg-white/10 text-ivory' : 'text-ivory/65 hover:bg-white/6 hover:text-ivory'
                  )}
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: r.design.colors.accent }}
                  />
                  <span className="min-w-0 flex-1 line-clamp-1">{r.name}</span>
                  {r.id === activeId ? <Icon name="check" size={13} /> : null}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 thin-scroll" aria-label="Dashboard">
          <p className="px-3 pb-2 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-ivory/35">
            {t('dashboard.workspace')}
          </p>
          <ul className="space-y-0.5">
            {NAV.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cx(
                      'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition',
                      isActive
                        ? 'bg-flame text-white shadow-[0_10px_24px_-16px_rgba(232,87,31,0.95)]'
                        : 'text-ivory/62 hover:bg-white/6 hover:text-ivory'
                    )
                  }
                >
                  <Icon name={item.icon} size={17} />
                  <span className="flex-1">{t(item.label)}</span>
                  {item.to === '/dashboard/menu' && dirty ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-gold" title={t('dashboard.unsaved')} />
                  ) : null}
                </NavLink>
              </li>
            ))}
            {isPlatformAdmin(session) ? (
              <li className="pt-2">
                <NavLink
                  to="/admin"
                  className="flex items-center gap-3 rounded-xl border border-white/10 px-3 py-2.5 text-[13.5px] font-medium text-ivory/62 transition hover:bg-white/6 hover:text-ivory"
                >
                  <Icon name="store" size={17} />
                  <span className="flex-1">{t('nav.admin')}</span>
                  <Icon name="arrowUpRight" size={13} className="text-ivory/40" />
                </NavLink>
              </li>
            ) : null}
            {session?.role === 'worker' ? (
              <li>
                <NavLink
                  to="/worker"
                  className="flex items-center gap-3 rounded-xl border border-white/10 px-3 py-2.5 text-[13.5px] font-medium text-ivory/62 transition hover:bg-white/6 hover:text-ivory"
                >
                  <Icon name="utensils" size={17} />
                  <span className="flex-1">{t('orders.kitchenBoard')}</span>
                  <Icon name="arrowUpRight" size={13} className="text-ivory/40" />
                </NavLink>
              </li>
            ) : null}
          </ul>
        </nav>

        <div className="border-t border-white/8 p-4">
          <div className="rounded-xl bg-white/5 p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-ivory/45">
                {t('dashboard.demoPlan')}
              </span>
              <Badge tone="flame">{restaurant.plan}</Badge>
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-ivory/55">
              {t('dashboard.simulatedNote')}
            </p>
            <Button to="/dashboard/subscription" size="sm" variant="light" className="mt-3" full>
              {t('dashboard.viewPlans')}
            </Button>
          </div>
          <div className="mt-3 flex items-center gap-2 px-1">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-[12px] font-semibold">
              {initials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="line-clamp-1 text-[12.5px] font-medium">
                {session?.name ?? 'Marco Ferrante'}
              </span>
              <span className="line-clamp-1 text-[11px] text-ivory/45">
                {session?.email ?? 'owner@bella.demo'}
              </span>
            </span>
            <button
              type="button"
              onClick={() => {
                signOut()
                navigate('/')
              }}
              aria-label={t('dashboard.signOut')}
              title={t('dashboard.signOut')}
              className="rounded-lg p-2 text-ivory/50 transition hover:bg-white/8 hover:text-ivory"
            >
              <Icon name="logout" size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ------------------------------- main -------------------------------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-sand bg-ivory/90 backdrop-blur-xl">
          <div className="flex h-[70px] items-center gap-4 px-5 lg:px-8">
            <div className="flex items-center gap-3 lg:hidden">
              <button
                type="button"
                onClick={() => navigate('/')}
                aria-label="MenuCraft home"
                className="rounded-lg p-1.5"
              >
                <Wordmark />
              </button>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-2.5 overflow-hidden">
                <h1 className="line-clamp-1 min-w-0 shrink text-[17px] font-semibold tracking-[-0.01em] text-charcoal">
                  {t(meta.title)}
                </h1>
                {dirty ? (
                  <Badge tone="gold" icon="pencil" className="shrink-0">
                    <span className="hidden sm:inline">{t('dashboard.unsaved')}</span>
                    <span className="sm:hidden">•</span>
                  </Badge>
                ) : restaurant.status === 'published' ? (
                  <Badge tone="moss" icon="check" className="hidden shrink-0 sm:inline-flex">
                    {t('common.published')}
                  </Badge>
                ) : (
                  <Badge tone="outline" icon="clock" className="hidden shrink-0 sm:inline-flex">
                    {t('common.draft')}
                  </Badge>
                )}
              </div>
              <p className="hidden text-[12.5px] text-umber sm:line-clamp-1">{t(meta.sub)}</p>
            </div>

            <div className="flex items-center gap-2">
              <LanguageSwitcher className="hidden md:inline-flex" />
              <Button to="/menu-demo" variant="outline" size="sm" icon="external" className="hidden sm:inline-flex">
                {publicUrl(restaurant.slug)}
              </Button>
              <Button to="/dashboard/qr-code" variant="outline" size="sm" icon="qr" className="hidden md:inline-flex">
                {t('dashboard.qrCode')}
              </Button>
              <Button to="/dashboard/editor" size="sm" icon="pencil">
                {t('dashboard.openEditor')}
              </Button>
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-5 pb-28 pt-7 lg:px-8 lg:pb-9 lg:pt-9">
          <div className="mx-auto w-full max-w-[1180px]">
            <Outlet />
          </div>
        </main>

        <footer className="border-t border-sand px-5 pb-24 pt-5 text-[12px] text-clay lg:px-8 lg:pb-5">
          MenuCraft prototype · all restaurants, analytics, plans and URLs are simulated demo data.
        </footer>
      </div>

      {/* ------------------------- phone bottom bar -------------------------- */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-sand bg-paper/95 backdrop-blur-xl lg:hidden"
        aria-label="Dashboard bottom navigation"
      >
        <ul className="mx-auto flex max-w-lg items-stretch justify-between px-2 pb-[env(safe-area-inset-bottom)]">
          {primary.map((item) => {
            const active = isPrimaryActive(item.to)
            return (
              <li key={item.to} className="flex-1">
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={cx(
                    'flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-xl text-[10.5px] font-semibold transition',
                    active ? 'text-flame' : 'text-clay'
                  )}
                >
                  <span
                    className={cx(
                      'flex h-7 w-11 items-center justify-center rounded-full transition',
                      active ? 'bg-flame/12' : ''
                    )}
                  >
                    <Icon name={item.icon} size={18} />
                  </span>
                  {t(item.label)}
                </NavLink>
              </li>
            )
          })}
          <li className="flex-1">
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className={cx(
                'flex min-h-[58px] w-full flex-col items-center justify-center gap-1 rounded-xl text-[10.5px] font-semibold transition',
                moreActive ? 'text-flame' : 'text-clay'
              )}
            >
              <span
                className={cx(
                  'flex h-7 w-11 items-center justify-center rounded-full transition',
                  moreActive ? 'bg-flame/12' : ''
                )}
              >
                <Icon name="menu" size={18} />
              </span>
              {t('dashboard.more')}
            </button>
          </li>
        </ul>
      </nav>

      {/* --------------------------- "More" sheet ---------------------------- */}
      <AnimatePresence>
        {moreOpen ? (
          <motion.div
            className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              aria-label={t('common.close')}
              onClick={() => setMoreOpen(false)}
              className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 34 }}
              className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-sand bg-ivory p-5 pb-8 shadow-[0_-30px_60px_-30px_rgba(15,13,11,0.4)]"
            >
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-sand" />
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[15px] font-semibold text-charcoal">{session?.name ?? 'Marco Ferrante'}</p>
                  <p className="text-[12px] text-umber">{session?.email ?? 'owner@bella.demo'}</p>
                </div>
                <LanguageSwitcher />
              </div>

              <ul className="grid grid-cols-2 gap-2">
                {NAV.map((item) => {
                  const active = pathname === item.to || pathname.startsWith(`${item.to}/`)
                  return (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.end}
                        className={cx(
                          'flex items-center gap-2.5 rounded-2xl border px-3.5 py-3 text-[13.5px] font-medium transition',
                          active
                            ? 'border-charcoal bg-charcoal text-ivory'
                            : 'border-sand bg-paper text-espresso'
                        )}
                      >
                        <Icon name={item.icon} size={17} />
                        <span className="line-clamp-1">{t(item.label)}</span>
                      </NavLink>
                    </li>
                  )
                })}
                <li>
                  <NavLink
                    to="/menu-demo"
                    className="flex items-center gap-2.5 rounded-2xl border border-sand bg-paper px-3.5 py-3 text-[13.5px] font-medium text-espresso transition"
                  >
                    <Icon name="external" size={17} />
                    <span className="line-clamp-1">{t('dashboard.viewSite')}</span>
                  </NavLink>
                </li>
                {session?.role === 'worker' ? (
                  <li>
                    <NavLink
                      to="/worker"
                      className="flex items-center gap-2.5 rounded-2xl border border-sand bg-paper px-3.5 py-3 text-[13.5px] font-medium text-espresso transition"
                    >
                      <Icon name="utensils" size={17} />
                      <span className="line-clamp-1">{t('orders.kitchenBoard')}</span>
                    </NavLink>
                  </li>
                ) : null}
                {isPlatformAdmin(session) ? (
                  <li>
                    <NavLink
                      to="/admin"
                      className="flex items-center gap-2.5 rounded-2xl border border-sand bg-paper px-3.5 py-3 text-[13.5px] font-medium text-espresso transition"
                    >
                      <Icon name="store" size={17} />
                      <span className="line-clamp-1">{t('nav.admin')}</span>
                    </NavLink>
                  </li>
                ) : null}
              </ul>

              <Button
                variant="outline"
                full
                className="mt-4"
                icon="logout"
                onClick={() => {
                  signOut()
                  navigate('/')
                }}
              >
                {t('dashboard.signOut')}
              </Button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
