import { Link } from 'react-router-dom'
import { Icon } from '../../components/icons'
import { Badge, Button, Card, Sparkline, StatCard } from '../../components/ui'
import { RECENT_ACTIVITY } from '../../lib/demoData'
import { publicUrl } from '../../lib/hooks'
import { getTemplate } from '../../lib/templates'
import { cx, formatDate, timeAgo } from '../../lib/utils'
import { useActiveRestaurant, useStore } from '../../store/useStore'

const QUICK_ACTIONS = [
  { to: '/dashboard/menu', icon: 'utensils', title: 'Edit menu', note: 'Add dishes, prices, photos' },
  { to: '/dashboard/design', icon: 'palette', title: 'Change design', note: 'Colors, fonts, logo' },
  { to: '/dashboard/qr-code', icon: 'qr', title: 'Download QR', note: 'Print-ready PNG & SVG' },
  { to: '/dashboard/templates', icon: 'layers', title: 'Browse templates', note: 'Eight complete designs' },
] as const

export default function Overview() {
  const r = useActiveRestaurant()
  const dirty = useStore((s) => s.dirty)
  const itemCount = r.menu.reduce((sum, c) => sum + c.items.length, 0)
  const available = r.menu.reduce((sum, c) => sum + c.items.filter((i) => i.available).length, 0)
  const template = getTemplate(r.templateId)
  const scanRate = r.stats.views > 0 ? Math.round((r.stats.qrScans / r.stats.views) * 100) : 0
  const peak = Math.max(...r.stats.trend)
  const total = r.stats.trend.reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-6">
      {/* welcome strip */}
      <Card className="relative overflow-hidden p-6 lg:p-7">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <span className="eyebrow">Good to see you, Marco</span>
            <h2 className="display-serif mt-2.5 text-[clamp(24px,3vw,32px)] leading-tight text-charcoal">
              {r.name} is {r.status === 'published' && !dirty ? 'live and taking orders.' : 'one click from live.'}
            </h2>
            <p className="mt-2 max-w-xl text-[14.5px] leading-relaxed text-umber">
              {dirty ? (
                <>
                  You have unsaved changes in the editor. Save the draft or publish to push them to the
                  public menu.
                </>
              ) : (
                <>
                  Last updated {timeAgo(r.updatedAt)} · template <strong className="font-semibold text-espresso">{template.name}</strong> ·{' '}
                  {itemCount} menu items across {r.menu.length} categories.
                </>
              )}
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <Button to="/dashboard/editor" icon="pencil" size="sm">
                Open editor
              </Button>
              <Button to="/menu-demo" variant="outline" size="sm" icon="external">
                View public menu
              </Button>
              <Button to="/dashboard/qr-code" variant="ghost" size="sm" icon="qr">
                QR code
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-sand bg-cream/60 p-5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-umber">
                Your address
              </span>
              <Badge tone={r.status === 'published' ? 'moss' : 'gold'}>
                {r.status === 'published' ? 'Published' : 'Draft'}
              </Badge>
            </div>
            <Link
              to="/menu-demo"
              className="mt-2.5 block font-mono text-[15px] font-medium text-charcoal transition hover:text-flame"
            >
              {publicUrl(r.slug)}
            </Link>
            <p className="mt-1 text-[12px] leading-relaxed text-clay">
              Simulated MenuCraft subdomain — DNS is never provisioned in this prototype.
            </p>
            <div className="mt-4 flex items-center gap-4 border-t border-sand/70 pt-4 text-[12px] text-umber">
              <span className="flex items-center gap-1.5">
                <Icon name="clock" size={13} /> Updated {formatDate(r.updatedAt)}
              </span>
              <span className="flex items-center gap-1.5">
                <Icon name="eye" size={13} /> {available}/{itemCount} available
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Menu views"
          value={r.stats.views.toLocaleString()}
          delta="+18.2%"
          icon="eye"
          trend={r.stats.trend}
        />
        <StatCard
          label="QR scans"
          value={r.stats.qrScans.toLocaleString()}
          delta="+9.4%"
          icon="qr"
          trend={r.stats.trend.map((v) => Math.round(v / 9))}
        />
        <StatCard label="Scan rate" value={`${scanRate}%`} delta="+1.1%" icon="activity" />
        <StatCard label="Menu items" value={String(itemCount)} delta="+2" icon="utensils" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr] lg:items-start">
        {/* traffic card */}
        <Card className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="text-[15.5px] font-semibold text-charcoal">Menu views · last 7 days</h3>
              <p className="mt-1 text-[13px] text-umber">
                Simulated analytics for {publicUrl(r.slug)}
              </p>
            </div>
            <div className="text-right">
              <div className="text-[26px] font-semibold leading-none tracking-[-0.02em] text-charcoal">
                {total.toLocaleString()}
              </div>
              <div className="mt-1 flex items-center justify-end gap-1 text-[12px] font-medium text-moss">
                <Icon name="trendUp" size={13} /> +14.6% vs. last week
              </div>
            </div>
          </div>

          <div className="mt-6 flex h-[190px] items-end gap-1.5 sm:gap-4">
            {r.stats.trend.map((value, i) => {
              const height = Math.max(8, Math.round((value / peak) * 100))
              const label = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i] ?? ''
              return (
                <div key={label} className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
                  <span className="hidden text-[11.5px] font-medium text-umber opacity-0 transition group-hover:opacity-100 sm:block">
                    {value.toLocaleString()}
                  </span>
                  <div
                    className={cx(
                      'w-full rounded-t-lg transition-all duration-300 group-hover:brightness-110',
                      i === r.stats.trend.indexOf(peak) ? 'bg-flame' : 'bg-clay/55 group-hover:bg-clay'
                    )}
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-[11.5px] text-clay">{label}</span>
                </div>
              )
            })}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-sand/70 pt-4 text-[12.5px] text-umber">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-flame" /> Busiest day
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-clay/60" /> Other days
            </span>
            <span className="ml-auto text-clay">Demo data · not measured from real visitors</span>
          </div>
        </Card>

        {/* activity */}
        <Card className="flex flex-col p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[15.5px] font-semibold text-charcoal">Recent activity</h3>
            <Badge tone="neutral">Demo feed</Badge>
          </div>
          <ul className="mt-4 space-y-1">
            {RECENT_ACTIVITY.map((a) => (
              <li
                key={a.id}
                className="flex items-start gap-3 rounded-xl px-2 py-2.5 transition hover:bg-cream/70"
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cream text-espresso">
                  <Icon name={a.icon === 'publish' ? 'send' : a.icon === 'qr' ? 'qr' : a.icon === 'item' ? 'star' : a.icon === 'design' ? 'palette' : 'pencil'} size={15} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-1 text-[13.5px] font-medium text-charcoal">{a.title}</span>
                  <span className="line-clamp-1 text-[12.5px] text-umber">{a.detail}</span>
                </span>
                <span className="shrink-0 text-[11.5px] text-clay">{a.time}</span>
              </li>
            ))}
          </ul>
          <div className="mt-auto pt-4">
            <Button to="/dashboard/menu" variant="outline" size="sm" full icon="arrowRight">
              Continue editing
            </Button>
          </div>
        </Card>
      </div>

      {/* quick actions */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className="group rounded-2xl border border-sand bg-paper p-5 transition hover:-translate-y-0.5 hover:border-clay hover:shadow-[0_18px_40px_-30px_rgba(27,23,20,0.6)]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cream text-espresso transition group-hover:bg-flame group-hover:text-white">
              <Icon name={action.icon} size={18} />
            </span>
            <span className="mt-3 block text-[14.5px] font-semibold text-charcoal">{action.title}</span>
            <span className="mt-0.5 block text-[12.5px] text-umber">{action.note}</span>
          </Link>
        ))}
      </div>

      {/* pulse */}
      <Card className="flex flex-wrap items-center gap-6 p-6">
        <div className="min-w-[200px] flex-1">
          <span className="eyebrow">Weekly pulse</span>
          <p className="mt-2 text-[14px] leading-relaxed text-umber">
            {publicUrl(r.slug)} is being scanned mostly from table tents. Peak traffic lands between
            19:00 and 21:00, right before the dinner rush.
          </p>
        </div>
        <div className="flex items-center gap-6">
          <div>
            <div className="text-[12px] uppercase tracking-[0.14em] text-clay">Views</div>
            <div className="mt-1 w-32 text-flame">
              <Sparkline values={r.stats.trend} />
            </div>
          </div>
          <div>
            <div className="text-[12px] uppercase tracking-[0.14em] text-clay">Scans</div>
            <div className="mt-1 w-32 text-moss">
              <Sparkline values={r.stats.trend.map((v) => Math.round(v / 7))} />
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
