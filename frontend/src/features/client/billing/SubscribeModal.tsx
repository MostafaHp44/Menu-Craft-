import { useEffect, useState, type FormEvent } from 'react'
import { Icon } from '../../../shared/ui/icons.tsx'
import { Badge, Button, Field, Input, Modal } from '../../../shared/ui/ui.tsx'
import { useI18n } from '../../../shared/i18n'
import { PLANS } from '../../../shared/lib/demoData.ts'
import { cx, money } from '../../../shared/lib/utils.ts'
import { useAuthStore } from '../../../shared/store/useAuth.ts'
import { usePlatformStore, useSubscription } from '../../../shared/store/usePlatform.ts'
import { useStore } from '../../../shared/store/useStore.ts'
import { TEMPLATES } from '../../../templates/data/templates.ts'
import type { DemoPlanId } from '../../../shared/lib/types.ts'

interface SubscribeModalProps {
  open: boolean
  onClose: () => void
  restaurantId: string
  restaurantName: string
  /** called after a successful subscribe — e.g. to publish right away */
  onSuccess?: () => void
}

type Step = 'plans' | 'account' | 'done'

/**
 * Demo checkout: pick a plan → (create an account if needed) → subscribed.
 * No payment is ever processed — every number here is simulated.
 */
export function SubscribeModal({
  open,
  onClose,
  restaurantId,
  restaurantName,
  onSuccess,
}: SubscribeModalProps) {
  const { t } = useI18n()
  const session = useAuthStore((s) => s.session)
  const signUp = useAuthStore((s) => s.signUp)
  const subscribe = usePlatformStore((s) => s.subscribe)
  const setPlan = usePlatformStore((s) => s.setPlan)
  const showToast = useStore((s) => s.showToast)
  const draftTemplateId = useStore((s) => s.draft?.templateId)
  const current = useSubscription(restaurantId)

  const [step, setStep] = useState<Step>('plans')
  const [chosen, setChosen] = useState<DemoPlanId | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setStep('plans')
      setChosen(null)
      setName('')
      setEmail('')
      setError('')
      setBusy(false)
    }
  }, [open])

  const finish = (planId: DemoPlanId) => {
    showToast({
      title: t('flow.subscribedTitle'),
      message: t('flow.subscribedSub', {
        name: restaurantName,
        plan: PLANS.find((p) => p.id === planId)?.name ?? planId,
      }),
      tone: 'success',
    })
    setStep('done')
    onSuccess?.()
  }

  const choosePlan = (planId: DemoPlanId) => {
    setChosen(planId)
    if (session) {
      // signed-in clients subscribe directly — no extra step
      subscribe(restaurantId, planId)
      finish(planId)
    } else {
      setStep('account')
    }
  }

  const submitAccount = (e: FormEvent) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError(t('flow.validEmail'))
      return
    }
    setError('')
    setBusy(true)
    window.setTimeout(() => {
      const { account } = signUp({
        name,
        email,
        restaurantName,
        templateId: draftTemplateId ?? TEMPLATES[0].id,
      })
      // the draft may have been adopted under a new id — follow the account
      const targetId = account.restaurantId ?? restaurantId
      if (chosen) setPlan(targetId, chosen)
      setBusy(false)
      if (chosen) finish(chosen)
    }, 450)
  }

  const doneStep = step === 'done'

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={
        step === 'account'
          ? t('flow.accountStepTitle')
          : doneStep
            ? t('flow.subscribedTitle')
            : t('flow.subTitle', { name: restaurantName })
      }
      description={
        step === 'account'
          ? t('flow.accountStepSub')
          : doneStep
            ? undefined
            : t('subscription.choosePlanSub')
      }
      footer={
        doneStep ? (
          <Button variant="accent" iconRight="arrowRight" onClick={onClose}>
            {t('flow.continueEditing')}
          </Button>
        ) : step === 'account' ? (
          <Button variant="ghost" icon="arrowLeft" onClick={() => setStep('plans')}>
            {t('common.back')}
          </Button>
        ) : undefined
      }
    >
      {doneStep ? (
        <div className="flex flex-col items-center py-4 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-moss/12 text-moss">
            <Icon name="check" size={26} strokeWidth={2.2} />
          </span>
          <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-umber">
            {t('flow.subscribedSub', {
              name: restaurantName,
              plan: PLANS.find((p) => p.id === chosen)?.name ?? '',
            })}
          </p>
        </div>
      ) : step === 'account' ? (
        <form onSubmit={submitAccount} className="space-y-4" noValidate>
          <Field label={t('auth.fullName')}>
            <Input
              value={name}
              autoComplete="name"
              placeholder={t('auth.fullNamePh')}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field label={t('auth.email')} error={error || undefined}>
            <Input
              type="email"
              value={email}
              autoComplete="email"
              placeholder={t('auth.emailPh')}
              aria-invalid={Boolean(error)}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <p className="rounded-xl border border-sand bg-cream/60 px-3.5 py-3 text-[12px] leading-relaxed text-umber">
            {t('flow.demoNotice')}
          </p>
          <Button type="submit" variant="accent" full size="md" loading={busy} icon={busy ? undefined : 'sparkles'}>
            {t('flow.accountCta')}
          </Button>
        </form>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-3">
          {PLANS.map((plan) => {
            const active = chosen === plan.id
            const isCurrent = current?.plan === plan.id
            return (
              <li key={plan.id}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => choosePlan(plan.id)}
                  className={cx(
                    'flex h-full w-full flex-col rounded-2xl border p-4 text-start transition duration-200',
                    active
                      ? 'border-charcoal bg-paper shadow-[0_16px_34px_-26px_rgba(27,23,20,0.85)]'
                      : 'border-sand bg-cream/60 hover:border-clay hover:bg-cream'
                  )}
                >
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[14px] font-semibold text-charcoal">{plan.name}</span>
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

                  <span className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-[26px] font-semibold leading-none tracking-[-0.02em] text-charcoal">
                      {plan.price === 0 ? t('flow.freeForever') : money(plan.price)}
                    </span>
                    {plan.price > 0 ? (
                      <span className="text-[12px] text-clay">{t('common.perMonth')}</span>
                    ) : null}
                  </span>

                  <span className="mt-2 block text-[12px] leading-snug text-umber">{plan.blurb}</span>

                  <ul className="mt-3 space-y-1.5 border-t border-sand/80 pt-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-[12px] leading-snug text-espresso">
                        <Icon name="check" size={13} className="mt-0.5 shrink-0 text-moss" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {!doneStep && step === 'plans' ? (
        <p className="mt-4 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-clay">
          <Icon name="info" size={13} className="mt-0.5 shrink-0" />
          {t('flow.demoNotice')}
        </p>
      ) : null}
    </Modal>
  )
}
