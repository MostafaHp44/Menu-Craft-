import { AnimatePresence, motion } from 'framer-motion'
import { useI18n } from '../../../shared/i18n'
import { Badge, Button, Card } from '../../../shared/ui/ui.tsx'
import { Icon } from '../../../shared/ui/icons.tsx'
import { money, timeAgo } from '../../../shared/lib/utils.ts'
import type { Order } from '../../../shared/lib/types.ts'
import { STATUS_ICON, STATUS_TONE, statusKey } from './helpers.ts'

export function OrderCard({
  order,
  onAdvance,
  onRemove,
}: {
  order: Order
  onAdvance: (order: Order) => void
  onRemove: (order: Order) => void
}) {
  const { t, lang } = useI18n()
  const isOnline = order.channel === 'online'

  return (
    <Card className="flex h-full flex-col p-4 sm:p-5">
      {/* number · channel · status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h3 className="text-[14.5px] font-semibold tracking-[-0.01em] text-charcoal">
            {t('orders.orderNo', { no: order.number })}
          </h3>
          <Badge tone={isOnline ? 'flame' : 'outline'} icon={isOnline ? 'globe' : 'store'}>
            {isOnline ? t('orders.onlineChannel') : t('orders.counterChannel')}
          </Badge>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={order.status}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.16 }}
            className="shrink-0"
          >
            <Badge tone={STATUS_TONE[order.status]} icon={STATUS_ICON[order.status]}>
              {t(statusKey(order.status, lang))}
            </Badge>
          </motion.span>
        </AnimatePresence>
      </div>

      {/* meta */}
      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12.5px] text-umber">
        <span className="flex items-center gap-1.5">
          <Icon name="mapPin" size={13} className="text-clay" />
          {t('orders.table')} {order.table}
        </span>
        <span className="flex min-w-0 items-center gap-1.5">
          <Icon name="users" size={13} className="text-clay" />
          <span className="truncate">{order.customer}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <Icon name="clock" size={13} className="text-clay" />
          {timeAgo(order.createdAt)}
        </span>
      </div>

      {/* lines */}
      <ul className="mt-3 space-y-1.5 border-t border-sand/70 pt-3">
        {order.lines.map((line) => (
          <li key={line.itemId} className="flex items-center justify-between gap-3 text-[13px]">
            <span className="min-w-0 flex-1 truncate text-espresso">
              {line.name} <span className="text-clay">× {line.qty}</span>
            </span>
            <span className="shrink-0 font-medium text-charcoal">{money(line.price * line.qty)}</span>
          </li>
        ))}
      </ul>

      {/* kitchen note */}
      {order.note ? (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-gold/40 bg-gold/10 px-3 py-2.5">
          <Icon name="info" size={14} className="mt-0.5 shrink-0 text-gold" />
          <div className="min-w-0">
            <p className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-gold">
              {t('orders.note')}
            </p>
            <p className="mt-0.5 break-words text-[13px] leading-snug text-espresso">{order.note}</p>
          </div>
        </div>
      ) : null}

      {/* total + actions */}
      <div className="mt-auto space-y-3 border-t border-sand/70 pt-3.5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-clay">
              {t('common.total')}
            </div>
            <div className="mt-1 text-[19px] font-semibold leading-none tracking-[-0.02em] text-charcoal">
              {money(order.total)}
            </div>
          </div>
          <Button
            variant="ghost"
            size="md"
            icon="trash"
            aria-label={t('clientMore.removeOrder')}
            title={t('clientMore.removeOrder')}
            onClick={() => onRemove(order)}
          />
        </div>

        {order.status === 'served' ? (
          <div className="flex items-center justify-center gap-2 rounded-full bg-moss/10 py-2.5 text-[13px] font-semibold text-moss">
            <Icon name="check" size={15} strokeWidth={2.2} />
            {t('common.done')}
          </div>
        ) : (
          <Button variant="accent" size="md" full icon="arrowRight" onClick={() => onAdvance(order)}>
            {order.status === 'received' ? t('orders.markPreparing') : t('orders.markServed')}
          </Button>
        )}
      </div>
    </Card>
  )
}
