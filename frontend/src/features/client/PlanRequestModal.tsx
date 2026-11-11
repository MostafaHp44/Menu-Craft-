import { useEffect, useState } from 'react'
import { Icon } from '../../shared/ui/icons.tsx'
import { Button, Modal } from '../../shared/ui/ui.tsx'
import { useI18n } from '../../shared/i18n'
import { money } from '../../shared/lib/utils.ts'
import { useStore } from '../../shared/store/useStore.ts'
import { apiFetch } from '../../shared/lib/api.service.ts'

/** صف باقة كما يعود من `GET /api/platform/plans` */
export interface DbPlan {
  id: string
  name: string
  price: number
  currency: string
  interval_type: string
  mode?: 'live' | 'static'
  max_restaurants: number
  max_menu_items: number
  features: string[]
  is_active: boolean | number
}

export function intervalLabel(t: (key: string, vars?: Record<string, string | number>) => string, interval: string): string {
  if (interval === 'month') return t('common.perMonth')
  if (interval === 'year') return t('common.perYear')
  return t('kitchenMore.freeForever')
}

/** مفتاح وصف الوضع — يُستخدم لشرح أثر الطلب على وضع المطعم */
export function modeLabelKey(mode: 'live' | 'static'): string {
  return mode === 'static' ? 'flow.modeStatic' : 'flow.modeLive'
}

/**
 * نموذج طلب الاشتراك/تغيير الباقة (3 خطوات: تأكيد → التفاصيل → إرسال).
 * يُستخدم من تبويب الاشتراك (باقات وضعك الحالي) ومن تبويب تغيير الوضع/الباقة
 * (كل الباقات) — الطلب يذهب إلى Super Admin ولا يتغير شيء قبل الموافقة.
 */
