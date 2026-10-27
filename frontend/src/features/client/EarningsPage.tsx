import { useI18n, type Lang } from '../../shared/i18n'
import { Badge, Card, EmptyState, StatCard } from '../../shared/ui/ui.tsx'
import { Icon } from '../../shared/ui/icons.tsx'
import { useSalesSeries } from '../../shared/lib/hooks.ts'
import { useActiveRestaurant } from '../../shared/store/useStore.ts'
import { useRestaurantOrders } from '../../shared/store/useOrders.ts'
import { cx, money, timeAgo } from '../../shared/lib/utils.ts'
import { isToday } from './orders/helpers.ts'

/** locale weekday for a `YYYY-MM-DD` sales point (avoids UTC drift) */
function weekdayShort(date: string, lang: Lang): string {
  const [y, m, d] = date.split('-').map(Number)
  return new Intl.DateTimeFormat(lang, { weekday: 'short' }).format(new Date(y, m - 1, d))
}

export default function EarningsPage() {
  const { t, lang } = useI18n()
  const restaurant = useActiveRestaurant()
  const series = useSalesSeries(restaurant)
  const orders = useRestaurantOrders(restaurant.id)

  const daily = series?.daily ?? []
  const monthly = series?.monthly ?? []
  const last7 = daily.slice(-7)
  const monthPoint = monthly.length > 0 ? monthly[monthly.length - 1] : null

  const todayOrders = orders.filter((order) => isToday(order.createdAt))
  const todayRevenue = todayOrders.reduce((sum, order) => sum + order.total, 0)
  const last7Revenue = last7.reduce((sum, point) => sum + point.revenue, 0)
  const last7Orders = last7.reduce((sum, point) => sum + point.orders, 0)
  const avgOrder = monthPoint && monthPoint.orders > 0 ? monthPoint.revenue / monthPoint.orders : 0

  const peak = last7.reduce(
    (best, point) => (point.revenue > best.revenue ? point : best),
    last7.length > 0 ? last7[0] : { date: '', orders: 0, revenue: 0 }
  )
  const bestDay = peak.date ? weekdayShort(peak.date, lang) : t('common.empty')
  const maxRevenue = last7.reduce((max, point) => Math.max(max, point.revenue), 0)

  const biggest = [...todayOrders].sort((a, b) => b.total - a.total).slice(0, 5)

  return (
    <div className="space-y-5">
      {/* -------------------------------- stats -------------------------------- */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t('earnings.todayTotal')}
          value={money(todayRevenue)}
          icon="card"
          trend={last7.map((point) => point.revenue)}
        />
        <StatCard
          label={t('earnings.monthTotal')}
          value={monthPoint ? money(monthPoint.revenue) : money(0)}
          icon="chart"
          trend={monthly.slice(-12).map((point) => point.revenue)}
        />
        <StatCard label={t('earnings.avgOrder')} value={money(avgOrder)} icon="tag" />
        <StatCard label={t('earnings.bestDay')} value={bestDay} icon="star" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        {/* ----------------------------- 7-day chart ---------------------------- */}
        <Card className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-[15.5px] font-semibold text-charcoal">{t('earnings.trend')}</h3>
              <p className="mt-1 text-[13px] text-umber">
                {t('earnings.fromOrders', { n: last7Orders })}
              </p>
            </div>
            <Badge tone="outline" icon="info">
              {t('reports.generated')}
            </Badge>
          </div>

          {last7.length === 0 ? (
            <div className="mt-4">
              <EmptyState icon="chart" title={t('common.empty')} message={t('reports.noData')} />
            </div>
          ) : (
            <div className="mt-5 flex h-[180px] items-end gap-2 sm:gap-3">
              {last7.map((point) => {
                const label = weekdayShort(point.date, lang)
                const isPeak = point.revenue === maxRevenue
                const height = maxRevenue > 0 ? Math.max(8, Math.round((point.revenue / maxRevenue) * 86)) : 8
                return (
                  <div
                    key={point.date}
                    className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
                    title={`${label} · ${money(point.revenue)}`}
                  >
                    <span
                      className={cx(
                        'text-[10px] font-medium sm:text-[11px]',
                        isPeak ? 'text-flame' : 'text-umber'
                      )}
                    >
                      {money(point.revenue)}
                    </span>
                    <div
                      className={cx(
                        'w-full rounded-t-md transition-colors duration-300',
                        isPeak ? 'bg-flame' : 'bg-clay/50 group-hover:bg-clay'
                      )}
                      style={{ height: `${height}%` }}
                    />
                    <span className="w-full truncate text-center text-[11px] text-clay">{label}</span>
                  </div>
                )
              })}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-sand/70 pt-3.5 text-[12.5px] text-umber">
            <span>
              {t('common.revenue')} · {money(last7Revenue)}
            </span>
            <span className="text-clay">{t('dashboard.simulatedNote')}</span>
          </div>
        </Card>

        {/* --------------------------- biggest orders --------------------------- */}
        <Card className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-[15.5px] font-semibold text-charcoal">
              {t('clientMore.biggestOrders')}
            </h3>
            <Badge tone="neutral">{t('orders.count', { n: todayOrders.length })}</Badge>
          </div>

          {biggest.length === 0 ? (
            <div className="mt-4">
              <EmptyState icon="list" title={t('common.empty')} message={t('orders.emptyHint')} />
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-sand/70">
              {biggest.map((order) => (
                <li key={order.id} className="flex items-center gap-3 py-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cream text-[12px] font-semibold text-espresso">
                    {order.number}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-medium text-charcoal">
                      {t('orders.orderNo', { no: order.number })}
                    </span>
                    <span className="block truncate text-[12px] text-umber">
                      {order.customer} · {timeAgo(order.createdAt)}
                    </span>
                  </span>
                  <span className="shrink-0 text-[13.5px] font-semibold text-charcoal">
                    {money(order.total)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <p className="flex items-start gap-2 text-[12.5px] leading-relaxed text-clay">
        <Icon name="info" size={14} className="mt-0.5 shrink-0" />
        {t('dashboard.simulatedNote')}
      </p>
    </div>
  )
}
