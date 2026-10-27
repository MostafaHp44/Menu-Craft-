import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '../../../shared/i18n'
import type { TKey } from '../../../shared/i18n'
import { Badge, Field, Segmented, Select, StatCard } from '../../../shared/ui/ui.tsx'
import { useStore } from '../../../shared/store/useStore.ts'
import { useSalesSeries } from '../../../shared/lib/hooks.ts'
import { createSalesSeries } from '../../../shared/lib/demoData.ts'
import { formatDate, money } from '../../../shared/lib/utils.ts'
import type { SalesPoint } from '../../../shared/lib/types.ts'
import { DarkEmpty, Panel, PanelHeading, PlanBadge } from '../parts.tsx'

type Period = 'daily' | 'monthly' | 'yearly'

const PERIOD_KEY: Record<Period, TKey> = {
  daily: 'common.day',
  monthly: 'common.month',
  yearly: 'common.year',
}

function barLabel(point: SalesPoint, period: Period): string {
  if (period === 'yearly') return point.date
  if (period === 'monthly') return point.date.slice(5)
  return point.date.slice(8)
}

/** horizontally scrollable bar chart — never forces the page wider than the viewport */
function RevenueBars({ points, period }: { points: SalesPoint[]; period: Period }) {
  const { t } = useI18n()
  const max = Math.max(...points.map((p) => p.revenue), 1)
  return (
    <div className="overflow-x-auto thin-scroll">
      <div
        className="flex h-52 items-end gap-1.5"
        style={{ minWidth: `${points.length * 26}px` }}
        role="img"
        aria-label={t('platformMore.sales.demoNote')}
      >
        {points.map((point) => (
          <div
            key={point.date}
            title={`${barLabel(point, period)} · ${money(point.revenue)}`}
            className="group flex h-full min-w-[18px] flex-1 flex-col items-center justify-end gap-1.5"
          >
            <span className="text-[10px] font-medium text-ivory/0 transition group-hover:text-ivory/80">
              {money(point.revenue)}
            </span>
            <div
              className="w-full rounded-t-md bg-flame/70 transition group-hover:bg-flame"
              style={{ height: `${Math.max(4, (point.revenue / max) * 100)}%` }}
            />
            <span className="text-[10px] leading-none text-ivory/40">
              {barLabel(point, period)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SalesTab({ focusClientId }: { focusClientId: string | null }) {
  const { t } = useI18n()
  const restaurants = useStore((s) => s.restaurants)

  const [selectedId, setSelectedId] = useState<string>(
    () => focusClientId ?? restaurants[0]?.id ?? ''
  )
  const [period, setPeriod] = useState<Period>('daily')

  useEffect(() => {
    if (focusClientId) setSelectedId(focusClientId)
  }, [focusClientId])

  const restaurant = restaurants.find((r) => r.id === selectedId) ?? restaurants[0]
  const series = useSalesSeries(restaurant ?? null)

  const points = useMemo<SalesPoint[]>(() => {
    if (!series) return []
    if (period === 'daily') return series.daily.slice(-30)
    if (period === 'monthly') return series.monthly.slice(-24)
    return series.yearly
  }, [series, period])

  const totals = useMemo(() => {
    const revenue = points.reduce((sum, p) => sum + p.revenue, 0)
    const orders = points.reduce((sum, p) => sum + p.orders, 0)
    return { revenue, orders, avg: orders > 0 ? revenue / orders : 0 }
  }, [points])

  const comparison = useMemo(() => {
    const rows = restaurants
      .map((r) => {
        const s = createSalesSeries(r.id, r.plan)
        const month = s.monthly[s.monthly.length - 1]
        return { restaurant: r, revenue: month?.revenue ?? 0 }
      })
      .sort((a, b) => b.revenue - a.revenue)
    const total = rows.reduce((sum, row) => sum + row.revenue, 0) || 1
    return rows.map((row) => ({ ...row, share: (row.revenue / total) * 100 }))
  }, [restaurants])

  if (restaurants.length === 0 || !restaurant) {
    return (
      <Panel>
        <DarkEmpty
          icon="chart"
          title={t('common.empty')}
          message={t('platformMore.sales.demoNote')}
        />
      </Panel>
    )
  }

  return (
    <div className="space-y-5">
      <Panel>
        <PanelHeading
          title={t('admin.salesReport', { client: restaurant.name })}
          description={t('platformMore.sales.demoNote')}
          actions={
            <div className="w-full sm:w-64">
              <Field label={t('platformMore.sales.client')}>
                <Select
                  value={restaurant.id}
                  onChange={(e) => setSelectedId(e.target.value)}
                  aria-label={t('platformMore.sales.client')}
                >
                  {restaurants.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          }
        />

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <StatCard tone="dark" label={t('common.revenue')} value={money(totals.revenue)} icon="trendUp" />
          <StatCard
            tone="dark"
            label={t('dashboard.orders')}
            value={totals.orders.toLocaleString()}
            icon="list"
          />
          <StatCard
            tone="dark"
            label={t('earnings.avgOrder')}
            value={money(totals.avg)}
            icon="card"
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <Segmented<Period>
            size="sm"
            value={period}
            onChange={setPeriod}
            ariaLabel={t('platformMore.sales.period')}
            options={[
              { value: 'daily', label: t('common.day') },
              { value: 'monthly', label: t('common.month') },
              { value: 'yearly', label: t('common.year') },
            ]}
          />
          <Badge tone="outline">{t(PERIOD_KEY[period])}</Badge>
        </div>

        <div className="mt-4 rounded-2xl border border-white/8 bg-white/4 p-4">
          {points.length === 0 ? (
            <DarkEmpty icon="chart" title={t('reports.noData')} message={t('platformMore.sales.demoNote')} />
          ) : (
            <>
              <RevenueBars points={points} period={period} />
              <div className="mt-2 flex items-center justify-between text-[11px] text-ivory/40">
                <span>{formatDate(points[0].date)}</span>
                <span>{formatDate(points[points.length - 1].date)}</span>
              </div>
            </>
          )}
        </div>
      </Panel>

      {/* per-client comparison */}
      <Panel>
        <PanelHeading title={t('platformMore.sales.comparisonTitle')} />

        {/* desktop table */}
        <div className="mt-4 hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-start">
              <thead>
                <tr className="text-[11px] uppercase tracking-[0.14em] text-ivory/40">
                  <th className="px-3 py-2.5 font-semibold">{t('platformMore.sales.client')}</th>
                  <th className="px-3 py-2.5 font-semibold">{t('platformMore.planLabel')}</th>
                  <th className="px-3 py-2.5 text-end font-semibold">
                    {t('platformMore.sales.thisMonth')}
                  </th>
                  <th className="px-3 py-2.5 font-semibold">{t('platformMore.sales.share')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8">
                {comparison.map((row) => (
                  <tr key={row.restaurant.id} className="transition hover:bg-white/4">
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => setSelectedId(row.restaurant.id)}
                        className="text-start text-[13.5px] font-medium text-ivory transition hover:text-flame-light"
                      >
                        {row.restaurant.name}
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <PlanBadge plan={row.restaurant.plan} />
                    </td>
                    <td className="px-3 py-3 text-end text-[13px] font-semibold text-ivory">
                      {money(row.revenue)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-28 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-flame to-flame-light"
                            style={{ width: `${Math.max(4, row.share)}%` }}
                          />
                        </div>
                        <span className="w-10 text-[12px] text-ivory/55">
                          {row.share.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* mobile cards */}
        <div className="mt-4 space-y-3 md:hidden">
          {comparison.map((row) => (
            <div key={row.restaurant.id} className="rounded-2xl border border-white/10 bg-white/4 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedId(row.restaurant.id)}
                  className="text-start text-[14px] font-semibold text-ivory transition hover:text-flame-light"
                >
                  {row.restaurant.name}
                </button>
                <PlanBadge plan={row.restaurant.plan} />
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-[11.5px] uppercase tracking-[0.12em] text-ivory/40">
                  {t('platformMore.sales.thisMonth')}
                </span>
                <span className="text-[14px] font-semibold text-ivory">{money(row.revenue)}</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-flame to-flame-light"
                  style={{ width: `${Math.max(4, row.share)}%` }}
                />
              </div>
              <div className="mt-1.5 text-end text-[11.5px] text-ivory/45">
                {t('platformMore.sales.share')} · {row.share.toFixed(0)}%
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}
