import { useState, useMemo } from 'react'
import { useI18n } from '../../shared/i18n'
import { Button } from '../../shared/ui/ui.tsx'

export default function PlanPopup({ open, onClose, existing, onSave }: { open: boolean; onClose: () => void; existing?: { name: string; price: number; currency: string; interval: string; maxSites: number; maxBranches: number; status: string; features: string[] }; onSave?: (data: { name: string; price: number; interval: string; maxSites: number; maxBranches: number; status: string; features: string[] }) => Promise<void> }) {
  const { t: _t } = useI18n()
  const [name, setName] = useState(existing?.name || '')
  const [price, setPrice] = useState(existing?.price ?? 0)
  const [currency, setCurrency] = useState(existing?.currency || 'USD')
  const [interval, setInterval] = useState(existing?.interval || 'monthly')
  const [maxSites, setMaxSites] = useState(existing?.maxSites ?? 1)
  const [maxBranches, setMaxBranches] = useState(existing?.maxBranches ?? 0)
  const [status, setStatus] = useState(existing?.status || 'active')
  const [features, setFeatures] = useState<string[]>(existing?.features || [])
  const [saving, setSaving] = useState(false)
  const [error] = useState('')

  const featureOptions = ['Website', 'Branches', 'Orders', 'Support', 'Analytics']

  const summary = useMemo(() => ({
    name: name || 'New plan',
    price: price ? `${price} ${currency}` : '-',
    interval,
    sites: maxSites === 0 ? 'Unlimited' : String(maxSites),
    branches: maxBranches === 0 ? 'Unlimited' : String(maxBranches),
    status,
  }), [name, price, currency, interval, maxSites, maxBranches, status])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg mx-auto bg-[#1a1a2e] text-ivory rounded-2xl shadow-2xl border border-white/10 max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 md:p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{existing ? 'Edit Plan' : 'Create Plan'}</h2>
            <p className="text-sm text-ivory/60 mt-1">Configure subscription package details.</p>
          </div>

          {/* Section 1 */}
          <section>
            <h3 className="text-xs uppercase tracking-widest text-ivory/40 mb-3">Basic Information</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs mb-1">Plan name <span className="text-red-400">*</span></label>
                <input className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs mb-1">Status</label>
                <select className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm" value={status} onChange={e => setStatus(e.target.value)}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <h3 className="text-xs uppercase tracking-widest text-ivory/40 mb-3">Pricing & Billing</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs mb-1">Price <span className="text-red-400">*</span></label>
                <input type="number" className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm" value={price} onChange={e => setPrice(Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-xs mb-1">Currency</label>
                <select className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm" value={currency} onChange={e => setCurrency(e.target.value)}>
                  <option>USD</option><option>EUR</option><option>SAR</option>
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1">Interval</label>
                <select className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm" value={interval} onChange={e => setInterval(e.target.value)}>
                  <option value="monthly">Monthly</option><option value="yearly">Yearly</option><option value="one-time">One-time</option>
                </select>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h3 className="text-xs uppercase tracking-widest text-ivory/40 mb-3">Usage Limits</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs mb-1">Max websites <span className="text-ivory/40">(0 = unlimited)</span></label>
                <input type="number" className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm" value={maxSites} onChange={e => setMaxSites(Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-xs mb-1">Max branches <span className="text-ivory/40">(0 = unlimited)</span></label>
                <input type="number" className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm" value={maxBranches} onChange={e => setMaxBranches(Number(e.target.value))} />
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h3 className="text-xs uppercase tracking-widest text-ivory/40 mb-3">Features</h3>
            <div className="flex flex-wrap gap-2">
              {featureOptions.map(f => (
                <button key={f} onClick={() => setFeatures(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f])} className={`px-3 py-1.5 rounded-full text-xs border ${features.includes(f) ? 'bg-white/10 border-white/30 text-white' : 'bg-transparent border-white/10 text-ivory/50'}`}>
                  {f}
                </button>
              ))}
            </div>
          </section>

          {/* Section 5 Review */}
          <section className="bg-white/5 rounded-xl p-4 border border-white/5">
            <h3 className="text-xs uppercase tracking-widest text-ivory/40 mb-3">Review</h3>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <div><span className="text-ivory/40">Name:</span> <span className="font-medium ml-2">{summary.name}</span></div>
              <div><span className="text-ivory/40">Price:</span> <span className="font-medium ml-2">{summary.price}</span></div>
              <div><span className="text-ivory/40">Interval:</span> <span className="font-medium ml-2">{summary.interval}</span></div>
              <div><span className="text-ivory/40">Sites:</span> <span className="font-medium ml-2">{summary.sites}</span></div>
              <div><span className="text-ivory/40">Branches:</span> <span className="font-medium ml-2">{summary.branches}</span></div>
              <div><span className="text-ivory/40">Status:</span> <span className="font-medium ml-2">{summary.status}</span></div>
              <div className="md:col-span-2"><span className="text-ivory/40">Features:</span> <span className="ml-2">{features.length ? features.join(', ') : 'None'}</span></div>
            </div>
          </section>

          {error && <div className="text-red-400 text-sm">{error}</div>}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button onClick={onClose} variant="outline">Cancel</Button>
            <Button onClick={() => { if (onSave) { setSaving(true); onSave({ name, price, interval, maxSites, maxBranches, status, features }).then(() => { setSaving(false); onClose(); }).catch(() => setSaving(false)); } else { setSaving(true); setTimeout(() => { setSaving(false); onClose(); }, 800); } }} disabled={saving || !name}>{saving ? 'Saving...' : 'Save Plan'}</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
