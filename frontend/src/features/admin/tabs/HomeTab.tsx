import { useI18n } from '../../../shared/i18n'
import { Badge, StatCard } from '../../../shared/ui/ui.tsx'
import { DarkEmpty, Panel, PanelHeading } from '../parts.tsx'
import { useAdminData } from '../useAdminData.ts'
import { money } from '../../../shared/lib/utils.ts'
import HomeHeroEditor from './HomeHeroEditor.tsx'

type AdminClientRow = {
  id: string
  name: string
  slug: string
  owner_name?: string
  owner_email?: string
  status?: string
  subscription_status?: string
  price?: number
}

export default function HomeTab() {
  const { t } = useI18n()
  const { data: statsArr, loading: statsLoading, error: statsError } = useAdminData<any>('/api/platform/admin/stats')
  const { data: clients, loading: clientsLoading, error: clientsError } = useAdminData<AdminClientRow>('/api/platform/admin/clients')

  const stats = (statsArr?.[0] || {}) as any
  const totalRestaurants = Number(stats.total_restaurants || 0)
  const totalUsers = Number(stats.total_users || 0)
  const activeSubs = Number(stats.active_subscriptions || 0)
  const revenue = Number(stats.total_revenue || 0)

  const activeClients = (clients || []).filter((c) => ['active', 'trialing'].includes(c.subscription_status || ''))

  if (statsLoading) return <Panel>Loading stats…</Panel>
  if (statsError) return <Panel>Error: {statsError}</Panel>
  if (clientsLoading) return <Panel>Loading clients…</Panel>
  if (clientsError) return <Panel>Error: {clientsError}</Panel>

  const title = t('platformMore.dashboard.title')
  const subtitle = t('platformMore.dashboard.subtitle')

  return (
    <div className="space-y-5">
      {/* hero editor — first section of the public home page */}
      <Panel>
        <PanelHeading
          title={t('platformMore.home.heroTitle')}
          description={t('platformMore.home.heroDesc')}
        />
        <div className="mt-5">
          <HomeHeroEditor />
        </div>
      </Panel>

      {/* header strip */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-[#13142b] to-[#1a1540] p-6 sm:p-8">
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-flame/20 blur-[80px]" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-violet-500/20 blur-[80px]" />
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ivory sm:text-3xl">{title}</h1>
            <p className="mt-1 text-sm text-ivory/50">{subtitle}</p>
          </div>
          <div className="flex gap-2">
            <Badge tone="moss">{money(revenue)}</Badge>
          </div>
        </div>
      </div>

      {/* stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard tone="dark" label={t('platformMore.dashboard.restaurants')} value={String(totalRestaurants)} icon="users" />
        <StatCard tone="dark" label={t('platformMore.dashboard.users')} value={String(totalUsers)} icon="users" />
        <StatCard tone="dark" label={t('platformMore.dashboard.subscriptions')} value={String(activeSubs)} icon="card" />
        <StatCard tone="dark" label={t('platformMore.dashboard.revenue')} value={money(revenue)} icon="trendUp" />
      </div>

      {/* active clients */}
      <Panel>
        <PanelHeading
          title={t('platformMore.dashboard.activeClients')}
          description={t('platformMore.dashboard.activeClientsDesc')}
        />

        {activeClients.length ? (
          <div className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-[#0f1220]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-[11px] uppercase tracking-wider text-ivory/40">
                  <th className="px-4 py-3 text-left font-medium">Restaurant</th>
                  <th className="px-4 py-3 text-left font-medium">Owner</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Plan</th>
                </tr>
              </thead>
              <tbody>
                {activeClients.slice(0, 5).map((c) => (
                  <tr key={c.id} className="border-b border-white/5 transition hover:bg-white/5">
                    <td className="px-4 py-3 align-top text-ivory">{c.name}</td>
                    <td className="px-4 py-3 align-top text-ivory/70">{c.owner_name || '—'}</td>
                    <td className="px-4 py-3 align-top text-ivory/70">{c.subscription_status || '—'}</td>
                    <td className="px-4 py-3 align-top text-right text-ivory/90">{money(Number(c.price || 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-4">
            <DarkEmpty title={t('platformMore.dashboard.noClients')} message={t('platformMore.dashboard.noClientsDesc')} />
          </div>
        )}
      </Panel>
    </div>
  )
}
