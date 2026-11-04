import { useEffect, useState } from 'react'
import { Button, Card, Field, Input } from '../../shared/ui/ui.tsx'
import { Icon } from '../../shared/ui/icons.tsx'
import { useI18n } from '../../shared/i18n'
import { useSession } from '../../shared/store/useSession.ts'
import { employeesApi, errorMessage } from '../../shared/api/client.ts'
import { ApiPendingNote, PageHeader } from './components.tsx'

export default function AccountPage() {
  const { t } = useI18n()
  const { user, refresh, setUser } = useSession()
  const isOwner = user?.role === 'Owner'

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setSaved(false)
    setError('')
  }, [newPassword, confirmPassword, currentPassword])

  const submit = async () => {
    if (!user) return
    if (!user.needsPasswordChange && !currentPassword) {
      setError(t('live.common.required'))
      return
    }
    if (!newPassword || newPassword.length < 6) {
      setError(t('live.common.required'))
      return
    }
    if (newPassword !== confirmPassword) {
      setError(t('live.account.mismatch'))
      return
    }
    setBusy(true)
    setError('')
    try {
      const result = await employeesApi.changePassword(user.id, {
        currentPassword: user.needsPasswordChange ? undefined : currentPassword || undefined,
        newPassword,
      })
      setUser({
        ...user,
        needsPasswordChange: result.needsPasswordChange ?? false,
        status: result.status ?? user.status,
      })
      setSaved(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      await refresh()
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader title={t('live.account.title')} sub={t('live.account.sub')} />

      <div className="grid gap-4 lg:grid-cols-[1fr_1.15fr]">
        <Card className="p-5">
          <h2 className="text-[15px] font-semibold text-charcoal">{t('live.account.title')}</h2>
          <dl className="mt-3 space-y-2.5">
            <Row label={t('live.common.name')} value={user?.name || '—'} />
            <Row label={t('live.common.email')} value={user?.email ?? '—'} />
            <Row label={t('live.common.role')} value={user?.role ?? '—'} />
            <Row label={t('live.common.status')} value={user?.status ?? '—'} />
          </dl>
          {user?.needsPasswordChange ? (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-gold/35 bg-gold/10 px-3.5 py-3">
              <Icon name="info" size={15} className="mt-0.5 shrink-0 text-gold" />
              <p className="text-[12.5px] leading-relaxed text-charcoal">{t('live.account.firstLogin')}</p>
            </div>
          ) : null}
        </Card>

        <Card className="p-5">
          <h2 className="text-[15px] font-semibold text-charcoal">{t('live.account.changePassword')}</h2>

          {isOwner ? (
            <div className="mt-3">
              <ApiPendingNote>{t('live.account.ownerUnavailable')}</ApiPendingNote>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {!user?.needsPasswordChange ? (
                <Field label={t('live.account.currentPassword')}>
                  <Input
                    type="password"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                  />
                </Field>
              ) : null}
              <Field label={t('live.account.newPassword')}>
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />
              </Field>
              <Field label={t('live.account.confirmPassword')} error={error || undefined}>
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </Field>
              {saved ? (
                <p className="flex items-center gap-1.5 text-[12.5px] text-moss">
                  <Icon name="check" size={13} />
                  {t('live.account.updated')}
                </p>
              ) : null}
              <Button variant="accent" onClick={submit} loading={busy} disabled={busy}>
                {t('live.account.changePassword')}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-sand bg-cream/40 px-3 py-2">
      <dt className="text-[12.5px] text-umber">{label}</dt>
      <dd className="line-clamp-1 text-[13px] font-medium text-charcoal">{value}</dd>
    </div>
  )
}
