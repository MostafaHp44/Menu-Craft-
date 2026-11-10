import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button, Field, Input } from '../../shared/ui/ui.tsx'
import { Icon, Wordmark } from '../../shared/ui/icons.tsx'
import { LanguageSwitcher } from '../../shared/ui/LanguageSwitcher.tsx'
import { useI18n } from '../../shared/i18n'
import { homePathFor, useSession, type LoginMode } from '../../shared/store/useSession.ts'
import { panelForRole } from '../../shared/auth/panels.tsx'

export default function LiveLogin() {
  const { t } = useI18n()
  const { user, login, logout, error, clearError } = useSession()
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, _setMode] = useState<LoginMode>('employee')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [localError, setLocalError] = useState('')

  useEffect(() => {
    clearError()
  }, [mode, clearError])

  /**
   * فصل تام: هذه الشاشة للموظفين (كاشير/مطبخ/نادل) فقط.
   * - الموظف المسجّل دخول → يذهب إلى داشبورد الموظفين مباشرة.
   * - حساب آخر (مالك/سوبر أدمن) → لا يُنقل، بل تظهر رسالة توضّح الباب الصحيح.
   */
  const wrongPanel = user != null && panelForRole(user.role) !== 'staff'

  if (user && !wrongPanel) {
    return <Navigate to={homePathFor(user)} replace />
  }

  const from = (location.state as { from?: string } | null)?.from
  const target = from && from.startsWith('/workspace/') && from !== '/workspace/login' ? from : null

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setLocalError('')
    if (!email.trim() || !password) {
      setLocalError(t('live.common.required'))
      return
    }
    setBusy(true)
    try {
      const account = await login('employee', email.trim(), password)
      if (panelForRole(account.role) !== 'staff') {
        // ليس موظفاً — ارفض الدخول وألغِ الجلسة، ولا يُنقل إلى أي لوحة
        await logout()
        setLocalError(t('live.login.wrongPanel'))
        return
      }
      navigate(target ?? homePathFor(account), { replace: true })
    } catch {
      /* the session store exposes the backend message through `error` */
    } finally {
      setBusy(false)
    }
  }

  const notice = localError || error || (wrongPanel ? t('live.login.wrongPanel') : '')

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink px-4 py-10 text-ivory">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(circle at 20% 20%, rgba(232,87,31,0.35), transparent 45%), radial-gradient(circle at 80% 80%, rgba(120,140,90,0.28), transparent 45%)',
        }}
      />
      <div className="relative w-full max-w-[920px] overflow-hidden rounded-[28px] border border-white/10 bg-smoke shadow-[0_60px_140px_-60px_rgba(0,0,0,0.9)]">
        <div className="grid lg:grid-cols-[1.05fr_1fr]">
          <section className="hidden flex-col justify-between border-e border-white/10 p-9 lg:flex">
            <div>
              <Wordmark tone="light" />
              <p className="mt-8 max-w-sm text-[26px] font-semibold leading-tight">
                {t('live.login.title')}
              </p>
              <p className="mt-3 max-w-sm text-[13.5px] leading-relaxed text-ivory/60">{t('live.login.sub')}</p>
            </div>
            <div className="space-y-3 text-[12.5px] text-ivory/55">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8">
                  <Icon name="users" size={15} />
                </span>
                {t('live.roles.cashier')} · {t('live.roles.kitchen')} · {t('live.roles.waiter')}
              </div>
  
            </div>
          </section>

          <section className="bg-paper p-6 text-charcoal sm:p-8">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div className="lg:hidden">
                <Wordmark />
              </div>
              <LanguageSwitcher />
            </div>

            <h1 className="text-[24px] font-semibold tracking-[-0.02em]">{t('live.login.title')}</h1>
            <p className="mt-1 text-[13px] leading-relaxed text-umber">{t('live.login.sub')}</p>

            <div className="mt-5 rounded-full border border-sand bg-cream p-1">
              <div className="h-9 rounded-full bg-paper text-[13px] font-medium shadow-sm text-center leading-9 text-charcoal">
                {t('live.login.employeeTab')}
              </div>
            </div>
            <p className="mt-2 text-[11.5px] leading-relaxed text-clay">
              {t('live.login.employeeHint')}
            </p>

            <form onSubmit={submit} className="mt-4 space-y-3.5">
              <Field label={t('live.login.email')}>
                <Input
                  type="text"
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="waiter@restaurant.com"
                />
              </Field>
              <Field label={t('live.login.password')}>
                <Input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                />
              </Field>

              {notice ? (
                <div className="flex items-start gap-2 rounded-xl border border-rose/30 bg-rose/8 px-3 py-2.5 text-[12.5px] text-rose">
                  <Icon name="alert" size={14} className="mt-0.5 shrink-0" />
                  <span>
                    {notice}
                    {wrongPanel && user ? (
                      <>
                        {' '}
                        <Link to={homePathFor(user)} className="font-semibold underline">
                          {t('live.login.goToPanel')}
                        </Link>
                      </>
                    ) : null}
                  </span>
                </div>
              ) : null}

              <Button type="submit" variant="accent" full loading={busy} disabled={busy}>
                {busy ? t('live.login.signingIn') : t('live.login.signIn')}
              </Button>
            </form>

            <div className="mt-5 flex items-center justify-between gap-3 border-t border-sand pt-4 text-[12px]">
              <Link to="/" className="inline-flex items-center gap-1.5 text-umber hover:text-charcoal">
                <Icon name="arrowLeft" size={13} />
                {t('live.login.backToSite')}
              </Link>
              <span className="text-clay">Digital Menu</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
