import { Link } from 'react-router-dom'
import { Icon, LogoMark } from '../ui/icons.tsx'

const COLUMNS: Array<{ title: string; links: Array<{ label: string; to: string }> }> = [
  {
    title: 'Product',
    links: [
      { label: 'Visual editor', to: '/dashboard/editor' },
      { label: 'Restaurant dashboard', to: '/dashboard' },
      { label: 'QR code generator', to: '/dashboard/qr-code' },
      { label: 'Published menu', to: '/menu-demo' },
    ],
  },
  {
    title: 'Templates',
    links: [
      { label: 'All templates', to: '/templates' },
      { label: 'The Royal', to: '/templates/the-royal' },
      { label: 'Bella Italia', to: '/templates/bella-italia' },
      { label: 'Urban Cafe', to: '/templates/urban-cafe' },
    ],
  },
  {
    title: 'Demo',
    links: [
      { label: 'Platform admin', to: '/admin' },
      { label: 'Sign in', to: '/signin' },
      { label: 'Pricing', to: '/#pricing' },
      { label: 'How it works', to: '/#how' },
    ],
  },
]

export function MarketingFooter() {
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
              Digital menu websites for restaurants, cafés and bakeries. Pick a design, make it
              yours, publish it — no code, no plugins, no waiting.
            </p>
            <div className="mt-6 flex items-center gap-2.5">
              <span className="inline-flex items-center gap-2 rounded-full border border-ivory/15 px-3 py-1.5 text-[12.5px] text-ivory/70">
                <Icon name="globe" size={14} />
                bella.menucraft.com
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-ivory/15 px-3 py-1.5 text-[12.5px] text-ivory/70">
                <span className="h-1.5 w-1.5 rounded-full bg-moss anim-pulse-dot" />
                Demo online
              </span>
            </div>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title}>
              <h3 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-ivory/45">
                {column.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-[14.5px] text-ivory/70 transition hover:text-flame"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-ivory/10 pt-7 text-[13px] text-ivory/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} MenuCraft. Interactive product demo — all data, prices and sites are simulated.</p>
          <div className="flex items-center gap-5">
            <a href="#top" className="transition hover:text-ivory">
              Back to top
            </a>
            <span className="text-ivory/25">·</span>
            <span>Made for food businesses</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
