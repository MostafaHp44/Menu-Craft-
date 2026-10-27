import { useI18n } from '../../../shared/i18n'
import { Icon } from '../../../shared/ui/icons.tsx'
import { Badge } from '../../../shared/ui/ui.tsx'
import { usePlatformStore } from '../../../shared/store/usePlatform.ts'
import { useStore } from '../../../shared/store/useStore.ts'
import type { PaymentProviderId } from '../../../shared/lib/types.ts'
import { DemoNote, Panel, PanelHeading, PaddedToggle } from '../parts.tsx'

const PROVIDER_ICON: Record<PaymentProviderId, string> = {
  cash: 'tag',
  card: 'card',
  wallet: 'smartphone',
  bank: 'layers',
}

export default function PaymentsTab() {
  const { t } = useI18n()
  const providers = usePlatformStore((s) => s.providers)
  const payments = usePlatformStore((s) => s.payments)
  const setProviderEnabled = usePlatformStore((s) => s.setProviderEnabled)
  const restaurants = useStore((s) => s.restaurants)

  return (
    <div className="space-y-5">
      <Panel>
        <PanelHeading
          title={t('admin.payments')}
          description={t('payments.subtitle')}
          actions={<Badge tone="gold" icon="alert">{t('platformMore.demoBadge')}</Badge>}
        />
        <div className="mt-4">
          <DemoNote>{t('payments.demoNotice')}</DemoNote>
        </div>
      </Panel>

      {providers.map((provider) => {
        const connected = restaurants.flatMap((restaurant) =>
          (payments[restaurant.id] ?? [])
            .filter((method) => method.provider === provider.id)
            .map((method) => ({ restaurant, method }))
        )

        return (
          <Panel key={provider.id}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/8 text-flame-light">
                  <Icon name={PROVIDER_ICON[provider.id]} size={18} />
                </span>
                <div className="min-w-0">
                  <h4 className="text-[14.5px] font-semibold text-ivory">{provider.label}</h4>
                  <p className="mt-0.5 text-[12.5px] leading-relaxed text-ivory/50">
                    {provider.detail}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge tone="neutral">
                      {t('platformMore.payments.fee')} · {provider.fee}
                    </Badge>
                    {!provider.enabled ? (
                      <Badge tone="rose">{t('admin.disabledForAll')}</Badge>
                    ) : null}
                  </div>
                </div>
              </div>

              <PaddedToggle
                checked={provider.enabled}
                onChange={(next) => setProviderEnabled(provider.id, next)}
                label={t('admin.enableForAll')}
                description={provider.enabled ? t('common.active') : t('admin.disabledForAll')}
              />
            </div>

            <div className="mt-4 border-t border-white/8 pt-4">
              <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-ivory/45">
                {t('platformMore.payments.connectedClients')}
              </span>

              {connected.length === 0 ? (
                <p className="mt-2 text-[12.5px] text-ivory/45">
                  {t('platformMore.payments.noneConnected')}
                </p>
              ) : (
                <ul className="mt-2.5 space-y-2">
                  {connected.map(({ restaurant, method }) => (
                    <li
                      key={method.id}
                      className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 rounded-xl bg-white/4 px-3.5 py-2.5 text-[12.5px]"
                    >
                      <span className="font-medium text-ivory/90">{restaurant.name}</span>
                      <span className="min-w-0 truncate text-ivory/50">
                        {method.label} · {method.account}
                      </span>
                      <Badge tone={method.enabled ? 'moss' : 'neutral'}>
                        {method.enabled ? t('common.active') : t('common.inactive')}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Panel>
        )
      })}
    </div>
  )
}
