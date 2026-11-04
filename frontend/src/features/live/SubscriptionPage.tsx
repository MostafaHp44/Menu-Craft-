import { Card } from '../../shared/ui/ui.tsx'
import { useI18n } from '../../shared/i18n'
import { sitesApi, type SiteSummary } from '../../shared/api/client.ts'
import { useAsync } from './useAsync.ts'
import { ApiPendingNote, ErrorBlock, LoadingBlock, PageHeader, RefreshButton, StatusBadge } from './components.tsx'
import { formatDate } from './format.ts'

export default function SubscriptionPage() {
  const { t, lang } = useI18n()
  const summary = useAsync<SiteSummary>(() => sitesApi.summary(), [])
  const data = summary.data

  return (
    <div>
      <PageHeader
        title={t('live.subscription.title')}
        sub={t('live.subscription.sub')}
        actions={<RefreshButton onClick={summary.refresh} loading={summary.loading} />}
      />

      {summary.error ? <ErrorBlock message={summary.error} onRetry={summary.refresh} /> : null}
      {summary.loading && !data ? <LoadingBlock rows={3} /> : null}

      {data ? (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-clay">
                {t('live.subscription.plan')}
              </p>
              <p className="mt-1 text-[22px] font-semibold capitalize text-charcoal">
                {data.subscription.planCode}
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-clay">
                {t('live.subscription.status')}
              </p>
              <div className="mt-1.5">
                <StatusBadge status={data.subscription.status} />
              </div>
            </Card>
            <Card className="p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-clay">
                {t('live.subscription.periodEnd')}
              </p>
              <p className="mt-1 text-[15px] font-medium text-charcoal">
                {data.subscription.currentPeriodEnd
                  ? formatDate(data.subscription.currentPeriodEnd, lang)
                  : t('live.common.notAvailable')}
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-clay">
                {t('live.sites.title')}
              </p>
              <p className="mt-1 text-[22px] font-semibold text-charcoal">
                {data.used} / {data.unlimited ? '∞' : data.maxSites}
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
