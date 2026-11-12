import { useCallback, useEffect, useState } from 'react'
import { useI18n } from '../../../shared/i18n'
import { platformAPI } from '../../../shared/lib/api.service.ts'
import { apiFetch } from '../../../shared/lib/api.service.ts'
import { DarkEmpty, Panel, PanelHeading } from '../parts.tsx'
import { Badge, Button } from '../../../shared/ui/ui.tsx'
import { formatDate, money, cx } from '../../../shared/lib/utils.ts'
import { useStore } from '../../../shared/store/useStore.ts'
import { confirmDialog } from '../../../shared/components/dialogs.tsx'

interface SubRow {
  id: string
  user_id?: string
  restaurant_id?: string
  plan_id?: string
  plan_name?: string
  plan_price?: number | string
  price?: number | string
  status?: string
  started_at?: string
  renews_at?: string
  interval_type?: string
  restaurant_name?: string
  restaurant_slug?: string
  owner_name?: string
  owner_email?: string
  auto_renew?: boolean | number
}

interface RequestRow {
  id: string
  kind: 'paid' | 'free'
  restaurant_id: string
  restaurant_slug?: string | null
  restaurant_name?: string | null
  user_name?: string | null
  user_email?: string | null
  plan_name?: string | null
  price?: number | string | null
  status: string
  created_at: string
}

