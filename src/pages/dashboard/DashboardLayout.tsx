import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Icon, Wordmark } from '../../components/icons'
import { Badge, Button } from '../../components/ui'
import { publicUrl } from '../../lib/hooks'
import { cx } from '../../lib/utils'
import { useActiveRestaurant, useStore } from '../../store/useStore'

const NAV = [
  { to: '/dashboard', label: 'Overview', icon: 'home', end: true },
  { to: '/dashboard/menu', label: 'My Menu', icon: 'utensils', end: false },
  { to: '/dashboard/design', label: 'Design & Branding', icon: 'palette', end: false },
  { to: '/dashboard/templates', label: 'Templates', icon: 'layers', end: false },
  { to: '/dashboard/qr-code', label: 'QR Code', icon: 'qr', end: false },
  { to: '/dashboard/subscription', label: 'Subscription', icon: 'card', end: false },
  { to: '/dashboard/settings', label: 'Settings', icon: 'settings', end: false },
] as const

const TITLES: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Overview', subtitle: 'How your menu is performing this week.' },
  '/dashboard/menu': { title: 'My Menu', subtitle: 'Categories, dishes, prices and availability.' },
  '/dashboard/design': { title: 'Design & Branding', subtitle: 'Identity, colors and typography shortcuts.' },
  '/dashboard/templates': { title: 'Templates', subtitle: 'Switch the design system behind your menu.' },
  '/dashboard/qr-code': { title: 'QR Code', subtitle: 'Print-ready codes for tables and windows.' },
  '/dashboard/subscription': { title: 'Subscription', subtitle: 'Demo plans — no payment is ever processed.' },
  '/dashboard/settings': { title: 'Settings', subtitle: 'Restaurant details, contact info and demo data.' },
}

export default function DashboardLayout() {
  const restaurant = useActiveRestaurant()
  const restaurants = useStore((s) => s.restaurants)
  const activeId = useStore((s) => s.activeId)
  const setActive = useStore((s) => s.setActive)
  const dirty = useStore((s) => s.dirty)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [switcherOpen, setSwitcherOpen] = useState(false)

  const meta = TITLES[pathname] ?? TITLES['/dashboard']

  useEffect(() => setSwitcherOpen(false), [pathname])

  return (
    <div className="flex min-h-screen bg-ivory">
      {/* ------------------------------ sidebar ------------------------------ */}
      <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 flex-col bg-ink text-ivory lg:flex">
        <div className="flex h-[70px] items-center justify-between border-b border-white/8 px-6">
          <button type="button" onClick={() => navigate('/')} className="text-left">
            <Wordmark tone="light" />
          </button>
        </div>

        {/* restaurant switcher */}
        <div className="relative border-b border-white/8 p-4">
          <button
            type="button"
            onClick={() => setSwitcherOpen((v) => !v)}
            aria-expanded={switcherOpen}
            className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-left transition hover:border-white/20 hover:bg-white/8"
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
            <div className="absolute left-4 right-4 top-[74px] z-30 overflow-hidden rounded-xl border border-white/12 bg-smoke p-1.5 shadow-[0_30px_60px_-25px_rgba(0,0,0,0.9)] anim-pop">
              {restaurants.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    setActive(r.id)
                    setSwitcherOpen(false)
                  }}
                  className={cx(
                    'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition',
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
            Workspace
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
                  <span className="flex-1">{item.label}</span>
                  {item.to === '/dashboard/menu' && dirty ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-gold" title="Unsaved changes" />
                  ) : null}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-white/8 p-4">
          <div className="rounded-xl bg-white/5 p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-ivory/45">
                Demo plan
              </span>
              <Badge tone="flame">{restaurant.plan}</Badge>
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-ivory/55">
              Every number, plan and URL in this workspace is simulated.
            </p>
            <Button to="/dashboard/subscription" size="sm" variant="light" className="mt-3" full>
              View plans
            </Button>
          </div>
          <div className="mt-3 flex items-center gap-2 px-1">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-[12px] font-semibold">
              MF
            </span>
            <span className="min-w-0 flex-1">
              <span className="line-clamp-1 text-[12.5px] font-medium">Marco Ferrante</span>
              <span className="line-clamp-1 text-[11px] text-ivory/45">owner@bella.demo</span>
            </span>
            <button
              type="button"
              onClick={() => navigate('/')}
              aria-label="Sign out of demo"
              title="Sign out of demo"
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
                  {meta.title}
                </h1>
                {dirty ? (
                  <Badge tone="gold" icon="pencil" className="shrink-0">
                    <span className="hidden sm:inline">Unsaved changes</span>
                    <span className="sm:hidden">Unsaved</span>
                  </Badge>
                ) : restaurant.status === 'published' ? (
                  <Badge tone="moss" icon="check" className="hidden shrink-0 sm:inline-flex">
                    Published
                  </Badge>
                ) : (
                  <Badge tone="outline" icon="clock" className="hidden shrink-0 sm:inline-flex">
                    Draft
                  </Badge>
                )}
              </div>
              <p className="hidden text-[12.5px] text-umber sm:line-clamp-1">{meta.subtitle}</p>
            </div>

            <div className="flex items-center gap-2">
              <Button to="/menu-demo" variant="outline" size="sm" icon="external" className="hidden sm:inline-flex">
                {publicUrl(restaurant.slug)}
              </Button>
              <Button to="/dashboard/qr-code" variant="outline" size="sm" icon="qr" className="hidden md:inline-flex">
                QR code
              </Button>
              <Button to="/dashboard/editor" size="sm" icon="pencil">
                Open editor
              </Button>
            </div>
          </div>

          {/* mobile nav */}
          <nav className="flex gap-1 overflow-x-auto border-t border-sand/70 px-4 py-2 no-scrollbar lg:hidden" aria-label="Dashboard mobile">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cx(
                    'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition',
                    isActive
                      ? 'border-charcoal bg-charcoal text-ivory'
                      : 'border-sand bg-paper text-espresso'
                  )
                }
              >
                <Icon name={item.icon} size={13} />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="min-w-0 flex-1 px-5 py-7 lg:px-8 lg:py-9">
          <div className="mx-auto w-full max-w-[1180px]">
            <Outlet />
          </div>
        </main>

        <footer className="border-t border-sand px-5 py-5 text-[12px] text-clay lg:px-8">
          MenuCraft prototype · all restaurants, analytics, plans and URLs are simulated demo data.
        </footer>
      </div>
    </div>
  )
}
