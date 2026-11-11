import { useEffect, useState } from 'react'
import { Icon } from '../../shared/ui/icons.tsx'
import { Badge, Button, Card, ChoiceCard } from '../../shared/ui/ui.tsx'
import { useI18n } from '../../shared/i18n'
import { money } from '../../shared/lib/utils.ts'
import { useStore } from '../../shared/store/useStore.ts'
import { useBackendAuth } from '../../shared/store/useBackendAuth.ts'
import { usePlatformStore, useSubscription } from '../../shared/store/usePlatform.ts'
import { billingAPI, apiFetch } from '../../shared/lib/api.service.ts'
import PlanRequestModal, { intervalLabel, type DbPlan } from './PlanRequestModal.tsx'

type Mode = 'live' | 'static'

const normalize = (v: string) => v.toLowerCase().replace(/[^a-z0-9]/g, '')

/**
 * تبويب منفصل في الداشبورد: تغيير الوضع/الباقة.
 * المستخدم يختار الباقة التي يريد الانتقال إليها (من أي وضع) → يُرسل طلب إلى
 * Super Admin → لا يتغيّر شيء قبل الموافقة (الوضع يتبع وضع الباقة المختارة).
 */
export default function ChangePlanPage() {
  const { t } = useI18n()
  const restaurantId = useBackendAuth(
    (s) => s.user?.restaurant_id || s.user?.restaurantId || ''
  )
  const rawMode = useBackendAuth((s) => s.user?.mode)
  const userMode: Mode = rawMode === 'static' ? 'static' : 'live'
  const record = useSubscription(restaurantId)
  const fetchSubscription = usePlatformStore((s) => s.fetchSubscription)
  const showToast = useStore((s) => s.showToast)

  const [plans, setPlans] = useState<DbPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [modalPlan, setModalPlan] = useState<DbPlan | null>(null)
  const [pending, setPending] = useState<{ planName: string } | null>(null)
  const [blocked, setBlocked] = useState(false)

  useEffect(() => {
    let alive = true
    billingAPI
      .listPlans()
      .then((res) => {
        if (!alive) return
        const rows = Array.isArray(res?.data) ? res.data : []
        setPlans(
          rows.filter(
            (p: any) => String(p?.is_active) === '1' || p?.is_active === true
          ) as DbPlan[]
        )
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  /* طلب قائم بالفعل؟ نمنع إرسال طلب آخر حتى تصل النتيجة */
  useEffect(() => {
    if (!restaurantId) return
    let alive = true
    apiFetch<{ ok: boolean; data?: Array<{ plan_name?: string; status?: string }> }>(
      '/api/paid-subscription-requests'
    )
      .then((res) => {
        if (!alive) return
        const row = (res?.data || []).find(
          (r) => String(r?.status) === 'pending_payment'
        )
        if (row) {
          setPending({ planName: row.plan_name || '' })
          setBlocked(true)
        }
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [restaurantId])

  const currentPlanKey = record?.plan ? String(record.plan) : ''
  /** اسم الباقة للعرض: نطابق المفتاح القادم من القاعدة (professional) مع اسم الباقة (Professional) */
  const currentPlanName = currentPlanKey
    ? plans.find((p) => normalize(p.name) === normalize(currentPlanKey))?.name ||
      currentPlanKey.charAt(0).toUpperCase() + currentPlanKey.slice(1)
    : ''
  const isCurrent = (plan: DbPlan) =>
    Boolean(currentPlanName) && normalize(currentPlanName) === normalize(plan.name)

  const sameMode = plans.filter((p) => (p.mode || 'live') === userMode)
  const otherMode = plans.filter((p) => (p.mode || 'live') !== userMode)

  const renderGrid = (list: DbPlan[]) => (
    <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {list.map((plan) => {
        const current = isCurrent(plan)
        const planMode: Mode = plan.mode === 'static' ? 'static' : 'live'
        const willSwitch = planMode !== userMode
        return (
          <ChoiceCard
            key={plan.id}
            label={plan.name}
            note={`${intervalLabel(t, plan.interval_type)}${
              plan.price > 0 ? ` · ${money(plan.price)}` : ''
            }`}
            active={current}
            onClick={() => {
              if (blocked || current) return
              setModalPlan(plan)
            }}
            preview={
              <span className="block">
                <span className="flex flex-wrap items-center gap-1.5">
                  <Badge tone={planMode === 'static' ? 'outline' : 'moss'} icon={planMode === 'static' ? 'palette' : 'activity'}>
                    {t(planMode === 'static' ? 'flow.modeStatic' : 'flow.modeLive')}
                  </Badge>
                  {willSwitch ? (
                    <Badge tone="gold" icon="refresh">
                      {t('subscription.modeChangeTitle', {
                        mode: t(planMode === 'static' ? 'flow.modeStatic' : 'flow.modeLive'),
                      })}
                    </Badge>
                  ) : null}
                  {current ? (
                    <Badge tone="moss" icon="check">
                      {t('subscription.current')}
                    </Badge>
                  ) : null}
                </span>

                <span className="mt-2.5 flex items-baseline gap-1.5">
                  <span className="text-[27px] font-semibold leading-none tracking-[-0.02em] text-charcoal">
                    {plan.price === 0 ? t('kitchenMore.freeForever') : money(plan.price)}
                  </span>
                  {plan.price > 0 ? (
                    <span className="text-[13px] text-umber">
                      {intervalLabel(t, plan.interval_type)}
                    </span>
                  ) : null}
                </span>

                <span className="mt-3 block space-y-1.5">
                  {plan.features.map((feature) => (
                    <span
                      key={feature}
                      className="flex items-start gap-1.5 text-[12.5px] leading-snug text-espresso"
                    >
                      <Icon
                        name="check"
                        size={13}
                        strokeWidth={2.4}
                        className="mt-0.5 shrink-0 text-moss"
                      />
                      <span className="min-w-0">{feature}</span>
                    </span>
                  ))}
                </span>

                <span className="mt-3 block text-[12px] text-umber">
                  {t('subscription.maxSites')}: {plan.max_restaurants === -1 ? '∞' : plan.max_restaurants}
                  {' · '}
                  {t('subscription.maxItems')}: {plan.max_menu_items === -1 ? '∞' : plan.max_menu_items}
                </span>

                {!current ? (
                  <span className="mt-3 block text-[12.5px] font-semibold text-flame-dark">
                    {t('subscription.choose')}
                  </span>
                ) : null}
              </span>
            }
          />
        )
      })}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* ------------------------- header + current state ------------------------ */}
      <Card className="p-5 sm:p-6">
        <span className="eyebrow">{t('subscription.changeModeTitle')}</span>
        <h2 className="mt-1.5 text-[22px] font-semibold tracking-[-0.01em] text-charcoal">
          {t('subscription.changeModeSub')}
        </h2>

        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <span className="text-[13px] text-umber">{t('subscription.currentMode')}:</span>
          <Badge tone={userMode === 'static' ? 'outline' : 'moss'} icon={userMode === 'static' ? 'palette' : 'activity'}>
            {t(userMode === 'static' ? 'flow.modeStatic' : 'flow.modeLive')}
          </Badge>
          <span className="text-[13px] text-umber">·</span>
          <span className="text-[13px] text-umber">{t('subscription.currentPlan')}:</span>
          <Badge tone="flame" icon="tag">
            {currentPlanName || '—'}
          </Badge>
        </div>

        <p className="mt-3 flex items-start gap-1.5 text-[12.5px] leading-relaxed text-clay">
          <Icon name="info" size={14} className="mt-0.5 shrink-0" />
          {t('subscription.switchModeHint')}
        </p>
      </Card>

      {pending ? (
        <div className="flex items-start gap-3 rounded-2xl border border-sun/50 bg-sun/10 px-5 py-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sun text-ink">
            <Icon name="alert" size={16} strokeWidth={2.4} />
          </span>
          <p className="min-w-0 text-[13.5px] leading-relaxed text-espresso">
            {t('subscription.pendingChangeBanner', {
              plan: pending.planName || t('subscription.changePlan'),
            })}
          </p>
        </div>
      ) : null}

      {loading ? (
        <Card className="p-6 text-center text-[13.5px] text-umber">{t('branches.loading')}</Card>
      ) : plans.length === 0 ? (
        <Card className="p-6 text-center text-[13.5px] text-umber">{t('common.error')}</Card>
      ) : (
        <>
          <section>
            <div className="min-w-0">
              <span className="eyebrow">{t('subscription.currentModePlans')}</span>
              <h3 className="mt-1.5 text-[20px] font-semibold tracking-[-0.01em] text-charcoal sm:text-[22px]">
                {t('subscription.currentModePlansOnly', {
                  mode: t(userMode === 'static' ? 'flow.modeStatic' : 'flow.modeLive'),
                })}
              </h3>
            </div>
            {renderGrid(sameMode)}
          </section>

          <section>
            <div className="min-w-0">
              <span className="eyebrow">{t('subscription.otherModePlans')}</span>
              <h3 className="mt-1.5 text-[20px] font-semibold tracking-[-0.01em] text-charcoal sm:text-[22px]">
                {t('subscription.modeChangeTitle', {
                  mode: t(userMode === 'static' ? 'flow.modeLive' : 'flow.modeStatic'),
                })}
              </h3>
              <p className="mt-1 text-[13.5px] text-umber">
                {t('subscription.modeChangeSub', {
                  mode: t(userMode === 'static' ? 'flow.modeLive' : 'flow.modeStatic'),
                })}
              </p>
            </div>
            {renderGrid(otherMode)}
          </section>

          <div className="flex flex-wrap gap-2">
            <Button to="/dashboard/subscription" variant="outline" icon="tag">
              {t('dashboard.subscription')}
            </Button>
            <Button to="/" variant="outline" icon="home">
              {t('dashboard.home')}
            </Button>
          </div>
        </>
      )}

      <PlanRequestModal
        plan={modalPlan}
        restaurantId={restaurantId}
        targetMode={userMode}
        onClose={() => setModalPlan(null)}
        onSent={(plan) => {
          setPending({ planName: plan.name })
          setBlocked(true)
          setModalPlan(null)
          showToast({
            title: t('subscription.changeModeTitle'),
            message: t('subscription.pendingChangeBanner', { plan: plan.name }),
            tone: 'success',
          })
          fetchSubscription(restaurantId).catch(() => {})
        }}
      />
    </div>
  )
}
