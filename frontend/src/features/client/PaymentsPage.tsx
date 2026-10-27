import { useState } from 'react'
import { Icon } from '../../shared/ui/icons.tsx'
import {
  Badge,
  Button,
  Card,
  ChoiceCard,
  EmptyState,
  Field,
  IconButton,
  Input,
  Modal,
  Toggle,
} from '../../shared/ui/ui.tsx'
import { useI18n, type TKey } from '../../shared/i18n'
import { cx } from '../../shared/lib/utils.ts'
import { usePayments, usePlatformStore } from '../../shared/store/usePlatform.ts'
import { useActiveRestaurant, useStore } from '../../shared/store/useStore.ts'
import type { PaymentMethod, PaymentProviderId } from '../../shared/lib/types.ts'

const PROVIDER_KEY: Record<PaymentProviderId, TKey> = {
  cash: 'payments.cashOnDelivery',
  card: 'payments.cardTerminal',
  wallet: 'payments.wallet',
  bank: 'payments.bankTransfer',
}

const PROVIDER_ICON: Record<PaymentProviderId, string> = {
  cash: 'tag',
  card: 'card',
  wallet: 'smartphone',
  bank: 'send',
}

/* ------------------------------ method card ------------------------------- */

function MethodCard({
  method,
  onToggle,
  onRemove,
}: {
  method: PaymentMethod
  onToggle: () => void
  onRemove: () => void
}) {
  const { t } = useI18n()

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cream text-espresso">
          <Icon name={PROVIDER_ICON[method.provider]} size={18} />
        </span>
        <Badge tone="outline" className="shrink-0">
          {t(PROVIDER_KEY[method.provider])}
        </Badge>
      </div>

      <p className="mt-3 line-clamp-2 text-[15px] font-semibold text-charcoal">{method.label}</p>
      <p className="mt-0.5 line-clamp-1 text-[13px] text-umber">{method.account}</p>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-sand/70 pt-3.5">
        <div className="min-w-0 flex-1">
          <Toggle
            checked={method.enabled}
            label={method.enabled ? t('payments.connected') : t('common.inactive')}
            onChange={onToggle}
          />
        </div>
        <IconButton
          icon="trash"
          label={t('common.delete')}
          className="h-11 w-11 shrink-0"
          onClick={onRemove}
        />
      </div>
    </Card>
  )
}

/* -------------------------------- the page -------------------------------- */

