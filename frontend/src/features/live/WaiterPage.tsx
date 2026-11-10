import { useEffect, useState } from 'react'
import { Button, Card, Modal } from '../../shared/ui/ui.tsx'
import { Icon } from '../../shared/ui/icons.tsx'
import { useI18n, type TKey } from '../../shared/i18n'
import { cx } from '../../shared/lib/utils.ts'
import { useStore } from '../../shared/store/useStore.ts'
import { useSession } from '../../shared/store/useSession.ts'
import { errorMessage, orderNumber, waiterApi, type Order } from '../../shared/api/client.ts'
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

const TABS = ['ready', 'completed'] as const

export default function WaiterPage() {
  const { t } = useI18n()
  const [status, setStatus] = useState<string>('ready')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [returnId, setReturnId] = useState<string | null>(null)
  const [completeId, setCompleteId] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')
  const user = useSession((state) => state.user)
  const list = useAsync(() => waiterApi.list({ status, restaurantId: user?.restaurant_id }), [status, user?.restaurant_id])

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

  const complete = async () => {
    if (!completeId) return
    await run(completeId, () => waiterApi.complete(completeId), t('live.waiter.complete'))
    setCompleteId(null)
  }

  const returnToKitchen = async (reason: string) => {
    if (!returnId) return
    await run(returnId, () => waiterApi.returnToKitchen(returnId, reason), t('live.waiter.return'))
    setReturnId(null)
  }

  return (
    <div>
      <PageHeader
        title={t('live.waiter.title')}
        sub={t('live.waiter.sub')}
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
          <p className="text-[14px] font-medium text-charcoal">{t('live.waiter.noOrders')}</p>
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {(list.data ?? []).map((order) => (
          <WaiterCard
            key={order.id}
            order={order}
            busy={busyId === order.id}
            onDetails={() => setDetailId(order.id)}
            onComplete={() => setCompleteId(order.id)}
            onReturn={() => setReturnId(order.id)}
          />
        ))}
      </div>

      {detailId ? <WaiterDetail orderId={detailId} onClose={() => setDetailId(null)} /> : null}

      <Modal
        open={Boolean(completeId)}
        onClose={() => setCompleteId(null)}
        title={t('live.waiter.complete')}
        description={t('live.waiter.title')}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCompleteId(null)} disabled={busyId === completeId}>
              {t('live.common.cancel')}
            </Button>
            <Button variant="accent" onClick={complete} loading={busyId === completeId}>
              {t('live.waiter.complete')}
            </Button>
          </>
        }
      >
        <p className="text-[13.5px] text-umber">{t('live.waiter.complete')}</p>
      </Modal>

      <ReasonDialog
        open={Boolean(returnId)}
        title={t('live.waiter.return')}
        description={t('live.waiter.title')}
        confirmLabel={t('live.waiter.return')}
        busy={busyId === returnId}
        danger
        onClose={() => setReturnId(null)}
        onConfirm={returnToKitchen}
      />
    </div>
  )
}

