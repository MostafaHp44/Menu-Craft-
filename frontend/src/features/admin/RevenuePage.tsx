import { useEffect, useState } from 'react'
import { useI18n } from '../../shared/i18n'
import { apiUrl } from '../../shared/api/url.ts'
import { StatCard } from '../../shared/ui/ui.tsx'
import { DarkEmpty, Panel, PanelHeading } from './parts.tsx'
import { cx, money } from '../../shared/lib/utils.ts'

/** شكل استجابة GET /platform/admin/financial بعد فصل المصادر */
type Financial = {
  summary: {
    subscription: number
    subscriptionCount: number
    orders: number
    orderCount: number
    ordersVolume: number
    pending: number
    failed: number
    refunded: number
  }
  monthly: Array<{
    period: string
    subscription: number
    subscriptionCount: number
    orders: number
    orderCount: number
    ordersVolume: number
    pending: number
    failed: number
    refunded: number
  }>
  byPlan: Array<{ plan_name: string; count: number; amount: number }>
}

type Period = 'week' | 'month' | 'year'

const PERIODS: Array<{ value: Period; labelKey: 'common.week' | 'common.month' | 'common.year' }> = [
  { value: 'week', labelKey: 'common.week' },
  { value: 'month', labelKey: 'common.month' },
  { value: 'year', labelKey: 'common.year' },
]

/** "2026-11" → مقروء */
function periodLabel(p: string): string {
  const [y, m] = p.split('-')
  if (!y || !m) return p
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const i = Number(m) - 1
  return `${months[i] ?? m} ${y}`
}

