import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Icon, Wordmark } from '../../shared/ui/icons.tsx'
import { Button, Card, Img, Input, Segmented } from '../../shared/ui/ui.tsx'
import { IMG } from '../../shared/lib/images.ts'
import { TEMPLATES } from '../../templates/data/templates.ts'
import { cx } from '../../shared/lib/utils.ts'
import { useI18n } from '../../shared/i18n'
import { useStore } from '../../shared/store/useStore.ts'
import { isPlatformAdmin, useAuthStore, type SocialProvider } from '../../shared/store/useAuth.ts'

type Mode = 'signin' | 'signup'
/** the card walks through: account form → forgot → sent → reset */
type Step = 'account' | 'forgot' | 'sent' | 'reset'

const EMAIL_RE = /^\S+@\S+\.\S+$/
const PASSWORD_MIN = 6

/* --------------------------- social brand glyphs --------------------------- */

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.1h6.5c-.1 1.1-.8 2.7-2.4 3.8l3.7 2.9c2.3-2.1 3.7-5.2 3.7-8.6Z"
      />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.7-2.9c-1 .7-2.4 1.2-4.2 1.2-3.2 0-6-2.1-6.9-5.1L1.3 17c1.9 4.2 6.1 7 10.7 7Z" />
      <path fill="#FBBC05" d="M5.1 14.3c-.3-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3L1.3 7C.5 8.6 0 10.2 0 12s.5 3.4 1.3 5l3.8-2.7Z" />
      <path fill="#EA4335" d="M12 4.6c1.8 0 3 .8 3.7 1.4L19 3.2C17 1.4 14.8 0 12 0 7.4 0 3.2 2.8 1.3 7l3.8 2.7C6 6.7 8.8 4.6 12 4.6Z" />
    </svg>
  )
}

function FacebookGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="#1877F2">
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.03 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07Z" />
    </svg>
  )
}

/* ----------------------------- password input ------------------------------ */

function PasswordInput({
  value,
  onChange,
  autoComplete,
  placeholder,
  ariaInvalid,
}: {
  value: string
  onChange: (value: string) => void
  autoComplete: string
  placeholder?: string
  ariaInvalid?: boolean
}) {
  const { t } = useI18n()
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <Input
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        value={value}
        placeholder={placeholder}
        aria-invalid={ariaInvalid}
        onChange={(e) => onChange(e.target.value)}
        className="pe-11"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? t('flow.hidePassword') : t('flow.showPassword')}
        title={visible ? t('flow.hidePassword') : t('flow.showPassword')}
        className="absolute end-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-umber transition hover:bg-cream hover:text-charcoal"
      >
        <Icon name={visible ? 'eyeOff' : 'eye'} size={16} />
      </button>
    </div>
  )
}

/* --------------------------------- page ----------------------------------- */

