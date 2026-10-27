import { useState } from 'react'
import { Icon } from '../../components/icons'
import { Badge, Button, Card, Modal, StatCard } from '../../components/ui'
import { PLANS, SUBSCRIPTIONS } from '../../lib/demoData'
import type { DemoPlanId } from '../../lib/types'
import { cx, money } from '../../lib/utils'
import { useActiveRestaurant, useStore } from '../../store/useStore'

const INVOICES = [
  { id: 'INV-2026-1012', date: 'Oct 12, 2026', amount: 29, status: 'Paid' },
  { id: 'INV-2026-0912', date: 'Sep 12, 2026', amount: 29, status: 'Paid' },
  { id: 'INV-2026-0812', date: 'Aug 12, 2026', amount: 29, status: 'Paid' },
  { id: 'INV-2026-0712', date: 'Jul 12, 2026', amount: 29, status: 'Paid' },
]

const USAGE = [
  { label: 'Menu items', used: 41, limit: 999, unit: 'unlimited above 999' },
  { label: 'Photos stored', used: 26, limit: 200, unit: 'photos' },
  { label: 'Monthly menu views', used: 12480, limit: 50000, unit: 'views' },
  { label: 'Restaurant sites', used: 3, limit: 10, unit: 'sites' },
]

export default function SubscriptionPage() {
  const r = useActiveRestaurant()
  const setPlan = useStore((s) => s.setPlan)
  const [pending, setPending] = useState<DemoPlanId | null>(null)

  const current = SUBSCRIPTIONS[r.plan]

  const confirm = () => {
    if (pending) setPlan(pending)
    setPending(null)
  }

  return (
    <div className="space-y-5">
      {/* current plan */}
      <Card className="relative overflow-hidden p-6">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="eyebrow">Current plan</span>
              <Badge tone={current.status === 'trialing' ? 'gold' : 'moss'} icon="check">
                {current.status === 'trialing' ? 'Trialing' : 'Active'}
              </Badge>
            </div>
            <h2 className="display-serif mt-2.5 text-[clamp(26px,3.4vw,36px)] leading-tight text-charcoal">
              {current.name}
              <span className="ml-3 align-middle font-sans text-[16px] font-medium text-umber">
                {current.price === 0 ? 'Free' : `${money(current.price)} ${current.period}`}
              </span>
            </h2>
            <p className="mt-2 text-[14px] text-umber">{current.renews}</p>
            <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
              {current.features.map((feature) => (
                <li key={feature} className="flex items-center gap-1.5 text-[13px] text-espresso">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-moss/15 text-moss">
                    <Icon name="check" size={11} strokeWidth={3} />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-sand bg-cream/60 p-5">
            <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-umber">
              Usage this cycle
            </span>
            <div className="mt-3.5 space-y-3.5">
              {USAGE.map((row) => {
                const pct = Math.min(100, Math.round((row.used / row.limit) * 100))
                return (
                  <div key={row.label}>
                    <div className="flex items-baseline justify-between text-[12.5px]">
                      <span className="text-espresso">{row.label}</span>
                      <span className="font-medium text-charcoal">
                        {row.used.toLocaleString()}
                        <span className="text-clay"> / {row.limit === 999 ? '∞' : row.limit.toLocaleString()}</span>
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-stone/60">
                      <div
                        className={cx('h-full rounded-full transition-all', pct > 85 ? 'bg-flame' : 'bg-moss')}
                        style={{ width: `${Math.max(4, pct)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="mt-3.5 text-[11.5px] text-clay">Usage figures are simulated for the demo.</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Monthly total" value="$29.00" icon="card" />
        <StatCard label="Next invoice" value="Nov 12" icon="clock" />
        <StatCard label="Payment method" value="•••• 4242" icon="info" />
      </div>

      {/* plans */}
      <div>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-[16px] font-semibold text-charcoal">Demo plans</h3>
            <p className="mt-0.5 text-[13px] text-umber">
              Switch freely — this prototype never processes a payment.
            </p>
          </div>
          <Badge tone="gold" icon="alert">Simulation only</Badge>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {PLANS.map((plan) => {
            const active = r.plan === plan.id
            return (
              <Card
                key={plan.id}
                className={cx(
                  'flex flex-col p-5',
                  plan.highlight && 'border-charcoal shadow-[0_24px_60px_-45px_rgba(27,23,20,0.9)]',
                  active && 'ring-2 ring-flame/40'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-[15.5px] font-semibold text-charcoal">{plan.name}</h4>
                  {plan.highlight ? <Badge tone="flame">Most popular</Badge> : null}
                  {active ? <Badge tone="moss">Current</Badge> : null}
                </div>
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-[32px] font-semibold leading-none tracking-[-0.03em] text-charcoal">
                    {plan.price === 0 ? '$0' : `$${plan.price}`}
                  </span>
                  <span className="text-[13px] text-umber">{plan.period}</span>
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-umber">{plan.blurb}</p>
                <ul className="mt-4 flex-1 space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-[13px] text-espresso">
                      <Icon name="check" size={14} className="mt-0.5 shrink-0 text-moss" strokeWidth={2.4} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-5"
                  full
                  variant={active ? 'outline' : plan.highlight ? 'accent' : 'dark'}
                  disabled={active}
                  onClick={() => setPending(plan.id)}
                >
                  {active ? 'Current plan' : plan.price > current.price ? 'Upgrade' : 'Switch plan'}
                </Button>
              </Card>
            )
          })}
        </div>
      </div>

      {/* invoices */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-sand/80 px-5 py-4">
          <h3 className="text-[15px] font-semibold text-charcoal">Billing history</h3>
          <Badge tone="neutral">Demo records</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left">
            <thead>
              <tr className="text-[11.5px] uppercase tracking-[0.14em] text-clay">
                <th className="px-5 py-2.5 font-semibold">Invoice</th>
                <th className="px-5 py-2.5 font-semibold">Date</th>
                <th className="px-5 py-2.5 font-semibold">Amount</th>
                <th className="px-5 py-2.5 font-semibold">Status</th>
                <th className="px-5 py-2.5 text-right font-semibold">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand/70">
              {INVOICES.map((invoice) => (
                <tr key={invoice.id} className="text-[13.5px]">
                  <td className="px-5 py-3 font-mono text-[12.5px] text-espresso">{invoice.id}</td>
                  <td className="px-5 py-3 text-umber">{invoice.date}</td>
                  <td className="px-5 py-3 font-medium text-charcoal">{money(invoice.amount)}</td>
                  <td className="px-5 py-3">
                    <Badge tone="moss">{invoice.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Button size="sm" variant="ghost" icon="download" disabled>
                      PDF
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-sand/70 bg-cream/40 px-5 py-3 text-[11.5px] text-clay">
          No invoices were ever issued — these rows exist to demonstrate the billing screen.
        </p>
      </Card>

      <Modal
        open={pending !== null}
        onClose={() => setPending(null)}
        title="Switch plan?"
        description="Demo only — no card is charged and no invoice is created."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPending(null)}>
              Cancel
            </Button>
            <Button icon="check" onClick={confirm}>
              Confirm switch
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-[14px] leading-relaxed text-umber">
          <p>
            Your workspace will move to{' '}
            <strong className="font-semibold text-charcoal">
              {pending ? PLANS.find((p) => p.id === pending)?.name : ''}
            </strong>{' '}
            ({pending ? money(PLANS.find((p) => p.id === pending)?.price ?? 0) : ''}{' '}
            {pending ? PLANS.find((p) => p.id === pending)?.period : ''}).
          </p>
          <div className="rounded-xl border border-sand bg-cream/60 p-3.5 text-[13px]">
            <div className="flex items-center gap-2 font-medium text-espresso">
              <Icon name="info" size={14} className="text-flame" />
              What really happens
            </div>
            <p className="mt-1">
              Only the plan label stored in this browser changes. Payment, invoices and limits are simulated.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  )
}
