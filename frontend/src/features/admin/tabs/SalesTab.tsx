import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '../../../shared/i18n'
import type { TKey } from '../../../shared/i18n'
import { apiUrl } from '../../../shared/api/url.ts'
import { Badge, Button, Input, StatCard } from '../../../shared/ui/ui.tsx'
import { DarkEmpty, Panel, PanelHeading } from '../parts.tsx'
import { useAdminData } from '../useAdminData.ts'
import { Icon } from '../../../shared/ui/icons.tsx'
import { cx, formatDate, money } from '../../../shared/lib/utils.ts'

export type AdminSale = {
  /** day the order was placed (DATE column) */
  date: string
  restaurant_id: string
  restaurant_name?: string
  orders: number
  revenue: number
}

/** صف كلاينت من قائمة المطاعم (نفس مصدر تاب الكلاينتس) */
type ClientRow = {
  id: string
  name: string
  slug: string
  owner_name?: string
  owner_email?: string
  status?: string
  subscription_status?: string
  price?: number
}

/** استجابة GET /platform/admin/clients/:id/details */
type ClientDetails = {
  restaurant: {
    id: string
    name: string
    slug: string
    status?: string
    created_at?: string
    owner_id?: string | null
    owner_name?: string | null
    owner_email?: string | null
  }
  subscription: {
    status?: string
    price?: number
    plan_name?: string
    started_at?: string
    renews_at?: string
    interval_type?: string
  } | null
  employees: Array<{
    id: string
    name?: string
    email?: string
    role?: string
    status?: string
    branch_access_type?: string
    created_at?: string
  }>
  branches: Array<{
    id: string | null
    name: string | null
    address?: string | null
    is_active?: number | null
    orders: number
    revenue: number
    completed: number
    cancelled: number
  }>
}

type SalesPeriod = 'week' | 'month' | 'year'

const PERIODS: Array<{ value: SalesPeriod; labelKey: TKey }> = [
  { value: 'week', labelKey: 'common.week' },
  { value: 'month', labelKey: 'common.month' },
  { value: 'year', labelKey: 'common.year' },
]

/** حالة موظف → مفتاح ترجمة */
const EMP_STATUS: Record<string, TKey> = {
  active: 'admin.salesView.empActive',
  suspended: 'admin.salesView.empSuspended',
  pending: 'admin.salesView.empPending',
  removed: 'admin.salesView.empRemoved',
}

/** حالة اشتراك → مفتاح ترجمة (نفس مفاتيح تاب الاشتراكات) */
const SUB_STATUS: Record<string, TKey> = {
  active: 'admin.subscriptions.statusActive',
  trialing: 'admin.subscriptions.statusTrial',
  expired: 'admin.subscriptions.statusExpired',
  cancelled: 'admin.subscriptions.statusCancelled',
  past_due: 'admin.subscriptions.statusPastDue',
}

/** صلاحية الوصول للفروع → مفتاح ترجمة (القيم الحقيقية: all/assigned/none) */
const BRANCH_ACCESS: Record<string, TKey> = {
  all: 'admin.salesView.accessAll',
  none: 'admin.salesView.accessNone',
  assigned: 'admin.salesView.accessSome',
}

