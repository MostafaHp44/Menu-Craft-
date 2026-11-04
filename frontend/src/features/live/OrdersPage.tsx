import { useMemo, useState } from 'react'
import { Button, Card, Field, Input, Modal, Select } from '../../shared/ui/ui.tsx'
import { Icon } from '../../shared/ui/icons.tsx'
import { useI18n, type TKey } from '../../shared/i18n'
import { cx } from '../../shared/lib/utils.ts'
import { useStore } from '../../shared/store/useStore.ts'
import { useSession } from '../../shared/store/useSession.ts'
import {
  branchesApi,
  errorMessage,
  orderNumber,
  ordersApi,
  ownerApi,
  type Branch,
  type Order,
} from '../../shared/api/client.ts'
import { useAsync } from './useAsync.ts'
import {
  ApiPendingNote,
  ErrorBlock,
  LoadingBlock,
  PageHeader,
  ReasonDialog,
  RefreshButton,
  StatusBadge,
  TableWrap,
  Td,
  Th,
} from './components.tsx'
import { formatDateTime, formatNumber } from './format.ts'

const STATUS_TABS = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'] as const

function notify(title: string, tone: 'success' | 'error', message?: string) {
  useStore.getState().showToast({ title, message, tone })
}

export default function OrdersPage() {
  const { t, lang } = useI18n()
  const user = useSession((state) => state.user)
  const isOwner = user?.role === 'Owner'
  const [status, setStatus] = useState<string>('pending')
  const [branchId, setBranchId] = useState('')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const branches = useAsync<Branch[]>(() => (isOwner ? branchesApi.list() : Promise.resolve([])), [isOwner])
  const list = useAsync(
    () => ordersApi.list({ status, branch_id: isOwner && branchId ? branchId : undefined }),
    [status, branchId, isOwner]
  )

  const branchNames = useMemo(() => {
    const map = new Map<string, string>()
    for (const branch of branches.data ?? []) map.set(branch.id, branch.name)
    return map
  }, [branches.data])

  const orders = useMemo(() => {
    const query = search.trim().toLowerCase()
    const rows = list.data ?? []
    if (!query) return rows
    return rows.filter((order) => {
      const haystack = [
        order.order_number?.toString() ?? '',
        order.id,
        order.table_no ?? '',
        order.customer_name ?? '',
        order.phone ?? '',
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    })
  }, [list.data, search])

  return (
    <div>
      <PageHeader
        title={t('live.orders.title')}
        sub={t('live.orders.sub')}
        actions={<RefreshButton onClick={list.refresh} loading={list.loading} />}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {STATUS_TABS.map((tab) => (
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

      <Card className="mb-4 p-4">
        <div className={cx('grid gap-3', isOwner ? 'sm:grid-cols-[1.6fr_1fr]' : 'sm:grid-cols-1')}>
          <Field label={t('live.common.search')}>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('live.orders.searchPlaceholder')}
            />
          </Field>
          {isOwner ? (
            <Field label={t('live.common.branch')}>
              <Select value={branchId} onChange={(event) => setBranchId(event.target.value)}>
                <option value="">{t('live.common.all')}</option>
                {(branches.data ?? []).map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </Select>
            </Field>
          ) : null}
        </div>
      </Card>

      {list.error ? <ErrorBlock message={list.error} onRetry={list.refresh} /> : null}
      {list.loading && !list.data ? <LoadingBlock rows={5} /> : null}

      {!list.loading && !list.error && orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone bg-cream/40 px-6 py-12 text-center">
          <p className="text-[14px] font-medium text-charcoal">{t('live.orders.noOrders')}</p>
        </div>
      ) : null}

      {orders.length > 0 ? (
        <TableWrap>
          <thead>
            <tr>
              <Th>{t('live.common.order')}</Th>
              <Th>{t('live.common.status')}</Th>
              <Th>{t('live.common.customer')}</Th>
              <Th>{t('live.common.table')}</Th>
              <Th>{t('live.common.branch')}</Th>
              <Th>{t('live.common.items')}</Th>
              <Th>{t('live.common.total')}</Th>
              <Th>{t('live.common.createdAt')}</Th>
              <Th>{t('live.common.actions')}</Th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-cream/40">
                <Td className="font-mono text-[12px] font-medium text-charcoal">{orderNumber(order)}</Td>
                <Td>
                  <StatusBadge status={order.status} />
                </Td>
                <Td>
                  <span className="line-clamp-1">{order.customer_name ?? '—'}</span>
                  {order.phone ? <span className="block text-[11.5px] text-clay">{order.phone}</span> : null}
                </Td>
                <Td>{order.table_no ?? '—'}</Td>
                <Td>{order.branch_id ? branchNames.get(order.branch_id) ?? '—' : '—'}</Td>
                <Td>{order.items.length}</Td>
                <Td>{formatNumber(order.total, lang)}</Td>
                <Td className="whitespace-nowrap text-[12px] text-umber">{formatDateTime(order.created_at, lang)}</Td>
                <Td>
                  <Button variant="outline" size="sm" onClick={() => setSelectedId(order.id)}>
                    {t('live.common.details')}
                  </Button>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      ) : null}

      <div className="mt-5">
        <ApiPendingNote>{t('live.orders.manualPending')}</ApiPendingNote>
      </div>

      {selectedId ? (
        <OrderDetail
          orderId={selectedId}
          onClose={() => setSelectedId(null)}
          onChanged={() => {
            list.refresh()
            branches.refresh()
          }}
        />
      ) : null}
    </div>
  )
}

function OrderDetail({
  orderId,
  onClose,
  onChanged,
}: {
  orderId: string
  onClose: () => void
  onChanged: () => void
}) {
  const { t, lang } = useI18n()
  const user = useSession((state) => state.user)
  const isOwner = user?.role === 'Owner'
  const detail = useAsync<Order>(() => ordersApi.get(orderId), [orderId])
  const branches = useAsync<Branch[]>(() => (isOwner ? branchesApi.list() : Promise.resolve([])), [isOwner])
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [reasonMode, setReasonMode] = useState<'reject' | 'cancel' | null>(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')

  const order = detail.data

  const refreshAll = () => {
    detail.refresh()
    onChanged()
  }

  const confirmOrder = async () => {
    setBusy(true)
    setActionError('')
    try {
      await ordersApi.confirm(orderId)
      notify(t('live.orders.confirmed'), 'success')
      setConfirmOpen(false)
      refreshAll()
    } catch (error) {
      setActionError(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  const rejectOrder = async (reason: string) => {
    setBusy(true)
    setActionError('')
    try {
      await ordersApi.reject(orderId, reason)
      notify(t('live.orders.rejected'), 'success')
      setReasonMode(null)
      refreshAll()
    } catch (error) {
      setActionError(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  const cancelOrder = async (reason: string) => {
    setBusy(true)
    setActionError('')
    try {
      await ownerApi.cancelOrder(orderId, reason)
      notify(t('live.orders.cancelledMsg'), 'success')
      setReasonMode(null)
      refreshAll()
    } catch (error) {
      setActionError(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  const branchName = order?.branch_id
    ? (branches.data ?? []).find((branch) => branch.id === order.branch_id)?.name ?? '—'
    : '—'

  const canConfirm = order?.status === 'pending'
  const canReject = order?.status === 'pending' || order?.status === 'confirmed'
  const canOwnerCancel = isOwner && order ? !['completed', 'cancelled'].includes(order.status) : false

  return (
    <Modal
      open
      onClose={onClose}
      title={`${t('live.orders.detailsTitle')} ${order ? orderNumber(order) : ''}`}
      description={order ? `${formatDateTime(order.created_at, lang)} · ${t('live.common.branch')}: ${branchName}` : undefined}
      size="lg"
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            {order ? <ReceiptButton order={order} /> : null}
            {order?.phone ? <WhatsAppButton order={order} /> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={onClose}>
              {t('live.common.close')}
            </Button>
            {canConfirm ? (
              <Button variant="accent" onClick={() => setConfirmOpen(true)} disabled={busy}>
                {t('live.orders.confirmOrder')}
              </Button>
            ) : null}
            {canReject ? (
              <Button variant="danger" onClick={() => setReasonMode('reject')} disabled={busy}>
                {t('live.orders.rejectOrder')}
              </Button>
            ) : null}
            {canOwnerCancel ? (
              <Button variant="outline" onClick={() => setReasonMode('cancel')} disabled={busy}>
                {t('live.orders.cancelOrder')}
              </Button>
            ) : null}
          </div>
        </div>
      }
    >
      {detail.loading && !order ? <LoadingBlock rows={3} /> : null}
      {detail.error ? <ErrorBlock message={detail.error} onRetry={detail.refresh} /> : null}
      {actionError ? (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-rose/30 bg-rose/8 px-3 py-2 text-[12.5px] text-rose">
          <Icon name="alert" size={14} />
          {actionError}
        </div>
      ) : null}

      {order ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={order.status} />
            <span className="rounded-full border border-sand px-2.5 py-1 text-[11.5px] text-umber">
              {order.channel ?? '—'}
            </span>
            {order.table_no ? (
              <span className="rounded-full border border-sand px-2.5 py-1 text-[11.5px] text-umber">
                {t('live.common.table')}: {order.table_no}
              </span>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Info label={t('live.common.customer')} value={order.customer_name ?? '—'} />
            <Info label={t('live.common.phone')} value={order.phone ?? '—'} />
            <Info label={t('live.common.address')} value={order.delivery_address ?? '—'} />
            <Info label={t('live.common.total')} value={formatNumber(order.total, lang)} />
          </div>

          {order.note ? (
            <div className="rounded-xl border border-gold/30 bg-gold/8 px-3.5 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gold">
                {t('live.common.note')}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-[13px] text-charcoal">{order.note}</p>
            </div>
          ) : null}

          <div>
            <h3 className="mb-2 text-[13.5px] font-semibold text-charcoal">{t('live.common.items')}</h3>
            <div className="overflow-hidden rounded-xl border border-sand">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="bg-cream/60">
                    <th className="px-3 py-2 text-start font-medium text-umber">{t('live.common.name')}</th>
                    <th className="px-3 py-2 text-center font-medium text-umber">×</th>
                    <th className="px-3 py-2 text-end font-medium text-umber">{t('live.common.amount')}</th>
                    <th className="px-3 py-2 text-end font-medium text-umber">{t('live.common.total')}</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, index) => (
                    <tr key={`${item.item_id}-${index}`} className="border-t border-sand/60">
                      <td className="px-3 py-2 text-espresso">{item.item_name}</td>
                      <td className="px-3 py-2 text-center text-umber">{item.qty}</td>
                      <td className="px-3 py-2 text-end text-umber">{formatNumber(item.price, lang)}</td>
                      <td className="px-3 py-2 text-end font-medium text-charcoal">
                        {formatNumber(item.line_total ?? item.price * item.qty, lang)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      <ReasonDialog
        open={reasonMode === 'reject'}
        title={t('live.orders.rejectTitle')}
        description={order ? orderNumber(order) : ''}
        confirmLabel={t('live.orders.rejectOrder')}
        busy={busy}
        danger
        onClose={() => setReasonMode(null)}
        onConfirm={rejectOrder}
      />
      <ReasonDialog
        open={reasonMode === 'cancel'}
        title={t('live.orders.cancelTitle')}
        description={order ? orderNumber(order) : ''}
        confirmLabel={t('live.orders.cancelOrder')}
        busy={busy}
        danger
        onClose={() => setReasonMode(null)}
        onConfirm={cancelOrder}
      />
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={t('live.orders.confirmTitle')}
        description={order ? orderNumber(order) : ''}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)} disabled={busy}>
              {t('live.common.cancel')}
            </Button>
            <Button variant="accent" onClick={confirmOrder} loading={busy}>
              {t('live.orders.confirmOrder')}
            </Button>
          </>
        }
      >
        <p className="text-[13.5px] text-umber">{t('live.orders.confirmOrder')}</p>
      </Modal>
    </Modal>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-sand bg-cream/40 px-3.5 py-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-clay">{label}</p>
      <p className="mt-0.5 break-words text-[13px] text-charcoal">{value}</p>
    </div>
  )
}

function ReceiptButton({ order }: { order: Order }) {
  const { t, lang } = useI18n()
  const print = () => {
    const rows = order.items
      .map(
        (item) =>
          `<tr><td>${escapeHtml(item.item_name)}</td><td style="text-align:center">${item.qty}</td><td style="text-align:end">${item.price * item.qty}</td></tr>`
      )
      .join('')
    const html = `<!doctype html><html dir="${lang === 'en' ? 'ltr' : 'rtl'}"><head><meta charset="utf-8"><title>${escapeHtml(
      orderNumber(order)
    )}</title><style>
      body{font-family:ui-sans-serif,system-ui,sans-serif;padding:18px;color:#1b1714;max-width:360px;margin:auto}
      h1{font-size:18px;margin:0 0 4px} p{margin:2px 0;font-size:12px;color:#555}
      table{width:100%;border-collapse:collapse;margin-top:12px;font-size:12px}
      th,td{padding:6px 2px;border-bottom:1px dashed #ccc;text-align:start}
      .total{margin-top:12px;font-size:15px;font-weight:700;display:flex;justify-content:space-between}
      </style></head><body>
      <h1>${escapeHtml(orderNumber(order))}</h1>
      <p>${escapeHtml(formatDateTime(order.created_at, lang))}</p>
      <p>${escapeHtml(order.customer_name ?? '')}</p>
      <p>${escapeHtml(order.phone ?? '')}</p>
      <p>${escapeHtml(order.delivery_address ?? '')}</p>
      <table><thead><tr><th>${escapeHtml(t('live.common.name'))}</th><th style="text-align:center">×</th><th style="text-align:end">${escapeHtml(
      t('live.common.amount')
    )}</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="total"><span>${escapeHtml(t('live.common.total'))}</span><span>${Number(order.total ?? 0).toFixed(2)}</span></div>
      </body></html>`
    const win = window.open('', '_blank', 'width=420,height=680')
    if (!win) {
      notify(t('live.orders.receipt'), 'error')
      return
    }
    win.document.write(html)
    win.document.close()
    win.focus()
    win.print()
  }
  return (
    <Button variant="outline" size="sm" icon="printer" onClick={print}>
      {t('live.common.print')}
    </Button>
  )
}

function WhatsAppButton({ order }: { order: Order }) {
  const { t, lang } = useI18n()
  const phone = (order.phone ?? '').replace(/[^\d]/g, '')
  if (!phone) return null
  const lines = order.items.map((item) => `• ${item.item_name} × ${item.qty}`).join('\n')
  const text = `${t('live.common.order')} ${orderNumber(order)}\n${lines}\n${t('live.common.total')}: ${Number(
    order.total ?? 0
  ).toFixed(2)}\n${formatDateTime(order.created_at, lang)}`
  return (
    <Button
      variant="outline"
      size="sm"
      icon="send"
      href={`https://wa.me/${phone}?text=${encodeURIComponent(text)}`}
      target="_blank"
      rel="noreferrer"
    >
      {t('live.common.whatsapp')}
    </Button>
  )
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
