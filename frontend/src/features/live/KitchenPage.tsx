import { useEffect, useState } from 'react'
import { Button, Card } from '../../shared/ui/ui.tsx'
import { Icon } from '../../shared/ui/icons.tsx'
import { useI18n, type TKey } from '../../shared/i18n'
import { cx } from '../../shared/lib/utils.ts'
import { useStore } from '../../shared/store/useStore.ts'
import { useSession } from '../../shared/store/useSession.ts'
import { errorMessage, kitchenApi, orderNumber, type Order } from '../../shared/api/client.ts'
import { useAsync } from './useAsync.ts'
import {
  ErrorBlock,
  LoadingBlock,
  PageHeader,
  ReasonDialog,
  RefreshButton,
  StatusBadge,
} from './components.tsx'
import { formatDateTime, formatNumber } from './format.ts'

const TABS = ['confirmed', 'preparing', 'ready'] as const

export default function KitchenPage() {
  const { t } = useI18n()
  const [status, setStatus] = useState<string>('confirmed')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')
  const user = useSession((state) => state.user)
  const list = useAsync(() => kitchenApi.list({ status, restaurantId: user?.restaurant_id }), [status, user?.restaurant_id])

  useEffect(() => {
    const timer = window.setInterval(() => list.refresh(), 20000)
    return () => window.clearInterval(timer)
  }, [list.refresh])

  const run = async (id: string, action: () => Promise<unknown>, success: string) => {
    setBusyId(id)
    setActionError('')
    try {
      await action()
      useStore.getState().showToast({ title: success, tone: 'success' })
      list.refresh()
    } catch (error) {
      setActionError(errorMessage(error))
      useStore.getState().showToast({ title: errorMessage(error), tone: 'error' })
    } finally {
      setBusyId(null)
    }
  }

  const reject = async () => {
    if (!rejectId) return
    await run(rejectId, () => kitchenApi.reject(rejectId), t('live.orders.rejected'))
    setRejectId(null)
  }

  return (
    <div>
      <PageHeader
        title={t('live.kitchen.title')}
        sub={t('live.kitchen.sub')}
        actions={<RefreshButton onClick={list.refresh} loading={list.loading} />}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setStatus(tab)}
            aria-pressed={status === tab}
            className={cx(
              'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium transition',
              status === tab
                ? 'border-charcoal bg-charcoal text-ivory'
                : 'border-sand bg-paper text-espresso hover:border-clay'
            )}
          >
            {t(`live.status.${tab}` as TKey)}
          </button>
        ))}
      </div>

      {list.error ? <ErrorBlock message={list.error} onRetry={list.refresh} /> : null}
      {list.loading && !list.data ? <LoadingBlock rows={4} /> : null}
      {actionError ? (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-rose/30 bg-rose/8 px-3 py-2 text-[12.5px] text-rose">
          <Icon name="alert" size={14} />
          {actionError}
        </div>
      ) : null}

      {!list.loading && !list.error && (list.data ?? []).length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone bg-cream/40 px-6 py-12 text-center">
          <p className="text-[14px] font-medium text-charcoal">{t('live.kitchen.noOrders')}</p>
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {(list.data ?? []).map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            busy={busyId === order.id}
            onStart={() => run(order.id, () => kitchenApi.start(order.id), t('live.kitchen.start'))}
            onReady={() => run(order.id, () => kitchenApi.ready(order.id), t('live.kitchen.ready'))}
            onReject={() => setRejectId(order.id)}
          />
        ))}
      </div>

      <ReasonDialog
        open={Boolean(rejectId)}
        title={t('live.orders.rejectTitle')}
        description={t('live.kitchen.reject')}
        confirmLabel={t('live.kitchen.reject')}
        busy={busyId === rejectId}
        danger
        onClose={() => setRejectId(null)}
        onConfirm={reject}
      />
    </div>
  )
}