export default function RevenuePage() {
  const { t } = useI18n()
  const [period, setPeriod] = useState<Period>('month')
  const [data, setData] = useState<Financial | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let dead = false
    setLoading(true)
    setError('')
    fetch(apiUrl(`/api/platform/admin/financial?period=${period}`), { credentials: 'include' })
      .then(async (r) => {
        const j = await r.json()
        if (!r.ok || !j.ok) throw Error(j.error || 'Request failed')
        return j.data as Financial
      })
      .then((d) => {
        if (!dead) setData(d)
      })
      .catch((e) => {
        if (!dead) setError(e.message)
      })
      .finally(() => {
        if (!dead) setLoading(false)
      })
    return () => {
      dead = true
    }
  }, [period])

  const s = data?.summary
  const monthly = data?.monthly ?? []
  const byPlan = data?.byPlan ?? []

  /* أقصى قيمة للرسم البياني (اشتراك vs طلبات) */
  const maxBar = Math.max(
    1,
    ...monthly.map((m) => Math.max(Number(m.subscription || 0), Number(m.orders || 0)))
  )

  const hasData = monthly.length > 0 || byPlan.length > 0 || (s && (s.subscription > 0 || s.orders > 0 || s.ordersVolume > 0))

  return (
    <div className="space-y-5">
      {/* header + period toggle */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-[#13142b] to-[#1a1540] p-6 sm:p-8">
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-flame/20 blur-[80px]" />
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ivory sm:text-3xl">{t('admin.revenue')}</h1>
            <p className="mt-1 max-w-lg text-sm text-ivory/50">{t('admin.financial.desc')}</p>
          </div>
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
                    active
                      ? 'bg-flame text-white shadow-[0_8px_18px_-10px_rgba(232,87,31,0.9)]'
                      : 'text-ivory/60 hover:bg-white/8 hover:text-ivory'
                  )}
                >
                  {t(p.labelKey)}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {loading ? (
        <Panel className="p-6 text-[13px] text-ivory/60">{t('admin.financial.loading')}</Panel>
      ) : error ? (
        <Panel className="p-6 text-[13px] text-rose">{error}</Panel>
      ) : !hasData ? (
        <Panel className="flex min-h-[280px] items-center justify-center p-8">
          <DarkEmpty
            icon="trendUp"
            title={t('admin.financial.empty')}
            message={t('admin.financial.emptyMsg')}
          />
        </Panel>
      ) : (
        <>
          {/* KPI cards — اشتراك vs طلبات منفصلين */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              tone="dark"
              icon="card"
              label={t('admin.financial.subIncome')}
              value={money(Number(s?.subscription || 0))}
              note={`${Number(s?.subscriptionCount || 0)} ${t('admin.financial.subscribers')}`}
            />
            <StatCard
              tone="dark"
              icon="trendUp"
              label={t('admin.financial.ordersPaid')}
              value={money(Number(s?.orders || 0))}
              note={`${Number(s?.orderCount || 0)} ${t('dashboard.orders')}`}
            />
            <StatCard
              tone="dark"
              icon="list"
              label={t('admin.financial.ordersVolume')}
              value={money(Number(s?.ordersVolume || 0))}
              note={t('admin.financial.ordersVolumeSub')}
            />
            <StatCard
              tone="dark"
              icon="clock"
              label={t('admin.financial.pending')}
              value={money(Number(s?.pending || 0))}
              note={t('admin.financial.pendingSub')}
            />
          </div>

          {/* الرسم البياني: اشتراك vs طلبات لكل شهر */}
          {monthly.length > 0 ? (
            <Panel>
              <PanelHeading title={t('admin.financial.monthly')} />
              <div className="mt-4 flex items-end gap-3 overflow-x-auto pb-1 sm:gap-5">
                {monthly.map((m) => {
                  const sub = Number(m.subscription || 0)
                  const ord = Number(m.orders || 0)
                  const subPct = Math.max(4, Math.min(100, (sub / maxBar) * 100))
                  const ordPct = Math.max(4, Math.min(100, (ord / maxBar) * 100))
                  return (
                    <div key={m.period} className="flex min-w-[64px] flex-1 flex-col items-center gap-2">
                      <div className="flex h-40 w-full items-end justify-center gap-1.5">
                        <div
                          className="w-1/2 rounded-t-md bg-gradient-to-t from-flame to-flame/60"
                          style={{ height: `${subPct}%` }}
                          title={money(sub)}
                        />
                        <div
                          className="w-1/2 rounded-t-md bg-gradient-to-t from-moss to-moss/60"
                          style={{ height: `${ordPct}%` }}
                          title={money(ord)}
                        />
                      </div>
                      <span className="whitespace-nowrap text-[10.5px] text-ivory/60">
                        {periodLabel(m.period)}
                      </span>
                      <span className="whitespace-nowrap text-[11px] font-mono text-ivory/90">
                        {money(sub + ord)}
                      </span>
                    </div>
                  )
                })}
              </div>
              {/* legend */}
              <div className="mt-4 flex items-center gap-5 border-t border-white/[0.07] pt-3 text-[12px] text-ivory/60">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-flame" />
                  {t('admin.financial.subIncome')}
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-moss" />
                  {t('admin.financial.ordersPaid')}
                </span>
              </div>
            </Panel>
          ) : null}

          <div className="grid gap-5 lg:grid-cols-2">
            {/* الدخل حسب الباقة */}
            <Panel>
              <PanelHeading
                title={t('admin.financial.byPlan')}
                description={t('admin.financial.byPlanSub')}
              />
              {byPlan.length ? (
                <div className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-[#0f1220]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5 text-[11px] uppercase tracking-wider text-ivory/40">
                        <th className="px-4 py-3 text-start font-medium">{t('admin.financial.plan')}</th>
                        <th className="px-4 py-3 text-end font-medium">{t('admin.financial.subscribers')}</th>
                        <th className="px-4 py-3 text-end font-medium">{t('admin.financial.income')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {byPlan.map((p) => (
                        <tr key={p.plan_name} className="border-b border-white/5 transition hover:bg-white/5">
                          <td className="px-4 py-3 text-ivory">{p.plan_name}</td>
                          <td className="px-4 py-3 text-end text-ivory/90">{p.count}</td>
                          <td className="px-4 py-3 text-end font-semibold text-moss">{money(p.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="mt-4 text-[13px] text-ivory/50">{t('admin.financial.noData')}</div>
              )}
            </Panel>

            {/* التفاصيل الشهرية */}
            <Panel>
              <PanelHeading title={t('admin.financial.monthly')} />
              <div className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-[#0f1220]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5 text-[11px] uppercase tracking-wider text-ivory/40">
                      <th className="px-3 py-3 text-start font-medium">{t('admin.financial.period')}</th>
                      <th className="px-3 py-3 text-end font-medium">{t('admin.financial.subIncome')}</th>
                      <th className="px-3 py-3 text-end font-medium">{t('admin.financial.ordersPaid')}</th>
                      <th className="px-3 py-3 text-end font-medium">{t('admin.financial.pending')}</th>
                      <th className="px-3 py-3 text-end font-medium">{t('admin.financial.failed')}</th>
                      <th className="px-3 py-3 text-end font-medium">{t('admin.financial.refunded')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthly.map((m) => (
                      <tr key={m.period} className="border-b border-white/5 transition hover:bg-white/5">
                        <td className="px-3 py-3 text-ivory/90">{periodLabel(m.period)}</td>
                        <td className="px-3 py-3 text-end font-semibold text-moss">
                          {money(Number(m.subscription || 0))}
                        </td>
                        <td className="px-3 py-3 text-end text-ivory/90">{money(Number(m.orders || 0))}</td>
                        <td className="px-3 py-3 text-end text-flame">{money(Number(m.pending || 0))}</td>
                        <td className="px-3 py-3 text-end text-rose">{money(Number(m.failed || 0))}</td>
                        <td className="px-3 py-3 text-end text-amber">{money(Number(m.refunded || 0))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>

          {/* المصدر */}
          <p className="text-[12px] text-ivory/40">
            {t('admin.financial.source')}: {t('admin.financial.sourceSub')}
          </p>
        </>
      )}
    </div>
  )
}
