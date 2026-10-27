import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useI18n } from '../../shared/i18n'
import { Button, Card, EmptyState, Input, Modal, Segmented } from '../../shared/ui/ui.tsx'
import { Icon } from '../../shared/ui/icons.tsx'
import { useActiveRestaurant, useStore } from '../../shared/store/useStore.ts'
import { useOrderedOrders, useOrdersStore } from '../../shared/store/useOrders.ts'
import { cx, money } from '../../shared/lib/utils.ts'
import type { Order, OrderChannel, OrderStatus } from '../../shared/lib/types.ts'
import { isToday, statusKey, STATUS_DOT } from './orders/helpers.ts'
import { OrderCard } from './orders/OrderCard.tsx'
import { ManualOrderModal } from './orders/ManualOrderModal.tsx'

type Range = 'today' | 'all'
type ChannelFilter = 'all' | OrderChannel

export default function OrdersPage() {
  const { t, lang } = useI18n()
  const restaurant = useActiveRestaurant()
  const orders = useOrderedOrders(restaurant.id)
  const advance = useOrdersStore((s) => s.advance)
  const removeOrder = useOrdersStore((s) => s.removeOrder)
  const showToast = useStore((s) => s.showToast)

  const [range, setRange] = useState<Range>('today')
  const [channel, setChannel] = useState<ChannelFilter>('all')
  const [query, setQuery] = useState('')
  const [composerOpen, setComposerOpen] = useState(false)
  const [pendingRemove, setPendingRemove] = useState<Order | null>(null)

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    return orders.filter((order) => {
      if (range === 'today' && !isToday(order.createdAt)) return false
      if (channel !== 'all' && order.channel !== channel) return false
      if (!q) return true
      return (
        String(order.number).includes(q) ||
        order.table.toLowerCase().includes(q) ||
        order.customer.toLowerCase().includes(q) ||
        order.lines.some((line) => line.name.toLowerCase().includes(q))
      )
    })
  }, [orders, range, channel, query])

  const revenue = shown.reduce((sum, order) => sum + order.total, 0)
  const counts: Record<OrderStatus, number> = { received: 0, preparing: 0, served: 0 }
  shown.forEach((order) => {
    counts[order.status] += 1
  })

  const statusTiles: Array<{ status: OrderStatus; count: number }> = [
    { status: 'received', count: counts.received },
    { status: 'preparing', count: counts.preparing },
    { status: 'served', count: counts.served },
  ]

  const handleAdvance = (order: Order) => {
    advance(order.id)
    const next: OrderStatus = order.status === 'received' ? 'preparing' : 'served'
    showToast({
      title: t('clientMore.statusUpdated'),
      message: t(statusKey(next, lang)),
      tone: 'success',
    })
  }

  const confirmRemove = () => {
    if (!pendingRemove) return
    removeOrder(pendingRemove.id)
    showToast({ title: t('toast.deleted'), tone: 'info' })
    setPendingRemove(null)
  }

  return (
    <div className="space-y-5">
      {/* ------------------------------- filters ------------------------------ */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2.5">
            <Segmented
              ariaLabel={t('orders.title')}
              value={range}
              onChange={setRange}
              options={[
                { value: 'today', label: t('orders.today') },
                { value: 'all', label: t('orders.all') },
              ]}
            />
            <Segmented
              ariaLabel={t('clientMore.channel')}
              value={channel}
              onChange={setChannel}
              options={[
                { value: 'all', label: t('common.all') },
                { value: 'online', label: t('orders.onlineChannel') },
                { value: 'counter', label: t('orders.counterChannel') },
              ]}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Input
              type="search"
              aria-label={t('common.search')}
              placeholder={t('clientMore.searchPh')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-w-[150px] flex-1 lg:w-60 lg:flex-none"
            />
            <Button
              variant="accent"
              icon="plus"
              className="shrink-0"
              onClick={() => setComposerOpen(true)}
            >
              {t('orders.newOrder')}
            </Button>
          </div>
        </div>
      </Card>

      {/* ------------------------------ summary ------------------------------- */}
      <Card className="p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-[minmax(190px,1fr)_2fr] sm:items-center">
          <div className="rounded-xl border border-sand bg-cream/60 px-4 py-3">
            <div className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-clay">
              {t('common.revenue')}
            </div>
            <div className="mt-1.5 text-[24px] font-semibold leading-none tracking-[-0.02em] text-charcoal">
              {money(revenue)}
            </div>
            <div className="mt-1.5 text-[12px] text-umber">
              {t('orders.count', { n: shown.length })}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {statusTiles.map((tile) => (
              <div
                key={tile.status}
                className="rounded-xl border border-sand bg-paper px-3 py-2.5 text-center sm:text-start"
              >
                <div className="flex items-center justify-center gap-1.5 sm:justify-start">
                  <span className={cx('h-2 w-2 shrink-0 rounded-full', STATUS_DOT[tile.status])} />
                  <span className="text-[12px] leading-tight text-umber">
                    {t(statusKey(tile.status, lang))}
                  </span>
                </div>
                <div className="mt-1 text-[20px] font-semibold leading-none text-charcoal">
                  {tile.count}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* -------------------------------- board ------------------------------- */}
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {shown.map((order, index) => (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.26, delay: Math.min(index, 8) * 0.035 },
                }}
                exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.16 } }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              >
                <OrderCard order={order} onAdvance={handleAdvance} onRemove={setPendingRemove} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {shown.length === 0 ? (
          <EmptyState
            icon="list"
            title={orders.length > 0 ? t('common.empty') : t('orders.empty')}
            message={t('orders.emptyHint')}
            action={
              <Button variant="accent" icon="plus" onClick={() => setComposerOpen(true)}>
                {t('orders.manualOrder')}
              </Button>
            }
          />
        ) : null}
      </div>

      <p className="flex items-start gap-2 text-[12.5px] leading-relaxed text-clay">
        <Icon name="info" size={14} className="mt-0.5 shrink-0" />
        {t('dashboard.simulatedNote')}
      </p>

      {/* --------------------------- manual composer -------------------------- */}
      <ManualOrderModal
        restaurant={restaurant}
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
      />

      {/* ---------------------------- remove confirm -------------------------- */}
      <Modal
        open={pendingRemove !== null}
        onClose={() => setPendingRemove(null)}
        title={t('clientMore.confirmRemove')}
        description={t('clientMore.confirmRemoveMsg')}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingRemove(null)}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" icon="trash" onClick={confirmRemove}>
              {t('common.delete')}
            </Button>
          </>
        }
      >
        {pendingRemove ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-sand bg-cream/60 px-4 py-3">
            <span className="text-[13.5px] font-medium text-charcoal">
              {t('orders.orderNo', { no: pendingRemove.number })}
            </span>
            <span className="text-[14.5px] font-semibold text-charcoal">
              {money(pendingRemove.total)}
            </span>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
