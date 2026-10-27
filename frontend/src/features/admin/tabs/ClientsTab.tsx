import { useMemo, useState } from 'react'
import { useI18n } from '../../../shared/i18n'
import { Icon } from '../../../shared/ui/icons.tsx'
import { Badge, Button, IconButton, Input, Modal, StatCard } from '../../../shared/ui/ui.tsx'
import { useAuthStore } from '../../../shared/store/useAuth.ts'
import { usePlatformStore } from '../../../shared/store/usePlatform.ts'
import { useStore } from '../../../shared/store/useStore.ts'
import { publicUrl } from '../../../shared/lib/hooks.ts'
import { formatDate, money } from '../../../shared/lib/utils.ts'
import type { Restaurant, UserAccount } from '../../../shared/lib/types.ts'
import { DARK_FIELD, DarkEmpty, DemoNote, Panel, PanelHeading, PlanBadge } from '../parts.tsx'

interface ClientRow {
  restaurant: Restaurant
  owner: UserAccount | null
}

export default function ClientsTab({ onOpenSales }: { onOpenSales: (restaurantId: string) => void }) {
  const { t } = useI18n()
  const restaurants = useStore((s) => s.restaurants)
  const accounts = useAuthStore((s) => s.accounts)
  const updateAccount = useAuthStore((s) => s.updateAccount)
  const subscriptions = usePlatformStore((s) => s.subscriptions)
  const showToast = useStore((s) => s.showToast)

  const [query, setQuery] = useState('')
  const [toDelete, setToDelete] = useState<Restaurant | null>(null)

  const rows = useMemo<ClientRow[]>(() => {
    const q = query.trim().toLowerCase()
    return restaurants
      .map((restaurant) => ({
        restaurant,
        owner: accounts.find((a) => a.restaurantId === restaurant.id && a.role === 'client') ?? null,
      }))
      .filter(({ restaurant, owner }) => {
        if (!q) return true
        return (
          restaurant.name.toLowerCase().includes(q) ||
          restaurant.slug.toLowerCase().includes(q) ||
          (owner?.name.toLowerCase().includes(q) ?? false) ||
          (owner?.email.toLowerCase().includes(q) ?? false)
        )
      })
  }, [restaurants, accounts, query])

  const activeSubs = subscriptions.filter((s) => s.status === 'active' || s.status === 'trialing')
  const mrr = activeSubs.reduce((sum, sub) => sum + sub.price, 0)
  const churn =
    subscriptions.length > 0
      ? (subscriptions.filter((s) => s.status === 'expired').length / subscriptions.length) * 100
      : 0

  const toggleSuspend = (owner: UserAccount) => {
    const next = owner.status === 'suspended' ? 'active' : 'suspended'
    updateAccount(owner.id, (account) => {
      account.status = next
    })
    showToast({
      tone: next === 'suspended' ? 'info' : 'success',
      title: next === 'suspended' ? t('common.suspended') : t('common.active'),
      message:
        next === 'suspended'
          ? t('platformMore.clients.suspendedMsg', { name: owner.name })
          : t('platformMore.clients.activatedMsg', { name: owner.name }),
    })
  }

  /** compose the existing store actions: account + subscription + payments + restaurant */
  const confirmDelete = () => {
    const target = toDelete
    if (!target) return

    const auth = useAuthStore.getState()
    const platform = usePlatformStore.getState()

    platform.cancelSubscription(target.id)
    for (const method of platform.payments[target.id] ?? []) {
      platform.removePayment(target.id, method.id)
    }
    for (const account of auth.accounts.filter((a) => a.restaurantId === target.id)) {
      auth.removeAccount(account.id)
    }

    const app = useStore.getState()
    const remaining = app.restaurants.filter((r) => r.id !== target.id)
    useStore.setState({
      restaurants: remaining,
      activeId: app.activeId === target.id ? (remaining[0]?.id ?? app.activeId) : app.activeId,
      draft: app.draft?.id === target.id ? null : app.draft,
      dirty: app.draft?.id === target.id ? false : app.dirty,
    })
    app.showToast({
      tone: 'info',
      title: t('toast.deleted'),
      message: t('platformMore.clients.deletedMsg', { name: target.name }),
    })
    setToDelete(null)
  }

  const searchInput = (
    <div className="relative w-full sm:max-w-xs">
      <span className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-ivory/40">
        <Icon name="search" size={16} />
      </span>
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('admin.searchClients')}
        aria-label={t('admin.searchClients')}
        className={`${DARK_FIELD} ps-10`}
      />
    </div>
  )

  return (
    <div className="space-y-5">
      {/* KPI strip */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard tone="dark" label={t('admin.totalClients')} value={String(restaurants.length)} icon="users" />
        <StatCard tone="dark" label={t('admin.activeSubs')} value={String(activeSubs.length)} icon="card" />
        <StatCard tone="dark" label={t('admin.mrr')} value={money(mrr)} icon="trendUp" />
        <StatCard tone="dark" label={t('admin.churn')} value={`${churn.toFixed(1)}%`} icon="activity" />
      </div>

      <Panel>
        <PanelHeading
          title={t('admin.clients')}
          description={t('platformMore.clients.subtitle')}
          actions={
            <>
              <Badge tone="gold" icon="alert">
                {t('platformMore.demoBadge')}
              </Badge>
              {searchInput}
            </>
          }
        />

        {rows.length === 0 ? (
          <div className="mt-5">
            <DarkEmpty
              icon="search"
              title={t('platformMore.clients.noResults')}
              message={t('platformMore.clients.noResultsHint')}
              action={
                <Button size="sm" variant="light" onClick={() => setQuery('')}>
                  {t('platformMore.clients.clearSearch')}
                </Button>
              }
            />
          </div>
        ) : (
          <>
            {/* desktop table */}
            <div className="mt-5 hidden md:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-start">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-[0.14em] text-ivory/40">
                      <th className="px-3 py-2.5 font-semibold">{t('admin.clients')}</th>
                      <th className="px-3 py-2.5 font-semibold">{t('platformMore.planLabel')}</th>
                      <th className="px-3 py-2.5 font-semibold">{t('common.status')}</th>
                      <th className="px-3 py-2.5 font-semibold">{t('platformMore.clients.created')}</th>
                      <th className="px-3 py-2.5 text-end font-semibold">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/8">
                    {rows.map(({ restaurant, owner }) => (
                      <tr key={restaurant.id} className="transition hover:bg-white/4">
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/8 text-[12.5px] font-semibold text-ivory/80">
                              {restaurant.name.slice(0, 1)}
                            </span>
                            <div className="min-w-0">
                              <div className="line-clamp-1 text-[13.5px] font-medium text-ivory">
                                {restaurant.name}
                              </div>
                              <div className="line-clamp-1 font-mono text-[11.5px] text-ivory/45">
                                {publicUrl(restaurant.slug)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <PlanBadge plan={restaurant.plan} />
                        </td>
                        <td className="px-3 py-3">
                          <Badge tone={owner?.status === 'suspended' ? 'rose' : 'moss'}>
                            {owner?.status === 'suspended' ? t('common.suspended') : t('common.active')}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 text-[12.5px] text-ivory/55">
                          {owner ? formatDate(owner.createdAt) : '—'}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <IconButton
                              icon="chart"
                              tone="onDark"
                              className="h-10 w-10"
                              label={t('platformMore.clients.viewSales')}
                              onClick={() => onOpenSales(restaurant.id)}
                            />
                            <IconButton
                              icon={owner?.status === 'suspended' ? 'refresh' : 'logout'}
                              tone="onDark"
                              className="h-10 w-10"
                              disabled={!owner}
                              label={
                                owner?.status === 'suspended'
                                  ? t('admin.activateAccount')
                                  : t('admin.suspendAccount')
                              }
                              onClick={() => owner && toggleSuspend(owner)}
                            />
                            <IconButton
                              icon="trash"
                              tone="onDark"
                              className="h-10 w-10"
                              label={t('admin.deleteClient')}
                              onClick={() => setToDelete(restaurant)}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* mobile cards */}
            <div className="mt-5 space-y-3 md:hidden">
              {rows.map(({ restaurant, owner }) => (
                <div
                  key={restaurant.id}
                  className="rounded-2xl border border-white/10 bg-white/4 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="text-[14px] font-semibold text-ivory">{restaurant.name}</h4>
                      <p className="mt-0.5 break-all font-mono text-[11.5px] text-ivory/45">
                        {publicUrl(restaurant.slug)}
                      </p>
                    </div>
                    <PlanBadge plan={restaurant.plan} />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-ivory/55">
                    <Badge tone={owner?.status === 'suspended' ? 'rose' : 'moss'}>
                      {owner?.status === 'suspended' ? t('common.suspended') : t('common.active')}
                    </Badge>
                    <span className="text-ivory/40">
                      {t('platformMore.clients.ownerLabel')}:{' '}
                      {owner ? owner.name : t('platformMore.clients.noOwner')}
                    </span>
                    <span className="text-ivory/40">
                      {t('platformMore.clients.created')}:{' '}
                      {owner ? formatDate(owner.createdAt) : '—'}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      className="h-10"
                      variant="light"
                      icon="chart"
                      onClick={() => onOpenSales(restaurant.id)}
                    >
                      {t('platformMore.clients.viewSales')}
                    </Button>
                    <Button
                      size="sm"
                      className="h-10"
                      variant="light"
                      icon={owner?.status === 'suspended' ? 'refresh' : 'logout'}
                      disabled={!owner}
                      onClick={() => owner && toggleSuspend(owner)}
                    >
                      {owner?.status === 'suspended'
                        ? t('admin.activateAccount')
                        : t('admin.suspendAccount')}
                    </Button>
                    <Button
                      size="sm"
                      className="h-10"
                      variant="danger"
                      icon="trash"
                      onClick={() => setToDelete(restaurant)}
                    >
                      {t('common.delete')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="mt-5">
          <DemoNote>{t('platformMore.clients.urlNote')}</DemoNote>
        </div>
      </Panel>

      {/* delete confirmation */}
      <Modal
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        title={toDelete ? t('platformMore.clients.deleteTitle', { name: toDelete.name }) : ''}
        description={t('platformMore.clients.deleteBody')}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setToDelete(null)}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" icon="trash" onClick={confirmDelete}>
              {t('common.confirm')}
            </Button>
          </>
        }
      >
        <p className="text-[13.5px] leading-relaxed text-espresso">
          {toDelete ? publicUrl(toDelete.slug) : ''}
        </p>
      </Modal>
    </div>
  )
}

