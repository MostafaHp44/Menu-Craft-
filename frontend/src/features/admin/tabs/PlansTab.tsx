/**
 * Plans Tab — إدارة الباقات للسوبر أدمن
 * إضافة، تعديل، حذف الباقات وعرض عدد المشتركين في كل باقة
 */
import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '../../../shared/i18n'
import { confirmDialog } from '../../../shared/components/dialogs.tsx'
import { Button, Card } from '../../../shared/ui/ui.tsx'
import { PanelHeading, DarkEmpty } from '../parts.tsx'
import { usePlatformStore } from '../../../shared/store/usePlatform.ts'
import PlanPopup, { type PlanFormValues } from '../PlanPopup.tsx'

type IntervalValue = 'month' | 'year' | 'forever'

const INTERVAL_I18N: Record<IntervalValue, string> = {
  month: 'admin.intervalMonth',
  year: 'admin.intervalYear',
  forever: 'admin.intervalForever',
}

export default function PlansTab() {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const plans = usePlatformStore((s) => s.plans)
  const addPlan = usePlatformStore((s) => s.addPlan)
  const updatePlan = usePlatformStore((s) => s.updatePlan)
  const deletePlan = usePlatformStore((s) => s.deletePlan)
  const refreshPlans = usePlatformStore((s) => s.refreshPlans)

  useEffect(() => { refreshPlans() }, [refreshPlans])

  const editing = plans.find((p) => p.id === editingId) ?? null

  /* هوية ثابتة حتى لا يُعاد تهيئة الفورم عند كل إعادة رسم (وإلا اختفى ما يُكتب) */
  const existing = useMemo<PlanFormValues | undefined>(
    () =>
      editing
        ? {
            name: editing.name,
            price: editing.price,
            interval: editing.interval_type,
            maxSites: editing.max_restaurants,
            maxItems: editing.max_menu_items,
            status: editing.is_active ? 'active' : 'inactive',
          }
        : undefined,
    [editing]
  )

  const handleOpen = (planId?: string) => {
    if (planId) setEditingId(planId ?? null)
    else setEditingId(null)
    setOpen(true)
  }

  const handleDelete = async (id: string) => {
    const ok = await confirmDialog({
      title: t('admin.deletePlanTitle', { defaultValue: 'حذف الباقة؟' }),
      message: t('admin.confirmDeletePlan', { defaultValue: 'هل تريد حذف هذه الباقة؟' }),
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
      tone: 'danger',
    })
    if (ok) {
      await deletePlan(id)
    }
  }

  return (
    <div className="space-y-6">
      <PanelHeading
        title={t('admin.plans')}
        description={t('admin.plansDesc', { defaultValue: 'إدارة باقات الاشتراك وإضافة باقات جديدة أو تعديلها أو حذفها.' })}
        actions={
          <Button variant="accent" icon="add" onClick={() => handleOpen()}>
            {t('admin.addPlan', { defaultValue: 'إضافة باقة جديدة' })}
          </Button>
        }
      />

      {/* قائمة الباقات الحالية */}
      <Card className="p-5 border-white/10 bg-smoke">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[12px] uppercase tracking-wider text-ivory/40">
                <th className="pb-3 font-semibold text-ivory">{t('admin.planName', { defaultValue: 'اسم الباقة' })}</th>
                <th className="pb-3 font-semibold text-ivory">{t('admin.planPrice', { defaultValue: 'السعر' })}</th>
                <th className="pb-3 font-semibold text-ivory">{t('admin.planInterval', { defaultValue: 'نوع التجديد' })}</th>
                <th className="pb-3 font-semibold text-ivory">{t('admin.planMaxRestaurants', { defaultValue: 'أقصى مطاعم' })}</th>
                <th className="pb-3 font-semibold text-ivory">{t('admin.planMaxItems', { defaultValue: 'أقصى أصناف' })}</th>
                <th className="pb-3 font-semibold text-ivory text-right">{t('admin.actions', { defaultValue: 'الإجراءات' })}</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr
                  key={plan.id}
                  className="border-b border-white/5 hover:bg-white/5 transition group"
                >
                  <td className="py-4 text-[13.5px] text-ivory/90">{plan.name}</td>
                  <td className="py-4 text-[13.5px] font-mono text-ivory">
                    {plan.price === 0 ? t('admin.free', { defaultValue: 'مجاني' }) : `$${plan.price}${t('common.perMonth')}`}
                  </td>
                  <td className="py-4 text-[13.5px] text-ivory/60">
                    {INTERVAL_I18N[plan.interval_type as IntervalValue]
                      ? t(INTERVAL_I18N[plan.interval_type as IntervalValue])
                      : plan.interval_type}
                  </td>
                  <td className="py-4 text-[13.5px] text-ivory/60">{plan.max_restaurants}</td>
                  <td className="py-4 text-[13.5px] text-ivory/60">
                    {plan.max_menu_items < 0 ? t('admin.unlimited', { defaultValue: 'غير محدود' }) : plan.max_menu_items}
                  </td>
                  <td className="py-4 text-right space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      icon="edit"
                      onClick={() => handleOpen(plan.id)}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      icon="delete"
                      className="text-rose/60 hover:text-rose"
                      onClick={() => handleDelete(plan.id)}
                    />
                  </td>
                </tr>
              ))}
              {plans.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-ivory/40">
                    <DarkEmpty
                      icon="layers"
                      title={t('admin.noPlans', { defaultValue: 'لا توجد باقات' })}
                      message={t('admin.noPlansMsg', { defaultValue: 'ابدأ بإضافة باقة أولى للمنصة.' })}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* إضافة / تعديل باقة */}
      <PlanPopup
        open={open}
        onClose={() => { setOpen(false); setEditingId(null); }}
        existing={existing}
        onSave={async (data) => {
          const payload = {
            name: data.name,
            price: data.price,
            interval_type: data.interval,
            max_restaurants: data.maxSites,
            max_menu_items: data.maxItems,
            is_active: data.status === 'active',
          }
          if (editingId) {
            await updatePlan(editingId, { ...payload, interval_type: payload.interval_type as IntervalValue })
          } else {
            await addPlan({ ...payload, interval_type: payload.interval_type as IntervalValue })
          }
          setOpen(false)
          setEditingId(null)
        }}
      />
    </div>
  )
}

