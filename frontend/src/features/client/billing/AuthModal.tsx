import { useEffect, useState, type FormEvent } from 'react'
import { Icon } from '../../../shared/ui/icons.tsx'
import { Button, Field, Input, Modal } from '../../../shared/ui/ui.tsx'
import { useI18n } from '../../../shared/i18n'
import { useAuthStore } from '../../../shared/store/useAuth.ts'
import { useBackendAuth } from '../../../shared/store/useBackendAuth.ts'
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
  const [restName, setRestName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [lang, setLang] = useState('ar')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setName('')
      setRestName(restaurantName)
      setEmail('')
      setError('')
      setBusy(false)
    }
  }, [open, restaurantName])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError(t('flow.validEmail'))
      return
    }
    if (name.trim().length < 2) {
      setError(t('flow.nameRequired'))
      return
    }
    if (restName.trim().length < 2) {
      setError(t('flow.restaurantRequired'))
      return
    }
    if (password.length < 6) {
      setError(t('flow.passwordMin'))
      return
    }
    const finalRestaurantName = restName.trim()
    setError('')
    setBusy(true)
    const templateId = draftTemplateId ?? TEMPLATES[0].id

    // 1) تسجيل حقيقي على الباك إند عشان الـ HttpOnly cookie يبقى جاهز
    //    (من غيره الـ Publish هيفشل 401 والداشبورد هيرفض دخولنا)
    try {
      await useBackendAuth.getState().signup({
        email: email.trim(),
        password,
        name: name.trim(),
        restaurantName: finalRestaurantName,
        templateId,
        language: (lang as 'ar' | 'en' | 'ku') ?? 'ar',
      })
    } catch (err) {
      setBusy(false)
      setError(err instanceof Error ? err.message : t('flow.signUpFailed'))
      return
    }

    // 2) مزامنة الـ prototype المحلي (الذي يقود الـ Editor/UI)
    signUp({
      name: name.trim(),
      email: email.trim(),
      restaurantName: finalRestaurantName,
      templateId,
      password,
    })
    setBusy(false)
    onSuccess?.()
    onClose()
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
        <Field label={t('auth.restaurant')}>
          <Input
            value={restName}
            autoComplete="organization"
            placeholder={t('auth.restaurantPh')}
            onChange={(e) => setRestName(e.target.value)}
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
        <Field label="Language / اللغة">
          <select className="w-full rounded-lg border border-sand bg-paper px-3 py-2 text-[14px]" value={lang} onChange={e=>setLang(e.target.value)}>
            <option value="ar">Arabic</option>
            <option value="en">English</option>
            <option value="ku">Kurdish</option>
          </select>
        </Field>
        <Field label={t('auth.password')}>
          <Input type="password" value={password} autoComplete="new-password" placeholder="Password" onChange={e=>setPassword(e.target.value)} />
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
