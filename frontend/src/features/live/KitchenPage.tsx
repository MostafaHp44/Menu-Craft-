import { useEffect, useState } from 'react'
import { Button, Card } from '../../shared/ui/ui.tsx'
import { Icon } from '../../shared/ui/icons.tsx'
import { useI18n, type TKey } from '../../shared/i18n'
import { cx } from '../../shared/lib/utils.ts'
import { useStore } from '../../shared/store/useStore.ts'
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
  const list = useAsync(() => kitchenApi.list({ status }), [status])

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

  const reject = async (reason: string) => {
    if (!rejectId) return
    await run(rejectId, () => kitchenApi.reject(rejectId, reason), t('live.orders.rejected'))
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

      <ul className="mt-3 flex-1 space-y-1.5">
        {order.items.map((item, index) => (
          <li key={`${item.item_id}-${index}`} className="flex items-center justify-between gap-2 text-[13px]">
            <span className="min-w-0 flex-1 text-espresso">{item.item_name}</span>
            <span className="rounded-md bg-cream px-2 py-0.5 font-mono text-[11.5px] font-semibold text-charcoal">
              ×{item.qty}
            </span>
          </li>
        ))}
      </ul>

      {order.note ? (
        <p className="mt-2 rounded-lg bg-gold/10 px-2.5 py-1.5 text-[11.5px] leading-snug text-espresso">
          {order.note}
        </p>
      ) : null}

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-sand/60 pt-3">
        <span className="text-[13px] font-semibold text-charcoal">{formatNumber(order.total, lang)}</span>
        <div className="flex flex-wrap justify-end gap-1.5">
          {order.status === 'confirmed' ? (
            <Button size="sm" variant="accent" onClick={onStart} loading={busy}>
              {t('live.kitchen.start')}
            </Button>
          ) : null}
          {order.status === 'preparing' ? (
            <Button size="sm" variant="accent" onClick={onReady} loading={busy}>
              {t('live.kitchen.ready')}
            </Button>
          ) : null}
          {order.status !== 'ready' ? (
            <Button size="sm" variant="danger" onClick={onReject} disabled={busy}>
              {t('live.kitchen.reject')}
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  )
}
