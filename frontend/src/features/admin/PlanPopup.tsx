import { useEffect, useState } from 'react'
import { useI18n } from '../../shared/i18n'
import { Button, Input, Modal, Select } from '../../shared/ui/ui.tsx'

/** الحقول الفعلية التي تُحفظ في جدول Plans */
export type PlanFormValues = {
  name: string
  price: number
  interval: string
  maxSites: number
  maxItems: number
  status: string
}

/**
 * نافذة إنشاء/تعديل باقة — مبنية على Modal المشترك
 * (نفس بوب أبس التطبيق: × + Escape + خلفية تُغلق بالنقر).
 */
export default function PlanPopup({
  open,
  onClose,
  existing,
  onSave,
}: {
  open: boolean
  onClose: () => void
  existing?: PlanFormValues
  onSave?: (data: PlanFormValues) => Promise<void>
}) {
  const { t } = useI18n()
  const [name, setName] = useState('')
  const [price, setPrice] = useState(0)
  const [interval, setInterval] = useState('month')
  const [maxSites, setMaxSites] = useState(1)
  const [maxItems, setMaxItems] = useState(15)
  const [status, setStatus] = useState('active')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  /* إعادة التهيئة عند الفتح فقط — existing ثابت من useMemo في اللوحة */
  useEffect(() => {
    if (!open) return
    setName(existing?.name ?? '')
    setPrice(existing?.price ?? 0)
    setInterval(existing?.interval ?? 'month')
    setMaxSites(existing?.maxSites ?? 1)
    setMaxItems(existing?.maxItems ?? 15)
    setStatus(existing?.status ?? 'active')
    setError('')
    setSaving(false)
  }, [open, existing])

  const save = async () => {
    if (!name.trim()) {
      setError(t('admin.planForm.nameRequired'))
      return
    }
    if (!onSave) {
      onClose()
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave({
        name: name.trim(),
        price: Number(price) || 0,
        interval,
        maxSites: Number(maxSites) || 0,
        maxItems: Number.isFinite(Number(maxItems)) ? Number(maxItems) : 15,
        status,
      })
      setSaving(false)
    } catch {
      setError(t('admin.planForm.saveFailed'))
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={existing ? t('admin.planForm.editTitle') : t('admin.planForm.createTitle')}
      description={t('admin.planForm.sub')}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <Button variant="accent" loading={saving} onClick={() => void save()}>
            {t('common.save')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-[12.5px] font-medium text-espresso">
              {t('admin.planForm.name')} <span className="text-rose">*</span>
            </span>
            <Input
              value={name}
              placeholder={t('admin.planForm.namePlaceholder')}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[12.5px] font-medium text-espresso">
              {t('admin.planForm.price')}
            </span>
            <Input
              type="number"
              min={0}
              step={1}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[12.5px] font-medium text-espresso">
              {t('admin.planForm.interval')}
            </span>
            <Select value={interval} onChange={(e) => setInterval(e.target.value)}>
              <option value="month">{t('admin.intervalMonth')}</option>
              <option value="year">{t('admin.intervalYear')}</option>
              <option value="forever">{t('admin.intervalForever')}</option>
            </Select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[12.5px] font-medium text-espresso">
              {t('admin.planForm.status')}
            </span>
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="active">{t('admin.planForm.active')}</option>
              <option value="inactive">{t('admin.planForm.inactive')}</option>
            </Select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[12.5px] font-medium text-espresso">
              {t('admin.planForm.maxSites')}
            </span>
            <Input
              type="number"
              min={0}
              value={maxSites}
              onChange={(e) => setMaxSites(Number(e.target.value))}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[12.5px] font-medium text-espresso">
              {t('admin.planForm.maxItems')}
            </span>
            <Input
              type="number"
              min={-1}
              value={maxItems}
              onChange={(e) => setMaxItems(Number(e.target.value))}
            />
          </label>
        </div>

        {error ? <p className="text-[13px] text-rose">{error}</p> : null}
      </div>
    </Modal>
  )
}
