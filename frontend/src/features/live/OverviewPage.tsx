import { useMemo, useState } from 'react'
import { Card, Button, Field, Input, Select } from '../../shared/ui/ui.tsx'
import { Icon } from '../../shared/ui/icons.tsx'
import { useI18n } from '../../shared/i18n'
import { useSession } from '../../shared/store/useSession.ts'
import { useAsync } from './useAsync.ts'
import { branchesApi, type Branch, ownerApi } from '../../shared/api/client.ts'
import {
  ErrorBlock,
  LoadingBlock,
  PageHeader,
  RefreshButton,
  StatusBadge,
  EmptyBlock,
} from './components.tsx'
import { daysAgoISO, formatNumber, todayISO } from './format.ts'
import { Link } from 'react-router-dom'

export default function OverviewPage() {
  const { t, lang } = useI18n()
  const user = useSession((s) => s.user)
  const [from, setFrom] = useState(daysAgoISO(6))
  const [to, setTo] = useState(todayISO())
  const [branchId, setBranchId] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const branches = useAsync<Branch[]>(() => branchesApi.list(), [])
  const dashboard = useAsync(
    () =>
      ownerApi.dashboard({
        ...(from && to ? { from, to } : {}),
        branch_id: branchId || undefined,
      }),
    [from, to, branchId]
  )

  const data = dashboard.data
  const branchNames = useMemo(() => {
    const map = new Map<string, string>()
    for (const branch of branches.data ?? []) map.set(branch.id, branch.name)
    return map
  }, [branches.data])

  const statusCounts = useMemo(() => {
    const orders = data?.metrics.orders_by_status ?? {}
    return {
      pending: orders['pending'] ?? 0,
      confirmed: orders['confirmed'] ?? 0,
      preparing: orders['preparing'] ?? 0,
      ready: orders['ready'] ?? 0,
      completed: orders['completed'] ?? 0,
      cancelled: orders['cancelled'] ?? 0,
    }
  }, [data])

  const attentionItems = useMemo(() => {
    const list: { label: string; action: string; to: string; icon: string; tone: 'gold' | 'rose' | 'flame' }[] = []
    if (statusCounts.pending > 0) {
      list.push({ label: `${statusCounts.pending} new order${statusCounts.pending > 1 ? 's' : ''} need${statusCounts.pending > 1 ? '' : 's'} your confirmation`, action: t('live.overview.goToOrders'), to: '/workspace/orders', icon: 'list', tone: 'gold' })
    }
    const notAccepting = (data?.branches ?? []).filter((b) => b.accepting_orders === false || b.accepting_orders === 0 || (typeof b.accepting_orders === 'string' && b.accepting_orders === '0'))
    if (notAccepting.length > 0) {
      list.push({ label: `${notAccepting.length} branch${notAccepting.length > 1 ? 'es' : ''} not accepting orders`, action: t('live.overview.goToBranches'), to: '/workspace/branches', icon: 'store', tone: 'rose' })
    }
    const suspended = data?.metrics.employees.suspended ?? 0
    if (suspended > 0) {
      list.push({ label: `${suspended} staff suspended`, action: t('live.overview.goToTeam'), to: '/workspace/team', icon: 'users', tone: 'gold' })
    }
    return list
  }, [data, statusCounts, t])

  const quickActions = [
    { label: t('live.overview.actionOrders'), to: '/workspace/orders', icon: 'list' },
    { label: t('live.overview.actionBranches'), to: '/workspace/branches', icon: 'store' },
    { label: t('live.overview.actionTeam'), to: '/workspace/team', icon: 'users' },
    { label: t('live.overview.actionAudit'), to: '/workspace/audit', icon: 'activity' },
  ]

  return (
    <div>
      <PageHeader
        title={t('live.overview.title')}
        sub={t('live.overview.sub')}
        actions={<RefreshButton onClick={dashboard.refresh} loading={dashboard.loading} />}
      />

      {/* Welcome / context */}
      <Card className="mb-5 p-5">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-charcoal">{user?.name ? t('live.overview.welcome', { name: user.name }) : t('live.overview.welcomeNoName')}</h2>
            <p className="mt-1 text-[13px] leading-relaxed text-umber">
              {branchId && branchNames.has(branchId) ? t('live.overview.contextBranch', { branch: branchNames.get(branchId)! }) : t('live.overview.context')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" icon={showFilters ? 'x' : 'filter'} onClick={() => setShowFilters((s) => !s)}>
              {showFilters ? t('live.overview.hideDates') : t('live.overview.chooseDates')}
            </Button>
          </div>
        </div>
        {showFilters ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label={t('live.common.from')}>
              <Input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
            </Field>
            <Field label={t('live.common.to')}>
              <Input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
            </Field>
            <Field label={t('live.common.branch')}>
              <Select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                <option value="">{t('live.common.all')}</option>
                {(branches.data ?? []).map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </Select>
            </Field>
            <div className="flex items-end">
              <div className="w-full rounded-xl border border-sand bg-cream/60 px-3.5 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-clay">{t('live.overview.period')}</p>
                <p className="mt-0.5 text-[12.5px] font-medium text-espresso">{data?.period.from ?? from} → {data?.period.to ?? to}</p>
              </div>
            </div>
          </div>
        ) : null}
      </Card>

      {dashboard.loading && !data ? <LoadingBlock rows={3} /> : null}
      {dashboard.error ? <ErrorBlock message={dashboard.error} onRetry={dashboard.refresh} /> : null}

      {data ? (
        <div className="space-y-5">
          {/* Today's activity cards — simple, large, clear */}
          <div>
            <h3 className="text-[15px] font-semibold text-charcoal mb-3">{t('live.overview.activityTitle')}</h3>
            <p className="text-[12.5px] text-umber mb-3">{t('live.overview.activityFor', { period: from === todayISO() && to === todayISO() ? t('live.overview.periodToday') : t('live.overview.periodWeek') })}</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <QuickStat label={t('live.overview.newOrders')} value={statusCounts.pending} icon="list" tone="gold" note={t('live.overview.newOrdersHint')} />
              <QuickStat label={t('live.status.preparing')} value={statusCounts.preparing + statusCounts.confirmed} icon="utensils" tone="flame" note={t('live.overview.preparingHint')} />
              <QuickStat label={t('live.status.ready')} value={statusCounts.ready} icon="check" tone="moss" note={t('live.overview.readyHint')} />
              <QuickStat label={t('live.status.completed')} value={statusCounts.completed} icon="check" tone="moss" note={t('live.overview.completedHint')} />
              <QuickStat label={t('live.overview.orderValue')} value={formatNumber(data.metrics.order_value.non_cancelled, lang)} icon="chart" tone="charcoal" note={t('live.overview.orderValueHint')} />
            </div>
          </div>

          {/* Attention */}
          <Card className="p-5 border-l-4 border-l-gold">
            <h3 className="text-[15px] font-semibold text-charcoal mb-1">{t('live.overview.attentionTitle')}</h3>
            <p className="text-[12.5px] text-umber mb-3">{t('live.overview.attentionSub')}</p>
            {attentionItems.length === 0 ? (
              <div className="flex items-center gap-3 rounded-xl bg-moss/10 px-4 py-3">
                <Icon name="check" size={20} className="text-moss" />
                <p className="text-[13px] font-medium text-charcoal">{t('live.overview.attentionEmpty')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {attentionItems.map((item, i) => (
                  <a key={i} href={item.to} className="flex items-center gap-3 rounded-xl border border-sand bg-paper px-4 py-3 hover:border-charcoal transition">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${item.tone === 'gold' ? 'bg-gold/15 text-gold' : item.tone === 'rose' ? 'bg-rose/15 text-rose' : 'bg-flame/15 text-flame'}`}>
                      <Icon name={item.icon} size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-charcoal">{item.label}</p>
                    </div>
                    <Button size="sm" variant="outline" icon="arrowRight">{item.action}</Button>
                  </a>
                ))}
              </div>
            )}
          </Card>

          {/* Quick actions */}
          <div>
            <h3 className="text-[15px] font-semibold text-charcoal mb-3">{t('live.overview.quickActions')}</h3>
            <p className="text-[12.5px] text-umber mb-3">{t('live.overview.quickActionsSub')}</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {quickActions.map((a) => (
                <Link key={a.to} to={a.to} className="flex items-center gap-3 rounded-2xl border border-sand bg-paper px-4 py-4 hover:border-charcoal transition">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-charcoal text-ivory"><Icon name={a.icon} size={18} /></span>
                  <span className="text-[13.5px] font-medium text-charcoal">{a.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent orders — compact */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[15px] font-semibold text-charcoal">{t('live.overview.recentOrders')}</h3>
              <Link to="/workspace/orders" className="text-[12.5px] font-medium text-flame hover:underline">{t('live.overview.viewAllOrders')}</Link>
            </div>
            {data.recent_orders.length === 0 ? (
              <EmptyBlock title={t('live.overview.recentEmpty')} message={t('live.overview.recentEmpty')} />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-sand bg-paper">
                <table className="w-full min-w-[600px] text-[13px] border-collapse">
                  <thead>
                    <tr className="bg-cream/60">
                      <th className="px-3 py-2 text-start text-[11px] font-semibold uppercase tracking-[0.08em] text-umber">{t('live.common.order')}</th>
                      <th className="px-3 py-2 text-start text-[11px] font-semibold uppercase tracking-[0.08em] text-umber">{t('live.common.status')}</th>
                      <th className="px-3 py-2 text-start text-[11px] font-semibold uppercase tracking-[0.08em] text-umber">{t('live.common.branch')}</th>
                      <th className="px-3 py-2 text-start text-[11px] font-semibold uppercase tracking-[0.08em] text-umber">{t('live.common.table')}</th>
                      <th className="px-3 py-2 text-end text-[11px] font-semibold uppercase tracking-[0.08em] text-umber">{t('live.common.total')}</th>
                      <th className="px-3 py-2 text-start text-[11px] font-semibold uppercase tracking-[0.08em] text-umber">{t('live.common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.recent_orders ?? []).slice(0, 6).map((order) => (
                      <tr key={order.id} className="border-b border-sand/60 hover:bg-cream/40">
                        <td className="px-3 py-2.5 font-mono text-[12px] text-charcoal">#{order.id.slice(-6)}</td>
                        <td className="px-3 py-2.5"><StatusBadge status={order.status} /></td>
                        <td className="px-3 py-2.5 text-umber">{order.branch_id ? branchNames.get(order.branch_id) ?? '—' : '—'}</td>
                        <td className="px-3 py-2.5 text-umber">{order.table_no ?? '—'}</td>
                        <td className="px-3 py-2.5 text-end font-medium text-charcoal">{formatNumber(order.total, lang)}</td>
                        <td className="px-3 py-2.5"><Link to="/workspace/orders" className="text-[12px] font-medium text-flame hover:underline">{t('live.common.details')}</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Branch quick view — compact, separated status */}
          <Card className="p-5">
            <h3 className="text-[15px] font-semibold text-charcoal mb-3">{t('live.overview.branchDetails')}</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(data.branches ?? []).map((b) => (
                <div key={b.branch_id ?? 'legacy'} className="rounded-xl border border-sand bg-cream/30 px-3.5 py-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[13.5px] text-charcoal">{b.branch_name ?? t('live.common.unknown')}</span>
                    <div className="flex gap-1.5">
                      <StatusBadge status={b.is_active ? 'active' : 'suspended'} />
                      {b.accepting_orders ? (
                        <span className="rounded-full bg-moss/12 px-2 py-0.5 text-[10.5px] font-medium text-moss">{t('live.branches.accepting')}</span>
                      ) : (
                        <span className="rounded-full bg-rose/10 px-2 py-0.5 text-[10.5px] font-medium text-rose">{t('live.branches.pauseOrders')}</span>
                      )}
                    </div>
                  </div>
                  <p className="mt-1 text-[11.5px] text-umber">{t('live.common.total')}: {formatNumber(b.total_orders, lang)} · {t('live.status.completed')}: {formatNumber(b.by_status.completed ?? 0, lang)} · {t('live.status.cancelled')}: {formatNumber(b.by_status.cancelled ?? 0, lang)}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  )
}

function QuickStat({ label, value, icon, tone, note }: { label: string; value: number | string; icon: string; tone: string; note?: string }) {
  const bg = tone === 'gold' ? 'bg-gold/10 text-gold' : tone === 'rose' ? 'bg-rose/10 text-rose' : tone === 'flame' ? 'bg-flame/10 text-flame' : 'bg-ink text-ivory'
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11.5px] font-medium text-umber">{label}</p>
          <p className="mt-1 text-[22px] font-semibold text-charcoal">{typeof value === 'number' ? value.toLocaleString() : value}</p>
        </div>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${bg}`}><Icon name={icon} size={17} /></span>
      </div>
      {note ? <p className="mt-2 text-[11.5px] leading-snug text-clay">{note}</p> : null}
    </Card>
  )
}