export default function PaymentsPage() {
  const { t } = useI18n()
  const restaurant = useActiveRestaurant()
  const methods = usePayments(restaurant.id)
  const providers = usePlatformStore((s) => s.providers)
  const addPayment = usePlatformStore((s) => s.addPayment)
  const togglePayment = usePlatformStore((s) => s.togglePayment)
  const removePayment = usePlatformStore((s) => s.removePayment)
  const showToast = useStore((s) => s.showToast)

  const [addOpen, setAddOpen] = useState(false)
  const [provider, setProvider] = useState<PaymentProviderId>('cash')
  const [label, setLabel] = useState('')
  const [account, setAccount] = useState('')
  const [pendingRemove, setPendingRemove] = useState<PaymentMethod | null>(null)

  const openProviders = providers.filter((p) => p.enabled)
  const hasHiddenProviders = providers.some((p) => !p.enabled)

  const closeAdd = () => {
    setAddOpen(false)
    setLabel('')
    setAccount('')
    setProvider(openProviders[0]?.id ?? 'cash')
  }

  const canSubmit = Boolean(providers.find((p) => p.id === provider)?.enabled) && account.trim().length > 0

  const submit = () => {
    if (!canSubmit) return
    addPayment(restaurant.id, {
      provider,
      label: label.trim() || t(PROVIDER_KEY[provider]),
      account: account.trim(),
    })
    closeAdd()
    showToast({
      title: t('kitchenMore.methodAdded'),
      message: t('payments.demoNotice'),
      tone: 'success',
    })
  }

  const confirmRemove = () => {
    if (!pendingRemove) return
    removePayment(restaurant.id, pendingRemove.id)
    setPendingRemove(null)
    showToast({ title: t('kitchenMore.methodRemoved'), tone: 'info' })
  }

  return (
    <div className="space-y-6">
      {/* ------------------------------ header ------------------------------ */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="display-serif text-[clamp(24px,3vw,32px)] leading-tight text-charcoal">
            {t('payments.title')}
          </h2>
          <p className="mt-1.5 max-w-xl text-[14px] leading-relaxed text-umber">
            {t('payments.subtitle')}
          </p>
        </div>
        <Button variant="accent" icon="plus" onClick={() => setAddOpen(true)}>
          {t('payments.addMethod')}
        </Button>
      </div>

      {/* demo notice */}
      <div className="flex items-start gap-2.5 rounded-2xl border border-gold/35 bg-gold/8 px-4 py-3">
        <Icon name="info" size={16} className="mt-0.5 shrink-0 text-gold" />
        <p className="min-w-0 text-[13px] leading-relaxed text-espresso">
          {t('payments.demoNotice')}
        </p>
      </div>

      {/* --------------------------- my methods ---------------------------- */}
      <section>
        <div className="mb-3">
          <h3 className="text-[16px] font-semibold text-charcoal">{t('kitchenMore.yourMethods')}</h3>
          <p className="mt-0.5 text-[13px] text-umber">{t('dashboard.subPayments')}</p>
        </div>

        {methods.length === 0 ? (
          <EmptyState
            icon="card"
            title={t('common.empty')}
            message={t('payments.subtitle')}
            action={
              <Button variant="dark" icon="plus" onClick={() => setAddOpen(true)}>
                {t('payments.addMethod')}
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {methods.map((method) => (
              <MethodCard
                key={method.id}
                method={method}
                onToggle={() => togglePayment(restaurant.id, method.id)}
                onRemove={() => setPendingRemove(method)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ------------------------- platform providers ----------------------- */}
      <section>
        <h3 className="text-[16px] font-semibold text-charcoal">
          {t('kitchenMore.availableProviders')}
        </h3>
        <p className="mt-0.5 text-[13px] text-umber">{t('kitchenMore.providersSub')}</p>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {providers.map((p) => (
            <div
              key={p.id}
              className={cx(
                'flex items-start gap-3 rounded-2xl border border-sand bg-paper px-4 py-3.5',
                !p.enabled && 'opacity-60'
              )}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cream text-espresso">
                <Icon name={PROVIDER_ICON[p.id]} size={17} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-[13.5px] font-medium text-charcoal">
                    {t(PROVIDER_KEY[p.id])}
                  </span>
                  <span className="rounded-md bg-cream px-1.5 py-0.5 font-mono text-[11px] text-umber">
                    {p.fee}
                  </span>
                </span>
                {p.enabled ? null : (
                  <span className="mt-1 flex items-start gap-1.5 text-[11.5px] leading-snug text-clay">
                    <Icon name="info" size={13} className="mt-0.5 shrink-0" />
                    {t('kitchenMore.providerDisabledNote')}
                  </span>
                )}
              </span>
              <Badge tone={p.enabled ? 'moss' : 'neutral'} className="shrink-0">
                {p.enabled ? t('common.active') : t('common.inactive')}
              </Badge>
            </div>
          ))}
        </div>
      </section>

      {/* ----------------------------- add modal ---------------------------- */}
      <Modal
        open={addOpen}
        onClose={closeAdd}
        title={t('payments.addMethod')}
        description={t('payments.subtitle')}
        footer={
          <>
            <Button variant="ghost" onClick={closeAdd}>
              {t('common.cancel')}
            </Button>
            <Button variant="accent" icon="plus" disabled={!canSubmit} onClick={submit}>
              {t('payments.connect')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <span className="mb-1.5 block text-[13px] font-medium text-espresso">
              {t('payments.provider')}
            </span>

            {openProviders.length > 0 ? (
              <div className="grid grid-cols-2 gap-2.5">
                {openProviders.map((p) => (
                  <ChoiceCard
                    key={p.id}
                    label={t(PROVIDER_KEY[p.id])}
                    note={p.fee}
                    active={provider === p.id}
                    onClick={() => setProvider(p.id)}
                    preview={
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cream text-espresso">
                        <Icon name={PROVIDER_ICON[p.id]} size={17} />
                      </span>
                    }
                  />
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-sand bg-cream/60 px-3.5 py-3 text-[13px] text-umber">
                {t('kitchenMore.noProviderYet')}
              </p>
            )}

            {hasHiddenProviders ? (
              <p className="mt-2 text-[12px] leading-relaxed text-clay">
                {t('kitchenMore.providerDisabledNote')}
              </p>
            ) : null}
          </div>

          <Field label={t('kitchenMore.methodLabel')} hint={t('common.optional')}>
            <Input
              value={label}
              maxLength={48}
              placeholder={t('kitchenMore.methodLabelPh')}
              onChange={(e) => setLabel(e.target.value)}
            />
          </Field>

          <Field label={t('payments.accountName')}>
            <Input
              value={account}
              maxLength={64}
              placeholder={t('kitchenMore.accountPh')}
              onChange={(e) => setAccount(e.target.value)}
            />
          </Field>
        </div>
      </Modal>

      {/* --------------------------- remove modal --------------------------- */}
      <Modal
        open={pendingRemove !== null}
        onClose={() => setPendingRemove(null)}
        title={t('kitchenMore.removeMethodTitle')}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingRemove(null)}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" icon="trash" onClick={confirmRemove}>
              {t('common.delete')}
            </Button>
          </>
        }
      >
        <p className="text-[14px] leading-relaxed text-umber">
          {t('kitchenMore.removeMethodHint')}
        </p>
        {pendingRemove ? (
          <p className="mt-2 text-[13.5px] font-semibold text-charcoal">{pendingRemove.label}</p>
        ) : null}
      </Modal>
    </div>
  )
}
