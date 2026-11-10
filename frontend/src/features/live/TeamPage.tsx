import { useEffect, useMemo, useState } from 'react'
import { Button, Card, Field, Input, Modal, Select } from '../../shared/ui/ui.tsx'
import { Icon } from '../../shared/ui/icons.tsx'
import { useI18n, type TKey } from '../../shared/i18n'
import { useStore } from '../../shared/store/useStore.ts'
import {
  branchesApi,
  employeesApi,
  errorMessage,
  type Branch,
  type Employee,
} from '../../shared/api/client.ts'
import { useAsync } from './useAsync.ts'
import {
  ConfirmDialog,
  ErrorBlock,
  LoadingBlock,
  PageHeader,
  RefreshButton,
  StatusBadge,
  TableWrap,
  Td,
  Th,
} from './components.tsx'

const ROLES = ['Cashier', 'Kitchen', 'Waiter'] as const
const ACCESS_TYPES = ['all', 'assigned', 'none'] as const
const STATUSES = ['active', 'pending', 'suspended', 'removed'] as const

function roleKey(role: string): TKey {
  const lower = role.toLowerCase()
  if (lower === 'owner' || lower === 'cashier' || lower === 'kitchen' || lower === 'waiter') {
    return `live.roles.${lower}` as TKey
  }
  return 'live.common.unknown'
}

function accessKey(type: string): TKey {
  switch (type) {
    case 'all':
      return 'live.team.accessAll'
    case 'assigned':
      return 'live.team.accessAssigned'
    default:
      return 'live.team.accessNone'
  }
}

