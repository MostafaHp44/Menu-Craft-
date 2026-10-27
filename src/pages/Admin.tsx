import { useMemo, useState } from 'react'
import { Icon } from '../components/icons'
import { Badge, Button, Card, Segmented, StatCard } from '../components/ui'
import { ADMIN_ROWS, MONTHLY_SIGNUPS, PLATFORM_ACTIVITY, PLATFORM_KPIS, PLAN_SPLIT } from '../lib/demoData'
import { TEMPLATES } from '../lib/templates'
import type { DemoPlanId } from '../lib/types'
import { cx, formatDate } from '../lib/utils'

type Tab = 'overview' | 'restaurants' | 'templates'

export default function Admin() {
  const [tab, setTab] = useState<Tab>('overview')
  const [query, setQuery] = useState('')
  const [plan, setPlan] = useState<DemoPlanId | 'all'>('all')

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return ADMIN_ROWS.filter((row) => {
      const matchesPlan = plan === 'all' || row.plan === plan
      const matchesQuery =
        !q || row.name.toLowerCase().includes(q) || row.owner.toLowerCase().includes(q)
      return matchesPlan && matchesQuery
    })
  }, [query, plan])

  const peak = Math.max(...MONTHLY_SIGNUPS.map((m) => m.value))
  const splitTotal = PLAN_SPLIT.reduce((sum, s) => sum + s.value, 0)

  return (
    <div className="min-h-screen bg-[#0f0d0b] text-ivory">
      {/* -------------------------------- top bar ------------------------------- */}
      <header className="sticky top-0 z-40 border-b border-white/8 bg-[#0f0d0b]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[62px] max-w-[1400px] items-center gap-4 px-5">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-flame text-[13px] font-bold text-white">
              M
            </span>
            <div className="leading-tight">
              <div className="text-[14px] font-semibold">MenuCraft Admin</div>
              <div className="text-[11px] uppercase tracking-[0.16em] text-ivory/40">internal · demo</div>
            </div>
          </div>

          <div className="ml-4 hidden md:block">
            <Segmented<Tab>
              size="sm"
              value={tab}
              onChange={setTab}
              ariaLabel="Admin sections"
              options={[
                { value: 'overview', label: 'Overview', icon: 'chart' },
                { value: 'restaurants', label: 'Restaurants', icon: 'store' },
                { value: 'templates', label: 'Templates', icon: 'layers' },
              ]}
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Badge tone="gold" icon="alert">Mock data</Badge>
            <Button to="/" size="sm" variant="light" icon="arrowLeft">
              Back to site
            </Button>
          </div>
        </div>

        <div className="border-t border-white/8 px-5 py-2 md:hidden">
          <Segmented<Tab>
            size="sm"
            full
            value={tab}
            onChange={setTab}
            ariaLabel="Admin sections"
            options={[
              { value: 'overview', label: 'Overview' },
              { value: 'restaurants', label: 'Restaurants' },
              { value: 'templates', label: 'Templates' },
            ]}
          />
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-5 py-8">
        {tab === 'overview' ? (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <StatCard tone="dark" label="Restaurants" value={PLATFORM_KPIS.restaurants.toLocaleString()} delta={`+${PLATFORM_KPIS.growth}%`} icon="store" />
              <StatCard tone="dark" label="Paid subscriptions" value={PLATFORM_KPIS.subscriptions.toLocaleString()} delta="+8.1%" icon="card" />
              <StatCard tone="dark" label="Menu views" value={`${(PLATFORM_KPIS.menuViews / 1_000_000).toFixed(1)}M`} delta="+12.7%" icon="eye" />
              <StatCard tone="dark" label="MRR" value={`$${PLATFORM_KPIS.mrr.toLocaleString('en-US')}`} delta="+6.9%" icon="trendUp" />
              <StatCard tone="dark" label="Templates" value={String(PLATFORM_KPIS.templates)} icon="layers" />
            </div>

            <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr] lg:items-start">
              {/* signups */}
              <Card className="border-white/10 bg-smoke p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-[15.5px] font-semibold text-ivory">Restaurant signups</h3>
                    <p className="mt-1 text-[13px] text-ivory/55">Last 12 months · simulated</p>
                  </div>
                  <div className="text-right">
                    <div className="text-[26px] font-semibold leading-none">
                      {MONTHLY_SIGNUPS.reduce((s, m) => s + m.value, 0).toLocaleString()}
                    </div>
                    <div className="mt-1 flex items-center justify-end gap-1 text-[12px] text-moss">
                      <Icon name="trendUp" size={13} /> +41% YoY
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex h-[210px] items-end gap-1.5 sm:gap-3">
                  {MONTHLY_SIGNUPS.map((month) => (
                    <div key={month.month} className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
                      <span className="hidden text-[11px] font-medium text-ivory/70 opacity-0 transition group-hover:opacity-100 sm:block">
                        {month.value}
                      </span>
                      <div
                        className={cx(
                          'w-full rounded-t-md transition group-hover:brightness-125',
                          month.value === peak ? 'bg-flame' : 'bg-ivory/25'
                        )}
                        style={{ height: `${Math.max(6, (month.value / peak) * 100)}%` }}
                      />
                      <span className="text-[11px] text-ivory/45">{month.month}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* plan split + activity */}
              <div className="space-y-5">
                <Card className="border-white/10 bg-smoke p-6">
                  <h3 className="text-[15.5px] font-semibold text-ivory">Plan split</h3>
                  <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-white/10">
                    <div className="flex h-full">
                      {PLAN_SPLIT.map((slice) => (
                        <span
                          key={slice.label}
                          style={{ width: `${(slice.value / splitTotal) * 100}%`, backgroundColor: slice.color }}
                          title={`${slice.label}: ${slice.value}`}
                        />
                      ))}
                    </div>
                  </div>
                  <ul className="mt-4 space-y-2.5">
                    {PLAN_SPLIT.map((slice) => (
                      <li key={slice.label} className="flex items-center gap-3 text-[13px]">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: slice.color }} />
                        <span className="flex-1 text-ivory/75">{slice.label}</span>
                        <span className="font-semibold">{slice.value}</span>
                        <span className="w-12 text-right text-ivory/45">
                          {Math.round((slice.value / splitTotal) * 100)}%
                        </span>
                      </li>
                    ))}
                  </ul>
                </Card>

                <Card className="border-white/10 bg-smoke p-6">
                  <h3 className="text-[15.5px] font-semibold text-ivory">Platform activity</h3>
                  <ul className="mt-3 space-y-3">
                    {PLATFORM_ACTIVITY.slice(0, 5).map((item) => (
                      <li key={item.id} className="flex gap-3">
                        <span
                          className={cx(
                            'mt-1 h-2 w-2 shrink-0 rounded-full',
                            item.type === 'upgrade'
                              ? 'bg-moss'
                              : item.type === 'publish'
                                ? 'bg-flame'
                                : item.type === 'template'
                                  ? 'bg-gold'
                                  : 'bg-ivory/50'
                          )}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="line-clamp-1 text-[13px] font-medium">{item.title}</span>
                          <span className="line-clamp-1 text-[12px] text-ivory/50">{item.detail}</span>
                        </span>
                        <span className="shrink-0 text-[11px] text-ivory/35">{item.time}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            </div>

            <Card className="border-white/10 bg-smoke p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-[15.5px] font-semibold text-ivory">Latest restaurants</h3>
                  <p className="mt-1 text-[13px] text-ivory/55">Newest five accounts in the mock database</p>
                </div>
                <Button size="sm" variant="light" onClick={() => setTab('restaurants')} iconRight="arrowRight">
                  View all
                </Button>
              </div>
              <div className="mt-4 overflow-x-auto">
                <AdminTable rows={ADMIN_ROWS.slice(0, 5)} />
              </div>
            </Card>
          </div>
        ) : null}

        {tab === 'restaurants' ? (
          <div className="space-y-5">
            <Card className="border-white/10 bg-smoke p-5">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative min-w-[240px] flex-1">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ivory/45">
                    <Icon name="search" size={16} />
                  </span>
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search restaurant or owner…"
                    aria-label="Search restaurants"
                    className="h-11 w-full rounded-xl border border-white/12 bg-white/6 pl-11 pr-4 text-sm text-ivory placeholder:text-ivory/40 focus:border-flame focus:outline-none focus:ring-4 focus:ring-flame/15"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(['all', 'trial', 'starter', 'professional', 'business'] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={plan === option}
                      onClick={() => setPlan(option)}
                      className={cx(
                        'rounded-full border px-3.5 py-2 text-[12.5px] font-medium capitalize transition',
                        plan === option
                          ? 'border-flame bg-flame/15 text-ivory'
                          : 'border-white/12 text-ivory/60 hover:border-white/30 hover:text-ivory'
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            <Card className="border-white/10 bg-smoke p-5">
              <div className="mb-3 flex items-center justify-between text-[13px] text-ivory/55">
                <span>
                  {rows.length} of {ADMIN_ROWS.length} restaurants
                </span>
                <span>mock records</span>
              </div>
              {rows.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/15 px-6 py-12 text-center">
                  <p className="text-[15px] font-semibold">No restaurants match</p>
                  <p className="mt-1 text-[13px] text-ivory/55">Try another search term or plan filter.</p>
                  <Button
                    size="sm"
                    variant="light"
                    className="mt-4"
                    onClick={() => {
                      setQuery('')
                      setPlan('all')
                    }}
                  >
                    Clear filters
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <AdminTable rows={rows} />
                </div>
              )}
            </Card>
          </div>
        ) : null}

        {tab === 'templates' ? (
          <div className="space-y-5">
            <Card className="border-white/10 bg-smoke p-6">
              <h3 className="text-[15.5px] font-semibold text-ivory">Template performance</h3>
              <p className="mt-1 text-[13px] text-ivory/55">
                Usage counts come from the mock platform database.
              </p>

              <div className="mt-5 space-y-3.5">
                {TEMPLATES.map((template) => {
                  const pct = Math.round(
                    (template.usageCount / Math.max(...TEMPLATES.map((t) => t.usageCount))) * 100
                  )
                  return (
                    <div key={template.id}>
                      <div className="flex items-baseline justify-between text-[13px]">
                        <span className="text-ivory/85">
                          {template.name}
                          <span className="ml-2 text-ivory/40">{template.category}</span>
                        </span>
                        <span className="font-semibold">{template.usageCount.toLocaleString()}</span>
                      </div>
                      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/8">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-flame to-flame-light transition-all"
                          style={{ width: `${Math.max(4, pct)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: 'Average setup time', value: '6m 12s', note: 'signup → first publish' },
                { label: 'Templates per restaurant', value: '1.4', note: 'switches in first month' },
                { label: 'Most switched from', value: 'Bella Italia', note: '→ Urban Café' },
              ].map((fact) => (
                <Card key={fact.label} className="border-white/10 bg-smoke p-5">
                  <div className="text-[12.5px] text-ivory/55">{fact.label}</div>
                  <div className="mt-2 text-[24px] font-semibold leading-none">{fact.value}</div>
                  <div className="mt-2 text-[12px] text-ivory/40">{fact.note}</div>
                </Card>
              ))}
            </div>
          </div>
        ) : null}
      </main>

      <footer className="border-t border-white/8 px-5 py-6 text-center text-[12px] text-ivory/40">
        MenuCraft platform admin · every figure on this screen is simulated for the prototype.
      </footer>
    </div>
  )
}

/* --------------------------------- table ---------------------------------- */

function AdminTable({ rows }: { rows: typeof ADMIN_ROWS }) {
  return (
    <table className="w-full min-w-[720px] text-left">
      <thead>
        <tr className="text-[11px] uppercase tracking-[0.14em] text-ivory/40">
          <th className="px-3 py-2.5 font-semibold">Restaurant</th>
          <th className="px-3 py-2.5 font-semibold">Owner</th>
          <th className="px-3 py-2.5 font-semibold">Plan</th>
          <th className="px-3 py-2.5 font-semibold">Status</th>
          <th className="px-3 py-2.5 font-semibold">Views</th>
          <th className="px-3 py-2.5 text-right font-semibold">Created</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-white/8">
        {rows.map((row) => (
          <tr key={row.id} className="transition hover:bg-white/4">
            <td className="px-3 py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/8 text-[12px] font-semibold">
                  {row.name.slice(0, 1)}
                </span>
                <div className="min-w-0">
                  <div className="line-clamp-1 text-[13.5px] font-medium">{row.name}</div>
                  <div className="line-clamp-1 text-[11.5px] text-ivory/40">{row.templateId}</div>
                </div>
              </div>
            </td>
            <td className="px-3 py-3 text-[13px] text-ivory/70">{row.owner}</td>
            <td className="px-3 py-3">
              <span className="capitalize text-[13px]">{row.plan}</span>
            </td>
            <td className="px-3 py-3">
              <span
                className={cx(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium',
                  row.status === 'published' ? 'bg-moss/20 text-moss' : 'bg-gold/15 text-gold'
                )}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {row.status === 'published' ? 'Live' : 'Draft'}
              </span>
            </td>
            <td className="px-3 py-3 text-[13px] font-medium">{row.views.toLocaleString()}</td>
            <td className="px-3 py-3 text-right text-[12.5px] text-ivory/55">{formatDate(row.created)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
