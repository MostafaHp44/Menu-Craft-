import { Card } from '../../shared/ui/ui.tsx'
import { useI18n } from '../../shared/i18n'

export default function KitchenNotesPage() {
  const { t } = useI18n()
  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <Card className="p-8">
        <h1 className="text-xl font-bold text-charcoal mb-2">{t('kitchenNotes.title', { defaultValue: 'Kitchen notes & priorities' })}</h1>
        <p className="text-sm text-umber">{t('kitchenNotes.sub', { defaultValue: 'Add preparation notes and set priority levels.' })}</p>
        <div className="mt-6 rounded-xl border border-amber/30 bg-amber/10 px-4 py-3 text-[12.5px] text-amber-800">
          <strong>API unavailable:</strong> Kitchen notes/priorities endpoint (PATCH /api/orders/ORDER_ID/notes) is not exposed by the backend yet.
        </div>
      </Card>
    </div>
  )
}
