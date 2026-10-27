import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Icon, Wordmark } from '../../shared/ui/icons.tsx'
import { Button, Card, Img, Input, Segmented } from '../../shared/ui/ui.tsx'
import { IMG } from '../../shared/lib/images.ts'
import { TEMPLATES } from '../../templates/data/templates.ts'
import { cx } from '../../shared/lib/utils.ts'
import { useI18n } from '../../shared/i18n'
import { useStore } from '../../shared/store/useStore.ts'
import { isPlatformAdmin, useAuthStore } from '../../shared/store/useAuth.ts'

type Mode = 'signin' | 'signup'

const EMAIL_RE = /^\S+@\S+\.\S+$/

export default function SignIn() {
  const { t, dir } = useI18n()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const draft = useStore((s) => s.draft)
  const signIn = useAuthStore((s) => s.signIn)
  const signUp = useAuthStore((s) => s.signUp)

  const [mode, setMode] = useState<Mode>(() => {
    const query = params.get('mode')
    if (query === 'signup') return 'signup'
    if (query === 'signin') return 'signin'
    // a visitor arriving from the editor always lands on "create account"
    return draft ? 'signup' : 'signin'
  })

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [restaurantName, setRestaurantName] = useState(draft?.name ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const switchMode = (next: Mode) => {
    setMode(next)
    setError('')
  }

  const submitSignIn = (e: FormEvent) => {
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
    setError('')
    setBusy(true)
    const hadDraft = Boolean(useStore.getState().draft)
    window.setTimeout(() => {
      signUp({
        name,
        email,
        restaurantName,
        templateId: useStore.getState().draft?.templateId ?? TEMPLATES[0].id,
      })
      setBusy(false)
      navigate(hadDraft ? '/dashboard/editor' : '/dashboard/templates')
    }, 450)
  }

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
          <span className="eyebrow">{mode === 'signup' ? t('flow.signUpTab') : t('auth.signInTitle')}</span>
          <h1 className="display-serif mt-3 text-[clamp(30px,4vw,44px)] leading-[1.05] text-charcoal">
            {mode === 'signup' ? t('auth.signUpTitle') : t('auth.signInSub')}
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-umber">
            {mode === 'signup' ? t('flow.signUpLead') : t('flow.signInLead')}
          </p>

          <Card className="mt-7 p-6">
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

            <form
              key={mode}
              onSubmit={mode === 'signup' ? submitSignUp : submitSignIn}
              className="mt-4 space-y-4"
              noValidate
            >
              {mode === 'signup' ? (
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-medium text-espresso">{t('auth.fullName')}</span>
                  <Input
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('auth.fullNamePh')}
                  />
                </label>
              ) : null}

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

              {mode === 'signup' ? (
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-medium text-espresso">{t('auth.restaurant')}</span>
                  <Input
                    autoComplete="organization"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    placeholder={t('auth.restaurantPh')}
                  />
                </label>
              ) : (
                <p className="flex items-start gap-2 text-[12.5px] leading-relaxed text-clay">
                  <Icon name="mail" size={14} className="mt-0.5 shrink-0" />
                  {t('flow.magicNote')}
                </p>
              )}

              {error ? (
                <p className="flex items-center gap-2 rounded-xl border border-rose/40 bg-rose/8 px-3.5 py-2.5 text-[13px] text-rose">
                  <Icon name="alert" size={15} className="shrink-0" />
                  {error}
                </p>
              ) : null}

              <div className="flex items-center justify-between gap-3">
                <span className="text-[12px] text-clay">
                  {mode === 'signup' ? t('auth.anyoneIsClient') : null}
                </span>
                {mode === 'signin' ? (
                  <button
                    type="button"
                    onClick={() => setEmail('owner@bella.demo')}
                    className="shrink-0 text-[12.5px] font-medium text-flame transition hover:text-flame-dark"
                  >
                    {t('flow.useDemoEmail')}
                  </button>
                ) : null}
              </div>

              <Button
                type="submit"
                size="lg"
                full
                loading={busy}
                icon={busy ? undefined : 'arrowRight'}
              >
                {busy
                  ? mode === 'signup'
                    ? t('flow.creatingAccount')
                    : t('flow.openingWorkspace')
                  : mode === 'signup'
                    ? t('auth.submitSignUp')
                    : t('auth.submitSignIn')}
              </Button>
            </form>

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
          </Card>

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
