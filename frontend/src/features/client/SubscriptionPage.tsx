import { Icon } from '../../shared/ui/icons.tsx'
import { Badge, Button, Card, ChoiceCard, EmptyState, Toggle } from '../../shared/ui/ui.tsx'
import { useI18n, type TKey } from '../../shared/i18n'
import { PLANS, SUBSCRIPTIONS } from '../../shared/lib/demoData.ts'
import { publicUrl } from '../../shared/lib/hooks.ts'
import { formatDate, money } from '../../shared/lib/utils.ts'
import { useActiveRestaurant, useStore } from '../../shared/store/useStore.ts'
import { usePlatformStore, useSubscription } from '../../shared/store/usePlatform.ts'
import type { DemoPlanId, SubscriptionStatus } from '../../shared/lib/types.ts'

const STATUS_LABEL: Record<SubscriptionStatus, TKey> = {
  active: 'common.active',
  trialing: 'kitchenMore.statusTrialing',
  past_due: 'kitchenMore.statusPastDue',
  expired: 'subscription.expired',
}

const STATUS_TONE: Record<SubscriptionStatus, 'moss' | 'gold' | 'outline' | 'flame'> = {
  active: 'moss',
  trialing: 'gold',
  past_due: 'outline',
  expired: 'flame',
}

export default function SubscriptionPage() {
  const { t } = useI18n()
  const r = useActiveRestaurant()
  const record = useSubscription(r.id)
  const setPlatformPlan = usePlatformStore((s) => s.setPlan)
  const setAutoRenew = usePlatformStore((s) => s.setAutoRenew)
  const renew = usePlatformStore((s) => s.renew)
  const setRestaurantPlan = useStore((s) => s.setPlan)
  const showToast = useStore((s) => s.showToast)

  const isExpired = record?.status === 'expired'

  const handleAutoRenew = (on: boolean) => {
    if (!record) return
    setAutoRenew(r.id, on)
    showToast({
      title: t('subscription.autoRenew'),
      message: on ? t('subscription.autoRenewOn') : t('subscription.autoRenewOff'),
      tone: on ? 'success' : 'info',
    })
  }

  const handleRenew = () => {
    if (!record) return
    renew(r.id)
    showToast({
      title: t('kitchenMore.renewed'),
      message: t('dashboard.simulatedNote'),
      tone: 'success',
    })
  }

  const selectPlan = (planId: DemoPlanId) => {
    if (!record || record.plan === planId) return
    setPlatformPlan(r.id, planId)
    setRestaurantPlan(planId)
    showToast({
      title: t('kitchenMore.planSwitched'),
      message: t('dashboard.simulatedNote'),
      tone: 'success',
    })
  }

  /* ----------------------------- plan picker ----------------------------- */
  const plansSection = (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <span className="eyebrow">{t('subscription.changePlan')}</span>
          <h3 className="mt-1.5 text-[20px] font-semibold tracking-[-0.01em] text-charcoal sm:text-[22px]">
            {t('subscription.choosePlan')}
          </h3>
          <p className="mt-1 text-[13.5px] text-umber">{t('subscription.choosePlanSub')}</p>
        </div>
        <Badge tone="gold" icon="alert">
          {t('dashboard.demoPlan')}
        </Badge>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent = record?.plan === plan.id
          return (
            <ChoiceCard
              key={plan.id}
              label={plan.name}
              note={plan.blurb}
              active={isCurrent}
              onClick={() => selectPlan(plan.id)}
              preview={
                <span className="block">
                  <span className="flex flex-wrap items-center gap-1.5">
                    {plan.highlight ? (
                      <Badge tone="flame" icon="star">
                        {t('subscription.popular')}
                      </Badge>
                    ) : null}
                    {isCurrent ? (
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
                      <span className="text-[13px] text-umber">{t('common.perMonth')}</span>
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

                  {!isCurrent ? (
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

      <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-sand bg-cream/60 px-4 py-3">
        <Icon name="info" size={16} className="mt-0.5 shrink-0 text-umber" />
        <p className="min-w-0 text-[13px] leading-relaxed text-umber">
          <span className="font-semibold text-espresso">{t('dashboard.demoPlan')}</span>
          {' — '}
          {t('dashboard.simulatedNote')}
        </p>
      </div>
    </section>
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
        {plansSection}
      </div>
    )
  }

  const details = SUBSCRIPTIONS[record.plan]
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
              <Badge tone="neutral">{t('dashboard.demoPlan')}</Badge>
            </div>

            <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="display-serif text-[clamp(26px,3.6vw,38px)] leading-none text-charcoal">
                {details.name}
              </h2>
              <span className="text-[15px] font-medium text-umber">{priceLabel}</span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13.5px] text-umber">
              <span className="flex items-center gap-1.5">
                <Icon name="clock" size={14} className="shrink-0 text-clay" />
                {dateLine}
              </span>
              {isExpired ? null : (
                <span className="flex items-center gap-1.5">
                  <Icon name="refresh" size={14} className="shrink-0 text-clay" />
                  {t('admin.daysLeft', { n: daysLeft })}
                </span>
              )}
            </div>

            <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
              {details.features.map((feature) => (
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
                  {publicUrl(r.slug)}
                </span>
                <Button to="/menu-demo" size="sm" variant="outline" icon="external">
                  {t('common.open')}
                </Button>
              </div>
            </div>
          </div>

          {/* ---------------- auto-renewal + renewal controls ---------------- */}
          <div className="space-y-3.5">
            {isExpired ? (
              <div className="rounded-2xl border border-rose/40 bg-rose/8 p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose text-white">
                    <Icon name="alert" size={17} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold text-charcoal">
                      {t('subscription.expired')}
                    </p>
                    <p className="mt-1 text-[13px] leading-relaxed text-espresso">
                      {t('subscription.expiredHint')}
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
                  variant="danger"
                  icon="refresh"
                  className="mt-4"
                  onClick={handleRenew}
                >
                  {t('subscription.renew')}
                </Button>
              </div>
            ) : null}

            <div className="rounded-2xl border border-sand bg-cream/60 p-4 sm:p-5">
              <Toggle
                checked={record.autoRenew}
                label={t('subscription.autoRenew')}
                description={
                  record.autoRenew ? t('subscription.autoRenewOn') : t('subscription.autoRenewOff')
                }
                onChange={handleAutoRenew}
              />
              {isExpired ? null : (
                <Button
                  full
                  size="lg"
                  variant="dark"
                  icon="refresh"
                  className="mt-4"
                  onClick={handleRenew}
                >
                  {t('subscription.renew')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {plansSection}
    </div>
  )
}