export default function SubscriptionsTab() {
  const { t } = useI18n()
  const showToast = useStore((s) => s.showToast)

  const [subscriptions, setSubscriptions] = useState<SubRow[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)

  const [requests, setRequests] = useState<RequestRow[]>([])
  const [reqLoading, setReqLoading] = useState(true)
  const [reqError, setReqError] = useState('')

  const loadSubs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await platformAPI.getSubscriptions()
      setSubscriptions(Array.isArray(res?.data) ? res.data : [])
    } catch {
      setSubscriptions([])
    } finally {
      setLoading(false)
    }
  }, [])

  const loadRequests = useCallback(async () => {
    setReqLoading(true)
    setReqError('')
    try {
      const [paid, free] = await Promise.all([
        apiFetch<{ ok: boolean; data?: any[]; error?: string }>('/api/admin/paid-subscription-requests'),
        apiFetch<{ ok: boolean; data?: any[]; error?: string }>('/api/admin/free-plan-requests'),
      ])
      if (!paid?.ok || !free?.ok) throw new Error(paid?.error || free?.error || t('admin.subscriptions.loadingError'))
      const paidRows: RequestRow[] = (paid.data || []).map((r: any) => ({ ...r, kind: 'paid' as const }))
      const freeRows: RequestRow[] = (free.data || []).map((r: any) => ({ ...r, kind: 'free' as const }))
      setRequests([...paidRows, ...freeRows].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))))
    } catch (err: any) {
      setReqError(err?.message || t('admin.subscriptions.loadingError'))
    } finally {
      setReqLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSubs()
    void loadRequests()
  }, [loadSubs, loadRequests])

  const activeSubs = subscriptions.filter((s) => ['active', 'trialing'].includes(String(s.status))).length
  const totalSubs = subscriptions.length
  const mrr = subscriptions
    .filter((s) => ['active', 'trialing'].includes(String(s.status)))
    .reduce((sum, s) => sum + Number(s.plan_price ?? s.price ?? 0), 0)

  const planLabel = (s: SubRow) => s.plan_name || s.plan_id || '—'
  const restaurantLabel = (s: SubRow) => s.restaurant_name || s.restaurant_slug || s.restaurant_id || '—'
  const ownerLabel = (s: SubRow) => s.owner_name || s.owner_email || ''
  const priceLabel = (s: SubRow) => Number(s.plan_price ?? s.price ?? 0)
  const statusLabel = (s: SubRow) => String(s.status || 'unknown')
  const isAutoRenew = (s: SubRow) => Boolean(s.auto_renew)

  /* حالة مترجمة + لون بدل النص الخام (active/trialing/…) */
  const STATUS_META: Record<string, { key: string; tone: 'moss' | 'gold' | 'rose' | 'neutral' }> = {
    active: { key: 'admin.subscriptions.statusActive', tone: 'moss' },
    trialing: { key: 'admin.subscriptions.statusTrial', tone: 'gold' },
    expired: { key: 'admin.subscriptions.statusExpired', tone: 'rose' },
    cancelled: { key: 'admin.subscriptions.statusCancelled', tone: 'neutral' },
    past_due: { key: 'admin.subscriptions.statusPastDue', tone: 'rose' },
  }
  const statusMeta = (s: SubRow) => STATUS_META[statusLabel(s)] ?? { key: 'admin.subscriptions.statusUnknown', tone: 'neutral' as const }

  /* المدة مترجمة: month/year/forever بدل القيمة الخام */
  const INTERVAL_KEY: Record<string, string> = {
    month: 'admin.intervalMonth',
    year: 'admin.intervalYear',
    forever: 'admin.intervalForever',
  }
  const intervalText = (s: SubRow) => {
    const raw = String(s.interval_type || '')
    return INTERVAL_KEY[raw] ? t(INTERVAL_KEY[raw]) : raw || '—'
  }

  /* تواريخ مقروءة بدل ISO خام (2026-11-12T01:57:24.000Z) */
  const dateText = (v?: string) => (v ? formatDate(v) : '—')

  const onToggleAutoRenew = async (s: SubRow) => {
    if (!s.restaurant_id) return
    setActing(s.id)
    try {
      await platformAPI.updateSubscription(s.restaurant_id, { auto_renew: isAutoRenew(s) ? 0 : 1 })
      showToast({ title: t('admin.subscriptions.autoRenewUpdated'), message: t('admin.subscriptions.autoRenewUpdatedMsg', { name: restaurantLabel(s), state: isAutoRenew(s) ? 'disabled' : 'enabled' }), tone: 'success' })
      await loadSubs()
    } catch (err: any) {
      showToast({ title: t('admin.subscriptions.updateFailed'), message: err?.message || t('admin.subscriptions.updateFailed'), tone: 'error' })
    } finally {
      setActing(null)
    }
  }

  const onClosePackage = async (s: SubRow) => {
    if (!s.restaurant_id) return
    const ok = await confirmDialog({
      title: t('admin.subscriptions.closeTitle', { defaultValue: 'إيقاف الاشتراك؟' }),
      message: t('admin.subscriptions.closeConfirm', { name: restaurantLabel(s) }),
      confirmLabel: t('admin.subscriptions.closePackage'),
      cancelLabel: t('common.cancel'),
      tone: 'danger',
    })
    if (!ok) return
    setActing(s.id)
    try {
      await platformAPI.updateSubscription(s.restaurant_id, { status: 'cancelled' })
      showToast({ title: t('admin.subscriptions.closed'), message: t('admin.subscriptions.closedMsg', { name: restaurantLabel(s) }), tone: 'info' })
      await loadSubs()
    } catch (err: any) {
      showToast({ title: t('admin.subscriptions.closeFailed'), message: t('admin.subscriptions.closeFailed'), tone: 'error' })
    } finally {
      setActing(null)
    }
  }

  /* تجديد شهر — زرّار السوبر أدمن بيدوسه لما يتحصّل الفلوس كاش:
     status = active + renews_at = max(الآن، renews_at الحالي) شهر.
     يعني لو باقي أيام تُضاف الشهر فوقها، ولو انتهت يبدأ الشهر من النهارده. */
  const onRenewMonth = async (s: SubRow) => {
    if (!s.restaurant_id) return
    const base = new Date(Math.max(new Date(s.renews_at ?? 0).getTime(), Date.now()))
    base.setMonth(base.getMonth() + 1)
    const renewsAt = base.toISOString().slice(0, 10)
    const ok = await confirmDialog({
      title: t('admin.subscriptions.renewMonthTitle'),
      message: t('admin.subscriptions.renewMonthConfirm', { name: restaurantLabel(s), date: renewsAt }),
      confirmLabel: t('admin.subscriptions.renewMonth'),
      cancelLabel: t('common.cancel'),
      tone: 'accent',
    })
    if (!ok) return
    setActing(s.id)
    try {
      await platformAPI.updateSubscription(s.restaurant_id, { status: 'active', renews_at: renewsAt })
      showToast({ title: t('admin.subscriptions.renewed'), message: t('admin.subscriptions.renewedMsg', { name: restaurantLabel(s), date: renewsAt }), tone: 'success' })
      await loadSubs()
    } catch (err: any) {
      showToast({ title: t('admin.subscriptions.renewFailed'), message: err?.message || t('admin.subscriptions.renewFailed'), tone: 'error' })
    } finally {
      setActing(null)
    }
  }

  /* هل الشهر انتهى فعليًا رغم أن الصف لا يزال active في القاعدة؟ */
  const isDateExpired = (s: SubRow) => Boolean(s.renews_at && new Date(s.renews_at).getTime() < Date.now())
  /* فعّال فعلًا = الحالة خام نشطة ولم يمرّ تاريخ renews_at (القفل يحدث بالقراءة) */
  const isEffectivelyActive = (s: SubRow) =>
    (String(s.status) === 'active' || String(s.status) === 'trialing') && !isDateExpired(s)

  const onApprove = async (row: RequestRow) => {
    setActing(row.id)
    try {
      const url = row.kind === 'paid'
        ? `/api/admin/paid-subscription-requests/${encodeURIComponent(row.id)}/approve`
        : `/api/admin/free-plan-requests/${encodeURIComponent(row.id)}/approve`
      const data = await apiFetch<{ ok: boolean; error?: string }>(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
      if (data?.ok === false) throw new Error(data?.error || t('admin.subscriptions.approveFailed'))
      showToast({ title: t('admin.subscriptions.approved'), message: t('admin.subscriptions.approvedMsg', { name: row.restaurant_name || row.restaurant_id }), tone: 'success' })
      await loadRequests()
      await loadSubs()
    } catch (err: any) {
      showToast({ title: t('admin.subscriptions.approveFailed'), message: err?.message || t('admin.subscriptions.approveFailed'), tone: 'error' })
    } finally {
      setActing(null)
    }
  }

  const onReject = async (row: RequestRow) => {
    setActing(row.id)
    try {
      const url = row.kind === 'paid'
        ? `/api/admin/paid-subscription-requests/${encodeURIComponent(row.id)}/reject`
        : `/api/admin/free-plan-requests/${encodeURIComponent(row.id)}/reject`
      const data = await apiFetch<{ ok: boolean; error?: string }>(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rejectionReason: 'Rejected by super admin' }) })
      if (data?.ok === false) throw new Error(data?.error || t('admin.subscriptions.rejectFailed'))
      showToast({ title: t('admin.subscriptions.rejected'), message: t('admin.subscriptions.rejectedMsg', { name: row.restaurant_name || row.restaurant_id }), tone: 'info' })
      await loadRequests()
    } catch (err: any) {
      showToast({ title: t('admin.subscriptions.rejectFailed'), message: err?.message || t('admin.subscriptions.rejectFailed'), tone: 'error' })
    } finally {
      setActing(null)
    }
  }

  const pendingRequests = requests.filter((r) => r.status === 'pending' || r.status === 'pending_payment')

  return (
    <div>
      <h1 className="text-2xl font-bold text-ivory mb-6">{t('admin.subscriptions.title')}</h1>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Panel className="p-4">
          <div className="text-3xl font-bold text-ivory">{totalSubs}</div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-ivory/50">{t('admin.subscriptions.total')}</div>
        </Panel>
        <Panel className="p-4">
          <div className="text-3xl font-bold text-ivory">{activeSubs}</div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-ivory/50">{t('admin.subscriptions.active')}</div>
        </Panel>
        <Panel className="p-4">
          <div className="text-3xl font-bold text-ivory">{mrr}</div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-ivory/50">{t('admin.subscriptions.mrr')}</div>
        </Panel>
        <Panel className="p-4">
          <div className="text-3xl font-bold text-ivory">{subscriptions.length - activeSubs}</div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-ivory/50">{t('admin.subscriptions.paused')}</div>
        </Panel>
      </div>

      {/* Pending requests from owners */}
      <Panel className="mt-2 p-6">
        <PanelHeading title={t('admin.subscriptions.pending')} description={t('admin.subscriptions.pendingDesc')} />
        {reqLoading ? (
          <Panel>{t('admin.subscriptions.loadingRequests')}</Panel>
        ) : reqError ? (
          <Panel>{t('admin.subscriptions.loadingError')}: {reqError}</Panel>
        ) : pendingRequests.length === 0 ? (
          <DarkEmpty title={t('admin.subscriptions.noPending')} message={t('admin.subscriptions.noPendingMsg')} />
        ) : (
          <div className="mt-4 space-y-3">
            {pendingRequests.map((row) => (
              <div key={row.id} className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-ivory">{row.restaurant_name || row.restaurant_id}</span>
                  <Badge tone="gold">{row.status}</Badge>
                </div>
                <div className="text-[12px] text-ivory/60 mb-3">
                  {row.kind === 'paid' ? t('admin.subscriptions.paidPlan') : t('admin.subscriptions.freePlan')} · {row.plan_name || t('admin.subscriptions.planPrice')} · {row.price === null || row.price === undefined ? '—' : Number(row.price) === 0 ? t('admin.subscriptions.freePlan') : `$${Number(row.price).toFixed(2)} / mo`} · {row.user_name || row.user_email || '—'}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="accent" icon="check" loading={acting === row.id} onClick={() => onApprove(row)}>{t('admin.subscriptions.approve')}</Button>
                  <Button size="sm" variant="danger" icon="x" loading={acting === row.id} onClick={() => onReject(row)}>{t('admin.subscriptions.reject')}</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* Active subscriptions list */}
      <Panel className="mt-8 p-6">
        <PanelHeading title={t('admin.subscriptions.subscriptions')} description={t('admin.subscriptions.subscriptionsDesc')} />

        {loading ? (
          <Panel>{t('admin.subscriptions.loadingSubscriptions')}</Panel>
        ) : subscriptions.length === 0 ? (
          <DarkEmpty title={t('admin.subscriptions.noSubscriptions')} message={t('admin.subscriptions.noSubscriptionsMsg')} />
        ) : (
          <div className="mt-4 space-y-3">
            {subscriptions.map((s) => {
              const meta = statusMeta(s)
              const owner = ownerLabel(s)
              const dateExpired = isDateExpired(s)
              return (
                <div key={s.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5 transition-colors hover:bg-white/[0.06]">
                  {/* Header: owner front and center + status */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-flame/25 text-[13px] font-bold text-ivory">
                          {(owner || restaurantLabel(s)).charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <div className="truncate text-[15px] font-semibold text-ivory">
                            {owner || t('admin.subscriptions.noOwner')}
                          </div>
                          <div className="truncate text-[12.5px] text-ivory/55">
                            {restaurantLabel(s)} · {planLabel(s)}
                          </div>
                        </div>
                      </div>
                      {owner && s.owner_email ? (
                        <div className="mt-1.5 ps-10 text-[12px] text-ivory/45" dir="ltr">{s.owner_email}</div>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Badge tone={meta.tone}>{t(meta.key)}</Badge>
                      <span className="text-[12px] text-ivory/50">
                        {priceLabel(s) === 0 ? t('admin.free') : `${money(priceLabel(s))} ${t('admin.subscriptions.perMonth')}`}
                      </span>
                    </div>
                  </div>

                  {/* Facts row */}
                  <div className="mt-3.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-2.5">
                      <div className="text-[10.5px] uppercase tracking-[0.12em] text-ivory/40">{t('admin.subscriptions.restaurant')}</div>
                      <div className="mt-0.5 truncate text-[13px] font-medium text-ivory">{restaurantLabel(s)}</div>
                    </div>
                    <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-2.5">
                      <div className="text-[10.5px] uppercase tracking-[0.12em] text-ivory/40">{t('admin.subscriptions.startsAt')}</div>
                      <div className="mt-0.5 text-[13px] font-medium text-ivory">{dateText(s.started_at)}</div>
                    </div>
                    <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-2.5">
                      <div className="text-[10.5px] uppercase tracking-[0.12em] text-ivory/40">{t('admin.subscriptions.duration')}</div>
                      <div className="mt-0.5 text-[13px] font-medium text-ivory">{intervalText(s)}</div>
                    </div>
                    <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-2.5">
                      <div className="text-[10.5px] uppercase tracking-[0.12em] text-ivory/40">{t('admin.renews')}</div>
                      <div className={cx('mt-0.5 text-[13px] font-medium', dateExpired && s.renews_at ? 'text-rose' : 'text-ivory')}>
                        {s.renews_at ? dateText(s.renews_at) : t('admin.subscriptions.never')}
                      </div>
                    </div>
                  </div>

                  {dateExpired && s.renews_at ? (
                    <div className="mt-2 text-[12px] text-rose/85">⚠ {t('admin.subscriptions.expiredByDate')}</div>
                  ) : null}

                  {/* Actions: auto-renew toggle + close package / renew another month */}
                  <div className="mt-3.5 flex flex-wrap items-center gap-3 border-t border-white/[0.07] pt-3">
                    <label className="flex cursor-pointer items-center gap-2 text-[12.5px] text-ivory/70">
                      <input
                        type="checkbox"
                        checked={isAutoRenew(s)}
                        disabled={acting === s.id || String(s.status) !== 'active'}
                        onChange={() => onToggleAutoRenew(s)}
                        className="h-4 w-4"
                      />
                      {t('admin.subscriptions.autoRenew')}
                    </label>
                    <div className="ms-auto flex flex-wrap items-center gap-2">
                      {isEffectivelyActive(s) ? (
                        <Button size="sm" variant="danger" icon="x" loading={acting === s.id} onClick={() => onClosePackage(s)}>
                          {t('admin.subscriptions.closePackage')}
                        </Button>
                      ) : null}
                      {/* التجديد دائمًا متاح: وهو حلّ «الشهر خلص» — يفعّل شهر إضافي بعد تحصيل الكاش */}
                      <Button size="sm" variant="accent" icon="refresh" loading={acting === s.id} onClick={() => onRenewMonth(s)}>
                        {t('admin.subscriptions.renewMonth')}
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Panel>
    </div>
  )
}
