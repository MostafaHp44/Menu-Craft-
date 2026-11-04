import { useEffect, useState, type ReactNode } from 'react'
import { Badge, Button, Field, Modal, Skeleton, TextArea } from '../../shared/ui/ui.tsx'
import { Icon } from '../../shared/ui/icons.tsx'
import { cx } from '../../shared/lib/utils.ts'
import { useI18n, type TKey } from '../../shared/i18n'

type BadgeTone = 'neutral' | 'flame' | 'moss' | 'gold' | 'rose' | 'outline' | 'dark'

const STATUS_TONES: Record<string, BadgeTone> = {
  pending: 'gold',
  confirmed: 'flame',
  preparing: 'flame',
  ready: 'moss',
  completed: 'moss',
  cancelled: 'rose',
  held: 'gold',
  rejected: 'rose',
  active: 'moss',
  suspended: 'gold',
  removed: 'rose',
  draft: 'outline',
  published: 'moss',
}

export function statusTone(status: string): BadgeTone {
  return STATUS_TONES[status] ?? 'neutral'
}

export function StatusBadge({ status }: { status: string }) {
  const { t } = useI18n()
  const key = `live.status.${status}` as TKey
  return <Badge tone={statusTone(status)}>{t(key)}</Badge>
}

export function PageHeader({
  title,
  sub,
  actions,
}: {
  title: string
  sub: string
  actions?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-charcoal">{title}</h1>
        <p className="mt-1 max-w-2xl text-[13.5px] leading-relaxed text-umber">{sub}</p>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}

export function RefreshButton({ onClick, loading }: { onClick: () => void; loading?: boolean }) {
  const { t } = useI18n()
  return (
    <Button variant="outline" size="sm" icon="refresh" onClick={onClick} loading={loading}>
      {t('live.common.refresh')}
    </Button>
  )
}

export function LoadingBlock({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-14 w-full" />
      ))}
    </div>
  )
}

export function ErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useI18n()
  return (
    <div className="rounded-2xl border border-rose/30 bg-rose/8 px-5 py-6 text-center">
      <span className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-rose/15 text-rose">
        <Icon name="alert" size={18} />
      </span>
      <p className="text-[13.5px] font-medium text-charcoal">{message}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" icon="refresh" className="mt-3" onClick={onRetry}>
          {t('live.common.retry')}
        </Button>
      ) : null}
    </div>
  )
}

export function ApiPendingNote({ children }: { children: ReactNode }) {
  const { t } = useI18n()
  return (
    <div className="rounded-2xl border border-gold/35 bg-gold/8 px-4 py-3.5">
      <div className="flex items-start gap-2.5">
        <Icon name="info" size={16} className="mt-0.5 shrink-0 text-gold" />
        <div className="min-w-0">
          <p className="text-[12.5px] font-semibold text-charcoal">{t('live.common.pendingApi')}</p>
          <p className="mt-0.5 text-[12.5px] leading-relaxed text-umber">{children}</p>
        </div>
      </div>
    </div>
  )
}

export function EmptyBlock({ title, message, action }: { title: string; message: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone bg-cream/40 px-6 py-12 text-center">
      <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-paper text-umber shadow-sm">
        <Icon name="list" size={20} />
      </span>
      <h3 className="text-[15px] font-semibold text-charcoal">{title}</h3>
      <p className="mt-1 max-w-sm text-[13.5px] leading-relaxed text-umber">{message}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-sand bg-paper">
      <table className="w-full min-w-[720px] border-collapse text-start text-[13px]">{children}</table>
    </div>
  )
}

export function Th({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={cx(
        'border-b border-sand/80 bg-cream/50 px-4 py-2.5 text-start text-[11.5px] font-semibold uppercase tracking-[0.08em] text-umber',
        className
      )}
    >
      {children}
    </th>
  )
}

export function Td({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={cx('border-b border-sand/50 px-4 py-3 align-middle text-espresso', className)}>{children}</td>
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  busy,
  danger,
  onClose,
  onConfirm,
}: {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  busy?: boolean
  danger?: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  const { t } = useI18n()
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            {t('live.common.cancel')}
          </Button>
          <Button variant={danger ? 'danger' : 'accent'} onClick={onConfirm} loading={busy}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-[13.5px] leading-relaxed text-umber">{confirmLabel}</p>
    </Modal>
  )
}

export function ReasonDialog({
  open,
  title,
  description,
  confirmLabel,
  busy,
  danger,
  onClose,
  onConfirm,
}: {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  busy?: boolean
  danger?: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
}) {
  const { t } = useI18n()
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setReason('')
      setError('')
    }
  }, [open])

  const submit = () => {
    const value = reason.trim()
    if (!value) {
      setError(t('live.orders.reasonRequired'))
      return
    }
    if (value.length < 3) {
      setError(t('live.orders.reasonShort'))
      return
    }
    onConfirm(value)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            {t('live.common.cancel')}
          </Button>
          <Button variant={danger ? 'danger' : 'accent'} onClick={submit} loading={busy} disabled={busy}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <Field label={t('live.orders.reason')} error={error || undefined}>
        <TextArea
          value={reason}
          onChange={(event) => {
            setReason(event.target.value)
            if (error) setError('')
          }}
          placeholder={t('live.orders.reasonPlaceholder')}
          rows={4}
          autoFocus
        />
      </Field>
    </Modal>
  )
}
