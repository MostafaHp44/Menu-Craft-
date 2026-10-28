import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Icon } from '../../shared/ui/icons.tsx'
import { Badge, Button, Card, IconButton } from '../../shared/ui/ui.tsx'
import { LanguageSwitcher } from '../../shared/ui/LanguageSwitcher.tsx'
import { useI18n, type TKey } from '../../shared/i18n'
import { cx, money, timeAgo } from '../../shared/lib/utils.ts'
import { useOrderedOrders, useOrdersStore } from '../../shared/store/useOrders.ts'
import { useActiveRestaurant, useStore } from '../../shared/store/useStore.ts'
import { useAuthStore } from '../../shared/store/useAuth.ts'
import type { Order, OrderStatus } from '../../shared/lib/types.ts'

/** status → column chrome (received = gold · preparing = flame · served = moss) */
const TONES: Record<OrderStatus, { head: string; dot: string }> = {
  received: { head: 'bg-gold/12', dot: 'bg-gold' },
  preparing: { head: 'bg-flame/12', dot: 'bg-flame' },
  served: { head: 'bg-moss/18', dot: 'bg-moss' },
}

const COLUMNS: ReadonlyArray<{ status: OrderStatus; label: TKey }> = [
  { status: 'received', label: 'orders.received' },
  { status: 'preparing', label: 'orders.preparing' },
  { status: 'served', label: 'orders.served' },
]

/* --------------------------------- ticket --------------------------------- */

