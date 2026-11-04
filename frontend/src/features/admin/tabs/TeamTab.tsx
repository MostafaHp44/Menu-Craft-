import { useMemo, useState } from 'react'
import { Input, Badge } from '../../../shared/ui/ui.tsx'
import { DarkEmpty, Panel, PanelHeading } from '../parts.tsx'
import { useAdminData } from '../useAdminData.ts'
import { Icon } from '../../../shared/ui/icons.tsx'

type User = { id: string; name: string; email: string; role: string; restaurant_id?: string; status: string; created_at: string }

export default function TeamTab() {
  const { data, loading, error } = useAdminData<User>('/api/platform/admin/users')
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<'all' | 'super_admin' | 'client' | 'other'>('all')
  const rows = useMemo(() => {
    let d = data.filter(x => (x.name + ' ' + x.email + ' ' + x.role).toLowerCase().includes(q.toLowerCase()))
    if (filter === 'super_admin') d = d.filter(x => x.role === 'super_admin')
    if (filter === 'client') d = d.filter(x => x.role === 'client')
    if (filter === 'other') d = d.filter(x => x.role !== 'super_admin' && x.role !== 'client')
    return d
  }, [data, q, filter])

  if (loading) return <Panel>Loading users…</Panel>
  if (error) return <Panel>Error: {error}</Panel>

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-[#13142b] to-[#1a1540] p-6 sm:p-8">
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-flame/20 blur-[80px]" />
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ivory sm:text-3xl">Team & Access</h1>
            <p className="mt-1 text-sm text-ivory/50">Platform administrators and staff.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['all','super_admin','client','other'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1 text-xs font-medium transition ${filter===f ? 'bg-flame text-white' : 'bg-white/10 text-ivory/70 hover:bg-white/15'}`}>{f === 'all' ? 'All' : f === 'super_admin' ? 'Super Admin' : f === 'client' ? 'Clients' : 'Others'}</button>
            ))}
          </div>
        </div>
      </div>

      <Panel>
        <PanelHeading title="Admin Users" description="Search and manage platform staff." actions={
          <div className="relative w-full sm:w-72">
            <Icon name="search" size={14} className="absolute left-3 top-2.5 text-ivory/40" />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search users…" className="pl-9 bg-white/6 border-white/10 text-ivory placeholder:text-ivory/40" />
          </div>
        } />
        {rows.length ? (
          <div className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-[#0f1220]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-[11px] uppercase tracking-wider text-ivory/40">
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Email</th>
                  <th className="px-4 py-3 text-left font-medium">Role</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Created</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(x => (
                  <tr key={x.id} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="px-4 py-3 font-medium text-ivory">{x.name}</td>
                    <td className="px-4 py-3 text-ivory/80">{x.email}</td>
                    <td className="px-4 py-3"><Badge tone={x.role==='super_admin'?'flame':'gold'}>{x.role}</Badge></td>
                    <td className="px-4 py-3"><Badge tone={x.status==='active'?'moss':'rose'}>{x.status}</Badge></td>
                    <td className="px-4 py-3 text-ivory/50">{new Date(x.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => alert('Delete action: confirm to remove ' + x.email)} className="text-rose/70 hover:text-rose text-xs font-medium">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <DarkEmpty title="No users found" message="Try adjusting your search or filter." />}
      </Panel>
    </div>
  )
}
