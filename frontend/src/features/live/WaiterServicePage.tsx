import { Card } from '../../shared/ui/ui.tsx'
import { useI18n } from '../../shared/i18n'

export default function WaiterServicePage() {
  const { t } = useI18n()
  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <Card className="p-8">
        <h1 className="text-xl font-bold text-charcoal mb-2">{t('waiterService.title', { defaultValue: 'Waiter service actions' })}</h1>
        <p className="text-sm text-umber">{t('waiterService.sub', { defaultValue: 'Accept service, mark served, and complete orders.' })}</p>
        <div className="mt-6 rounded-xl border border-amber/30 bg-amber/10 px-4 py-3 text-[12.5px] text-amber-800">
          <strong>API unavailable:</strong> Waiter service endpoint (PATCH /api/orders/ORDER_ID/service) is not exposed by the backend yet.
        </div>
      </Card>
    </div>
  )
}