function WaiterCard({
  order,
  busy,
  onDetails,
  onComplete,
  onReturn,
}: {
  order: Order
  busy: boolean
  onDetails: () => void
  onComplete: () => void
  onReturn: () => void
}) {
  const { t, lang } = useI18n()
  const unitCount = (order.lines ?? []).reduce((sum, line) => sum + line.qty, 0)

  return (
    <Card className="flex flex-col p-4 border-l-4 border-l-flame">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-clay">Order</span>
          <h2 className="font-mono text-[26px] font-bold leading-tight text-charcoal">{orderNumber(order)}</h2>
          <p className="mt-1 text-[12px] text-umber">{formatDateTime(order.createdAt, lang)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Client + Table row */}
      {(order.customer || order.customerPhone) ? (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-cream/50 p-3">
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-charcoal">{order.customer ?? '—'}</p>
            {order.customerPhone ? (
              <p className="mt-0.5 font-mono text-[12.5px] text-umber">{order.customerPhone}</p>
            ) : null}
          </div>
          {order.table ? (
            <div className="shrink-0 text-end">
              <p className="text-[10px] uppercase tracking-wide text-clay">Table</p>
              <p className="font-mono text-[20px] font-bold leading-none text-charcoal">{order.table}</p>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Meta tags */}
      <div className="mt-2 flex flex-wrap gap-1.5">
        <span className="rounded-full border border-sand px-2.5 py-1 text-[11px] font-medium text-umber">{order.channel ?? '—'}</span>
      </div>

      {/* Items table */}
      <div className="mt-3 overflow-hidden rounded-xl border border-sand">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="bg-cream/80 text-left text-[11px] uppercase tracking-wide text-umber">
              <th className="px-3 py-2 font-semibold">Item</th>
              <th className="px-3 py-2 text-center font-semibold">Qty</th>
              <th className="px-3 py-2 text-end font-semibold">Price</th>
            </tr>
          </thead>
          <tbody>
            {(order.lines ?? []).map((item, index) => (
              <tr key={`${item.itemId}-${index}`} className="border-t border-sand/60">
                <td className="px-3 py-2 text-espresso">{item.name}</td>
                <td className="px-3 py-2 text-center font-mono font-bold text-charcoal">×{item.qty}</td>
                <td className="px-3 py-2 text-end font-mono text-charcoal">{formatNumber(item.price * item.qty, lang)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary bar */}
      <div className="mt-3 flex items-center justify-between rounded-xl bg-ink px-3.5 py-2.5 text-ivory">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-ivory/50">Total</p>
          <p className="font-mono text-[17px] font-bold">{formatNumber(order.total, lang)}</p>
        </div>
        <div className="text-end">
          <p className="text-[10px] uppercase tracking-wide text-ivory/50">Items</p>
          <p className="font-mono text-[14px] font-semibold">{unitCount}</p>
        </div>
      </div>

      {/* Note */}
      {order.note ? (
        <p className="mt-2 rounded-xl border border-gold/40 bg-gold/15 px-3 py-2 text-[12.5px] leading-relaxed text-espresso">
          <span className="font-semibold text-gold">Note:</span> {order.note}
        </p>
      ) : null}

      {/* Actions */}
      <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-sand/60 pt-3">
        <Button size="sm" variant="outline" onClick={onDetails} icon="list">
          {t('live.common.details')}
        </Button>
        {order.status === 'ready' ? (
          <>
            <Button size="sm" variant="accent" onClick={onComplete} loading={busy} icon="check">
              {t('live.waiter.complete')}
            </Button>
            <Button size="sm" variant="danger" onClick={onReturn} disabled={busy}>
              {t('live.waiter.return')}
            </Button>
          </>
        ) : null}
      </div>
    </Card>
  )
}

function WaiterDetail({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const { t, lang } = useI18n()
  const detail = useAsync<Order>(() => waiterApi.get(orderId), [orderId])
  const order = detail.data
  const unitCount = (order?.lines ?? []).reduce((sum, line) => sum + line.qty, 0)

  return (
    <Modal
      open
      onClose={onClose}
      title={`${t('live.orders.detailsTitle')} ${order ? orderNumber(order) : ''}`}
      description={order ? formatDateTime(order.createdAt, lang) : undefined}
      size="md"
      footer={
        <Button variant="ghost" onClick={onClose}>
          {t('live.common.close')}
        </Button>
      }
    >
      {detail.loading && !order ? <LoadingBlock rows={2} /> : null}
      {detail.error ? <ErrorBlock message={detail.error} onRetry={detail.refresh} /> : null}
      {order ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={order.status} />
            <span className="rounded-full border border-sand px-3 py-1.5 text-[12px] font-medium text-umber">#{order.id.slice(-8)}</span>
            {order.table ? (
              <span className="rounded-full border border-sand px-3 py-1.5 text-[12px] font-bold text-charcoal">Table: {order.table}</span>
            ) : null}
            <span className="rounded-full border border-sand px-3 py-1.5 text-[12px] font-medium text-umber">{order.channel ?? '—'}</span>
          </div>

          {(order.customer || order.customerPhone) ? (
            <div className="rounded-xl bg-cream/50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-clay">Customer</p>
                  <p className="mt-0.5 text-[15px] font-semibold text-charcoal">{order.customer ?? '—'}</p>
                  {order.customerPhone ? (
                    <p className="mt-0.5 font-mono text-[13px] text-umber">{order.customerPhone}</p>
                  ) : null}
                </div>
                <div className="text-end shrink-0">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-clay">Items</p>
                  <p className="mt-0.5 font-mono text-[20px] font-bold text-charcoal">{unitCount}</p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="overflow-hidden rounded-xl border border-sand">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-cream/80 text-left text-[11px] uppercase tracking-wide text-umber">
                  <th className="px-3 py-2 font-semibold">Item</th>
                  <th className="px-3 py-2 text-center font-semibold">Qty</th>
                  <th className="px-3 py-2 text-end font-semibold">Line total</th>
                </tr>
              </thead>
              <tbody>
                {order.lines?.map((item, index) => (
                  <tr key={`${item.itemId}-${index}`} className="border-t border-sand/60">
                    <td className="px-3 py-2 text-espresso">{item.name}</td>
                    <td className="px-3 py-2 text-center font-mono font-bold text-charcoal">×{item.qty}</td>
                    <td className="px-3 py-2 text-end font-mono text-charcoal">{formatNumber(item.price * item.qty, lang)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-ink px-4 py-3 text-ivory">
            <span className="text-[12px] uppercase tracking-[0.12em] text-ivory/50">Total</span>
            <span className="font-mono text-[18px] font-bold">{formatNumber(order.total, lang)}</span>
          </div>

          {order.note ? (
            <p className="rounded-xl border border-gold/40 bg-gold/15 px-3 py-2 text-[12.5px] leading-relaxed text-espresso">
              <span className="font-semibold text-gold">Note:</span> {order.note}
            </p>
          ) : null}
        </div>
      ) : null}
    </Modal>
  )
}
