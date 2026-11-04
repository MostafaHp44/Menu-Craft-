import { useParams } from 'react-router-dom'
import { Card } from '../../shared/ui/ui.tsx'
import { useI18n } from '../../shared/i18n'

export default function OrderTrackingPage() {
  const { t } = useI18n()
  const { id } = useParams<{ id: string }>()
  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <Card className="p-8 text-center">
        <h1 className="text-xl font-bold text-charcoal mb-2">{t('tracking.title', { defaultValue: 'Track order' })}</h1>
        <p className="text-sm text-umber mb-4">Order #{id}</p>
        <p className="text-[12.5px] text-charcoal">{t('tracking.statusPending', { defaultValue: 'Status updates not available yet.' })}</p>
        <div className="mt-6 rounded-xl border border-amber/30 bg-amber/10 px-4 py-3 text-[12.5px] text-amber-800">
          <strong>API unavailable:</strong> Order tracking endpoint (`GET /api/orders/{id}`) is not exposed by the backend yet.
        </div>
      </Card>
    </div>
  )
}