export default function TeamPage() {
  const { t } = useI18n()
  const employees = useAsync<Employee[]>(() => employeesApi.list(), [])
  const branches = useAsync<Branch[]>(() => branchesApi.list(), [])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [roleTarget, setRoleTarget] = useState<Employee | null>(null)
  const [accessTarget, setAccessTarget] = useState<Employee | null>(null)
  const [lifecycle, setLifecycle] = useState<Employee | null>(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')

  const branchNames = useMemo(() => {
    const map = new Map<string, string>()
    for (const branch of branches.data ?? []) map.set(branch.id, branch.name)
    return map
  }, [branches.data])

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase()
    return (employees.data ?? []).filter((employee) => {
      if (roleFilter && employee.role_name !== roleFilter) return false
      if (statusFilter && employee.status !== statusFilter) return false
      if (!query) return true
      return `${employee.name} ${employee.email} ${employee.role_name}`.toLowerCase().includes(query)
    })
  }, [employees.data, roleFilter, statusFilter, search])

  const refresh = () => {
    employees.refresh()
    branches.refresh()
  }

  const setLifecycleStatus = async () => {
    if (!lifecycle) return
    setBusy(true)
    setActionError('')
    try {
      if (lifecycle.status === 'suspended') {
        await employeesApi.reactivate(lifecycle.id)
        useStore.getState().showToast({ title: t('live.team.reactivated'), tone: 'success' })
      } else {
        await employeesApi.suspend(lifecycle.id)
        useStore.getState().showToast({ title: t('live.team.suspended'), tone: 'success' })
      }
      setLifecycle(null)
      refresh()
    } catch (error) {
      setActionError(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader
        title={t('live.team.title')}
        sub={t('live.team.sub')}
        actions={
          <>
            <RefreshButton onClick={refresh} loading={employees.loading || branches.loading} />
            <Button variant="accent" size="sm" icon="plus" onClick={() => setCreateOpen(true)}>
              {t('live.team.add')}
            </Button>
          </>
        }
      />

      <Card className="mb-4 p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <Field label={t('live.common.search')}>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('live.team.searchPlaceholder')}
            />
          </Field>
          <Field label={t('live.common.role')}>
            <Select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
              <option value="">{t('live.common.all')}</option>
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {t(roleKey(role))}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('live.common.status')}>
            <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="">{t('live.common.all')}</option>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {t(`live.status.${status}` as TKey)}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Card>

      {employees.error ? <ErrorBlock message={employees.error} onRetry={refresh} /> : null}
      {employees.loading && !employees.data ? <LoadingBlock rows={5} /> : null}
      {actionError ? (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-rose/30 bg-rose/8 px-3 py-2 text-[12.5px] text-rose">
          <Icon name="alert" size={14} />
          {actionError}
        </div>
      ) : null}

      {!employees.loading && !employees.error && rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone bg-cream/40 px-6 py-12 text-center">
          <p className="text-[14px] font-medium text-charcoal">{t('live.team.empty')}</p>
        </div>
      ) : null}

      {rows.length > 0 ? (
        <TableWrap>
          <thead>
            <tr>
              <Th>{t('live.common.name')}</Th>
              <Th>{t('live.common.email')}</Th>
              <Th>{t('live.common.role')}</Th>
              <Th>{t('live.common.status')}</Th>
              <Th>{t('live.common.access')}</Th>
              <Th>{t('live.common.actions')}</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((employee) => (
              <tr key={employee.id} className="hover:bg-cream/40">
                <Td className="font-medium text-charcoal">{employee.name}</Td>
                <Td>{employee.email}</Td>
                <Td>{t(roleKey(employee.role_name))}</Td>
                <Td>
                  <StatusBadge status={employee.status} />
                </Td>
                <Td>
                  <span className="text-[12.5px] text-umber">{t(accessKey(employee.branch_access_type))}</span>
                  {employee.branch_access_type === 'assigned' && employee.branch_ids.length > 0 ? (
                    <span className="mt-0.5 block text-[11.5px] text-clay">
                      {employee.branch_ids.map((id) => branchNames.get(id) ?? id.slice(0, 6)).join(' · ')}
                    </span>
                  ) : null}
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-1.5">
                    <Button variant="outline" size="sm" onClick={() => setEditing(employee)} disabled={employee.status === 'removed'}>
                      {t('live.team.editTitle')}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setRoleTarget(employee)} disabled={employee.status === 'removed'}>
                      {t('live.team.changeRole')}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setAccessTarget(employee)} disabled={employee.status === 'removed'}>
                      {t('live.team.assignTitle')}
                    </Button>
                    {employee.status === 'active' || employee.status === 'suspended' ? (
                      <Button
                        variant={employee.status === 'suspended' ? 'ghost' : 'danger'}
                        size="sm"
                        onClick={() => setLifecycle(employee)}
                      >
                        {employee.status === 'suspended' ? t('live.team.reactivate') : t('live.team.suspend')}
                      </Button>
                    ) : null}
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      ) : null}

      <p className="mt-4 text-[11.5px] leading-relaxed text-clay">{t('live.team.noDelete')}</p>

      <CreateEmployeeModal
        open={createOpen}
        branches={branches.data ?? []}
        onClose={() => setCreateOpen(false)}
        onSaved={() => {
          setCreateOpen(false)
          refresh()
        }}
      />

      <EditEmployeeModal
        employee={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null)
          refresh()
        }}
      />

      <RoleModal
        employee={roleTarget}
        onClose={() => setRoleTarget(null)}
        onSaved={() => {
          setRoleTarget(null)
          refresh()
        }}
      />

      <AccessModal
        employee={accessTarget}
        branches={branches.data ?? []}
        onClose={() => setAccessTarget(null)}
        onSaved={() => {
          setAccessTarget(null)
          refresh()
        }}
      />

      <ConfirmDialog
        open={Boolean(lifecycle)}
        title={lifecycle?.status === 'suspended' ? t('live.team.reactivate') : t('live.team.suspend')}
        description={lifecycle ? `${lifecycle.name} · ${lifecycle.email}` : ''}
        confirmLabel={lifecycle?.status === 'suspended' ? t('live.team.reactivate') : t('live.team.suspend')}
        busy={busy}
        danger={lifecycle?.status !== 'suspended'}
        onClose={() => setLifecycle(null)}
        onConfirm={setLifecycleStatus}
      />
    </div>
  )
}

