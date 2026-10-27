import { useMemo, useState } from 'react'
import { useI18n, type Lang } from '../../shared/i18n'
import { Badge, Button, Card, EmptyState, Segmented, StatCard } from '../../shared/ui/ui.tsx'
import { Icon } from '../../shared/ui/icons.tsx'
import { useActiveRestaurant, useStore } from '../../shared/store/useStore.ts'
import { useRestaurantOrders } from '../../shared/store/useOrders.ts'
import { useSalesSeries } from '../../shared/lib/hooks.ts'
import { cx, money } from '../../shared/lib/utils.ts'
import { isToday } from './orders/helpers.ts'
import { PeriodChart, type Period } from './reports/PeriodChart.tsx'

/** how many bars each period shows */
const WINDOWS: Record<Period, number> = { daily: 30, monthly: 24, yearly: 3 }

function currentPeriodLabel(date: string, period: Period, lang: Lang): string {
  if (period === 'yearly') return date
  const [y, m, d] = date.split('-').map(Number)
  if (period === 'monthly') {
    return new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric' }).format(new Date(y, m - 1, 1))
  }
  return new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(y, m - 1, d)
  )
}

export default function ReportsPage() {
  const { t, lang } = useI18n()
  const restaurant = useActiveRestaurant()
  const series = useSalesSeries(restaurant)
  const orders = useRestaurantOrders(restaurant.id)
  const showToast = useStore((s) => s.showToast)

  const [period, setPeriod] = useState<Period>('daily')

  const points = useMemo(() => {
    const all = series ? series[period] : []
    return all.slice(Math.max(0, all.length - WINDOWS[period]))
  }, [series, period])

  const current = points.length > 0 ? points[points.length - 1] : null
  const previous = points.length > 1 ? points[points.length - 2] : null
  const hasGrowth = Boolean(current && previous && previous.revenue > 0)
  const growth =
    current && previous && previous.revenue > 0
      ? ((current.revenue - previous.revenue) / previous.revenue) * 100
      : 0
  const avgOrder = current && current.orders > 0 ? current.revenue / current.orders : 0
  const trendWindow = points.slice(-10)
  const positive = !hasGrowth || growth >= 0

  const windowLabel = useMemo(() => {
    if (points.length === 0) return ''
    const first = points[0]
    const last = points[points.length - 1]
    if (points.length === 1) return currentPeriodLabel(last.date, period, lang)
    if (period === 'yearly') return `${first.date} – ${last.date}`
    const short = (date: string) => {
      const [y, m, d] = date.split('-').map(Number)
      return period === 'monthly'
        ? new Intl.DateTimeFormat(lang, { month: 'short', year: 'numeric' }).format(new Date(y, m - 1, 1))
        : new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short' }).format(new Date(y, m - 1, d))
    }
    return `${short(first.date)} – ${short(last.date)}`
  }, [points, period, lang])

  /* --------------------------- top items (today) --------------------------- */
  const topItems = useMemo(() => {
    const map = new Map<string, { id: string; name: string; qty: number; revenue: number }>()
    orders
      .filter((order) => isToday(order.createdAt))
      .forEach((order) =>
        order.lines.forEach((line) => {
          const found = map.get(line.itemId)
          if (found) {
            found.qty += line.qty
            found.revenue += line.price * line.qty
          } else {
            map.set(line.itemId, {
              id: line.itemId,
              name: line.name,
              qty: line.qty,
              revenue: line.price * line.qty,
            })
          }
        })
      )
    return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5)
  }, [orders])
  const topTotal = topItems.reduce((sum, item) => sum + item.revenue, 0)

  /* ------------------------------- CSV export ------------------------------ */
  const exportCsv = () => {
    if (points.length === 0) return
    const header = [t('common.date'), t('reports.orders'), t('common.revenue')]
    const rows = points.map((point) => [point.date, String(point.orders), String(point.revenue)])
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\r\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `menucraft-${period}-report.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 2000)
    showToast({ title: t('clientMore.csvExported'), message: t('reports.generated'), tone: 'success' })
  }

  return (
    <div className="space-y-5">
      {/* ------------------------------- period ------------------------------- */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Segmented
            ariaLabel={t('clientMore.period')}
            value={period}
            onChange={setPeriod}
            options={[
              { value: 'daily', label: t('reports.daily') },
              { value: 'monthly', label: t('reports.monthly') },
              { value: 'yearly', label: t('reports.yearly') },
            ]}
          />
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[13px] text-umber">
              {current ? currentPeriodLabel(current.date, period, lang) : t('reports.noData')}
            </span>
            <Button variant="outline" icon="download" disabled={points.length === 0} onClick={exportCsv}>
              {t('reports.export')}
            </Button>
          </div>
        </div>
      </Card>

      {/* --------------------------------- KPIs -------------------------------- */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t('reports.sales')}
          value={current ? money(current.revenue) : money(0)}
          icon="card"
          trend={trendWindow.map((point) => point.revenue)}
        />
        <StatCard
          label={t('reports.orders')}
          value={current ? String(current.orders) : '0'}
          icon="list"
          trend={trendWindow.map((point) => point.orders)}
        />
        <StatCard
          label={t('earnings.avgOrder')}
          value={money(avgOrder)}
          icon="tag"
          trend={trendWindow.map((point) => (point.orders > 0 ? point.revenue / point.orders : 0))}
        />

        {/* growth — coloured up / down */}
        <div className="rounded-2xl border border-sand bg-paper p-5 transition hover:border-clay/70">
          <div className="flex items-start justify-between gap-3">
            <span className="text-[12.5px] font-medium text-umber">{t('clientMore.growth')}</span>
            <span
              className={cx(
                'flex h-8 w-8 items-center justify-center rounded-full',
                hasGrowth
                  ? positive
                    ? 'bg-moss/12 text-moss'
                    : 'bg-rose/12 text-rose'
                  : 'bg-cream text-espresso'
              )}
            >
              <Icon name="trendUp" size={16} className={hasGrowth && !positive ? 'rotate-90' : ''} />
            </span>
          </div>
          <div
            className={cx(
              'mt-2 text-[27px] font-semibold leading-none tracking-[-0.02em]',
              !hasGrowth ? 'text-clay' : positive ? 'text-moss' : 'text-rose'
            )}
          >
            {hasGrowth ? `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%` : '—'}
          </div>
        </div>
      </div>

      {/* -------------------------------- chart -------------------------------- */}
      <Card className="p-5 sm:p-6">
        <div>
          <h3 className="text-[15.5px] font-semibold text-charcoal">{t('common.revenue')}</h3>
          <p className="mt-1 text-[13px] text-umber">{windowLabel}</p>
        </div>

        {points.length === 0 ? (
          <div className="mt-4">
            <EmptyState icon="chart" title={t('reports.noData')} message={t('dashboard.simulatedNote')} />
          </div>
        ) : (
          <PeriodChart points={points} period={period} />
        )}
      </Card>

      {/* ----------------------------- top items ------------------------------- */}
      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-[15.5px] font-semibold text-charcoal">{t('reports.topItems')}</h3>
          <Badge tone="neutral">{t('orders.count', { n: topItems.length })}</Badge>
        </div>

        {topItems.length === 0 ? (
          <div className="mt-4">
            <EmptyState icon="utensils" title={t('orders.empty')} message={t('orders.emptyHint')} />
          </div>
        ) : (
          <ul className="mt-4 space-y-3.5">
            {topItems.map((item) => {
              const share = topTotal > 0 ? Math.round((item.revenue / topTotal) * 100) : 0
              return (
                <li key={item.id}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate text-[13.5px] font-medium text-charcoal">
                      {item.name}
                    </span>
                    <span className="shrink-0 text-[12.5px] text-umber">
                      {t('clientMore.qtySold', { n: item.qty })}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-3">
                    <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-cream">
                      <span
                        className="block h-full rounded-full bg-flame transition-all duration-500"
                        style={{ width: `${share}%` }}
                      />
                    </span>
                    <span className="shrink-0 text-[13px] font-semibold text-charcoal">
                      {money(item.revenue)}
                    </span>
                    <span className="w-9 shrink-0 text-end text-[11.5px] text-clay">{share}%</span>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <p className="flex items-start gap-2 text-[12.5px] leading-relaxed text-clay">
        <Icon name="info" size={14} className="mt-0.5 shrink-0" />
        {t('reports.generated')}
      </p>
    </div>
  )
}
