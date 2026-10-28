import { Link } from 'react-router-dom'
import { Icon, LogoMark } from '../ui/icons.tsx'
import { useI18n, type TKey } from '../i18n'

type FooterLink = { to: string; label: TKey } | { to: string; name: string }

const COLUMNS: Array<{ title: TKey; links: FooterLink[] }> = [
  {
    title: 'web.footer.product',
    links: [
      { label: 'web.footer.visualEditor', to: '/dashboard/editor' },
      { label: 'web.footer.restaurantDashboard', to: '/dashboard' },
      { label: 'web.footer.qrGenerator', to: '/dashboard/qr-code' },
      { label: 'web.footer.publishedMenu', to: '/menu-demo' },
    ],
  },
  {
    title: 'nav.templates',
    links: [
      { label: 'web.footer.allTemplates', to: '/templates' },
      { name: 'The Royal', to: '/templates/the-royal' },
      { name: 'Bella Italia', to: '/templates/bella-italia' },
      { name: 'Urban Cafe', to: '/templates/urban-cafe' },
    ],
  },
  {
    title: 'web.footer.demo',
    links: [
      { label: 'web.footer.platformAdmin', to: '/admin' },
      { label: 'nav.signIn', to: '/signin' },
      { label: 'nav.pricing', to: '/#pricing' },
      { label: 'nav.howItWorks', to: '/#how' },
    ],
  },
]

export function MarketingFooter() {
  const { t } = useI18n()
  const year = new Date().getFullYear()

  return (
    <footer className="relative overflow-hidden bg-ink text-ivory">
      <div className="page-wide page relative py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-sm">
            <span className="inline-flex items-center gap-2.5">
              <LogoMark size={34} />
              <span className="text-[17px] font-semibold tracking-[-0.02em]">
                Menu<span className="text-flame">Craft</span>
              </span>
            </span>
            <p className="mt-4 text-[15px] leading-relaxed text-ivory/60">
              {t('web.footer.tagline')}
            </p>
            <div className="mt-6 flex items-center gap-2.5">
              <span className="inline-flex items-center gap-2 rounded-full border border-ivory/15 px-3 py-1.5 text-[12.5px] text-ivory/70">
                <Icon name="globe" size={14} />
                bella.menucraft.com
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-ivory/15 px-3 py-1.5 text-[12.5px] text-ivory/70">
                <span className="h-1.5 w-1.5 rounded-full bg-moss anim-pulse-dot" />
                {t('web.footer.demoOnline')}
              </span>
            </div>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title}>
              <h3 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-ivory/45">
                {t(column.title)}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-[14.5px] text-ivory/70 transition hover:text-flame"
                    >
                      {'label' in link ? t(link.label) : link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-ivory/10 pt-7 text-[13px] text-ivory/45 sm:flex-row sm:items-center sm:justify-between">
          <p>{t('web.footer.legal', { year })}</p>
          <div className="flex items-center gap-5">
            <a href="#top" className="transition hover:text-ivory">
              {t('web.footer.backToTop')}
            </a>
            <span className="text-ivory/25">·</span>
            <span>{t('web.footer.madeFor')}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
