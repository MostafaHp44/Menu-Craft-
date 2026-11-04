import { useMemo, useState } from 'react'
import { Input, Badge } from '../../../shared/ui/ui.tsx'
import { DarkEmpty, Panel, PanelHeading } from '../parts.tsx'
import { useAdminData } from '../useAdminData.ts'
import { Icon } from '../../../shared/ui/icons.tsx'

type Payment = { id: string; restaurant_id: string; amount: number; status: string; payment_method?: string; created_at: string }

export default function PaymentsTab() {
  const { data, loading, error } = useAdminData<Payment>('/api/platform/admin/payments')
  const [q, setQ] = useState('')
  const rows = useMemo(() => data.filter(x => (x.id + ' ' + (x.restaurant_id || '') + ' ' + (x.status || '')).toLowerCase().includes(q.toLowerCase())), [data, q])

  if (loading) return <Panel>Loading payments…</Panel>
  if (error) return <Panel>Error: {error}</Panel>

  return (
    <div className="space-y-6">
      {/* Payment providers */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { name: 'Stripe', icon: 'card', active: true, desc: 'Online cards & wallets' },
          { name: 'PayPal', icon: 'globe', active: false, desc: 'Digital wallet payments' },
          { name: 'Cash', icon: 'banknote', active: true, desc: 'In-person cash handling' },
          { name: 'Card', icon: 'credit', active: false, desc: 'Direct card payments' },
        ].map(p => (
          <div key={p.name} className="rounded-2xl border border-white/10 bg-[#14162f]/90 p-5 shadow-lg backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${p.active ? 'bg-flame text-white' : 'bg-white/10 text-ivory/60'}`}><Icon name={p.icon} size={18} /></div>
              <div><h3 className="text-sm font-bold text-ivory">{p.name}</h3><p className="text-[11px] text-ivory/40">{p.desc}</p></div>
            </div>
            <button disabled onClick={() => alert(p.name + ' — provider configuration endpoint not yet implemented; shown read-only')} className={`w-full rounded-lg py-2 text-xs font-bold transition ${p.active ? 'bg-flame text-white' : 'bg-white/6 text-ivory/60 cursor-not-allowed'}`}>{p.active ? 'Active (read-only)' : 'Enable (DB endpoint needed)'}</button>
          </div>
        ))}
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-[#13142b] to-[#1a1540] p-6 sm:p-8">
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-flame/20 blur-[80px]" />
        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-ivory sm:text-3xl">Payments</h1>
          <p className="mt-1 text-sm text-ivory/50">Real payment records from the platform.</p>
        </div>
      </div>

      <Panel>
        <PanelHeading title="Payment Records" description="Search by ID, restaurant, or status." actions={
          <div className="relative w-full sm:w-72">
            <Icon name="search" size={14} className="absolute left-3 top-2.5 text-ivory/40" />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search payments…" className="pl-9 bg-white/6 border-white/10 text-ivory placeholder:text-ivory/40" />
          </div>
        } />
        {rows.length ? (
          <div className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-[#0f1220]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-[11px] uppercase tracking-wider text-ivory/40">
                  <th className="px-4 py-3 text-left font-medium">ID</th>
                  <th className="px-4 py-3 text-left font-medium">Restaurant</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Method</th>
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(x => (
                  <tr key={x.id} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="px-4 py-3 font-mono text-xs text-ivory/70">{x.id?.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-ivory/90">{x.restaurant_id || '—'}</td>
                    <td className="px-4 py-3 text-right font-mono text-ivory">${Number(x.amount || 0).toFixed(2)}</td>
                    <td className="px-4 py-3"><Badge tone={x.status === 'successful' ? 'moss' : x.status === 'pending' ? 'gold' : x.status === 'failed' ? 'rose' : 'outline'}>{x.status}</Badge></td>
                    <td className="px-4 py-3 text-ivory/70">{x.payment_method || 'cash'}</td>
                    <td className="px-4 py-3 text-ivory/50">{new Date(x.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <DarkEmpty title="No payments" message="No payment records found." />}
      </Panel>
    </div>
  )
}
