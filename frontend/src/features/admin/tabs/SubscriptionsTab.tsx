import { useI18n } from '../../../shared/i18n'
import { Button, StatCard } from '../../../shared/ui/ui.tsx'
import { usePlatformStore } from '../../../shared/store/usePlatform.ts'
import { useStore } from '../../../shared/store/useStore.ts'
import { publicUrl } from '../../../shared/lib/hooks.ts'
import { formatDate, money } from '../../../shared/lib/utils.ts'
import type { SubscriptionRecord } from '../../../shared/lib/types.ts'
import {
  DarkEmpty,
  DemoNote,
  Panel,
  PanelHeading,
  PaddedToggle,
  PlanBadge,
  SubscriptionStatusBadge,
} from '../parts.tsx'

function daysLeft(renewsAt: string): number {
  const diff = new Date(renewsAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / 86_400_000))
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/4 px-3.5 py-3">
      <div className="text-[11px] uppercase tracking-[0.12em] text-ivory/40">{label}</div>
      <div className="mt-1 text-[13px] font-medium text-ivory">{value}</div>
    </div>
  )
}

export default function SubscriptionsTab() {
  const { t } = useI18n()
  const restaurants = useStore((s) => s.restaurants)
  const subscriptions = usePlatformStore((s) => s.subscriptions)
  const setAutoRenew = usePlatformStore((s) => s.setAutoRenew)
  const renew = usePlatformStore((s) => s.renew)
  const expire = usePlatformStore((s) => s.expire)

  const count = (status: SubscriptionRecord['status']) =>
    subscriptions.filter((s) => s.status === status).length

  const activeCount = count('active')
  const trialingCount = count('trialing')
  const expiredCount = count('expired')

  return (
    <div className="space-y-5">
      {/* summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard tone="dark" label={t('common.active')} value={String(activeCount)} icon="check" />
        <StatCard
          tone="dark"
          label={t('platformMore.subs.trialing')}
          value={String(trialingCount)}
          icon="clock"
        />
        <StatCard
          tone="dark"
          label={t('platformMore.subs.expired')}
          value={String(expiredCount)}
          icon="alert"
        />
      </div>

      <DemoNote>{t('admin.autoRenewalHint')}</DemoNote>

      <Panel>
        <PanelHeading
          title={t('admin.subscriptions')}
          description={t('platformMore.subs.demoNote')}
        />

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {restaurants.map((restaurant) => {
            const sub = subscriptions.find((s) => s.restaurantId === restaurant.id)
            if (!sub) {
              return (
                <div
                  key={restaurant.id}
                  className="rounded-2xl border border-white/10 bg-white/4 p-4 sm:p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="text-[14px] font-semibold text-ivory">{restaurant.name}</h4>
                      <p className="mt-0.5 break-all font-mono text-[11.5px] text-ivory/45">
                        {publicUrl(restaurant.slug)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <DarkEmpty
                      icon="card"
                      title={t('platformMore.subs.missingSub')}
                      message={t('platformMore.subs.missingSubHint')}
                    />
                  </div>
                </div>
              )
            }

            const expired = sub.status === 'expired'
            const left = daysLeft(sub.renewsAt)
            const showDays = !expired && left > 0

            return (
              <div key={restaurant.id} className="rounded-2xl border border-white/10 bg-white/4 p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="text-[14px] font-semibold text-ivory">{restaurant.name}</h4>
                    <p className="mt-0.5 break-all font-mono text-[11.5px] text-ivory/45">
                      {publicUrl(restaurant.slug)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <PlanBadge plan={sub.plan} />
                    <SubscriptionStatusBadge status={sub.status} />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2.5">
                  <InfoCell
                    label={expired ? t('admin.expires') : t('admin.renews')}
                    value={formatDate(sub.renewsAt)}
                  />
                  <InfoCell
                    label={t('subscription.currentPlan')}
                    value={
                      sub.price > 0
                        ? `${money(sub.price)} ${t('common.perMonth')}`
                        : money(sub.price)
                    }
                  />
                </div>

                {showDays ? (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/6 px-3 py-1.5 text-[12px] font-medium text-ivory/75">
                    <span className="h-1.5 w-1.5 rounded-full bg-flame" />
                    {t('admin.daysLeft', { n: left })}
                  </div>
                ) : null}

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/8 bg-white/4 px-4">
                  <PaddedToggle
                    checked={sub.autoRenew}
                    onChange={(next) => setAutoRenew(restaurant.id, next)}
                    label={t('common.autoRenew')}
                    description={sub.autoRenew ? t('common.on') : t('common.off')}
                  />
                </div>

                <div className="mt-3.5 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    className="h-10"
                    variant="accent"
                    icon="refresh"
                    onClick={() => renew(restaurant.id)}
                  >
                    {t('subscription.renew')}
                  </Button>
                  <Button
                    size="sm"
                    className="h-10"
                    variant="light"
                    icon="clock"
                    disabled={expired}
                    onClick={() => expire(restaurant.id)}
                  >
                    {t('platformMore.subs.expireNow')}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </Panel>
    </div>
  )
}