function OrderTicket({
  order,
  actionLabel,
  onAdvance,
}: {
  order: Order
  actionLabel: string | null
  onAdvance: () => void
}) {
  const { t } = useI18n()
  const channel =
    order.channel === 'online' ? t('orders.onlineChannel') : t('orders.counterChannel')

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.14 } }}
      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
      className="shrink-0"
    >
      <Card className="p-3.5 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[14.5px] font-semibold tracking-[-0.01em] text-charcoal">
              {t('orders.orderNo', { no: order.number })}
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-umber">
              <Icon name="clock" size={12} className="shrink-0" />
              {timeAgo(order.createdAt)}
            </p>
          </div>
          <Badge
            tone="outline"
            icon={order.channel === 'online' ? 'globe' : 'store'}
            className="shrink-0"
          >
            {channel}
          </Badge>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="min-w-0 rounded-xl bg-cream/80 px-2.5 py-2">
            <span className="block text-[10.5px] leading-tight text-clay">
              {t('orders.table')}
            </span>
            <span className="mt-0.5 block truncate text-[13px] font-medium text-charcoal">
              {order.table}
            </span>
          </div>
          <div className="min-w-0 rounded-xl bg-cream/80 px-2.5 py-2">
            <span className="block text-[10.5px] leading-tight text-clay">
              {t('orders.customer')}
            </span>
            <span className="mt-0.5 block truncate text-[13px] font-medium text-charcoal">
              {order.customer}
            </span>
          </div>
        </div>

        <div className="mt-3">
          <span className="block text-[10.5px] text-clay">{t('orders.items')}</span>
          <ul className="mt-1.5 space-y-1.5">
            {order.lines.map((line) => (
              <li
                key={line.itemId}
                className="flex items-center justify-between gap-3 rounded-lg border border-sand/70 bg-paper px-2.5 py-1.5"
              >
                <span className="min-w-0 truncate text-[13px] text-charcoal">{line.name}</span>
                <span className="shrink-0 rounded-md bg-cream px-1.5 py-0.5 text-[11.5px] font-semibold text-umber">
                  × {line.qty}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {order.note ? (
          <div className="mt-2.5 rounded-xl border border-gold/40 bg-gold/10 px-3 py-2">
            <span className="block text-[11px] font-semibold text-gold">
              {t('orders.note')}
            </span>
            <p className="mt-0.5 break-words text-[12.5px] leading-snug text-espresso">
              {order.note}
            </p>
          </div>
        ) : null}

        <div className="mt-3 flex items-center justify-between gap-3 border-t border-sand/70 pt-3">
          <span className="text-[12px] text-umber">{t('common.total')}</span>
          <span className="text-[16px] font-semibold tracking-[-0.01em] text-charcoal">
            {money(order.total)}
          </span>
        </div>

        {actionLabel ? (
          <Button full size="lg" variant="accent" className="mt-3" onClick={onAdvance}>
            {actionLabel}
          </Button>
        ) : (
          <div className="mt-3 flex items-center justify-center gap-2 rounded-full bg-moss/10 py-3 text-[13px] font-semibold text-moss">
            <Icon name="check" size={16} strokeWidth={2.6} />
            {t('worker.markServed')}
          </div>
        )}
      </Card>
    </motion.article>
  )
}

/* --------------------------------- column --------------------------------- */

function BoardColumn({
  status,
  label,
  orders,
}: {
  status: OrderStatus
  label: TKey
  orders: Order[]
}) {
  const { t } = useI18n()
  const advance = useOrdersStore((s) => s.advance)
  const tone = TONES[status]
  const actionLabel =
    status === 'received'
      ? t('orders.markPreparing')
      : status === 'preparing'
        ? t('orders.markServed')
        : null

  return (
    <section className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-smoke/70">
      <header
        className={cx(
          'flex items-center justify-between gap-3 border-b border-white/8 px-4 py-3.5',
          tone.head
        )}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <span className={cx('h-3 w-3 shrink-0 rounded-full', tone.dot)} />
          <h2 className="min-w-0 truncate text-[14.5px] font-semibold text-ivory">
            {t(label)}
          </h2>
        </span>
        <Badge tone="dark" className="shrink-0">
          {orders.length === 1
            ? t('kitchenMore.oneOrder')
            : t('orders.count', { n: orders.length })}
        </Badge>
      </header>

      <div className="thin-scroll flex min-h-[140px] flex-1 flex-col gap-3 p-3 lg:max-h-[calc(100vh_-_248px)] lg:overflow-y-auto">
        <AnimatePresence mode="popLayout" initial={false}>
          {orders.map((order) => (
            <OrderTicket
              key={order.id}
              order={order}
              actionLabel={actionLabel}
              onAdvance={() => advance(order.id)}
            />
          ))}
        </AnimatePresence>

        {orders.length === 0 ? (
          <p className="m-auto w-full rounded-xl border border-dashed border-white/15 px-4 py-7 text-center text-[13px] text-ivory/45">
            {t('common.empty')}
          </p>
        ) : null}
      </div>
    </section>
  )
}

/* -------------------------------- the board -------------------------------- */

export default function WorkerBoard() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const activeRestaurant = useActiveRestaurant()
  const session = useAuthStore((s) => s.session)
  const restaurants = useStore((s) => s.restaurants)
  // a signed-in worker always follows THEIR restaurant's kitchen — not the active one
  const restaurant =
    session?.role === 'worker' && session.restaurantId
      ? restaurants.find((r) => r.id === session.restaurantId) ?? activeRestaurant
      : activeRestaurant
  const signOut = useAuthStore((s) => s.signOut)
  const orders = useOrderedOrders(restaurant.id)

  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 20_000)
    return () => window.clearInterval(id)
  }, [])

  const clock = useMemo(
    () => new Intl.DateTimeFormat(lang, { hour: '2-digit', minute: '2-digit' }).format(now),
    [lang, now]
  )

  const grouped = useMemo<Record<OrderStatus, Order[]>>(
    () => ({
      received: orders.filter((o) => o.status === 'received'),
      preparing: orders.filter((o) => o.status === 'preparing'),
      served: orders.filter((o) => o.status === 'served'),
    }),
    [orders]
  )

  const handleSignOut = () => {
    signOut()
    navigate('/')
  }

  return (
    <div className="grid-lines min-h-screen bg-ink text-ivory">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-ink/95 backdrop-blur-md">
        <div className="mx-auto w-full max-w-[1600px] px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-flame text-white shadow-[0_12px_26px_-16px_rgba(232,87,31,0.9)]">
                <Icon name="utensils" size={19} />
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-[16px] font-semibold tracking-[-0.01em] text-ivory sm:text-[19px]">
                  {t('worker.title')}
                </h1>
                <p className="truncate text-[11.5px] text-ivory/55 sm:text-[12.5px]">
                  {t('worker.sub')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-[14px] font-semibold tabular-nums text-ivory">
                {clock}
              </span>
              <IconButton
                icon="logout"
                tone="onDark"
                label={t('dashboard.signOut')}
                className="h-11 w-11"
                onClick={handleSignOut}
              />
            </div>
          </div>

          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-white/8 pt-2.5">
            <span className="flex min-w-0 items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-[12.5px] font-medium text-ivory/85">
              <Icon name="store" size={14} className="shrink-0 text-flame-light" />
              <span className="truncate">{restaurant.name}</span>
            </span>
            <LanguageSwitcher tone="dark" />
          </div>
        </div>

        {/* persistent worker hint */}
        <div className="border-t border-white/8 bg-white/[0.04]">
          <div className="mx-auto flex w-full max-w-[1600px] items-center gap-2.5 px-4 py-2.5 sm:px-6 lg:px-8">
            <Icon name="info" size={15} className="shrink-0 text-gold" />
            <p className="min-w-0 text-[12.5px] leading-snug text-ivory/65">
              {t('worker.onlyStatus')}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-3">
          {COLUMNS.map((column) => (
            <BoardColumn
              key={column.status}
              status={column.status}
              label={column.label}
              orders={grouped[column.status]}
            />
          ))}
        </div>
      </main>
    </div>
  )
}
