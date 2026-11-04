import { Link } from 'react-router-dom'
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
    <footer className="border-t border-sand bg-ivory">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <span className="inline-flex items-center gap-2.5">

            <span className="text-[17px] font-semibold tracking-[-0.02em] text-charcoal">
              Digital <span className="text-flame">Menu</span>
            </span>
          </span>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-umber">
            {t('web.footer.tagline')}
          </p>
          <div className="mt-6 flex items-center gap-2.5">
            <span className="inline-flex items-center gap-2 rounded-full border border-sand px-3 py-1.5 text-[12.5px] text-umber">
              <span className="h-1.5 w-1.5 rounded-full bg-moss anim-pulse-dot" />
              {t('web.footer.demoOnline')}
            </span>
          </div>
        </div>

        {COLUMNS.map((column) => (
          <div key={column.title}>
            <h3 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-charcoal">
              {t(column.title)}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {column.links.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-umber transition hover:text-flame"
                  >
                    {'label' in link ? t(link.label) : link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h3 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-charcoal">
            Contact
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm text-umber">
            <li>hello@digitalmenu.com</li>
            <li>+20 100 000 0000</li>
            <li>Mon – Fri · 9:00 – 18:00</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-sand">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-umber sm:flex-row sm:px-6">
          <span>© {year} Digital Menu. All rights reserved.</span>
          <span className="rounded-full border border-sand px-3 py-1">
            {t('web.footer.madeFor')}
          </span>
        </div>
      </div>
    </footer>
  )
}
