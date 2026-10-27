import { useI18n } from '../../../shared/i18n'
import { cx, money } from '../../../shared/lib/utils.ts'
import type { SalesPoint } from '../../../shared/lib/types.ts'

export type Period = 'daily' | 'monthly' | 'yearly'

/** Bar chart for a reporting window — scrolls sideways instead of squashing. */
export function PeriodChart({ points, period }: { points: SalesPoint[]; period: Period }) {
  const { lang } = useI18n()

  const maxRevenue = points.reduce((max, point) => Math.max(max, point.revenue), 0)
  const labelStep = period === 'daily' ? 5 : period === 'monthly' ? 3 : 1
  const minWidth = Math.max(240, points.length * (period === 'yearly' ? 70 : 20))

  const axisLabel = (point: SalesPoint): string => {
    if (period === 'yearly') return point.date
    const [y, m, d] = point.date.split('-').map(Number)
    if (period === 'monthly') {
      return new Intl.DateTimeFormat(lang, { month: 'short' }).format(new Date(y, m - 1, 1))
    }
    return new Intl.DateTimeFormat(lang, { day: 'numeric' }).format(new Date(y, m - 1, d))
  }

  const showValues = points.length <= 6

  return (
    <div className="mt-5 overflow-x-auto pb-1 thin-scroll">
      <div className="flex h-[190px] items-end gap-1.5" style={{ minWidth }}>
        {points.map((point, index) => {
          const height =
            maxRevenue > 0 ? Math.max(7, Math.round((point.revenue / maxRevenue) * 86)) : 7
          const isPeak = point.revenue === maxRevenue
          const label = axisLabel(point)
          const showLabel = index % labelStep === 0 || index === points.length - 1
          return (
            <div
              key={point.date}
              className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
              title={`${label} · ${money(point.revenue)}`}
            >
              {showValues ? (
                <span
                  className={cx(
                    'text-[11px] font-medium',
                    isPeak ? 'text-flame' : 'text-umber'
                  )}
                >
                  {money(point.revenue)}
                </span>
              ) : null}
              <div
                className={cx(
                  'w-full rounded-t-md transition-colors duration-300',
                  isPeak ? 'bg-flame' : 'bg-clay/50 group-hover:bg-clay'
                )}
                style={{ height: `${height}%` }}
              />
              <span className="w-full truncate text-center text-[10.5px] text-clay">
                {showLabel ? label : ''}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
