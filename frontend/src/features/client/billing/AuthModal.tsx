import { useEffect, useState, type FormEvent } from 'react'
import { Icon } from '../../../shared/ui/icons.tsx'
import { Button, Field, Input, Modal } from '../../../shared/ui/ui.tsx'
import { useI18n } from '../../../shared/i18n'
import { useAuthStore } from '../../../shared/store/useAuth.ts'
import { useStore } from '../../../shared/store/useStore.ts'
import { TEMPLATES } from '../../../templates/data/templates.ts'

interface AuthModalProps {
  open: boolean
  onClose: () => void
  /** draft name — used to adopt the visitor's work as the new restaurant */
  restaurantName: string
  /** called after the account exists (session is live) */
  onSuccess?: () => void
}

/**
 * The publish gate's account step: a visitor with no session creates one right
 * here — the current draft is adopted as their restaurant by `signUp`.
 */
export function AuthModal({ open, onClose, restaurantName, onSuccess }: AuthModalProps) {
  const { t } = useI18n()
  const signUp = useAuthStore((s) => s.signUp)
  const draftTemplateId = useStore((s) => s.draft?.templateId)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setName('')
      setEmail('')
      setError('')
      setBusy(false)
    }
  }, [open])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError(t('flow.validEmail'))
      return
    }
    setError('')
    setBusy(true)
    window.setTimeout(() => {
      signUp({
        name,
        email,
        restaurantName,
        templateId: draftTemplateId ?? TEMPLATES[0].id,
      })
      setBusy(false)
      onSuccess?.()
      onClose()
    }, 450)
  }

  return (
    <Modal open={open} onClose={onClose} size="sm" title={t('flow.gateTitle')} description={t('flow.gateSub')}>
      <form onSubmit={submit} className="space-y-4" noValidate>
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
        <p className="flex items-start gap-2 rounded-xl border border-sand bg-cream/60 px-3.5 py-3 text-[12px] leading-relaxed text-umber">
          <Icon name="info" size={14} className="mt-0.5 shrink-0 text-flame" />
          {t('flow.draftBecomesSite')}
        </p>
        <Button type="submit" variant="accent" full size="md" loading={busy} icon={busy ? undefined : 'send'}>
          {busy ? t('flow.creatingAccount') : t('flow.gateCta')}
        </Button>
      </form>
    </Modal>
  )
}
