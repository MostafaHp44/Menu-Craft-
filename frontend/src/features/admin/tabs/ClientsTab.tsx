import { useMemo, useState } from 'react'
import { Input, StatCard, Badge } from '../../../shared/ui/ui.tsx'
import { DarkEmpty, Panel, PanelHeading } from '../parts.tsx'
import { useAdminData } from '../useAdminData.ts'
import { Icon } from '../../../shared/ui/icons.tsx'

type Row = { id: string; name: string; slug: string; owner_name?: string; owner_email?: string; status?: string; subscription_status?: string; price?: number }

export default function ClientsTab({ onOpenSales }: { onOpenSales: (id: string) => void }) {
  const { data, loading, error } = useAdminData<Row>('/api/platform/admin/clients')
  const [q, setQ] = useState('')
  const rows = useMemo(() =>
    data.filter(x => (x.name + ' ' + x.slug + ' ' + (x.owner_email || '')).toLowerCase().includes(q.toLowerCase())),
  [data, q])

  if (loading) return <Panel>Loading clients…</Panel>
  if (error) return <Panel>Error: {error}</Panel>

  const activeSubs = data.filter(x => ['active', 'trialing'].includes(x.subscription_status || '')).length
  const mrr = data.filter(x => ['active', 'trialing'].includes(x.subscription_status || '')).reduce((n, x) => n + (Number(x.price) || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header strip */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-[#13142b] to-[#1a1540] p-6 sm:p-8">
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-flame/20 blur-[80px]" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-violet-500/20 blur-[80px]" />
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ivory sm:text-3xl">Clients</h1>
            <p className="mt-1 text-sm text-ivory/50">Restaurants, owners, and subscription status.</p>
          </div>
          <div className="flex gap-2">
            <Badge tone="moss">{data.length} Restaurants</Badge>
            <Badge tone="gold">{activeSubs} Active</Badge>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard tone="dark" label="Restaurants" value={String(data.length)} icon="users" />
        <StatCard tone="dark" label="Active Subscriptions" value={String(activeSubs)} icon="card" />
        <StatCard tone="dark" label="MRR" value={`$${mrr.toFixed(0)}`} icon="trendUp" />
      </div>

      {/* Table card */}
      <Panel>
        <PanelHeading
          title="Client Directory"
          description="Search, view status, and open sales for any restaurant."
          actions={
            <div className="relative w-full sm:w-72">
              <Icon name="search" size={14} className="absolute left-3 top-2.5 text-ivory/40" />
              <Input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Search clients…"
                className="pl-9 bg-white/6 border-white/10 text-ivory placeholder:text-ivory/40"
              />
            </div>
          }
        />

        {rows.length ? (
          <div className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-[#0f1220]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-[11px] uppercase tracking-wider text-ivory/40">
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Owner</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Subscription</th>
                  <th className="px-4 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(x => (
                  <tr
                    key={x.id}
                    onClick={() => onOpenSales(x.id)}
                    className="cursor-pointer border-b border-white/5 transition hover:bg-white/5"
                  >
                    <td className="px-4 py-3 align-top">
                      <div className="font-medium text-ivory">{x.name}</div>
                      <div className="text-[11px] text-ivory/40">{x.slug}</div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="text-ivory/90">{x.owner_name || '—'}</div>
                      <div className="text-[11px] text-ivory/40">{x.owner_email || ''}</div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <Badge tone={x.status === 'published' ? 'moss' : x.status === 'draft' ? 'gold' : 'outline'}>
                        {x.status || '—'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <Badge tone={x.subscription_status === 'active' ? 'moss' : x.subscription_status === 'trialing' ? 'gold' : 'rose'}>
                        {x.subscription_status || '—'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right align-top">
                      <button
                        onClick={e => { e.stopPropagation(); onOpenSales(x.id); }}
                        className="rounded-md bg-flame/10 px-2.5 py-1 text-xs font-medium text-flame hover:bg-flame/20 transition"
                      >
                        Sales
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <DarkEmpty title="No clients found" message="Try adjusting your search filter." />
        )}
      </Panel>
    </div>
  )
}