export default function PlanRequestModal({
  plan,
  restaurantId,
  targetMode,
  onClose,
  onSent,
}: {
  plan: DbPlan | null
  restaurantId: string
  /** وضع الباقة المختارة — يظهر تنبيه تغيير الوضع إن كان مختلفاً عن وضعك الحالي */
  targetMode?: 'live' | 'static'
  onClose: () => void
  onSent: (plan: DbPlan) => void
}) {
  const { t } = useI18n()
  const showToast = useStore((s) => s.showToast)
  const [stage, setStage] = useState<'confirm' | 'details' | 'final'>('confirm')
  const [sending, setSending] = useState(false)

  const planKey = plan?.id ?? null
  useEffect(() => {
    setStage('confirm')
    setSending(false)
  }, [planKey])

  const close = () => {
    if (sending) return
    onClose()
  }

  const submitRequest = async () => {
    if (!plan) return
    setSending(true)
    try {
      const headers = { 'Content-Type': 'application/json' }
      if (plan.price === 0) {
        // الباقة المجانية → طلب باقة مجانية
        const data = await apiFetch<{ ok: boolean; error?: string }>('/api/free-plan-requests', {
          method: 'POST',
          headers,
          body: JSON.stringify({ restaurantId }),
        })
        if (data?.ok === false) throw new Error(data?.error || 'Request failed')
      } else {
        // الباقة المدفوعة → طلب اشتراك مدفوع (يُفعَّل الوضع حسب وضع الباقة عند الموافقة)
        const data = await apiFetch<{ ok: boolean; error?: string }>('/api/paid-subscription-requests', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            restaurantId,
            planId: plan.id,
            planName: plan.name,
            price: plan.price,
          }),
        })
        if (data?.ok === false) throw new Error(data?.error || 'Request failed')
      }
      showToast({
        title: t('subscription.confirmSubscribeTitle'),
        message: t('subscription.pendingApprovalBanner', { plan: plan.name }),
        tone: 'success',
      })
      onSent(plan)
      setStage('confirm')
    } catch (err) {
      showToast({
        title: t('common.error'),
        message: err instanceof Error ? err.message : String(err),
        tone: 'error',
      })
    } finally {
      setSending(false)
    }
  }

  const modeChanged = Boolean(plan && targetMode && plan.mode && plan.mode !== targetMode)

  return (
    <>
      {/* الخطوة 1: هل أنت متأكد؟ */}
      <Modal
        open={Boolean(plan) && stage === 'confirm'}
        onClose={close}
        size="sm"
        title={t('subscription.confirmSubscribeTitle')}
        description={plan ? t('subscription.confirmSubscribeSub', { plan: plan.name }) : undefined}
        footer={
          <div className="flex w-full gap-2">
            <Button variant="outline" full onClick={close}>
              {t('common.cancel')}
            </Button>
            <Button variant="accent" full icon="check" onClick={() => setStage('details')}>
              {t('subscription.approve')}
            </Button>
          </div>
        }
      >
        {plan ? (
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-flame/12 text-flame-dark">
              <Icon name="tag" size={24} strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <p className="text-[18px] font-semibold text-charcoal">{plan.name}</p>
              <p className="text-[15px] text-umber">
                {plan.price === 0
                  ? t('kitchenMore.freeForever')
                  : `${money(plan.price)} ${intervalLabel(t, plan.interval_type)}`}
              </p>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* الخطوة 2: السعر والمواصفات */}
      <Modal
        open={Boolean(plan) && stage === 'details'}
        onClose={close}
        size="md"
        title={plan ? t('subscription.planDetailsTitle', { plan: plan.name }) : ''}
        description={t('subscription.planDetailsSub')}
        footer={
          <div className="flex w-full gap-2">
            <Button variant="outline" icon="arrowLeft" onClick={() => setStage('confirm')}>
              {t('common.back')}
            </Button>
            <Button variant="accent" full iconRight="arrowRight" onClick={() => setStage('final')}>
              {t('subscription.approve')}
            </Button>
          </div>
        }
      >
        {plan ? (
          <div>
            <dl className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-sand bg-cream/60 p-3.5">
                <dt className="text-[11px] uppercase tracking-wide text-clay">{t('subscription.price')}</dt>
                <dd className="mt-1 text-[20px] font-semibold leading-none text-charcoal">
                  {plan.price === 0
                    ? t('kitchenMore.freeForever')
                    : `${money(plan.price)}${intervalLabel(t, plan.interval_type)}`}
                </dd>
              </div>
              <div className="rounded-2xl border border-sand bg-cream/60 p-3.5">
                <dt className="text-[11px] uppercase tracking-wide text-clay">{t('subscription.maxSites')}</dt>
                <dd className="mt-1 text-[20px] font-semibold leading-none text-charcoal">
                  {plan.max_restaurants === -1 ? '∞' : plan.max_restaurants}
                </dd>
              </div>
              <div className="rounded-2xl border border-sand bg-cream/60 p-3.5">
                <dt className="text-[11px] uppercase tracking-wide text-clay">{t('subscription.maxItems')}</dt>
                <dd className="mt-1 text-[20px] font-semibold leading-none text-charcoal">
                  {plan.max_menu_items === -1 ? '∞' : plan.max_menu_items}
                </dd>
              </div>
              <div className="rounded-2xl border border-sand bg-cream/60 p-3.5">
                <dt className="text-[11px] uppercase tracking-wide text-clay">{t('subscription.intervalType')}</dt>
                <dd className="mt-1 text-[16px] font-semibold leading-tight text-charcoal">
                  {intervalLabel(t, plan.interval_type)}
                </dd>
              </div>
            </dl>

            {modeChanged && targetMode ? (
              <div className="mt-3 rounded-2xl border border-sun/50 bg-sun/10 px-4 py-3 text-[13px] leading-relaxed text-espresso">
                <span className="font-semibold text-charcoal">
                  {t('subscription.modeChangeTitle', { mode: t(modeLabelKey(targetMode)) })}
                </span>{' '}
                {t('subscription.modeChangeSub', { mode: t(modeLabelKey(targetMode)) })}
              </div>
            ) : null}

            <ul className="mt-4 space-y-2">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-[13px] leading-snug text-espresso">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-moss/15 text-moss">
                    <Icon name="check" size={11} strokeWidth={3} />
                  </span>
                  <span className="min-w-0">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Modal>

      {/* الخطوة 3: تأكيد إرسال الطلب — لا يتغير شيء قبل موافقة Super Admin */}
      <Modal
        open={Boolean(plan) && stage === 'final'}
        onClose={close}
        size="md"
        title={t('subscription.finalStepTitle')}
        description={t('subscription.finalStepSub')}
        footer={
          <div className="flex w-full gap-2">
            <Button variant="outline" icon="arrowLeft" onClick={() => setStage('details')} disabled={sending}>
              {t('common.back')}
            </Button>
            <Button variant="danger" full loading={sending} icon="clock" onClick={submitRequest}>
              {t('subscription.finalApprove')}
            </Button>
          </div>
        }
      >
        <div className="rounded-2xl border border-sun/50 bg-sun/10 px-4 py-3 text-center">
          <Icon name="alert" size={22} strokeWidth={2.2} className="mx-auto text-sun" />
          <p className="mt-2 text-[12px] leading-relaxed text-espresso">{t('subscription.finalStepSub')}</p>
          {modeChanged && targetMode ? (
            <p className="mt-2 text-[12px] font-semibold leading-relaxed text-charcoal">
              {t('subscription.modeChangeSub', { mode: t(modeLabelKey(targetMode)) })}
            </p>
          ) : null}
        </div>
      </Modal>
    </>
  )
}
