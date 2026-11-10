import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Icon, Wordmark } from '../../shared/ui/icons.tsx'
import { Button, Card, Img, Input, Segmented } from '../../shared/ui/ui.tsx'
import { IMG } from '../../shared/lib/images.ts'
import { TEMPLATES } from '../../templates/data/templates.ts'
import { cx, tx } from '../../shared/lib/utils.ts'
import { useI18n } from '../../shared/i18n'
import { useStore } from '../../shared/store/useStore.ts'
import { useAuthStore } from '../../shared/store/useAuth.ts'
import { useBackendAuth } from '../../shared/store/useBackendAuth.ts'
import { panelForRole } from '../../shared/auth/panels.tsx'

type Mode = 'signin' | 'signup'
/** 'forgot' only shows an honest "recovery unavailable" panel — there is no backend reset endpoint. */
type Step = 'account' | 'forgot'

const EMAIL_RE = /^\S+@\S+\.\S+$/
const PASSWORD_MIN = 6

/**
 * The backend answers in Arabic, so map its known messages onto translated
 * keys — anything unknown is shown as-is (it is already human readable).
 */
function localizeBackendError(raw: string, t: (k: string) => string): string {
  if (/failed to fetch|networkerror|load failed|fetch failed/i.test(raw)) return t('flow.networkError')
  if (/Too many requests|429/.test(raw)) return t('flow.tooManyAttempts')
  if (/مستخدم مسبقًا|already registered|duplicate/i.test(raw)) return t('flow.emailTaken')
  if (/غير صحيحة|wrong password|invalid credentials/i.test(raw)) return t('flow.wrongPassword')
  if (/معطل|suspended/i.test(raw)) return t('flow.suspended')
  return raw || t('flow.signUpFailed')
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
  const signUp = useAuthStore((s) => s.signUp)
  const signInWithPassword = useAuthStore((s) => s.signInWithPassword)
  const backendUser = useBackendAuth((s) => s.user)
  const backendStatus = useBackendAuth((s) => s.status)

  // Already signed in → the login / sign-up form makes no sense on this panel.
  // Only bounce once the session has actually been resolved, so we never bounce
  // a returning visitor before /api/auth/me answers.
  const signedIn = Boolean(backendUser)
  const panel = panelForRole(backendUser?.role)
  useEffect(() => {
    if (!signedIn || backendStatus !== 'ready') return
    if (panel === 'staff') {
      // الموظفين لا يدخلون هنا أصلاً — يروحون إلى مساحة عمل الموظفين
      navigate('/workspace', { replace: true })
      return
    }
    showToast({ title: t('flow.signedInNotice'), tone: 'info' })
    navigate(panel === 'admin' ? '/admin' : '/dashboard', { replace: true })
  }, [signedIn, backendStatus, panel, navigate, showToast, t])

  const [mode, setMode] = useState<Mode>(() => {
    const query = params.get('mode')
    if (query === 'signup') return 'signup'
    if (query === 'signin') return 'signin'
    // a visitor arriving from the editor always lands on "create account"
    return draft ? 'signup' : 'signin'
  })

  const [step, setStep] = useState<Step>(() => {
    // Deep links asking for a reset land on the honest "unavailable" panel.
    const query = params.get('mode')
    return query === 'forgot' || query === 'reset' ? 'forgot' : 'account'
  })

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [restaurantName, setRestaurantName] = useState(() =>
    typeof draft?.name === 'string' ? draft.name : (tx(draft?.name) || '')
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [language, setLanguage] = useState<'ar' | 'en' | 'ku'>('ar')

  const switchMode = (next: Mode) => {
    setMode(next)
    setStep('account')
    setError('')
  }

  const backToAccount = () => {
    setStep('account')
    setError('')
  }

  /* -------------------------------- submits -------------------------------- */

  const submitSignIn = async (e: FormEvent) => {
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

    // 1) Try the real backend first so the HttpOnly session cookie is issued.
    try {
      const backendUser = await useBackendAuth.getState().signin(email.trim(), password)
      // فصل تام: هذه الشاشة لصاحب المطعم (owner/client) فقط
      const role = String(backendUser?.role ?? '').toLowerCase()
      if (role !== 'owner' && role !== 'client') {
        await useBackendAuth.getState().logout()
        setBusy(false)
        setError(
          role === 'super_admin' || role === 'admin'
            ? t('auth.accessDeniedAdmin')
            : t('auth.accessDeniedStaff'),
        )
        return
      }
      // mirror into the prototype session when such an account exists (best effort)
      signInWithPassword(email, password)
      setBusy(false)
      navigate('/dashboard')
      return
    } catch (err) {
      // not a backend account (or wrong password)
      const backendError = err instanceof Error ? err.message : ''
      setBusy(false)
      setError(localizeBackendError(backendError, t))
      return
    }
  }

  const submitSignUp = async (e: FormEvent) => {
    e.preventDefault()
    // Validate locally first so the user always sees a message in the UI
    // language instead of a backend string.
    if (name.trim().length < 2) {
      setError(t('flow.nameRequired'))
      return
    }
    if (!EMAIL_RE.test(email)) {
      setError(t('flow.validEmail'))
      return
    }
    if (password.length < PASSWORD_MIN) {
      setError(t('flow.passwordMin'))
      return
    }
    if (restaurantName.trim().length < 2) {
      setError(t('flow.restaurantRequired'))
      return
    }
    setError('')
    setBusy(true)

    // ==== SAVE guest draft data for later restoration ====
    const draftState = useStore.getState().draft
    const hadDraft = Boolean(draftState)
    // Preserve the templateId and design config that the guest customized
    const savedTemplateId = draftState?.templateId ?? TEMPLATES[0].id
    const savedDesign = draftState?.design // design configuration object
    void draftState?.name

    // Register on the real backend first so the account + session cookie exist.
    let backendError: string | null = null
    let backendResponse: any = null
    try {
      backendResponse = await useBackendAuth.getState().signup({
        email: email.trim(),
        password,
        name,
        restaurantName,
        templateId: savedTemplateId,
        language,
      })
    } catch (err) {
      // fetch() only rejects on transport problems — the backend's own
      // messages (already human readable) come back with a 4xx/5xx status.
      backendError = localizeBackendError(err instanceof Error ? err.message : '', t)
      backendResponse = null
    }

    // Keep the prototype workspace in sync (it drives the editor/templates UI).
    // Only after the backend confirmed the account — a failed sign-up must not
    // leave a local demo account behind.
    setBusy(false)

    if (backendError) {
      setError(backendError)
      return
    }

    if (!backendResponse?.user) {
      // 200 without a user payload would otherwise look like a silent success.
      setError(t('flow.signUpFailed'))
      return
    }

    signUp({ name, email, restaurantName, templateId: savedTemplateId, password })

    // بعد التسجيل → الداشبورد علطول (بدل المحرر/القوالب)
    // إذا كان هناك رابط يعود (من customize)، نستخدمه
    const params = new URLSearchParams(window.location.search)
    const redirect = params.get('redirect') || ''
    navigate(redirect || '/dashboard')

    // ==== RESTORE template customization to the new restaurant ====
    // The backend signup creates a new restaurant; we now update it with
    // the guest's previously selected template and design configuration.
    if (hadDraft && savedTemplateId && backendResponse?.user?.restaurant_id) {
      try {
        // Use the restaurant update API to apply the saved template/design
        const updateRes = await fetch(`/api/restaurants/${backendResponse.user.restaurant_id}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateId: savedTemplateId,
            // Extract key design fields from the saved config; fallback to TEMPLATES[0] defaults
            design: savedDesign
              ? {
                  colors: savedDesign.colors || {
                    primary: '#1B1714',
                    secondary: '#7D7263',
                    accent: '#E8571F',
                    background: '#FAF7F1',
                    text: '#1B1714',
                    card: '#FFFFFF',
                    button: '#1B1714',
                  },
                  typography: savedDesign.typography || {
                    heading: 'playfair',
                    body: 'inter',
                    menu: 'inter',
                    headingScale: 1,
                    bodyScale: 1,
                    headingWeight: 600,
                    lineHeight: 1.65,
                  },
                  layout: savedDesign.layout || {
                    header: 'split',
                    hero: 'editorial',
                    menuLayout: 'grid',
                    card: 'bordered',
                    radius: 14,
                    spacing: 1,
                    aspect: 'landscape',
                    theme: 'light',
                  },
                }
              : undefined,
          }),
        })
        const updateJson = await updateRes.json().catch(() => null)
        if (!updateRes.ok || updateJson?.ok === false) {
          // Non-fatal: the restaurant was created; template assignment may fail silently
          console.warn('Failed to apply template design to new restaurant:', updateJson?.error)
        }
      } catch (err) {
        console.warn('Error applying template design to new restaurant:', err instanceof Error ? err.message : err)
      }
    }
  }

  /* --------------------------------- bits ---------------------------------- */

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
          <Link to="/" aria-label="Digital Menu home">
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
            {step === 'forgot'
              ? t('flow.forgotEyebrow')
              : mode === 'signup'
                ? t('flow.signUpTab')
                : t('auth.signInTitle')}
          </span>
          <h1 className="display-serif mt-3 text-[clamp(30px,4vw,44px)] leading-[1.05] text-charcoal">
            {step === 'forgot'
              ? t('flow.forgotTitle')
              : mode === 'signup'
                ? t('auth.signUpTitle')
                : t('auth.signInSub')}
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-umber">
            {step === 'forgot'
              ? t('flow.recoveryUnavailable')
              : mode === 'signup'
                ? t('flow.signUpLead')
                : t('flow.signInLead')}
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

                    <label className="block">
                      <span className="mb-1.5 block text-[13px] font-medium text-espresso">Store default language</span>
                      <select value={language} onChange={(e) => setLanguage(e.target.value as 'ar' | 'en' | 'ku')} className="w-full rounded-xl border border-sand bg-paper px-3 py-2.5 text-sm text-charcoal">
                        <option value="ar">Arabic</option><option value="en">English</option><option value="ku">Kurdish Sorani</option>
                      </select>
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
                      icon={busy ? undefined : 'arrowRight'}
                    >
                      {busy ? t('flow.creatingAccount') : t('auth.submitSignUp')}
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
                    </div>

                    {error ? (
                      <p className="flex items-center gap-2 rounded-xl border border-rose/40 bg-rose/8 px-3.5 py-2.5 text-[13px] text-rose">
                        <Icon name="alert" size={15} className="shrink-0" />
                        {error}
                      </p>
                    ) : null}

                    <Button
                      type="submit"
                      size="lg"
                      full
                      loading={busy}
                      icon={busy ? undefined : 'arrowRight'}
                    >
                      {busy ? t('flow.openingWorkspace') : t('auth.submitSignIn')}
                    </Button>
                  </form>
                )}
              </>
            ) : (
              <Button variant="outline" size="lg" full onClick={backToAccount}>
                {t('flow.backToSignIn')}
              </Button>
            )}
          </Card>

          {step === 'account' ? (
            <p className="mt-5 text-center text-[13px] text-umber">
              {mode === 'signup' ? t('auth.haveAccount') : t('auth.noAccount')}{' '}
              <button
                type="button"
                onClick={() => switchMode(mode === 'signup' ? 'signin' : 'signup')}
                className="font-medium text-flame transition hover:text-flame-dark"
              >
                {mode === 'signup' ? t('flow.signInTab') : t('flow.signUpTab')}
              </button>
            </p>
          ) : null}

          <p className="mt-5 text-center text-[13px] text-umber">
            <Link to="/templates" className="font-medium text-flame transition hover:text-flame-dark">
              {t('flow.browseFirst')}
            </Link>
            {' · '}
            <Link to="/admin" className="text-clay transition hover:text-umber">
              {t('flow.adminLink')}
            </Link>
            {' · '}
            <Link to="/workspace/login" className="text-clay transition hover:text-umber">
              {t('live.nav.workspace')}
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
