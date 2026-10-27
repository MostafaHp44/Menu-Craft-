import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '../../../shared/i18n'
import { Badge, Button, EmptyState, Field, Input, Modal, Segmented, TextArea } from '../../../shared/ui/ui.tsx'
import { Icon } from '../../../shared/ui/icons.tsx'
import { useOrdersStore } from '../../../shared/store/useOrders.ts'
import { useStore } from '../../../shared/store/useStore.ts'
import { cx, money } from '../../../shared/lib/utils.ts'
import type { OrderLine, Restaurant } from '../../../shared/lib/types.ts'

const ALL = 'all'

export function ManualOrderModal({
  restaurant,
  open,
  onClose,
}: {
  restaurant: Restaurant
  open: boolean
  onClose: () => void
}) {
  const { t } = useI18n()
  const addOrder = useOrdersStore((s) => s.addOrder)
  const showToast = useStore((s) => s.showToast)

  const [table, setTable] = useState('')
  const [customer, setCustomer] = useState('')
  const [note, setNote] = useState('')
  const [query, setQuery] = useState('')
  const [categoryId, setCategoryId] = useState<string>(ALL)
  const [qty, setQty] = useState<Record<string, number>>({})

  // fresh draft every time the composer opens
  useEffect(() => {
    if (!open) return
    setTable('')
    setCustomer('')
    setNote('')
    setQuery('')
    setCategoryId(ALL)
    setQty({})
  }, [open])

  const allItems = useMemo(() => restaurant.menu.flatMap((c) => c.items), [restaurant.menu])

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase()
    return restaurant.menu
      .filter((c) => categoryId === ALL || c.id === categoryId)
      .map((c) => ({
        id: c.id,
        name: c.name,
        items: c.items.filter((i) => !q || i.name.toLowerCase().includes(q)),
      }))
      .filter((c) => c.items.length > 0)
  }, [restaurant.menu, categoryId, query])

  const chosen = allItems.filter((item) => (qty[item.id] ?? 0) > 0)
  const total = chosen.reduce((sum, item) => sum + item.price * (qty[item.id] ?? 0), 0)

  const bump = (id: string, delta: number) =>
    setQty((prev) => {
      const next = Math.max(0, (prev[id] ?? 0) + delta)
      const copy = { ...prev }
      if (next === 0) delete copy[id]
      else copy[id] = next
      return copy
    })

  const submit = () => {
    if (chosen.length === 0) return
    const lines: OrderLine[] = chosen.map((item) => ({
      itemId: item.id,
      name: item.name,
      price: item.price,
      qty: qty[item.id] ?? 0,
    }))
    const order = addOrder({ restaurantId: restaurant.id, channel: 'counter', table, customer, lines, note })
    showToast({
      title: t('toast.created'),
      message: t('orders.orderNo', { no: order.number }),
      tone: 'success',
    })
    onClose()
  }

  const categoryOptions = [
    { value: ALL, label: t('common.all') },
    ...restaurant.menu.map((c) => ({ value: c.id, label: c.name })),
  ]

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('orders.manualOrder')}
      description={t('clientMore.manualHint')}
      size="lg"
      footer={
        <>
          <Button variant="ghost" size="md" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button variant="accent" size="md" icon="check" disabled={chosen.length === 0} onClick={submit}>
            {t('common.add')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('orders.table')}>
            <Input
              value={table}
              onChange={(e) => setTable(e.target.value)}
              placeholder={t('clientMore.tablePh')}
            />
          </Field>
          <Field label={t('orders.customer')}>
            <Input
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder={t('clientMore.customerPh')}
            />
          </Field>
        </div>

        <Field label={t('orders.note')}>
          <TextArea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>

        {/* ---------------------------- item picker ---------------------------- */}
        <div className="rounded-2xl border border-sand bg-cream/50 p-3.5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-[13.5px] font-semibold text-charcoal">{t('clientMore.orderItems')}</h3>
            <span className="text-[12.5px] text-umber">
              {t('clientMore.lineCount', { n: chosen.length })}
            </span>
          </div>
          <p className="mt-1 text-[12px] text-clay">{t('clientMore.addItemsHint')}</p>

          <Input
            type="search"
            aria-label={t('common.search')}
            placeholder={t('menuTab.searchPh')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="mt-3 h-10"
          />

          {categoryOptions.length > 1 ? (
            <div className="-mx-1 mt-3 overflow-x-auto px-1 pb-1 thin-scroll">
              <Segmented
                ariaLabel={t('menuTab.categories')}
                value={categoryId}
                onChange={setCategoryId}
                options={categoryOptions}
              />
            </div>
          ) : null}

          {allItems.length === 0 ? (
            <div className="mt-3">
              <EmptyState icon="utensils" title={t('common.empty')} message={t('clientMore.menuEmpty')} />
            </div>
          ) : sections.length === 0 ? (
            <p className="mt-3 text-[13px] text-umber">{t('menuTab.emptyCategory')}</p>
          ) : (
            <div className="mt-3 space-y-3.5">
              {sections.map((section) => (
                <div key={section.id}>
                  <p className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-clay">
                    {section.name}
                  </p>
                  <ul className="mt-1.5 space-y-1.5">
                    {section.items.map((item) => {
                      const n = qty[item.id] ?? 0
                      return (
                        <li
                          key={item.id}
                          className={cx(
                            'flex items-center gap-3 rounded-xl border border-sand bg-paper px-3 py-2',
                            !item.available && 'opacity-70'
                          )}
                        >
                          <span className="min-w-0 flex-1">
                            <span className="flex min-w-0 items-center gap-2">
                              <span className="truncate text-[13.5px] font-medium text-charcoal">
                                {item.name}
                              </span>
                              {!item.available ? (
                                <Badge tone="outline" className="shrink-0">
                                  {t('common.inactive')}
                                </Badge>
                              ) : null}
                            </span>
                            <span className="mt-0.5 block text-[12.5px] text-umber">
                              {money(item.price)}
                            </span>
                          </span>

                          <span className="flex shrink-0 items-center gap-1.5">
                            {n > 0 ? (
                              <>
                                <button
                                  type="button"
                                  aria-label={t('clientMore.qtyDown')}
                                  onClick={() => bump(item.id, -1)}
                                  className="flex h-10 w-10 items-center justify-center rounded-full border border-sand bg-paper text-espresso transition hover:bg-cream hover:text-charcoal"
                                >
                                  <Icon name="minus" size={16} />
                                </button>
                                <span className="w-5 text-center text-[13.5px] font-semibold text-charcoal">
                                  {n}
                                </span>
                              </>
                            ) : null}
                            <button
                              type="button"
                              aria-label={t('clientMore.qtyUp')}
                              disabled={!item.available}
                              onClick={() => bump(item.id, 1)}
                              className="flex h-10 w-10 items-center justify-center rounded-full bg-charcoal text-ivory transition hover:bg-ink disabled:pointer-events-none disabled:opacity-40"
                            >
                              <Icon name="plus" size={16} />
                            </button>
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* live total */}
          <div className="mt-3.5 flex items-center justify-between gap-3 rounded-xl bg-charcoal px-3.5 py-2.5 text-ivory">
            <span className="text-[12.5px] text-ivory/70">{t('common.total')}</span>
            <span className="text-[16px] font-semibold leading-none">{money(total)}</span>
          </div>
          {chosen.length === 0 ? (
            <p className="mt-2 text-[12px] text-clay">{t('clientMore.noItemsYet')}</p>
          ) : null}
        </div>
      </div>
    </Modal>
  )
}
