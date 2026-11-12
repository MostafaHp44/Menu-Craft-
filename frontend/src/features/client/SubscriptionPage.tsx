import { useEffect, useState } from 'react'
import { Icon } from '../../shared/ui/icons.tsx'
import { Badge, Button, Card, ChoiceCard, EmptyState, Toggle } from '../../shared/ui/ui.tsx'
import { useI18n, type TKey } from '../../shared/i18n'
import { SUBSCRIPTIONS } from '../../shared/lib/demoData.ts'
import { publicUrl } from '../../shared/lib/hooks.ts'
import { formatDate, money } from '../../shared/lib/utils.ts'
import { useActiveRestaurant, useStore } from '../../shared/store/useStore.ts'
import { useBackendAuth } from '../../shared/store/useBackendAuth.ts'
import { usePlatformStore, useSubscription } from '../../shared/store/usePlatform.ts'
import { billingAPI, apiFetch } from '../../shared/lib/api.service.ts'
import type { SubscriptionStatus } from '../../shared/lib/types.ts'
import { isSubscriptionSuspended } from '../../shared/lib/types.ts'
import PlanRequestModal, { intervalLabel, type DbPlan } from './PlanRequestModal.tsx'

const STATUS_LABEL: Record<SubscriptionStatus, TKey> = {
  active: 'common.active',
  trialing: 'kitchenMore.statusTrialing',
  past_due: 'kitchenMore.statusPastDue',
  expired: 'subscription.expired',
  cancelled: 'subscription.cancelled',
}

const STATUS_TONE: Record<SubscriptionStatus, 'moss' | 'gold' | 'outline' | 'flame'> = {
  active: 'moss',
  trialing: 'gold',
  past_due: 'outline',
  expired: 'flame',
  cancelled: 'flame',
}

