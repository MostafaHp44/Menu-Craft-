import { useEffect, useState } from 'react'
import { Button, Card, Modal } from '../../shared/ui/ui.tsx'
import { Icon } from '../../shared/ui/icons.tsx'
import { useI18n, type TKey } from '../../shared/i18n'
import { cx } from '../../shared/lib/utils.ts'
import { useStore } from '../../shared/store/useStore.ts'
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
  const list = useAsync(() => waiterApi.list({ status }), [status])

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
  return (
    <Card className="flex flex-col p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[13px] font-semibold text-charcoal">{orderNumber(order)}</p>
          <p className="mt-0.5 text-[11.5px] text-clay">{formatDateTime(order.created_at, lang)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5 text-[11.5px]">
        {order.table_no ? (
          <span className="rounded-full border border-sand px-2 py-0.5 text-umber">
            {t('live.common.table')}: {order.table_no}
          </span>
        ) : null}
        <span className="rounded-full border border-sand px-2 py-0.5 text-umber">{order.channel ?? '—'}</span>
      </div>

      <ul className="mt-3 flex-1 space-y-1">
        {order.items.map((item, index) => (
          <li key={`${item.item_id}-${index}`} className="flex items-center justify-between gap-2 text-[12.5px]">
            <span className="min-w-0 flex-1 text-espresso">{item.item_name}</span>
            <span className="font-mono text-[11.5px] text-umber">×{item.qty}</span>
          </li>
        ))}
      </ul>

      {order.note ? (
        <p className="mt-2 rounded-lg bg-gold/10 px-2.5 py-1.5 text-[11.5px] leading-snug text-espresso">{order.note}</p>
      ) : null}

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-sand/60 pt-3">
        <span className="text-[13px] font-semibold text-charcoal">{formatNumber(order.total, lang)}</span>
        <div className="flex flex-wrap justify-end gap-1.5">
          <Button size="sm" variant="outline" onClick={onDetails}>
            {t('live.common.details')}
          </Button>
          {order.status === 'ready' ? (
            <>
              <Button size="sm" variant="accent" onClick={onComplete} loading={busy}>
                {t('live.waiter.complete')}
              </Button>
              <Button size="sm" variant="danger" onClick={onReturn} disabled={busy}>
                {t('live.waiter.return')}
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </Card>
  )
}

function WaiterDetail({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const { t, lang } = useI18n()
  const detail = useAsync<Order>(() => waiterApi.get(orderId), [orderId])
  const order = detail.data
  return (
    <Modal
      open
      onClose={onClose}
      title={`${t('live.orders.detailsTitle')} ${order ? orderNumber(order) : ''}`}
      description={order ? formatDateTime(order.created_at, lang) : undefined}
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
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={order.status} />
            {order.table_no ? (
              <span className="rounded-full border border-sand px-2.5 py-1 text-[11.5px] text-umber">
                {t('live.common.table')}: {order.table_no}
              </span>
            ) : null}
            <span className="rounded-full border border-sand px-2.5 py-1 text-[11.5px] text-umber">{order.channel ?? '—'}</span>
          </div>
          <div className="overflow-hidden rounded-xl border border-sand">
            <table className="w-full text-[13px]">
              <tbody>
                {order.items.map((item, index) => (
                  <tr key={`${item.item_id}-${index}`} className="border-b border-sand/60 last:border-0">
                    <td className="px-3 py-2 text-espresso">{item.item_name}</td>
                    <td className="px-3 py-2 text-center text-umber">×{item.qty}</td>
                    <td className="px-3 py-2 text-end text-charcoal">{formatNumber(item.price * item.qty, lang)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-cream/60 px-3.5 py-2.5">
            <span className="text-[12.5px] font-medium text-umber">{t('live.common.total')}</span>
            <span className="text-[15px] font-semibold text-charcoal">{formatNumber(order.total, lang)}</span>
          </div>
          {order.note ? <p className="text-[12.5px] text-umber">{order.note}</p> : null}
        </div>
      ) : null}
    </Modal>
  )
}