function CreateEmployeeModal({
  open,
  branches,
  onClose,
  onSaved,
}: {
  open: boolean
  branches: Branch[]
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useI18n()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [password, setPassword] = useState('')
  const [accessType, setAccessType] = useState('none')
  const [selected, setSelected] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setName('')
    setEmail('')
    setRole('')
    setPassword('')
    setAccessType('none')
    setSelected([])
    setError('')
  }, [open])

  const save = async () => {
    if (!name.trim() || !email.trim() || !password) {
      setError(t('live.common.required'))
      return
    }
    if (!role) {
      setError('Please select a role')
      return
    }
    if (password.length < 6) {
      setError(t('live.common.required'))
      return
    }
    if (accessType === 'assigned' && selected.length === 0) {
      setError(t('live.team.atLeastOneBranch'))
      return
    }
    setBusy(true)
    setError('')
    try {
      await employeesApi.create({
        name: name.trim(),
        email: email.trim(),
        role,
        password,
        branchAccessType: accessType,
        branchIds: accessType === 'assigned' ? selected : [],
      })
      useStore.getState().showToast({ title: t('live.team.created'), tone: 'success' })
      onSaved()
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('live.team.createTitle')}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            {t('live.common.cancel')}
          </Button>
          <Button variant="accent" onClick={save} loading={busy}>
            {t('live.common.save')}
          </Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t('live.common.name')}>
          <Input value={name} onChange={(event) => setName(event.target.value)} autoFocus />
        </Field>
        <Field label={t('live.common.email')}>
          <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </Field>
        <Field label={t('live.common.role')}>
          <Select value={role} onChange={(event) => setRole(event.target.value)}>
            <option value="">{t('live.common.selectRole')}</option>
            {ROLES.map((item) => (
              <option key={item} value={item}>
                {t(roleKey(item))}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('live.common.password')} hint={t('live.account.firstLogin')}>
          <Input type="text" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="min. 6" />
        </Field>
        <Field label={t('live.common.access')}>
          <Select
            value={accessType}
            onChange={(event) => {
              setAccessType(event.target.value)
              if (event.target.value !== 'assigned') setSelected([])
            }}
          >
            {ACCESS_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(accessKey(type))}
              </option>
            ))}
          </Select>
        </Field>
        {accessType === 'assigned' ? (
          <div className="sm:col-span-2">
            <p className="mb-1.5 text-[13px] font-medium text-espresso">{t('live.team.selectBranches')}</p>
            <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-xl border border-sand p-2.5">
              {branches.map((branch) => (
                <label key={branch.id} className="flex items-center gap-2 text-[13px] text-espresso">
                  <input
                    type="checkbox"
                    checked={selected.includes(branch.id)}
                    onChange={(event) =>
                      setSelected((current) =>
                        event.target.checked ? [...current, branch.id] : current.filter((id) => id !== branch.id)
                      )
                    }
                  />
                  {branch.name}
                </label>
              ))}
            </div>
          </div>
        ) : null}
        {error ? <p className="sm:col-span-2 text-[12.5px] text-rose">{error}</p> : null}
      </div>
    </Modal>
  )
}

function EditEmployeeModal({
  employee,
  onClose,
  onSaved,
}: {
  employee: Employee | null
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useI18n()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!employee) return
    setName(employee.name)
    setEmail(employee.email)
    setError('')
  }, [employee])

  const save = async () => {
    if (!employee) return
    setBusy(true)
    setError('')
    try {
      await employeesApi.update(employee.id, { name: name.trim(), email: email.trim() })
      useStore.getState().showToast({ title: t('live.team.updated'), tone: 'success' })
      onSaved()
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={Boolean(employee)}
      onClose={onClose}
      title={t('live.team.editTitle')}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            {t('live.common.cancel')}
          </Button>
          <Button variant="accent" onClick={save} loading={busy}>
            {t('live.common.save')}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label={t('live.common.name')}>
          <Input value={name} onChange={(event) => setName(event.target.value)} autoFocus />
        </Field>
        <Field label={t('live.common.email')}>
          <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </Field>
        {error ? <p className="text-[12.5px] text-rose">{error}</p> : null}
      </div>
    </Modal>
  )
}

