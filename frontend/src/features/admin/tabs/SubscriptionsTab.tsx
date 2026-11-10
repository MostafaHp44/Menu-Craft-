import { useCallback, useEffect, useState } from 'react'
import { useI18n } from '../../../shared/i18n'
import { platformAPI } from '../../../shared/lib/api.service.ts'
import { apiFetch } from '../../../shared/lib/api.service.ts'
import { DarkEmpty, Panel, PanelHeading } from '../parts.tsx'
import { Badge, Button } from '../../../shared/ui/ui.tsx'
import { useStore } from '../../../shared/store/useStore.ts'

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
  const intervalLabel = (s: SubRow) => s.interval_type || '—'
  const priceLabel = (s: SubRow) => Number(s.plan_price ?? s.price ?? 0)
  const statusLabel = (s: SubRow) => String(s.status || 'unknown')
  const isAutoRenew = (s: SubRow) => Boolean(s.auto_renew)

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
    if (!window.confirm(`Close/suspend subscription for ${restaurantLabel(s)}? The site will be paused.`)) return
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

  const onReactivate = async (s: SubRow) => {
    if (!s.restaurant_id) return
    if (!window.confirm(t('admin.subscriptions.reactivateConfirm', { name: restaurantLabel(s) }))) return
    setActing(s.id)
    try {
      await platformAPI.updateSubscription(s.restaurant_id, { status: 'active' })
      showToast({ title: t('admin.subscriptions.reactivated'), message: t('admin.subscriptions.reactivatedMsg', { name: restaurantLabel(s) }), tone: 'success' })
      await loadSubs()
    } catch (err: any) {
      showToast({ title: t('admin.subscriptions.reactivateFailed'), message: err?.message || t('admin.subscriptions.reactivateFailed'), tone: 'error' })
    } finally {
      setActing(null)
    }
  }

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
            {subscriptions.map((s) => (
              <div key={s.id} className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-ivory">{planLabel(s)}</span>
                  <span className="badge bg-ivory/20 text-ivory/70 text-xs capitalize">{statusLabel(s)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-xl border border-white/8 bg-white/4 px-3.5 py-3">
                    <div className="text-[11px] uppercase tracking-[0.12em] text-ivory/40">{t('admin.subscriptions.planPrice')}</div>
                    <div className="mt-1 text-[13px] font-medium text-ivory">{priceLabel(s)}</div>
                  </div>
                  <div className="rounded-xl border border-white/8 bg-white/4 px-3.5 py-3">
                    <div className="text-[11px] uppercase tracking-[0.12em] text-ivory/40">{t('admin.subscriptions.restaurant')}</div>
                    <div className="mt-1 text-[13px] font-medium text-ivory">{restaurantLabel(s)}</div>
                  </div>
                  <div className="rounded-xl border border-white/8 bg-white/4 px-3.5 py-3">
                    <div className="text-[11px] uppercase tracking-[0.12em] text-ivory/40">{t('admin.subscriptions.startsAt')}</div>
                    <div className="mt-1 text-[13px] font-medium text-ivory">{s.started_at || '-'}</div>
                  </div>
                  <div className="rounded-xl border border-white/8 bg-white/4 px-3.5 py-3">
                    <div className="text-[11px] uppercase tracking-[0.12em] text-ivory/40">{t('admin.subscriptions.duration')}</div>
                    <div className="mt-1 text-[13px] font-medium text-ivory">{intervalLabel(s)}</div>
                  </div>
                  {s.owner_email ? (
                    <div className="col-span-2 rounded-xl border border-white/8 bg-white/4 px-3.5 py-3">
                      <div className="text-[11px] uppercase tracking-[0.12em] text-ivory/40">{t('admin.subscriptions.owner')}</div>
                      <div className="mt-1 text-[13px] font-medium text-ivory">{s.owner_name || s.owner_email} · {s.owner_email}</div>
                    </div>
                  ) : null}
                  {s.renews_at ? (
                    <div className="col-span-2 rounded-xl border border-white/8 bg-white/4 px-3.5 py-3">
                      <div className="text-[11px] uppercase tracking-[0.12em] text-ivory/40">{t('admin.renews')}</div>
                      <div className="mt-1 text-[13px] font-medium text-ivory">{s.renews_at}</div>
                    </div>
                  ) : null}
                </div>

                {/* Actions: auto-renew toggle + close package / reactivate */}
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 text-[12px] text-ivory/70">
                    <input
                      type="checkbox"
                      checked={isAutoRenew(s)}
                      disabled={acting === s.id || String(s.status) !== 'active'}
                      onChange={() => onToggleAutoRenew(s)}
                      className="h-4 w-4"
                    />
                    {t('admin.subscriptions.autoRenew')}
                  </label>
                  {String(s.status) === 'active' || String(s.status) === 'trialing' ? (
                    <Button size="sm" variant="danger" icon="x" loading={acting === s.id} onClick={() => onClosePackage(s)}>
                      {t('admin.subscriptions.closePackage')}
                    </Button>
                  ) : (
                    <Button size="sm" variant="accent" icon="refresh" loading={acting === s.id} onClick={() => onReactivate(s)}>
                      {t('admin.subscriptions.reactivate')}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  )
}
