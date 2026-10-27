/**
 * Small shared pieces for the platform-admin console.
 * The console sits on a dark (ink) shell, so these helpers lean on the
 * `tone="dark"` / on-dark variants of the shared design system.
 */
import type { ReactNode } from 'react'
import { useI18n } from '../../shared/i18n'
import type { TKey } from '../../shared/i18n'
import { Icon } from '../../shared/ui/icons.tsx'
import { Badge, Card, Toggle } from '../../shared/ui/ui.tsx'
import { SUBSCRIPTIONS } from '../../shared/lib/demoData.ts'
import { cx } from '../../shared/lib/utils.ts'
import type { AdminPermission, DemoPlanId, Role, SubscriptionStatus } from '../../shared/lib/types.ts'

/** light-on-dark equivalent of the shared input styling */
export const DARK_FIELD =
  'border-white/12 bg-white/6 text-ivory placeholder:text-ivory/45 focus:border-flame focus:outline-none focus:ring-4 focus:ring-flame/15'

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <Card className={cx('border-white/10 bg-smoke p-5 sm:p-6', className)}>{children}</Card>
}

export function PanelHeading({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="text-[15.5px] font-semibold text-ivory">{title}</h3>
        {description ? (
          <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-ivory/55">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}

/** small dashed empty-state for the dark shell */
export function DarkEmpty({
  icon = 'sparkles',
  title,
  message,
  action,
}: {
  icon?: string
  title: string
  message: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-white/15 px-6 py-10 text-center">
      <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/8 text-ivory/70">
        <Icon name={icon} size={20} />
      </span>
      <h4 className="text-[14.5px] font-semibold text-ivory">{title}</h4>
      <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-ivory/50">{message}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

/** explanatory strip for demo/simulated notices on the dark shell */
export function DemoNote({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/4 px-4 py-3 text-[12.5px] leading-relaxed text-ivory/60">
      <Icon name="info" size={15} className="mt-0.5 shrink-0 text-flame-light" />
      <span>{children}</span>
    </div>
  )
}

export function PlanBadge({ plan }: { plan: DemoPlanId }) {
  const tone =
    plan === 'trial' ? 'gold' : plan === 'starter' ? 'outline' : plan === 'professional' ? 'flame' : 'moss'
  return <Badge tone={tone}>{SUBSCRIPTIONS[plan].name}</Badge>
}

const SUB_STATUS_KEY: Record<SubscriptionStatus, TKey> = {
  active: 'common.active',
  trialing: 'platformMore.subs.trialing',
  past_due: 'platformMore.subs.pastDue',
  expired: 'platformMore.subs.expired',
}

const SUB_STATUS_TONE: Record<SubscriptionStatus, 'moss' | 'gold' | 'flame' | 'rose'> = {
  active: 'moss',
  trialing: 'gold',
  past_due: 'flame',
  expired: 'rose',
}

export function SubscriptionStatusBadge({ status }: { status: SubscriptionStatus }) {
  const { t } = useI18n()
  return <Badge tone={SUB_STATUS_TONE[status]}>{t(SUB_STATUS_KEY[status])}</Badge>
}

export function roleKey(role: Role): TKey {
  return role === 'super_admin'
    ? 'admin.roleSuperAdmin'
    : role === 'admin'
      ? 'admin.roleAdmin'
      : role === 'worker'
        ? 'admin.roleWorker'
        : 'admin.roleClient'
}

export function permKey(permission: AdminPermission): TKey {
  return `admin.${permission}`
}

/**
 * Wraps the shared `Toggle` in a padded <label> so the effective tap area is
 * ≥40px tall on touch screens (clicks on label padding forward to the control).
 */
export function PaddedToggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  description?: string
}) {
  return (
    <label className="-m-2.5 inline-flex cursor-pointer rounded-2xl p-2.5 transition hover:bg-white/6">
      <Toggle checked={checked} onChange={onChange} label={label} description={description} />
    </label>
  )
}
