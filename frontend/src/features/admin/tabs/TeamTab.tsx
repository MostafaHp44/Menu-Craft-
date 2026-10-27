import { useEffect, useState } from 'react'
import { useI18n } from '../../../shared/i18n'
import { Icon } from '../../../shared/ui/icons.tsx'
import {
  Badge,
  Button,
  Field,
  Input,
  Modal,
  Segmented,
} from '../../../shared/ui/ui.tsx'
import { useAuthStore } from '../../../shared/store/useAuth.ts'
import { useStore } from '../../../shared/store/useStore.ts'
import { ALL_PERMISSIONS } from '../../../shared/lib/types.ts'
import type { AdminPermission, Role, UserAccount } from '../../../shared/lib/types.ts'
import { cx } from '../../../shared/lib/utils.ts'
import { DemoNote, Panel, PanelHeading, permKey, roleKey } from '../parts.tsx'

const ROLE_GROUPS: Role[] = ['super_admin', 'admin', 'worker', 'client']

const ROLE_TONE: Record<Role, 'flame' | 'gold' | 'neutral' | 'outline'> = {
  super_admin: 'flame',
  admin: 'gold',
  worker: 'neutral',
  client: 'outline',
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.slice(0, 1))
    .join('')
    .toUpperCase()
}

function PermissionEditor({ account }: { account: UserAccount }) {
  const { t } = useI18n()
  const updateAccount = useAuthStore((s) => s.updateAccount)
  const showToast = useStore((s) => s.showToast)
  const [draft, setDraft] = useState<AdminPermission[]>(account.permissions ?? [])

  useEffect(() => {
    setDraft(account.permissions ?? [])
  }, [account.permissions])

  const current = account.permissions ?? []
  const dirty =
    draft.length !== current.length || draft.some((permission) => !current.includes(permission))

  const toggle = (permission: AdminPermission) =>
    setDraft((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    )

  return (
    <div className="mt-3 rounded-2xl border border-white/8 bg-white/4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-ivory/45">
          {t('platformMore.team.permissionsFor', { name: account.name })}
        </span>
        {dirty ? (
          <span className="text-[11.5px] font-medium text-gold">{t('dashboard.unsaved')}</span>
        ) : null}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {ALL_PERMISSIONS.map((permission) => {
          const checked = draft.includes(permission)
          return (
            <label
              key={permission}
              className={cx(
                'flex min-h-10 cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 text-[13px] transition',
                checked
                  ? 'border-flame/50 bg-flame/12 text-ivory'
                  : 'border-white/10 text-ivory/60 hover:bg-white/6'
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(permission)}
                className="h-4 w-4 shrink-0 accent-flame"
              />
              <span className="min-w-0 truncate">{t(permKey(permission))}</span>
            </label>
          )
        })}
      </div>

      <div className="mt-3 flex items-center gap-3">
        <Button
          size="sm"
          className="h-10"
          variant="accent"
          icon="save"
          disabled={!dirty}
          onClick={() => {
            const next = ALL_PERMISSIONS.filter((p) => draft.includes(p))
            updateAccount(account.id, (a) => {
              a.permissions = next
            })
            showToast({
              tone: 'success',
              title: t('toast.updated'),
              message: t('platformMore.team.permissionsSaved', { name: account.name }),
            })
          }}
        >
          {t('admin.savePermissions')}
        </Button>
        <span className="text-[12px] text-ivory/45">
          {t('platformMore.team.superAdminNote')}
        </span>
      </div>
    </div>
  )
}

export default function TeamTab() {
  const { t } = useI18n()
  const accounts = useAuthStore((s) => s.accounts)
  const session = useAuthStore((s) => s.session)
  const addAccount = useAuthStore((s) => s.addAccount)
  const restaurants = useStore((s) => s.restaurants)
  const showToast = useStore((s) => s.showToast)

  const canAddSuper = session?.role === 'super_admin'
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState<'admin' | 'super_admin'>('admin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  const trimmedName = name.trim()
  const trimmedEmail = email.trim()

  const submit = () => {
    if (!trimmedName || !trimmedEmail) return
    addAccount({ name: trimmedName, email: trimmedEmail, role })
    showToast({
      tone: 'success',
      title: t('toast.created'),
      message: t('platformMore.team.addedMsg', { name: trimmedName }),
    })
    setName('')
    setEmail('')
    setRole('admin')
    setOpen(false)
  }

  return (
    <div className="space-y-5">
      <Panel>
        <PanelHeading
          title={t('admin.team')}
          description={t('platformMore.team.superAdminNote')}
          actions={
            <Button variant="accent" icon="plus" onClick={() => setOpen(true)}>
              {canAddSuper ? t('admin.addSuperAdmin') : t('admin.addAdmin')}
            </Button>
          }
        />

        <div className="mt-4">
          <DemoNote>{t('platformMore.access.restrictedNote')}</DemoNote>
        </div>

        <div className="mt-5 space-y-5">
          {ROLE_GROUPS.map((group) => {
            const list = accounts.filter((a) => a.role === group)
            if (list.length === 0) return null
            return (
              <div key={group}>
                <div className="flex items-center gap-3">
                  <Badge tone={ROLE_TONE[group]}>{t(roleKey(group))}</Badge>
                  <span className="text-[12px] text-ivory/45">{list.length}</span>
                  <span className="h-px flex-1 bg-white/8" />
                </div>

                <ul className="mt-3 space-y-3">
                  {list.map((account) => {
                    const restaurant = account.restaurantId
                      ? restaurants.find((r) => r.id === account.restaurantId)
                      : undefined
                    return (
                      <li key={account.id} className="rounded-2xl border border-white/10 bg-white/4 p-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/8 text-[12.5px] font-semibold text-ivory/80">
                            {initials(account.name)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[13.5px] font-medium text-ivory">
                              {account.name}
                            </div>
                            <div className="truncate text-[11.5px] text-ivory/45">
                              {account.email}
                              {restaurant ? ` · ${restaurant.name}` : ''}
                            </div>
                          </div>
                          <Badge tone={account.status === 'active' ? 'moss' : 'rose'}>
                            {account.status === 'active'
                              ? t('common.active')
                              : t('common.suspended')}
                          </Badge>
                        </div>

                        {account.role === 'admin' ? (
                          <PermissionEditor account={account} />
                        ) : account.role === 'super_admin' ? (
                          <div className="mt-3 flex items-center gap-2 text-[12px] text-ivory/50">
                            <Icon name="info" size={14} className="text-flame-light" />
                            {t('platformMore.team.superAdminNote')}
                          </div>
                        ) : null}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>
      </Panel>

      {/* add member modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={role === 'super_admin' ? t('admin.addSuperAdmin') : t('admin.addAdmin')}
        description={t('platformMore.team.superAdminNote')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="accent"
              icon="plus"
              disabled={!trimmedName || !trimmedEmail}
              onClick={submit}
            >
              {t('common.add')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label={t('common.name')}>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('platformMore.team.namePh')}
            />
          </Field>
          <Field label={t('auth.email')}>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('platformMore.team.emailPh')}
            />
          </Field>
          <Field label={t('admin.role')}>
            {canAddSuper ? (
              <Segmented<'admin' | 'super_admin'>
                full
                value={role}
                onChange={setRole}
                ariaLabel={t('admin.role')}
                options={[
                  { value: 'admin', label: t('admin.roleAdmin') },
                  { value: 'super_admin', label: t('admin.roleSuperAdmin') },
                ]}
              />
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-sand bg-cream/60 px-3.5 py-3 text-sm text-espresso">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-flame/12 text-flame-dark">
                  <Icon name="settings" size={15} />
                </span>
                {t('admin.roleAdmin')}
              </div>
            )}
          </Field>
          <Field label={t('admin.permissions')} hint={t('platformMore.team.superAdminNote')}>
            <div className="flex flex-wrap gap-2">
              {ALL_PERMISSIONS.map((permission) => (
                <Badge key={permission} tone="outline">
                  {t(permKey(permission))}
                </Badge>
              ))}
            </div>
          </Field>
        </div>
      </Modal>
    </div>
  )
}