function RoleModal({
  employee,
  onClose,
  onSaved,
}: {
  employee: Employee | null
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useI18n()
  const [role, setRole] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!employee) return
    setRole(ROLES.includes(employee.role_name as (typeof ROLES)[number]) ? employee.role_name : 'Cashier')
    setError('')
  }, [employee])

  const save = async () => {
    if (!employee) return
    setBusy(true)
    setError('')
    try {
      await employeesApi.setRole(employee.id, role)
      useStore.getState().showToast({ title: t('live.team.updated'), tone: 'success' })
      onSaved()
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={Boolean(employee)}
      onClose={onClose}
      title={t('live.team.changeRole')}
      description={employee?.name}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            {t('live.common.cancel')}
          </Button>
          <Button variant="accent" onClick={save} loading={busy}>
            {t('live.common.save')}
          </Button>
        </>
      }
    >
      <Field label={t('live.common.role')}>
        <Select value={role} onChange={(event) => setRole(event.target.value)}>
          {ROLES.map((item) => (
            <option key={item} value={item}>
              {t(roleKey(item))}
            </option>
          ))}
        </Select>
      </Field>
      {error ? <p className="mt-2 text-[12.5px] text-rose">{error}</p> : null}
    </Modal>
  )
}

function AccessModal({
  employee,
  branches,
  onClose,
  onSaved,
}: {
  employee: Employee | null
  branches: Branch[]
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useI18n()
  const [accessType, setAccessType] = useState('none')
  const [selected, setSelected] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!employee) return
    setAccessType(employee.branch_access_type || 'none')
    setSelected(employee.branch_ids ?? [])
    setError('')
  }, [employee])

  const save = async () => {
    if (!employee) return
    if (accessType === 'assigned' && selected.length === 0) {
      setError(t('live.team.atLeastOneBranch'))
      return
    }
    setBusy(true)
    setError('')
    try {
      await employeesApi.setBranches(employee.id, accessType, accessType === 'assigned' ? selected : [])
      useStore.getState().showToast({ title: t('live.team.updated'), tone: 'success' })
      onSaved()
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={Boolean(employee)}
      onClose={onClose}
      title={t('live.team.assignTitle')}
      description={employee?.name}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            {t('live.common.cancel')}
          </Button>
          <Button variant="accent" onClick={save} loading={busy}>
            {t('live.common.save')}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label={t('live.common.access')}>
          <Select
            value={accessType}
            onChange={(event) => {
              setAccessType(event.target.value)
              if (event.target.value !== 'assigned') setSelected([])
            }}
          >
            {ACCESS_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(accessKey(type))}
              </option>
            ))}
          </Select>
        </Field>
        {accessType === 'assigned' ? (
          <div className="max-h-48 space-y-1.5 overflow-y-auto rounded-xl border border-sand p-2.5">
            {branches.length === 0 ? (
              <p className="text-[12.5px] text-umber">{t('live.team.noBranches')}</p>
            ) : (
              branches.map((branch) => (
                <label key={branch.id} className="flex items-center gap-2 text-[13px] text-espresso">
                  <input
                    type="checkbox"
                    checked={selected.includes(branch.id)}
                    onChange={(event) =>
                      setSelected((current) =>
                        event.target.checked ? [...current, branch.id] : current.filter((id) => id !== branch.id)
                      )
                    }
                  />
                  {branch.name}
                </label>
              ))
            )}
          </div>
        ) : null}
        {error ? <p className="text-[12.5px] text-rose">{error}</p> : null}
      </div>
    </Modal>
  )
}