export default function SignIn() {
  const { t, dir } = useI18n()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const draft = useStore((s) => s.draft)
  const showToast = useStore((s) => s.showToast)
  const signIn = useAuthStore((s) => s.signIn)
  const signUp = useAuthStore((s) => s.signUp)
  const signInWithPassword = useAuthStore((s) => s.signInWithPassword)
  const signInWithProvider = useAuthStore((s) => s.signInWithProvider)
  const resetPassword = useAuthStore((s) => s.resetPassword)

  const [mode, setMode] = useState<Mode>(() => {
    const query = params.get('mode')
    if (query === 'signup') return 'signup'
    if (query === 'signin') return 'signin'
    // a visitor arriving from the editor always lands on "create account"
    return draft ? 'signup' : 'signin'
  })

  const [step, setStep] = useState<Step>(() => {
    // ?mode=forgot / ?mode=reset deep-link straight into the recovery flow
    const query = params.get('mode')
    return query === 'forgot' || query === 'reset' ? query : 'account'
  })

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [restaurantName, setRestaurantName] = useState(draft?.name ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [magicLink, setMagicLink] = useState(false)
  const [connecting, setConnecting] = useState<SocialProvider | null>(null)
  const [sentTo, setSentTo] = useState('')
  const [needsAccount, setNeedsAccount] = useState(false)

  const switchMode = (next: Mode) => {
    setMode(next)
    setStep('account')
    setMagicLink(false)
    setNeedsAccount(false)
    setError('')
  }

  const backToAccount = () => {
    setStep('account')
    setMagicLink(false)
    setNeedsAccount(false)
    setError('')
  }

  const createFromEmail = () => {
    setEmail(sentTo)
    setMode('signup')
    setStep('account')
    setMagicLink(false)
    setNeedsAccount(false)
    setError('')
  }

  /* ------------------------------ social auth ------------------------------ */

  const handleSocial = (provider: SocialProvider) => {
    setError('')
    setConnecting(provider)
    window.setTimeout(() => {
      const draftNow = useStore.getState().draft
      const result = signInWithProvider(provider, {
        // in "create account" mode a social sign-up must behave exactly like
        // register — the current draft becomes the new site
        adoptDraft: mode === 'signup',
        restaurantName: draftNow?.name ?? '',
        templateId: draftNow?.templateId ?? TEMPLATES[0].id,
      })
      setConnecting(null)
      if (!result.ok) {
        setError(result.reason === 'suspended' ? t('flow.suspended') : t('flow.socialFailed'))
        return
      }
      if (isPlatformAdmin(result.account ?? null)) navigate('/admin')
      else if (mode === 'signup' && result.created) navigate(draftNow ? '/dashboard/editor' : '/dashboard/templates')
      else navigate('/dashboard')
    }, 600)
  }

  /* -------------------------------- submits -------------------------------- */

  const submitSignIn = (e: FormEvent) => {
    e.preventDefault()
    if (!EMAIL_RE.test(email)) {
      setError(t('flow.validEmail'))
      return
    }
    if (!password) {
      setError(t('flow.passwordRequired'))
      return
    }
    if (password.length < PASSWORD_MIN) {
      setError(t('flow.passwordMin'))
      return
    }
    setError('')
    setBusy(true)
    window.setTimeout(() => {
      const result = signInWithPassword(email, password)
      setBusy(false)
      if (!result.ok) {
        if (result.reason === 'suspended') setError(t('flow.suspended'))
        else if (result.reason === 'wrongPassword') setError(t('flow.wrongPassword'))
        else setError(t('flow.noPasswordSet'))
        return
      }
      navigate(isPlatformAdmin(result.account ?? null) ? '/admin' : '/dashboard')
    }, 450)
  }

  const submitMagicLink = (e: FormEvent) => {
    e.preventDefault()
    if (!EMAIL_RE.test(email)) {
      setError(t('flow.validEmail'))
      return
    }
    setError('')
    setBusy(true)
    window.setTimeout(() => {
      const result = signIn(email)
      setBusy(false)
      if (!result.ok) {
        setError(result.reason === 'suspended' ? t('flow.suspended') : t('flow.validEmail'))
        return
      }
      navigate(isPlatformAdmin(result.account ?? null) ? '/admin' : '/dashboard')
    }, 450)
  }

  const submitSignUp = (e: FormEvent) => {
    e.preventDefault()
    if (!EMAIL_RE.test(email)) {
      setError(t('flow.validEmail'))
      return
    }
    if (password.length < PASSWORD_MIN) {
      setError(t('flow.passwordMin'))
      return
    }
    setError('')
    setBusy(true)
    const hadDraft = Boolean(useStore.getState().draft)
    window.setTimeout(() => {
      signUp({
        name,
        email,
        restaurantName,
        templateId: useStore.getState().draft?.templateId ?? TEMPLATES[0].id,
        password,
      })
      setBusy(false)
      navigate(hadDraft ? '/dashboard/editor' : '/dashboard/templates')
    }, 450)
  }

  const submitForgot = (e: FormEvent) => {
    e.preventDefault()
    if (!EMAIL_RE.test(email)) {
      setError(t('flow.validEmail'))
      return
    }
    setError('')
    setBusy(true)
    window.setTimeout(() => {
      setBusy(false)
      // non-enumerating demo behaviour: every email gets the "sent" state
      setSentTo(email.trim().toLowerCase())
      setStep('sent')
    }, 600)
  }

  const submitReset = (e: FormEvent) => {
    e.preventDefault()
    const target = (sentTo || email).trim().toLowerCase()
    if (!EMAIL_RE.test(target)) {
      setError(t('flow.validEmail'))
      return
    }
    if (password.length < PASSWORD_MIN || confirm.length < PASSWORD_MIN) {
      setError(t('flow.passwordMin'))
      return
    }
    if (password !== confirm) {
      setError(t('flow.passwordsDontMatch'))
      return
    }
    setError('')
    setBusy(true)
    window.setTimeout(() => {
      const result = resetPassword(target, password)
      if (!result.ok) {
        setBusy(false)
        if (result.reason === 'suspended') setError(t('flow.suspended'))
        else {
          // demo honesty: at this step we reveal there is no account yet
          setError(t('flow.noAccountYet'))
          setNeedsAccount(true)
        }
        return
      }
      const signedIn = signInWithPassword(target, password)
      setBusy(false)
      if (!signedIn.ok) {
        setError(t('flow.noPasswordSet'))
        return
      }
      showToast({
        title: t('flow.passwordUpdatedTitle'),
        message: t('flow.passwordUpdatedSub'),
        tone: 'success',
      })
      navigate(isPlatformAdmin(signedIn.account ?? null) ? '/admin' : '/dashboard')
    }, 600)
  }

  /* --------------------------------- bits ---------------------------------- */

  const socialButtons: Array<{ id: SocialProvider; label: string; glyph: ReactNode }> = [
    { id: 'google', label: t('flow.continueWithGoogle'), glyph: <GoogleGlyph /> },
    { id: 'facebook', label: t('flow.continueWithFacebook'), glyph: <FacebookGlyph /> },
  ]

  const emailField = (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-espresso">{t('auth.email')}</span>
      <Input
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t('auth.emailPh')}
        aria-invalid={Boolean(error) && !EMAIL_RE.test(email)}
      />
    </label>
  )

  const asideFeatures = [
    { icon: 'palette', label: t('flow.asideDesign') },
    { icon: 'utensils', label: t('flow.asideMenu') },
    { icon: 'qr', label: t('flow.asideQr') },
    { icon: 'chart', label: t('flow.asideAnalytics') },
  ]

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
      {/* -------------------------------- form --------------------------------- */}
      <div className="flex flex-col bg-ivory px-6 py-8 sm:px-10 lg:px-14">
        <div className="flex items-center justify-between">
          <Link to="/" aria-label="MenuCraft home">
            <Wordmark />
          </Link>
          <Link
            to="/"
            className="flex items-center gap-1.5 text-[13px] font-medium text-umber transition hover:text-charcoal"
          >
            <Icon name={dir === 'rtl' ? 'arrowRight' : 'arrowLeft'} size={15} />
            {t('flow.backHome')}
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <span className="eyebrow">
            {step === 'account'
              ? mode === 'signup'
                ? t('flow.signUpTab')
                : t('auth.signInTitle')
              : t('flow.forgotEyebrow')}
          </span>
          <h1 className="display-serif mt-3 text-[clamp(30px,4vw,44px)] leading-[1.05] text-charcoal">
            {step === 'account'
              ? mode === 'signup'
                ? t('auth.signUpTitle')
                : t('auth.signInSub')
              : step === 'sent'
                ? t('flow.sentTitle')
                : step === 'reset'
                  ? t('flow.resetTitle')
                  : t('flow.forgotTitle')}
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-umber">
            {step === 'account'
              ? mode === 'signup'
                ? t('flow.signUpLead')
                : t('flow.signInLead')
              : step === 'sent'
                ? t('flow.sentSub', { email: sentTo })
                : step === 'reset'
                  ? t('flow.resetLead')
                  : t('flow.forgotLead')}
          </p>

          <Card className="mt-7 p-6">
            {step === 'account' ? (
              <>
                <Segmented<Mode>
                  full
                  value={mode}
                  onChange={switchMode}
                  ariaLabel={t('flow.modeLabel')}
                  options={[
                    { value: 'signin', label: t('flow.signInTab'), icon: 'logout' },
                    { value: 'signup', label: t('flow.signUpTab'), icon: 'sparkles' },
                  ]}
                />

                {mode === 'signup' && draft ? (
                  <p className="mt-4 flex items-start gap-2 rounded-xl border border-flame/25 bg-flame/8 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-flame-dark">
                    <Icon name="sparkles" size={14} className="mt-0.5 shrink-0" />
                    {t('flow.draftBecomesSite')}
                  </p>
                ) : null}

                {/* ------------------------- social sign-in ------------------------ */}
                <div className="mt-4 grid gap-2.5">
                  {socialButtons.map((btn) => (
                    <button
                      key={btn.id}
                      type="button"
                      onClick={() => handleSocial(btn.id)}
                      disabled={busy || connecting !== null}
                      className="flex h-12 w-full items-center justify-center gap-2.5 rounded-full border border-sand bg-paper px-5 text-[14.5px] font-medium text-charcoal transition hover:border-clay hover:bg-cream disabled:pointer-events-none disabled:opacity-60"
                    >
                      {connecting === btn.id ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-charcoal/25 border-t-transparent" />
                      ) : (
                        btn.glyph
                      )}
                      <span>{connecting === btn.id ? t('flow.connecting') : btn.label}</span>
                    </button>
                  ))}
                </div>
                <p className="mt-2.5 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-clay">
                  <Icon name="info" size={13} className="mt-0.5 shrink-0" />
                  {t('flow.socialDemoNote')}
                </p>

                <div className="my-5 flex items-center gap-3 text-[12px] text-clay">
                  <span className="h-px flex-1 bg-sand" />
                  <span>{t('flow.orContinueEmail')}</span>
                  <span className="h-px flex-1 bg-sand" />
                </div>

                {mode === 'signup' ? (
                  <form key="signup" onSubmit={submitSignUp} className="space-y-4" noValidate>
                    <label className="block">
                      <span className="mb-1.5 block text-[13px] font-medium text-espresso">{t('auth.fullName')}</span>
                      <Input
                        autoComplete="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t('auth.fullNamePh')}
                      />
                    </label>

                    {emailField}

                    <label className="block">
                      <span className="mb-1.5 block text-[13px] font-medium text-espresso">{t('auth.password')}</span>
                      <PasswordInput
                        autoComplete="new-password"
                        value={password}
                        onChange={setPassword}
                        placeholder={t('flow.passwordPh')}
                        ariaInvalid={Boolean(error) && password.length < PASSWORD_MIN}
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-[13px] font-medium text-espresso">{t('auth.restaurant')}</span>
                      <Input
                        autoComplete="organization"
                        value={restaurantName}
                        onChange={(e) => setRestaurantName(e.target.value)}
                        placeholder={t('auth.restaurantPh')}
                      />
                    </label>

                    {error ? (
                      <p className="flex items-center gap-2 rounded-xl border border-rose/40 bg-rose/8 px-3.5 py-2.5 text-[13px] text-rose">
                        <Icon name="alert" size={15} className="shrink-0" />
                        {error}
                      </p>
                    ) : null}

                    <p className="text-[12px] leading-relaxed text-clay">{t('auth.anyoneIsClient')}</p>

                    <Button
                      type="submit"
                      size="lg"
                      full
                      loading={busy}
                      disabled={connecting !== null}
                      icon={busy ? undefined : 'arrowRight'}
                    >
                      {busy ? t('flow.creatingAccount') : t('auth.submitSignUp')}
                    </Button>
                  </form>
                ) : magicLink ? (
                  <form key="magic" onSubmit={submitMagicLink} className="space-y-4" noValidate>
                    {emailField}

                    <p className="flex items-start gap-2 rounded-xl border border-sand bg-cream/60 px-3.5 py-3 text-[12.5px] leading-relaxed text-umber">
                      <Icon name="mail" size={14} className="mt-0.5 shrink-0 text-flame" />
                      {t('flow.magicLinkNote')}
                    </p>
                    <p className="flex items-start gap-2 text-[12.5px] leading-relaxed text-clay">
                      <Icon name="info" size={14} className="mt-0.5 shrink-0" />
                      {t('flow.magicNote')}
                    </p>

                    {error ? (
                      <p className="flex items-center gap-2 rounded-xl border border-rose/40 bg-rose/8 px-3.5 py-2.5 text-[13px] text-rose">
                        <Icon name="alert" size={15} className="shrink-0" />
                        {error}
                      </p>
                    ) : null}

                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setMagicLink(false)
                          setError('')
                        }}
                        className="text-[12.5px] font-medium text-flame transition hover:text-flame-dark"
                      >
                        {t('flow.passwordInsteadCta')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEmail('owner@bella.demo')}
                        className="shrink-0 text-[12.5px] font-medium text-flame transition hover:text-flame-dark"
                      >
                        {t('flow.useDemoEmail')}
                      </button>
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      full
                      loading={busy}
                      disabled={connecting !== null}
                      icon={busy ? undefined : 'send'}
                    >
                      {busy ? t('flow.openingWorkspace') : t('auth.submitSignIn')}
                    </Button>
                  </form>
                ) : (
                  <form key="signin" onSubmit={submitSignIn} className="space-y-4" noValidate>
                    {emailField}

                    <label className="block">
                      <span className="mb-1.5 block text-[13px] font-medium text-espresso">{t('auth.password')}</span>
                      <PasswordInput
                        autoComplete="current-password"
                        value={password}
                        onChange={setPassword}
                        placeholder={t('flow.passwordPh')}
                        ariaInvalid={Boolean(error) && !password}
                      />
                    </label>

                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setStep('forgot')
                          setError('')
                        }}
                        className="text-[12.5px] font-medium text-flame transition hover:text-flame-dark"
                      >
                        {t('auth.forgot')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMagicLink(true)
                          setError('')
                        }}
                        className="text-[12.5px] text-clay underline-offset-2 transition hover:text-umber hover:underline"
                      >
                        {t('flow.magicLinkCta')}
                      </button>
                    </div>

                    {error ? (
                      <p className="flex items-center gap-2 rounded-xl border border-rose/40 bg-rose/8 px-3.5 py-2.5 text-[13px] text-rose">
                        <Icon name="alert" size={15} className="shrink-0" />
                        {error}
                      </p>
                    ) : null}

                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          // seed accounts are legacy password-less accounts —
                          // the helper drops straight into the magic-link flow
                          setEmail('owner@bella.demo')
                          setMagicLink(true)
                          setError('')
                        }}
                        className="text-[12.5px] font-medium text-flame transition hover:text-flame-dark"
                      >
                        {t('flow.useDemoEmail')}
                      </button>
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      full
                      loading={busy}
                      disabled={connecting !== null}
                      icon={busy ? undefined : 'arrowRight'}
                    >
                      {busy ? t('flow.openingWorkspace') : t('auth.submitSignIn')}
                    </Button>
                  </form>
                )}
              </>
            ) : step === 'forgot' ? (
              <form key="forgot" onSubmit={submitForgot} className="mt-1 space-y-4" noValidate>
                {emailField}

                <p className="flex items-start gap-2 text-[12.5px] leading-relaxed text-clay">
                  <Icon name="mail" size={14} className="mt-0.5 shrink-0" />
                  {t('flow.forgotDemoNote')}
                </p>

                {error ? (
                  <p className="flex items-center gap-2 rounded-xl border border-rose/40 bg-rose/8 px-3.5 py-2.5 text-[13px] text-rose">
                    <Icon name="alert" size={15} className="shrink-0" />
                    {error}
                  </p>
                ) : null}

                <Button type="submit" size="lg" full loading={busy} icon={busy ? undefined : 'send'}>
                  {busy ? t('flow.sendingLink') : t('flow.sendResetLink')}
                </Button>
              </form>
            ) : step === 'sent' ? (
              <div className="flex flex-col items-center py-2 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-moss/12 text-moss">
                  <Icon name="mail" size={24} strokeWidth={2} />
                </span>
                <p className="mt-4 flex items-start gap-2 text-[13px] leading-relaxed text-clay">
                  <Icon name="info" size={14} className="mt-0.5 shrink-0" />
                  {t('flow.sentDemoNote')}
                </p>
                <Button
                  variant="accent"
                  size="lg"
                  full
                  className="mt-5"
                  icon="external"
                  onClick={() => {
                    setStep('reset')
                    setError('')
                    setNeedsAccount(false)
                  }}
                >
                  {t('flow.openResetLink')}
                </Button>
              </div>
            ) : (
              <form key="reset" onSubmit={submitReset} className="mt-1 space-y-4" noValidate>
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-medium text-espresso">{t('auth.password')}</span>
                  <PasswordInput
                    autoComplete="new-password"
                    value={password}
                    onChange={setPassword}
                    placeholder={t('flow.passwordPh')}
                    ariaInvalid={Boolean(error) && password.length < PASSWORD_MIN}
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-medium text-espresso">
                    {t('flow.confirmPassword')}
                  </span>
                  <PasswordInput
                    autoComplete="new-password"
                    value={confirm}
                    onChange={setConfirm}
                    placeholder={t('flow.passwordPh')}
                    ariaInvalid={Boolean(error) && confirm !== password}
                  />
                </label>

                {error ? (
                  <p className="flex items-center gap-2 rounded-xl border border-rose/40 bg-rose/8 px-3.5 py-2.5 text-[13px] text-rose">
                    <Icon name="alert" size={15} className="shrink-0" />
                    {error}
                  </p>
                ) : null}

                {needsAccount ? (
                  <Button variant="outline" full icon="sparkles" onClick={createFromEmail}>
                    {t('flow.createAccountCta')}
                  </Button>
                ) : null}

                <Button
                  type="submit"
                  size="lg"
                  full
                  loading={busy}
                  icon={busy ? undefined : 'check'}
                >
                  {busy ? t('flow.updatingPassword') : t('flow.updatePassword')}
                </Button>
              </form>
            )}
          </Card>

          <p className="mt-5 text-center text-[13px] text-umber">
            {step === 'account' ? (
              <>
                {mode === 'signup' ? t('auth.haveAccount') : t('auth.noAccount')}{' '}
                <button
                  type="button"
                  onClick={() => switchMode(mode === 'signup' ? 'signin' : 'signup')}
                  className="font-medium text-flame transition hover:text-flame-dark"
                >
                  {mode === 'signup' ? t('flow.signInTab') : t('flow.signUpTab')}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={backToAccount}
                className="font-medium text-flame transition hover:text-flame-dark"
              >
                {t('flow.backToSignIn')}
              </button>
            )}
          </p>

          <p className="mt-5 text-center text-[13px] text-umber">
            <Link to="/templates" className="font-medium text-flame transition hover:text-flame-dark">
              {t('flow.browseFirst')}
            </Link>
            {' · '}
            <Link to="/admin" className="text-clay transition hover:text-umber">
              {t('flow.adminLink')}
            </Link>
          </p>
        </div>

        <p className="text-center text-[12px] text-clay">{t('flow.prototypeNote')}</p>
      </div>

      {/* ------------------------------- visual -------------------------------- */}
      <aside className="relative hidden overflow-hidden bg-ink lg:block">
        <Img
          src={IMG.diningRoomDark}
          alt="Restaurant dining room at night"
          eager
          className="absolute inset-0 h-full w-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-ink/90 via-ink/60 to-flame/25" />

        <div className="relative flex h-full flex-col justify-between p-12 text-ivory">
          <div className="flex gap-2">
            {TEMPLATES.slice(0, 3).map((template) => (
              <span
                key={template.id}
                className="h-6 w-6 rounded-full border border-white/40"
                style={{ backgroundColor: template.chips[0] }}
                title={template.name}
              />
            ))}
          </div>

          <div>
            <h2 className="display-serif max-w-lg text-[clamp(30px,3.4vw,46px)] leading-[1.06]">
              {t('flow.asideTitle')}
            </h2>
            <p className="mt-5 max-w-md text-[15.5px] leading-relaxed text-ivory/70">{t('flow.asideLead')}</p>

            <ul className="mt-8 grid max-w-lg gap-3 sm:grid-cols-2">
              {asideFeatures.map((item) => (
                <li
                  key={item.label}
                  className="flex items-center gap-3 rounded-xl border border-white/12 bg-white/6 px-3.5 py-3 text-[13.5px] backdrop-blur-sm"
                >
                  <span className={cx('flex h-8 w-8 items-center justify-center rounded-lg bg-white/10')}>
                    <Icon name={item.icon} size={16} className="text-flame-light" />
                  </span>
                  {item.label}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-[12.5px] text-ivory/45">{t('flow.asideFoot')}</p>
        </div>
      </aside>
    </div>
  )
}