import { Card } from '../../shared/ui/ui.tsx'
import { useI18n } from '../../shared/i18n'

export default function ManualOrderPage() {
  const { t } = useI18n()
  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <Card className="p-8">
        <h1 className="text-xl font-bold text-charcoal mb-2">{t('manual.title', { defaultValue: 'Manual order' })}</h1>
        <p className="text-sm text-umber">{t('manual.sub', { defaultValue: 'Create manual orders for customers.' })}</p>
        <div className="mt-6 rounded-xl border border-amber/30 bg-amber/10 px-4 py-3 text-[12.5px] text-amber-800">
          <strong>API unavailable:</strong> Manual order endpoint (`POST /api/orders/manual`) is not exposed by the backend yet.
        </div>
      </Card>
    </div>
  )
}