export default function SubscriptionPage() {
  const { t } = useI18n()
  const r = useActiveRestaurant()
  const backendRid = useBackendAuth((s) => s.user?.restaurant_id || s.user?.restaurantId || '')
  // وضع المطعم الحالي — تبويب الاشتراك يعرض باقات وضعه فقط
  const userMode = useBackendAuth((s) => s.user?.mode)
  // المصدر الحقيقي دائمًا: المطعم المرتبط بجلسة الباك إند — لا نستخدم مطعم الديمو
  const restaurantId = backendRid || r.id
  const [siteSlug, setSiteSlug] = useState<string>('')
  const restaurantSlug = siteSlug || (backendRid && backendRid !== r.id ? backendRid : r.slug)
  const record = useSubscription(restaurantId)
  const setAutoRenew = usePlatformStore((s) => s.setAutoRenew)
  const refreshPlans = usePlatformStore((s) => s.refreshPlans)
  const fetchSubscription = usePlatformStore((s) => s.fetchSubscription)
  const showToast = useStore((s) => s.showToast)

  // مزامنة سجل الاشتراك من قاعدة البيانات (وليس من لقطة الديمو المحفوظة محلياً)
  useEffect(() => {
    if (restaurantId) void fetchSubscription(restaurantId)
  }, [restaurantId, fetchSubscription])

  // جلب الـ slug الحقيقي من /api/sites لعرض الرابط الصحيح
  useEffect(() => {
    if (!restaurantId) return
    let alive = true
    apiFetch<{ ok: boolean; data?: Array<{ id?: string; slug?: string }> }>('/api/sites')
      .then((p) => {
        if (!alive) return
        const match = (p?.data || []).find((site) => String(site.id) === String(restaurantId))
        if (match?.slug) setSiteSlug(String(match.slug))
      })
      .catch(() => {})
    return () => { alive = false }
  }, [restaurantId])

  const isExpired = record?.status === 'expired'
  const isCancelled = record?.status === 'cancelled'
  const isSuspended = isSubscriptionSuspended(record?.status)

  /* -------------- real plans from the DB (source of truth) -------------- */
  const [plans, setPlans] = useState<DbPlan[]>([])
  const [allPlans, setAllPlans] = useState<DbPlan[]>([])
  const [plansLoading, setPlansLoading] = useState(true)
  const [plansError, setPlansError] = useState(false)

  useEffect(() => {
    let alive = true
    billingAPI
      .listPlans()
      .then((res) => {
        if (!alive) return
        const rows = Array.isArray(res?.data) ? res.data : []
        const active = rows.filter((p: any) => String(p?.is_active) === '1' || p?.is_active === true)
        setAllPlans(active)
        setPlans(active)
      })
      .catch(() => {
        if (!alive) return
        setPlansError(true)
        // Fall back to the store-wide plans refresh (Plan API) if direct call fails
        refreshPlans().catch(() => {})
      })
      .finally(() => {
        if (alive) setPlansLoading(false)
      })
    return () => { alive = false }
  }, [refreshPlans])

  /* تبويب الاشتراك: باقات وضع المطعم الحالي فقط (static ↔ live منفصلتان) */
  useEffect(() => {
    const mode = userMode === 'static' || userMode === 'live' ? userMode : null
    if (!mode) { setPlans(allPlans); return }
    const sameMode = allPlans.filter((p) => (p.mode || 'live') === mode)
    setPlans(sameMode.length ? sameMode : allPlans)
  }, [allPlans, userMode])

  const handleAutoRenew = (on: boolean) => {
    if (!record) return
    setAutoRenew(restaurantId, on)
    showToast({
      title: t('subscription.autoRenew'),
      message: on ? t('subscription.autoRenewOn') : t('subscription.autoRenewOff'),
      tone: on ? 'success' : 'info',
    })
  }

  /* لا زر تجديد ذاتي للعميل: الـ PATCH خاص بالسوبر أدمن فقط (كان يرجع 403
     بصمت مع توست نجاح كاذب). التجديد يتم من لوحة السوبر أدمن بزرار
     «جدّد شهر» بعد تحصيل الفلوس — هنا رسالة إرشاد للتواصل مع الممثّل. */

  /* ---------------- 3-step subscription request flow (shared modal) ------ */
  const [modalPlan, setModalPlan] = useState<DbPlan | null>(null)
  const [pendingRequest, setPendingRequest] = useState<{ planName: string } | null>(null)

  const openFlow = (plan: DbPlan) => setModalPlan(plan)
  const closeFlow = () => setModalPlan(null)

  /** المطابقة تتم بعد تجريد المسافات/الرموز: 'staticplus' ≡ 'Static Plus' */
  const normalize = (v: string) => v.toLowerCase().replace(/[^a-z0-9]/g, '')
  const isCurrent = (plan: DbPlan) =>
    Boolean(record?.plan) && normalize(String(record!.plan)) === normalize(plan.name)

  // When admin has cancelled the subscription, this opens the 3-step
  // subscription request flow for the FIRST available plan so the user can
  // quickly choose and then select their preferred plan from the picker below.
  const openReSubscribe = () => {
    if (!plans.length) return
    openFlow(plans[0])
  }

  /* ----------------------------- plan picker ----------------------------- */
  const planPicker = (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <span className="eyebrow">{t('subscription.changePlan')}</span>
          <h3 className="mt-1.5 text-[20px] font-semibold tracking-[-0.01em] text-charcoal sm:text-[22px]">
            {t('subscription.choosePlan')}
          </h3>
          <p className="mt-1 text-[13.5px] text-umber">{t('subscription.choosePlanSub')}</p>
        </div>
        <Button to="/dashboard/change-plan" variant="outline" size="sm" icon="refresh">
          {t('dashboard.changePlan')}
        </Button>
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-[12.5px] text-clay">
        <Icon name="info" size={14} className="shrink-0" />
        {t('subscription.currentModePlansOnly', {
          mode: t(userMode === 'static' ? 'flow.modeStatic' : 'flow.modeLive'),
        })}
      </p>

      {plansLoading ? (
        <Card className="mt-4 p-6 text-center text-[13.5px] text-umber">
          {t('branches.loading')}
        </Card>
      ) : plans.length === 0 ? (
        <Card className="mt-4 p-6 text-center">
          <Icon name="tag" size={28} className="mx-auto text-clay" />
          <p className="mt-2 text-[15px] font-semibold text-charcoal">{t('subscription.choosePlan')}</p>
          <p className="mt-1 text-[13px] text-umber">{plansError ? t('common.error') : '—'}</p>
        </Card>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => {
            const popular = plan.name.toLowerCase() === 'professional'
            const current = isCurrent(plan)
            const blocked = Boolean(pendingRequest)
            return (
              <ChoiceCard
                key={plan.id}
                label={plan.name}
                note={intervalLabel(t, plan.interval_type)}
                active={current}
                onClick={() => {
                  if (blocked || current) return
                  openFlow(plan)
                }}
                preview={
                  <span className="block">
                    <span className="flex flex-wrap items-center gap-1.5">
                      {popular ? (
                        <Badge tone="flame" icon="star">
                          {t('subscription.popular')}
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
                        <span className="text-[13px] text-umber">{intervalLabel(t, plan.interval_type)}</span>
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
      )}
    </section>
  )

  const pendingBanner = pendingRequest ? (
    <div className="flex items-start gap-3 rounded-2xl border border-sun/50 bg-sun/10 px-5 py-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sun text-ink">
        <Icon name="alert" size={16} strokeWidth={2.4} />
      </span>
      <p className="min-w-0 text-[13.5px] leading-relaxed text-espresso">
        {t('subscription.pendingApprovalBanner', { plan: pendingRequest.planName })}
      </p>
    </div>
  ) : null

  /* ---------------- 3-step modal (shared component) ---------------- */
  const flowModal = (
    <PlanRequestModal
      plan={modalPlan}
      restaurantId={restaurantId}
      targetMode={userMode === 'static' || userMode === 'live' ? userMode : undefined}
      onClose={closeFlow}
      onSent={(plan) => {
        setPendingRequest({ planName: plan.name })
        setModalPlan(null)
        fetchSubscription(restaurantId).catch(() => {})
      }}
    />
  )

  /* ------------------- no subscription record at all -------------------- */
  if (!record) {
    return (
      <div className="space-y-6">
        <EmptyState
          icon="tag"
          title={t('subscription.choosePlan')}
          message={t('subscription.choosePlanSub')}
        />
        {pendingBanner}
        {planPicker}
        {flowModal}
      </div>
    )
  }

  const details = SUBSCRIPTIONS[record.plan as keyof typeof SUBSCRIPTIONS]
  // الباقة قد تكون واحدة من الست الجديد غير المعرّفة في بيانات العرض — نكمل من قائمة الباقات
  const dbPlan = allPlans.find(
    (p) => p.name.toLowerCase().replace(/[^a-z0-9]/g, '') === String(record.plan).toLowerCase().replace(/[^a-z0-9]/g, '')
  )
  const heroName = details?.name ?? dbPlan?.name ?? record.plan
  const heroFeatures = details?.features ?? dbPlan?.features ?? []
  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(record.renewsAt).getTime() - Date.now()) / 86_400_000)
  )
  const priceLabel =
    record.plan === 'trial'
      ? t('kitchenMore.trialPrice')
      : record.price === 0
        ? t('kitchenMore.freeForever')
        : `${money(record.price)} ${t('common.perMonth')}`
  const dateLine = isExpired
    ? t('subscription.endsOn', { date: formatDate(record.renewsAt) })
    : t('subscription.renewsOn', { date: formatDate(record.renewsAt) })

  return (
    <div className="space-y-6">
      {/* ------------------------- current plan hero ------------------------ */}
      <Card className="overflow-hidden">
        <div className="grid gap-6 p-5 sm:p-6 xl:grid-cols-[1.4fr_1fr] xl:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="eyebrow">{t('subscription.currentPlan')}</span>
              <Badge
                tone={STATUS_TONE[record.status]}
                icon={
                  record.status === 'active'
                    ? 'check'
                    : record.status === 'trialing'
                      ? 'clock'
                      : 'alert'
                }
              >
                {t(STATUS_LABEL[record.status])}
              </Badge>
            </div>

            <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="display-serif text-[clamp(26px,3.6vw,38px)] leading-none text-charcoal">
                {heroName}
              </h2>
              <span className="text-[15px] font-medium text-umber">{priceLabel}</span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13.5px] text-umber">
              <span className="flex items-center gap-1.5">
                <Icon name="clock" size={14} className="shrink-0 text-clay" />
                {dateLine}
              </span>
              {isSuspended ? null : (
                <span className="flex items-center gap-1.5">
                  <Icon name="refresh" size={14} className="shrink-0 text-clay" />
                  {t('admin.daysLeft', { n: daysLeft })}
                </span>
              )}
            </div>

            <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
              {heroFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-1.5 text-[13px] text-espresso">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-moss/15 text-moss">
                    <Icon name="check" size={11} strokeWidth={3} />
                  </span>
                  <span className="min-w-0">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-4 rounded-xl border border-sand bg-cream/60 px-3.5 py-3">
              <span className="block text-[11px] text-clay">{t('editor.publicAddress')}</span>
              <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                <span className="min-w-0 truncate font-mono text-[14px] font-medium text-charcoal">
                  {publicUrl(restaurantSlug)}
                </span>
                <Button to="/menu-demo" size="sm" variant="outline" icon="external">
                  {t('common.open')}
                </Button>
              </div>
            </div>
          </div>

          {/* ---------------- auto-renewal + renewal controls ---------------- */}
          <div className="space-y-3.5">
            {isSuspended ? (
              <div className="rounded-2xl border border-rose/40 bg-rose/8 p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose text-white">
                    <Icon name="alert" size={17} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold text-charcoal">
                      {isCancelled ? t('subscription.cancelled') : t('subscription.expired')}
                    </p>
                    <p className="mt-1 text-[13px] leading-relaxed text-espresso">
                      {isCancelled ? t('subscription.cancelledHint') : t('subscription.expiredHint')}
                    </p>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-umber">
                      {t('kitchenMore.pausedNote')}
                    </p>
                    <p className="mt-1.5 text-[12px] leading-relaxed text-clay">
                      {t('kitchenMore.renewHint')}
                    </p>
                  </div>
                </div>
                <Button
                  full
                  size="lg"
                  variant={isCancelled ? 'danger' : 'dark'}
                  icon={isCancelled ? 'arrowRight' : 'refresh'}
                  className="mt-4"
                  onClick={openReSubscribe}
                >
                  {isCancelled ? t('subscription.choosePlan') : t('subscription.renew')}
                </Button>
              </div>
            ) : null}

            {(!isSuspended || isExpired) ? (
              <div className="rounded-2xl border border-sand bg-cream/60 p-4 sm:p-5">
                <Toggle
                  checked={record.autoRenew}
                  label={t('subscription.autoRenew')}
                  description={
                    record.autoRenew ? t('subscription.autoRenewOn') : t('subscription.autoRenewOff')
                  }
                  onChange={handleAutoRenew}
                />
                <div className="mt-4 rounded-xl border border-sand bg-paper p-3.5 text-center">
                  <p className="text-[13px] font-semibold text-charcoal">{t('subscription.renewContact')}</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-umber">{t('subscription.renewContactSub')}</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </Card>

      {pendingBanner}
      {planPicker}
      {flowModal}
    </div>
  )
}
