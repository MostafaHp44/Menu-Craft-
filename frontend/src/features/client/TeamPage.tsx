import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../../shared/ui/icons.tsx'
import { Badge, Button, Card, EmptyState, Field, IconButton, Input, Modal } from '../../shared/ui/ui.tsx'
import { useI18n } from '../../shared/i18n'
import { useActiveRestaurant, useStore } from '../../shared/store/useStore.ts'
import { useAuthStore } from '../../shared/store/useAuth.ts'
import type { UserAccount } from '../../shared/lib/types.ts'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.slice(0, 1))
    .join('')
    .toUpperCase()
}

export default function TeamPage() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const restaurant = useActiveRestaurant()

  const session = useAuthStore((s) => s.session)
  const accounts = useAuthStore((s) => s.accounts)
  const passwords = useAuthStore((s) => s.passwords)
  const addAccount = useAuthStore((s) => s.addAccount)
  const removeAccount = useAuthStore((s) => s.removeAccount)
  const signIn = useAuthStore((s) => s.signIn)
  const showToast = useStore((s) => s.showToast)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [touched, setTouched] = useState(false)
  const [pendingRemove, setPendingRemove] = useState<UserAccount | null>(null)
  const [viewError, setViewError] = useState('')

  /* staff must not manage the team */
  useEffect(() => {
    if (session?.role === 'worker') navigate('/worker', { replace: true })
  }, [session?.role, navigate])

  const staff = useMemo(
    () =>
      accounts
        .filter((a) => a.role === 'worker' && a.restaurantId === restaurant.id)
        .slice()
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [accounts, restaurant.id]
  )

  const owner =
    session && session.role !== 'worker'
      ? session
      : accounts.find((a) => a.role === 'client' && a.restaurantId === restaurant.id) ?? null

  const trimmedName = name.trim()
  const trimmedEmail = email.trim().toLowerCase()
  const emailValid = EMAIL_RE.test(trimmedEmail)
  const duplicate = trimmedEmail !== '' && accounts.some((a) => a.email.toLowerCase() === trimmedEmail)

  const nameError = touched && !trimmedName ? t('team.errName') : ''
  const emailError = duplicate
    ? t('team.errDuplicate')
    : touched && !emailValid
      ? t('team.errEmail')
      : ''

  const joinedOn = (iso: string) =>
    new Date(iso).toLocaleDateString(lang, { month: 'short', day: 'numeric', year: 'numeric' })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (!trimmedName || !emailValid || duplicate) return
    addAccount({
      name: trimmedName,
      email: trimmedEmail,
      role: 'worker',
      restaurantId: restaurant.id,
      password: password.trim() || undefined,
    })
    showToast({
      tone: 'success',
      title: t('toast.created'),
      message: t('team.added', { name: trimmedName }),
    })
    setName('')
    setEmail('')
    setPassword('')
    setTouched(false)
  }

  /* demo "view as": sign in as that staff member and open their kitchen board */
  const previewAs = (staffEmail: string) => {
    setViewError('')
    const result = signIn(staffEmail)
    if (!result.ok) {
      setViewError(t('flow.suspended'))
      return
    }
    navigate('/worker')
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* ------------------------------ intro ------------------------------ */}
      <div className="space-y-5">
        <Card className="p-5 sm:p-6">
          <h3 className="text-[15.5px] font-semibold text-charcoal">{t('team.title')}</h3>
          <p className="mt-1 text-[13.5px] leading-relaxed text-umber">{t('team.desc')}</p>

          <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-gold/40 bg-gold/10 px-3.5 py-3">
            <Icon name="info" size={15} className="mt-0.5 shrink-0 text-gold" />
            <p className="text-[12.5px] leading-relaxed text-espresso">
              <span className="font-semibold text-charcoal">{t('team.howTitle')}</span>{' '}
              {t('team.howBody')}
            </p>
          </div>
        </Card>

        {/* ---------------------------- add staff ---------------------------- */}
        <Card className="p-5 sm:p-6">
          <h3 className="text-[15.5px] font-semibold text-charcoal">{t('team.addTitle')}</h3>

          <form onSubmit={submit} className="mt-4 space-y-4" noValidate>
            <Field label={t('common.name')} error={nameError}>
              <Input
                value={name}
                placeholder={t('team.namePlaceholder')}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>

            <Field label={t('auth.email')} error={emailError}>
              <Input
                type="email"
                value={email}
                placeholder={t('team.emailPlaceholder')}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>

            <Field label={t('auth.password')} hint={t('team.passwordOptional')}>
              <Input
                type="password"
                autoComplete="new-password"
                value={password}
                placeholder={t('team.passwordPlaceholder')}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>

            <Button type="submit" variant="accent" icon="plus" full>
              {t('team.addBtn')}
            </Button>
          </form>
        </Card>
      </div>

      {/* ---------------------------- staff list ---------------------------- */}
      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-[15.5px] font-semibold text-charcoal">{t('team.staffTitle')}</h3>
          <Badge tone="outline">{t('team.staffCount', { n: staff.length })}</Badge>
        </div>

        <p className="mt-2 flex items-start gap-1.5 text-[12px] leading-relaxed text-clay">
          <Icon name="info" size={13} className="mt-0.5 shrink-0" />
          {t('team.viewAsNote')}
        </p>

        {viewError ? (
          <p className="mt-3 flex items-center gap-2 rounded-xl border border-rose/40 bg-rose/8 px-3.5 py-2.5 text-[13px] text-rose">
            <Icon name="alert" size={15} className="shrink-0" />
            {viewError}
          </p>
        ) : null}

        {owner ? (
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-sand bg-cream/50 p-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-charcoal text-[12.5px] font-semibold text-ivory">
              {initials(owner.name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] font-medium text-charcoal">{owner.name}</p>
              <p className="truncate text-[11.5px] text-umber">{owner.email}</p>
            </div>
            <Badge tone="flame">{t('team.owner')}</Badge>
          </div>
        ) : null}

        {staff.length === 0 ? (
          <div className="mt-4">
            <EmptyState icon="users" title={t('team.empty')} message={t('team.emptySub')} />
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {staff.map((member) => {
              const hasPassword = Boolean(passwords[member.email.toLowerCase()])
              return (
                <li key={member.id} className="rounded-2xl border border-sand bg-paper p-3.5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cream text-[12.5px] font-semibold text-espresso">
                      {initials(member.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-medium text-charcoal">{member.name}</p>
                      <p className="truncate text-[11.5px] text-umber">
                        {member.email}
                        <span className="text-clay">
                          {' · '}
                          {t('team.joined', { date: joinedOn(member.createdAt) })}
                        </span>
                      </p>
                    </div>
                    <Badge
                      tone={hasPassword ? 'moss' : 'outline'}
                      icon={hasPassword ? 'check' : 'mail'}
                      className="shrink-0"
                    >
                      {hasPassword ? t('team.badgePassword') : t('team.badgeLink')}
                    </Badge>
                  </div>

                  <div className="mt-3 flex items-center gap-2 border-t border-sand/70 pt-3">
                    <Button size="sm" variant="outline" icon="eye" onClick={() => previewAs(member.email)}>
                      {t('team.signInAs', { name: member.name })}
                    </Button>
                    <span className="flex-1" />
                    <IconButton
                      icon="trash"
                      label={t('common.remove')}
                      size={15}
                      onClick={() => setPendingRemove(member)}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      {/* ------------------------- remove confirmation ----------------------- */}
      <Modal
        open={Boolean(pendingRemove)}
        onClose={() => setPendingRemove(null)}
        title={t('common.remove')}
        description={t('team.removeConfirm', { name: pendingRemove?.name ?? '' })}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingRemove(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              icon="trash"
              onClick={() => {
                if (pendingRemove) removeAccount(pendingRemove.id)
                setPendingRemove(null)
              }}
            >
              {t('common.delete')}
            </Button>
          </>
        }
      >
        <p className="text-[14px] leading-relaxed text-umber">{t('team.removeBody')}</p>
      </Modal>
    </div>
  )
}