export default function SalesTab({ focusClientId }: { focusClientId?: string | null }) {
  const { t } = useI18n()
  const [period, setPeriod] = useState<SalesPeriod>('month')
  const [selectedId, setSelectedId] = useState<string | null>(focusClientId ?? null)
  const [q, setQ] = useState('')

  /* قائمة الكلاينتيس — مصدر واحد للاختيار */
  const {
    data: clients,
    loading: clientsLoading,
    error: clientsError,
  } = useAdminData<ClientRow>('/api/platform/admin/clients')

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return clients
    return clients.filter((c) =>
      `${c.name} ${c.slug} ${c.owner_name || ''} ${c.owner_email || ''}`.toLowerCase().includes(needle)
    )
  }, [clients, q])

  /* مبيعات الكلاينت المختار (أو الكل لو مفيش اختيار) */
  const salesPath = selectedId
    ? `/api/platform/admin/sales?period=${period}&restaurantId=${encodeURIComponent(selectedId)}`
    : `/api/platform/admin/sales?period=${period}`
  const { data, loading, error } = useAdminData<AdminSale>(salesPath)

  /* تفاصيله: مالك + اشتراك + موظفون + فروع
     (طلب مُلغى لو مفيش اختيار — useAdminData كان هيرجّع HTML الصفحة ويخطأ) */
  const {
    data: detailArr,
    loading: detailLoading,
    error: detailError,
  } = useAdminDetail<ClientDetails>(
    selectedId ? `/api/platform/admin/clients/${encodeURIComponent(selectedId)}/details?period=${period}` : ''
  )
  const details = detailArr[0]

  const totals = useMemo(() => {
    const revenue = data.reduce((sum, x) => sum + Number(x.revenue || 0), 0)
    const orders = data.reduce((sum, x) => sum + Number(x.orders || 0), 0)
    return { revenue, orders, avg: orders > 0 ? revenue / orders : 0 }
  }, [data])

  const selectedClient = selectedId ? clients.find((c) => c.id === selectedId) : undefined
  const restaurantName =
    details?.restaurant?.name || selectedClient?.name || data[0]?.restaurant_name || ''

  const description = selectedId ? t('admin.salesView.revenuePeriod') : t('admin.salesView.pickHint')

  /* --------------------------------- القائمة --------------------------------- */
  const clientList = (
    <Panel className="p-0 overflow-hidden">
      <div className="border-b border-white/10 p-4">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-[13px] font-semibold text-ivory">{t('admin.clients')}</span>
          <Badge tone="outline">{clients.length}</Badge>
        </div>
        <div className="relative">
          <Icon name="search" size={14} className="absolute start-3 top-2.5 text-ivory/40" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('admin.searchClients')}
            className="ps-9 bg-white/6 border-white/10 text-ivory placeholder:text-ivory/40"
          />
        </div>
      </div>

      <div className="max-h-[300px] overflow-y-auto lg:max-h-[560px]">
        {clientsLoading ? (
          <div className="p-4 text-[13px] text-ivory/50">{t('common.loading')}</div>
        ) : clientsError ? (
          <div className="p-4 text-[13px] text-rose">{clientsError}</div>
        ) : filtered.length === 0 ? (
          <div className="p-4 text-[13px] text-ivory/50">{t('admin.salesView.noClients')}</div>
        ) : (
          filtered.map((c) => {
            const active = c.id === selectedId
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedId(c.id)}
                className={cx(
                  'flex w-full items-center gap-3 border-b border-white/[0.06] px-4 py-3 text-start transition',
                  active ? 'bg-flame/15' : 'hover:bg-white/5'
                )}
              >
                <span
                  className={cx(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold',
                    active ? 'bg-flame text-white' : 'bg-ivory/10 text-ivory/70'
                  )}
                >
                  {(c.name || '?').charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-medium text-ivory">{c.name}</span>
                  <span className="block truncate text-[11.5px] text-ivory/45">
                    {c.owner_name || c.owner_email || c.slug}
                  </span>
                </span>
                <Badge
                  tone={
                    c.subscription_status === 'active'
                      ? 'moss'
                      : c.subscription_status === 'trialing'
                      ? 'gold'
                      : 'rose'
                  }
                >
                  {SUB_STATUS[c.subscription_status || '']
                    ? t(SUB_STATUS[c.subscription_status || ''])
                    : c.subscription_status || '—'}
                </Badge>
              </button>
            )
          })
        )}
      </div>
    </Panel>
  )

  /* -------------------------------- التقرير -------------------------------- */
  const report = !selectedId ? (
    <Panel className="flex min-h-[320px] items-center justify-center p-8">
      <DarkEmpty icon="chart" title={t('admin.salesView.pick')} message={t('admin.salesView.pickHint')} />
    </Panel>
  ) : detailLoading && !details ? (
    <Panel className="p-6 text-[13px] text-ivory/60">{t('common.loading')}</Panel>
  ) : detailError && !details ? (
    <Panel className="p-6 text-[13px] text-rose">{detailError}</Panel>
  ) : (
    <div className="space-y-5">
      {/* header strip */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-[#13142b] to-[#1a1540] p-6 sm:p-8">
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-flame/20 blur-[80px]" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-violet-500/20 blur-[80px]" />
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold text-ivory sm:text-3xl">{restaurantName}</h1>
            <p className="mt-1 truncate text-sm text-ivory/50">
              {details?.restaurant?.owner_name || selectedClient?.owner_name || '—'}
              {details?.restaurant?.owner_email || selectedClient?.owner_email
                ? ` · ${details?.restaurant?.owner_email || selectedClient?.owner_email}`
                : ''}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="moss">{money(totals.revenue)}</Badge>
            <Badge tone="outline">
              {totals.orders} {t('dashboard.orders')}
            </Badge>
          </div>
        </div>
      </div>

      {/* stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard tone="dark" label={t('common.revenue')} value={money(totals.revenue)} icon="trendUp" />
        <StatCard tone="dark" label={t('dashboard.orders')} value={totals.orders.toLocaleString()} icon="list" />
        <StatCard tone="dark" label={t('earnings.avgOrder')} value={money(totals.avg)} icon="card" />
      </div>

      {/* بيانات الكلاينت */}
      <Panel className="p-5">
        <PanelHeading title={t('admin.salesView.details')} />
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Fact label={t('admin.salesView.registered')} value={details?.restaurant?.created_at ? formatDate(details.restaurant.created_at) : '—'} />
          <Fact
            label={t('admin.salesView.plan')}
            value={
              details?.subscription?.plan_name
                ? `${details.subscription.plan_name} · ${money(Number(details.subscription.price || 0))}`
                : '—'
            }
          />
          <Fact
            label={t('admin.subscriptions.title')}
            value={
              details?.subscription?.status ? (
                <Badge
                  tone={
                    details.subscription.status === 'active'
                      ? 'moss'
                      : details.subscription.status === 'trialing'
                      ? 'gold'
                      : 'rose'
                  }
                >
                  {SUB_STATUS[details.subscription.status]
                    ? t(SUB_STATUS[details.subscription.status])
                    : details.subscription.status}
                </Badge>
              ) : (
                '—'
              )
            }
          />
          <Fact
            label={t('admin.renews')}
            value={details?.subscription?.renews_at ? formatDate(details.subscription.renews_at) : t('admin.subscriptions.never')}
          />
        </div>
      </Panel>

      {/* سجل المبيعات */}
      <Panel>
        <PanelHeading
          title={t('admin.sales')}
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
          }
        />

        {loading ? (
          <div className="mt-4 text-[13px] text-ivory/50">{t('common.loading')}</div>
        ) : error ? (
          <div className="mt-4 text-[13px] text-rose">{error}</div>
        ) : data.length ? (
          <div className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-[#0f1220]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-[11px] uppercase tracking-wider text-ivory/40">
                  <th className="px-4 py-3 text-start font-medium">{t('common.date')}</th>
                  <th className="px-4 py-3 text-end font-medium">{t('dashboard.orders')}</th>
                  <th className="px-4 py-3 text-end font-medium">{t('common.revenue')}</th>
                </tr>
              </thead>
              <tbody>
                {data.map((x, i) => (
                  <tr key={i} className="border-b border-white/5 transition hover:bg-white/5">
                    <td className="px-4 py-3 align-top text-ivory/90">{formatDate(String(x.date))}</td>
                    <td className="px-4 py-3 align-top text-end text-ivory/90">
                      {Number(x.orders || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 align-top text-end font-semibold text-moss">
                      {money(Number(x.revenue || 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-4">
            <DarkEmpty icon="chart" title={t('platformMore.sales.noOrders')} message={t('admin.salesView.pickHint')} />
          </div>
        )}
      </Panel>

      {/* الفريق */}
      <Panel>
        <PanelHeading
          title={t('admin.salesView.team')}
          description={t('admin.salesView.teamCount', { n: details?.employees?.length || 0 })}
        />
        {details?.employees?.length ? (
          <div className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-[#0f1220]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-[11px] uppercase tracking-wider text-ivory/40">
                  <th className="px-4 py-3 text-start font-medium">{t('common.name')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('common.email')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('admin.role')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('common.status')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('admin.salesView.branchAccess')}</th>
                </tr>
              </thead>
              <tbody>
                {details.employees.map((e) => (
                  <tr key={e.id} className="border-b border-white/5 transition hover:bg-white/5">
                    <td className="px-4 py-3 align-top text-ivory">{e.name || '—'}</td>
                    <td className="px-4 py-3 align-top text-ivory/60" dir="ltr">
                      {e.email || '—'}
                    </td>
                    <td className="px-4 py-3 align-top text-ivory/90">
                      {e.role ? t(`employee.role.${e.role}`, { defaultValue: e.role }) : '—'}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <Badge
                        tone={
                          e.status === 'active'
                            ? 'moss'
                            : e.status === 'pending'
                            ? 'gold'
                            : e.status === 'removed'
                            ? 'outline'
                            : 'rose'
                        }
                      >
                        {EMP_STATUS[e.status || ''] ? t(EMP_STATUS[e.status || '']) : e.status || '—'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 align-top text-ivory/70">
                      {e.branch_access_type && BRANCH_ACCESS[e.branch_access_type]
                        ? t(BRANCH_ACCESS[e.branch_access_type])
                        : e.branch_access_type || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-4">
            <DarkEmpty icon="users" title={t('admin.salesView.teamEmpty')} message={t('admin.salesView.teamEmpty')} />
          </div>
        )}
      </Panel>

      {/* الفروع */}
      <Panel>
        <PanelHeading
          title={t('branches.title')}
          description={t('admin.salesView.branchRevenue')}
        />
        {details?.branches?.length ? (
          <div className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-[#0f1220]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-[11px] uppercase tracking-wider text-ivory/40">
                  <th className="px-4 py-3 text-start font-medium">{t('branches.name')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('common.status')}</th>
                  <th className="px-4 py-3 text-end font-medium">{t('dashboard.orders')}</th>
                  <th className="px-4 py-3 text-end font-medium">{t('common.revenue')}</th>
                </tr>
              </thead>
              <tbody>
                {details.branches.map((b, i) => (
                  <tr key={b.id || `nb-${i}`} className="border-b border-white/5 transition hover:bg-white/5">
                    <td className="px-4 py-3 align-top text-ivory">
                      {b.name || (
                        <span className="text-ivory/40">{t('admin.salesView.noBranch')}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {b.id ? (
                        <Badge tone={Number(b.is_active || 0) ? 'moss' : 'rose'}>
                          {Number(b.is_active || 0) ? t('branches.active') : t('admin.planForm.inactive')}
                        </Badge>
                      ) : (
                        <span className="text-ivory/40">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top text-end text-ivory/90">
                      {Number(b.orders || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 align-top text-end font-semibold text-moss">
                      {money(Number(b.revenue || 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-4">
            <DarkEmpty icon="layers" title={t('admin.salesView.branchesEmpty')} message={t('admin.salesView.branchesEmpty')} />
          </div>
        )}
      </Panel>
    </div>
  )

  return (
    <div className="space-y-5">
      {/* header strip — always visible */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-[#13142b] to-[#1a1540] p-6 sm:p-8">
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-flame/20 blur-[80px]" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-violet-500/20 blur-[80px]" />
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ivory sm:text-3xl">{t('admin.sales')}</h1>
            <p className="mt-1 text-sm text-ivory/50">{t('admin.salesView.pickSub')}</p>
          </div>
          {selectedId ? (
            <Button size="sm" variant="outline" icon="x" onClick={() => setSelectedId(null)}>
              {t('admin.salesView.pick')}
            </Button>
          ) : null}
        </div>
      </div>

      {/* picker + report */}
      <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
        <div className="lg:sticky lg:top-4 lg:self-start">{clientList}</div>
        <div className="min-w-0">{report}</div>
      </div>
    </div>
  )
}

/** حقل بيانات صغير داخل تاب الكلاينت */
function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-3">
      <div className="text-[10.5px] uppercase tracking-[0.12em] text-ivory/40">{label}</div>
      <div className="mt-1 text-[13px] font-medium text-ivory">{value}</div>
    </div>
  )
}

/**
 * نسخة من useAdminData تتجاهل المسار الفارغ بدل إرسال طلب للصفحة نفسها
 * (المستخدم هنا لا يُحدَّد كلاينت ⇒ لا تفاصيل تُجلب).
 */
function useAdminDetail<T>(path: string) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(Boolean(path))
  const [error, setError] = useState('')

  useEffect(() => {
    if (!path) {
      setData([])
      setError('')
      setLoading(false)
      return
    }
    let dead = false
    setLoading(true)
    setError('')
    fetch(apiUrl(path), { credentials: 'include' })
      .then(async (r) => {
        const j = await r.json()
        if (!r.ok || !j.ok) throw Error(j.error || 'Request failed')
        return j.data
      })
      .then((x) => {
        if (!dead) setData(Array.isArray(x) ? x : [x])
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
  }, [path])

  return { data, loading, error }
}
