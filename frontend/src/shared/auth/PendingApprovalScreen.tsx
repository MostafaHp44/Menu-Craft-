import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../store/useSession.ts'
import { useBackendAuth } from '../store/useBackendAuth.ts'
import { useI18n } from '../i18n'
import { Button } from '../ui/ui.tsx'
import { Icon, Wordmark } from '../ui/icons.tsx'

/**
 * شاشة انتظار موافقة السوبر ادمن — تُعرض بدل أي لوحة (داشبورد/وركسبايس)
 * لأي مطعم بلا اشتراك فعّال. المطلوب الوحيد المتاح هو إعادة الفحص أو الخروج.
 */
export function PendingApprovalScreen() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const subscription = useSession((s) => s.subscription)
  const pendingRequest = useSession((s) => s.pendingRequest)
  const user = useSession((s) => s.user)
  const refresh = useSession((s) => s.refresh)
  const logout = useSession((s) => s.logout)
  const [checking, setChecking] = useState(false)

  const checkAgain = async () => {
    setChecking(true)
    try {
      await refresh()
    } finally {
      setChecking(false)
    }
  }

  const signOut = async () => {
    await logout()
    await useBackendAuth.getState().logout()
    navigate('/signin', { replace: true })
  }

  const requestedPlan =
    pendingRequest?.planName ?? subscription?.limits?.planName ?? null

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ivory px-6 py-10">
      <div className="w-full max-w-md rounded-3xl border border-sand bg-white/70 p-8 text-center shadow-[0_20px_60px_-30px_rgba(27,23,20,0.35)] backdrop-blur">
        <div className="flex justify-center">
          <Wordmark />
        </div>

        <div className="mt-8 flex justify-center">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-flame/10">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-flame/10" />
            <Icon name="clock" size={38} className="relative text-flame" strokeWidth={1.6} />
          </div>
        </div>

        <h1 className="mt-6 font-display text-2xl font-semibold text-espresso">
          {t('pendingApproval.title')}
        </h1>
        <p className="mt-2 text-[15px] leading-7 text-umber">{t('pendingApproval.message')}</p>

        {requestedPlan ? (
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-sand bg-ivory px-4 py-2 text-[13px] font-medium text-espresso">
            <span className="text-umber">{t('pendingApproval.requestedPlan')}</span>
            <span className="font-semibold text-flame">{requestedPlan}</span>
          </div>
        ) : null}

        {user?.email ? (
          <p className="mt-4 text-[12px] text-umber/80" dir="ltr">
            {user.email}
          </p>
        ) : null}

        <p className="mt-5 text-[12px] leading-6 text-umber/80">{t('pendingApproval.note')}</p>

        <div className="mt-6 flex flex-col gap-2">
          <Button variant="accent" full onClick={() => void checkAgain()} disabled={checking}>
            <Icon name="refresh" size={17} className={checking ? 'animate-spin' : ''} />
            {t('pendingApproval.checkStatus')}
          </Button>
          <button
            type="button"
            onClick={() => void signOut()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-sand bg-transparent px-4 py-2.5 text-[14px] font-medium text-umber transition-colors hover:border-flame hover:text-flame"
          >
            <Icon name="logout" size={17} />
            {t('pendingApproval.signOut')}
          </button>
        </div>
      </div>
    </div>
  )
}