function OrderCard({
  order,
  busy,
  onStart,
  onReady,
  onReject,
}: {
  order: Order
  busy: boolean
  onStart: () => void
  onReady: () => void
  onReject: () => void
}) {
  const { t, lang } = useI18n()
  const lineCount = (order.lines?.length ?? 0)
  const unitCount = (order.lines ?? []).reduce((sum, line) => sum + line.qty, 0)

  return (
    <Card className="flex flex-col p-4 border-l-4 border-l-charcoal">
      {/* Header: order number + status */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-clay">Order</span>
          <h2 className="font-mono text-[26px] font-bold leading-tight text-charcoal">{orderNumber(order)}</h2>
          <p className="mt-1 text-[12px] text-umber">{formatDateTime(order.createdAt, lang)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Client details */}
      {(order.customer || order.customerPhone) ? (
        <div className="mt-3 rounded-xl bg-cream/50 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-charcoal">{order.customer ?? '—'}</p>
              {order.customerPhone ? (
                <p className="mt-0.5 font-mono text-[12.5px] text-umber">{order.customerPhone}</p>
              ) : null}
            </div>
            {order.table ? (
              <div className="shrink-0 text-end">
                <p className="text-[10px] uppercase tracking-wide text-clay">Table</p>
                <p className="font-mono text-[18px] font-bold text-charcoal">{order.table}</p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Meta tags */}
      <div className="mt-2 flex flex-wrap gap-1.5">
        <span className="rounded-full border border-sand px-2.5 py-1 text-[11px] font-medium text-umber">{order.channel ?? '—'}</span>
        {order.branchId ? (
          <span className="rounded-full border border-sand px-2.5 py-1 text-[11px] font-medium text-umber">{order.branchId.slice(0, 8)}…</span>
        ) : null}
      </div>

      {/* Items table */}
      <div className="mt-3 overflow-hidden rounded-xl border border-sand">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-cream/80 text-left text-[11px] uppercase tracking-wide text-umber">
              <th className="px-3 py-2 font-semibold">Item</th>
              <th className="px-3 py-2 text-center font-semibold">Qty</th>
            </tr>
          </thead>
          <tbody>
            {(order.lines ?? []).map((item, index) => (
              <tr key={`${item.itemId}-${index}`} className="border-t border-sand/60">
                <td className="px-3 py-2 text-espresso">{item.name}</td>
                <td className="px-3 py-2 text-center font-mono font-bold text-charcoal">×{item.qty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary bar */}
      <div className="mt-3 flex items-center justify-between rounded-xl bg-ink px-3.5 py-2.5 text-ivory">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-ivory/50">Total</p>
          <p className="font-mono text-[17px] font-bold">{formatNumber(order.total, lang)}</p>
        </div>
        <div className="text-end">
          <p className="text-[11px] uppercase tracking-wide text-ivory/50">Lines</p>
          <p className="font-mono text-[14px] font-semibold">{lineCount} ({unitCount} units)</p>
        </div>
      </div>

      {/* Note */}
      {order.note ? (
        <p className="mt-2 rounded-xl border border-gold/40 bg-gold/15 px-3 py-2 text-[12.5px] leading-relaxed text-espresso">
          <span className="font-semibold text-gold">Note:</span> {order.note}
        </p>
      ) : null}

      <div className="mt-3 flex items-center justify-end gap-2 border-t border-sand/60 pt-3">
        {order.status === 'confirmed' ? (
          <Button size="sm" variant="accent" onClick={onStart} loading={busy} icon="play">
            {t('live.kitchen.start')}
          </Button>
        ) : null}
        {order.status === 'preparing' ? (
          <Button size="sm" variant="accent" onClick={onReady} loading={busy} icon="check">
            {t('live.kitchen.ready')}
          </Button>
        ) : null}
        {order.status !== 'ready' ? (
          <Button size="sm" variant="danger" onClick={onReject} disabled={busy}>
            {t('live.kitchen.reject')}
          </Button>
        ) : null}
      </div>
    </Card>
  )
}
