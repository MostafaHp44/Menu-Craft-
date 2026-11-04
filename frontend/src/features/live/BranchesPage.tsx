import { useEffect, useState } from 'react'
import { Button, Card, Field, Input, Modal, Toggle } from '../../shared/ui/ui.tsx'
import { Icon } from '../../shared/ui/icons.tsx'
import { useI18n } from '../../shared/i18n'
import { useStore } from '../../shared/store/useStore.ts'
import { branchesApi, errorMessage, isOn, type Branch } from '../../shared/api/client.ts'
import { useAsync } from './useAsync.ts'
import {
  EmptyBlock,
  ErrorBlock,
  LoadingBlock,
  PageHeader,
  RefreshButton,
  StatusBadge,
  TableWrap,
  Td,
  Th,
} from './components.tsx'

export default function BranchesPage() {
  const { t } = useI18n()
  const list = useAsync<Branch[]>(() => branchesApi.list(), [])
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<Branch | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')

  const toggle = async (branch: Branch, payload: { is_active?: boolean; accepting_orders?: boolean }) => {
    setBusyId(branch.id)
    setActionError('')
    try {
      await branchesApi.update(branch.id, payload)
      useStore.getState().showToast({ title: t('live.branches.updated'), tone: 'success' })
      list.refresh()
    } catch (error) {
      setActionError(errorMessage(error))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <PageHeader
        title={t('live.branches.title')}
        sub={t('live.branches.sub')}
        actions={
          <>
            <RefreshButton onClick={list.refresh} loading={list.loading} />
            <Button variant="accent" size="sm" icon="plus" onClick={() => setCreateOpen(true)}>
              {t('live.branches.add')}
            </Button>
          </>
        }
      />

      {list.error ? <ErrorBlock message={list.error} onRetry={list.refresh} /> : null}
      {list.loading && !list.data ? <LoadingBlock rows={4} /> : null}
      {actionError ? (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-rose/30 bg-rose/8 px-3 py-2 text-[12.5px] text-rose">
          <Icon name="alert" size={14} />
          {actionError}
        </div>
      ) : null}

      {!list.loading && !list.error && (list.data ?? []).length === 0 ? (
        <EmptyBlock
          title={t('live.branches.title')}
          message={t('live.branches.empty')}
          action={
            <Button variant="accent" size="sm" icon="plus" onClick={() => setCreateOpen(true)}>
              {t('live.branches.add')}
            </Button>
          }
        />
      ) : null}

      {(list.data ?? []).length > 0 ? (
        <TableWrap>
          <thead>
            <tr>
              <Th>{t('live.common.name')}</Th>
              <Th>{t('live.common.address')}</Th>
              <Th>{t('live.common.phone')}</Th>
              <Th>{t('live.common.status')}</Th>
              <Th>{t('live.branches.accepting')}</Th>
              <Th>{t('live.common.actions')}</Th>
            </tr>
          </thead>
          <tbody>
            {(list.data ?? []).map((branch) => (
              <tr key={branch.id} className="hover:bg-cream/40">
                <Td className="font-medium text-charcoal">{branch.name}</Td>
                <Td>{branch.address ?? '—'}</Td>
                <Td>{branch.phone ?? '—'}</Td>
                <Td>
                  <StatusBadge status={isOn(branch.is_active) ? 'active' : 'suspended'} />
                </Td>
                <Td>
                  {isOn(branch.accepting_orders) ? (
                    <span className="rounded-full bg-moss/12 px-2.5 py-1 text-[11.5px] font-medium text-moss">
                      {t('live.branches.accepting')}
                    </span>
                  ) : (
                    <span className="rounded-full bg-rose/10 px-2.5 py-1 text-[11.5px] font-medium text-rose">
                      {t('live.branches.pauseOrders')}
                    </span>
                  )}
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-1.5">
                    <Button variant="outline" size="sm" onClick={() => setEditing(branch)}>
                      {t('live.branches.edit')}
                    </Button>
                    <Button
                      variant={isOn(branch.is_active) ? 'danger' : 'ghost'}
                      size="sm"
                      disabled={busyId === branch.id}
                      onClick={() => toggle(branch, { is_active: !isOn(branch.is_active) })}
                    >
                      {isOn(branch.is_active) ? t('live.branches.deactivate') : t('live.branches.activate')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busyId === branch.id}
                      onClick={() => toggle(branch, { accepting_orders: !isOn(branch.accepting_orders) })}
                    >
                      {isOn(branch.accepting_orders) ? t('live.branches.pauseOrders') : t('live.branches.resumeOrders')}
                    </Button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      ) : null}

      <BranchForm
        open={createOpen}
        title={t('live.branches.createTitle')}
        onClose={() => setCreateOpen(false)}
        onSaved={() => {
          setCreateOpen(false)
          list.refresh()
        }}
      />
      <BranchForm
        open={Boolean(editing)}
        title={t('live.branches.editTitle')}
        branch={editing ?? undefined}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null)
          list.refresh()
        }}
      />
    </div>
  )
}

function BranchForm({
  open,
  title,
  branch,
  onClose,
  onSaved,
}: {
  open: boolean
  title: string
  branch?: Branch
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useI18n()
  const [name, setName] = useState(branch?.name ?? '')
  const [address, setAddress] = useState(branch?.address ?? '')
  const [phone, setPhone] = useState(branch?.phone ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // load the selected branch into the form whenever the dialog opens
  useEffect(() => {
    if (!open) return
    setName(branch?.name ?? '')
    setAddress(branch?.address ?? '')
    setPhone(branch?.phone ?? '')
    setError('')
  }, [open, branch?.id, branch?.name, branch?.address, branch?.phone])

  const save = async () => {
    if (!name.trim()) {
      setError(t('live.branches.nameRequired'))
      return
    }
    setBusy(true)
    setError('')
    try {
      if (branch) {
        await branchesApi.update(branch.id, {
          name: name.trim(),
          address: address.trim() || null,
          phone: phone.trim() || null,
        })
      } else {
        await branchesApi.create({
          name: name.trim(),
          address: address.trim() || undefined,
          phone: phone.trim() || undefined,
        })
      }
      useStore.getState().showToast({
        title: branch ? t('live.branches.updated') : t('live.branches.created'),
        tone: 'success',
      })
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
      title={title}
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
        <Field label={t('live.common.name')} error={error || undefined}>
          <Input value={name} onChange={(event) => setName(event.target.value)} autoFocus />
        </Field>
        <Field label={t('live.common.address')} hint={t('live.common.optional')}>
          <Input value={address} onChange={(event) => setAddress(event.target.value)} />
        </Field>
        <Field label={t('live.common.phone')} hint={t('live.common.optional')}>
          <Input value={phone} onChange={(event) => setPhone(event.target.value)} />
        </Field>
        {branch ? (
          <Card className="space-y-3 p-3">
            <Toggle
              checked={isOn(branch.is_active)}
              onChange={(value) => {
                void branchesApi
                  .update(branch.id, { is_active: value })
                  .then(() => {
                    useStore.getState().showToast({ title: t('live.branches.updated'), tone: 'success' })
                    onSaved()
                  })
                  .catch((reason: unknown) => setError(errorMessage(reason)))
              }}
              label={t('live.branches.active')}
            />
            <Toggle
              checked={isOn(branch.accepting_orders)}
              onChange={(value) => {
                void branchesApi
                  .update(branch.id, { accepting_orders: value })
                  .then(() => {
                    useStore.getState().showToast({ title: t('live.branches.updated'), tone: 'success' })
                    onSaved()
                  })
                  .catch((reason: unknown) => setError(errorMessage(reason)))
              }}
              label={t('live.branches.accepting')}
            />
          </Card>
        ) : null}
      </div>
    </Modal>
  )
}
