import { useMemo, useState } from 'react'
import { useI18n } from '../../../shared/i18n'
import type { TKey } from '../../../shared/i18n'
import { Badge, StatCard } from '../../../shared/ui/ui.tsx'
import { DarkEmpty, Panel, PanelHeading } from '../parts.tsx'
import { useAdminData } from '../useAdminData.ts'
import { cx, formatDate, money } from '../../../shared/lib/utils.ts'

export type AdminSale = {
  /** day the order was placed (DATE column) */
  date: string
  restaurant_id: string
  restaurant_name?: string
  orders: number
  revenue: number
}

type SalesPeriod = 'week' | 'month' | 'year'

const PERIODS: Array<{ value: SalesPeriod; labelKey: TKey }> = [
  { value: 'week', labelKey: 'common.week' },
  { value: 'month', labelKey: 'common.month' },
  { value: 'year', labelKey: 'common.year' },
]

export default function SalesTab({ focusClientId }: { focusClientId?: string | null }) {
  const { t } = useI18n()
  const [period, setPeriod] = useState<SalesPeriod>('month')
  const focused = Boolean(focusClientId)
  const { data, loading, error } = useAdminData<AdminSale>(
    `/api/platform/admin/sales?period=${period}${focused && focusClientId ? `&restaurantId=${encodeURIComponent(focusClientId)}` : ''}`
  )

  const totals = useMemo(() => {
    const revenue = data.reduce((sum, x) => sum + Number(x.revenue || 0), 0)
    const orders = data.reduce((sum, x) => sum + Number(x.orders || 0), 0)
    return { revenue, orders, avg: orders > 0 ? revenue / orders : 0 }
  }, [data])

  const restaurantName = data[0]?.restaurant_name || focusClientId || ''
  const title = focused ? t('admin.salesReport', { client: restaurantName }) : t('admin.sales')
  const subtitle = focused ? `${t('platformMore.sales.client')} · ${restaurantName}` : 'Sales recorded across every restaurant on the platform.'
  const description = focused ? 'Showing this restaurant only.' : 'Recorded orders only.'

  if (loading) return <Panel>Loading sales…</Panel>
  if (error) return <Panel>Error: {error}</Panel>

  return (
    <div className="space-y-5">
      {/* header strip */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-[#13142b] to-[#1a1540] p-6 sm:p-8">
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-flame/20 blur-[80px]" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-violet-500/20 blur-[80px]" />
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ivory sm:text-3xl">{title}</h1>
            <p className="mt-1 text-sm text-ivory/50">{subtitle}</p>
          </div>
          <div className="flex gap-2">
            <Badge tone="moss">{money(totals.revenue)}</Badge>
            <Badge tone="outline">{totals.orders} {t('dashboard.orders')}</Badge>
          </div>
        </div>
      </div>

      {/* stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard tone="dark" label={t('common.revenue')} value={money(totals.revenue)} icon="trendUp" />
        <StatCard tone="dark" label={t('dashboard.orders')} value={totals.orders.toLocaleString()} icon="list" />
        <StatCard tone="dark" label={t('earnings.avgOrder')} value={money(totals.avg)} icon="card" />
      </div>

      {/* records */}
      <Panel>
        <PanelHeading
          title={title}
          description={description}
          actions={
            <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/6 p-1">
              {PERIODS.map((p) => {
                const active = p.value === period
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPeriod(p.value)}
                    className={cx(
                      'inline-flex h-8 items-center rounded-full px-3.5 text-[12.5px] font-medium transition',
                      active ? 'bg-flame text-white shadow-[0_8px_18px_-10px_rgba(232,87,31,0.9)]' : 'text-ivory/60 hover:bg-white/8 hover:text-ivory'
                    )}
                  >
                    {t(p.labelKey)}
                  </button>
                )
              })}
            </div>
          }
        />

        {data.length ? (
          <div className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-[#0f1220]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-[11px] uppercase tracking-wider text-ivory/40">
                  <th className="px-4 py-3 text-left font-medium">{t('common.date')}</th>
                  <th className="px-4 py-3 text-left font-medium">Restaurant</th>
                  <th className="px-4 py-3 text-right font-medium">{t('dashboard.orders')}</th>
                  <th className="px-4 py-3 text-right font-medium">{t('common.revenue')}</th>
                </tr>
              </thead>
              <tbody>
                {data.map((x, i) => (
                  <tr key={i} className="border-b border-white/5 transition hover:bg-white/5">
                    <td className="px-4 py-3 align-top text-ivory/90">{formatDate(String(x.date))}</td>
                    <td className="px-4 py-3 align-top text-ivory">{x.restaurant_name || x.restaurant_id}</td>
                    <td className="px-4 py-3 align-top text-right text-ivory/90">{Number(x.orders || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 align-top text-right font-semibold text-moss">{money(Number(x.revenue || 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-4">
            <DarkEmpty icon="chart" title="No sales" message="No recorded orders found." />
          </div>
        )}
      </Panel>
    </div>
  )
}
