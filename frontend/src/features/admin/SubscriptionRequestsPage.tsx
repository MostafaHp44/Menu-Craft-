import { Card } from '../../shared/ui/ui.tsx'
import { useI18n } from '../../shared/i18n'

export default function SubscriptionRequestsPage() {
  const { t } = useI18n()
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Card className="p-8">
        <h1 className="text-2xl font-bold text-charcoal mb-2">{t('subRequests.title', { defaultValue: 'Subscription requests' })}</h1>
        <p className="text-sm text-umber">{t('subRequests.sub', { defaultValue: 'Manage subscription requests and approvals.' })}</p>
        <div className="mt-6 rounded-xl border border-amber/30 bg-amber/10 px-4 py-3 text-[12.5px] text-amber-800">
          <strong>API unavailable:</strong> Subscription management endpoints (GET /api/admin/subscriptions/requests, POST /api/admin/subscriptions/ORDER_ID/approve) are not exposed by the backend yet.
        </div>
      </Card>
    </div>
  )
}
