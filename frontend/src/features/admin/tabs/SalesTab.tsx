import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '../../../shared/i18n'
import type { TKey } from '../../../shared/i18n'
import { Badge, Field, Segmented, Select, StatCard } from '../../../shared/ui/ui.tsx'
import { useStore } from '../../../shared/store/useStore.ts'
import { useRestaurantOrders } from '../../../shared/store/useOrders.ts'
import { useSalesSeries } from '../../../shared/lib/hooks.ts'
import { createSalesSeries } from '../../../shared/lib/demoData.ts'
import { buildDailyTiming, buildDishBreakdown } from '../../../shared/lib/salesReport.ts'
import type { DishTotals } from '../../../shared/lib/salesReport.ts'
import { cx, formatDate, money } from '../../../shared/lib/utils.ts'
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

/** totals footer shared by the top-dishes desktop table and mobile cards */
function DishTotalsBar({ totals }: { totals: DishTotals }) {
  const { t } = useI18n()
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/4 px-4 py-3">
      <span className="text-[11px] uppercase tracking-[0.14em] text-ivory/40">
        {t('common.total')}
      </span>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px]">
        <span className="text-ivory/55">
          {t('common.revenue')}
          <strong className="ms-1.5 font-semibold text-ivory">{money(totals.revenue)}</strong>
        </span>
        <span className="text-ivory/55">
          {t('platformMore.sales.totalProfit')}
          <strong className="ms-1.5 font-semibold text-flame-light">{money(totals.profit)}</strong>
        </span>
        <span className="text-ivory/55">
          {t('platformMore.sales.margin')}
          <strong className="ms-1.5 font-semibold text-ivory">
            {totals.margin.toFixed(0)}%
          </strong>
        </span>
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

  const orders = useRestaurantOrders(restaurant?.id ?? '')
  const dishes = useMemo(() => buildDishBreakdown(orders), [orders])
  const timing = useMemo(
    () =>
      series && restaurant
        ? buildDailyTiming({
            restaurantId: restaurant.id,
            plan: restaurant.plan,
            series,
            orders,
          })
        : [],
    [series, restaurant, orders]
  )

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

      {/* top dishes — revenue & simulated profit per dish for the selected client */}
      <Panel>
        <PanelHeading
          title={t('platformMore.sales.dishesTitle')}
          description={t('platformMore.sales.dishesNote')}
        />

        {dishes.rows.length === 0 ? (
          <div className="mt-4">
            <DarkEmpty
              icon="utensils"
              title={t('platformMore.sales.noOrders')}
              message={t('platformMore.sales.dishesNote')}
            />
          </div>
        ) : (
          <>
            {/* desktop table */}
            <div className="mt-4 hidden md:block">
              <div className="overflow-x-auto thin-scroll">
                <table className="w-full min-w-[640px] text-start">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-[0.14em] text-ivory/40">
                      <th className="px-3 py-2.5 font-semibold">
                        {t('platformMore.sales.dish')}
                      </th>
                      <th className="px-3 py-2.5 text-end font-semibold">
                        {t('platformMore.sales.qty')}
                      </th>
                      <th className="px-3 py-2.5 text-end font-semibold">
                        {t('common.revenue')}
                      </th>
                      <th className="px-3 py-2.5 text-end font-semibold">
                        {t('platformMore.sales.profit')}
                      </th>
                      <th className="px-3 py-2.5 text-end font-semibold">
                        {t('platformMore.sales.share')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/8">
                    {dishes.rows.slice(0, 10).map((row) => (
                      <tr key={row.itemId} className="transition hover:bg-white/4">
                        <td className="px-3 py-3 text-[13.5px] font-medium text-ivory">
                          {row.name}
                        </td>
                        <td className="px-3 py-3 text-end text-[13px] text-ivory/65">
                          {row.qty}
                        </td>
                        <td className="px-3 py-3 text-end text-[13px] font-semibold text-ivory">
                          {money(row.revenue)}
                        </td>
                        <td className="px-3 py-3 text-end text-[13px] font-medium text-flame-light">
                          {money(row.profit)}
                        </td>
                        <td className="px-3 py-3 text-end text-[12.5px] text-ivory/55">
                          {row.share.toFixed(0)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* mobile cards */}
            <div className="mt-4 space-y-3 md:hidden">
              {dishes.rows.slice(0, 10).map((row) => (
                <div
                  key={row.itemId}
                  className="rounded-2xl border border-white/10 bg-white/4 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="min-w-0 break-words text-start text-[14px] font-semibold text-ivory">
                      {row.name}
                    </span>
                    <span className="text-[11.5px] text-ivory/55">
                      {t('platformMore.sales.share')} · {row.share.toFixed(0)}%
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <span className="block text-[10.5px] uppercase tracking-[0.1em] text-ivory/40">
                        {t('platformMore.sales.qty')}
                      </span>
                      <span className="mt-0.5 block text-[13px] font-semibold text-ivory">
                        {row.qty}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10.5px] uppercase tracking-[0.1em] text-ivory/40">
                        {t('common.revenue')}
                      </span>
                      <span className="mt-0.5 block text-[13px] font-semibold text-ivory">
                        {money(row.revenue)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10.5px] uppercase tracking-[0.1em] text-ivory/40">
                        {t('platformMore.sales.profit')}
                      </span>
                      <span className="mt-0.5 block text-[13px] font-semibold text-flame-light">
                        {money(row.profit)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <DishTotalsBar totals={dishes.totals} />
          </>
        )}
      </Panel>

      {/* first & last orders per day — real orders, simulated where none exist */}
      <Panel>
        <PanelHeading
          title={t('platformMore.sales.timingTitle')}
          description={t('platformMore.sales.timingNote')}
        />

        {/* desktop table */}
        <div className="mt-4 hidden md:block">
          <div className="overflow-x-auto thin-scroll">
            <table className="w-full min-w-[640px] text-start">
              <thead>
                <tr className="text-[11px] uppercase tracking-[0.14em] text-ivory/40">
                  <th className="px-3 py-2.5 font-semibold">{t('common.date')}</th>
                  <th className="px-3 py-2.5 text-end font-semibold">
                    {t('platformMore.sales.firstOrder')}
                  </th>
                  <th className="px-3 py-2.5 text-end font-semibold">
                    {t('platformMore.sales.lastOrder')}
                  </th>
                  <th className="px-3 py-2.5 text-end font-semibold">
                    {t('dashboard.orders')}
                  </th>
                  <th className="px-3 py-2.5 text-end font-semibold">{t('common.revenue')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8">
                {timing.map((row) => (
                  <tr key={row.date} className="transition hover:bg-white/4">
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[13.5px] text-ivory">{formatDate(row.date)}</span>
                        {row.simulated ? (
                          <Badge tone="outline">{t('platformMore.sales.simulatedDay')}</Badge>
                        ) : null}
                      </div>
                    </td>
                    <td
                      className={cx(
                        'px-3 py-3 text-end text-[13px]',
                        row.simulated ? 'text-ivory/50' : 'font-medium text-ivory'
                      )}
                    >
                      {row.first}
                    </td>
                    <td
                      className={cx(
                        'px-3 py-3 text-end text-[13px]',
                        row.simulated ? 'text-ivory/50' : 'font-medium text-ivory'
                      )}
                    >
                      {row.last}
                    </td>
                    <td className="px-3 py-3 text-end text-[13px] text-ivory/65">{row.orders}</td>
                    <td className="px-3 py-3 text-end text-[13px] font-semibold text-ivory">
                      {money(row.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* mobile cards */}
        <div className="mt-4 space-y-3 md:hidden">
          {timing.map((row) => (
            <div key={row.date} className="rounded-2xl border border-white/10 bg-white/4 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[14px] font-semibold text-ivory">
                  {formatDate(row.date)}
                </span>
                {row.simulated ? (
                  <Badge tone="outline">{t('platformMore.sales.simulatedDay')}</Badge>
                ) : null}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                <div>
                  <span className="block text-[10.5px] uppercase tracking-[0.1em] text-ivory/40">
                    {t('platformMore.sales.firstOrder')}
                  </span>
                  <span
                    className={cx(
                      'mt-0.5 block text-[13px] font-semibold',
                      row.simulated ? 'text-ivory/50' : 'text-ivory'
                    )}
                  >
                    {row.first}
                  </span>
                </div>
                <div>
                  <span className="block text-[10.5px] uppercase tracking-[0.1em] text-ivory/40">
                    {t('platformMore.sales.lastOrder')}
                  </span>
                  <span
                    className={cx(
                      'mt-0.5 block text-[13px] font-semibold',
                      row.simulated ? 'text-ivory/50' : 'text-ivory'
                    )}
                  >
                    {row.last}
                  </span>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-[12px] text-ivory/55">
                <span>
                  {t('dashboard.orders')} · {row.orders}
                </span>
                <span className="font-semibold text-ivory">{money(row.revenue)}</span>
              </div>
            </div>
          ))}
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
