import { Card } from '../../shared/ui/ui.tsx'
import { useI18n } from '../../shared/i18n'
import { sitesApi } from '../../shared/api/client.ts'
import { useAsync } from './useAsync.ts'
import { ApiPendingNote, ErrorBlock, LoadingBlock, PageHeader, RefreshButton, StatusBadge } from './components.tsx'
import { formatDate } from './format.ts'

interface PlanInfo {
  id?: string
  name?: string | null
  price?: number | null
}
interface SubInfo {
  status: 'trialing' | 'active' | 'past_due' | 'cancelled' | 'expired';
  renewsAt: string | null;
  daysLeft: number | null;
  isTrial: boolean;
}
interface SitePlanData {
  ok: boolean
  data: {
    plan?: PlanInfo | null
    subscription?: SubInfo | null
    used?: number
    maxSites?: number
    remaining?: number | null
    unlimited?: boolean
  }
}

export default function SubscriptionPage() {
  const { t, lang } = useI18n()
  const plan = useAsync<SitePlanData>(() => sitesApi.summary(), [])
  const data = plan.data?.data

  return (
    <div>
      <PageHeader
        title={t('live.subscription.title')}
        sub={t('live.subscription.sub')}
        actions={<RefreshButton onClick={plan.refresh} loading={plan.loading} />}
      />

      {plan.error ? <ErrorBlock message={plan.error} onRetry={plan.refresh} /> : null}
      {plan.loading && !data ? <LoadingBlock rows={3} /> : null}

      {data ? (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-clay">
                {t('live.subscription.plan')}
              </p>
              <p className="mt-1 text-[22px] font-semibold capitalize text-charcoal">
                {data.plan?.name ?? t('live.common.notAvailable')}
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-clay">
                {t('live.subscription.status')}
              </p>
              <div className="mt-1.5">
                <StatusBadge status={data.subscription?.status ?? '—'} />
              </div>
            </Card>
            <Card className="p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-clay">
                {t('live.subscription.periodEnd')}
              </p>
              <p className="mt-1 text-[15px] font-medium text-charcoal">
                {data.subscription?.renewsAt
                  ? formatDate(data.subscription.renewsAt, lang)
                  : t('live.common.notAvailable')}
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-clay">
                {t('live.sites.title')}
              </p>
              <p className="mt-1 text-[22px] font-semibold text-charcoal">
                {data.used ?? 0} / {(data.maxSites ?? 1) < 0 ? '∞' : (data.maxSites ?? 1)}
              </p>
              {data.remaining !== null ? (
                <p className="mt-0.5 text-[11.5px] text-clay">
                  {data.remaining} {t('live.subscription.remaining')}
                </p>
              ) : null}
            </Card>
          </div>

          <ApiPendingNote>
            <strong className="block font-semibold text-charcoal">{t('live.subscription.pendingTitle')}</strong>
            <span className="mt-1 block">{t('live.subscription.pendingBody')}</span>
          </ApiPendingNote>
        </div>
      ) : null}
    </div>
  )
}
