import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '../../shared/ui/icons.tsx'
import { Badge, Button, Card } from '../../shared/ui/ui.tsx'
import { useI18n } from '../../shared/i18n'
import { apiFetch } from '../../shared/lib/api.service.ts'
import { useBackendAuth } from '../../shared/store/useBackendAuth.ts'
import { useStore } from '../../shared/store/useStore.ts'

type RequestRow = {
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
  rejection_reason?: string | null
}

type Tab = 'pending' | 'all'

const STATUS_TONE: Record<string, 'moss' | 'gold' | 'outline' | 'flame' | 'neutral'> = {
  pending: 'gold',
  pending_payment: 'gold',
  approved: 'moss',
  rejected: 'flame',
}

function fmtDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function SubscriptionRequestsPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const backendStatus = useBackendAuth((s) => s.status)
  const backendUser = useBackendAuth((s) => s.user)
  const showToast = useStore((s) => s.showToast)

  const [rows, setRows] = useState<RequestRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [tab, setTab] = useState<Tab>('pending')
  const [acting, setActing] = useState<string | null>(null)

  const isSuperAdmin = backendUser?.role === 'super_admin' || backendUser?.role === 'admin'

  const load = useCallback(async () => {
    if (backendStatus !== 'ready') return
    setLoading(true)
    setLoadError('')
    try {
      const [paid, free] = await Promise.all([
        apiFetch<{ ok: boolean; data?: any[]; error?: string }>('/api/admin/paid-subscription-requests'),
        apiFetch<{ ok: boolean; data?: any[]; error?: string }>('/api/admin/free-plan-requests'),
      ])
      if (!paid?.ok || !free?.ok) {
        throw new Error(paid?.error || free?.error || 'Unable to load requests')
      }
      const paidRows: RequestRow[] = (paid?.data || []).map((r: any) => ({ ...r, kind: 'paid' as const }))
      const freeRows: RequestRow[] = (free?.data || []).map((r: any) => ({ ...r, kind: 'free' as const }))
      setRows([...paidRows, ...freeRows].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))))
    } catch (err: any) {
      setLoadError(err?.message || 'Unable to load requests')
    } finally {
      setLoading(false)
    }
  }, [backendStatus])

  useEffect(() => {
    void load()
  }, [load])

  const visible = rows.filter((r) =>
    tab === 'all' ? true : r.status === 'pending' || r.status === 'pending_payment'
  )

  const onApprove = async (row: RequestRow) => {
    setActing(row.id)
    try {
      const url =
        row.kind === 'paid'
          ? `/api/admin/paid-subscription-requests/${encodeURIComponent(row.id)}/approve`
          : `/api/admin/free-plan-requests/${encodeURIComponent(row.id)}/approve`
      const data = await apiFetch<{ ok: boolean; error?: string }>(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (data?.ok === false) throw new Error(data?.error || 'approve failed')
      showToast({ title: 'Approved', message: `${row.restaurant_name || row.restaurant_id} — request approved, site is back online.`, tone: 'success' })
      await load()
    } catch (err: any) {
      showToast({ title: t('common.error'), message: err?.message || 'approve failed', tone: 'error' })
    } finally {
      setActing(null)
    }
  }

  const onReject = async (row: RequestRow) => {
    setActing(row.id)
    try {
      const url =
        row.kind === 'paid'
          ? `/api/admin/paid-subscription-requests/${encodeURIComponent(row.id)}/reject`
          : `/api/admin/free-plan-requests/${encodeURIComponent(row.id)}/reject`
      const data = await apiFetch<{ ok: boolean; error?: string }>(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason: 'Rejected by super admin' }),
      })
      if (data?.ok === false) throw new Error(data?.error || 'reject failed')
      showToast({ title: 'Rejected', message: `${row.restaurant_name || row.restaurant_id} — request rejected. The site stays paused until a new request is approved.`, tone: 'info' })
      await load()
    } catch (err: any) {
      showToast({ title: t('common.error'), message: err?.message || 'reject failed', tone: 'error' })
    } finally {
      setActing(null)
    }
  }

  const notAuthorized = backendStatus === 'ready' && !isSuperAdmin

  return (
    <div className="min-h-screen bg-ivory">
      <header className="border-b border-sand bg-paper/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div>
            <p className="eyebrow">Super Admin Console</p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-charcoal">
              Subscription Requests
            </h1>
            <p className="mt-0.5 text-[12.5px] text-umber">
              Approve or reject plan change requests — the requester's site and menu stay paused until a request is approved.
            </p>
          </div>
          <Button variant="outline" size="sm" icon="refresh" onClick={() => void load()}>
            Refresh
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        {notAuthorized ? (
          <Card className="border-flame/30 bg-flame/8 p-6 text-center">
            <Icon name="lock" size={26} className="mx-auto text-flame-dark" />
            <h2 className="mt-3 text-lg font-semibold text-charcoal">Super admin access required</h2>
            <p className="mt-1 text-[13px] text-umber">Sign in with your super admin account to review requests.</p>
            <Button variant="dark" className="mt-4" onClick={() => navigate('/signin')}>
              Go to sign in
            </Button>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex rounded-2xl border border-sand bg-paper p-1">
                {(['pending', 'all'] as const).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTab(key)}
                    className={`rounded-xl px-4 py-1.5 text-[13px] font-medium transition ${tab === key ? 'bg-charcoal text-ivory shadow-sm' : 'text-umber hover:text-charcoal'}`}
                  >
                    {key === 'pending' ? 'Pending' : 'All'}
                  </button>
                ))}
              </div>

              <span className="text-[12px] text-umber">
                {visible.length} {visible.length === 1 ? 'request' : 'requests'}
              </span>
            </div>

            {loadError ? (
              <Card className="mt-4 border-rose/30 bg-rose/8 p-5 text-[13.5px] text-rose">{loadError}</Card>
            ) : loading ? (
              <Card className="mt-4 p-6 text-center text-[13px] text-umber">Loading requests…</Card>
            ) : visible.length === 0 ? (
              <Card className="mt-4 flex flex-col items-center gap-2 p-10 text-center">
                <Icon name="check" size={26} className="text-moss" />
                <p className="text-[15px] font-semibold text-charcoal">No requests here</p>
                <p className="text-[13px] text-umber">
                  {tab === 'pending' ? 'Nothing is waiting — every request has been processed.' : 'No requests have been made yet.'}
                </p>
              </Card>
            ) : (
              <ul className="mt-4 space-y-3">
                {visible.map((row) => {
                  const pending = row.status === 'pending' || row.status === 'pending_payment'
                  const tone = STATUS_TONE[row.status] ?? 'outline'
                  const priceLabel =
                    row.price === null || row.price === undefined
                      ? '—'
                      : Number(row.price) === 0
                        ? 'Free'
                        : `$${Number(row.price).toFixed(2)} / mo`
                  return (
                    <li key={row.id}>
                      <Card className="p-5">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[11px] font-semibold uppercase tracking-wide text-clay">
                                {row.kind === 'paid' ? 'Paid plan' : 'Free plan'}
                              </span>
                              <Badge tone={tone}>{row.status === 'pending_payment' ? 'pending' : row.status}</Badge>
                              <span className="font-mono text-[11px] text-umber/70">{fmtDate(row.created_at)}</span>
                            </div>
                            <h3 className="mt-1.5 text-[17px] font-semibold leading-snug text-charcoal">
                              {row.restaurant_name || row.restaurant_id}
                            </h3>
                            <p className="mt-0.5 text-[13px] text-umber" dir="ltr">
                              {row.restaurant_slug ? `/site/${row.restaurant_slug}` : row.restaurant_id}
                            </p>
                            <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 text-[13px] sm:grid-cols-3">
                              <div>
                                <dt className="text-[10.5px] uppercase tracking-wide text-clay">Client</dt>
                                <dd className="truncate text-espresso" title={row.user_email || ''}>{row.user_name || row.user_email || '—'}</dd>
                              </div>
                              <div>
                                <dt className="text-[10.5px] uppercase tracking-wide text-clay">Plan</dt>
                                <dd className="text-espresso">{row.plan_name || 'Starter'}</dd>
                              </div>
                              <div>
                                <dt className="text-[10.5px] uppercase tracking-wide text-clay">Price</dt>
                                <dd className="text-espresso">{priceLabel}</dd>
                              </div>
                            </dl>
                            {row.rejection_reason ? (
                              <p className="mt-2 text-[12px] text-umber">Reason: {row.rejection_reason}</p>
                            ) : null}
                          </div>

                          {pending ? (
                            <div className="flex shrink-0 flex-col gap-2">
                              <Button
                                size="sm"
                                variant="accent"
                                icon="check"
                                loading={acting === row.id}
                                onClick={() => onApprove(row)}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                icon="x"
                                loading={acting === row.id}
                                onClick={() => onReject(row)}
                              >
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="shrink-0 font-mono text-[11px] text-umber/70">{row.id}</span>
                          )}
                        </div>
                      </Card>
                    </li>
                  )
                })}
              </ul>
            )}

            <p className="mt-6 text-center text-[12px] text-umber/70">
              <Link className="underline" to="/site/bella" target="_blank">Open bella site</Link>
              {' · '}
              <Link className="underline" to="/admin">Back to admin console</Link>
            </p>
          </>
        )}
      </main>
    </div>
  )
}
