import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cx } from '../lib/utils.ts'
import { Icon, Wordmark } from '../ui/icons.tsx'
import { Button } from '../ui/ui.tsx'
import { LanguageSwitcher } from '../ui/LanguageSwitcher.tsx'
import { useI18n, type TKey } from '../i18n'

interface NavItem {
  key: TKey
  to: string
}

const NAV: NavItem[] = [
  { key: 'nav.templates', to: '/templates' },
  { key: 'nav.features', to: '/#features' },
  { key: 'nav.howItWorks', to: '/#how' },
  { key: 'nav.pricing', to: '/#pricing' },
]

export function MarketingHeader({ solid = false }: { solid?: boolean }) {
  const { t } = useI18n()
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
        <Link to="/" aria-label={t('web.header.homeAria')} className="shrink-0">
          <Wordmark />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label={t('web.header.primaryNav')}>
          {NAV.map((item) => (
            <Link
              key={item.key}
              to={item.to}
              className="rounded-full px-3.5 py-2 text-[14px] font-medium text-espresso transition hover:bg-cream hover:text-charcoal"
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* phones get the switcher inside the drawer so the bar never overflows */}
          <LanguageSwitcher className="hidden sm:inline-flex" />
          <Button to="/signin" variant="ghost" size="sm" className="hidden sm:inline-flex">
            {t('nav.signIn')}
          </Button>
          <Button to="/templates" size="sm" icon="arrowRight" iconRight={undefined}>
            {t('nav.getStarted')}
          </Button>
          <button
            type="button"
            aria-label={open ? t('web.header.closeMenu') : t('web.header.openMenu')}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-sand bg-paper text-charcoal lg:hidden"
          >
            <Icon name={open ? 'x' : 'menu'} size={18} />
          </button>
        </div>
      </div>

      {open ? (
        <div className="max-h-[calc(100vh_-_70px)] overflow-y-auto border-t border-sand bg-ivory px-6 pb-6 pt-3 lg:hidden">
          <div className="flex items-center justify-between gap-3 border-b border-sand/70 py-3">
            <span className="text-[13px] font-medium text-clay">{t('common.language')}</span>
            <LanguageSwitcher />
          </div>
          <nav className="flex flex-col" aria-label={t('web.header.mobileNav')}>
            {NAV.map((item) => (
              <Link
                key={item.key}
                to={item.to}
                className="border-b border-sand/70 py-3.5 text-[15px] font-medium text-charcoal"
              >
                {t(item.key)}
              </Link>
            ))}
            <Link
              to="/signin"
              className="border-b border-sand/70 py-3.5 text-[15px] font-medium text-charcoal"
            >
              {t('nav.signIn')}
            </Link>
            <Link to="/dashboard" className="py-3.5 text-[15px] font-medium text-charcoal">
              {t('web.header.dashboardDemo')}
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  )
}
