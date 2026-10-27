import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cx } from '../lib/utils.ts'
import { Icon, Wordmark } from '../ui/icons.tsx'
import { Button } from '../ui/ui.tsx'

interface NavItem {
  label: string
  to: string
}

const NAV: NavItem[] = [
  { label: 'Templates', to: '/templates' },
  { label: 'Features', to: '/#features' },
  { label: 'How It Works', to: '/#how' },
  { label: 'Pricing', to: '/#pricing' },
]

export function MarketingHeader({ solid = false }: { solid?: boolean }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const { pathname, hash } = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setOpen(false), [pathname, hash])

  const elevated = scrolled || solid

  return (
    <header
      className={cx(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        elevated
          ? 'border-b border-sand/80 bg-ivory/88 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent'
      )}
    >
      <div className="page-wide page flex h-[70px] items-center justify-between gap-6">
        <Link to="/" aria-label="MenuCraft home" className="shrink-0">
          <Wordmark />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {NAV.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="rounded-full px-3.5 py-2 text-[14px] font-medium text-espresso transition hover:bg-cream hover:text-charcoal"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button to="/signin" variant="ghost" size="sm" className="hidden sm:inline-flex">
            Sign In
          </Button>
          <Button to="/templates" size="sm" icon="arrowRight" iconRight={undefined}>
            Get Started
          </Button>
          <button
            type="button"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-sand bg-paper text-charcoal lg:hidden"
          >
            <Icon name={open ? 'x' : 'menu'} size={18} />
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-sand bg-ivory px-6 pb-6 pt-3 lg:hidden">
          <nav className="flex flex-col" aria-label="Mobile">
            {NAV.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="border-b border-sand/70 py-3.5 text-[15px] font-medium text-charcoal"
              >
                {item.label}
              </Link>
            ))}
            <Link to="/signin" className="border-b border-sand/70 py-3.5 text-[15px] font-medium text-charcoal">
              Sign In
            </Link>
            <Link to="/dashboard" className="py-3.5 text-[15px] font-medium text-charcoal">
              Open Dashboard Demo
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  )
}
